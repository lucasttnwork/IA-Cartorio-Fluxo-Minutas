import { createClient } from '@supabase/supabase-js'
import { processJob } from './jobs/processor'
import {
  workerConfig,
  logWorkerEnvironmentInfo,
  validateWorkerReadiness,
  getSupabaseClientOptions,
  isProduction,
  ENV,
} from './config/environment'

// ============================================================================
// Environment Validation at Startup
// ============================================================================

// The workerConfig import already validates required environment variables
// and throws a comprehensive error if any are missing. Here we do additional
// readiness checks and log the configuration.

console.log('================================================================================')
console.log(`${workerConfig.app.name} starting...`)
console.log(`Environment: ${ENV}`)
console.log('================================================================================')

// Log environment configuration (safe - no secrets)
logWorkerEnvironmentInfo()

// Validate worker readiness
const readinessCheck = validateWorkerReadiness()
if (!readinessCheck.ready) {
  console.error('Worker readiness check failed:')
  readinessCheck.issues.forEach((issue) => {
    console.error(`  - ${issue}`)
  })
  process.exit(1)
}

if (readinessCheck.issues.length > 0) {
  console.warn('Worker readiness warnings:')
  readinessCheck.issues.forEach((issue) => {
    console.warn(`  - ${issue}`)
  })
}

console.log('Worker readiness check passed!')

// ============================================================================
// Supabase Client Initialization
// ============================================================================

const supabase = createClient(
  workerConfig.supabase.url,
  workerConfig.supabase.serviceRoleKey,
  getSupabaseClientOptions()
)

// ============================================================================
// Configuration from Environment
// ============================================================================

const POLL_INTERVAL = workerConfig.worker.pollInterval
const RETRY_BASE_DELAY = workerConfig.worker.retryBaseDelay
const RETRY_MAX_DELAY = workerConfig.worker.retryMaxDelay

console.log('')
console.log('Worker Configuration:')
console.log(`  Poll interval: ${POLL_INTERVAL}ms`)
console.log(`  Retry base delay: ${RETRY_BASE_DELAY}ms`)
console.log(`  Retry max delay: ${RETRY_MAX_DELAY}ms`)
console.log(`  Max concurrent jobs: ${workerConfig.worker.maxConcurrentJobs}`)
console.log(`  Job timeout: ${workerConfig.worker.jobTimeout}ms`)
console.log('')
console.log('Feature Flags:')
console.log(`  Document AI: ${workerConfig.features.enableDocumentAI ? 'enabled' : 'disabled'}`)
console.log(`  Debug mode: ${workerConfig.features.enableDebugMode ? 'enabled' : 'disabled'}`)
console.log(`  Metrics: ${workerConfig.features.enableMetrics ? 'enabled' : 'disabled'}`)
console.log('')
console.log('================================================================================')
console.log('Worker initialized successfully. Starting job polling...')
console.log('================================================================================')

async function pollForJobs() {
  try {
    // Get next pending job from queue
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      console.error('Error polling for jobs:', error)
      return
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0]
      console.log(`Processing job ${job.id} (type: ${job.job_type})`)

      // Mark job as processing
      await supabase
        .from('processing_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          attempts: job.attempts + 1,
        })
        .eq('id', job.id)

      try {
        const result = await processJob(supabase, job)

        // Mark job as completed
        await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result,
          })
          .eq('id', job.id)

        console.log(`Job ${job.id} completed successfully`)
      } catch (jobError) {
        const errorMessage =
          jobError instanceof Error ? jobError.message : 'Unknown error'
        const errorStack =
          jobError instanceof Error ? jobError.stack : undefined

        console.error(`Job ${job.id} failed (attempt ${job.attempts + 1}/${job.max_attempts}):`, errorMessage)
        if (errorStack) {
          console.error('Stack trace:', errorStack)
        }

        // Check if we should retry
        const shouldRetry = job.attempts + 1 < job.max_attempts
        const newStatus = shouldRetry ? 'retrying' : 'failed'

        // Calculate exponential backoff delay: baseDelay * 2^(attempts)
        // For example: 10s, 20s, 40s, 80s, etc., capped at RETRY_MAX_DELAY
        const retryDelay = shouldRetry
          ? Math.min(
              RETRY_BASE_DELAY * Math.pow(2, job.attempts),
              RETRY_MAX_DELAY
            )
          : 0

        console.log(
          shouldRetry
            ? `Scheduling retry ${job.attempts + 1} for job ${job.id} in ${retryDelay}ms`
            : `Job ${job.id} has exhausted all retry attempts (${job.max_attempts})`
        )

        await supabase
          .from('processing_jobs')
          .update({
            status: newStatus,
            error_message: errorMessage,
            retry_delay_ms: retryDelay,
            last_retry_at: shouldRetry ? new Date().toISOString() : null,
          })
          .eq('id', job.id)

        if (shouldRetry) {
          // Reset to pending after the calculated delay
          setTimeout(async () => {
            try {
              await supabase
                .from('processing_jobs')
                .update({ status: 'pending' })
                .eq('id', job.id)
              console.log(`Job ${job.id} moved back to pending for retry`)
            } catch (retryError) {
              console.error(`Failed to schedule retry for job ${job.id}:`, retryError)
            }
          }, retryDelay)
        }
      }
    }
  } catch (error) {
    console.error('Error in poll cycle:', error)
  }
}

// Main polling loop
async function main() {
  while (true) {
    await pollForJobs()
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
