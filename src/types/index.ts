// ============================================================================
// Core Types for Minuta Canvas
// ============================================================================

// -----------------------------------------------------------------------------
// Database Types (mirrors Supabase schema)
// -----------------------------------------------------------------------------

export interface Organization {
  id: string
  name: string
  settings: Record<string, unknown>
  created_at: string
}

export interface User {
  id: string
  organization_id: string
  role: 'clerk' | 'supervisor' | 'admin'
  full_name: string
  created_at: string
}

export interface Case {
  id: string
  organization_id: string
  act_type: ActType
  status: CaseStatus
  title: string
  created_by: string
  assigned_to: string | null
  canonical_data: CanonicalData | null
  created_at: string
  updated_at: string
}

export type ActType = 'purchase_sale' | 'donation' | 'exchange' | 'lease'

export type CaseStatus = 'draft' | 'processing' | 'review' | 'approved' | 'archived'

export interface Document {
  id: string
  case_id: string
  storage_path: string
  original_name: string
  mime_type: string
  file_size: number
  page_count: number | null
  status: DocumentStatus
  doc_type: DocumentType | null
  doc_type_confidence: number | null
  metadata: DocumentMetadata
  created_at: string
  updated_at: string
}

export interface DocumentMetadata {
  // Proxy-specific fields
  proxy_expiration_date?: string // ISO date string
  proxy_powers?: string[] // e.g., ['comprar', 'vender', 'assinar']
  proxy_signatories?: string[] // Names of people who signed
  proxy_grantor?: string // Name of person granting the power
  proxy_grantee?: string // Name of person receiving the power
  proxy_notary_info?: string // Notary office information
  proxy_type?: 'public' | 'private' // Type of proxy

  // Generic metadata for other document types
  [key: string]: unknown
}

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'needs_review'
  | 'approved'
  | 'failed'

export type DocumentType =
  | 'cnh'
  | 'rg'
  | 'marriage_cert'
  | 'deed'
  | 'proxy'
  | 'iptu'
  | 'birth_cert'
  | 'other'

export interface Extraction {
  id: string
  document_id: string
  ocr_result: OcrResult | null
  llm_result: LlmResult | null
  consensus: ConsensusResult | null
  pending_fields: string[]
  created_at: string
}

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

export interface LlmResult {
  document_type: DocumentType
  extracted_data: Record<string, unknown>
  confidence: number
  notes: string[]
}

export interface ConsensusResult {
  fields: Record<string, ConsensusField>
  overall_confidence: number
  conflicts: ConflictField[]
  total_fields: number
  confirmed_fields: number
  pending_fields: number
}

export interface ConsensusField {
  value: unknown
  ocr_value: unknown
  llm_value: unknown
  confidence: 'high' | 'medium' | 'low'
  source: 'ocr' | 'llm' | 'consensus'
  is_pending: boolean
}

// -----------------------------------------------------------------------------
// Consensus & Conflict Resolution Types
// -----------------------------------------------------------------------------

// Conflict field status for consensus engine
export type ConflictFieldStatus = 'pending' | 'confirmed' | 'resolved'

// Reason for conflict between OCR and LLM values
export type ConflictReason =
  | 'low_similarity'        // Similarity score below threshold
  | 'type_mismatch'         // Different data types detected
  | 'format_difference'     // Same value, different format
  | 'partial_match'         // One value contains the other
  | 'ocr_confidence_low'    // OCR confidence below threshold
  | 'llm_confidence_low'    // LLM confidence below threshold
  | 'both_confidence_low'   // Both sources have low confidence
  | 'semantic_difference'   // Semantically different values
  | 'missing_value'         // One source has value, other doesn't

// Interface for tracking field conflicts between OCR and LLM extractions
export interface ConflictField {
  // Field identification
  fieldName: string
  fieldPath: string  // Dot notation path for nested fields

  // Conflict status
  status: ConflictFieldStatus

  // Values from each source
  ocrValue: unknown
  llmValue: unknown
  finalValue?: unknown  // The resolved/confirmed value

  // Similarity and confidence metrics
  similarityScore: number  // 0-1 normalized similarity score
  ocrConfidence?: number   // OCR confidence for this field
  llmConfidence?: number   // LLM confidence for this field

  // Conflict details
  conflictReason: ConflictReason | null  // null if confirmed without conflict

  // Resolution audit trail
  reviewedBy?: string     // User ID who reviewed/resolved
  reviewedAt?: string     // ISO timestamp of review
  resolutionNote?: string // Optional note explaining resolution choice

  // Metadata
  createdAt: string       // ISO timestamp when conflict was detected
  autoResolved?: boolean  // Whether conflict was auto-resolved
}

// Request/Response types for conflict resolution API
export interface ResolveConflictRequest {
  fieldPath: string
  resolvedValue: unknown
  resolutionNote?: string
}

export interface ResolveConflictResponse {
  success: boolean
  conflict: ConflictField
  message?: string
}

export interface ConflictsSummary {
  extractionId: string
  documentId: string
  totalConflicts: number
  pendingConflicts: number
  resolvedConflicts: number
  confirmedFields: number
  conflicts: ConflictField[]
}

export interface Person {
  id: string
  case_id: string
  full_name: string
  cpf: string | null
  rg: string | null
  rg_issuer: string | null
  birth_date: string | null
  nationality: string | null
  marital_status: MaritalStatus | null
  profession: string | null
  address: Address | null
  email: string | null
  phone: string | null
  father_name: string | null
  mother_name: string | null
  confidence: number
  source_docs: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type MaritalStatus =
  | 'single'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'stable_union'

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip: string
  // Geocoding fields
  latitude?: number
  longitude?: number
  formatted_address?: string
  geocoded_at?: string
  geocode_confidence?: number
  geocode_status?: 'pending' | 'success' | 'failed' | 'partial'
}

export interface Property {
  id: string
  case_id: string
  registry_number: string | null
  registry_office: string | null
  address: Address | null
  area_sqm: number | null
  description: string | null
  iptu_number: string | null
  encumbrances: Encumbrance[] | null
  confidence: number
  source_docs: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Encumbrance {
  type: string
  description: string
  value?: number
  beneficiary?: string
}

export interface Evidence {
  id: string
  entity_type: 'person' | 'property'
  entity_id: string
  field_name: string
  document_id: string
  page_number: number
  bounding_box: BoundingBox | null
  extracted_text: string
  confidence: number
  source: 'ocr' | 'llm' | 'consensus'
  created_at: string
}

export interface GraphEdge {
  id: string
  case_id: string
  source_type: 'person' | 'property'
  source_id: string
  target_type: 'person' | 'property'
  target_id: string
  relationship: RelationshipType
  confidence: number
  confirmed: boolean
  metadata: GraphEdgeMetadata
  created_at: string
}

export interface GraphEdgeMetadata {
  proxy_document_id?: string
  proxy_attached_at?: string
  [key: string]: unknown
}

export type RelationshipType =
  | 'spouse_of'
  | 'represents'
  | 'owns'
  | 'sells'
  | 'buys'
  | 'guarantor_of'
  | 'witness_for'

export interface Draft {
  id: string
  case_id: string
  version: number
  content: DraftContent
  html_content: string
  pending_items: PendingItem[]
  status: DraftStatus
  created_at: string
}

export type DraftStatus = 'generated' | 'reviewing' | 'approved'

export interface DraftContent {
  sections: DraftSection[]
}

export interface DraftSection {
  id: string
  title: string
  type: SectionType
  content: string
  order: number
}

export type SectionType =
  | 'header'
  | 'parties'
  | 'object'
  | 'price'
  | 'conditions'
  | 'clauses'
  | 'closing'

export interface DraftTemplate {
  id: string
  name: string
  description: string
  actType: ActType
  icon?: string
  sections: DraftSection[]
}

export interface PendingItem {
  id: string
  section_id: string
  field_path: string
  reason: string
  severity: 'error' | 'warning' | 'info'
}

export interface ChatSession {
  id: string
  case_id: string
  draft_id: string
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  operation: ChatOperation | null
  created_at: string
}

export interface ChatOperation {
  type: ChatOperationType
  target_path?: string
  old_value?: unknown
  new_value?: unknown
  section_id?: string
  reason?: string
  status?: 'pending_approval' | 'approved' | 'rejected'
}

export type ChatOperationType =
  | 'update_field'
  | 'regenerate_section'
  | 'add_clause'
  | 'remove_clause'
  | 'mark_pending'
  | 'resolve_pending'

export interface OperationsLog {
  id: string
  case_id: string
  draft_id: string
  user_id: string
  operation_type: string
  target_path: string
  old_value: unknown
  new_value: unknown
  reason: string
  created_at: string
}

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
  last_retry_at: string | null
  retry_delay_ms: number
}

export type JobType = 'ocr' | 'extraction' | 'consensus' | 'entity_resolution' | 'entity_extraction' | 'draft'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying'

// -----------------------------------------------------------------------------
// Canonical Data Model
// -----------------------------------------------------------------------------

export interface CanonicalData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  deal: DealDetails | null
}

export interface DealDetails {
  type: ActType
  price?: number
  paymentSchedule?: PaymentSchedule
  conditions?: string[]
}

export interface PaymentSchedule {
  entries: PaymentEntry[]
}

export interface PaymentEntry {
  description: string
  percentage?: number
  amount?: number
  due_date?: string
}

// -----------------------------------------------------------------------------
// Canvas Types (React Flow)
// -----------------------------------------------------------------------------

export interface CanvasNode {
  id: string
  type: 'person' | 'property'
  position: { x: number; y: number }
  data: Person | Property
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  type: 'relationship'
  data: {
    relationship: RelationshipType
    confirmed: boolean
    confidence: number
  }
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// -----------------------------------------------------------------------------
// UI State Types
// -----------------------------------------------------------------------------

export interface UploadProgress {
  file_name: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface FilterState {
  status?: string[]
  confidence?: string[]
  document_type?: string[]
  date_range?: {
    start: string
    end: string
  }
}

// -----------------------------------------------------------------------------
// Entity Extraction Types (Gemini LLM)
// -----------------------------------------------------------------------------

export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'DATE'
  | 'MONEY'
  | 'CPF'
  | 'RG'
  | 'CNPJ'
  | 'EMAIL'
  | 'PHONE'
  | 'ADDRESS'
  | 'PROPERTY_REGISTRY'
  | 'RELATIONSHIP'
  | 'DOCUMENT_NUMBER'
  | 'OTHER'

export interface ExtractedEntity {
  id: string
  document_id: string
  type: EntityType
  value: string
  confidence: number
  position?: {
    page?: number
    start_offset?: number
    end_offset?: number
    bounding_box?: BoundingBox
  }
  context?: string
  normalized_value?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[]
  document_id: string
  processing_time_ms: number
  model_used: string
  tokens_used?: number
}

// -----------------------------------------------------------------------------
// Entity Resolution Types
// -----------------------------------------------------------------------------

/**
 * Links a PersonCandidate field to its source extracted entity.
 * Used for creating evidence records.
 */
export interface EntitySource {
  field_name: string                 // Which PersonCandidate field this entity maps to
  entity_id: string                  // ID of the ExtractedEntity
  document_id: string                // Document where entity was extracted
  entity_type: EntityType            // Type of the source entity
  value: string                      // Original extracted value
  confidence: number                 // Confidence of the extraction
  position?: {                       // Position in document for evidence
    page?: number
    bounding_box?: BoundingBox
  }
}

/**
 * Status of a merge suggestion
 */
export type MergeSuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'auto_merged'

/**
 * Reason why a merge was suggested
 */
export type MergeSuggestionReason =
  | 'same_cpf'                       // CPF match (high confidence)
  | 'similar_name'                   // Name similarity above threshold
  | 'same_rg'                        // RG match
  | 'name_and_birth_date'            // Name + birth date match
  | 'name_and_address'               // Name + address match

/**
 * Represents a suggestion to merge two person candidates.
 * Created when two persons might be the same but can't be auto-merged.
 */
export interface MergeSuggestion {
  id: string
  case_id: string

  // The two person records that might be duplicates
  person_a_id: string                // ID of first person (or candidate reference)
  person_b_id: string                // ID of second person (or candidate reference)

  // Merge metadata
  reason: MergeSuggestionReason      // Why this merge was suggested
  confidence: number                 // Confidence that these are the same person (0-1)
  similarity_score: number           // Name/data similarity score (0-1)

  // Status tracking
  status: MergeSuggestionStatus
  reviewed_by: string | null         // User ID who reviewed the suggestion
  reviewed_at: string | null         // ISO timestamp of review

  // Additional context
  matching_fields: string[]          // Which fields matched (e.g., ['full_name', 'birth_date'])
  conflicting_fields: string[]       // Which fields have different values
  notes: string | null               // Optional notes about the suggestion

  // Timestamps
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Entity Split Types
// -----------------------------------------------------------------------------

/**
 * Extended metadata interface for tracking merge history in Person records.
 * This enables split functionality by preserving original merge data.
 */
export interface MergeMetadata {
  merged_from?: string[]             // Array of person IDs that were merged
  merged_at?: string                 // ISO timestamp when merge occurred
  original_data_a?: Partial<Person>  // Original data from first person
  original_data_b?: Partial<Person>  // Original data from second person
  merge_reason?: string              // Reason for the merge
  [key: string]: unknown             // Allow other metadata fields
}

/**
 * Represents a candidate for splitting - a merged person that can be separated.
 */
export interface SplitCandidate {
  id: string                         // ID of the merged person record
  merged_person: Person              // The current merged person record
  merge_metadata: MergeMetadata      // Metadata about the merge
  original_person_a?: Partial<Person> // Reconstructed data for first person
  original_person_b?: Partial<Person> // Reconstructed data for second person
  merged_at: string                  // When the merge occurred
  can_split: boolean                 // Whether split is possible (has enough data)
  split_confidence: number           // Confidence in split accuracy (0-1)
}

// -----------------------------------------------------------------------------
// Realtime Presence Types
// -----------------------------------------------------------------------------

/**
 * Represents a user's presence state on the canvas
 */
export interface CanvasPresence {
  user_id: string                    // Unique user identifier
  user_name: string                  // Display name of the user
  cursor_x: number                   // X position in viewport coordinates
  cursor_y: number                   // Y position in viewport coordinates
  color: string                      // Assigned color for this user's cursor
  last_updated: number               // Timestamp of last update
}

/**
 * Presence state for the entire canvas session
 */
export interface PresenceState {
  [user_id: string]: CanvasPresence
}
