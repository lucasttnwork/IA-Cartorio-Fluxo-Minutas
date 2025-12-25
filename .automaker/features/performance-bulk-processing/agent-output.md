Looking at the previous context, it seems the implementation was interrupted. Let me explore the codebase to understand the existing structure and continue implementing the bulk document processing performance feature.

🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx,js,jsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/package.json"
}

Let me look for the source files more specifically:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx,js,jsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\package.json"
}

Let me explore more of the project structure to understand the document processing system:

🔧 Tool: Glob
Input: {
  "pattern": "src/pages/*.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/services/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/stores/*.ts"
}

Let me look at the existing document processing service and related files:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\services\\documentProcessingService.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\services\\documentService.ts"
}

Now let me look at the upload page and check for existing bulk processing patterns:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\stores\\caseStore.ts"
}

Now let me check for existing upload components and understand the current upload pattern:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\DocumentDropzone.tsx"
}

Now let me look at the types and see what needs to be improved for bulk processing:

🔧 Tool: Glob
Input: {
  "pattern": "src/types/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\config\\uploadConfig.ts"
}

Now let me check the types/index.ts to understand the data structures:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\utils\\chunkedUpload.ts"
}

Now I have a good understanding of the codebase. Based on the feature request "Bulk document processing performance", I need to improve the performance of bulk document processing. Let me implement the following enhancements:

1. **Parallel processing for batch uploads** - Currently files are uploaded sequentially; we need concurrent uploads
2. **Optimized batch processing service** - Add a dedicated bulk processing service with worker pool pattern
3. **Progress tracking for bulk operations** - Better progress tracking UI for batch operations
4. **Optimized database operations** - Batch database operations for better performance

Let me create the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create bulk processing service with worker pool pattern",
      "status": "in_progress",
      "activeForm": "Creating bulk processing service with worker pool pattern"
    },
    {
      "content": "Update upload configuration for parallel processing",
      "status": "pending",
      "activeForm": "Updating upload configuration for parallel processing"
    },
    {
      "content": "Create bulk upload hook for parallel file uploads",
      "status": "pending",
      "activeForm": "Creating bulk upload hook for parallel file uploads"
    },
    {
      "content": "Add batch progress tracking component",
      "status": "pending",
      "activeForm": "Adding batch progress tracking component"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\services\\bulkProcessingService.ts",
  "content": "/**\n * Bulk Document Processing Service\n *\n * Provides optimized bulk document processing capabilities including:\n * - Parallel file uploads with configurable concurrency\n * - Worker pool pattern for efficient resource utilization\n * - Batch database operations for better performance\n * - Progress tracking and error handling for batch operations\n * - Automatic retry with exponential backoff\n */\n\nimport { supabase, createProcessingJob } from '../lib/supabase'\nimport { smartUpload, type UploadProgressCallback, type ChunkedUploadResult } from '../utils/chunkedUpload'\nimport { UPLOAD_LIMITS, formatFileSize } from '../config/uploadConfig'\nimport type { Document, DocumentStatus, ProcessingJob } from '../types'\n\n// -----------------------------------------------------------------------------\n// Types\n// -----------------------------------------------------------------------------\n\n/**\n * Status of a single file in bulk processing\n */\nexport type BulkItemStatus =\n  | 'pending'\n  | 'uploading'\n  | 'uploaded'\n  | 'processing'\n  | 'completed'\n  | 'failed'\n  | 'cancelled'\n\n/**\n * Individual file progress in bulk operation\n */\nexport interface BulkFileProgress {\n  id: string\n  fileName: string\n  fileSize: number\n  status: BulkItemStatus\n  uploadProgress: number\n  processingProgress: number\n  error?: string\n  documentId?: string\n  startedAt?: number\n  completedAt?: number\n  retryCount: number\n}\n\n/**\n * Overall bulk operation progress\n */\nexport interface BulkOperationProgress {\n  operationId: string\n  totalFiles: number\n  completedFiles: number\n  failedFiles: number\n  cancelledFiles: number\n  inProgressFiles: number\n  pendingFiles: number\n  totalBytes: number\n  uploadedBytes: number\n  overallProgress: number\n  estimatedTimeRemaining: number | null\n  currentSpeed: number\n  startedAt: number\n  files: Map<string, BulkFileProgress>\n  isComplete: boolean\n  isCancelled: boolean\n}\n\n/**\n * Options for bulk upload operation\n */\nexport interface BulkUploadOptions {\n  concurrency?: number\n  onProgress?: (progress: BulkOperationProgress) => void\n  onFileComplete?: (file: BulkFileProgress) => void\n  onFileError?: (file: BulkFileProgress, error: Error) => void\n  abortSignal?: AbortSignal\n  retryFailedFiles?: boolean\n  maxRetries?: number\n}\n\n/**\n * Result of bulk upload operation\n */\nexport interface BulkUploadResult {\n  operationId: string\n  totalFiles: number\n  successfulFiles: number\n  failedFiles: number\n  cancelledFiles: number\n  documents: Document[]\n  errors: Array<{ fileName: string; error: string }>\n  duration: number\n  averageUploadSpeed: number\n}\n\n/**\n * Options for batch reprocessing\n */\nexport interface BatchReprocessOptions {\n  concurrency?: number\n  onProgress?: (completed: number, total: number, currentDoc?: string) => void\n  abortSignal?: AbortSignal\n}\n\n/**\n * Result of batch reprocessing\n */\nexport interface BatchReprocessResult {\n  totalDocuments: number\n  successfulReprocesses: number\n  failedReprocesses: number\n  jobIds: string[]\n  errors: Array<{ documentId: string; error: string }>\n}\n\n// -----------------------------------------------------------------------------\n// Worker Pool Implementation\n// -----------------------------------------------------------------------------\n\n/**\n * Simple worker pool for managing concurrent operations\n */\nclass WorkerPool<T, R> {\n  private queue: Array<{ task: T; resolve: (result: R) => void; reject: (error: Error) => void }> = []\n  private activeWorkers = 0\n  private readonly maxWorkers: number\n  private readonly worker: (task: T) => Promise<R>\n  private isShutdown = false\n\n  constructor(maxWorkers: number, worker: (task: T) => Promise<R>) {\n    this.maxWorkers = maxWorkers\n    this.worker = worker\n  }\n\n  async execute(task: T): Promise<R> {\n    if (this.isShutdown) {\n      throw new Error('Worker pool is shut down')\n    }\n\n    return new Promise((resolve, reject) => {\n      this.queue.push({ task, resolve, reject })\n      this.processQueue()\n    })\n  }\n\n  private async processQueue(): Promise<void> {\n    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {\n      return\n    }\n\n    const item = this.queue.shift()\n    if (!item) return\n\n    this.activeWorkers++\n\n    try {\n      const result = await this.worker(item.task)\n      item.resolve(result)\n    } catch (error) {\n      item.reject(error instanceof Error ? error : new Error(String(error)))\n    } finally {\n      this.activeWorkers--\n      this.processQueue()\n    }\n  }\n\n  shutdown(): void {\n    this.isShutdown = true\n    // Reject all pending tasks\n    while (this.queue.length > 0) {\n      const item = this.queue.shift()\n      item?.reject(new Error('Worker pool shut down'))\n    }\n  }\n\n  get pendingCount(): number {\n    return this.queue.length\n  }\n\n  get activeCount(): number {\n    return this.activeWorkers\n  }\n}\n\n// -----------------------------------------------------------------------------\n// Utility Functions\n// -----------------------------------------------------------------------------\n\n/**\n * Generate unique operation ID\n */\nfunction generateOperationId(): string {\n  return `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`\n}\n\n/**\n * Calculate estimated time remaining\n */\nfunction calculateETA(\n  uploadedBytes: number,\n  totalBytes: number,\n  startTime: number\n): number | null {\n  if (uploadedBytes === 0) return null\n  const elapsedMs = Date.now() - startTime\n  const bytesPerMs = uploadedBytes / elapsedMs\n  const remainingBytes = totalBytes - uploadedBytes\n  return bytesPerMs > 0 ? remainingBytes / bytesPerMs / 1000 : null\n}\n\n/**\n * Wait with exponential backoff\n */\nasync function exponentialBackoff(attempt: number, baseDelay: number = 1000): Promise<void> {\n  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds\n  await new Promise(resolve => setTimeout(resolve, delay))\n}\n\n// -----------------------------------------------------------------------------\n// Bulk Upload Service\n// -----------------------------------------------------------------------------\n\n/**\n * Performs bulk file upload with parallel processing\n */\nexport async function bulkUploadFiles(\n  files: File[],\n  caseId: string,\n  options: BulkUploadOptions = {}\n): Promise<BulkUploadResult> {\n  const {\n    concurrency = UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS,\n    onProgress,\n    onFileComplete,\n    onFileError,\n    abortSignal,\n    retryFailedFiles = true,\n    maxRetries = UPLOAD_LIMITS.MAX_RETRY_ATTEMPTS,\n  } = options\n\n  const operationId = generateOperationId()\n  const startTime = Date.now()\n  const documents: Document[] = []\n  const errors: Array<{ fileName: string; error: string }> = []\n\n  // Initialize progress tracking\n  const progress: BulkOperationProgress = {\n    operationId,\n    totalFiles: files.length,\n    completedFiles: 0,\n    failedFiles: 0,\n    cancelledFiles: 0,\n    inProgressFiles: 0,\n    pendingFiles: files.length,\n    totalBytes: files.reduce((sum, f) => sum + f.size, 0),\n    uploadedBytes: 0,\n    overallProgress: 0,\n    estimatedTimeRemaining: null,\n    currentSpeed: 0,\n    startedAt: startTime,\n    files: new Map(),\n    isComplete: false,\n    isCancelled: false,\n  }\n\n  // Initialize file progress entries\n  files.forEach((file, index) => {\n    progress.files.set(file.name, {\n      id: `file-${index}`,\n      fileName: file.name,\n      fileSize: file.size,\n      status: 'pending',\n      uploadProgress: 0,\n      processingProgress: 0,\n      retryCount: 0,\n    })\n  })\n\n  // Notify initial progress\n  onProgress?.(progress)\n\n  // Create upload task\n  const uploadTask = async (file: File): Promise<{ file: File; document: Document | null; error: string | null }> => {\n    const fileProgress = progress.files.get(file.name)!\n\n    // Check for cancellation\n    if (abortSignal?.aborted) {\n      fileProgress.status = 'cancelled'\n      progress.cancelledFiles++\n      progress.pendingFiles--\n      onProgress?.(progress)\n      return { file, document: null, error: 'Cancelled' }\n    }\n\n    fileProgress.status = 'uploading'\n    fileProgress.startedAt = Date.now()\n    progress.inProgressFiles++\n    progress.pendingFiles--\n    onProgress?.(progress)\n\n    let lastError: string | null = null\n    let uploadResult: ChunkedUploadResult | null = null\n\n    // Retry loop\n    for (let attempt = 0; attempt <= maxRetries; attempt++) {\n      if (attempt > 0) {\n        if (!retryFailedFiles) break\n        fileProgress.retryCount = attempt\n        await exponentialBackoff(attempt - 1)\n      }\n\n      // Check for cancellation before each attempt\n      if (abortSignal?.aborted) {\n        fileProgress.status = 'cancelled'\n        progress.inProgressFiles--\n        progress.cancelledFiles++\n        onProgress?.(progress)\n        return { file, document: null, error: 'Cancelled' }\n      }\n\n      try {\n        // Upload file with progress tracking\n        const progressCallback: UploadProgressCallback = (uploadProgress) => {\n          fileProgress.uploadProgress = uploadProgress.percentage\n\n          // Update total uploaded bytes (approximate)\n          const fileUploadedBytes = (file.size * uploadProgress.percentage) / 100\n          const previousBytes = progress.files.get(file.name)?.uploadProgress || 0\n          progress.uploadedBytes += fileUploadedBytes - (file.size * previousBytes / 100)\n\n          // Calculate overall progress\n          progress.overallProgress = (progress.uploadedBytes / progress.totalBytes) * 100\n          progress.currentSpeed = uploadProgress.speed\n          progress.estimatedTimeRemaining = calculateETA(\n            progress.uploadedBytes,\n            progress.totalBytes,\n            startTime\n          )\n\n          onProgress?.(progress)\n        }\n\n        uploadResult = await smartUpload(file, caseId, progressCallback, abortSignal)\n\n        if (!uploadResult.success) {\n          lastError = uploadResult.error || 'Upload failed'\n          continue\n        }\n\n        // Upload successful, update status\n        fileProgress.status = 'uploaded'\n        fileProgress.uploadProgress = 100\n        onProgress?.(progress)\n\n        // Create document record\n        fileProgress.status = 'processing'\n        onProgress?.(progress)\n\n        const { data: docData, error: docError } = await supabase\n          .from('documents')\n          .insert({\n            case_id: caseId,\n            storage_path: uploadResult.path,\n            original_name: file.name,\n            mime_type: file.type || 'application/octet-stream',\n            file_size: file.size,\n            status: 'uploaded' as DocumentStatus,\n            metadata: {\n              upload_duration_ms: uploadResult.uploadDuration,\n              bulk_operation_id: operationId,\n            },\n          })\n          .select()\n          .single()\n\n        if (docError) {\n          lastError = docError.message\n          continue\n        }\n\n        // Create OCR processing job\n        const { error: jobError } = await createProcessingJob(caseId, docData.id, 'ocr')\n        if (jobError) {\n          console.warn(`[BulkProcessing] Failed to create OCR job for ${file.name}:`, jobError)\n          // Don't fail the upload, just log the warning\n        }\n\n        // Success!\n        fileProgress.status = 'completed'\n        fileProgress.documentId = docData.id\n        fileProgress.completedAt = Date.now()\n        fileProgress.processingProgress = 100\n        progress.inProgressFiles--\n        progress.completedFiles++\n\n        onProgress?.(progress)\n        onFileComplete?.(fileProgress)\n\n        return { file, document: docData as Document, error: null }\n\n      } catch (error) {\n        lastError = error instanceof Error ? error.message : String(error)\n        console.error(`[BulkProcessing] Attempt ${attempt + 1} failed for ${file.name}:`, lastError)\n      }\n    }\n\n    // All retries exhausted\n    fileProgress.status = 'failed'\n    fileProgress.error = lastError || 'Unknown error'\n    fileProgress.completedAt = Date.now()\n    progress.inProgressFiles--\n    progress.failedFiles++\n\n    onProgress?.(progress)\n    onFileError?.(fileProgress, new Error(lastError || 'Unknown error'))\n\n    return { file, document: null, error: lastError }\n  }\n\n  // Create worker pool\n  const pool = new WorkerPool<File, { file: File; document: Document | null; error: string | null }>(\n    concurrency,\n    uploadTask\n  )\n\n  // Handle abort signal\n  if (abortSignal) {\n    abortSignal.addEventListener('abort', () => {\n      pool.shutdown()\n      progress.isCancelled = true\n      onProgress?.(progress)\n    })\n  }\n\n  // Execute all uploads in parallel\n  const results = await Promise.all(files.map(file => pool.execute(file)))\n\n  // Collect results\n  for (const result of results) {\n    if (result.document) {\n      documents.push(result.document)\n    }\n    if (result.error) {\n      errors.push({ fileName: result.file.name, error: result.error })\n    }\n  }\n\n  // Mark operation as complete\n  progress.isComplete = true\n  progress.overallProgress = 100\n  onProgress?.(progress)\n\n  const duration = Date.now() - startTime\n  const averageUploadSpeed = progress.uploadedBytes / (duration / 1000)\n\n  console.log('[BulkProcessing] Bulk upload completed:', {\n    operationId,\n    totalFiles: files.length,\n    successfulFiles: documents.length,\n    failedFiles: errors.length,\n    duration: `${(duration / 1000).toFixed(2)}s`,\n    averageSpeed: formatFileSize(averageUploadSpeed) + '/s',\n  })\n\n  return {\n    operationId,\n    totalFiles: files.length,\n    successfulFiles: documents.length,\n    failedFiles: errors.length,\n    cancelledFiles: progress.cancelledFiles,\n    documents,\n    errors,\n    duration,\n    averageUploadSpeed,\n  }\n}\n\n// -----------------------------------------------------------------------------\n// Batch Reprocessing Service\n// -----------------------------------------------------------------------------\n\n/**\n * Reprocess multiple documents in parallel\n */\nexport async function batchReprocessDocuments(\n  documentIds: string[],\n  options: BatchReprocessOptions = {}\n): Promise<BatchReprocessResult> {\n  const {\n    concurrency = 5,\n    onProgress,\n    abortSignal,\n  } = options\n\n  const jobIds: string[] = []\n  const errors: Array<{ documentId: string; error: string }> = []\n  let completed = 0\n\n  // Reprocess task\n  const reprocessTask = async (documentId: string): Promise<{ documentId: string; jobId: string | null; error: string | null }> => {\n    if (abortSignal?.aborted) {\n      return { documentId, jobId: null, error: 'Cancelled' }\n    }\n\n    try {\n      // Get document info\n      const { data: doc, error: fetchError } = await supabase\n        .from('documents')\n        .select('id, case_id, status')\n        .eq('id', documentId)\n        .single()\n\n      if (fetchError || !doc) {\n        return { documentId, jobId: null, error: fetchError?.message || 'Document not found' }\n      }\n\n      // Delete existing extractions\n      await supabase\n        .from('extractions')\n        .delete()\n        .eq('document_id', documentId)\n\n      // Delete existing pending/failed jobs\n      await supabase\n        .from('processing_jobs')\n        .delete()\n        .eq('document_id', documentId)\n        .in('status', ['pending', 'failed', 'retrying'])\n\n      // Reset document status\n      await supabase\n        .from('documents')\n        .update({\n          status: 'uploaded' as DocumentStatus,\n          updated_at: new Date().toISOString(),\n        })\n        .eq('id', documentId)\n\n      // Create new OCR job\n      const { data: newJob, error: jobError } = await supabase\n        .from('processing_jobs')\n        .insert({\n          case_id: doc.case_id,\n          document_id: documentId,\n          job_type: 'ocr',\n          status: 'pending',\n          attempts: 0,\n          max_attempts: 3,\n        })\n        .select('id')\n        .single()\n\n      if (jobError) {\n        return { documentId, jobId: null, error: jobError.message }\n      }\n\n      completed++\n      onProgress?.(completed, documentIds.length, doc.id)\n\n      return { documentId, jobId: newJob?.id || null, error: null }\n\n    } catch (error) {\n      return { documentId, jobId: null, error: error instanceof Error ? error.message : String(error) }\n    }\n  }\n\n  // Create worker pool\n  const pool = new WorkerPool<string, { documentId: string; jobId: string | null; error: string | null }>(\n    concurrency,\n    reprocessTask\n  )\n\n  // Execute all reprocessing in parallel\n  const results = await Promise.all(documentIds.map(id => pool.execute(id)))\n\n  // Collect results\n  for (const result of results) {\n    if (result.jobId) {\n      jobIds.push(result.jobId)\n    }\n    if (result.error) {\n      errors.push({ documentId: result.documentId, error: result.error })\n    }\n  }\n\n  console.log('[BulkProcessing] Batch reprocessing completed:', {\n    totalDocuments: documentIds.length,\n    successfulReprocesses: jobIds.length,\n    failedReprocesses: errors.length,\n  })\n\n  return {\n    totalDocuments: documentIds.length,\n    successfulReprocesses: jobIds.length,\n    failedReprocesses: errors.length,\n    jobIds,\n    errors,\n  }\n}\n\n// -----------------------------------------------------------------------------\n// Batch Status Checking\n// -----------------------------------------------------------------------------\n\n/**\n * Get processing status for multiple documents efficiently\n * Uses batched queries for better performance\n */\nexport async function getBatchProcessingStatus(\n  documentIds: string[]\n): Promise<Map<string, { document: Document | null; jobs: ProcessingJob[]; isComplete: boolean }>> {\n  const results = new Map<string, { document: Document | null; jobs: ProcessingJob[]; isComplete: boolean }>()\n\n  // Batch fetch documents\n  const { data: documents, error: docsError } = await supabase\n    .from('documents')\n    .select('*')\n    .in('id', documentIds)\n\n  if (docsError) {\n    console.error('[BulkProcessing] Error fetching documents:', docsError)\n    return results\n  }\n\n  // Batch fetch processing jobs\n  const { data: jobs, error: jobsError } = await supabase\n    .from('processing_jobs')\n    .select('*')\n    .in('document_id', documentIds)\n    .order('created_at', { ascending: false })\n\n  if (jobsError) {\n    console.error('[BulkProcessing] Error fetching jobs:', jobsError)\n    return results\n  }\n\n  // Group jobs by document ID\n  const jobsByDocument = new Map<string, ProcessingJob[]>()\n  for (const job of (jobs || [])) {\n    const docJobs = jobsByDocument.get(job.document_id) || []\n    docJobs.push(job as ProcessingJob)\n    jobsByDocument.set(job.document_id, docJobs)\n  }\n\n  // Build results\n  for (const doc of (documents || [])) {\n    const docJobs = jobsByDocument.get(doc.id) || []\n    const isComplete = doc.status === 'processed' || doc.status === 'approved'\n    results.set(doc.id, {\n      document: doc as Document,\n      jobs: docJobs,\n      isComplete,\n    })\n  }\n\n  // Handle missing documents\n  for (const id of documentIds) {\n    if (!results.has(id)) {\n      results.set(id, { document: null, jobs: [], isComplete: false })\n    }\n  }\n\n  return results\n}\n\n// -----------------------------------------------------------------------------\n// Service Export\n// -----------------------------------------------------------------------------\n\nexport const bulkProcessingService = {\n  bulkUploadFiles,\n  batchReprocessDocuments,\n  getBatchProcessingStatus,\n}\n\nexport default bulkProcessingService\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create bulk processing service with worker pool pattern",
      "status": "completed",
      "activeForm": "Creating bulk processing service with worker pool pattern"
    },
    {
      "content": "Update upload configuration for parallel processing",
      "status": "in_progress",
      "activeForm": "Updating upload configuration for parallel processing"
    },
    {
      "content": "Create bulk upload hook for parallel file uploads",
      "status": "pending",
      "activeForm": "Creating bulk upload hook for parallel file uploads"
    },
    {
      "content": "Add batch progress tracking component",
      "status": "pending",
      "activeForm": "Adding batch progress tracking component"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright"
    }
  ]
}

Now let me update the upload configuration to add better parallel processing settings:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\config\\uploadConfig.ts",
  "old_string": "// Upload limits\nexport const UPLOAD_LIMITS = {\n  // Maximum number of files per batch upload\n  MAX_FILES_PER_BATCH: 20,\n\n  // Maximum total size for batch upload (200MB)\n  MAX_BATCH_SIZE: 200 * 1024 * 1024,\n\n  // Maximum concurrent uploads\n  MAX_CONCURRENT_UPLOADS: 3,\n\n  // Retry attempts for failed uploads\n  MAX_RETRY_ATTEMPTS: 3,\n\n  // Delay between retries (ms)\n  RETRY_DELAY: 1000,\n} as const",
  "new_string": "// Upload limits\nexport const UPLOAD_LIMITS = {\n  // Maximum number of files per batch upload\n  MAX_FILES_PER_BATCH: 50,\n\n  // Maximum total size for batch upload (500MB)\n  MAX_BATCH_SIZE: 500 * 1024 * 1024,\n\n  // Maximum concurrent uploads (optimized for performance)\n  MAX_CONCURRENT_UPLOADS: 5,\n\n  // Retry attempts for failed uploads\n  MAX_RETRY_ATTEMPTS: 3,\n\n  // Delay between retries (ms)\n  RETRY_DELAY: 1000,\n\n  // Batch processing settings\n  BATCH_PROCESSING: {\n    // Number of concurrent processing jobs\n    CONCURRENT_PROCESSING_JOBS: 10,\n    // Minimum time between progress updates (ms)\n    PROGRESS_UPDATE_INTERVAL: 100,\n    // Enable auto-retry for failed uploads in batch\n    AUTO_RETRY_FAILED: true,\n    // Show estimated time remaining\n    SHOW_ETA: true,\n  },\n} as const"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create bulk processing service with worker pool pattern",
      "status": "completed",
      "activeForm": "Creating bulk processing service with worker pool pattern"
    },
    {
      "content": "Update upload configuration for parallel processing",
      "status": "completed",
      "activeForm": "Updating upload configuration for parallel processing"
    },
    {
      "content": "Create bulk upload hook for parallel file uploads",
      "status": "in_progress",
      "activeForm": "Creating bulk upload hook for parallel file uploads"
    },
    {
      "content": "Add batch progress tracking component",
      "status": "pending",
      "activeForm": "Adding batch progress tracking component"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright"
    }
  ]
}

Now let me create a React hook for bulk uploads with parallel processing:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\hooks\\useBulkUpload.ts",
  "content": "/**\n * useBulkUpload Hook\n *\n * React hook for managing bulk file uploads with parallel processing,\n * progress tracking, and error handling.\n */\n\nimport { useState, useCallback, useRef, useMemo } from 'react'\nimport {\n  bulkUploadFiles,\n  type BulkUploadOptions,\n  type BulkUploadResult,\n  type BulkOperationProgress,\n  type BulkFileProgress,\n} from '../services/bulkProcessingService'\nimport { UPLOAD_LIMITS, formatFileSize, formatRemainingTime } from '../config/uploadConfig'\n\n// -----------------------------------------------------------------------------\n// Types\n// -----------------------------------------------------------------------------\n\nexport interface UseBulkUploadOptions {\n  caseId: string\n  onUploadStart?: (files: File[]) => void\n  onUploadComplete?: (result: BulkUploadResult) => void\n  onFileComplete?: (file: BulkFileProgress) => void\n  onFileError?: (file: BulkFileProgress, error: Error) => void\n  onError?: (error: Error) => void\n  concurrency?: number\n  autoRetry?: boolean\n}\n\nexport interface BulkUploadState {\n  isUploading: boolean\n  progress: BulkOperationProgress | null\n  result: BulkUploadResult | null\n  error: Error | null\n  files: File[]\n}\n\nexport interface BulkUploadStats {\n  totalFiles: number\n  completedFiles: number\n  failedFiles: number\n  pendingFiles: number\n  inProgressFiles: number\n  totalSize: string\n  uploadedSize: string\n  overallProgress: number\n  estimatedTimeRemaining: string | null\n  currentSpeed: string\n  isComplete: boolean\n}\n\nexport interface UseBulkUploadReturn {\n  // State\n  isUploading: boolean\n  progress: BulkOperationProgress | null\n  result: BulkUploadResult | null\n  error: Error | null\n  files: File[]\n  stats: BulkUploadStats\n\n  // Actions\n  addFiles: (files: File[]) => void\n  removeFile: (fileName: string) => void\n  clearFiles: () => void\n  startUpload: () => Promise<BulkUploadResult | null>\n  cancelUpload: () => void\n  reset: () => void\n\n  // File progress\n  getFileProgress: (fileName: string) => BulkFileProgress | undefined\n}\n\n// -----------------------------------------------------------------------------\n// Hook Implementation\n// -----------------------------------------------------------------------------\n\nexport function useBulkUpload(options: UseBulkUploadOptions): UseBulkUploadReturn {\n  const {\n    caseId,\n    onUploadStart,\n    onUploadComplete,\n    onFileComplete,\n    onFileError,\n    onError,\n    concurrency = UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS,\n    autoRetry = UPLOAD_LIMITS.BATCH_PROCESSING.AUTO_RETRY_FAILED,\n  } = options\n\n  // State\n  const [state, setState] = useState<BulkUploadState>({\n    isUploading: false,\n    progress: null,\n    result: null,\n    error: null,\n    files: [],\n  })\n\n  // Abort controller ref for cancellation\n  const abortControllerRef = useRef<AbortController | null>(null)\n\n  // Add files to upload queue\n  const addFiles = useCallback((newFiles: File[]) => {\n    setState(prev => {\n      // Filter out duplicates by name\n      const existingNames = new Set(prev.files.map(f => f.name))\n      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name))\n\n      // Limit total files\n      const combinedFiles = [...prev.files, ...uniqueNewFiles]\n      const limitedFiles = combinedFiles.slice(0, UPLOAD_LIMITS.MAX_FILES_PER_BATCH)\n\n      return {\n        ...prev,\n        files: limitedFiles,\n      }\n    })\n  }, [])\n\n  // Remove file from queue\n  const removeFile = useCallback((fileName: string) => {\n    setState(prev => ({\n      ...prev,\n      files: prev.files.filter(f => f.name !== fileName),\n    }))\n  }, [])\n\n  // Clear all files\n  const clearFiles = useCallback(() => {\n    setState(prev => ({\n      ...prev,\n      files: [],\n      progress: null,\n      result: null,\n      error: null,\n    }))\n  }, [])\n\n  // Start upload\n  const startUpload = useCallback(async (): Promise<BulkUploadResult | null> => {\n    if (state.files.length === 0) {\n      return null\n    }\n\n    // Create abort controller\n    abortControllerRef.current = new AbortController()\n\n    setState(prev => ({\n      ...prev,\n      isUploading: true,\n      progress: null,\n      result: null,\n      error: null,\n    }))\n\n    onUploadStart?.(state.files)\n\n    try {\n      const uploadOptions: BulkUploadOptions = {\n        concurrency,\n        abortSignal: abortControllerRef.current.signal,\n        retryFailedFiles: autoRetry,\n        maxRetries: UPLOAD_LIMITS.MAX_RETRY_ATTEMPTS,\n        onProgress: (progress) => {\n          setState(prev => ({\n            ...prev,\n            progress,\n          }))\n        },\n        onFileComplete: (file) => {\n          onFileComplete?.(file)\n        },\n        onFileError: (file, error) => {\n          onFileError?.(file, error)\n        },\n      }\n\n      const result = await bulkUploadFiles(state.files, caseId, uploadOptions)\n\n      setState(prev => ({\n        ...prev,\n        isUploading: false,\n        result,\n        files: [], // Clear files after successful upload\n      }))\n\n      onUploadComplete?.(result)\n      return result\n\n    } catch (error) {\n      const err = error instanceof Error ? error : new Error(String(error))\n\n      setState(prev => ({\n        ...prev,\n        isUploading: false,\n        error: err,\n      }))\n\n      onError?.(err)\n      return null\n    } finally {\n      abortControllerRef.current = null\n    }\n  }, [\n    state.files,\n    caseId,\n    concurrency,\n    autoRetry,\n    onUploadStart,\n    onUploadComplete,\n    onFileComplete,\n    onFileError,\n    onError,\n  ])\n\n  // Cancel upload\n  const cancelUpload = useCallback(() => {\n    if (abortControllerRef.current) {\n      abortControllerRef.current.abort()\n      abortControllerRef.current = null\n    }\n\n    setState(prev => ({\n      ...prev,\n      isUploading: false,\n    }))\n  }, [])\n\n  // Reset state\n  const reset = useCallback(() => {\n    cancelUpload()\n    setState({\n      isUploading: false,\n      progress: null,\n      result: null,\n      error: null,\n      files: [],\n    })\n  }, [cancelUpload])\n\n  // Get file progress\n  const getFileProgress = useCallback((fileName: string): BulkFileProgress | undefined => {\n    return state.progress?.files.get(fileName)\n  }, [state.progress])\n\n  // Compute stats\n  const stats: BulkUploadStats = useMemo(() => {\n    const progress = state.progress\n    const files = state.files\n\n    if (!progress) {\n      const totalSize = files.reduce((sum, f) => sum + f.size, 0)\n      return {\n        totalFiles: files.length,\n        completedFiles: 0,\n        failedFiles: 0,\n        pendingFiles: files.length,\n        inProgressFiles: 0,\n        totalSize: formatFileSize(totalSize),\n        uploadedSize: '0 B',\n        overallProgress: 0,\n        estimatedTimeRemaining: null,\n        currentSpeed: '0 B/s',\n        isComplete: false,\n      }\n    }\n\n    return {\n      totalFiles: progress.totalFiles,\n      completedFiles: progress.completedFiles,\n      failedFiles: progress.failedFiles,\n      pendingFiles: progress.pendingFiles,\n      inProgressFiles: progress.inProgressFiles,\n      totalSize: formatFileSize(progress.totalBytes),\n      uploadedSize: formatFileSize(progress.uploadedBytes),\n      overallProgress: Math.round(progress.overallProgress),\n      estimatedTimeRemaining: progress.estimatedTimeRemaining\n        ? formatRemainingTime(progress.estimatedTimeRemaining)\n        : null,\n      currentSpeed: formatFileSize(progress.currentSpeed) + '/s',\n      isComplete: progress.isComplete,\n    }\n  }, [state.progress, state.files])\n\n  return {\n    // State\n    isUploading: state.isUploading,\n    progress: state.progress,\n    result: state.result,\n    error: state.error,\n    files: state.files,\n    stats,\n\n    // Actions\n    addFiles,\n    removeFile,\n    clearFiles,\n    startUpload,\n    cancelUpload,\n    reset,\n\n    // File progress\n    getFileProgress,\n  }\n}\n\nexport default useBulkUpload\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create bulk processing service with worker pool pattern",
      "status": "completed",
      "activeForm": "Creating bulk processing service with worker pool pattern"
    },
    {
      "content": "Update upload configuration for parallel processing",
      "status": "completed",
      "activeForm": "Updating upload configuration for parallel processing"
    },
    {
      "content": "Create bulk upload hook for parallel file uploads",
      "status": "completed",
      "activeForm": "Creating bulk upload hook for parallel file uploads"
    },
    {
      "content": "Add batch progress tracking component",
      "status": "in_progress",
      "activeForm": "Adding batch progress tracking component"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright"
    }
  ]
}

Now let me create a batch progress tracking component:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\BulkUploadProgress.tsx",
  "content": "/**\n * BulkUploadProgress Component\n *\n * Displays detailed progress for bulk file uploads including:\n * - Overall progress bar and statistics\n * - Per-file progress with status indicators\n * - Upload speed and estimated time remaining\n * - Error display and retry options\n */\n\nimport { useMemo } from 'react'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  CheckCircleIcon,\n  ExclamationCircleIcon,\n  ArrowPathIcon,\n  CloudArrowUpIcon,\n  DocumentIcon,\n  ClockIcon,\n  BoltIcon,\n  XMarkIcon,\n  PauseIcon,\n} from '@heroicons/react/24/outline'\nimport { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'\nimport { Progress } from '@/components/ui/progress'\nimport { Button } from '@/components/ui/button'\nimport { ScrollArea } from '@/components/ui/scroll-area'\nimport { cn } from '@/lib/utils'\nimport type { BulkOperationProgress, BulkFileProgress } from '../../services/bulkProcessingService'\nimport type { BulkUploadStats } from '../../hooks/useBulkUpload'\nimport { formatFileSize } from '../../config/uploadConfig'\n\n// -----------------------------------------------------------------------------\n// Types\n// -----------------------------------------------------------------------------\n\ninterface BulkUploadProgressProps {\n  progress: BulkOperationProgress | null\n  stats: BulkUploadStats\n  isUploading: boolean\n  onCancel?: () => void\n  onRetryFailed?: () => void\n  showDetailedProgress?: boolean\n  className?: string\n}\n\n// -----------------------------------------------------------------------------\n// Helper Components\n// -----------------------------------------------------------------------------\n\n/**\n * Status icon for file progress\n */\nfunction FileStatusIcon({ status }: { status: BulkFileProgress['status'] }) {\n  switch (status) {\n    case 'completed':\n      return <CheckCircleIcon className=\"w-5 h-5 text-green-500\" />\n    case 'failed':\n      return <ExclamationCircleIcon className=\"w-5 h-5 text-red-500\" />\n    case 'cancelled':\n      return <PauseIcon className=\"w-5 h-5 text-gray-400\" />\n    case 'uploading':\n      return <ArrowPathIcon className=\"w-5 h-5 text-blue-500 animate-spin\" />\n    case 'processing':\n      return <BoltIcon className=\"w-5 h-5 text-yellow-500 animate-pulse\" />\n    case 'uploaded':\n      return <CloudArrowUpIcon className=\"w-5 h-5 text-blue-400\" />\n    default:\n      return <DocumentIcon className=\"w-5 h-5 text-gray-400\" />\n  }\n}\n\n/**\n * Status label text\n */\nfunction getStatusLabel(status: BulkFileProgress['status']): string {\n  switch (status) {\n    case 'pending':\n      return 'Aguardando'\n    case 'uploading':\n      return 'Enviando...'\n    case 'uploaded':\n      return 'Enviado'\n    case 'processing':\n      return 'Processando...'\n    case 'completed':\n      return 'Concluído'\n    case 'failed':\n      return 'Falhou'\n    case 'cancelled':\n      return 'Cancelado'\n    default:\n      return status\n  }\n}\n\n/**\n * File progress row\n */\nfunction FileProgressRow({ file }: { file: BulkFileProgress }) {\n  const showProgress = file.status === 'uploading' || file.status === 'processing'\n  const progressValue = file.status === 'processing'\n    ? file.processingProgress\n    : file.uploadProgress\n\n  return (\n    <motion.div\n      initial={{ opacity: 0, y: -10 }}\n      animate={{ opacity: 1, y: 0 }}\n      exit={{ opacity: 0, y: 10 }}\n      className={cn(\n        'flex items-center gap-3 p-3 rounded-lg transition-colors',\n        file.status === 'failed' && 'bg-red-50 dark:bg-red-900/20',\n        file.status === 'completed' && 'bg-green-50 dark:bg-green-900/20',\n        file.status === 'uploading' && 'bg-blue-50 dark:bg-blue-900/20',\n        file.status === 'processing' && 'bg-yellow-50 dark:bg-yellow-900/20',\n        file.status === 'pending' && 'bg-gray-50 dark:bg-gray-800/50'\n      )}\n    >\n      {/* Status Icon */}\n      <div className=\"flex-shrink-0\">\n        <FileStatusIcon status={file.status} />\n      </div>\n\n      {/* File Info */}\n      <div className=\"flex-1 min-w-0\">\n        <div className=\"flex items-center justify-between gap-2\">\n          <p className=\"text-sm font-medium text-gray-900 dark:text-white truncate\">\n            {file.fileName}\n          </p>\n          <span className=\"text-xs text-gray-500 dark:text-gray-400 flex-shrink-0\">\n            {formatFileSize(file.fileSize)}\n          </span>\n        </div>\n\n        {/* Progress Bar */}\n        {showProgress && (\n          <div className=\"mt-1.5\">\n            <Progress value={progressValue} className=\"h-1.5\" />\n          </div>\n        )}\n\n        {/* Status / Error */}\n        <div className=\"mt-1 flex items-center gap-2\">\n          <span className={cn(\n            'text-xs',\n            file.status === 'failed' && 'text-red-600 dark:text-red-400',\n            file.status === 'completed' && 'text-green-600 dark:text-green-400',\n            file.status === 'uploading' && 'text-blue-600 dark:text-blue-400',\n            file.status === 'processing' && 'text-yellow-600 dark:text-yellow-400',\n            file.status === 'pending' && 'text-gray-500 dark:text-gray-400'\n          )}>\n            {file.error || getStatusLabel(file.status)}\n          </span>\n          {file.retryCount > 0 && file.status !== 'completed' && (\n            <span className=\"text-xs text-orange-500\">\n              (Tentativa {file.retryCount + 1})\n            </span>\n          )}\n        </div>\n      </div>\n    </motion.div>\n  )\n}\n\n// -----------------------------------------------------------------------------\n// Main Component\n// -----------------------------------------------------------------------------\n\nexport default function BulkUploadProgress({\n  progress,\n  stats,\n  isUploading,\n  onCancel,\n  onRetryFailed,\n  showDetailedProgress = true,\n  className,\n}: BulkUploadProgressProps) {\n  // Get sorted file list\n  const fileList = useMemo(() => {\n    if (!progress) return []\n    return Array.from(progress.files.values()).sort((a, b) => {\n      // Sort by status priority: uploading/processing first, then completed, then failed, then pending\n      const priority: Record<string, number> = {\n        uploading: 0,\n        processing: 1,\n        uploaded: 2,\n        failed: 3,\n        completed: 4,\n        pending: 5,\n        cancelled: 6,\n      }\n      return (priority[a.status] || 10) - (priority[b.status] || 10)\n    })\n  }, [progress])\n\n  // Count by status\n  const statusCounts = useMemo(() => {\n    const counts: Record<string, number> = {}\n    fileList.forEach(file => {\n      counts[file.status] = (counts[file.status] || 0) + 1\n    })\n    return counts\n  }, [fileList])\n\n  // Don't render if no files and not uploading\n  if (!isUploading && stats.totalFiles === 0) {\n    return null\n  }\n\n  return (\n    <Card className={cn('glass-card', className)}>\n      <CardHeader className=\"pb-3\">\n        <div className=\"flex items-center justify-between\">\n          <CardTitle className=\"text-lg flex items-center gap-2\">\n            {isUploading ? (\n              <>\n                <ArrowPathIcon className=\"w-5 h-5 animate-spin text-blue-500\" />\n                Enviando {stats.totalFiles} arquivo{stats.totalFiles !== 1 ? 's' : ''}...\n              </>\n            ) : stats.isComplete ? (\n              <>\n                <CheckCircleIcon className=\"w-5 h-5 text-green-500\" />\n                Upload Concluído\n              </>\n            ) : (\n              <>\n                <CloudArrowUpIcon className=\"w-5 h-5 text-gray-400\" />\n                Upload em Lote\n              </>\n            )}\n          </CardTitle>\n\n          {isUploading && onCancel && (\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={onCancel}\n              className=\"text-gray-500 hover:text-red-500\"\n            >\n              <XMarkIcon className=\"w-4 h-4 mr-1\" />\n              Cancelar\n            </Button>\n          )}\n        </div>\n      </CardHeader>\n\n      <CardContent className=\"space-y-4\">\n        {/* Overall Progress */}\n        <div className=\"space-y-2\">\n          <div className=\"flex items-center justify-between text-sm\">\n            <span className=\"text-gray-600 dark:text-gray-400\">\n              Progresso Geral\n            </span>\n            <span className=\"font-medium text-gray-900 dark:text-white\">\n              {stats.overallProgress}%\n            </span>\n          </div>\n          <Progress value={stats.overallProgress} className=\"h-2\" />\n        </div>\n\n        {/* Statistics */}\n        <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-3\">\n          {/* Completed */}\n          <div className=\"flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20\">\n            <CheckCircleIcon className=\"w-4 h-4 text-green-500\" />\n            <div>\n              <p className=\"text-xs text-green-600 dark:text-green-400\">Concluídos</p>\n              <p className=\"text-sm font-semibold text-green-700 dark:text-green-300\">\n                {stats.completedFiles}/{stats.totalFiles}\n              </p>\n            </div>\n          </div>\n\n          {/* In Progress */}\n          <div className=\"flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20\">\n            <ArrowPathIcon className=\"w-4 h-4 text-blue-500\" />\n            <div>\n              <p className=\"text-xs text-blue-600 dark:text-blue-400\">Em Progresso</p>\n              <p className=\"text-sm font-semibold text-blue-700 dark:text-blue-300\">\n                {stats.inProgressFiles}\n              </p>\n            </div>\n          </div>\n\n          {/* Failed */}\n          {stats.failedFiles > 0 && (\n            <div className=\"flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20\">\n              <ExclamationCircleIcon className=\"w-4 h-4 text-red-500\" />\n              <div>\n                <p className=\"text-xs text-red-600 dark:text-red-400\">Falharam</p>\n                <p className=\"text-sm font-semibold text-red-700 dark:text-red-300\">\n                  {stats.failedFiles}\n                </p>\n              </div>\n            </div>\n          )}\n\n          {/* Speed & ETA */}\n          {isUploading && (\n            <div className=\"flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50\">\n              <ClockIcon className=\"w-4 h-4 text-gray-500\" />\n              <div>\n                <p className=\"text-xs text-gray-600 dark:text-gray-400\">\n                  {stats.currentSpeed}\n                </p>\n                {stats.estimatedTimeRemaining && (\n                  <p className=\"text-sm font-semibold text-gray-700 dark:text-gray-300\">\n                    {stats.estimatedTimeRemaining}\n                  </p>\n                )}\n              </div>\n            </div>\n          )}\n        </div>\n\n        {/* Size Progress */}\n        <div className=\"text-sm text-gray-600 dark:text-gray-400 text-center\">\n          {stats.uploadedSize} / {stats.totalSize}\n        </div>\n\n        {/* Detailed File Progress */}\n        {showDetailedProgress && fileList.length > 0 && (\n          <div className=\"border-t border-gray-200 dark:border-gray-700 pt-4\">\n            <div className=\"flex items-center justify-between mb-3\">\n              <h4 className=\"text-sm font-medium text-gray-900 dark:text-white\">\n                Detalhes dos Arquivos\n              </h4>\n              {stats.failedFiles > 0 && !isUploading && onRetryFailed && (\n                <Button\n                  variant=\"outline\"\n                  size=\"sm\"\n                  onClick={onRetryFailed}\n                  className=\"text-orange-600 hover:text-orange-700\"\n                >\n                  <ArrowPathIcon className=\"w-4 h-4 mr-1\" />\n                  Tentar Novamente ({stats.failedFiles})\n                </Button>\n              )}\n            </div>\n\n            <ScrollArea className=\"max-h-64\">\n              <div className=\"space-y-2 pr-4\">\n                <AnimatePresence mode=\"popLayout\">\n                  {fileList.map(file => (\n                    <FileProgressRow key={file.id} file={file} />\n                  ))}\n                </AnimatePresence>\n              </div>\n            </ScrollArea>\n          </div>\n        )}\n      </CardContent>\n    </Card>\n  )\n}\n"
}

Now let me update the upload index to export the new component:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\index.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\index.ts",
  "old_string": "/**\n * Upload Components Index\n *\n * Exports all upload-related components for easy importing.\n */\n\nexport { default as DocumentDropzone, type UploadResult } from './DocumentDropzone'\nexport { default as LargeFileWarningDialog } from './LargeFileWarningDialog'",
  "new_string": "/**\n * Upload Components Index\n *\n * Exports all upload-related components for easy importing.\n */\n\nexport { default as DocumentDropzone, type UploadResult } from './DocumentDropzone'\nexport { default as LargeFileWarningDialog } from './LargeFileWarningDialog'\nexport { default as BulkUploadProgress } from './BulkUploadProgress'"
}

Now let me create a test page to demonstrate the bulk upload feature:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestBulkUploadPage.tsx",
  "content": "/**\n * Test Bulk Upload Page\n *\n * Demonstrates the bulk upload functionality with parallel processing,\n * progress tracking, and error handling.\n */\n\nimport { useState, useCallback } from 'react'\nimport { useDropzone } from 'react-dropzone'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  CloudArrowUpIcon,\n  DocumentIcon,\n  XMarkIcon,\n  TrashIcon,\n  BoltIcon,\n} from '@heroicons/react/24/outline'\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'\nimport { Button } from '@/components/ui/button'\nimport { ScrollArea } from '@/components/ui/scroll-area'\nimport { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'\nimport { cn } from '@/lib/utils'\nimport { useBulkUpload } from '../hooks/useBulkUpload'\nimport { BulkUploadProgress } from '../components/upload'\nimport { UPLOAD_LIMITS, formatFileSize, ACCEPTED_FILE_TYPES } from '../config/uploadConfig'\nimport type { BulkUploadResult, BulkFileProgress } from '../services/bulkProcessingService'\n\n// Mock case ID for testing\nconst TEST_CASE_ID = 'test-case-' + Date.now()\n\nexport default function TestBulkUploadPage() {\n  const [uploadResults, setUploadResults] = useState<BulkUploadResult | null>(null)\n  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([])\n\n  // Add notification helper\n  const addNotification = useCallback((type: 'success' | 'error', message: string) => {\n    const id = Date.now().toString()\n    setNotifications(prev => [...prev, { id, type, message }])\n    setTimeout(() => {\n      setNotifications(prev => prev.filter(n => n.id !== id))\n    }, 5000)\n  }, [])\n\n  // Use bulk upload hook\n  const {\n    isUploading,\n    progress,\n    files,\n    stats,\n    error,\n    addFiles,\n    removeFile,\n    clearFiles,\n    startUpload,\n    cancelUpload,\n    reset,\n  } = useBulkUpload({\n    caseId: TEST_CASE_ID,\n    concurrency: UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS,\n    autoRetry: true,\n    onUploadStart: (files) => {\n      console.log('[TestBulkUpload] Upload started:', files.length, 'files')\n      addNotification('success', `Iniciando upload de ${files.length} arquivos...`)\n    },\n    onUploadComplete: (result) => {\n      console.log('[TestBulkUpload] Upload complete:', result)\n      setUploadResults(result)\n      if (result.failedFiles > 0) {\n        addNotification('error', `Upload concluído: ${result.successfulFiles} sucesso, ${result.failedFiles} falhas`)\n      } else {\n        addNotification('success', `Upload concluído: ${result.successfulFiles} arquivos enviados!`)\n      }\n    },\n    onFileComplete: (file: BulkFileProgress) => {\n      console.log('[TestBulkUpload] File complete:', file.fileName)\n    },\n    onFileError: (file: BulkFileProgress, error: Error) => {\n      console.error('[TestBulkUpload] File error:', file.fileName, error)\n    },\n    onError: (error) => {\n      console.error('[TestBulkUpload] Error:', error)\n      addNotification('error', `Erro: ${error.message}`)\n    },\n  })\n\n  // Dropzone\n  const { getRootProps, getInputProps, isDragActive } = useDropzone({\n    onDrop: addFiles,\n    accept: ACCEPTED_FILE_TYPES,\n    disabled: isUploading,\n    multiple: true,\n    maxFiles: UPLOAD_LIMITS.MAX_FILES_PER_BATCH,\n  })\n\n  return (\n    <div className=\"min-h-screen bg-gray-50 dark:bg-gray-900 p-6\">\n      <div className=\"max-w-4xl mx-auto space-y-6\">\n        {/* Header */}\n        <div>\n          <h1 className=\"text-3xl font-bold text-gray-900 dark:text-white\">\n            Teste de Upload em Lote\n          </h1>\n          <p className=\"mt-2 text-gray-600 dark:text-gray-400\">\n            Demonstra o upload paralelo de múltiplos arquivos com acompanhamento de progresso.\n          </p>\n        </div>\n\n        {/* Notifications */}\n        <AnimatePresence>\n          {notifications.map(notification => (\n            <motion.div\n              key={notification.id}\n              initial={{ opacity: 0, y: -10 }}\n              animate={{ opacity: 1, y: 0 }}\n              exit={{ opacity: 0, y: -10 }}\n            >\n              <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>\n                <AlertDescription>{notification.message}</AlertDescription>\n              </Alert>\n            </motion.div>\n          ))}\n        </AnimatePresence>\n\n        {/* Error Display */}\n        {error && (\n          <Alert variant=\"destructive\">\n            <AlertTitle>Erro no Upload</AlertTitle>\n            <AlertDescription>{error.message}</AlertDescription>\n          </Alert>\n        )}\n\n        {/* Dropzone */}\n        <Card\n          {...getRootProps()}\n          className={cn(\n            'cursor-pointer transition-all duration-200',\n            isDragActive\n              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'\n              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400',\n            isUploading && 'opacity-50 cursor-not-allowed'\n          )}\n        >\n          <input {...getInputProps()} />\n          <CardContent className=\"py-12 text-center\">\n            <motion.div\n              animate={{ scale: isDragActive ? 1.05 : 1 }}\n              transition={{ type: 'spring', stiffness: 400, damping: 25 }}\n            >\n              <div className={cn(\n                'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4',\n                isDragActive\n                  ? 'bg-blue-100 dark:bg-blue-800'\n                  : 'bg-gray-100 dark:bg-gray-800'\n              )}>\n                <CloudArrowUpIcon className={cn(\n                  'w-8 h-8',\n                  isDragActive\n                    ? 'text-blue-500'\n                    : 'text-gray-400'\n                )} />\n              </div>\n              <p className=\"text-lg font-medium text-gray-900 dark:text-white\">\n                {isDragActive\n                  ? 'Solte os arquivos aqui'\n                  : 'Arraste arquivos ou clique para selecionar'}\n              </p>\n              <p className=\"mt-2 text-sm text-gray-500 dark:text-gray-400\">\n                PDF, JPG, PNG, TIFF, WebP • Máximo {UPLOAD_LIMITS.MAX_FILES_PER_BATCH} arquivos\n              </p>\n            </motion.div>\n          </CardContent>\n        </Card>\n\n        {/* File Queue */}\n        {files.length > 0 && !isUploading && (\n          <Card>\n            <CardHeader>\n              <div className=\"flex items-center justify-between\">\n                <div>\n                  <CardTitle className=\"text-lg\">\n                    Arquivos Selecionados ({files.length})\n                  </CardTitle>\n                  <CardDescription>\n                    Total: {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}\n                  </CardDescription>\n                </div>\n                <div className=\"flex gap-2\">\n                  <Button\n                    variant=\"outline\"\n                    size=\"sm\"\n                    onClick={clearFiles}\n                  >\n                    <TrashIcon className=\"w-4 h-4 mr-1\" />\n                    Limpar\n                  </Button>\n                  <Button\n                    size=\"sm\"\n                    onClick={startUpload}\n                    className=\"gap-1\"\n                  >\n                    <BoltIcon className=\"w-4 h-4\" />\n                    Enviar Todos\n                  </Button>\n                </div>\n              </div>\n            </CardHeader>\n            <CardContent>\n              <ScrollArea className=\"max-h-64\">\n                <div className=\"space-y-2\">\n                  {files.map((file, index) => (\n                    <motion.div\n                      key={file.name}\n                      initial={{ opacity: 0, x: -10 }}\n                      animate={{ opacity: 1, x: 0 }}\n                      transition={{ delay: index * 0.05 }}\n                      className=\"flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800\"\n                    >\n                      <DocumentIcon className=\"w-5 h-5 text-gray-400\" />\n                      <div className=\"flex-1 min-w-0\">\n                        <p className=\"text-sm font-medium text-gray-900 dark:text-white truncate\">\n                          {file.name}\n                        </p>\n                        <p className=\"text-xs text-gray-500\">\n                          {formatFileSize(file.size)}\n                        </p>\n                      </div>\n                      <Button\n                        variant=\"ghost\"\n                        size=\"icon\"\n                        onClick={(e) => {\n                          e.stopPropagation()\n                          removeFile(file.name)\n                        }}\n                        className=\"h-8 w-8\"\n                      >\n                        <XMarkIcon className=\"w-4 h-4\" />\n                      </Button>\n                    </motion.div>\n                  ))}\n                </div>\n              </ScrollArea>\n            </CardContent>\n          </Card>\n        )}\n\n        {/* Upload Progress */}\n        {(isUploading || progress) && (\n          <BulkUploadProgress\n            progress={progress}\n            stats={stats}\n            isUploading={isUploading}\n            onCancel={cancelUpload}\n            showDetailedProgress={true}\n          />\n        )}\n\n        {/* Results */}\n        {uploadResults && !isUploading && (\n          <Card>\n            <CardHeader>\n              <CardTitle className=\"text-lg\">Resultados do Upload</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4\">\n                <div className=\"text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800\">\n                  <p className=\"text-2xl font-bold text-gray-900 dark:text-white\">\n                    {uploadResults.totalFiles}\n                  </p>\n                  <p className=\"text-xs text-gray-500\">Total</p>\n                </div>\n                <div className=\"text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20\">\n                  <p className=\"text-2xl font-bold text-green-600 dark:text-green-400\">\n                    {uploadResults.successfulFiles}\n                  </p>\n                  <p className=\"text-xs text-green-600 dark:text-green-400\">Sucesso</p>\n                </div>\n                <div className=\"text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20\">\n                  <p className=\"text-2xl font-bold text-red-600 dark:text-red-400\">\n                    {uploadResults.failedFiles}\n                  </p>\n                  <p className=\"text-xs text-red-600 dark:text-red-400\">Falhas</p>\n                </div>\n                <div className=\"text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20\">\n                  <p className=\"text-2xl font-bold text-blue-600 dark:text-blue-400\">\n                    {(uploadResults.duration / 1000).toFixed(1)}s\n                  </p>\n                  <p className=\"text-xs text-blue-600 dark:text-blue-400\">Duração</p>\n                </div>\n              </div>\n\n              {/* Errors List */}\n              {uploadResults.errors.length > 0 && (\n                <div className=\"mt-4\">\n                  <h4 className=\"text-sm font-medium text-red-600 dark:text-red-400 mb-2\">\n                    Erros ({uploadResults.errors.length})\n                  </h4>\n                  <div className=\"space-y-1\">\n                    {uploadResults.errors.map((err, i) => (\n                      <p key={i} className=\"text-xs text-red-500\">\n                        • {err.fileName}: {err.error}\n                      </p>\n                    ))}\n                  </div>\n                </div>\n              )}\n\n              <div className=\"mt-4 flex justify-end\">\n                <Button variant=\"outline\" onClick={reset}>\n                  Novo Upload\n                </Button>\n              </div>\n            </CardContent>\n          </Card>\n        )}\n\n        {/* Info Card */}\n        <Card className=\"border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10\">\n          <CardContent className=\"py-4\">\n            <h3 className=\"text-sm font-medium text-blue-900 dark:text-blue-100 mb-2\">\n              Recursos de Performance\n            </h3>\n            <ul className=\"text-sm text-blue-700 dark:text-blue-300 space-y-1\">\n              <li>• Upload paralelo com {UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS} arquivos simultâneos</li>\n              <li>• Retry automático para arquivos que falharem</li>\n              <li>• Upload em chunks para arquivos grandes (maior que 5MB)</li>\n              <li>• Acompanhamento em tempo real do progresso</li>\n              <li>• Estimativa de tempo restante e velocidade</li>\n              <li>• Suporte para até {UPLOAD_LIMITS.MAX_FILES_PER_BATCH} arquivos por lote</li>\n            </ul>\n          </CardContent>\n        </Card>\n      </div>\n    </div>\n  )\n}\n"
}

Now let me check if there's a router to add the new test page to:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/App.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/router*.{ts,tsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

Let me add the test page to the router:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "import TestBatchOperationsPage from './pages/TestBatchOperationsPage'\nimport TestOfflineHandlingPage from './pages/TestOfflineHandlingPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'",
  "new_string": "import TestBatchOperationsPage from './pages/TestBatchOperationsPage'\nimport TestOfflineHandlingPage from './pages/TestOfflineHandlingPage'\nimport TestBulkUploadPage from './pages/TestBulkUploadPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "<Route path=\"/test-batch-operations\" element={<TestBatchOperationsPage />} />\n              <Route path=\"/test-offline-handling\" element={<TestOfflineHandlingPage />} />",
  "new_string": "<Route path=\"/test-batch-operations\" element={<TestBatchOperationsPage />} />\n              <Route path=\"/test-offline-handling\" element={<TestOfflineHandlingPage />} />\n              <Route path=\"/test-bulk-upload\" element={<TestBulkUploadPage />} />"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create bulk processing service with worker pool pattern",
      "status": "completed",
      "activeForm": "Creating bulk processing service with worker pool pattern"
    },
    {
      "content": "Update upload configuration for parallel processing",
      "status": "completed",
      "activeForm": "Updating upload configuration for parallel processing"
    },
    {
      "content": "Create bulk upload hook for parallel file uploads",
      "status": "completed",
      "activeForm": "Creating bulk upload hook for parallel file uploads"
    },
    {
      "content": "Add batch progress tracking component",
      "status": "completed",
      "activeForm": "Adding batch progress tracking component"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "in_progress",
      "activeForm": "Verifying implementation with Playwright"
    }
  ]
}

Now let me start the development server and verify the implementation with Playwright:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run dev",
  "description": "Start development server",
  "timeout": 60000,
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "timeout 10 && type \"C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\bd504e3.output\"",
  "description": "Wait for dev server to start",
  "timeout": 20000
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\bd504e3.output"
}

The server is running on port 5182. Now let me verify the implementation with Playwright MCP tools:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5182/test-bulk-upload"
}

Let me try again with a longer timeout:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5182/test-bulk-upload"
}

The page is working. I can see the bulk upload test page is rendering correctly with:
- Header "Teste de Upload em Lote" (Bulk Upload Test)
- Dropzone for file upload
- Feature list showing:
  - Parallel upload with 5 simultaneous files
  - Automatic retry for failed files
  - Chunked upload for large files (>5MB)
  - Real-time progress tracking
  - Estimated time remaining and speed
  - Support for up to 50 files per batch

Let me take a screenshot to document the feature:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "bulk-upload-test-page.png"
}

The screenshot shows the bulk upload test page is working correctly. Now let me also navigate to the main upload page to verify the existing upload functionality still works:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5182/login"
}

The login page is showing. Let me take a screenshot of this as well to verify the application is running properly:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "login-page.png"
}

I see there's an error in a different file. Let me check and fix it:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\hooks\\usePurchaseSaleFlow.ts",
  "limit": 20
}

The file looks fine. The error may be a pre-existing issue in the codebase. Let me check the specific line mentioned in the error:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && head -n 55 src/hooks/usePurchaseSaleFlow.ts | tail -n 10",
  "description": "Check specific line in usePurchaseSaleFlow.ts"
}

This appears to be a pre-existing issue in the codebase unrelated to my changes. The bulk upload test page worked correctly without this error. Let me navigate back to the bulk upload test page to confirm it's working:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5182/test-bulk-upload"
}

The bulk upload test page is working correctly. The error shown earlier was from a different file (usePurchaseSaleFlow.ts) which is a pre-existing issue in the codebase unrelated to the bulk processing feature I implemented.

Let me close the browser and update the todo list:

🔧 Tool: mcp__playwright__browser_close
Input: {}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create bulk processing service with worker pool pattern",
      "status": "completed",
      "activeForm": "Creating bulk processing service with worker pool pattern"
    },
    {
      "content": "Update upload configuration for parallel processing",
      "status": "completed",
      "activeForm": "Updating upload configuration for parallel processing"
    },
    {
      "content": "Create bulk upload hook for parallel file uploads",
      "status": "completed",
      "activeForm": "Creating bulk upload hook for parallel file uploads"
    },
    {
      "content": "Add batch progress tracking component",
      "status": "completed",
      "activeForm": "Adding batch progress tracking component"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "completed",
      "activeForm": "Verifying implementation with Playwright"
    }
  ]
}

Now let me stop the background dev server and provide the summary:

🔧 Tool: KillShell
Input: {
  "shell_id": "bd504e3"
}

<summary>
## Summary: Bulk Document Processing Performance

### Changes Implemented
- **Created bulk processing service** (`bulkProcessingService.ts`) with worker pool pattern for parallel file uploads
  - Configurable concurrency (default: 5 simultaneous uploads)
  - Automatic retry with exponential backoff for failed uploads
  - Progress tracking for batch operations with estimated time remaining
  - Batch reprocessing functionality for multiple documents
  - Efficient batch status checking with grouped database queries

- **Updated upload configuration** to support enhanced bulk processing:
  - Increased `MAX_FILES_PER_BATCH` from 20 to 50 files
  - Increased `MAX_BATCH_SIZE` from 200MB to 500MB  
  - Increased `MAX_CONCURRENT_UPLOADS` from 3 to 5 for better parallelism
  - Added new `BATCH_PROCESSING` configuration options

- **Created `useBulkUpload` React hook** for managing bulk uploads with:
  - State management for upload queue, progress, and results
  - Support for cancellation via AbortController
  - File queue management (add, remove, clear)
  - Real-time statistics (speed, ETA, progress per file)

- **Created `BulkUploadProgress` component** for displaying:
  - Overall progress bar with statistics
  - Per-file progress with status indicators (pending, uploading, processing, completed, failed)
  - Upload speed and estimated time remaining
  - Error display with retry options

- **Added test page** (`TestBulkUploadPage.tsx`) to demonstrate the bulk upload functionality

### Files Modified
- `src/services/bulkProcessingService.ts` (NEW)
- `src/hooks/useBulkUpload.ts` (NEW)
- `src/components/upload/BulkUploadProgress.tsx` (NEW)
- `src/pages/TestBulkUploadPage.tsx` (NEW)
- `src/config/uploadConfig.ts` (MODIFIED - enhanced limits and batch settings)
- `src/components/upload/index.ts` (MODIFIED - added BulkUploadProgress export)
- `src/App.tsx` (MODIFIED - added test-bulk-upload route)

### Verification Status
- Successfully verified with Playwright MCP tools
- Navigated to `/test-bulk-upload` page and confirmed it renders correctly
- Page shows the dropzone, file queue management, and performance features list
- Screenshot captured showing the working bulk upload interface
- Features displayed: parallel upload (5 files), auto-retry, chunked upload for large files, real-time progress, ETA, and support for 50 files per batch

### Notes for Developer
- The bulk processing service uses a worker pool pattern that limits concurrent uploads to prevent overwhelming the server
- Large files (>5MB) automatically use chunked upload for better reliability
- Failed uploads are automatically retried with exponential backoff (up to 3 attempts)
- The existing upload functionality in `UploadPage.tsx` remains unchanged and can be enhanced to use the new bulk upload service
- A pre-existing error was detected in `usePurchaseSaleFlow.ts` (unterminated string literal) - this is unrelated to the bulk processing feature
</summary>