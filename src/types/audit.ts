// ============================================================================
// Audit Trail Types
// ============================================================================

/**
 * Types of actions that can be tracked in the audit trail
 */
export type AuditActionType =
  // Document actions
  | 'document_upload'
  | 'document_delete'
  | 'document_approve'
  | 'document_reject'
  | 'document_status_change'
  // Person entity actions
  | 'person_create'
  | 'person_update'
  | 'person_delete'
  | 'person_merge'
  // Property entity actions
  | 'property_create'
  | 'property_update'
  | 'property_delete'
  // Relationship/Edge actions
  | 'edge_create'
  | 'edge_update'
  | 'edge_delete'
  | 'edge_confirm'
  // Draft actions
  | 'draft_create'
  | 'draft_update'
  | 'draft_approve'
  | 'draft_section_update'
  | 'draft_clause_add'
  | 'draft_clause_remove'
  // Field actions
  | 'field_update'
  | 'field_resolve_conflict'
  // Case actions
  | 'case_create'
  | 'case_update'
  | 'case_status_change'
  | 'case_assign'
  // Generic actions
  | 'custom'

/**
 * Categories for audit actions
 */
export type AuditCategory =
  | 'document'
  | 'person'
  | 'property'
  | 'relationship'
  | 'draft'
  | 'field'
  | 'case'
  | 'system'

/**
 * Status of an audit entry
 */
export type AuditEntryStatus = 'success' | 'pending' | 'failed' | 'rejected'

/**
 * Evidence attached to an audit entry
 */
export interface AuditEvidence {
  id: string
  type: 'screenshot' | 'document' | 'diff' | 'snapshot' | 'reference'
  label: string
  data: string | Record<string, unknown>  // base64 for images, JSON for diffs/snapshots
  timestamp: string
}

/**
 * Field change evidence - captures before/after values
 */
export interface FieldChangeEvidence {
  fieldName: string
  fieldPath: string
  previousValue: unknown
  newValue: unknown
  previousDisplayValue?: string
  newDisplayValue?: string
  source?: 'user' | 'system' | 'ai' | 'import'
}

/**
 * Main audit entry interface
 */
export interface AuditEntry {
  id: string
  caseId: string

  // Action details
  action: AuditActionType
  category: AuditCategory
  status: AuditEntryStatus

  // Target information
  targetType: 'document' | 'person' | 'property' | 'edge' | 'draft' | 'case' | 'field'
  targetId: string
  targetLabel: string  // Human-readable name/description of the target

  // Change details
  description: string
  details?: string

  // Evidence and data
  changes?: FieldChangeEvidence[]
  evidence?: AuditEvidence[]
  metadata?: Record<string, unknown>

  // User information
  userId: string
  userName: string
  userRole?: string

  // Timestamps
  timestamp: string
  createdAt: string
}

/**
 * Payload for creating an audit entry
 */
export interface CreateAuditEntryPayload {
  caseId: string
  action: AuditActionType
  category: AuditCategory
  status?: AuditEntryStatus
  targetType: AuditEntry['targetType']
  targetId: string
  targetLabel: string
  description: string
  details?: string
  changes?: FieldChangeEvidence[]
  evidence?: Omit<AuditEvidence, 'id' | 'timestamp'>[]
  metadata?: Record<string, unknown>
  userId?: string
  userName?: string
  userRole?: string
}

/**
 * Filters for querying audit entries
 */
export interface AuditFilters {
  caseId?: string
  userId?: string
  action?: AuditActionType | AuditActionType[]
  category?: AuditCategory | AuditCategory[]
  status?: AuditEntryStatus | AuditEntryStatus[]
  targetType?: AuditEntry['targetType'] | AuditEntry['targetType'][]
  targetId?: string
  dateFrom?: string
  dateTo?: string
  searchTerm?: string
}

/**
 * Summary statistics for audit trail
 */
export interface AuditSummary {
  totalEntries: number
  entriesByCategory: Record<AuditCategory, number>
  entriesByStatus: Record<AuditEntryStatus, number>
  entriesByAction: Record<string, number>
  recentUsers: { userId: string; userName: string; count: number }[]
  lastUpdated: string
}

/**
 * Audit trail state for the store
 */
export interface AuditTrailState {
  entries: AuditEntry[]
  isLoading: boolean
  error: string | null
  filters: AuditFilters
  summary: AuditSummary | null
}
