import { SupabaseClient } from '@supabase/supabase-js'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import type { ProcessingJob, OcrResult, OcrBlock, BoundingBox } from '../types'

// Document AI configuration from environment variables
// Support both naming conventions for flexibility
const GOOGLE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_PROJECT_ID
const DOCUMENT_AI_PROCESSOR_ID = process.env.GOOGLE_CLOUD_PROCESSOR_ID || process.env.DOCUMENT_AI_PROCESSOR_ID
const DOCUMENT_AI_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || process.env.DOCUMENT_AI_LOCATION || 'us'

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
  if (!GOOGLE_PROJECT_ID || !DOCUMENT_AI_PROCESSOR_ID) {
    throw new Error('Missing Document AI configuration. Set GOOGLE_PROJECT_ID and DOCUMENT_AI_PROCESSOR_ID environment variables.')
  }
  return `projects/${GOOGLE_PROJECT_ID}/locations/${DOCUMENT_AI_LOCATION}/processors/${DOCUMENT_AI_PROCESSOR_ID}`
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
 * Run OCR job using Google Document AI
 */
export async function runOcrJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running OCR job for document ${job.document_id}`)

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
    // 2. Download document from Supabase Storage
    console.log(`Downloading document from storage: ${document.storage_path}`)
    const { content, mimeType } = await downloadDocument(supabase, document.storage_path)
    console.log(`Downloaded document: ${content.length} bytes, MIME type: ${mimeType}`)

    // 3. Send to Google Document AI for OCR
    console.log('Sending document to Google Document AI...')
    const client = getDocumentAiClient()
    const processorName = getProcessorName()

    const [result] = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: content.toString('base64'),
        mimeType: mimeType,
      },
    })

    if (!result.document) {
      throw new Error('Document AI returned empty document')
    }

    console.log('Document AI processing complete')

    // 4. Parse response and extract OCR results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ocrResult = processDocumentAiResponse(result.document as any)
    console.log(`Extracted ${ocrResult.blocks.length} blocks with ${ocrResult.confidence.toFixed(2)} average confidence`)

    // 5. Check if extraction record exists or create one
    const { data: existingExtraction } = await supabase
      .from('extractions')
      .select('id')
      .eq('document_id', job.document_id)
      .single()

    if (existingExtraction) {
      // Update existing extraction
      await supabase
        .from('extractions')
        .update({
          ocr_result: ocrResult as unknown as Record<string, unknown>,
        })
        .eq('id', existingExtraction.id)
    } else {
      // Create new extraction record
      await supabase
        .from('extractions')
        .insert({
          document_id: job.document_id,
          ocr_result: ocrResult as unknown as Record<string, unknown>,
          pending_fields: [],
        })
    }

    // 6. Update document status and page count
    const pageCount = result.document.pages?.length || 1
    await supabase
      .from('documents')
      .update({
        status: 'processed',
        page_count: pageCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.document_id)

    console.log(`OCR job completed for document ${job.document_id}`)

    return {
      status: 'completed',
      text: ocrResult.text.substring(0, 500) + (ocrResult.text.length > 500 ? '...' : ''),
      blocks_count: ocrResult.blocks.length,
      confidence: ocrResult.confidence,
      language: ocrResult.language,
      page_count: pageCount,
    }
  } catch (error) {
    console.error(`OCR job failed for document ${job.document_id}:`, error)

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
