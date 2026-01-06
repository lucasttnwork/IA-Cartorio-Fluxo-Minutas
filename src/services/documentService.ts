/**
 * Document Service
 *
 * Handles document operations including cascade deletion of associated data.
 *
 * When a document is deleted, the following associated data is removed:
 * 1. Storage file (from Supabase storage)
 * 2. Extractions (automatically via ON DELETE CASCADE)
 * 3. Evidence records (automatically via ON DELETE CASCADE)
 * 4. Processing jobs (automatically via ON DELETE CASCADE)
 * 5. References in people.source_docs array (manually cleaned)
 * 6. References in properties.source_docs array (manually cleaned)
 */

import { supabase } from '../lib/supabase'

export interface DeleteDocumentResult {
  success: boolean
  error?: string
  deletedDocumentId?: string
  cleanedPeopleCount?: number
  cleanedPropertiesCount?: number
}

/**
 * Deletes a document and all associated data
 *
 * This function handles the complete cleanup of:
 * - Document file from storage
 * - Document record from database (triggers cascade delete for extractions, evidence, processing_jobs)
 * - References to this document in people.source_docs arrays
 * - References to this document in properties.source_docs arrays
 *
 * @param documentId - The UUID of the document to delete
 * @param storagePath - The storage path for the document file (optional, will be fetched if not provided)
 * @returns Promise<DeleteDocumentResult> - Result of the deletion operation
 */
export async function deleteDocument(
  documentId: string,
  storagePath?: string
): Promise<DeleteDocumentResult> {
  try {
    // Step 1: Get document info if storage path not provided
    let docStoragePath = storagePath
    let docCaseId: string | null = null

    if (!docStoragePath) {
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path, case_id')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        console.error('[DocumentService] Error fetching document:', fetchError)
        return {
          success: false,
          error: `Failed to fetch document: ${fetchError.message}`,
        }
      }

      if (!doc) {
        return {
          success: false,
          error: 'Document not found',
        }
      }

      docStoragePath = doc.storage_path
      docCaseId = doc.case_id
    }

    // Step 2: Remove document reference from people.source_docs arrays
    // This is necessary because source_docs is a UUID[] array, not a foreign key
    let cleanedPeopleCount = 0
    if (docCaseId) {
      const { data: affectedPeople, error: peopleQueryError } = await supabase
        .from('people')
        .select('id, source_docs')
        .eq('case_id', docCaseId)
        .contains('source_docs', [documentId])

      if (!peopleQueryError && affectedPeople && affectedPeople.length > 0) {
        for (const person of affectedPeople) {
          const updatedSourceDocs = (person.source_docs || []).filter(
            (docId: string) => docId !== documentId
          )

          const { error: updateError } = await supabase
            .from('people')
            .update({ source_docs: updatedSourceDocs })
            .eq('id', person.id)

          if (!updateError) {
            cleanedPeopleCount++
          } else {
            console.warn(
              `[DocumentService] Failed to update source_docs for person ${person.id}:`,
              updateError
            )
          }
        }
      }
    }

    // Step 3: Remove document reference from properties.source_docs arrays
    let cleanedPropertiesCount = 0
    if (docCaseId) {
      const { data: affectedProperties, error: propertiesQueryError } = await supabase
        .from('properties')
        .select('id, source_docs')
        .eq('case_id', docCaseId)
        .contains('source_docs', [documentId])

      if (!propertiesQueryError && affectedProperties && affectedProperties.length > 0) {
        for (const property of affectedProperties) {
          const updatedSourceDocs = (property.source_docs || []).filter(
            (docId: string) => docId !== documentId
          )

          const { error: updateError } = await supabase
            .from('properties')
            .update({ source_docs: updatedSourceDocs })
            .eq('id', property.id)

          if (!updateError) {
            cleanedPropertiesCount++
          } else {
            console.warn(
              `[DocumentService] Failed to update source_docs for property ${property.id}:`,
              updateError
            )
          }
        }
      }
    }

    // Step 4: Delete from storage
    if (docStoragePath) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([docStoragePath])

      if (storageError) {
        console.warn('[DocumentService] Storage deletion warning:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Step 5: Delete the document record from database
    // This will automatically cascade delete:
    // - extractions (via ON DELETE CASCADE)
    // - evidence (via ON DELETE CASCADE)
    // - processing_jobs (via ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('[DocumentService] Error deleting document:', deleteError)
      return {
        success: false,
        error: `Failed to delete document: ${deleteError.message}`,
      }
    }

    console.log('[DocumentService] Document deleted successfully:', {
      documentId,
      cleanedPeopleCount,
      cleanedPropertiesCount,
    })

    return {
      success: true,
      deletedDocumentId: documentId,
      cleanedPeopleCount,
      cleanedPropertiesCount,
    }
  } catch (error) {
    console.error('[DocumentService] Unexpected error during document deletion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Deletes multiple documents and all their associated data
 *
 * @param documentIds - Array of document UUIDs to delete
 * @returns Promise<{ results: DeleteDocumentResult[], successCount: number, failureCount: number }>
 */
export async function deleteDocuments(
  documentIds: string[]
): Promise<{
  results: DeleteDocumentResult[]
  successCount: number
  failureCount: number
}> {
  const results: DeleteDocumentResult[] = []
  let successCount = 0
  let failureCount = 0

  for (const documentId of documentIds) {
    const result = await deleteDocument(documentId)
    results.push(result)

    if (result.success) {
      successCount++
    } else {
      failureCount++
    }
  }

  console.log('[DocumentService] Batch deletion complete:', {
    total: documentIds.length,
    successCount,
    failureCount,
  })

  return {
    results,
    successCount,
    failureCount,
  }
}

/**
 * Gets all data associated with a document (for preview before deletion)
 *
 * @param documentId - The UUID of the document
 * @returns Promise with counts of associated data
 */
export async function getDocumentAssociatedData(documentId: string): Promise<{
  extractionsCount: number
  evidenceCount: number
  processingJobsCount: number
  referencedByPeople: number
  referencedByProperties: number
}> {
  const [
    { count: extractionsCount },
    { count: evidenceCount },
    { count: processingJobsCount },
    { data: doc },
  ] = await Promise.all([
    supabase.from('extractions').select('*', { count: 'exact', head: true }).eq('document_id', documentId),
    supabase.from('evidence').select('*', { count: 'exact', head: true }).eq('document_id', documentId),
    supabase.from('processing_jobs').select('*', { count: 'exact', head: true }).eq('document_id', documentId),
    supabase.from('documents').select('case_id').eq('id', documentId).single(),
  ])

  let referencedByPeople = 0
  let referencedByProperties = 0

  if (doc?.case_id) {
    const [{ count: peopleCount }, { count: propertiesCount }] = await Promise.all([
      supabase.from('people').select('*', { count: 'exact', head: true }).eq('case_id', doc.case_id).contains('source_docs', [documentId]),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('case_id', doc.case_id).contains('source_docs', [documentId]),
    ])
    referencedByPeople = peopleCount || 0
    referencedByProperties = propertiesCount || 0
  }

  return {
    extractionsCount: extractionsCount || 0,
    evidenceCount: evidenceCount || 0,
    processingJobsCount: processingJobsCount || 0,
    referencedByPeople,
    referencedByProperties,
  }
}

export interface ReprocessDocumentResult {
  success: boolean
  error?: string
  documentId?: string
  jobId?: string
}

/**
 * Reprocesses a document by:
 * 1. Clearing existing extractions
 * 2. Resetting document status to 'uploaded'
 * 3. Creating a new OCR processing job
 *
 * This allows a document to be re-analyzed when:
 * - Initial processing failed
 * - OCR results were poor
 * - User wants to re-extract data with updated settings
 *
 * @param documentId - The UUID of the document to reprocess
 * @returns Promise<ReprocessDocumentResult> - Result of the reprocessing operation
 */
export async function reprocessDocument(
  documentId: string
): Promise<ReprocessDocumentResult> {
  try {
    // Step 1: Get document info
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, case_id, status')
      .eq('id', documentId)
      .single()

    if (fetchError) {
      console.error('[DocumentService] Error fetching document:', fetchError)
      return {
        success: false,
        error: `Failed to fetch document: ${fetchError.message}`,
      }
    }

    if (!doc) {
      return {
        success: false,
        error: 'Document not found',
      }
    }

    // Step 2: Delete existing extractions for this document
    // This clears OCR results, LLM results, and consensus data
    const { error: deleteExtractionsError } = await supabase
      .from('extractions')
      .delete()
      .eq('document_id', documentId)

    if (deleteExtractionsError) {
      console.warn('[DocumentService] Warning: Failed to delete extractions:', deleteExtractionsError)
      // Continue anyway - new extraction will be created
    }

    // Step 3: Delete any existing pending or failed processing jobs for this document
    const { error: deleteJobsError } = await supabase
      .from('processing_jobs')
      .delete()
      .eq('document_id', documentId)
      .in('status', ['pending', 'failed', 'retrying'])

    if (deleteJobsError) {
      console.warn('[DocumentService] Warning: Failed to delete old jobs:', deleteJobsError)
      // Continue anyway
    }

    // Step 4: Reset document status to 'uploaded'
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('[DocumentService] Error updating document status:', updateError)
      return {
        success: false,
        error: `Failed to update document status: ${updateError.message}`,
      }
    }

    // Step 5: Create a new OCR processing job
    const { data: newJob, error: createJobError } = await supabase
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

    if (createJobError) {
      console.error('[DocumentService] Error creating processing job:', createJobError)
      return {
        success: false,
        error: `Failed to create processing job: ${createJobError.message}`,
      }
    }

    console.log('[DocumentService] Document queued for reprocessing:', {
      documentId,
      jobId: newJob?.id,
    })

    return {
      success: true,
      documentId,
      jobId: newJob?.id,
    }
  } catch (error) {
    console.error('[DocumentService] Unexpected error during document reprocessing:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
