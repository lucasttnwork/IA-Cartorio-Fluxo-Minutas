-- ============================================================================
-- Add retry tracking fields to processing_jobs table
-- ============================================================================

-- Add last_retry_at field to track when the last retry was scheduled
ALTER TABLE processing_jobs
ADD COLUMN last_retry_at TIMESTAMPTZ;

-- Add retry_delay_ms field to track the current retry delay (for exponential backoff)
ALTER TABLE processing_jobs
ADD COLUMN retry_delay_ms INTEGER DEFAULT 0;

-- Create index for efficient querying of jobs that need to be retried
CREATE INDEX idx_processing_jobs_status_retry ON processing_jobs(status, last_retry_at)
WHERE status = 'pending';

-- Add comment to document the retry mechanism
COMMENT ON COLUMN processing_jobs.last_retry_at IS 'Timestamp when the job was last scheduled for retry';
COMMENT ON COLUMN processing_jobs.retry_delay_ms IS 'Current retry delay in milliseconds for exponential backoff';
