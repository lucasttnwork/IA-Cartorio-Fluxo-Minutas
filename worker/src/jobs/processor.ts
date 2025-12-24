import { SupabaseClient } from '@supabase/supabase-js'
import { runOcrJob } from './ocr'
import { runExtractionJob } from './extraction'
import { runConsensusJob } from './consensus'
import { runEntityResolutionJob } from './entityResolution'
import { runEntityExtractionJob } from './entityExtraction'
import { runDraftJob } from './draft'
import type { ProcessingJob, JobType } from '../types'

export async function processJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  const handlers: Record<
    JobType,
    (supabase: SupabaseClient, job: ProcessingJob) => Promise<Record<string, unknown>>
  > = {
    ocr: runOcrJob,
    extraction: runExtractionJob,
    consensus: runConsensusJob,
    entity_resolution: runEntityResolutionJob,
    entity_extraction: runEntityExtractionJob,
    draft: runDraftJob,
  }

  const handler = handlers[job.job_type]
  if (!handler) {
    throw new Error(`Unknown job type: ${job.job_type}`)
  }

  return await handler(supabase, job)
}
