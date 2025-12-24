import { SupabaseClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { ProcessingJob, OcrResult, ExtractionResult } from '../types'

// Gemini configuration from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Document types and their characteristics for classification
const DOCUMENT_TYPE_DEFINITIONS = {
  cnh: {
    name: 'CNH (Carteira Nacional de Habilitação)',
    description: 'Brazilian driver\'s license',
    keywords: ['CNH', 'CARTEIRA NACIONAL DE HABILITAÇÃO', 'DETRAN', 'CATEGORIA', 'ACC', 'HABILITAÇÃO', 'CONDUTOR', 'PERMISSÃO PARA DIRIGIR', '1ª HABILITAÇÃO', 'REGISTRO NACIONAL', 'ESPELHO'],
    patterns: ['categoria [A-E]+', 'registro nacional', 'data de emissão', 'validade', 'nº registro'],
  },
  rg: {
    name: 'RG (Registro Geral)',
    description: 'Brazilian identity card',
    keywords: ['REGISTRO GERAL', 'RG', 'CARTEIRA DE IDENTIDADE', 'INSTITUTO DE IDENTIFICAÇÃO', 'SSP', 'SECRETARIA DE SEGURANÇA PÚBLICA', 'FILIAÇÃO', 'NATURALIDADE', 'DATA DE NASCIMENTO'],
    patterns: ['rg[:\\s]*\\d', 'órgão expedidor', 'data de expedição', 'naturalidade'],
  },
  marriage_cert: {
    name: 'Certidão de Casamento',
    description: 'Marriage certificate',
    keywords: ['CERTIDÃO DE CASAMENTO', 'REGISTRO CIVIL', 'CASAMENTO', 'CÔNJUGE', 'REGIME DE BENS', 'MATRIMÔNIO', 'NUBENTES', 'CASADOS', 'CELEBRAÇÃO', 'OFICIAL DE REGISTRO CIVIL'],
    patterns: ['regime de (comunhão|separação|bens)', 'contraíram matrimônio', 'data do casamento', 'livro [A-Z]'],
  },
  deed: {
    name: 'Escritura',
    description: 'Property deed or notarized document',
    keywords: ['ESCRITURA', 'TABELIÃO', 'TABELIONATO', 'CARTÓRIO', 'NOTAS', 'COMPRA E VENDA', 'TRANSMISSÃO', 'IMÓVEL', 'OUTORGANTE', 'OUTORGADO', 'LAVRADA', 'TRANSLADO'],
    patterns: ['tabelião de notas', 'cartório', 'escritura pública', 'lavrada', 'livro de notas'],
  },
  proxy: {
    name: 'Procuração',
    description: 'Power of attorney',
    keywords: ['PROCURAÇÃO', 'OUTORGANTE', 'OUTORGADO', 'PODERES', 'MANDATO', 'SUBSTABELECER', 'PROCURADOR', 'REPRESENTAR', 'AMPLOS PODERES', 'FORO'],
    patterns: ['poderes (especiais|gerais)', 'substabelecer', 'procurador', 'mandato'],
  },
  iptu: {
    name: 'IPTU',
    description: 'Property tax document',
    keywords: ['IPTU', 'IMPOSTO PREDIAL', 'TERRITORIAL URBANO', 'PREFEITURA', 'CONTRIBUINTE', 'INSCRIÇÃO IMOBILIÁRIA', 'VALOR VENAL', 'LANÇAMENTO', 'CARNÊ'],
    patterns: ['inscrição imobiliária', 'valor venal', 'imposto (predial|territorial)', 'exercício \\d{4}'],
  },
  birth_cert: {
    name: 'Certidão de Nascimento',
    description: 'Birth certificate',
    keywords: ['CERTIDÃO DE NASCIMENTO', 'REGISTRO CIVIL', 'NASCIMENTO', 'NASCEU', 'GENITORES', 'PAIS', 'AVÓS', 'MATERNIDADE', 'OFICIAL DE REGISTRO CIVIL'],
    patterns: ['certidão de nascimento', 'nasceu', 'genitores', 'às \\d+ horas'],
  },
}

// Initialize Gemini client
let geminiClient: GoogleGenerativeAI | null = null
let geminiModel: GenerativeModel | null = null

function getGeminiClient(): { client: GoogleGenerativeAI; model: GenerativeModel } {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY)
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  return { client: geminiClient, model: geminiModel! }
}

/**
 * Analyze text using keyword and pattern matching for initial classification
 */
function analyzeTextPatterns(text: string): { type: string; confidence: number }[] {
  const normalizedText = text.toUpperCase()
  const results: { type: string; confidence: number; score: number }[] = []

  for (const [type, definition] of Object.entries(DOCUMENT_TYPE_DEFINITIONS)) {
    let score = 0
    let maxPossibleScore = 0

    // Check keywords (each keyword found adds to score)
    for (const keyword of definition.keywords) {
      maxPossibleScore += 1
      if (normalizedText.includes(keyword.toUpperCase())) {
        score += 1
      }
    }

    // Check patterns (each pattern match adds to score)
    for (const pattern of definition.patterns) {
      maxPossibleScore += 1.5 // Patterns are weighted slightly more
      try {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(text)) {
          score += 1.5
        }
      } catch {
        // Invalid regex pattern, skip
      }
    }

    if (score > 0) {
      const confidence = Math.min(score / maxPossibleScore, 1)
      results.push({ type, confidence, score })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results.map(({ type, confidence }) => ({ type, confidence }))
}

/**
 * Use Gemini to classify document type with higher accuracy
 */
async function classifyWithGemini(
  text: string,
  documentBuffer: Buffer | null,
  mimeType: string
): Promise<{ type: string; confidence: number; extractedData: Record<string, unknown>; notes: string[] }> {
  const { model } = getGeminiClient()

  const documentTypesDescription = Object.entries(DOCUMENT_TYPE_DEFINITIONS)
    .map(([type, def]) => `- ${type}: ${def.name} (${def.description})`)
    .join('\n')

  const textSample = text.substring(0, 8000)
  const prompt = `You are a Brazilian document classification expert. Analyze the provided document and classify it into one of the following types:

${documentTypesDescription}
- other: Any other document type not listed above

Based on the document content, provide:
1. The document type (one of: cnh, rg, marriage_cert, deed, proxy, iptu, birth_cert, other)
2. A confidence score between 0 and 1 (1 being absolutely certain)
3. Key extracted data relevant to the document type
4. Any notes or observations about the document

Document OCR Text:
---
${textSample}
---

Respond in the following JSON format only (no markdown, no code blocks):
{
  "document_type": "string",
  "confidence": number,
  "extracted_data": {
    // Key-value pairs of relevant extracted information
  },
  "notes": ["array of observations"]
}

Be precise in your classification. Look for specific identifiers, headers, and official document markers.`

  try {
    // If we have the document image, include it for better classification
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: prompt }]

    if (documentBuffer && mimeType.startsWith('image/')) {
      parts.unshift({
        inlineData: {
          data: documentBuffer.toString('base64'),
          mimeType: mimeType,
        },
      })
    }

    const result = await model.generateContent(parts)
    const response = await result.response
    const responseText = response.text()

    // Parse the JSON response
    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    const codeBlockPattern = /^```(?:json)?\s*/
    const codeBlockEndPattern = /\s*```$/
    if (codeBlockPattern.test(cleanedResponse)) {
      cleanedResponse = cleanedResponse.replace(codeBlockPattern, '').replace(codeBlockEndPattern, '')
    }

    const parsed = JSON.parse(cleanedResponse)

    return {
      type: parsed.document_type || 'other',
      confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      extractedData: parsed.extracted_data || {},
      notes: parsed.notes || [],
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

/**
 * Download document from Supabase Storage
 */
async function downloadDocument(
  supabase: SupabaseClient,
  storagePath: string
): Promise<{ content: Buffer; mimeType: string } | null> {
  try {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL:', signedUrlError?.message)
      return null
    }

    const response = await fetch(signedUrlData.signedUrl)
    if (!response.ok) {
      console.error('Failed to download document:', response.statusText)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const content = Buffer.from(arrayBuffer)
    let mimeType = response.headers.get('content-type') || 'application/octet-stream'

    // Infer MIME type from extension if generic
    if (mimeType === 'application/octet-stream') {
      const extension = storagePath.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        tiff: 'image/tiff',
        tif: 'image/tiff',
        webp: 'image/webp',
      }
      mimeType = mimeTypes[extension || ''] || mimeType
    }

    return { content, mimeType }
  } catch (error) {
    console.error('Error downloading document:', error)
    return null
  }
}

/**
 * Run extraction job with document type auto-detection
 */
export async function runExtractionJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running extraction job for document ${job.document_id}`)

  if (!job.document_id) {
    throw new Error('No document_id provided for extraction job')
  }

  // 1. Get document metadata
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', job.document_id)
    .single()

  if (docError || !document) {
    throw new Error(`Failed to fetch document: ${docError?.message || 'Document not found'}`)
  }

  // 2. Get existing extraction with OCR result
  const { data: extraction, error: extractionError } = await supabase
    .from('extractions')
    .select('*')
    .eq('document_id', job.document_id)
    .single()

  if (extractionError && extractionError.code !== 'PGRST116') {
    console.error('Error fetching extraction:', extractionError)
  }

  const ocrResult: OcrResult | null = extraction?.ocr_result as OcrResult | null

  if (!ocrResult || !ocrResult.text) {
    console.log('No OCR result found, attempting pattern-based classification from filename')

    // Fallback: Try to classify based on filename
    const filename = document.original_name?.toLowerCase() || ''
    let fallbackType = 'other'
    let fallbackConfidence = 0.3

    if (filename.includes('cnh') || filename.includes('habilitacao')) {
      fallbackType = 'cnh'
      fallbackConfidence = 0.5
    } else if (filename.includes('rg') || filename.includes('identidade')) {
      fallbackType = 'rg'
      fallbackConfidence = 0.5
    } else if (filename.includes('casamento') || filename.includes('marriage')) {
      fallbackType = 'marriage_cert'
      fallbackConfidence = 0.5
    } else if (filename.includes('escritura') || filename.includes('deed')) {
      fallbackType = 'deed'
      fallbackConfidence = 0.5
    } else if (filename.includes('procuracao') || filename.includes('proxy')) {
      fallbackType = 'proxy'
      fallbackConfidence = 0.5
    } else if (filename.includes('iptu')) {
      fallbackType = 'iptu'
      fallbackConfidence = 0.5
    } else if (filename.includes('nascimento') || filename.includes('birth')) {
      fallbackType = 'birth_cert'
      fallbackConfidence = 0.5
    }

    // Update document with fallback classification
    await supabase
      .from('documents')
      .update({
        doc_type: fallbackType,
        doc_type_confidence: fallbackConfidence,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.document_id)

    return {
      status: 'completed',
      document_type: fallbackType,
      extracted_data: {},
      confidence: fallbackConfidence,
      notes: ['Classification based on filename only - OCR result not available'],
    }
  }

  // 3. First pass: Pattern-based classification
  console.log('Analyzing document patterns...')
  const patternResults = analyzeTextPatterns(ocrResult.text)
  console.log('Pattern analysis results:', patternResults.slice(0, 3))

  let finalType = 'other'
  let finalConfidence = 0
  let extractedData: Record<string, unknown> = {}
  let notes: string[] = []

  // 4. If pattern matching is confident enough, use it
  if (patternResults.length > 0 && patternResults[0].confidence > 0.6) {
    finalType = patternResults[0].type
    finalConfidence = patternResults[0].confidence
    notes.push('Classification based on keyword and pattern matching')
  }

  // 5. Use Gemini for more accurate classification
  if (GEMINI_API_KEY) {
    console.log('Using Gemini for enhanced classification...')
    try {
      // Download document for multimodal analysis if it's an image
      const documentFile = await downloadDocument(supabase, document.storage_path)

      const geminiResult = await classifyWithGemini(
        ocrResult.text,
        documentFile?.content || null,
        documentFile?.mimeType || 'application/pdf'
      )

      console.log('Gemini classification result:', geminiResult.type, 'confidence:', geminiResult.confidence)

      // Gemini result takes precedence if it's more confident
      if (geminiResult.confidence > finalConfidence) {
        finalType = geminiResult.type
        finalConfidence = geminiResult.confidence
        extractedData = geminiResult.extractedData
        notes = geminiResult.notes
      } else if (geminiResult.type === finalType) {
        // If both agree, boost confidence
        finalConfidence = Math.min((finalConfidence + geminiResult.confidence) / 2 + 0.1, 1)
        extractedData = geminiResult.extractedData
        notes = [...notes, ...geminiResult.notes]
      }
    } catch (error) {
      console.error('Gemini classification failed, using pattern matching:', error)
      notes.push('Gemini classification failed, using pattern matching only')
    }
  } else {
    console.log('GEMINI_API_KEY not configured, using pattern matching only')
    notes.push('AI classification not available - using pattern matching only')
  }

  // 6. Create extraction result
  const extractionResult: ExtractionResult = {
    document_type: finalType,
    extracted_data: extractedData,
    confidence: finalConfidence,
    notes,
  }

  // 7. Update or create extraction record with LLM result
  if (extraction) {
    await supabase
      .from('extractions')
      .update({
        llm_result: extractionResult as unknown as Record<string, unknown>,
      })
      .eq('id', extraction.id)
  } else {
    await supabase
      .from('extractions')
      .insert({
        document_id: job.document_id,
        llm_result: extractionResult as unknown as Record<string, unknown>,
        pending_fields: [],
      })
  }

  // 8. Update document with detected type and confidence
  await supabase
    .from('documents')
    .update({
      doc_type: finalType,
      doc_type_confidence: finalConfidence,
      status: 'processed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.document_id)

  console.log(`Extraction job completed for document ${job.document_id}: type=${finalType}, confidence=${finalConfidence}`)

  return {
    status: 'completed',
    document_type: finalType,
    extracted_data: extractedData,
    confidence: finalConfidence,
    notes,
  }
}
