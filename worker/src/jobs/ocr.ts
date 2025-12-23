import { SupabaseClient } from '@supabase/supabase-js'
import type { ProcessingJob } from '../types'

export async function runOcrJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running OCR job for document ${job.document_id}`)

  // TODO: Implement Google Document AI OCR integration
  // 1. Get document from Supabase Storage using signed URL
  // 2. Send to Document AI for OCR
  // 3. Parse response and extract text with layout
  // 4. Save to extractions table

  // Placeholder implementation
  const result = {
    status: 'completed',
    text: 'OCR text placeholder',
    blocks: [],
    confidence: 0.95,
  }

  // Update document status
  if (job.document_id) {
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', job.document_id)
  }

  return result
}
