import { createClient } from '@supabase/supabase-js'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { processJob } from './jobs/processor'
import {
  workerConfig,
  logWorkerEnvironmentInfo,
  validateWorkerReadiness,
  getSupabaseClientOptions,
  isProduction,
  ENV,
} from './config/environment'
import { Semaphore } from './utils/Semaphore'
import { workerMetrics } from './utils/WorkerMetrics'
import type { ProcessingJob } from './types'

// ============================================================================
// Health Check HTTP Server
// ============================================================================

const HEALTH_CHECK_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '3001', 10)
let workerIsReady = false
let activeJobs = 0
const workerStartTime = new Date()

function setupHealthCheckServer() {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS for frontend to call this endpoint
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Health check endpoint
    if (req.url === '/health' && req.method === 'GET') {
      const uptime = Math.floor((Date.now() - workerStartTime.getTime()) / 1000)
      const status = workerIsReady ? 'healthy' : 'starting'
      const metrics = workerMetrics.getSummary()
      const utilizationPercent = Math.round((activeJobs / MAX_CONCURRENT_JOBS) * 100)

      const healthData = {
        status,
        uptime,
        activeJobs,
        maxConcurrentJobs: MAX_CONCURRENT_JOBS,
        utilizationPercent,
        jobsProcessedLast60s: metrics.jobsProcessedLast60s,
        averageJobDurationMs: metrics.averageJobDurationMs,
        successRate: metrics.successRate,
        zombieJobsRecovered: metrics.zombieJobsRecovered,
        lastJobProcessedAt: metrics.lastJobProcessedAt,
        timestamp: new Date().toISOString(),
        environment: ENV,
        config: {
          jobTimeoutMs: workerConfig.worker.jobTimeout,
          zombieThresholdMs: workerConfig.worker.zombieJobThresholdMs,
          autoRecoveryEnabled: workerConfig.worker.enableAutoRecovery,
          activePollIntervalMs: workerConfig.worker.activePollIntervalMs,
        },
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(healthData))
      return
    }

    // Metrics endpoint (detailed)
    if (req.url === '/metrics' && req.method === 'GET') {
      const metrics = workerMetrics.getSummary()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(metrics))
      return
    }

    // 404 for other endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
  })

  // Handle port already in use error
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${HEALTH_CHECK_PORT} already in use. Health check disabled.`)
    } else {
      console.error('Health check server error:', err)
    }
  })

  server.listen(HEALTH_CHECK_PORT, () => {
    console.log(`🏥 Health check server listening on http://localhost:${HEALTH_CHECK_PORT}`)
    console.log(`   GET http://localhost:${HEALTH_CHECK_PORT}/health`)
    console.log(`   GET http://localhost:${HEALTH_CHECK_PORT}/metrics`)
  })

  return server
}

// ============================================================================
// Environment Validation at Startup
// ============================================================================

console.log('================================================================================')
console.log(`${workerConfig.app.name} starting...`)
console.log(`Environment: ${ENV}`)
console.log('================================================================================')

logWorkerEnvironmentInfo()

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
const MAX_CONCURRENT_JOBS = workerConfig.worker.maxConcurrentJobs
const JOB_TIMEOUT_MS = workerConfig.worker.jobTimeout
const ZOMBIE_JOB_THRESHOLD_MS = workerConfig.worker.zombieJobThresholdMs
const ENABLE_AUTO_RECOVERY = workerConfig.worker.enableAutoRecovery
const ACTIVE_POLL_INTERVAL_MS = workerConfig.worker.activePollIntervalMs

// Semaphore for controlling concurrent job execution
const jobSemaphore = new Semaphore(MAX_CONCURRENT_JOBS)

console.log('')
console.log('Worker Configuration:')
console.log(`  Poll interval: ${POLL_INTERVAL}ms`)
console.log(`  Retry base delay: ${RETRY_BASE_DELAY}ms`)
console.log(`  Retry max delay: ${RETRY_MAX_DELAY}ms`)
console.log(`  Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`)
console.log(`  Job timeout: ${JOB_TIMEOUT_MS}ms`)
console.log(`  Zombie job threshold: ${ZOMBIE_JOB_THRESHOLD_MS}ms`)
console.log(`  Auto recovery: ${ENABLE_AUTO_RECOVERY ? 'enabled' : 'disabled'}`)
console.log(`  Active poll interval: ${ACTIVE_POLL_INTERVAL_MS}ms`)
console.log('')
console.log('Feature Flags:')
console.log(`  Document AI: ${workerConfig.features.enableDocumentAI ? 'enabled' : 'disabled'}`)
console.log(`  Debug mode: ${workerConfig.features.enableDebugMode ? 'enabled' : 'disabled'}`)
console.log(`  Metrics: ${workerConfig.features.enableMetrics ? 'enabled' : 'disabled'}`)
console.log('')
console.log('================================================================================')
console.log('Worker initialized. Using REALTIME + intelligent polling for job notifications...')
console.log('================================================================================')

// ============================================================================
// Zombie Job Recovery
// ============================================================================

/**
 * Recover zombie jobs that have been stuck in 'processing' status
 * Jobs are considered zombies if:
 * - Status is 'processing'
 * - started_at is older than ZOMBIE_JOB_THRESHOLD_MS
 */
async function recoverZombieJobs(): Promise<number> {
  if (!ENABLE_AUTO_RECOVERY) {
    return 0
  }

  try {
    const zombieThreshold = new Date(Date.now() - ZOMBIE_JOB_THRESHOLD_MS)

    const { data: zombieJobs, error } = await supabase
      .from('processing_jobs')
      .select('id, job_type, case_id, started_at')
      .eq('status', 'processing')
      .lt('started_at', zombieThreshold.toISOString())

    if (error) {
      console.error('Error checking for zombie jobs:', error)
      return 0
    }

    if (!zombieJobs || zombieJobs.length === 0) {
      return 0
    }

    console.warn(`⚠️  Found ${zombieJobs.length} zombie job(s). Recovering...`)

    for (const job of zombieJobs) {
      console.warn(`   - Job ${job.id} (type: ${job.job_type}) stuck since ${job.started_at}`)
    }

    const { error: updateError } = await supabase
      .from('processing_jobs')
      .update({
        status: 'pending',
        started_at: null,
        error_message: `Auto-recovered from zombie state at ${new Date().toISOString()}`,
      })
      .in('id', zombieJobs.map((j) => j.id))

    if (updateError) {
      console.error('Error recovering zombie jobs:', updateError)
      return 0
    }

    console.log(`✅ Recovered ${zombieJobs.length} zombie job(s)`)
    workerMetrics.recordZombieRecovery(zombieJobs.length)

    return zombieJobs.length
  } catch (err) {
    console.error('Unexpected error in zombie job recovery:', err)
    return 0
  }
}

// ============================================================================
// Job Processing with Timeout
// ============================================================================

/**
 * Process a single job with timeout and semaphore control
 */
async function processSingleJob(job: ProcessingJob): Promise<void> {
  // Acquire semaphore permit
  await jobSemaphore.acquire()
  activeJobs++

  const jobStartTime = Date.now()
  console.log(`[${activeJobs}/${MAX_CONCURRENT_JOBS}] Processing job ${job.id} (type: ${job.job_type})`)

  // Mark job as processing
  const { error: updateError } = await supabase
    .from('processing_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    })
    .eq('id', job.id)

  if (updateError) {
    console.error(`Failed to mark job ${job.id} as processing:`, updateError)
    activeJobs--
    jobSemaphore.release()
    return
  }

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timeout exceeded (${JOB_TIMEOUT_MS}ms)`))
      }, JOB_TIMEOUT_MS)
    })

    // Race between job execution and timeout
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await Promise.race([
      processJob(supabase as any, job),
      timeoutPromise,
    ])

    // Mark job as completed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
      })
      .eq('id', job.id)

    const jobEndTime = Date.now()
    console.log(`[${activeJobs}/${MAX_CONCURRENT_JOBS}] ✅ Job ${job.id} completed in ${jobEndTime - jobStartTime}ms`)

    // Record metrics
    workerMetrics.recordJob({
      jobId: job.id,
      jobType: job.job_type,
      startTime: jobStartTime,
      endTime: jobEndTime,
      success: true,
    })

  } catch (jobError) {
    const errorMessage = jobError instanceof Error ? jobError.message : 'Unknown error'
    const isTimeout = errorMessage.includes('Job timeout exceeded')
    const errorStack = jobError instanceof Error ? jobError.stack : undefined

    console.error(`❌ Job ${job.id} failed (attempt ${job.attempts + 1}/${job.max_attempts}):`, errorMessage)
    if (errorStack && !isTimeout) {
      console.error('Stack trace:', errorStack)
    }

    // Check if we should retry
    const shouldRetry = job.attempts + 1 < job.max_attempts && !isTimeout
    const newStatus = shouldRetry ? 'retrying' : 'failed'

    // Calculate exponential backoff delay
    const retryDelay = shouldRetry
      ? Math.min(RETRY_BASE_DELAY * Math.pow(2, job.attempts), RETRY_MAX_DELAY)
      : 0

    console.log(
      shouldRetry
        ? `⏳ Scheduling retry ${job.attempts + 1} for job ${job.id} in ${retryDelay}ms`
        : `💀 Job ${job.id} has ${isTimeout ? 'timed out' : 'exhausted all retry attempts'}`
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

    // Schedule retry if applicable
    if (shouldRetry) {
      setTimeout(async () => {
        try {
          await supabase
            .from('processing_jobs')
            .update({ status: 'pending' })
            .eq('id', job.id)
          console.log(`🔄 Job ${job.id} moved back to pending for retry`)
        } catch (retryError) {
          console.error(`Failed to schedule retry for job ${job.id}:`, retryError)
        }
      }, retryDelay)
    }

    // Record metrics
    const jobEndTime = Date.now()
    workerMetrics.recordJob({
      jobId: job.id,
      jobType: job.job_type,
      startTime: jobStartTime,
      endTime: jobEndTime,
      success: false,
      error: errorMessage,
    })

  } finally {
    activeJobs--
    jobSemaphore.release()
  }
}

// ============================================================================
// Batch Job Processing
// ============================================================================

/**
 * Process multiple pending jobs up to the available slots
 */
async function processPendingJobs(limit: number): Promise<number> {
  if (limit <= 0) return 0

  const { data: jobs, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching pending jobs:', error)
    return 0
  }

  if (!jobs || jobs.length === 0) {
    return 0
  }

  console.log(`📋 Found ${jobs.length} pending job(s) to process`)

  // Process all jobs in parallel (semaphore controls concurrency)
  for (const job of jobs) {
    // Fire and forget - semaphore handles rate limiting
    processSingleJob(job).catch((err) => {
      console.error(`Unhandled error processing job ${job.id}:`, err)
    })
  }

  return jobs.length
}

/**
 * Process pending jobs at startup (in case some jobs were created while worker was offline)
 */
async function processPendingJobsAtStartup(): Promise<void> {
  console.log('Checking for pending/zombie jobs at startup...')

  // First, recover any zombie jobs
  const zombiesRecovered = await recoverZombieJobs()
  if (zombiesRecovered > 0) {
    console.log(`Recovered ${zombiesRecovered} zombie jobs at startup`)
  }

  // Then process pending jobs
  const processed = await processPendingJobs(MAX_CONCURRENT_JOBS)
  if (processed === 0) {
    console.log('No pending jobs found at startup.')
  }
}

// ============================================================================
// Realtime + Hybrid Polling Setup
// ============================================================================

interface SubscriptionState {
  channel: ReturnType<typeof supabase.channel>
  activePoll: NodeJS.Timeout
  zombieRecovery: NodeJS.Timeout
}

/**
 * Set up Realtime subscription with intelligent hybrid polling
 */
function setupRealtimeSubscription(): SubscriptionState {
  console.log('Setting up Realtime subscription + hybrid polling...')

  let isRealtimeActive = false

  // 1. Realtime subscription for immediate INSERT detection
  const channel = supabase
    .channel('processing_jobs_realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'processing_jobs',
        filter: 'status=eq.pending',
      },
      (payload) => {
        const job = payload.new as ProcessingJob

        console.log(`📨 New job detected via Realtime: ${job.id} (type: ${job.job_type})`)

        // Check if we have available slots
        if (activeJobs >= MAX_CONCURRENT_JOBS) {
          console.warn(`⚠️  Max concurrent jobs reached (${MAX_CONCURRENT_JOBS}). Job ${job.id} will be picked up by polling.`)
          return
        }

        // Process the job immediately
        processSingleJob(job).catch((err) => {
          console.error(`Unhandled error processing realtime job ${job.id}:`, err)
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'processing_jobs',
        filter: 'status=eq.pending',
      },
      (payload) => {
        const job = payload.new as ProcessingJob

        // Only process if it was reset from another status to pending
        if (payload.old && (payload.old as ProcessingJob).status !== 'pending') {
          console.log(`📨 Job ${job.id} reset to pending, processing...`)

          if (activeJobs >= MAX_CONCURRENT_JOBS) {
            console.warn(`⚠️  Max concurrent jobs reached. Job ${job.id} will be picked up by polling.`)
            return
          }

          processSingleJob(job).catch((err) => {
            console.error(`Unhandled error processing reset job ${job.id}:`, err)
          })
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscription active!')
        isRealtimeActive = true
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime subscription error. Relying on polling...')
        isRealtimeActive = false
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️  Realtime subscription timed out. Relying on polling...')
        isRealtimeActive = false
      }
    })

  // 2. Active polling - runs frequently when there are available slots
  const activePoll = setInterval(async () => {
    const availableSlots = MAX_CONCURRENT_JOBS - activeJobs

    // Only poll if we have available slots
    if (availableSlots > 0) {
      const jobsStarted = await processPendingJobs(availableSlots)
      if (jobsStarted > 0 && workerConfig.features.enableDebugMode) {
        console.log(`🔄 Active poll picked up ${jobsStarted} job(s)`)
      }
    }
  }, ACTIVE_POLL_INTERVAL_MS)

  // 3. Zombie job recovery - runs every 30 seconds
  const zombieRecovery = setInterval(async () => {
    const recovered = await recoverZombieJobs()
    if (recovered > 0) {
      console.log(`🧟 Zombie recovery interval recovered ${recovered} job(s)`)
    }
  }, 30000)

  return { channel, activePoll, zombieRecovery }
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
  // 0. Start health check server
  const healthServer = setupHealthCheckServer()

  // 1. Process any pending/zombie jobs from previous runs
  await processPendingJobsAtStartup()

  // 2. Set up Realtime subscription + hybrid polling
  const { channel, activePoll, zombieRecovery } = setupRealtimeSubscription()

  // 3. Mark worker as ready
  workerIsReady = true

  // 4. Handle graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`)
    workerIsReady = false

    // Stop accepting new jobs
    clearInterval(activePoll)
    clearInterval(zombieRecovery)

    // Wait for active jobs to complete (with timeout)
    const shutdownTimeout = 30000 // 30 seconds
    const shutdownStart = Date.now()

    while (activeJobs > 0 && Date.now() - shutdownStart < shutdownTimeout) {
      console.log(`   Waiting for ${activeJobs} active job(s) to complete...`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (activeJobs > 0) {
      console.warn(`   ⚠️  ${activeJobs} job(s) still active after timeout. They will be recovered as zombies.`)
    }

    // Cleanup
    healthServer.close()
    await channel.unsubscribe()

    console.log('👋 Worker shutdown complete')
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Keep the process alive
  console.log('\n🚀 Worker is running and listening for jobs!')
  console.log(`   Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`)
  console.log(`   Job timeout: ${JOB_TIMEOUT_MS}ms`)
  console.log(`   Zombie recovery: every 30s (threshold: ${ZOMBIE_JOB_THRESHOLD_MS}ms)`)
  console.log('   Press Ctrl+C to stop\n')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
