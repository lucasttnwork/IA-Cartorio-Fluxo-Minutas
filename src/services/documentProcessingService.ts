/**
 * Document Processing Service
 *
 * Handles fetching and managing document processing results including:
 * - OCR results from Google Document AI
 * - Gemini LLM extraction insights
 * - Processing job status tracking
 * - Real-time progress monitoring
 * - Error handling and retry operations
 */

import { supabase } from '../lib/supabase'
import type {
  Document,
  DocumentStatus,
  DocumentType,
  Extraction,
  OcrResult,
  OcrBlock,
  LlmResult,
  ConsensusResult,
  ProcessingJob,
  JobStatus,
  JobType,
} from '../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Processing status summary for a document
 */
export interface ProcessingStatus {
  documentId: string
  documentStatus: DocumentStatus
  ocrJob: ProcessingJobSummary | null
  extractionJob: ProcessingJobSummary | null
  consensusJob: ProcessingJobSummary | null
  entityExtractionJob: ProcessingJobSummary | null
  overallProgress: number // 0-100 percentage
  isComplete: boolean
  hasErrors: boolean
  errorMessages: string[]
}

/**
 * Summary of a processing job
 */
export interface ProcessingJobSummary {
  id: string
  status: JobStatus
  attempts: number
  maxAttempts: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  canRetry: boolean
}

/**
 * OCR results with quality metrics
 */
export interface OcrResultsWithQuality {
  result: OcrResult | null
  hasLowConfidence: boolean
  averageConfidence: number
  lowConfidenceBlocks: OcrBlock[]
  pageCount: number
  wordCount: number
  language: string
  processingTime?: number
}

/**
 * Gemini extraction insights
 */
export interface GeminiInsights {
  result: LlmResult | null
  documentType: DocumentType | null
  documentTypeConfidence: number
  extractedFields: ExtractedField[]
  notes: string[]
  warnings: string[]
}

/**
 * Individual extracted field from Gemini
 */
export interface ExtractedField {
  name: string
  value: unknown
  path: string
  confidence?: number
  source: 'llm' | 'ocr' | 'consensus'
}

/**
 * Complete document processing results
 */
export interface DocumentProcessingResults {
  document: Document | null
  extraction: Extraction | null
  processingStatus: ProcessingStatus
  ocrResults: OcrResultsWithQuality
  geminiInsights: GeminiInsights
  consensusResult: ConsensusResult | null
}

/**
 * Result of retry operation
 */
export interface RetryJobResult {
  success: boolean
  jobId?: string
  error?: string
  newAttempt?: number
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

const LOW_CONFIDENCE_THRESHOLD = 0.7

/**
 * Calculate average confidence from OCR blocks
 */
function calculateAverageConfidence(blocks: OcrBlock[]): number {
  if (!blocks || blocks.length === 0) return 0
  const sum = blocks.reduce((acc, block) => acc + block.confidence, 0)
  return sum / blocks.length
}

/**
 * Find blocks with low confidence
 */
function findLowConfidenceBlocks(blocks: OcrBlock[]): OcrBlock[] {
  if (!blocks) return []
  return blocks.filter(block => block.confidence < LOW_CONFIDENCE_THRESHOLD)
}

/**
 * Count words in OCR text
 */
function countWords(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Count unique pages from OCR blocks
 */
function countPages(blocks: OcrBlock[]): number {
  if (!blocks || blocks.length === 0) return 0
  const pages = new Set(blocks.map(block => block.page))
  return pages.size
}

/**
 * Extract fields from LLM result
 */
function extractFieldsFromLlmResult(result: LlmResult | null): ExtractedField[] {
  if (!result?.extracted_data) return []

  const fields: ExtractedField[] = []

  function extractRecursively(obj: Record<string, unknown>, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        extractRecursively(value as Record<string, unknown>, currentPath)
      } else {
        fields.push({
          name: key,
          value,
          path: currentPath,
          source: 'llm',
        })
      }
    }
  }

  extractRecursively(result.extracted_data)
  return fields
}

/**
 * Generate warnings based on LLM results
 */
function generateWarnings(result: LlmResult | null, ocrConfidence: number): string[] {
  const warnings: string[] = []

  if (ocrConfidence < LOW_CONFIDENCE_THRESHOLD) {
    warnings.push(`Baixa qualidade do OCR detectada (${(ocrConfidence * 100).toFixed(1)}% de confiança). Revise os resultados cuidadosamente.`)
  }

  if (result?.confidence && result.confidence < LOW_CONFIDENCE_THRESHOLD) {
    warnings.push(`Baixa confiança na extração de dados (${(result.confidence * 100).toFixed(1)}%). Alguns campos podem estar incorretos.`)
  }

  if (result?.document_type === 'other') {
    warnings.push('Tipo de documento não identificado. Classificação manual pode ser necessária.')
  }

  return warnings
}

/**
 * Calculate overall processing progress
 */
function calculateProgress(jobs: ProcessingJob[]): number {
  if (!jobs || jobs.length === 0) return 0

  const weights: Record<JobType, number> = {
    ocr: 40,
    extraction: 30,
    consensus: 15,
    entity_extraction: 10,
    entity_resolution: 5,
    draft: 0,
  }

  let totalWeight = 0
  let completedWeight = 0

  for (const job of jobs) {
    const weight = weights[job.job_type] || 0
    totalWeight += weight

    if (job.status === 'completed') {
      completedWeight += weight
    } else if (job.status === 'processing') {
      completedWeight += weight * 0.5
    }
  }

  if (totalWeight === 0) return 0
  return Math.round((completedWeight / totalWeight) * 100)
}

/**
 * Transform database job to summary
 */
function jobToSummary(job: ProcessingJob | null): ProcessingJobSummary | null {
  if (!job) return null

  return {
    id: job.id,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.max_attempts,
    errorMessage: job.error_message,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    canRetry: job.status === 'failed' && job.attempts < job.max_attempts,
  }
}

// -----------------------------------------------------------------------------
// API Functions
// -----------------------------------------------------------------------------

/**
 * Get document by ID with full details
 */
export async function getDocument(
  documentId: string
): Promise<{ data: Document | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error) {
    console.error('[DocumentProcessingService] Error fetching document:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get extraction results for a document
 */
export async function getExtraction(
  documentId: string
): Promise<{ data: Extraction | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('extractions')
    .select('*')
    .eq('document_id', documentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('[DocumentProcessingService] Error fetching extraction:', error)
    return { data: null, error }
  }

  return { data: data || null, error: null }
}

/**
 * Get all processing jobs for a document
 */
export async function getProcessingJobs(
  documentId: string
): Promise<{ data: ProcessingJob[] | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('processing_jobs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DocumentProcessingService] Error fetching processing jobs:', error)
    return { data: null, error }
  }

  return { data: data || [], error: null }
}

/**
 * Get processing status for a document
 */
export async function getProcessingStatus(
  documentId: string
): Promise<{ data: ProcessingStatus | null; error: Error | null }> {
  // Fetch document and jobs in parallel
  const [docResult, jobsResult] = await Promise.all([
    getDocument(documentId),
    getProcessingJobs(documentId),
  ])

  if (docResult.error) {
    return { data: null, error: docResult.error }
  }

  if (!docResult.data) {
    return { data: null, error: new Error('Document not found') }
  }

  const jobs = jobsResult.data || []

  // Find latest job of each type
  const findJob = (type: JobType) =>
    jobs.find(j => j.job_type === type) || null

  const ocrJob = findJob('ocr')
  const extractionJob = findJob('extraction')
  const consensusJob = findJob('consensus')
  const entityExtractionJob = findJob('entity_extraction')

  // Collect error messages
  const errorMessages: string[] = []
  for (const job of jobs) {
    if (job.status === 'failed' && job.error_message) {
      errorMessages.push(`${job.job_type}: ${job.error_message}`)
    }
  }

  const status: ProcessingStatus = {
    documentId,
    documentStatus: docResult.data.status,
    ocrJob: jobToSummary(ocrJob),
    extractionJob: jobToSummary(extractionJob),
    consensusJob: jobToSummary(consensusJob),
    entityExtractionJob: jobToSummary(entityExtractionJob),
    overallProgress: calculateProgress(jobs),
    isComplete: docResult.data.status === 'processed' || docResult.data.status === 'approved',
    hasErrors: jobs.some(j => j.status === 'failed'),
    errorMessages,
  }

  return { data: status, error: null }
}

/**
 * Get OCR results with quality metrics for a document
 */
export async function getOcrResults(
  documentId: string
): Promise<{ data: OcrResultsWithQuality | null; error: Error | null }> {
  const { data: extraction, error } = await getExtraction(documentId)

  if (error) {
    return { data: null, error }
  }

  const ocrResult = extraction?.ocr_result || null
  const blocks = ocrResult?.blocks || []
  const averageConfidence = calculateAverageConfidence(blocks)

  const results: OcrResultsWithQuality = {
    result: ocrResult,
    hasLowConfidence: averageConfidence < LOW_CONFIDENCE_THRESHOLD,
    averageConfidence,
    lowConfidenceBlocks: findLowConfidenceBlocks(blocks),
    pageCount: countPages(blocks),
    wordCount: countWords(ocrResult?.text || ''),
    language: ocrResult?.language || 'unknown',
  }

  return { data: results, error: null }
}

/**
 * Get Gemini extraction insights for a document
 */
export async function getGeminiInsights(
  documentId: string
): Promise<{ data: GeminiInsights | null; error: Error | null }> {
  const [extractionResult, documentResult] = await Promise.all([
    getExtraction(documentId),
    getDocument(documentId),
  ])

  if (extractionResult.error) {
    return { data: null, error: extractionResult.error }
  }

  const llmResult = extractionResult.data?.llm_result || null
  const ocrResult = extractionResult.data?.ocr_result || null
  const ocrConfidence = ocrResult?.confidence || 0

  const insights: GeminiInsights = {
    result: llmResult,
    documentType: documentResult.data?.doc_type || llmResult?.document_type || null,
    documentTypeConfidence: documentResult.data?.doc_type_confidence || llmResult?.confidence || 0,
    extractedFields: extractFieldsFromLlmResult(llmResult),
    notes: llmResult?.notes || [],
    warnings: generateWarnings(llmResult, ocrConfidence),
  }

  return { data: insights, error: null }
}

/**
 * Get complete document processing results
 */
export async function getDocumentProcessingResults(
  documentId: string
): Promise<{ data: DocumentProcessingResults | null; error: Error | null }> {
  // Fetch all data in parallel
  const [docResult, extractionResult, statusResult] = await Promise.all([
    getDocument(documentId),
    getExtraction(documentId),
    getProcessingStatus(documentId),
  ])

  if (docResult.error) {
    return { data: null, error: docResult.error }
  }

  if (!docResult.data) {
    return { data: null, error: new Error('Document not found') }
  }

  const extraction = extractionResult.data
  const ocrResult = extraction?.ocr_result || null
  const blocks = ocrResult?.blocks || []
  const averageConfidence = calculateAverageConfidence(blocks)
  const llmResult = extraction?.llm_result || null

  const results: DocumentProcessingResults = {
    document: docResult.data,
    extraction,
    processingStatus: statusResult.data!,
    ocrResults: {
      result: ocrResult,
      hasLowConfidence: averageConfidence < LOW_CONFIDENCE_THRESHOLD,
      averageConfidence,
      lowConfidenceBlocks: findLowConfidenceBlocks(blocks),
      pageCount: countPages(blocks),
      wordCount: countWords(ocrResult?.text || ''),
      language: ocrResult?.language || 'unknown',
    },
    geminiInsights: {
      result: llmResult,
      documentType: docResult.data.doc_type || llmResult?.document_type || null,
      documentTypeConfidence: docResult.data.doc_type_confidence || llmResult?.confidence || 0,
      extractedFields: extractFieldsFromLlmResult(llmResult),
      notes: llmResult?.notes || [],
      warnings: generateWarnings(llmResult, averageConfidence),
    },
    consensusResult: extraction?.consensus || null,
  }

  return { data: results, error: null }
}

/**
 * Retry a failed processing job
 */
export async function retryProcessingJob(
  jobId: string
): Promise<RetryJobResult> {
  try {
    // Get current job
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job, error: fetchError } = await (supabase as any)
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (fetchError) {
      console.error('[DocumentProcessingService] Error fetching job for retry:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    if (job.status !== 'failed') {
      return { success: false, error: `Cannot retry job with status: ${job.status}` }
    }

    if (job.attempts >= job.max_attempts) {
      return { success: false, error: `Job has exceeded maximum retry attempts (${job.max_attempts})` }
    }

    // Reset job status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedJob, error: updateError } = await (supabase as any)
      .from('processing_jobs')
      .update({
        status: 'pending',
        error_message: null,
        started_at: null,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      console.error('[DocumentProcessingService] Error resetting job for retry:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`[DocumentProcessingService] Job ${jobId} reset for retry (attempt ${updatedJob.attempts + 1}/${updatedJob.max_attempts})`)

    return {
      success: true,
      jobId,
      newAttempt: updatedJob.attempts + 1,
    }
  } catch (error) {
    console.error('[DocumentProcessingService] Unexpected error during retry:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Retry all failed jobs for a document
 */
export async function retryAllFailedJobs(
  documentId: string
): Promise<{ success: boolean; retriedCount: number; failedCount: number; errors: string[] }> {
  const { data: jobs, error } = await getProcessingJobs(documentId)

  if (error) {
    return { success: false, retriedCount: 0, failedCount: 0, errors: [error.message] }
  }

  const failedJobs = (jobs || []).filter(j => j.status === 'failed' && j.attempts < j.max_attempts)

  if (failedJobs.length === 0) {
    return { success: true, retriedCount: 0, failedCount: 0, errors: [] }
  }

  const errors: string[] = []
  let retriedCount = 0
  let failedCount = 0

  for (const job of failedJobs) {
    const result = await retryProcessingJob(job.id)
    if (result.success) {
      retriedCount++
    } else {
      failedCount++
      errors.push(`${job.job_type}: ${result.error}`)
    }
  }

  return {
    success: failedCount === 0,
    retriedCount,
    failedCount,
    errors,
  }
}

/**
 * Get processing results for multiple documents
 */
export async function getBatchProcessingStatus(
  documentIds: string[]
): Promise<{ data: Map<string, ProcessingStatus>; errors: Map<string, Error> }> {
  const results = new Map<string, ProcessingStatus>()
  const errors = new Map<string, Error>()

  // Process in parallel with a concurrency limit
  const BATCH_SIZE = 10
  for (let i = 0; i < documentIds.length; i += BATCH_SIZE) {
    const batch = documentIds.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (id) => {
      const { data, error } = await getProcessingStatus(id)
      if (error) {
        errors.set(id, error)
      } else if (data) {
        results.set(id, data)
      }
    })
    await Promise.all(promises)
  }

  return { data: results, errors }
}

/**
 * Subscribe to processing job updates for a document
 */
export function subscribeToProcessingUpdates(
  documentId: string,
  onUpdate: (status: ProcessingStatus) => void
): () => void {
  const channel = supabase
    .channel(`processing:${documentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `document_id=eq.${documentId}`,
      },
      async () => {
        // Fetch updated status
        const { data } = await getProcessingStatus(documentId)
        if (data) {
          onUpdate(data)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `id=eq.${documentId}`,
      },
      async () => {
        // Fetch updated status
        const { data } = await getProcessingStatus(documentId)
        if (data) {
          onUpdate(data)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Check if document processing is complete
 */
export async function isProcessingComplete(
  documentId: string
): Promise<{ complete: boolean; status: DocumentStatus | null; error: Error | null }> {
  const { data: doc, error } = await getDocument(documentId)

  if (error) {
    return { complete: false, status: null, error }
  }

  if (!doc) {
    return { complete: false, status: null, error: new Error('Document not found') }
  }

  const isComplete = doc.status === 'processed' || doc.status === 'approved'

  return { complete: isComplete, status: doc.status, error: null }
}

/**
 * Get processing time for a job type
 */
export async function getJobProcessingTime(
  documentId: string,
  jobType: JobType
): Promise<{ durationMs: number | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job, error } = await (supabase as any)
    .from('processing_jobs')
    .select('started_at, completed_at')
    .eq('document_id', documentId)
    .eq('job_type', jobType)
    .single()

  if (error) {
    return { durationMs: null, error }
  }

  if (!job?.started_at || !job?.completed_at) {
    return { durationMs: null, error: null }
  }

  const startTime = new Date(job.started_at).getTime()
  const endTime = new Date(job.completed_at).getTime()

  return { durationMs: endTime - startTime, error: null }
}

// -----------------------------------------------------------------------------
// Service Export
// -----------------------------------------------------------------------------

export const documentProcessingService = {
  // Document operations
  getDocument,
  getExtraction,
  getProcessingJobs,

  // Status operations
  getProcessingStatus,
  isProcessingComplete,
  getBatchProcessingStatus,

  // Results operations
  getOcrResults,
  getGeminiInsights,
  getDocumentProcessingResults,

  // Retry operations
  retryProcessingJob,
  retryAllFailedJobs,

  // Subscription
  subscribeToProcessingUpdates,

  // Utilities
  getJobProcessingTime,
}

export default documentProcessingService
