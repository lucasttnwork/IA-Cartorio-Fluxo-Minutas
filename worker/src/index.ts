import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { processJob } from './jobs/processor'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000', 10)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log('Minuta Canvas Worker starting...')
console.log(`Polling interval: ${POLL_INTERVAL}ms`)

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
        console.error(`Job ${job.id} failed:`, errorMessage)

        // Check if we should retry
        const newStatus =
          job.attempts + 1 >= job.max_attempts ? 'failed' : 'retrying'

        await supabase
          .from('processing_jobs')
          .update({
            status: newStatus,
            error_message: errorMessage,
          })
          .eq('id', job.id)

        if (newStatus === 'retrying') {
          // Reset to pending after a delay
          setTimeout(async () => {
            await supabase
              .from('processing_jobs')
              .update({ status: 'pending' })
              .eq('id', job.id)
          }, 10000)
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
