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
  | 'entity_extraction'
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

// Entity Extraction Types for Gemini LLM
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
  id?: string
  document_id?: string
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
 * Represents a candidate Person record built from extracted entities.
 * Used during entity resolution before persisting to the database.
 */
export interface PersonCandidate {
  // Core identification
  full_name: string
  cpf: string | null
  rg: string | null
  rg_issuer: string | null

  // Personal information
  birth_date: string | null
  nationality: string | null
  marital_status: MaritalStatus | null
  profession: string | null

  // Contact information
  email: string | null
  phone: string | null
  address: Address | null

  // Family information
  father_name: string | null
  mother_name: string | null

  // Traceability
  source_docs: string[]              // Document IDs where this person was found
  source_entities: EntitySource[]    // Links to original extracted entities
  confidence: number                 // Overall confidence score (0-1)

  // Metadata
  metadata: Record<string, unknown>
}

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
 * Marital status options (matches frontend Person type)
 */
export type MaritalStatus =
  | 'single'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'stable_union'

/**
 * Address structure (matches frontend Person type)
 */
export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip: string
}

/**
 * Represents a candidate Property record built from extracted entities.
 * Used during entity resolution before persisting to the database.
 * Created when processing deed documents (escrituras).
 */
export interface PropertyCandidate {
  // Core identification
  registry_number: string | null        // Matrícula do imóvel
  registry_office: string | null        // Cartório de Registro de Imóveis

  // Property location
  address: Address | null               // Full address of the property

  // Property details
  area_sqm: number | null               // Area in square meters
  description: string | null            // Property description from deed
  iptu_number: string | null            // IPTU cadastral number

  // Encumbrances (ônus)
  encumbrances: Encumbrance[] | null    // List of encumbrances on the property

  // Traceability
  source_docs: string[]                 // Document IDs where this property was found
  source_entities: EntitySource[]       // Links to original extracted entities
  confidence: number                    // Overall confidence score (0-1)

  // Metadata
  metadata: Record<string, unknown>
}

/**
 * Encumbrance on a property (ônus)
 */
export interface Encumbrance {
  type: string                          // Type of encumbrance (e.g., 'hipoteca', 'usufruto')
  description: string                   // Description of the encumbrance
  value?: number                        // Monetary value if applicable
  beneficiary?: string                  // Beneficiary of the encumbrance
}

/**
 * Reason why a property merge was suggested
 */
export type PropertyMergeSuggestionReason =
  | 'same_registry'                     // Registry number match (high confidence)
  | 'similar_address'                   // Address similarity above threshold
  | 'same_iptu'                         // IPTU number match
  | 'registry_and_address'              // Registry + address match

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
