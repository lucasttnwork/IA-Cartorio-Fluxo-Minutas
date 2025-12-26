import { SupabaseClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { ProcessingJob, OcrResult, ExtractedEntity, EntityType, EntityExtractionResult } from '../types'

// Gemini configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MAX_CHUNK_SIZE = 25000 // Gemini token limit consideration (~30k tokens, leave margin)
const MIN_CONFIDENCE_THRESHOLD = 0.5

// Initialize Gemini client
let geminiClient: GoogleGenerativeAI | null = null
let geminiModel: GenerativeModel | null = null

function getGeminiClient(): { client: GoogleGenerativeAI; model: GenerativeModel } {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY)
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-3-flash-preview' })
  }

  return { client: geminiClient, model: geminiModel! }
}

/**
 * Entity type descriptions for the prompt
 */
const ENTITY_TYPE_DESCRIPTIONS: Record<EntityType, string> = {
  PERSON: 'Names of individuals (full names, first names, last names)',
  ORGANIZATION: 'Companies, institutions, government agencies, cartórios',
  LOCATION: 'Cities, states, countries, neighborhoods',
  DATE: 'Dates in any format (birth dates, document dates, etc.)',
  MONEY: 'Currency amounts, prices, values',
  CPF: 'Brazilian individual taxpayer registration (11 digits, format: XXX.XXX.XXX-XX)',
  RG: 'Brazilian identity card number',
  CNPJ: 'Brazilian company registration (14 digits)',
  EMAIL: 'Email addresses',
  PHONE: 'Phone numbers in any format',
  ADDRESS: 'Full addresses or partial address components',
  PROPERTY_REGISTRY: 'Property registration numbers, matrícula numbers',
  RELATIONSHIP: 'Family relationships (spouse, parent, child, etc.)',
  DOCUMENT_NUMBER: 'Other document numbers (protocol, process, etc.)',
  OTHER: 'Other relevant entities not covered by above categories',
}

/**
 * Split text into chunks for processing large documents
 */
function chunkText(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text]
  }

  const chunks: string[] = []
  let currentChunk = ''

  // Split by paragraphs first, then by sentences if needed
  const paragraphs = text.split(/\n\s*\n/)

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    } else {
      if (currentChunk) {
        chunks.push(currentChunk)
      }

      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxSize) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/)
        currentChunk = ''

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence
          } else {
            if (currentChunk) {
              chunks.push(currentChunk)
            }
            currentChunk = sentence.substring(0, maxSize)
          }
        }
      } else {
        currentChunk = paragraph
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

/**
 * Generate extraction prompt for Gemini
 */
function generateExtractionPrompt(text: string, documentType: string | null): string {
  const entityTypesDescription = Object.entries(ENTITY_TYPE_DESCRIPTIONS)
    .map(([type, desc]) => `- ${type}: ${desc}`)
    .join('\n')

  const contextHint = documentType
    ? `This is a ${documentType} document. Pay special attention to entities typically found in this type of document.`
    : 'Analyze the document text carefully to extract all relevant entities.'

  return `You are an expert entity extraction system for Brazilian legal documents. Extract all entities from the following document text.

${contextHint}

Entity Types to extract:
${entityTypesDescription}

Document Text:
---
${text}
---

Extract all entities found in the text. For each entity, provide:
1. type: The entity type from the list above
2. value: The exact text value as it appears in the document
3. confidence: A score between 0 and 1 indicating extraction confidence
4. context: A brief snippet of surrounding text for context (max 50 chars)
5. normalized_value: A normalized/cleaned version of the value (e.g., dates in ISO format, CPF without formatting)

IMPORTANT:
- Extract ALL instances, even if duplicated
- Be precise with confidence scores (lower for ambiguous extractions)
- Include context to help verify the extraction
- For CPF/CNPJ/RG, validate the format
- For dates, try to normalize to YYYY-MM-DD format
- For money, extract the numeric value and currency

Respond ONLY with a valid JSON array (no markdown, no code blocks):
[
  {
    "type": "ENTITY_TYPE",
    "value": "extracted value",
    "confidence": 0.95,
    "context": "surrounding text...",
    "normalized_value": "normalized value or null"
  }
]

If no entities are found, return an empty array: []`
}

/**
 * Parse and validate entities from Gemini response
 */
function parseEntitiesFromResponse(responseText: string, documentId: string): ExtractedEntity[] {
  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    const codeBlockPattern = /^```(?:json)?\s*/
    const codeBlockEndPattern = /\s*```$/
    if (codeBlockPattern.test(cleanedResponse)) {
      cleanedResponse = cleanedResponse.replace(codeBlockPattern, '').replace(codeBlockEndPattern, '')
    }

    const parsed = JSON.parse(cleanedResponse)

    if (!Array.isArray(parsed)) {
      console.error('Gemini response is not an array:', parsed)
      return []
    }

    const validTypes = Object.keys(ENTITY_TYPE_DESCRIPTIONS) as EntityType[]

    return parsed
      .filter((entity: Record<string, unknown>) => {
        // Validate required fields
        if (!entity.type || !entity.value) {
          return false
        }
        // Validate entity type
        if (!validTypes.includes(entity.type as EntityType)) {
          console.warn(`Unknown entity type: ${entity.type}`)
          return false
        }
        return true
      })
      .map((entity: Record<string, unknown>) => ({
        id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        document_id: documentId,
        type: entity.type as EntityType,
        value: String(entity.value),
        confidence: typeof entity.confidence === 'number' ? Math.min(Math.max(entity.confidence, 0), 1) : 0.7,
        context: entity.context ? String(entity.context).substring(0, 100) : undefined,
        normalized_value: entity.normalized_value ? String(entity.normalized_value) : undefined,
      }))
  } catch (error) {
    console.error('Failed to parse entities from response:', error)
    console.error('Response text:', responseText.substring(0, 500))
    return []
  }
}

/**
 * Extract entities from a text chunk using Gemini
 */
async function extractEntitiesFromChunk(
  text: string,
  documentId: string,
  documentType: string | null
): Promise<ExtractedEntity[]> {
  const { model } = getGeminiClient()

  const prompt = generateExtractionPrompt(text, documentType)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()

    return parseEntitiesFromResponse(responseText, documentId)
  } catch (error) {
    console.error('Gemini API error during entity extraction:', error)
    throw error
  }
}

/**
 * Deduplicate entities by merging similar ones
 */
function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const uniqueEntities: ExtractedEntity[] = []
  const seen = new Map<string, ExtractedEntity>()

  for (const entity of entities) {
    // Create a key based on type and normalized/original value
    const normalizedValue = (entity.normalized_value || entity.value).toLowerCase().trim()
    const key = `${entity.type}:${normalizedValue}`

    const existing = seen.get(key)
    if (existing) {
      // Keep the one with higher confidence
      if (entity.confidence > existing.confidence) {
        seen.set(key, entity)
      }
    } else {
      seen.set(key, entity)
    }
  }

  return Array.from(seen.values())
}

/**
 * Filter entities by confidence threshold
 */
function filterByConfidence(entities: ExtractedEntity[], threshold: number): ExtractedEntity[] {
  return entities.filter(entity => entity.confidence >= threshold)
}

/**
 * Run entity extraction job using Gemini LLM
 */
export async function runEntityExtractionJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  const startTime = Date.now()
  console.log(`Running entity extraction job for document ${job.document_id}`)

  if (!job.document_id) {
    throw new Error('No document_id provided for entity extraction job')
  }

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
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

  // 2. Get extraction with OCR result
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
    console.log('No OCR result found for entity extraction')
    return {
      status: 'completed',
      entities_count: 0,
      notes: ['No OCR text available for entity extraction'],
    }
  }

  // 3. Chunk the text for large documents
  const textChunks = chunkText(ocrResult.text, MAX_CHUNK_SIZE)
  console.log(`Processing ${textChunks.length} text chunks`)

  // 4. Extract entities from each chunk
  const allEntities: ExtractedEntity[] = []

  for (let i = 0; i < textChunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${textChunks.length}`)

    try {
      const chunkEntities = await extractEntitiesFromChunk(
        textChunks[i],
        job.document_id,
        document.doc_type
      )

      // Add page information if available from OCR blocks
      for (const entity of chunkEntities) {
        if (ocrResult.blocks && ocrResult.blocks.length > 0) {
          // Try to find the entity in OCR blocks to get position
          const matchingBlock = ocrResult.blocks.find(block =>
            block.text.includes(entity.value)
          )
          if (matchingBlock) {
            entity.position = {
              page: matchingBlock.page,
              bounding_box: matchingBlock.bounding_box,
            }
          }
        }
      }

      allEntities.push(...chunkEntities)

      // Add a small delay between chunks to respect rate limits
      if (i < textChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`Failed to extract entities from chunk ${i + 1}:`, error)
      // Continue with other chunks
    }
  }

  // 5. Post-processing: deduplicate and filter
  console.log(`Extracted ${allEntities.length} raw entities`)

  const deduplicatedEntities = deduplicateEntities(allEntities)
  console.log(`${deduplicatedEntities.length} entities after deduplication`)

  const filteredEntities = filterByConfidence(deduplicatedEntities, MIN_CONFIDENCE_THRESHOLD)
  console.log(`${filteredEntities.length} entities above confidence threshold`)

  // 6. Store entities in extraction result
  const entityExtractionResult: EntityExtractionResult = {
    entities: filteredEntities,
    document_id: job.document_id,
    processing_time_ms: Date.now() - startTime,
    model_used: 'gemini-3-flash-preview',
  }

  // Update extraction record with entities
  if (extraction) {
    const existingLlmResult = extraction.llm_result as Record<string, unknown> || {}
    await supabase
      .from('extractions')
      .update({
        llm_result: {
          ...existingLlmResult,
          entity_extraction: entityExtractionResult,
        },
      })
      .eq('id', extraction.id)
  } else {
    await supabase
      .from('extractions')
      .insert({
        document_id: job.document_id,
        llm_result: {
          entity_extraction: entityExtractionResult,
        },
        pending_fields: [],
      })
  }

  // 7. Update document metadata with entity count
  await supabase
    .from('documents')
    .update({
      metadata: {
        ...((document.metadata as Record<string, unknown>) || {}),
        entity_count: filteredEntities.length,
        entity_extraction_date: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.document_id)

  console.log(`Entity extraction completed for document ${job.document_id}: ${filteredEntities.length} entities`)

  // Group entities by type for summary
  const entitySummary: Record<string, number> = {}
  for (const entity of filteredEntities) {
    entitySummary[entity.type] = (entitySummary[entity.type] || 0) + 1
  }

  // Auto-trigger entity_resolution job for the case (only if not already pending/processing)
  try {
    // Check if there's already a pending/processing entity_resolution job for this case
    const { data: existingJob } = await supabase
      .from('processing_jobs')
      .select('id')
      .eq('case_id', job.case_id)
      .eq('job_type', 'entity_resolution')
      .in('status', ['pending', 'processing'])
      .single()

    if (!existingJob) {
      // Check if all documents for this case have completed entity_extraction
      const { data: pendingDocs } = await supabase
        .from('processing_jobs')
        .select('id')
        .eq('case_id', job.case_id)
        .eq('job_type', 'entity_extraction')
        .in('status', ['pending', 'processing'])

      // Only create entity_resolution job if no more entity_extraction jobs are pending
      if (!pendingDocs || pendingDocs.length === 0) {
        const { error: jobError } = await supabase
          .from('processing_jobs')
          .insert({
            case_id: job.case_id,
            document_id: null, // entity_resolution is case-level, not document-level
            job_type: 'entity_resolution',
            status: 'pending',
            attempts: 0,
            max_attempts: 3,
          })

        if (jobError) {
          console.warn(`[EntityExtraction] Failed to create entity_resolution job for case ${job.case_id}:`, jobError)
        } else {
          console.log(`[EntityExtraction] Created entity_resolution job for case ${job.case_id}`)
        }
      } else {
        console.log(`[EntityExtraction] Waiting for ${pendingDocs.length} more entity_extraction jobs to complete before entity_resolution`)
      }
    } else {
      console.log(`[EntityExtraction] entity_resolution job already exists for case ${job.case_id}`)
    }
  } catch (triggerError) {
    console.error(`[EntityExtraction] Error creating entity_resolution job:`, triggerError)
  }

  return {
    status: 'completed',
    entities_count: filteredEntities.length,
    entity_summary: entitySummary,
    processing_time_ms: Date.now() - startTime,
    chunks_processed: textChunks.length,
  }
}
