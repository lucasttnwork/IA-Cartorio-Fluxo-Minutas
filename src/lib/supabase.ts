import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type {
  ConflictField,
  ConflictsSummary,
  Extraction,
  ResolveConflictRequest,
  ResolveConflictResponse,
} from '../types'

// Import centralized configuration from T001 and T002
import { config, isDevelopment, logEnvironmentInfo } from '../config/environment'
import {
  createSupabaseClientOptions,
  logSupabaseConfig,
  STORAGE_CONFIG,
  validateFileForUpload,
  generateStoragePath,
  withRetry,
  getErrorMessage,
} from './supabaseConfig'

// Note: Additional exports from supabaseConfig are re-exported at the bottom of this file

// ============================================================================
// Supabase Client Initialization
// ============================================================================

/**
 * Create and configure the Supabase client with production-optimized settings.
 * Uses centralized environment configuration for validation and type safety.
 */
function initializeSupabaseClient(): SupabaseClient<Database> {
  const clientOptions = createSupabaseClientOptions()

  // Log configuration in development mode
  if (isDevelopment) {
    logEnvironmentInfo()
    logSupabaseConfig()
  }

  return createClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    clientOptions
  )
}

/**
 * The main Supabase client instance.
 * Configured with production optimizations including:
 * - Automatic token refresh
 * - Session persistence with custom storage key
 * - PKCE flow for enhanced security
 * - Request timeouts
 * - Environment-specific realtime event limits
 */
export const supabase = initializeSupabaseClient()

// ============================================================================
// Storage Helper Functions (Production-Optimized)
// ============================================================================

/**
 * Get a signed URL for document access.
 * Uses production-optimized expiration times from STORAGE_CONFIG.
 *
 * @param path - Path to the document in storage
 * @param expiresIn - Expiration time in seconds (defaults to environment-specific value)
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = STORAGE_CONFIG.signedUrlExpiration
): Promise<string | null> {
  try {
    const { data, error } = await withRetry(async () => {
      return supabase.storage
        .from(STORAGE_CONFIG.documentsBucket)
        .createSignedUrl(path, expiresIn)
    })

    if (error) {
      console.error('Error getting signed URL:', getErrorMessage(error))
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting signed URL after retries:', getErrorMessage(error))
    return null
  }
}

/**
 * Upload a document to Supabase storage.
 * Includes validation, production-optimized cache control, and retry logic.
 *
 * @param file - File to upload
 * @param caseId - Case ID to associate with the document
 * @returns Upload result with path or error
 */
export async function uploadDocument(
  file: File,
  caseId: string
): Promise<{ path: string; error: Error | null }> {
  // Validate file before upload using production config
  const validation = validateFileForUpload(file)
  if (!validation.valid) {
    return { path: '', error: new Error(validation.error) }
  }

  // Generate unique storage path
  const fileName = generateStoragePath(caseId, file.name)

  try {
    const { data, error } = await withRetry(async () => {
      return supabase.storage
        .from(STORAGE_CONFIG.documentsBucket)
        .upload(fileName, file, {
          cacheControl: STORAGE_CONFIG.defaultCacheControl,
          upsert: false,
        })
    })

    if (error) {
      return { path: '', error: new Error(getErrorMessage(error)) }
    }

    return { path: data.path, error: null }
  } catch (error) {
    return { path: '', error: new Error(getErrorMessage(error)) }
  }
}

// ============================================================================
// Realtime Subscription Functions
// ============================================================================

/**
 * Subscribe to realtime changes for a case.
 * Monitors documents, entities (people/properties), drafts, and processing jobs.
 *
 * @param caseId - Case ID to subscribe to
 * @param callbacks - Callback functions for different entity changes
 * @returns Unsubscribe function
 */
export function subscribeToCase(
  caseId: string,
  callbacks: {
    onDocumentChange?: (payload: unknown) => void
    onEntityChange?: (payload: unknown) => void
    onDraftChange?: (payload: unknown) => void
    onProcessingJobChange?: (payload: unknown) => void
  }
) {
  const channel = supabase
    .channel(`case:${caseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onDocumentChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'people',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onEntityChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onEntityChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'drafts',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onDraftChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onProcessingJobChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to processing jobs for a specific document.
 *
 * @param documentId - Document ID to monitor
 * @param callbacks - Callback functions for job and document changes
 * @returns Unsubscribe function
 */
export function subscribeToDocumentProcessing(
  documentId: string,
  callbacks: {
    onJobChange?: (payload: unknown) => void
    onDocumentChange?: (payload: unknown) => void
  }
) {
  const channel = supabase
    .channel(`document:${documentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `document_id=eq.${documentId}`,
      },
      (payload) => callbacks.onJobChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `id=eq.${documentId}`,
      },
      (payload) => callbacks.onDocumentChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================================================
// Processing Job Functions
// ============================================================================

/**
 * Create a processing job for a document or case.
 *
 * @param caseId - Case ID
 * @param documentId - Document ID (null for case-level jobs)
 * @param jobType - Type of processing job
 * @returns Created job data or error
 */
export async function createProcessingJob(
  caseId: string,
  documentId: string | null,
  jobType: 'ocr' | 'extraction' | 'consensus' | 'entity_resolution' | 'entity_extraction' | 'draft'
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('processing_jobs')
    .insert({
      case_id: caseId,
      document_id: documentId,
      job_type: jobType,
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating processing job:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Retry a failed processing job.
 * Checks if job has exceeded max attempts before retrying.
 *
 * @param jobId - Job ID to retry
 * @returns Updated job data or error
 */
export async function retryProcessingJob(jobId: string) {
  // First get the current job to check if it can be retried
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentJob, error: fetchError } = await (supabase as any)
    .from('processing_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (fetchError) {
    console.error('Error fetching job for retry:', fetchError)
    return { data: null, error: fetchError }
  }

  if (!currentJob) {
    const error = new Error('Job not found')
    return { data: null, error }
  }

  // Check if job has exceeded max attempts
  if (currentJob.attempts >= currentJob.max_attempts) {
    const error = new Error(`Job has exceeded maximum retry attempts (${currentJob.max_attempts})`)
    console.error(error.message)
    return { data: null, error }
  }

  // Reset job status to pending and increment attempts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('processing_jobs')
    .update({
      status: 'pending',
      attempts: currentJob.attempts + 1,
      error_message: null,
      started_at: null,
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    console.error('Error retrying processing job:', error)
    return { data: null, error }
  }

  console.log(`Job ${jobId} reset to pending for retry (attempt ${data.attempts}/${data.max_attempts})`)
  return { data, error: null }
}

/**
 * Get all failed processing jobs for a case.
 *
 * @param caseId - Case ID to get failed jobs for
 * @returns List of failed jobs or error
 */
export async function getFailedJobsForCase(caseId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('processing_jobs')
    .select('*')
    .eq('case_id', caseId)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching failed jobs:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// ============================================================================
// Document Status Functions
// ============================================================================

/**
 * Update the status of a document.
 *
 * @param documentId - Document ID to update
 * @param status - New status value
 * @returns Updated document data or error
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'uploaded' | 'processing' | 'processed' | 'needs_review' | 'approved' | 'failed'
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('documents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', documentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating document status:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// ============================================================================
// Consensus API Helper Functions
// ============================================================================

/**
 * Get extraction data by document ID.
 *
 * @param documentId - Document ID to get extraction for
 * @returns Extraction data or null if not found
 */
export async function getExtractionByDocumentId(
  documentId: string
): Promise<{ data: Extraction | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('extractions')
    .select('*')
    .eq('document_id', documentId)
    .single()

  if (error) {
    console.error('Error getting extraction:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get conflicts for a specific extraction.
 *
 * @param extractionId - Extraction ID to get conflicts for
 * @returns List of conflicts or error
 */
export async function getExtractionConflicts(
  extractionId: string
): Promise<{ data: ConflictField[] | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('extractions')
    .select('consensus, document_id')
    .eq('id', extractionId)
    .single()

  if (error) {
    console.error('Error getting extraction conflicts:', error)
    return { data: null, error }
  }

  const conflicts = data?.consensus?.conflicts || []
  return { data: conflicts, error: null }
}

/**
 * Get a summary of conflicts for an extraction.
 *
 * @param extractionId - Extraction ID to get summary for
 * @returns Conflicts summary with counts and details
 */
export async function getConflictsSummary(
  extractionId: string
): Promise<{ data: ConflictsSummary | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('extractions')
    .select('id, document_id, consensus, pending_fields')
    .eq('id', extractionId)
    .single()

  if (error) {
    console.error('Error getting conflicts summary:', error)
    return { data: null, error }
  }

  const conflicts: ConflictField[] = data?.consensus?.conflicts || []
  const pendingConflicts = conflicts.filter(c => c.status === 'pending').length
  const resolvedConflicts = conflicts.filter(c => c.status === 'resolved').length
  const confirmedFields = data?.consensus?.confirmed_fields || 0

  const summary: ConflictsSummary = {
    extractionId: data.id,
    documentId: data.document_id,
    totalConflicts: conflicts.length,
    pendingConflicts,
    resolvedConflicts,
    confirmedFields,
    conflicts,
  }

  return { data: summary, error: null }
}

/**
 * Get all conflicts for a case (across all documents).
 *
 * @param caseId - Case ID to get conflicts for
 * @returns List of conflicts summaries for each document
 */
export async function getCaseConflicts(
  caseId: string
): Promise<{ data: ConflictsSummary[] | null; error: Error | null }> {
  // First get all documents for the case
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documents, error: docError } = await (supabase as any)
    .from('documents')
    .select('id')
    .eq('case_id', caseId)

  if (docError) {
    console.error('Error getting case documents:', docError)
    return { data: null, error: docError }
  }

  if (!documents || documents.length === 0) {
    return { data: [], error: null }
  }

  const documentIds = documents.map((d: { id: string }) => d.id)

  // Get extractions for all documents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: extractions, error: extError } = await (supabase as any)
    .from('extractions')
    .select('id, document_id, consensus, pending_fields')
    .in('document_id', documentIds)

  if (extError) {
    console.error('Error getting case extractions:', extError)
    return { data: null, error: extError }
  }

  const summaries: ConflictsSummary[] = (extractions || []).map((extraction: Extraction) => {
    const conflicts: ConflictField[] = extraction.consensus?.conflicts || []
    const pendingConflicts = conflicts.filter(c => c.status === 'pending').length
    const resolvedConflicts = conflicts.filter(c => c.status === 'resolved').length
    const confirmedFields = extraction.consensus?.confirmed_fields || 0

    return {
      extractionId: extraction.id,
      documentId: extraction.document_id,
      totalConflicts: conflicts.length,
      pendingConflicts,
      resolvedConflicts,
      confirmedFields,
      conflicts,
    }
  })

  return { data: summaries, error: null }
}

/**
 * Get pending conflicts for a case (only conflicts that need review).
 *
 * @param caseId - Case ID to get pending conflicts for
 * @returns List of pending conflicts
 */
export async function getCasePendingConflicts(
  caseId: string
): Promise<{ data: ConflictField[] | null; error: Error | null }> {
  const { data: summaries, error } = await getCaseConflicts(caseId)

  if (error) {
    return { data: null, error }
  }

  const pendingConflicts = (summaries || [])
    .flatMap(s => s.conflicts)
    .filter(c => c.status === 'pending')

  return { data: pendingConflicts, error: null }
}

/**
 * Resolve a specific conflict in an extraction.
 *
 * @param extractionId - Extraction ID containing the conflict
 * @param request - Resolution request with field path and resolved value
 * @param userId - User ID performing the resolution
 * @returns Resolution result
 */
export async function resolveConflict(
  extractionId: string,
  request: ResolveConflictRequest,
  userId: string
): Promise<ResolveConflictResponse> {
  // Get current extraction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: extraction, error: getError } = await (supabase as any)
    .from('extractions')
    .select('*')
    .eq('id', extractionId)
    .single()

  if (getError || !extraction) {
    console.error('Error getting extraction for resolution:', getError)
    return {
      success: false,
      conflict: {} as ConflictField,
      message: 'Extraction not found',
    }
  }

  const consensus = extraction.consensus || { conflicts: [], fields: {} }
  const conflicts: ConflictField[] = consensus.conflicts || []

  // Find the conflict to resolve
  const conflictIndex = conflicts.findIndex(
    (c: ConflictField) => c.fieldPath === request.fieldPath
  )

  if (conflictIndex === -1) {
    return {
      success: false,
      conflict: {} as ConflictField,
      message: `Conflict not found for field: ${request.fieldPath}`,
    }
  }

  // Update the conflict
  const resolvedConflict: ConflictField = {
    ...conflicts[conflictIndex],
    status: 'resolved',
    finalValue: request.resolvedValue,
    reviewedBy: userId,
    reviewedAt: new Date().toISOString(),
    resolutionNote: request.resolutionNote,
  }

  conflicts[conflictIndex] = resolvedConflict

  // Update pending_fields list
  const pendingFields = (extraction.pending_fields || []).filter(
    (field: string) => field !== request.fieldPath
  )

  // Update consensus field with resolved value
  const fields = consensus.fields || {}
  const fieldPath = request.fieldPath
  if (fields[fieldPath]) {
    fields[fieldPath] = {
      ...fields[fieldPath],
      value: request.resolvedValue,
      is_pending: false,
    }
  }

  // Recalculate consensus stats
  const pendingCount = conflicts.filter(c => c.status === 'pending').length
  const confirmedCount = conflicts.filter(c => c.status === 'confirmed' || c.status === 'resolved').length

  const updatedConsensus = {
    ...consensus,
    conflicts,
    fields,
    pending_fields: pendingCount,
    confirmed_fields: confirmedCount,
  }

  // Save the updated extraction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('extractions')
    .update({
      consensus: updatedConsensus,
      pending_fields: pendingFields,
    })
    .eq('id', extractionId)

  if (updateError) {
    console.error('Error updating extraction:', updateError)
    return {
      success: false,
      conflict: resolvedConflict,
      message: 'Failed to save resolution',
    }
  }

  return {
    success: true,
    conflict: resolvedConflict,
    message: 'Conflict resolved successfully',
  }
}

/**
 * Bulk resolve multiple conflicts in an extraction.
 *
 * @param extractionId - Extraction ID containing the conflicts
 * @param resolutions - List of resolution requests
 * @param userId - User ID performing the resolutions
 * @returns Bulk resolution result with success/failure counts
 */
export async function resolveMultipleConflicts(
  extractionId: string,
  resolutions: ResolveConflictRequest[],
  userId: string
): Promise<{ success: boolean; resolved: number; failed: number; errors: string[] }> {
  const errors: string[] = []
  let resolved = 0
  let failed = 0

  for (const request of resolutions) {
    const result = await resolveConflict(extractionId, request, userId)
    if (result.success) {
      resolved++
    } else {
      failed++
      errors.push(result.message || `Failed to resolve ${request.fieldPath}`)
    }
  }

  return {
    success: failed === 0,
    resolved,
    failed,
    errors,
  }
}

/**
 * Trigger a consensus job for a document.
 *
 * @param caseId - Case ID
 * @param documentId - Document ID to process
 * @returns Created job data or error
 */
export async function triggerConsensusJob(
  caseId: string,
  documentId: string
): Promise<{ data: { id: string } | null; error: Error | null }> {
  return createProcessingJob(caseId, documentId, 'consensus')
}

/**
 * Subscribe to consensus updates for a case.
 *
 * @param caseId - Case ID to monitor
 * @param callback - Callback for consensus updates
 * @returns Unsubscribe function
 */
export function subscribeToConsensusUpdates(
  caseId: string,
  callback: (payload: {
    extractionId: string
    documentId: string
    pendingFields: string[]
    conflictsCount: number
  }) => void
) {
  const channel = supabase
    .channel(`consensus:${caseId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'extractions',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        const newData = payload.new
        if (newData.consensus) {
          callback({
            extractionId: newData.id,
            documentId: newData.document_id,
            pendingFields: newData.pending_fields || [],
            conflictsCount: newData.consensus?.conflicts?.length || 0,
          })
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Check if all conflicts are resolved for an extraction.
 *
 * @param extractionId - Extraction ID to check
 * @returns Resolution status with pending count
 */
export async function areAllConflictsResolved(
  extractionId: string
): Promise<{ allResolved: boolean; pendingCount: number; error: Error | null }> {
  const { data, error } = await getConflictsSummary(extractionId)

  if (error) {
    return { allResolved: false, pendingCount: 0, error }
  }

  return {
    allResolved: data?.pendingConflicts === 0,
    pendingCount: data?.pendingConflicts || 0,
    error: null,
  }
}

/**
 * Get a document with its extraction and conflicts data.
 *
 * @param documentId - Document ID to get data for
 * @returns Document with extraction and conflicts
 */
export async function getDocumentWithConflicts(
  documentId: string
): Promise<{
  data: {
    document: { id: string; original_name: string; status: string } | null
    extraction: Extraction | null
    conflicts: ConflictField[]
    pendingCount: number
  } | null
  error: Error | null
}> {
  // Get document info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: document, error: docError } = await (supabase as any)
    .from('documents')
    .select('id, original_name, status')
    .eq('id', documentId)
    .single()

  if (docError) {
    console.error('Error getting document:', docError)
    return { data: null, error: docError }
  }

  // Get extraction
  const { data: extraction, error: extError } = await getExtractionByDocumentId(documentId)

  if (extError) {
    return { data: null, error: extError }
  }

  const conflicts: ConflictField[] = extraction?.consensus?.conflicts || []
  const pendingCount = conflicts.filter(c => c.status === 'pending').length

  return {
    data: {
      document,
      extraction,
      conflicts,
      pendingCount,
    },
    error: null,
  }
}

// ============================================================================
// Re-exports from supabaseConfig
// ============================================================================

// Re-export useful utilities from supabaseConfig for convenience
export {
  // Configuration constants
  STORAGE_CONFIG,
  RETRY_CONFIG,
  AUTH_CONFIG,
  REALTIME_CONFIG,
  CONNECTION_CONFIG,

  // Utility functions
  withRetry,
  validateFileForUpload,
  generateStoragePath,
  getErrorMessage,
  calculateRetryDelay,
  isRetryableStatus,

  // Debug utilities
  logSupabaseConfig,
} from './supabaseConfig'

// Re-export environment utilities
export { config, isDevelopment, isProduction, isTest } from '../config/environment'

// ============================================================================
// Default Export
// ============================================================================

export default supabase
