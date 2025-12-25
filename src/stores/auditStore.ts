import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  AuditEntry,
  AuditFilters,
  AuditSummary,
  AuditTrailState,
  CreateAuditEntryPayload,
  AuditCategory,
  AuditEntryStatus,
  FieldChangeEvidence,
  AuditEvidence,
} from '../types/audit'

// Generate unique ID
function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Calculate summary from entries
function calculateSummary(entries: AuditEntry[]): AuditSummary {
  const entriesByCategory = {} as Record<AuditCategory, number>
  const entriesByStatus = {} as Record<AuditEntryStatus, number>
  const entriesByAction = {} as Record<string, number>
  const userCounts: Record<string, { userId: string; userName: string; count: number }> = {}

  entries.forEach((entry) => {
    // Count by category
    entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1

    // Count by status
    entriesByStatus[entry.status] = (entriesByStatus[entry.status] || 0) + 1

    // Count by action
    entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1

    // Count by user
    if (!userCounts[entry.userId]) {
      userCounts[entry.userId] = {
        userId: entry.userId,
        userName: entry.userName,
        count: 0,
      }
    }
    userCounts[entry.userId].count++
  })

  const recentUsers = Object.values(userCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalEntries: entries.length,
    entriesByCategory,
    entriesByStatus,
    entriesByAction,
    recentUsers,
    lastUpdated: new Date().toISOString(),
  }
}

// Filter entries based on filters
function filterEntries(entries: AuditEntry[], filters: AuditFilters): AuditEntry[] {
  return entries.filter((entry) => {
    // Filter by caseId
    if (filters.caseId && entry.caseId !== filters.caseId) return false

    // Filter by userId
    if (filters.userId && entry.userId !== filters.userId) return false

    // Filter by action
    if (filters.action) {
      const actions = Array.isArray(filters.action) ? filters.action : [filters.action]
      if (!actions.includes(entry.action)) return false
    }

    // Filter by category
    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category]
      if (!categories.includes(entry.category)) return false
    }

    // Filter by status
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      if (!statuses.includes(entry.status)) return false
    }

    // Filter by targetType
    if (filters.targetType) {
      const types = Array.isArray(filters.targetType) ? filters.targetType : [filters.targetType]
      if (!types.includes(entry.targetType)) return false
    }

    // Filter by targetId
    if (filters.targetId && entry.targetId !== filters.targetId) return false

    // Filter by date range
    if (filters.dateFrom) {
      const entryDate = new Date(entry.timestamp)
      const fromDate = new Date(filters.dateFrom)
      if (entryDate < fromDate) return false
    }

    if (filters.dateTo) {
      const entryDate = new Date(entry.timestamp)
      const toDate = new Date(filters.dateTo)
      if (entryDate > toDate) return false
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      const searchableText = [
        entry.description,
        entry.details,
        entry.targetLabel,
        entry.userName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchableText.includes(term)) return false
    }

    return true
  })
}

interface AuditStoreActions {
  // Core actions
  addEntry: (payload: CreateAuditEntryPayload) => AuditEntry
  removeEntry: (id: string) => void
  clearEntries: (caseId?: string) => void

  // Filtering
  setFilters: (filters: Partial<AuditFilters>) => void
  clearFilters: () => void
  getFilteredEntries: () => AuditEntry[]

  // Queries
  getEntriesByCase: (caseId: string) => AuditEntry[]
  getEntriesByTarget: (targetType: string, targetId: string) => AuditEntry[]
  getEntryById: (id: string) => AuditEntry | undefined
  getSummary: (caseId?: string) => AuditSummary

  // Evidence management
  addEvidence: (entryId: string, evidence: Omit<AuditEvidence, 'id' | 'timestamp'>) => void

  // Convenience methods for common actions
  logDocumentUpload: (caseId: string, documentId: string, documentName: string, userId: string, userName: string) => AuditEntry
  logDocumentDelete: (caseId: string, documentId: string, documentName: string, userId: string, userName: string) => AuditEntry
  logPersonCreate: (caseId: string, personId: string, personName: string, userId: string, userName: string) => AuditEntry
  logPersonUpdate: (caseId: string, personId: string, personName: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry
  logPersonDelete: (caseId: string, personId: string, personName: string, userId: string, userName: string) => AuditEntry
  logPropertyCreate: (caseId: string, propertyId: string, propertyLabel: string, userId: string, userName: string) => AuditEntry
  logPropertyUpdate: (caseId: string, propertyId: string, propertyLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry
  logPropertyDelete: (caseId: string, propertyId: string, propertyLabel: string, userId: string, userName: string) => AuditEntry
  logEdgeCreate: (caseId: string, edgeId: string, edgeLabel: string, userId: string, userName: string) => AuditEntry
  logEdgeDelete: (caseId: string, edgeId: string, edgeLabel: string, userId: string, userName: string) => AuditEntry
  logFieldUpdate: (caseId: string, targetType: AuditEntry['targetType'], targetId: string, targetLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry
  logConflictResolution: (caseId: string, documentId: string, documentName: string, fieldName: string, resolvedValue: unknown, userId: string, userName: string) => AuditEntry
  logCaseStatusChange: (caseId: string, caseTitle: string, oldStatus: string, newStatus: string, userId: string, userName: string) => AuditEntry
  logDraftSectionUpdate: (caseId: string, draftId: string, draftLabel: string, sectionId: string, sectionTitle: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry

  // State
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

type AuditStore = AuditTrailState & AuditStoreActions

const initialState: AuditTrailState = {
  entries: [],
  isLoading: false,
  error: null,
  filters: {},
  summary: null,
}

export const useAuditStore = create<AuditStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Core actions
        addEntry: (payload) => {
          const now = new Date().toISOString()
          const entry: AuditEntry = {
            id: generateId(),
            caseId: payload.caseId,
            action: payload.action,
            category: payload.category,
            status: payload.status || 'success',
            targetType: payload.targetType,
            targetId: payload.targetId,
            targetLabel: payload.targetLabel,
            description: payload.description,
            details: payload.details,
            changes: payload.changes,
            evidence: payload.evidence?.map((e) => ({
              ...e,
              id: generateId(),
              timestamp: now,
            })),
            metadata: payload.metadata,
            userId: payload.userId || 'system',
            userName: payload.userName || 'Sistema',
            userRole: payload.userRole,
            timestamp: now,
            createdAt: now,
          }

          set((state) => ({
            entries: [entry, ...state.entries],
            summary: calculateSummary([entry, ...state.entries]),
          }))

          return entry
        },

        removeEntry: (id) => {
          set((state) => {
            const entries = state.entries.filter((e) => e.id !== id)
            return {
              entries,
              summary: calculateSummary(entries),
            }
          })
        },

        clearEntries: (caseId) => {
          set((state) => {
            const entries = caseId
              ? state.entries.filter((e) => e.caseId !== caseId)
              : []
            return {
              entries,
              summary: calculateSummary(entries),
            }
          })
        },

        // Filtering
        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
          }))
        },

        clearFilters: () => {
          set({ filters: {} })
        },

        getFilteredEntries: () => {
          const state = get()
          return filterEntries(state.entries, state.filters)
        },

        // Queries
        getEntriesByCase: (caseId) => {
          return get().entries.filter((e) => e.caseId === caseId)
        },

        getEntriesByTarget: (targetType, targetId) => {
          return get().entries.filter(
            (e) => e.targetType === targetType && e.targetId === targetId
          )
        },

        getEntryById: (id) => {
          return get().entries.find((e) => e.id === id)
        },

        getSummary: (caseId) => {
          const entries = caseId
            ? get().entries.filter((e) => e.caseId === caseId)
            : get().entries
          return calculateSummary(entries)
        },

        // Evidence management
        addEvidence: (entryId, evidence) => {
          set((state) => ({
            entries: state.entries.map((entry) => {
              if (entry.id === entryId) {
                const newEvidence: AuditEvidence = {
                  ...evidence,
                  id: generateId(),
                  timestamp: new Date().toISOString(),
                }
                return {
                  ...entry,
                  evidence: [...(entry.evidence || []), newEvidence],
                }
              }
              return entry
            }),
          }))
        },

        // Convenience methods
        logDocumentUpload: (caseId, documentId, documentName, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'document_upload',
            category: 'document',
            targetType: 'document',
            targetId: documentId,
            targetLabel: documentName,
            description: `Documento "${documentName}" foi carregado`,
            userId,
            userName,
          })
        },

        logDocumentDelete: (caseId, documentId, documentName, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'document_delete',
            category: 'document',
            targetType: 'document',
            targetId: documentId,
            targetLabel: documentName,
            description: `Documento "${documentName}" foi removido`,
            userId,
            userName,
          })
        },

        logPersonCreate: (caseId, personId, personName, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'person_create',
            category: 'person',
            targetType: 'person',
            targetId: personId,
            targetLabel: personName,
            description: `Pessoa "${personName}" foi criada`,
            userId,
            userName,
          })
        },

        logPersonUpdate: (caseId, personId, personName, changes, userId, userName) => {
          const changedFields = changes.map((c) => c.fieldName).join(', ')
          return get().addEntry({
            caseId,
            action: 'person_update',
            category: 'person',
            targetType: 'person',
            targetId: personId,
            targetLabel: personName,
            description: `Pessoa "${personName}" foi atualizada`,
            details: `Campos alterados: ${changedFields}`,
            changes,
            userId,
            userName,
          })
        },

        logPersonDelete: (caseId, personId, personName, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'person_delete',
            category: 'person',
            targetType: 'person',
            targetId: personId,
            targetLabel: personName,
            description: `Pessoa "${personName}" foi removida`,
            userId,
            userName,
          })
        },

        logPropertyCreate: (caseId, propertyId, propertyLabel, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'property_create',
            category: 'property',
            targetType: 'property',
            targetId: propertyId,
            targetLabel: propertyLabel,
            description: `Imóvel "${propertyLabel}" foi criado`,
            userId,
            userName,
          })
        },

        logPropertyUpdate: (caseId, propertyId, propertyLabel, changes, userId, userName) => {
          const changedFields = changes.map((c) => c.fieldName).join(', ')
          return get().addEntry({
            caseId,
            action: 'property_update',
            category: 'property',
            targetType: 'property',
            targetId: propertyId,
            targetLabel: propertyLabel,
            description: `Imóvel "${propertyLabel}" foi atualizado`,
            details: `Campos alterados: ${changedFields}`,
            changes,
            userId,
            userName,
          })
        },

        logPropertyDelete: (caseId, propertyId, propertyLabel, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'property_delete',
            category: 'property',
            targetType: 'property',
            targetId: propertyId,
            targetLabel: propertyLabel,
            description: `Imóvel "${propertyLabel}" foi removido`,
            userId,
            userName,
          })
        },

        logEdgeCreate: (caseId, edgeId, edgeLabel, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'edge_create',
            category: 'relationship',
            targetType: 'edge',
            targetId: edgeId,
            targetLabel: edgeLabel,
            description: `Relacionamento "${edgeLabel}" foi criado`,
            userId,
            userName,
          })
        },

        logEdgeDelete: (caseId, edgeId, edgeLabel, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'edge_delete',
            category: 'relationship',
            targetType: 'edge',
            targetId: edgeId,
            targetLabel: edgeLabel,
            description: `Relacionamento "${edgeLabel}" foi removido`,
            userId,
            userName,
          })
        },

        logFieldUpdate: (caseId, targetType, targetId, targetLabel, changes, userId, userName) => {
          const changedFields = changes.map((c) => c.fieldName).join(', ')
          return get().addEntry({
            caseId,
            action: 'field_update',
            category: 'field',
            targetType,
            targetId,
            targetLabel,
            description: `Campos de "${targetLabel}" foram atualizados`,
            details: `Campos alterados: ${changedFields}`,
            changes,
            userId,
            userName,
          })
        },

        logConflictResolution: (caseId, documentId, documentName, fieldName, resolvedValue, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'field_resolve_conflict',
            category: 'field',
            targetType: 'document',
            targetId: documentId,
            targetLabel: documentName,
            description: `Conflito no campo "${fieldName}" foi resolvido`,
            details: `Valor resolvido: ${String(resolvedValue)}`,
            userId,
            userName,
          })
        },

        logCaseStatusChange: (caseId, caseTitle, oldStatus, newStatus, userId, userName) => {
          return get().addEntry({
            caseId,
            action: 'case_status_change',
            category: 'case',
            targetType: 'case',
            targetId: caseId,
            targetLabel: caseTitle,
            description: `Status do caso "${caseTitle}" foi alterado`,
            details: `De "${oldStatus}" para "${newStatus}"`,
            changes: [
              {
                fieldName: 'status',
                fieldPath: 'status',
                previousValue: oldStatus,
                newValue: newStatus,
                previousDisplayValue: oldStatus,
                newDisplayValue: newStatus,
                source: 'user',
              },
            ],
            userId,
            userName,
          })
        },

        logDraftSectionUpdate: (caseId, draftId, draftLabel, sectionId, sectionTitle, changes, userId, userName) => {
          const changedFields = changes.map((c) => c.fieldName).join(', ')
          return get().addEntry({
            caseId,
            action: 'draft_section_update',
            category: 'draft',
            targetType: 'draft',
            targetId: draftId,
            targetLabel: draftLabel,
            description: `Seção "${sectionTitle}" da minuta foi atualizada`,
            details: changedFields ? `Campos alterados: ${changedFields}` : undefined,
            changes,
            metadata: {
              sectionId,
              sectionTitle,
            },
            userId,
            userName,
          })
        },

        // State management
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        reset: () => set(initialState),
      }),
      {
        name: 'audit-store',
        partialize: (state) => ({
          entries: state.entries,
        }),
      }
    ),
    { name: 'audit-store' }
  )
)

// Hook for audit trail in a specific case
export function useCaseAuditTrail(caseId: string) {
  const store = useAuditStore()

  return {
    entries: store.getEntriesByCase(caseId),
    summary: store.getSummary(caseId),
    addEntry: (payload: Omit<CreateAuditEntryPayload, 'caseId'>) =>
      store.addEntry({ ...payload, caseId }),
    logDocumentUpload: (documentId: string, documentName: string, userId: string, userName: string) =>
      store.logDocumentUpload(caseId, documentId, documentName, userId, userName),
    logDocumentDelete: (documentId: string, documentName: string, userId: string, userName: string) =>
      store.logDocumentDelete(caseId, documentId, documentName, userId, userName),
    logPersonCreate: (personId: string, personName: string, userId: string, userName: string) =>
      store.logPersonCreate(caseId, personId, personName, userId, userName),
    logPersonUpdate: (personId: string, personName: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>
      store.logPersonUpdate(caseId, personId, personName, changes, userId, userName),
    logPersonDelete: (personId: string, personName: string, userId: string, userName: string) =>
      store.logPersonDelete(caseId, personId, personName, userId, userName),
    logPropertyCreate: (propertyId: string, propertyLabel: string, userId: string, userName: string) =>
      store.logPropertyCreate(caseId, propertyId, propertyLabel, userId, userName),
    logPropertyUpdate: (propertyId: string, propertyLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>
      store.logPropertyUpdate(caseId, propertyId, propertyLabel, changes, userId, userName),
    logPropertyDelete: (propertyId: string, propertyLabel: string, userId: string, userName: string) =>
      store.logPropertyDelete(caseId, propertyId, propertyLabel, userId, userName),
    logEdgeCreate: (edgeId: string, edgeLabel: string, userId: string, userName: string) =>
      store.logEdgeCreate(caseId, edgeId, edgeLabel, userId, userName),
    logEdgeDelete: (edgeId: string, edgeLabel: string, userId: string, userName: string) =>
      store.logEdgeDelete(caseId, edgeId, edgeLabel, userId, userName),
    logFieldUpdate: (targetType: AuditEntry['targetType'], targetId: string, targetLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>
      store.logFieldUpdate(caseId, targetType, targetId, targetLabel, changes, userId, userName),
    logConflictResolution: (documentId: string, documentName: string, fieldName: string, resolvedValue: unknown, userId: string, userName: string) =>
      store.logConflictResolution(caseId, documentId, documentName, fieldName, resolvedValue, userId, userName),
    logDraftSectionUpdate: (draftId: string, draftLabel: string, sectionId: string, sectionTitle: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>
      store.logDraftSectionUpdate(caseId, draftId, draftLabel, sectionId, sectionTitle, changes, userId, userName),
    clearEntries: () => store.clearEntries(caseId),
  }
}

export default useAuditStore
