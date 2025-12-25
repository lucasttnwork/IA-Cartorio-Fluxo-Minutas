/**
 * Bulk Document Processing Service
 *
 * Provides optimized bulk document processing capabilities including:
 * - Parallel file uploads with configurable concurrency
 * - Worker pool pattern for efficient resource utilization
 * - Batch database operations for better performance
 * - Progress tracking and error handling for batch operations
 * - Automatic retry with exponential backoff
 */

import { supabase, createProcessingJob } from '../lib/supabase'
import { smartUpload, type UploadProgressCallback, type ChunkedUploadResult } from '../utils/chunkedUpload'
import { UPLOAD_LIMITS, formatFileSize } from '../config/uploadConfig'
import type { Document, DocumentStatus, ProcessingJob } from '../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Status of a single file in bulk processing
 */
export type BulkItemStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * Individual file progress in bulk operation
 */
export interface BulkFileProgress {
  id: string
  fileName: string
  fileSize: number
  status: BulkItemStatus
  uploadProgress: number
  processingProgress: number
  error?: string
  documentId?: string
  startedAt?: number
  completedAt?: number
  retryCount: number
}

/**
 * Overall bulk operation progress
 */
export interface BulkOperationProgress {
  operationId: string
  totalFiles: number
  completedFiles: number
  failedFiles: number
  cancelledFiles: number
  inProgressFiles: number
  pendingFiles: number
  totalBytes: number
  uploadedBytes: number
  overallProgress: number
  estimatedTimeRemaining: number | null
  currentSpeed: number
  startedAt: number
  files: Map<string, BulkFileProgress>
  isComplete: boolean
  isCancelled: boolean
}

/**
 * Options for bulk upload operation
 */
export interface BulkUploadOptions {
  concurrency?: number
  onProgress?: (progress: BulkOperationProgress) => void
  onFileComplete?: (file: BulkFileProgress) => void
  onFileError?: (file: BulkFileProgress, error: Error) => void
  abortSignal?: AbortSignal
  retryFailedFiles?: boolean
  maxRetries?: number
}

/**
 * Result of bulk upload operation
 */
export interface BulkUploadResult {
  operationId: string
  totalFiles: number
  successfulFiles: number
  failedFiles: number
  cancelledFiles: number
  documents: Document[]
  errors: Array<{ fileName: string; error: string }>
  duration: number
  averageUploadSpeed: number
}

/**
 * Options for batch reprocessing
 */
export interface BatchReprocessOptions {
  concurrency?: number
  onProgress?: (completed: number, total: number, currentDoc?: string) => void
  abortSignal?: AbortSignal
}

/**
 * Result of batch reprocessing
 */
export interface BatchReprocessResult {
  totalDocuments: number
  successfulReprocesses: number
  failedReprocesses: number
  jobIds: string[]
  errors: Array<{ documentId: string; error: string }>
}

// -----------------------------------------------------------------------------
// Worker Pool Implementation
// -----------------------------------------------------------------------------

/**
 * Simple worker pool for managing concurrent operations
 */
class WorkerPool<T, R> {
  private queue: Array<{ task: T; resolve: (result: R) => void; reject: (error: Error) => void }> = []
  private activeWorkers = 0
  private readonly maxWorkers: number
  private readonly worker: (task: T) => Promise<R>
  private isShutdown = false

  constructor(maxWorkers: number, worker: (task: T) => Promise<R>) {
    this.maxWorkers = maxWorkers
    this.worker = worker
  }

  async execute(task: T): Promise<R> {
    if (this.isShutdown) {
      throw new Error('Worker pool is shut down')
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return
    }

    const item = this.queue.shift()
    if (!item) return

    this.activeWorkers++

    try {
      const result = await this.worker(item.task)
      item.resolve(result)
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.activeWorkers--
      this.processQueue()
    }
  }

  shutdown(): void {
    this.isShutdown = true
    // Reject all pending tasks
    while (this.queue.length > 0) {
      const item = this.queue.shift()
      item?.reject(new Error('Worker pool shut down'))
    }
  }

  get pendingCount(): number {
    return this.queue.length
  }

  get activeCount(): number {
    return this.activeWorkers
  }
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Generate unique operation ID
 */
function generateOperationId(): string {
  return `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate estimated time remaining
 */
function calculateETA(
  uploadedBytes: number,
  totalBytes: number,
  startTime: number
): number | null {
  if (uploadedBytes === 0) return null
  const elapsedMs = Date.now() - startTime
  const bytesPerMs = uploadedBytes / elapsedMs
  const remainingBytes = totalBytes - uploadedBytes
  return bytesPerMs > 0 ? remainingBytes / bytesPerMs / 1000 : null
}

/**
 * Wait with exponential backoff
 */
async function exponentialBackoff(attempt: number, baseDelay: number = 1000): Promise<void> {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
  await new Promise(resolve => setTimeout(resolve, delay))
}

// -----------------------------------------------------------------------------
// Bulk Upload Service
// -----------------------------------------------------------------------------

/**
 * Performs bulk file upload with parallel processing
 */
export async function bulkUploadFiles(
  files: File[],
  caseId: string,
  options: BulkUploadOptions = {}
): Promise<BulkUploadResult> {
  const {
    concurrency = UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS,
    onProgress,
    onFileComplete,
    onFileError,
    abortSignal,
    retryFailedFiles = true,
    maxRetries = UPLOAD_LIMITS.MAX_RETRY_ATTEMPTS,
  } = options

  const operationId = generateOperationId()
  const startTime = Date.now()
  const documents: Document[] = []
  const errors: Array<{ fileName: string; error: string }> = []

  // Initialize progress tracking
  const progress: BulkOperationProgress = {
    operationId,
    totalFiles: files.length,
    completedFiles: 0,
    failedFiles: 0,
    cancelledFiles: 0,
    inProgressFiles: 0,
    pendingFiles: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    uploadedBytes: 0,
    overallProgress: 0,
    estimatedTimeRemaining: null,
    currentSpeed: 0,
    startedAt: startTime,
    files: new Map(),
    isComplete: false,
    isCancelled: false,
  }

  // Initialize file progress entries
  files.forEach((file, index) => {
    progress.files.set(file.name, {
      id: `file-${index}`,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending',
      uploadProgress: 0,
      processingProgress: 0,
      retryCount: 0,
    })
  })

  // Notify initial progress
  onProgress?.(progress)

  // Create upload task
  const uploadTask = async (file: File): Promise<{ file: File; document: Document | null; error: string | null }> => {
    const fileProgress = progress.files.get(file.name)!

    // Check for cancellation
    if (abortSignal?.aborted) {
      fileProgress.status = 'cancelled'
      progress.cancelledFiles++
      progress.pendingFiles--
      onProgress?.(progress)
      return { file, document: null, error: 'Cancelled' }
    }

    fileProgress.status = 'uploading'
    fileProgress.startedAt = Date.now()
    progress.inProgressFiles++
    progress.pendingFiles--
    onProgress?.(progress)

    let lastError: string | null = null
    let uploadResult: ChunkedUploadResult | null = null

    // Retry loop
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        if (!retryFailedFiles) break
        fileProgress.retryCount = attempt
        await exponentialBackoff(attempt - 1)
      }

      // Check for cancellation before each attempt
      if (abortSignal?.aborted) {
        fileProgress.status = 'cancelled'
        progress.inProgressFiles--
        progress.cancelledFiles++
        onProgress?.(progress)
        return { file, document: null, error: 'Cancelled' }
      }

      try {
        // Upload file with progress tracking
        const progressCallback: UploadProgressCallback = (uploadProgress) => {
          fileProgress.uploadProgress = uploadProgress.percentage

          // Update total uploaded bytes (approximate)
          const fileUploadedBytes = (file.size * uploadProgress.percentage) / 100
          const previousBytes = progress.files.get(file.name)?.uploadProgress || 0
          progress.uploadedBytes += fileUploadedBytes - (file.size * previousBytes / 100)

          // Calculate overall progress
          progress.overallProgress = (progress.uploadedBytes / progress.totalBytes) * 100
          progress.currentSpeed = uploadProgress.speed
          progress.estimatedTimeRemaining = calculateETA(
            progress.uploadedBytes,
            progress.totalBytes,
            startTime
          )

          onProgress?.(progress)
        }

        uploadResult = await smartUpload(file, caseId, progressCallback, abortSignal)

        if (!uploadResult.success) {
          lastError = uploadResult.error || 'Upload failed'
          continue
        }

        // Upload successful, update status
        fileProgress.status = 'uploaded'
        fileProgress.uploadProgress = 100
        onProgress?.(progress)

        // Create document record
        fileProgress.status = 'processing'
        onProgress?.(progress)

        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            case_id: caseId,
            storage_path: uploadResult.path,
            original_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            status: 'uploaded' as DocumentStatus,
            metadata: {
              upload_duration_ms: uploadResult.uploadDuration,
              bulk_operation_id: operationId,
            },
          })
          .select()
          .single()

        if (docError) {
          lastError = docError.message
          continue
        }

        // Create OCR processing job
        const { error: jobError } = await createProcessingJob(caseId, docData.id, 'ocr')
        if (jobError) {
          console.warn(`[BulkProcessing] Failed to create OCR job for ${file.name}:`, jobError)
          // Don't fail the upload, just log the warning
        }

        // Success!
        fileProgress.status = 'completed'
        fileProgress.documentId = docData.id
        fileProgress.completedAt = Date.now()
        fileProgress.processingProgress = 100
        progress.inProgressFiles--
        progress.completedFiles++

        onProgress?.(progress)
        onFileComplete?.(fileProgress)

        return { file, document: docData as Document, error: null }

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        console.error(`[BulkProcessing] Attempt ${attempt + 1} failed for ${file.name}:`, lastError)
      }
    }

    // All retries exhausted
    fileProgress.status = 'failed'
    fileProgress.error = lastError || 'Unknown error'
    fileProgress.completedAt = Date.now()
    progress.inProgressFiles--
    progress.failedFiles++

    onProgress?.(progress)
    onFileError?.(fileProgress, new Error(lastError || 'Unknown error'))

    return { file, document: null, error: lastError }
  }

  // Create worker pool
  const pool = new WorkerPool<File, { file: File; document: Document | null; error: string | null }>(
    concurrency,
    uploadTask
  )

  // Handle abort signal
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      pool.shutdown()
      progress.isCancelled = true
      onProgress?.(progress)
    })
  }

  // Execute all uploads in parallel
  const results = await Promise.all(files.map(file => pool.execute(file)))

  // Collect results
  for (const result of results) {
    if (result.document) {
      documents.push(result.document)
    }
    if (result.error) {
      errors.push({ fileName: result.file.name, error: result.error })
    }
  }

  // Mark operation as complete
  progress.isComplete = true
  progress.overallProgress = 100
  onProgress?.(progress)

  const duration = Date.now() - startTime
  const averageUploadSpeed = progress.uploadedBytes / (duration / 1000)

  console.log('[BulkProcessing] Bulk upload completed:', {
    operationId,
    totalFiles: files.length,
    successfulFiles: documents.length,
    failedFiles: errors.length,
    duration: `${(duration / 1000).toFixed(2)}s`,
    averageSpeed: formatFileSize(averageUploadSpeed) + '/s',
  })

  return {
    operationId,
    totalFiles: files.length,
    successfulFiles: documents.length,
    failedFiles: errors.length,
    cancelledFiles: progress.cancelledFiles,
    documents,
    errors,
    duration,
    averageUploadSpeed,
  }
}

// -----------------------------------------------------------------------------
// Batch Reprocessing Service
// -----------------------------------------------------------------------------

/**
 * Reprocess multiple documents in parallel
 */
export async function batchReprocessDocuments(
  documentIds: string[],
  options: BatchReprocessOptions = {}
): Promise<BatchReprocessResult> {
  const {
    concurrency = 5,
    onProgress,
    abortSignal,
  } = options

  const jobIds: string[] = []
  const errors: Array<{ documentId: string; error: string }> = []
  let completed = 0

  // Reprocess task
  const reprocessTask = async (documentId: string): Promise<{ documentId: string; jobId: string | null; error: string | null }> => {
    if (abortSignal?.aborted) {
      return { documentId, jobId: null, error: 'Cancelled' }
    }

    try {
      // Get document info
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('id, case_id, status')
        .eq('id', documentId)
        .single()

      if (fetchError || !doc) {
        return { documentId, jobId: null, error: fetchError?.message || 'Document not found' }
      }

      // Delete existing extractions
      await supabase
        .from('extractions')
        .delete()
        .eq('document_id', documentId)

      // Delete existing pending/failed jobs
      await supabase
        .from('processing_jobs')
        .delete()
        .eq('document_id', documentId)
        .in('status', ['pending', 'failed', 'retrying'])

      // Reset document status
      await supabase
        .from('documents')
        .update({
          status: 'uploaded' as DocumentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      // Create new OCR job
      const { data: newJob, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          case_id: doc.case_id,
          document_id: documentId,
          job_type: 'ocr',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        })
        .select('id')
        .single()

      if (jobError) {
        return { documentId, jobId: null, error: jobError.message }
      }

      completed++
      onProgress?.(completed, documentIds.length, doc.id)

      return { documentId, jobId: newJob?.id || null, error: null }

    } catch (error) {
      return { documentId, jobId: null, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Create worker pool
  const pool = new WorkerPool<string, { documentId: string; jobId: string | null; error: string | null }>(
    concurrency,
    reprocessTask
  )

  // Execute all reprocessing in parallel
  const results = await Promise.all(documentIds.map(id => pool.execute(id)))

  // Collect results
  for (const result of results) {
    if (result.jobId) {
      jobIds.push(result.jobId)
    }
    if (result.error) {
      errors.push({ documentId: result.documentId, error: result.error })
    }
  }

  console.log('[BulkProcessing] Batch reprocessing completed:', {
    totalDocuments: documentIds.length,
    successfulReprocesses: jobIds.length,
    failedReprocesses: errors.length,
  })

  return {
    totalDocuments: documentIds.length,
    successfulReprocesses: jobIds.length,
    failedReprocesses: errors.length,
    jobIds,
    errors,
  }
}

// -----------------------------------------------------------------------------
// Batch Status Checking
// -----------------------------------------------------------------------------

/**
 * Get processing status for multiple documents efficiently
 * Uses batched queries for better performance
 */
export async function getBatchProcessingStatus(
  documentIds: string[]
): Promise<Map<string, { document: Document | null; jobs: ProcessingJob[]; isComplete: boolean }>> {
  const results = new Map<string, { document: Document | null; jobs: ProcessingJob[]; isComplete: boolean }>()

  // Batch fetch documents
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .in('id', documentIds)

  if (docsError) {
    console.error('[BulkProcessing] Error fetching documents:', docsError)
    return results
  }

  // Batch fetch processing jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('processing_jobs')
    .select('*')
    .in('document_id', documentIds)
    .order('created_at', { ascending: false })

  if (jobsError) {
    console.error('[BulkProcessing] Error fetching jobs:', jobsError)
    return results
  }

  // Group jobs by document ID
  const jobsByDocument = new Map<string, ProcessingJob[]>()
  for (const job of (jobs || [])) {
    const docJobs = jobsByDocument.get(job.document_id) || []
    docJobs.push(job as ProcessingJob)
    jobsByDocument.set(job.document_id, docJobs)
  }

  // Build results
  for (const doc of (documents || [])) {
    const docJobs = jobsByDocument.get(doc.id) || []
    const isComplete = doc.status === 'processed' || doc.status === 'approved'
    results.set(doc.id, {
      document: doc as Document,
      jobs: docJobs,
      isComplete,
    })
  }

  // Handle missing documents
  for (const id of documentIds) {
    if (!results.has(id)) {
      results.set(id, { document: null, jobs: [], isComplete: false })
    }
  }

  return results
}

// -----------------------------------------------------------------------------
// Service Export
// -----------------------------------------------------------------------------

export const bulkProcessingService = {
  bulkUploadFiles,
  batchReprocessDocuments,
  getBatchProcessingStatus,
}

export default bulkProcessingService
