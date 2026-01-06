import 'dotenv/config'
import { SupabaseClient } from '@supabase/supabase-js'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { ProcessingJob, OcrResult, OcrBlock, BoundingBox, ExtractionResult } from '../types'

// Gemini configuration for parallel extraction
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

let geminiClient: GoogleGenerativeAI | null = null
let geminiModel: GenerativeModel | null = null

function getGeminiClient(): { client: GoogleGenerativeAI; model: GenerativeModel } | null {
  if (!GEMINI_API_KEY) {
    return null
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY)
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-3-flash-preview' })
  }

  return { client: geminiClient, model: geminiModel! }
}

// Document types for classification
const DOCUMENT_TYPES = ['cnh', 'rg', 'marriage_cert', 'deed', 'proxy', 'iptu', 'birth_cert', 'other']

// Document AI configuration - read lazily to ensure dotenv is loaded
function getDocumentAIConfig() {
  const config = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_PROJECT_ID,
    processorId: process.env.GOOGLE_CLOUD_PROCESSOR_ID || process.env.DOCUMENT_AI_PROCESSOR_ID,
    location: process.env.GOOGLE_CLOUD_LOCATION || process.env.DOCUMENT_AI_LOCATION || 'us'
  }
  console.log('[OCR] Document AI Config:', JSON.stringify(config))
  return config
}

// Keep these for backwards compatibility but they will be lazily evaluated
const GOOGLE_PROJECT_ID = null // Deprecated - use getDocumentAIConfig()
const DOCUMENT_AI_PROCESSOR_ID = null // Deprecated - use getDocumentAIConfig()
const DOCUMENT_AI_LOCATION = 'us' // Default fallback

// Initialize Document AI client
let documentAiClient: DocumentProcessorServiceClient | null = null

function getDocumentAiClient(): DocumentProcessorServiceClient {
  if (!documentAiClient) {
    documentAiClient = new DocumentProcessorServiceClient()
  }
  return documentAiClient
}

/**
 * Get the full processor name for Document AI
 */
function getProcessorName(): string {
  const config = getDocumentAIConfig()
  if (!config.projectId || !config.processorId) {
    throw new Error('Missing Document AI configuration. Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_PROCESSOR_ID environment variables.')
  }
  return `projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`
}

/**
 * Download document from Supabase Storage
 */
async function downloadDocument(
  supabase: SupabaseClient,
  storagePath: string
): Promise<{ content: Buffer; mimeType: string }> {
  // Create a signed URL to download the document
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1 hour expiration

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`)
  }

  // Download the document
  const response = await fetch(signedUrlData.signedUrl)
  if (!response.ok) {
    throw new Error(`Failed to download document: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const content = Buffer.from(arrayBuffer)

  // Determine MIME type from Content-Type header or file extension
  let mimeType = response.headers.get('content-type') || 'application/octet-stream'

  // If the MIME type is generic, try to infer from file extension
  if (mimeType === 'application/octet-stream') {
    const extension = storagePath.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        mimeType = 'application/pdf'
        break
      case 'png':
        mimeType = 'image/png'
        break
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg'
        break
      case 'tiff':
      case 'tif':
        mimeType = 'image/tiff'
        break
      case 'gif':
        mimeType = 'image/gif'
        break
      case 'webp':
        mimeType = 'image/webp'
        break
      default:
        mimeType = 'application/pdf' // Default to PDF
    }
  }

  return { content, mimeType }
}

/**
 * Run Gemini extraction in parallel with OCR
 * This sends the image directly to Gemini for multimodal analysis
 */
async function runGeminiExtractionParallel(
  documentBuffer: Buffer,
  mimeType: string
): Promise<ExtractionResult | null> {
  const gemini = getGeminiClient()
  if (!gemini) {
    console.log('[OCR+Gemini] Gemini not configured, skipping parallel extraction')
    return null
  }

  const prompt = `You are a Brazilian document classification and data extraction expert.
Analyze this document image and extract all relevant information.

Classify the document as one of: cnh (driver's license), rg (ID card), marriage_cert, deed (escritura), proxy (procuração), iptu (property tax), birth_cert, or other.

Extract all relevant data including:
- For people: name, CPF, RG, birth date, nationality, marital status, profession, address
- For properties: registration number, address, area, description
- For certificates: issuing authority, date, registration number

Respond ONLY in valid JSON format (no markdown code blocks):
{
  "document_type": "string (one of: ${DOCUMENT_TYPES.join(', ')})",
  "confidence": number (0-1),
  "extracted_data": {
    // Key-value pairs of all extracted information in Portuguese
  },
  "people": [
    {
      "name": "string",
      "cpf": "string or null",
      "rg": "string or null",
      "birth_date": "string or null",
      "nationality": "string or null",
      "marital_status": "string or null",
      "profession": "string or null",
      "address": "string or null"
    }
  ],
  "properties": [
    {
      "registration_number": "string or null",
      "address": "string or null",
      "area": "string or null",
      "description": "string or null"
    }
  ],
  "notes": ["array of observations about the document"]
}`

  try {
    console.log('[OCR+Gemini] Starting parallel Gemini extraction...')
    const startTime = Date.now()

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      {
        inlineData: {
          data: documentBuffer.toString('base64'),
          mimeType: mimeType,
        },
      },
      { text: prompt }
    ]

    const result = await gemini.model.generateContent(parts)
    const response = await result.response
    const responseText = response.text()

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    const codeBlockPattern = /^```(?:json)?\s*/
    const codeBlockEndPattern = /\s*```$/
    if (codeBlockPattern.test(cleanedResponse)) {
      cleanedResponse = cleanedResponse.replace(codeBlockPattern, '').replace(codeBlockEndPattern, '')
    }

    const parsed = JSON.parse(cleanedResponse)
    const elapsed = Date.now() - startTime

    console.log(`[OCR+Gemini] Gemini extraction completed in ${elapsed}ms - type: ${parsed.document_type}, confidence: ${parsed.confidence}`)

    return {
      document_type: parsed.document_type || 'other',
      extracted_data: {
        ...parsed.extracted_data,
        people: parsed.people || [],
        properties: parsed.properties || [],
      },
      confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      notes: parsed.notes || [],
    }
  } catch (error) {
    console.error('[OCR+Gemini] Gemini extraction failed:', error)
    return null
  }
}

/**
 * Convert Document AI bounding box vertices to our format
 */
function convertBoundingBox(
  vertices: Array<{ x?: number | null; y?: number | null }> | undefined | null,
  pageWidth: number,
  pageHeight: number
): BoundingBox {
  if (!vertices || vertices.length < 4) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // Vertices are in normalized coordinates (0-1), convert to pixels
  const x = (vertices[0].x || 0) * pageWidth
  const y = (vertices[0].y || 0) * pageHeight
  const width = ((vertices[2].x || 0) - (vertices[0].x || 0)) * pageWidth
  const height = ((vertices[2].y || 0) - (vertices[0].y || 0)) * pageHeight

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

/**
 * Process Document AI response and extract OCR results
 */
function processDocumentAiResponse(
  document: {
    text?: string | null
    pages?: Array<{
      pageNumber?: number | null
      dimension?: { width?: number | null; height?: number | null } | null
      paragraphs?: Array<{
        layout?: {
          textAnchor?: { textSegments?: Array<{ startIndex?: string | null; endIndex?: string | null }> | null } | null
          confidence?: number | null
          boundingPoly?: { normalizedVertices?: Array<{ x?: number | null; y?: number | null }> | null } | null
        } | null
      }> | null
      lines?: Array<{
        layout?: {
          textAnchor?: { textSegments?: Array<{ startIndex?: string | null; endIndex?: string | null }> | null } | null
          confidence?: number | null
          boundingPoly?: { normalizedVertices?: Array<{ x?: number | null; y?: number | null }> | null } | null
        } | null
      }> | null
      tokens?: Array<{
        layout?: {
          textAnchor?: { textSegments?: Array<{ startIndex?: string | null; endIndex?: string | null }> | null } | null
          confidence?: number | null
          boundingPoly?: { normalizedVertices?: Array<{ x?: number | null; y?: number | null }> | null } | null
        } | null
      }> | null
      detectedLanguages?: Array<{ languageCode?: string | null; confidence?: number | null }> | null
    }> | null
  }
): OcrResult {
  const fullText = document.text || ''
  const blocks: OcrBlock[] = []
  let totalConfidence = 0
  let confidenceCount = 0
  let detectedLanguage = 'pt' // Default to Portuguese

  // Process each page
  const pages = document.pages || []

  for (const page of pages) {
    const pageNumber = page.pageNumber || 1
    const pageWidth = page.dimension?.width || 1000
    const pageHeight = page.dimension?.height || 1000

    // Extract detected language from the first page
    if (page.detectedLanguages && page.detectedLanguages.length > 0) {
      const topLanguage = page.detectedLanguages.reduce((prev, curr) =>
        (curr.confidence || 0) > (prev.confidence || 0) ? curr : prev
      )
      if (topLanguage.languageCode) {
        detectedLanguage = topLanguage.languageCode
      }
    }

    // Process paragraphs
    if (page.paragraphs) {
      for (const paragraph of page.paragraphs) {
        const layout = paragraph.layout
        if (!layout) continue

        const textSegments = layout.textAnchor?.textSegments || []
        let paragraphText = ''

        for (const segment of textSegments) {
          const startIndex = parseInt(segment.startIndex || '0', 10)
          const endIndex = parseInt(segment.endIndex || '0', 10)
          paragraphText += fullText.substring(startIndex, endIndex)
        }

        if (paragraphText.trim()) {
          const confidence = layout.confidence || 0.9
          totalConfidence += confidence
          confidenceCount++

          blocks.push({
            text: paragraphText.trim(),
            type: 'paragraph',
            confidence,
            bounding_box: convertBoundingBox(
              layout.boundingPoly?.normalizedVertices || [],
              pageWidth,
              pageHeight
            ),
            page: pageNumber,
          })
        }
      }
    }

    // Process lines
    if (page.lines) {
      for (const line of page.lines) {
        const layout = line.layout
        if (!layout) continue

        const textSegments = layout.textAnchor?.textSegments || []
        let lineText = ''

        for (const segment of textSegments) {
          const startIndex = parseInt(segment.startIndex || '0', 10)
          const endIndex = parseInt(segment.endIndex || '0', 10)
          lineText += fullText.substring(startIndex, endIndex)
        }

        if (lineText.trim()) {
          const confidence = layout.confidence || 0.9
          totalConfidence += confidence
          confidenceCount++

          blocks.push({
            text: lineText.trim(),
            type: 'line',
            confidence,
            bounding_box: convertBoundingBox(
              layout.boundingPoly?.normalizedVertices || [],
              pageWidth,
              pageHeight
            ),
            page: pageNumber,
          })
        }
      }
    }

    // Process tokens (words)
    if (page.tokens) {
      for (const token of page.tokens) {
        const layout = token.layout
        if (!layout) continue

        const textSegments = layout.textAnchor?.textSegments || []
        let tokenText = ''

        for (const segment of textSegments) {
          const startIndex = parseInt(segment.startIndex || '0', 10)
          const endIndex = parseInt(segment.endIndex || '0', 10)
          tokenText += fullText.substring(startIndex, endIndex)
        }

        if (tokenText.trim()) {
          const confidence = layout.confidence || 0.9

          blocks.push({
            text: tokenText.trim(),
            type: 'word',
            confidence,
            bounding_box: convertBoundingBox(
              layout.boundingPoly?.normalizedVertices || [],
              pageWidth,
              pageHeight
            ),
            page: pageNumber,
          })
        }
      }
    }
  }

  const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.9

  return {
    text: fullText,
    blocks,
    confidence: averageConfidence,
    language: detectedLanguage,
  }
}

/**
 * Run OCR job using Google Document AI + Gemini in PARALLEL
 * This significantly speeds up processing by running OCR and LLM extraction simultaneously
 */
export async function runOcrJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`[OCR+Gemini] Running PARALLEL OCR job for document ${job.document_id}`)
  const jobStartTime = Date.now()

  if (!job.document_id) {
    throw new Error('No document_id provided for OCR job')
  }

  // 1. Get document metadata from database
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', job.document_id)
    .single()

  if (docError || !document) {
    throw new Error(`Failed to fetch document: ${docError?.message || 'Document not found'}`)
  }

  // Update document status to processing
  await supabase
    .from('documents')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.document_id)

  try {
    // 2. Download document from Supabase Storage (once, for both OCR and Gemini)
    console.log(`[OCR+Gemini] Downloading document from storage: ${document.storage_path}`)
    const { content, mimeType } = await downloadDocument(supabase, document.storage_path)
    console.log(`[OCR+Gemini] Downloaded document: ${content.length} bytes, MIME type: ${mimeType}`)

    // 3. Run OCR and Gemini extraction IN PARALLEL for maximum speed
    console.log('[OCR+Gemini] Starting PARALLEL processing: Document AI + Gemini...')
    const parallelStartTime = Date.now()

    // Prepare Document AI OCR promise
    const ocrPromise = (async () => {
      try {
        const client = getDocumentAiClient()
        const processorName = getProcessorName()
        const [result] = await client.processDocument({
          name: processorName,
          rawDocument: {
            content: content.toString('base64'),
            mimeType: mimeType,
          },
        })
        return result
      } catch (error) {
        console.error('[OCR+Gemini] Document AI OCR failed:', error)
        return null
      }
    })()

    // Prepare Gemini extraction promise (runs in parallel)
    const geminiPromise = runGeminiExtractionParallel(content, mimeType)

    // Wait for both to complete in parallel
    const [ocrDocumentResult, geminiResult] = await Promise.all([ocrPromise, geminiPromise])

    const parallelElapsed = Date.now() - parallelStartTime
    console.log(`[OCR+Gemini] Parallel processing completed in ${parallelElapsed}ms`)

    // 4. Process OCR results
    let ocrResult: OcrResult | null = null
    let pageCount = 1

    if (ocrDocumentResult?.document) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ocrResult = processDocumentAiResponse(ocrDocumentResult.document as any)
      pageCount = ocrDocumentResult.document.pages?.length || 1
      console.log(`[OCR+Gemini] OCR: ${ocrResult.blocks.length} blocks, confidence: ${ocrResult.confidence.toFixed(2)}`)
    } else {
      console.warn('[OCR+Gemini] Document AI OCR returned no results')
    }

    // 5. Determine document type and extracted data (prefer Gemini if available)
    let docType = 'other'
    let docTypeConfidence = 0.5
    let extractedData: Record<string, unknown> = {}

    if (geminiResult) {
      docType = geminiResult.document_type
      docTypeConfidence = geminiResult.confidence
      extractedData = geminiResult.extracted_data
      console.log(`[OCR+Gemini] Gemini: type=${docType}, confidence=${docTypeConfidence}`)
    }

    // 6. Save extraction results
    const { data: existingExtraction } = await supabase
      .from('extractions')
      .select('id')
      .eq('document_id', job.document_id)
      .single()

    const extractionRecord = {
      ocr_result: ocrResult ? (ocrResult as unknown as Record<string, unknown>) : null,
      llm_result: geminiResult ? (geminiResult as unknown as Record<string, unknown>) : null,
    }

    if (existingExtraction) {
      await supabase
        .from('extractions')
        .update(extractionRecord)
        .eq('id', existingExtraction.id)
    } else {
      await supabase
        .from('extractions')
        .insert({
          document_id: job.document_id,
          ...extractionRecord,
          pending_fields: [],
        })
    }

    // 7. Update document status, type, and page count
    await supabase
      .from('documents')
      .update({
        status: 'processed',
        doc_type: docType,
        doc_type_confidence: docTypeConfidence,
        page_count: pageCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.document_id)

    const totalElapsed = Date.now() - jobStartTime
    console.log(`[OCR+Gemini] Job completed for document ${job.document_id} in ${totalElapsed}ms`)

    // 8. Determine next job based on what was extracted
    // If Gemini extracted people/properties, skip directly to entity_extraction
    // Otherwise, fall back to traditional extraction job
    const hasPeopleOrProperties =
      (extractedData.people && Array.isArray(extractedData.people) && extractedData.people.length > 0) ||
      (extractedData.properties && Array.isArray(extractedData.properties) && extractedData.properties.length > 0)

    const nextJobType = hasPeopleOrProperties ? 'entity_extraction' : 'extraction'
    console.log(`[OCR+Gemini] Creating next job: ${nextJobType} (has entities: ${hasPeopleOrProperties})`)

    try {
      const { error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          case_id: job.case_id,
          document_id: job.document_id,
          job_type: nextJobType,
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        })

      if (jobError) {
        console.warn(`[OCR+Gemini] Failed to create ${nextJobType} job for document ${job.document_id}:`, jobError)
      } else {
        console.log(`[OCR+Gemini] Created ${nextJobType} job for document ${job.document_id}`)
      }
    } catch (triggerError) {
      console.error(`[OCR+Gemini] Error creating next job:`, triggerError)
    }

    return {
      status: 'completed',
      processing_mode: 'parallel',
      text: ocrResult?.text ? ocrResult.text.substring(0, 500) + (ocrResult.text.length > 500 ? '...' : '') : '',
      blocks_count: ocrResult?.blocks?.length || 0,
      ocr_confidence: ocrResult?.confidence || 0,
      gemini_confidence: geminiResult?.confidence || 0,
      document_type: docType,
      language: ocrResult?.language || 'pt',
      page_count: pageCount,
      total_time_ms: totalElapsed,
      parallel_time_ms: parallelElapsed,
      has_extracted_entities: hasPeopleOrProperties,
    }
  } catch (error) {
    console.error(`[OCR+Gemini] Job failed for document ${job.document_id}:`, error)

    // Update document status to failed
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.document_id)

    throw error
  }
}
