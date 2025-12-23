import { SupabaseClient } from '@supabase/supabase-js'
import type { ProcessingJob } from '../types'

export async function runEntityResolutionJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running entity resolution job for case ${job.case_id}`)

  // TODO: Implement entity resolution
  // 1. Get all extraction results for the case
  // 2. Group by entity type (person, property)
  // 3. Apply deduplication rules:
  //    - CPF match = auto merge
  //    - Name + birth date + filiation = suggest merge
  //    - Registry number match (property) = auto merge
  // 4. Create/update people and properties tables
  // 5. Create evidence links

  // Placeholder implementation
  const result = {
    status: 'completed',
    people_created: 0,
    properties_created: 0,
    merges_applied: 0,
  }

  return result
}
