-- Add entity_extraction to the job_type check constraint
-- This migration adds support for the entity extraction job type

-- First, drop the existing constraint
ALTER TABLE processing_jobs DROP CONSTRAINT IF EXISTS processing_jobs_job_type_check;

-- Add the new constraint with entity_extraction included
ALTER TABLE processing_jobs ADD CONSTRAINT processing_jobs_job_type_check
  CHECK (job_type IN ('ocr', 'extraction', 'consensus', 'entity_resolution', 'entity_extraction', 'draft'));

-- Add index for entity extraction jobs for faster queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_entity_extraction
  ON processing_jobs(document_id, job_type)
  WHERE job_type = 'entity_extraction';
