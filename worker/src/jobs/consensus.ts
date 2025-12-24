import { SupabaseClient } from '@supabase/supabase-js'
import type {
  ProcessingJob,
  OcrResult,
  ExtractionResult,
  ConsensusResult,
  ConflictField,
} from '../types'
import { ConsensusEngine, type ConsensusInput } from '../services/ConsensusEngine'

/**
 * Stored consensus result in the extractions table
 * Extended version of ConsensusResult with additional metadata
 */
interface StoredConsensusResult extends ConsensusResult {
  processed_at: string
  document_id: string
  version: number
}

/**
 * Run consensus job to compare OCR and LLM extraction results
 *
 * This job:
 * 1. Fetches OCR and LLM results from the extractions table
 * 2. Uses ConsensusEngine to compare fields and identify conflicts
 * 3. Stores the consensus result back to the extractions table
 * 4. Updates document status based on pending fields
 */
export async function runConsensusJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running consensus job for document ${job.document_id}`)

  if (!job.document_id) {
    throw new Error('No document_id provided for consensus job')
  }

  // 1. Fetch the extraction record with OCR and LLM results
  const { data: extraction, error: extractionError } = await supabase
    .from('extractions')
    .select('*')
    .eq('document_id', job.document_id)
    .single()

  if (extractionError) {
    throw new Error(`Failed to fetch extraction: ${extractionError.message}`)
  }

  if (!extraction) {
    throw new Error(`No extraction found for document ${job.document_id}`)
  }

  // 2. Extract OCR and LLM results
  const ocrResult = extraction.ocr_result as OcrResult | null
  const llmResult = extraction.llm_result as ExtractionResult | null

  // Validate that we have at least one result to work with
  if (!ocrResult && !llmResult) {
    console.warn(`No OCR or LLM results found for document ${job.document_id}, skipping consensus`)

    // Update document status to indicate missing data
    await supabase
      .from('documents')
      .update({
        status: 'needs_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.document_id)

    return {
      status: 'completed',
      consensus: null,
      pending_fields: [],
      message: 'No OCR or LLM results available for consensus',
    }
  }

  // 3. Initialize ConsensusEngine and process results
  const consensusEngine = new ConsensusEngine()

  const consensusInput: ConsensusInput = {
    ocrResult,
    llmResult,
    ocrConfidence: ocrResult?.confidence,
    llmConfidence: llmResult?.confidence,
    documentId: job.document_id,
  }

  console.log(`Processing consensus for document ${job.document_id}...`)
  const consensusResult = consensusEngine.process(consensusInput)

  // 4. Build stored consensus result with metadata
  const storedConsensus: StoredConsensusResult = {
    ...consensusResult,
    processed_at: new Date().toISOString(),
    document_id: job.document_id,
    version: 1,
  }

  // 5. Extract pending field paths for the pending_fields column
  const pendingFieldPaths = consensusResult.conflicts
    .filter(c => c.status === 'pending')
    .map(c => c.fieldPath)

  // 6. Update the extraction record with consensus result
  const { error: updateError } = await supabase
    .from('extractions')
    .update({
      consensus: storedConsensus as unknown as Record<string, unknown>,
      pending_fields: pendingFieldPaths,
    })
    .eq('id', extraction.id)

  if (updateError) {
    throw new Error(`Failed to update extraction with consensus: ${updateError.message}`)
  }

  console.log(
    `Consensus completed: ${consensusResult.confirmed_fields}/${consensusResult.total_fields} confirmed, ` +
    `${consensusResult.pending_fields} pending, overall confidence: ${consensusResult.overall_confidence.toFixed(2)}`
  )

  // 7. Determine document status based on consensus results
  const hasCriticalPending = consensusEngine.getRequiredPendingFields(consensusResult).length > 0
  const hasTooManyPending = consensusEngine.hasTooManyPendingFields(consensusResult)
  const documentStatus = determineDocumentStatus(
    consensusResult,
    hasCriticalPending,
    hasTooManyPending
  )

  // 8. Update document status
  await supabase
    .from('documents')
    .update({
      status: documentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.document_id)

  console.log(`Document ${job.document_id} status updated to: ${documentStatus}`)

  // 9. Return job result summary
  return {
    status: 'completed',
    consensus: {
      total_fields: consensusResult.total_fields,
      confirmed_fields: consensusResult.confirmed_fields,
      pending_fields: consensusResult.pending_fields,
      overall_confidence: consensusResult.overall_confidence,
    },
    pending_field_paths: pendingFieldPaths,
    conflicts_summary: summarizeConflicts(consensusResult.conflicts),
    document_status: documentStatus,
  }
}

/**
 * Determine the appropriate document status based on consensus results
 */
function determineDocumentStatus(
  consensusResult: ConsensusResult,
  hasCriticalPending: boolean,
  hasTooManyPending: boolean
): 'processed' | 'needs_review' {
  // If there are critical pending fields or too many pending fields, mark for review
  if (hasCriticalPending || hasTooManyPending) {
    return 'needs_review'
  }

  // If there are any pending fields, mark for review
  if (consensusResult.pending_fields > 0) {
    return 'needs_review'
  }

  // If overall confidence is too low, mark for review
  if (consensusResult.overall_confidence < 0.7) {
    return 'needs_review'
  }

  // All fields confirmed with acceptable confidence
  return 'processed'
}

/**
 * Create a summary of conflicts grouped by reason
 */
function summarizeConflicts(conflicts: ConflictField[]): Record<string, number> {
  const summary: Record<string, number> = {}

  for (const conflict of conflicts) {
    if (conflict.status === 'pending' && conflict.conflictReason) {
      const reason = conflict.conflictReason
      summary[reason] = (summary[reason] || 0) + 1
    }
  }

  return summary
}
