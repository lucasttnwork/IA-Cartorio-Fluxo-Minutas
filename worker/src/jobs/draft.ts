import { SupabaseClient } from '@supabase/supabase-js'
import type { ProcessingJob } from '../types'

export async function runDraftJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running draft generation job for case ${job.case_id}`)

  // TODO: Implement draft generation
  // 1. Get canonical data from case
  // 2. Get graph edges (relationships)
  // 3. Apply business rules validation
  // 4. Generate draft using Gemini Pro with template
  // 5. Create sections and identify pending items
  // 6. Save to drafts table

  // Placeholder implementation
  const result = {
    status: 'completed',
    draft_id: null,
    version: 1,
    pending_items: [],
  }

  return result
}
