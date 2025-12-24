import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type {
  ConflictField,
  ConflictsSummary,
  Extraction,
  ResolveConflictRequest,
  ResolveConflictResponse,
} from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper to get signed URLs for document storage
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Error getting signed URL:', error)
    return null
  }

  return data.signedUrl
}

// Helper to upload document
export async function uploadDocument(
  file: File,
  caseId: string
): Promise<{ path: string; error: Error | null }> {
  const fileName = `${caseId}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { path: '', error }
  }

  return { path: data.path, error: null }
}

// Subscribe to realtime changes for a case
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

// Subscribe to processing jobs for a specific document
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

// Create a processing job for a document or case
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

// Update document status
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

// Get extraction by document ID
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

// Get conflicts for a specific extraction
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

// Get conflicts summary for an extraction
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

// Get all conflicts for a case (across all documents)
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

// Get pending conflicts for a case (only conflicts that need review)
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

// Resolve a specific conflict
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

// Bulk resolve multiple conflicts
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

// Trigger consensus job for a document
export async function triggerConsensusJob(
  caseId: string,
  documentId: string
): Promise<{ data: { id: string } | null; error: Error | null }> {
  return createProcessingJob(caseId, documentId, 'consensus')
}

// Subscribe to consensus updates for a case
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

// Check if all conflicts are resolved for an extraction
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

// Get document with extraction and conflicts
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

export default supabase
