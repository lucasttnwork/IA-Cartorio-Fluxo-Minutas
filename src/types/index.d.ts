export interface Organization {
    id: string;
    name: string;
    settings: Record<string, unknown>;
    created_at: string;
}
export interface OrganizationCode {
    id: string;
    organization_id: string;
    code: string;
    description: string | null;
    is_active: boolean;
    max_uses: number | null;
    current_uses: number;
    expires_at: string | null;
    created_at: string;
    created_by: string | null;
}
export interface User {
    id: string;
    organization_id: string;
    role: 'clerk' | 'supervisor' | 'admin';
    full_name: string;
    created_at: string;
}
export interface Case {
    id: string;
    organization_id: string;
    act_type: ActType;
    status: CaseStatus;
    title: string;
    created_by: string;
    assigned_to: string | null;
    canonical_data: CanonicalData | null;
    created_at: string;
    updated_at: string;
}
export type ActType = 'purchase_sale' | 'donation' | 'exchange' | 'lease';
export type CaseStatus = 'draft' | 'processing' | 'review' | 'approved' | 'archived';
export interface Document {
    id: string;
    case_id: string;
    storage_path: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    page_count: number | null;
    status: DocumentStatus;
    doc_type: DocumentType | null;
    doc_type_confidence: number | null;
    metadata: DocumentMetadata;
    created_at: string;
    updated_at: string;
}
export interface DocumentMetadata {
    proxy_expiration_date?: string;
    proxy_powers?: string[];
    proxy_signatories?: string[];
    proxy_grantor?: string;
    proxy_grantee?: string;
    proxy_notary_info?: string;
    proxy_type?: 'public' | 'private';
    [key: string]: unknown;
}
export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'needs_review' | 'approved' | 'failed';
export type DocumentType = 'cnh' | 'rg' | 'marriage_cert' | 'deed' | 'proxy' | 'iptu' | 'birth_cert' | 'other';
export interface Extraction {
    id: string;
    document_id: string;
    ocr_result: OcrResult | null;
    llm_result: LlmResult | null;
    consensus: ConsensusResult | null;
    pending_fields: string[];
    created_at: string;
}
export interface OcrResult {
    text: string;
    blocks: OcrBlock[];
    confidence: number;
    language: string;
}
export interface OcrBlock {
    text: string;
    type: 'paragraph' | 'line' | 'word';
    confidence: number;
    bounding_box: BoundingBox;
    page: number;
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface LlmResult {
    document_type: DocumentType;
    extracted_data: Record<string, unknown>;
    confidence: number;
    notes: string[];
}
export interface ConsensusResult {
    fields: Record<string, ConsensusField>;
    overall_confidence: number;
    conflicts: ConflictField[];
    total_fields: number;
    confirmed_fields: number;
    pending_fields: number;
}
export interface ConsensusField {
    value: unknown;
    ocr_value: unknown;
    llm_value: unknown;
    confidence: 'high' | 'medium' | 'low';
    source: 'ocr' | 'llm' | 'consensus';
    is_pending: boolean;
}
export type ConflictFieldStatus = 'pending' | 'confirmed' | 'resolved';
export type ConflictReason = 'low_similarity' | 'type_mismatch' | 'format_difference' | 'partial_match' | 'ocr_confidence_low' | 'llm_confidence_low' | 'both_confidence_low' | 'semantic_difference' | 'missing_value';
export interface ConflictField {
    fieldName: string;
    fieldPath: string;
    status: ConflictFieldStatus;
    ocrValue: unknown;
    llmValue: unknown;
    finalValue?: unknown;
    similarityScore: number;
    ocrConfidence?: number;
    llmConfidence?: number;
    conflictReason: ConflictReason | null;
    reviewedBy?: string;
    reviewedAt?: string;
    resolutionNote?: string;
    createdAt: string;
    autoResolved?: boolean;
}
export interface ResolveConflictRequest {
    fieldPath: string;
    resolvedValue: unknown;
    resolutionNote?: string;
}
export interface ResolveConflictResponse {
    success: boolean;
    conflict: ConflictField;
    message?: string;
}
export interface ConflictsSummary {
    extractionId: string;
    documentId: string;
    totalConflicts: number;
    pendingConflicts: number;
    resolvedConflicts: number;
    confirmedFields: number;
    conflicts: ConflictField[];
}
export interface Person {
    id: string;
    case_id: string;
    full_name: string;
    cpf: string | null;
    rg: string | null;
    rg_issuer: string | null;
    birth_date: string | null;
    nationality: string | null;
    marital_status: MaritalStatus | null;
    profession: string | null;
    address: Address | null;
    email: string | null;
    phone: string | null;
    father_name: string | null;
    mother_name: string | null;
    confidence: number;
    source_docs: string[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'stable_union';
export interface Address {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
    latitude?: number;
    longitude?: number;
    formatted_address?: string;
    geocoded_at?: string;
    geocode_confidence?: number;
    geocode_status?: 'pending' | 'success' | 'failed' | 'partial';
}
export interface Property {
    id: string;
    case_id: string;
    registry_number: string | null;
    registry_office: string | null;
    address: Address | null;
    area_sqm: number | null;
    description: string | null;
    iptu_number: string | null;
    encumbrances: Encumbrance[] | null;
    confidence: number;
    source_docs: string[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface Encumbrance {
    type: string;
    description: string;
    value?: number;
    beneficiary?: string;
}
export interface Evidence {
    id: string;
    entity_type: 'person' | 'property';
    entity_id: string;
    field_name: string;
    document_id: string;
    page_number: number;
    bounding_box: BoundingBox | null;
    extracted_text: string;
    confidence: number;
    source: 'ocr' | 'llm' | 'consensus';
    created_at: string;
}
export interface GraphEdge {
    id: string;
    case_id: string;
    source_type: 'person' | 'property';
    source_id: string;
    target_type: 'person' | 'property';
    target_id: string;
    relationship: RelationshipType;
    confidence: number;
    confirmed: boolean;
    metadata: GraphEdgeMetadata;
    created_at: string;
}
export interface GraphEdgeMetadata {
    proxy_document_id?: string;
    proxy_attached_at?: string;
    [key: string]: unknown;
}
export type RelationshipType = 'spouse_of' | 'represents' | 'owns' | 'sells' | 'buys' | 'guarantor_of' | 'witness_for';
export interface Draft {
    id: string;
    case_id: string;
    version: number;
    content: DraftContent;
    html_content: string;
    pending_items: PendingItem[];
    status: DraftStatus;
    created_at: string;
}
export type DraftStatus = 'generated' | 'reviewing' | 'approved';
export interface DraftContent {
    sections: DraftSection[];
}
export interface DraftSection {
    id: string;
    title: string;
    type: SectionType;
    content: string;
    order: number;
}
export type SectionType = 'header' | 'parties' | 'object' | 'price' | 'conditions' | 'clauses' | 'closing';
export interface DraftTemplate {
    id: string;
    name: string;
    description: string;
    actType: ActType;
    icon?: string;
    sections: DraftSection[];
}
export interface PendingItem {
    id: string;
    section_id: string;
    field_path: string;
    reason: string;
    severity: 'error' | 'warning' | 'info';
}
export interface ChatSession {
    id: string;
    case_id: string;
    draft_id: string;
    created_at: string;
}
export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    operation: ChatOperation | null;
    created_at: string;
}
export interface ChatOperation {
    type: ChatOperationType;
    target_path?: string;
    old_value?: unknown;
    new_value?: unknown;
    section_id?: string;
    reason?: string;
    status?: 'pending_approval' | 'approved' | 'rejected';
}
export type ChatOperationType = 'update_field' | 'regenerate_section' | 'add_clause' | 'remove_clause' | 'mark_pending' | 'resolve_pending';
export interface OperationsLog {
    id: string;
    case_id: string;
    draft_id: string;
    user_id: string;
    operation_type: string;
    target_path: string;
    old_value: unknown;
    new_value: unknown;
    reason: string;
    created_at: string;
}
export interface ProcessingJob {
    id: string;
    case_id: string;
    document_id: string | null;
    job_type: JobType;
    status: JobStatus;
    attempts: number;
    max_attempts: number;
    error_message: string | null;
    result: Record<string, unknown> | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    last_retry_at: string | null;
    retry_delay_ms: number;
}
export type JobType = 'ocr' | 'extraction' | 'consensus' | 'entity_resolution' | 'entity_extraction' | 'draft';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
export interface CanonicalData {
    people: Person[];
    properties: Property[];
    edges: GraphEdge[];
    deal: DealDetails | null;
}
export interface DealDetails {
    type: ActType;
    price?: number;
    paymentSchedule?: PaymentSchedule;
    conditions?: string[];
}
export interface PaymentSchedule {
    entries: PaymentEntry[];
}
export interface PaymentEntry {
    description: string;
    percentage?: number;
    amount?: number;
    due_date?: string;
}
export interface CanvasNode {
    id: string;
    type: 'person' | 'property';
    position: {
        x: number;
        y: number;
    };
    data: Person | Property;
}
export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    type: 'relationship';
    data: {
        relationship: RelationshipType;
        confirmed: boolean;
        confidence: number;
    };
}
export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}
export interface UploadProgress {
    file_name: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
}
export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}
export interface FilterState {
    status?: string[];
    confidence?: string[];
    document_type?: string[];
    date_range?: {
        start: string;
        end: string;
    };
}
export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'CPF' | 'RG' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'PROPERTY_REGISTRY' | 'RELATIONSHIP' | 'DOCUMENT_NUMBER' | 'OTHER';
export interface ExtractedEntity {
    id: string;
    document_id: string;
    type: EntityType;
    value: string;
    confidence: number;
    position?: {
        page?: number;
        start_offset?: number;
        end_offset?: number;
        bounding_box?: BoundingBox;
    };
    context?: string;
    normalized_value?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}
export interface EntityExtractionResult {
    entities: ExtractedEntity[];
    document_id: string;
    processing_time_ms: number;
    model_used: string;
    tokens_used?: number;
}
/**
 * Links a PersonCandidate field to its source extracted entity.
 * Used for creating evidence records.
 */
export interface EntitySource {
    field_name: string;
    entity_id: string;
    document_id: string;
    entity_type: EntityType;
    value: string;
    confidence: number;
    position?: {
        page?: number;
        bounding_box?: BoundingBox;
    };
}
/**
 * Status of a merge suggestion
 */
export type MergeSuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'auto_merged';
/**
 * Reason why a merge was suggested
 */
export type MergeSuggestionReason = 'same_cpf' | 'similar_name' | 'same_rg' | 'name_and_birth_date' | 'name_and_address';
/**
 * Represents a suggestion to merge two person candidates.
 * Created when two persons might be the same but can't be auto-merged.
 */
export interface MergeSuggestion {
    id: string;
    case_id: string;
    person_a_id: string;
    person_b_id: string;
    reason: MergeSuggestionReason;
    confidence: number;
    similarity_score: number;
    status: MergeSuggestionStatus;
    reviewed_by: string | null;
    reviewed_at: string | null;
    matching_fields: string[];
    conflicting_fields: string[];
    notes: string | null;
    created_at: string;
    updated_at: string;
}
/**
 * Extended metadata interface for tracking merge history in Person records.
 * This enables split functionality by preserving original merge data.
 */
export interface MergeMetadata {
    merged_from?: string[];
    merged_at?: string;
    original_data_a?: Partial<Person>;
    original_data_b?: Partial<Person>;
    merge_reason?: string;
    [key: string]: unknown;
}
/**
 * Represents a candidate for splitting - a merged person that can be separated.
 */
export interface SplitCandidate {
    id: string;
    merged_person: Person;
    merge_metadata: MergeMetadata;
    original_person_a?: Partial<Person>;
    original_person_b?: Partial<Person>;
    merged_at: string;
    can_split: boolean;
    split_confidence: number;
}
/**
 * Represents a user's presence state on the canvas
 */
export interface CanvasPresence {
    user_id: string;
    user_name: string;
    cursor_x: number;
    cursor_y: number;
    color: string;
    last_updated: number;
}
/**
 * Presence state for the entire canvas session
 */
export interface PresenceState {
    [user_id: string]: CanvasPresence;
}
//# sourceMappingURL=index.d.ts.map