export interface ProcessingJob {
  id: string
  case_id: string
  document_id: string | null
  job_type: JobType
  status: JobStatus
  attempts: number
  max_attempts: number
  error_message: string | null
  result: Record<string, unknown> | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export type JobType =
  | 'ocr'
  | 'extraction'
  | 'consensus'
  | 'entity_resolution'
  | 'draft'

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'

export interface OcrResult {
  text: string
  blocks: OcrBlock[]
  confidence: number
  language: string
}

export interface OcrBlock {
  text: string
  type: 'paragraph' | 'line' | 'word'
  confidence: number
  bounding_box: BoundingBox
  page: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ExtractionResult {
  document_type: string
  extracted_data: Record<string, unknown>
  confidence: number
  notes: string[]
}

export interface ConsensusResult {
  fields: Record<string, ConsensusField>
  overall_confidence: number
}

export interface ConsensusField {
  value: unknown
  ocr_value: unknown
  llm_value: unknown
  confidence: 'high' | 'medium' | 'low'
  source: 'ocr' | 'llm' | 'consensus'
  is_pending: boolean
}
