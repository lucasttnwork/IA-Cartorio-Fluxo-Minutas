import { SupabaseClient } from '@supabase/supabase-js'
import type { ProcessingJob } from '../types'

export async function runExtractionJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running extraction job for document ${job.document_id}`)

  // TODO: Implement Gemini multimodal extraction
  // 1. Get document from Supabase Storage using signed URL
  // 2. Send to Gemini Flash with structured output schema
  // 3. Parse response and validate JSON structure
  // 4. Save to extractions table

  // Placeholder implementation
  const result = {
    status: 'completed',
    document_type: 'cnh',
    extracted_data: {},
    confidence: 0.90,
  }

  return result
}
