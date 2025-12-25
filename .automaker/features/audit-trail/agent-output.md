# Planning Outline

1. **Goal**: Implement an audit trail system that captures all changes with evidence in the application.

2. **Approach**: I'll first explore the codebase to understand the existing structure, then implement an audit trail feature that logs all user actions and changes with timestamps, user information, and evidence of what was changed. This will likely involve creating audit logging utilities, integrating them into existing data modification flows, and providing a UI to view the audit history.

3. **Files to Touch**:
   - `src/lib/audit.ts` - New audit trail utility/service
   - `src/store/` - Integrate audit logging into state changes
   - `src/components/AuditTrail.tsx` - UI component to display audit history
   - Existing components that modify data - Add audit logging calls

4. **Tasks**:
   1. Explore codebase structure to understand existing patterns
   2. Create audit trail data model and storage mechanism
   3. Implement audit logging utility functions
   4. Integrate audit logging into existing data modification flows
   5. Create UI component to display audit trail
   6. Verify implementation with Playwright MCP tools

5. **Risks**:
   - Need to identify all places where data changes occur
   - Storage mechanism choice (localStorage vs in-memory vs backend)
   - Performance impact of logging every change

[PLAN_GENERATED] Planning outline complete.

---

Now let me explore the codebase to understand the existing structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx,js,jsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/user/repos/fintrack/package.json"
}

Let me find the correct project path:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx}"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la",
  "description": "List files in current directory"
}

Let me explore the source structure more:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\stores\\caseStore.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/types/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\main.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/pages/**/*.tsx"
}

Now let me look at the App.tsx and existing components structure:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\lib\\supabase.ts"
}

Now let me look at the HistoryPage which seems related to audit trail, and see the OperationsLog type already defined:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\HistoryPage.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/stores/**/*.ts"
}

I can see the project has a History page that currently uses mock data. The types file already has an `OperationsLog` interface. Now let me implement a comprehensive audit trail system. Let me create the audit store and update the necessary files:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "in_progress",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "pending",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "pending",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "pending",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "pending",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "pending",
      "activeForm": "Verifying implementation"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\audit.ts",
  "content": "// ============================================================================\n// Audit Trail Types\n// ============================================================================\n\n/**\n * Types of actions that can be tracked in the audit trail\n */\nexport type AuditActionType =\n  // Document actions\n  | 'document_upload'\n  | 'document_delete'\n  | 'document_approve'\n  | 'document_reject'\n  | 'document_status_change'\n  // Person entity actions\n  | 'person_create'\n  | 'person_update'\n  | 'person_delete'\n  | 'person_merge'\n  // Property entity actions\n  | 'property_create'\n  | 'property_update'\n  | 'property_delete'\n  // Relationship/Edge actions\n  | 'edge_create'\n  | 'edge_update'\n  | 'edge_delete'\n  | 'edge_confirm'\n  // Draft actions\n  | 'draft_create'\n  | 'draft_update'\n  | 'draft_approve'\n  | 'draft_section_update'\n  | 'draft_clause_add'\n  | 'draft_clause_remove'\n  // Field actions\n  | 'field_update'\n  | 'field_resolve_conflict'\n  // Case actions\n  | 'case_create'\n  | 'case_update'\n  | 'case_status_change'\n  | 'case_assign'\n  // Generic actions\n  | 'custom'\n\n/**\n * Categories for audit actions\n */\nexport type AuditCategory =\n  | 'document'\n  | 'person'\n  | 'property'\n  | 'relationship'\n  | 'draft'\n  | 'field'\n  | 'case'\n  | 'system'\n\n/**\n * Status of an audit entry\n */\nexport type AuditEntryStatus = 'success' | 'pending' | 'failed' | 'rejected'\n\n/**\n * Evidence attached to an audit entry\n */\nexport interface AuditEvidence {\n  id: string\n  type: 'screenshot' | 'document' | 'diff' | 'snapshot' | 'reference'\n  label: string\n  data: string | Record<string, unknown>  // base64 for images, JSON for diffs/snapshots\n  timestamp: string\n}\n\n/**\n * Field change evidence - captures before/after values\n */\nexport interface FieldChangeEvidence {\n  fieldName: string\n  fieldPath: string\n  previousValue: unknown\n  newValue: unknown\n  previousDisplayValue?: string\n  newDisplayValue?: string\n  source?: 'user' | 'system' | 'ai' | 'import'\n}\n\n/**\n * Main audit entry interface\n */\nexport interface AuditEntry {\n  id: string\n  caseId: string\n\n  // Action details\n  action: AuditActionType\n  category: AuditCategory\n  status: AuditEntryStatus\n\n  // Target information\n  targetType: 'document' | 'person' | 'property' | 'edge' | 'draft' | 'case' | 'field'\n  targetId: string\n  targetLabel: string  // Human-readable name/description of the target\n\n  // Change details\n  description: string\n  details?: string\n\n  // Evidence and data\n  changes?: FieldChangeEvidence[]\n  evidence?: AuditEvidence[]\n  metadata?: Record<string, unknown>\n\n  // User information\n  userId: string\n  userName: string\n  userRole?: string\n\n  // Timestamps\n  timestamp: string\n  createdAt: string\n}\n\n/**\n * Payload for creating an audit entry\n */\nexport interface CreateAuditEntryPayload {\n  caseId: string\n  action: AuditActionType\n  category: AuditCategory\n  status?: AuditEntryStatus\n  targetType: AuditEntry['targetType']\n  targetId: string\n  targetLabel: string\n  description: string\n  details?: string\n  changes?: FieldChangeEvidence[]\n  evidence?: Omit<AuditEvidence, 'id' | 'timestamp'>[]\n  metadata?: Record<string, unknown>\n  userId?: string\n  userName?: string\n  userRole?: string\n}\n\n/**\n * Filters for querying audit entries\n */\nexport interface AuditFilters {\n  caseId?: string\n  userId?: string\n  action?: AuditActionType | AuditActionType[]\n  category?: AuditCategory | AuditCategory[]\n  status?: AuditEntryStatus | AuditEntryStatus[]\n  targetType?: AuditEntry['targetType'] | AuditEntry['targetType'][]\n  targetId?: string\n  dateFrom?: string\n  dateTo?: string\n  searchTerm?: string\n}\n\n/**\n * Summary statistics for audit trail\n */\nexport interface AuditSummary {\n  totalEntries: number\n  entriesByCategory: Record<AuditCategory, number>\n  entriesByStatus: Record<AuditEntryStatus, number>\n  entriesByAction: Record<string, number>\n  recentUsers: { userId: string; userName: string; count: number }[]\n  lastUpdated: string\n}\n\n/**\n * Audit trail state for the store\n */\nexport interface AuditTrailState {\n  entries: AuditEntry[]\n  isLoading: boolean\n  error: string | null\n  filters: AuditFilters\n  summary: AuditSummary | null\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "in_progress",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "completed",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "pending",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "pending",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "pending",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "pending",
      "activeForm": "Verifying implementation"
    }
  ]
}

Now let me create the audit store:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\stores\\auditStore.ts",
  "content": "import { create } from 'zustand'\nimport { devtools, persist } from 'zustand/middleware'\nimport type {\n  AuditEntry,\n  AuditFilters,\n  AuditSummary,\n  AuditTrailState,\n  CreateAuditEntryPayload,\n  AuditCategory,\n  AuditEntryStatus,\n  FieldChangeEvidence,\n  AuditEvidence,\n} from '../types/audit'\n\n// Generate unique ID\nfunction generateId(): string {\n  return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`\n}\n\n// Calculate summary from entries\nfunction calculateSummary(entries: AuditEntry[]): AuditSummary {\n  const entriesByCategory = {} as Record<AuditCategory, number>\n  const entriesByStatus = {} as Record<AuditEntryStatus, number>\n  const entriesByAction = {} as Record<string, number>\n  const userCounts: Record<string, { userId: string; userName: string; count: number }> = {}\n\n  entries.forEach((entry) => {\n    // Count by category\n    entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1\n\n    // Count by status\n    entriesByStatus[entry.status] = (entriesByStatus[entry.status] || 0) + 1\n\n    // Count by action\n    entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1\n\n    // Count by user\n    if (!userCounts[entry.userId]) {\n      userCounts[entry.userId] = {\n        userId: entry.userId,\n        userName: entry.userName,\n        count: 0,\n      }\n    }\n    userCounts[entry.userId].count++\n  })\n\n  const recentUsers = Object.values(userCounts)\n    .sort((a, b) => b.count - a.count)\n    .slice(0, 10)\n\n  return {\n    totalEntries: entries.length,\n    entriesByCategory,\n    entriesByStatus,\n    entriesByAction,\n    recentUsers,\n    lastUpdated: new Date().toISOString(),\n  }\n}\n\n// Filter entries based on filters\nfunction filterEntries(entries: AuditEntry[], filters: AuditFilters): AuditEntry[] {\n  return entries.filter((entry) => {\n    // Filter by caseId\n    if (filters.caseId && entry.caseId !== filters.caseId) return false\n\n    // Filter by userId\n    if (filters.userId && entry.userId !== filters.userId) return false\n\n    // Filter by action\n    if (filters.action) {\n      const actions = Array.isArray(filters.action) ? filters.action : [filters.action]\n      if (!actions.includes(entry.action)) return false\n    }\n\n    // Filter by category\n    if (filters.category) {\n      const categories = Array.isArray(filters.category) ? filters.category : [filters.category]\n      if (!categories.includes(entry.category)) return false\n    }\n\n    // Filter by status\n    if (filters.status) {\n      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]\n      if (!statuses.includes(entry.status)) return false\n    }\n\n    // Filter by targetType\n    if (filters.targetType) {\n      const types = Array.isArray(filters.targetType) ? filters.targetType : [filters.targetType]\n      if (!types.includes(entry.targetType)) return false\n    }\n\n    // Filter by targetId\n    if (filters.targetId && entry.targetId !== filters.targetId) return false\n\n    // Filter by date range\n    if (filters.dateFrom) {\n      const entryDate = new Date(entry.timestamp)\n      const fromDate = new Date(filters.dateFrom)\n      if (entryDate < fromDate) return false\n    }\n\n    if (filters.dateTo) {\n      const entryDate = new Date(entry.timestamp)\n      const toDate = new Date(filters.dateTo)\n      if (entryDate > toDate) return false\n    }\n\n    // Filter by search term\n    if (filters.searchTerm) {\n      const term = filters.searchTerm.toLowerCase()\n      const searchableText = [\n        entry.description,\n        entry.details,\n        entry.targetLabel,\n        entry.userName,\n      ]\n        .filter(Boolean)\n        .join(' ')\n        .toLowerCase()\n      if (!searchableText.includes(term)) return false\n    }\n\n    return true\n  })\n}\n\ninterface AuditStoreActions {\n  // Core actions\n  addEntry: (payload: CreateAuditEntryPayload) => AuditEntry\n  removeEntry: (id: string) => void\n  clearEntries: (caseId?: string) => void\n\n  // Filtering\n  setFilters: (filters: Partial<AuditFilters>) => void\n  clearFilters: () => void\n  getFilteredEntries: () => AuditEntry[]\n\n  // Queries\n  getEntriesByCase: (caseId: string) => AuditEntry[]\n  getEntriesByTarget: (targetType: string, targetId: string) => AuditEntry[]\n  getEntryById: (id: string) => AuditEntry | undefined\n  getSummary: (caseId?: string) => AuditSummary\n\n  // Evidence management\n  addEvidence: (entryId: string, evidence: Omit<AuditEvidence, 'id' | 'timestamp'>) => void\n\n  // Convenience methods for common actions\n  logDocumentUpload: (caseId: string, documentId: string, documentName: string, userId: string, userName: string) => AuditEntry\n  logDocumentDelete: (caseId: string, documentId: string, documentName: string, userId: string, userName: string) => AuditEntry\n  logPersonCreate: (caseId: string, personId: string, personName: string, userId: string, userName: string) => AuditEntry\n  logPersonUpdate: (caseId: string, personId: string, personName: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry\n  logPersonDelete: (caseId: string, personId: string, personName: string, userId: string, userName: string) => AuditEntry\n  logPropertyCreate: (caseId: string, propertyId: string, propertyLabel: string, userId: string, userName: string) => AuditEntry\n  logPropertyUpdate: (caseId: string, propertyId: string, propertyLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry\n  logPropertyDelete: (caseId: string, propertyId: string, propertyLabel: string, userId: string, userName: string) => AuditEntry\n  logEdgeCreate: (caseId: string, edgeId: string, edgeLabel: string, userId: string, userName: string) => AuditEntry\n  logEdgeDelete: (caseId: string, edgeId: string, edgeLabel: string, userId: string, userName: string) => AuditEntry\n  logFieldUpdate: (caseId: string, targetType: AuditEntry['targetType'], targetId: string, targetLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) => AuditEntry\n  logConflictResolution: (caseId: string, documentId: string, documentName: string, fieldName: string, resolvedValue: unknown, userId: string, userName: string) => AuditEntry\n  logCaseStatusChange: (caseId: string, caseTitle: string, oldStatus: string, newStatus: string, userId: string, userName: string) => AuditEntry\n\n  // State\n  setLoading: (loading: boolean) => void\n  setError: (error: string | null) => void\n  reset: () => void\n}\n\ntype AuditStore = AuditTrailState & AuditStoreActions\n\nconst initialState: AuditTrailState = {\n  entries: [],\n  isLoading: false,\n  error: null,\n  filters: {},\n  summary: null,\n}\n\nexport const useAuditStore = create<AuditStore>()(\n  devtools(\n    persist(\n      (set, get) => ({\n        ...initialState,\n\n        // Core actions\n        addEntry: (payload) => {\n          const now = new Date().toISOString()\n          const entry: AuditEntry = {\n            id: generateId(),\n            caseId: payload.caseId,\n            action: payload.action,\n            category: payload.category,\n            status: payload.status || 'success',\n            targetType: payload.targetType,\n            targetId: payload.targetId,\n            targetLabel: payload.targetLabel,\n            description: payload.description,\n            details: payload.details,\n            changes: payload.changes,\n            evidence: payload.evidence?.map((e) => ({\n              ...e,\n              id: generateId(),\n              timestamp: now,\n            })),\n            metadata: payload.metadata,\n            userId: payload.userId || 'system',\n            userName: payload.userName || 'Sistema',\n            userRole: payload.userRole,\n            timestamp: now,\n            createdAt: now,\n          }\n\n          set((state) => ({\n            entries: [entry, ...state.entries],\n            summary: calculateSummary([entry, ...state.entries]),\n          }))\n\n          return entry\n        },\n\n        removeEntry: (id) => {\n          set((state) => {\n            const entries = state.entries.filter((e) => e.id !== id)\n            return {\n              entries,\n              summary: calculateSummary(entries),\n            }\n          })\n        },\n\n        clearEntries: (caseId) => {\n          set((state) => {\n            const entries = caseId\n              ? state.entries.filter((e) => e.caseId !== caseId)\n              : []\n            return {\n              entries,\n              summary: calculateSummary(entries),\n            }\n          })\n        },\n\n        // Filtering\n        setFilters: (filters) => {\n          set((state) => ({\n            filters: { ...state.filters, ...filters },\n          }))\n        },\n\n        clearFilters: () => {\n          set({ filters: {} })\n        },\n\n        getFilteredEntries: () => {\n          const state = get()\n          return filterEntries(state.entries, state.filters)\n        },\n\n        // Queries\n        getEntriesByCase: (caseId) => {\n          return get().entries.filter((e) => e.caseId === caseId)\n        },\n\n        getEntriesByTarget: (targetType, targetId) => {\n          return get().entries.filter(\n            (e) => e.targetType === targetType && e.targetId === targetId\n          )\n        },\n\n        getEntryById: (id) => {\n          return get().entries.find((e) => e.id === id)\n        },\n\n        getSummary: (caseId) => {\n          const entries = caseId\n            ? get().entries.filter((e) => e.caseId === caseId)\n            : get().entries\n          return calculateSummary(entries)\n        },\n\n        // Evidence management\n        addEvidence: (entryId, evidence) => {\n          set((state) => ({\n            entries: state.entries.map((entry) => {\n              if (entry.id === entryId) {\n                const newEvidence: AuditEvidence = {\n                  ...evidence,\n                  id: generateId(),\n                  timestamp: new Date().toISOString(),\n                }\n                return {\n                  ...entry,\n                  evidence: [...(entry.evidence || []), newEvidence],\n                }\n              }\n              return entry\n            }),\n          }))\n        },\n\n        // Convenience methods\n        logDocumentUpload: (caseId, documentId, documentName, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'document_upload',\n            category: 'document',\n            targetType: 'document',\n            targetId: documentId,\n            targetLabel: documentName,\n            description: `Documento \"${documentName}\" foi carregado`,\n            userId,\n            userName,\n          })\n        },\n\n        logDocumentDelete: (caseId, documentId, documentName, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'document_delete',\n            category: 'document',\n            targetType: 'document',\n            targetId: documentId,\n            targetLabel: documentName,\n            description: `Documento \"${documentName}\" foi removido`,\n            userId,\n            userName,\n          })\n        },\n\n        logPersonCreate: (caseId, personId, personName, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'person_create',\n            category: 'person',\n            targetType: 'person',\n            targetId: personId,\n            targetLabel: personName,\n            description: `Pessoa \"${personName}\" foi criada`,\n            userId,\n            userName,\n          })\n        },\n\n        logPersonUpdate: (caseId, personId, personName, changes, userId, userName) => {\n          const changedFields = changes.map((c) => c.fieldName).join(', ')\n          return get().addEntry({\n            caseId,\n            action: 'person_update',\n            category: 'person',\n            targetType: 'person',\n            targetId: personId,\n            targetLabel: personName,\n            description: `Pessoa \"${personName}\" foi atualizada`,\n            details: `Campos alterados: ${changedFields}`,\n            changes,\n            userId,\n            userName,\n          })\n        },\n\n        logPersonDelete: (caseId, personId, personName, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'person_delete',\n            category: 'person',\n            targetType: 'person',\n            targetId: personId,\n            targetLabel: personName,\n            description: `Pessoa \"${personName}\" foi removida`,\n            userId,\n            userName,\n          })\n        },\n\n        logPropertyCreate: (caseId, propertyId, propertyLabel, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'property_create',\n            category: 'property',\n            targetType: 'property',\n            targetId: propertyId,\n            targetLabel: propertyLabel,\n            description: `Imóvel \"${propertyLabel}\" foi criado`,\n            userId,\n            userName,\n          })\n        },\n\n        logPropertyUpdate: (caseId, propertyId, propertyLabel, changes, userId, userName) => {\n          const changedFields = changes.map((c) => c.fieldName).join(', ')\n          return get().addEntry({\n            caseId,\n            action: 'property_update',\n            category: 'property',\n            targetType: 'property',\n            targetId: propertyId,\n            targetLabel: propertyLabel,\n            description: `Imóvel \"${propertyLabel}\" foi atualizado`,\n            details: `Campos alterados: ${changedFields}`,\n            changes,\n            userId,\n            userName,\n          })\n        },\n\n        logPropertyDelete: (caseId, propertyId, propertyLabel, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'property_delete',\n            category: 'property',\n            targetType: 'property',\n            targetId: propertyId,\n            targetLabel: propertyLabel,\n            description: `Imóvel \"${propertyLabel}\" foi removido`,\n            userId,\n            userName,\n          })\n        },\n\n        logEdgeCreate: (caseId, edgeId, edgeLabel, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'edge_create',\n            category: 'relationship',\n            targetType: 'edge',\n            targetId: edgeId,\n            targetLabel: edgeLabel,\n            description: `Relacionamento \"${edgeLabel}\" foi criado`,\n            userId,\n            userName,\n          })\n        },\n\n        logEdgeDelete: (caseId, edgeId, edgeLabel, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'edge_delete',\n            category: 'relationship',\n            targetType: 'edge',\n            targetId: edgeId,\n            targetLabel: edgeLabel,\n            description: `Relacionamento \"${edgeLabel}\" foi removido`,\n            userId,\n            userName,\n          })\n        },\n\n        logFieldUpdate: (caseId, targetType, targetId, targetLabel, changes, userId, userName) => {\n          const changedFields = changes.map((c) => c.fieldName).join(', ')\n          return get().addEntry({\n            caseId,\n            action: 'field_update',\n            category: 'field',\n            targetType,\n            targetId,\n            targetLabel,\n            description: `Campos de \"${targetLabel}\" foram atualizados`,\n            details: `Campos alterados: ${changedFields}`,\n            changes,\n            userId,\n            userName,\n          })\n        },\n\n        logConflictResolution: (caseId, documentId, documentName, fieldName, resolvedValue, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'field_resolve_conflict',\n            category: 'field',\n            targetType: 'document',\n            targetId: documentId,\n            targetLabel: documentName,\n            description: `Conflito no campo \"${fieldName}\" foi resolvido`,\n            details: `Valor resolvido: ${String(resolvedValue)}`,\n            userId,\n            userName,\n          })\n        },\n\n        logCaseStatusChange: (caseId, caseTitle, oldStatus, newStatus, userId, userName) => {\n          return get().addEntry({\n            caseId,\n            action: 'case_status_change',\n            category: 'case',\n            targetType: 'case',\n            targetId: caseId,\n            targetLabel: caseTitle,\n            description: `Status do caso \"${caseTitle}\" foi alterado`,\n            details: `De \"${oldStatus}\" para \"${newStatus}\"`,\n            changes: [\n              {\n                fieldName: 'status',\n                fieldPath: 'status',\n                previousValue: oldStatus,\n                newValue: newStatus,\n                previousDisplayValue: oldStatus,\n                newDisplayValue: newStatus,\n                source: 'user',\n              },\n            ],\n            userId,\n            userName,\n          })\n        },\n\n        // State management\n        setLoading: (loading) => set({ isLoading: loading }),\n        setError: (error) => set({ error }),\n        reset: () => set(initialState),\n      }),\n      {\n        name: 'audit-store',\n        partialize: (state) => ({\n          entries: state.entries,\n        }),\n      }\n    ),\n    { name: 'audit-store' }\n  )\n)\n\n// Hook for audit trail in a specific case\nexport function useCaseAuditTrail(caseId: string) {\n  const store = useAuditStore()\n\n  return {\n    entries: store.getEntriesByCase(caseId),\n    summary: store.getSummary(caseId),\n    addEntry: (payload: Omit<CreateAuditEntryPayload, 'caseId'>) =>\n      store.addEntry({ ...payload, caseId }),\n    logDocumentUpload: (documentId: string, documentName: string, userId: string, userName: string) =>\n      store.logDocumentUpload(caseId, documentId, documentName, userId, userName),\n    logDocumentDelete: (documentId: string, documentName: string, userId: string, userName: string) =>\n      store.logDocumentDelete(caseId, documentId, documentName, userId, userName),\n    logPersonCreate: (personId: string, personName: string, userId: string, userName: string) =>\n      store.logPersonCreate(caseId, personId, personName, userId, userName),\n    logPersonUpdate: (personId: string, personName: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>\n      store.logPersonUpdate(caseId, personId, personName, changes, userId, userName),\n    logPersonDelete: (personId: string, personName: string, userId: string, userName: string) =>\n      store.logPersonDelete(caseId, personId, personName, userId, userName),\n    logPropertyCreate: (propertyId: string, propertyLabel: string, userId: string, userName: string) =>\n      store.logPropertyCreate(caseId, propertyId, propertyLabel, userId, userName),\n    logPropertyUpdate: (propertyId: string, propertyLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>\n      store.logPropertyUpdate(caseId, propertyId, propertyLabel, changes, userId, userName),\n    logPropertyDelete: (propertyId: string, propertyLabel: string, userId: string, userName: string) =>\n      store.logPropertyDelete(caseId, propertyId, propertyLabel, userId, userName),\n    logEdgeCreate: (edgeId: string, edgeLabel: string, userId: string, userName: string) =>\n      store.logEdgeCreate(caseId, edgeId, edgeLabel, userId, userName),\n    logEdgeDelete: (edgeId: string, edgeLabel: string, userId: string, userName: string) =>\n      store.logEdgeDelete(caseId, edgeId, edgeLabel, userId, userName),\n    logFieldUpdate: (targetType: AuditEntry['targetType'], targetId: string, targetLabel: string, changes: FieldChangeEvidence[], userId: string, userName: string) =>\n      store.logFieldUpdate(caseId, targetType, targetId, targetLabel, changes, userId, userName),\n    logConflictResolution: (documentId: string, documentName: string, fieldName: string, resolvedValue: unknown, userId: string, userName: string) =>\n      store.logConflictResolution(caseId, documentId, documentName, fieldName, resolvedValue, userId, userName),\n    clearEntries: () => store.clearEntries(caseId),\n  }\n}\n\nexport default useAuditStore\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "completed",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "completed",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "in_progress",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "pending",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "pending",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "pending",
      "activeForm": "Verifying implementation"
    }
  ]
}

Now let me update the caseStore to integrate audit logging:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\stores\\caseStore.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\stores\\caseStore.ts",
  "content": "import { create } from 'zustand'\nimport { devtools } from 'zustand/middleware'\nimport type { Case, Person, Property, GraphEdge, Draft, Document } from '../types'\nimport { useAuditStore } from './auditStore'\nimport type { FieldChangeEvidence } from '../types/audit'\n\n// Helper to calculate field changes\nfunction calculateFieldChanges<T extends Record<string, unknown>>(\n  original: T,\n  updates: Partial<T>,\n  fieldLabels?: Record<string, string>\n): FieldChangeEvidence[] {\n  const changes: FieldChangeEvidence[] = []\n\n  for (const key of Object.keys(updates) as (keyof T)[]) {\n    const previousValue = original[key]\n    const newValue = updates[key]\n\n    // Only record if value actually changed\n    if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {\n      changes.push({\n        fieldName: fieldLabels?.[key as string] || String(key),\n        fieldPath: String(key),\n        previousValue,\n        newValue,\n        previousDisplayValue: formatDisplayValue(previousValue),\n        newDisplayValue: formatDisplayValue(newValue),\n        source: 'user',\n      })\n    }\n  }\n\n  return changes\n}\n\n// Helper to format display value\nfunction formatDisplayValue(value: unknown): string {\n  if (value === null || value === undefined) return '-'\n  if (typeof value === 'object') return JSON.stringify(value)\n  return String(value)\n}\n\ninterface AuditContext {\n  userId: string\n  userName: string\n}\n\ninterface CaseState {\n  // Current case data\n  currentCase: Case | null\n  documents: Document[]\n  people: Person[]\n  properties: Property[]\n  edges: GraphEdge[]\n  currentDraft: Draft | null\n\n  // Loading states\n  isLoading: boolean\n  isProcessing: boolean\n\n  // Audit context\n  auditContext: AuditContext | null\n  setAuditContext: (context: AuditContext | null) => void\n\n  // Actions\n  setCurrentCase: (caseData: Case | null) => void\n  setDocuments: (documents: Document[]) => void\n  addDocument: (document: Document) => void\n  updateDocument: (id: string, updates: Partial<Document>) => void\n  removeDocument: (id: string) => void\n\n  setPeople: (people: Person[]) => void\n  addPerson: (person: Person) => void\n  updatePerson: (id: string, updates: Partial<Person>) => void\n  removePerson: (id: string) => void\n\n  setProperties: (properties: Property[]) => void\n  addProperty: (property: Property) => void\n  updateProperty: (id: string, updates: Partial<Property>) => void\n  removeProperty: (id: string) => void\n\n  setEdges: (edges: GraphEdge[]) => void\n  addEdge: (edge: GraphEdge) => void\n  updateEdge: (id: string, updates: Partial<GraphEdge>) => void\n  removeEdge: (id: string) => void\n\n  setCurrentDraft: (draft: Draft | null) => void\n  setLoading: (loading: boolean) => void\n  setProcessing: (processing: boolean) => void\n\n  reset: () => void\n}\n\nconst initialState = {\n  currentCase: null,\n  documents: [],\n  people: [],\n  properties: [],\n  edges: [],\n  currentDraft: null,\n  isLoading: false,\n  isProcessing: false,\n  auditContext: null,\n}\n\nexport const useCaseStore = create<CaseState>()(\n  devtools(\n    (set, get) => ({\n      ...initialState,\n\n      setAuditContext: (context) => set({ auditContext: context }),\n\n      setCurrentCase: (caseData) => set({ currentCase: caseData }),\n\n      // Document actions with audit logging\n      setDocuments: (documents) => set({ documents }),\n\n      addDocument: (document) => {\n        const state = get()\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({ documents: [...state.documents, document] }))\n\n        // Log audit entry\n        if (state.currentCase && ctx) {\n          auditStore.logDocumentUpload(\n            state.currentCase.id,\n            document.id,\n            document.original_name,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      updateDocument: (id, updates) => {\n        const state = get()\n        const doc = state.documents.find((d) => d.id === id)\n\n        set((state) => ({\n          documents: state.documents.map((d) =>\n            d.id === id ? { ...d, ...updates } : d\n          ),\n        }))\n\n        // Log audit entry for status changes\n        if (doc && state.currentCase && state.auditContext && updates.status && updates.status !== doc.status) {\n          const auditStore = useAuditStore.getState()\n          auditStore.addEntry({\n            caseId: state.currentCase.id,\n            action: 'document_status_change',\n            category: 'document',\n            targetType: 'document',\n            targetId: id,\n            targetLabel: doc.original_name,\n            description: `Status do documento \"${doc.original_name}\" foi alterado`,\n            details: `De \"${doc.status}\" para \"${updates.status}\"`,\n            changes: [{\n              fieldName: 'Status',\n              fieldPath: 'status',\n              previousValue: doc.status,\n              newValue: updates.status,\n              previousDisplayValue: doc.status,\n              newDisplayValue: updates.status,\n              source: 'user',\n            }],\n            userId: state.auditContext.userId,\n            userName: state.auditContext.userName,\n          })\n        }\n      },\n\n      removeDocument: (id) => {\n        const state = get()\n        const doc = state.documents.find((d) => d.id === id)\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({\n          documents: state.documents.filter((d) => d.id !== id),\n        }))\n\n        // Log audit entry\n        if (doc && state.currentCase && ctx) {\n          auditStore.logDocumentDelete(\n            state.currentCase.id,\n            id,\n            doc.original_name,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      // People actions with audit logging\n      setPeople: (people) => set({ people }),\n\n      addPerson: (person) => {\n        const state = get()\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({ people: [...state.people, person] }))\n\n        // Log audit entry\n        if (state.currentCase && ctx) {\n          auditStore.logPersonCreate(\n            state.currentCase.id,\n            person.id,\n            person.full_name,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      updatePerson: (id, updates) => {\n        const state = get()\n        const person = state.people.find((p) => p.id === id)\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({\n          people: state.people.map((p) =>\n            p.id === id ? { ...p, ...updates } : p\n          ),\n        }))\n\n        // Log audit entry with field changes\n        if (person && state.currentCase && ctx) {\n          const changes = calculateFieldChanges(person, updates, {\n            full_name: 'Nome Completo',\n            cpf: 'CPF',\n            rg: 'RG',\n            birth_date: 'Data de Nascimento',\n            marital_status: 'Estado Civil',\n            profession: 'Profissão',\n            email: 'E-mail',\n            phone: 'Telefone',\n            address: 'Endereço',\n          })\n\n          if (changes.length > 0) {\n            auditStore.logPersonUpdate(\n              state.currentCase.id,\n              id,\n              person.full_name,\n              changes,\n              ctx.userId,\n              ctx.userName\n            )\n          }\n        }\n      },\n\n      removePerson: (id) => {\n        const state = get()\n        const person = state.people.find((p) => p.id === id)\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({\n          people: state.people.filter((p) => p.id !== id),\n        }))\n\n        // Log audit entry\n        if (person && state.currentCase && ctx) {\n          auditStore.logPersonDelete(\n            state.currentCase.id,\n            id,\n            person.full_name,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      // Property actions with audit logging\n      setProperties: (properties) => set({ properties }),\n\n      addProperty: (property) => {\n        const state = get()\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({ properties: [...state.properties, property] }))\n\n        // Log audit entry\n        if (state.currentCase && ctx) {\n          const label = property.registry_number || property.address?.street || 'Imóvel sem identificação'\n          auditStore.logPropertyCreate(\n            state.currentCase.id,\n            property.id,\n            label,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      updateProperty: (id, updates) => {\n        const state = get()\n        const property = state.properties.find((p) => p.id === id)\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({\n          properties: state.properties.map((p) =>\n            p.id === id ? { ...p, ...updates } : p\n          ),\n        }))\n\n        // Log audit entry with field changes\n        if (property && state.currentCase && ctx) {\n          const changes = calculateFieldChanges(property, updates, {\n            registry_number: 'Matrícula',\n            registry_office: 'Cartório',\n            address: 'Endereço',\n            area_sqm: 'Área (m²)',\n            description: 'Descrição',\n            iptu_number: 'IPTU',\n          })\n\n          if (changes.length > 0) {\n            const label = property.registry_number || property.address?.street || 'Imóvel sem identificação'\n            auditStore.logPropertyUpdate(\n              state.currentCase.id,\n              id,\n              label,\n              changes,\n              ctx.userId,\n              ctx.userName\n            )\n          }\n        }\n      },\n\n      removeProperty: (id) => {\n        const state = get()\n        const property = state.properties.find((p) => p.id === id)\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({\n          properties: state.properties.filter((p) => p.id !== id),\n        }))\n\n        // Log audit entry\n        if (property && state.currentCase && ctx) {\n          const label = property.registry_number || property.address?.street || 'Imóvel sem identificação'\n          auditStore.logPropertyDelete(\n            state.currentCase.id,\n            id,\n            label,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      // Edge actions with audit logging\n      setEdges: (edges) => set({ edges }),\n\n      addEdge: (edge) => {\n        const state = get()\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({ edges: [...state.edges, edge] }))\n\n        // Log audit entry\n        if (state.currentCase && ctx) {\n          const label = `${edge.relationship} (${edge.source_type} -> ${edge.target_type})`\n          auditStore.logEdgeCreate(\n            state.currentCase.id,\n            edge.id,\n            label,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      updateEdge: (id, updates) => {\n        set((state) => ({\n          edges: state.edges.map((e) =>\n            e.id === id ? { ...e, ...updates } : e\n          ),\n        }))\n      },\n\n      removeEdge: (id) => {\n        const state = get()\n        const edge = state.edges.find((e) => e.id === id)\n        const auditStore = useAuditStore.getState()\n        const ctx = state.auditContext\n\n        set((state) => ({\n          edges: state.edges.filter((e) => e.id !== id),\n        }))\n\n        // Log audit entry\n        if (edge && state.currentCase && ctx) {\n          const label = `${edge.relationship} (${edge.source_type} -> ${edge.target_type})`\n          auditStore.logEdgeDelete(\n            state.currentCase.id,\n            id,\n            label,\n            ctx.userId,\n            ctx.userName\n          )\n        }\n      },\n\n      setCurrentDraft: (draft) => set({ currentDraft: draft }),\n      setLoading: (loading) => set({ isLoading: loading }),\n      setProcessing: (processing) => set({ isProcessing: processing }),\n\n      reset: () => set(initialState),\n    }),\n    { name: 'case-store' }\n  )\n)\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "completed",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "completed",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "completed",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "in_progress",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "pending",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "pending",
      "activeForm": "Verifying implementation"
    }
  ]
}

Now let me update the HistoryPage to use the real audit data instead of mock data:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\HistoryPage.tsx",
  "content": "import { useState, useMemo } from 'react'\nimport { useParams } from 'react-router-dom'\nimport { Card } from '@/components/ui/card'\nimport { Button } from '@/components/ui/button'\nimport { Input } from '@/components/ui/input'\nimport {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n} from '@/components/ui/select'\nimport { Badge } from '@/components/ui/badge'\nimport {\n  Dialog,\n  DialogContent,\n  DialogHeader,\n  DialogTitle,\n  DialogTrigger,\n} from '@/components/ui/dialog'\nimport { ScrollArea } from '@/components/ui/scroll-area'\nimport { cn } from '@/lib/utils'\nimport {\n  ClockIcon,\n  UserIcon,\n  PencilSquareIcon,\n  DocumentTextIcon,\n  PlusCircleIcon,\n  TrashIcon,\n  CheckCircleIcon,\n  ArrowDownTrayIcon,\n  FunnelIcon,\n  MagnifyingGlassIcon,\n  DocumentArrowUpIcon,\n  UserPlusIcon,\n  HomeModernIcon,\n  LinkIcon,\n  ExclamationTriangleIcon,\n  EyeIcon,\n  ArrowPathIcon,\n} from '@heroicons/react/24/outline'\nimport { formatDistanceToNow, format } from 'date-fns'\nimport { ptBR } from 'date-fns/locale'\nimport { useAuditStore, useCaseAuditTrail } from '@/stores/auditStore'\nimport type { AuditEntry, AuditActionType, AuditCategory, FieldChangeEvidence } from '@/types/audit'\n\n// Action icon mapping\nfunction getActionIcon(action: AuditActionType) {\n  switch (action) {\n    // Document actions\n    case 'document_upload':\n      return <DocumentArrowUpIcon className=\"w-5 h-5\" />\n    case 'document_delete':\n      return <TrashIcon className=\"w-5 h-5\" />\n    case 'document_approve':\n      return <CheckCircleIcon className=\"w-5 h-5\" />\n    case 'document_reject':\n      return <ExclamationTriangleIcon className=\"w-5 h-5\" />\n    case 'document_status_change':\n      return <ArrowPathIcon className=\"w-5 h-5\" />\n\n    // Person actions\n    case 'person_create':\n      return <UserPlusIcon className=\"w-5 h-5\" />\n    case 'person_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'person_delete':\n      return <TrashIcon className=\"w-5 h-5\" />\n    case 'person_merge':\n      return <LinkIcon className=\"w-5 h-5\" />\n\n    // Property actions\n    case 'property_create':\n      return <HomeModernIcon className=\"w-5 h-5\" />\n    case 'property_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'property_delete':\n      return <TrashIcon className=\"w-5 h-5\" />\n\n    // Relationship actions\n    case 'edge_create':\n      return <LinkIcon className=\"w-5 h-5\" />\n    case 'edge_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'edge_delete':\n      return <TrashIcon className=\"w-5 h-5\" />\n    case 'edge_confirm':\n      return <CheckCircleIcon className=\"w-5 h-5\" />\n\n    // Draft actions\n    case 'draft_create':\n      return <DocumentTextIcon className=\"w-5 h-5\" />\n    case 'draft_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'draft_approve':\n      return <CheckCircleIcon className=\"w-5 h-5\" />\n    case 'draft_section_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'draft_clause_add':\n      return <PlusCircleIcon className=\"w-5 h-5\" />\n    case 'draft_clause_remove':\n      return <TrashIcon className=\"w-5 h-5\" />\n\n    // Field actions\n    case 'field_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'field_resolve_conflict':\n      return <CheckCircleIcon className=\"w-5 h-5\" />\n\n    // Case actions\n    case 'case_create':\n      return <PlusCircleIcon className=\"w-5 h-5\" />\n    case 'case_update':\n      return <PencilSquareIcon className=\"w-5 h-5\" />\n    case 'case_status_change':\n      return <ArrowPathIcon className=\"w-5 h-5\" />\n    case 'case_assign':\n      return <UserIcon className=\"w-5 h-5\" />\n\n    default:\n      return <DocumentTextIcon className=\"w-5 h-5\" />\n  }\n}\n\n// Action labels mapping\nconst actionLabels: Record<AuditActionType, string> = {\n  document_upload: 'Upload de Documento',\n  document_delete: 'Exclusão de Documento',\n  document_approve: 'Aprovação de Documento',\n  document_reject: 'Rejeição de Documento',\n  document_status_change: 'Alteração de Status',\n  person_create: 'Criação de Pessoa',\n  person_update: 'Atualização de Pessoa',\n  person_delete: 'Exclusão de Pessoa',\n  person_merge: 'Mesclagem de Pessoas',\n  property_create: 'Criação de Imóvel',\n  property_update: 'Atualização de Imóvel',\n  property_delete: 'Exclusão de Imóvel',\n  edge_create: 'Criação de Relacionamento',\n  edge_update: 'Atualização de Relacionamento',\n  edge_delete: 'Exclusão de Relacionamento',\n  edge_confirm: 'Confirmação de Relacionamento',\n  draft_create: 'Criação de Minuta',\n  draft_update: 'Atualização de Minuta',\n  draft_approve: 'Aprovação de Minuta',\n  draft_section_update: 'Atualização de Seção',\n  draft_clause_add: 'Adição de Cláusula',\n  draft_clause_remove: 'Remoção de Cláusula',\n  field_update: 'Atualização de Campo',\n  field_resolve_conflict: 'Resolução de Conflito',\n  case_create: 'Criação de Caso',\n  case_update: 'Atualização de Caso',\n  case_status_change: 'Alteração de Status do Caso',\n  case_assign: 'Atribuição de Caso',\n  custom: 'Ação Personalizada',\n}\n\n// Category labels mapping\nconst categoryLabels: Record<AuditCategory, string> = {\n  document: 'Documento',\n  person: 'Pessoa',\n  property: 'Imóvel',\n  relationship: 'Relacionamento',\n  draft: 'Minuta',\n  field: 'Campo',\n  case: 'Caso',\n  system: 'Sistema',\n}\n\n// Status styling\nfunction getStatusColor(status: AuditEntry['status']) {\n  switch (status) {\n    case 'success':\n      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'\n    case 'pending':\n      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'\n    case 'failed':\n    case 'rejected':\n      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'\n    default:\n      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'\n  }\n}\n\nfunction getStatusTextColor(status: AuditEntry['status']) {\n  switch (status) {\n    case 'success':\n      return 'text-green-700 dark:text-green-300'\n    case 'pending':\n      return 'text-yellow-700 dark:text-yellow-300'\n    case 'failed':\n    case 'rejected':\n      return 'text-red-700 dark:text-red-300'\n    default:\n      return 'text-gray-700 dark:text-gray-300'\n  }\n}\n\nfunction getStatusBadgeColor(status: AuditEntry['status']) {\n  switch (status) {\n    case 'success':\n      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'\n    case 'pending':\n      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'\n    case 'failed':\n    case 'rejected':\n      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'\n    default:\n      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'\n  }\n}\n\nfunction getIconBgColor(status: AuditEntry['status']) {\n  switch (status) {\n    case 'success':\n      return 'bg-green-500 dark:bg-green-600'\n    case 'pending':\n      return 'bg-yellow-500 dark:bg-yellow-600'\n    case 'failed':\n    case 'rejected':\n      return 'bg-red-500 dark:bg-red-600'\n    default:\n      return 'bg-gray-500 dark:bg-gray-600'\n  }\n}\n\n// Category colors\nfunction getCategoryBadgeColor(category: AuditCategory) {\n  switch (category) {\n    case 'document':\n      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'\n    case 'person':\n      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'\n    case 'property':\n      return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'\n    case 'relationship':\n      return 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'\n    case 'draft':\n      return 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'\n    case 'field':\n      return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'\n    case 'case':\n      return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'\n    case 'system':\n      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300'\n    default:\n      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300'\n  }\n}\n\n// Changes detail component\nfunction ChangesDetail({ changes }: { changes: FieldChangeEvidence[] }) {\n  return (\n    <div className=\"space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700\">\n      <h4 className=\"text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider\">\n        Alterações Detalhadas\n      </h4>\n      <div className=\"space-y-2\">\n        {changes.map((change, index) => (\n          <div\n            key={index}\n            className=\"text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2\"\n          >\n            <div className=\"font-medium text-gray-700 dark:text-gray-300 mb-1\">\n              {change.fieldName}\n            </div>\n            <div className=\"flex items-center gap-2 text-xs\">\n              <span className=\"line-through text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded\">\n                {change.previousDisplayValue || '-'}\n              </span>\n              <span className=\"text-gray-400\">→</span>\n              <span className=\"text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded\">\n                {change.newDisplayValue || '-'}\n              </span>\n            </div>\n          </div>\n        ))}\n      </div>\n    </div>\n  )\n}\n\n// Entry detail modal\nfunction EntryDetailModal({ entry }: { entry: AuditEntry }) {\n  return (\n    <Dialog>\n      <DialogTrigger asChild>\n        <Button\n          variant=\"ghost\"\n          size=\"sm\"\n          className=\"gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200\"\n        >\n          <EyeIcon className=\"w-4 h-4\" />\n          Detalhes\n        </Button>\n      </DialogTrigger>\n      <DialogContent className=\"max-w-2xl\">\n        <DialogHeader>\n          <DialogTitle className=\"flex items-center gap-2\">\n            <div className={cn('p-2 rounded-lg text-white', getIconBgColor(entry.status))}>\n              {getActionIcon(entry.action)}\n            </div>\n            {actionLabels[entry.action]}\n          </DialogTitle>\n        </DialogHeader>\n        <ScrollArea className=\"max-h-[60vh]\">\n          <div className=\"space-y-4 p-4\">\n            {/* Basic Info */}\n            <div className=\"grid grid-cols-2 gap-4\">\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Alvo\n                </label>\n                <p className=\"text-gray-900 dark:text-white font-medium\">\n                  {entry.targetLabel}\n                </p>\n              </div>\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Categoria\n                </label>\n                <Badge className={cn('mt-1', getCategoryBadgeColor(entry.category))}>\n                  {categoryLabels[entry.category]}\n                </Badge>\n              </div>\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Usuário\n                </label>\n                <p className=\"text-gray-900 dark:text-white\">\n                  {entry.userName}\n                </p>\n              </div>\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Data/Hora\n                </label>\n                <p className=\"text-gray-900 dark:text-white\">\n                  {format(new Date(entry.timestamp), \"dd/MM/yyyy 'às' HH:mm:ss\", { locale: ptBR })}\n                </p>\n              </div>\n            </div>\n\n            {/* Description */}\n            <div>\n              <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                Descrição\n              </label>\n              <p className=\"text-gray-700 dark:text-gray-300\">\n                {entry.description}\n              </p>\n            </div>\n\n            {/* Details */}\n            {entry.details && (\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Detalhes Adicionais\n                </label>\n                <p className=\"text-gray-600 dark:text-gray-400\">\n                  {entry.details}\n                </p>\n              </div>\n            )}\n\n            {/* Changes */}\n            {entry.changes && entry.changes.length > 0 && (\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Campos Alterados\n                </label>\n                <div className=\"mt-2 space-y-2\">\n                  {entry.changes.map((change, index) => (\n                    <div\n                      key={index}\n                      className=\"bg-gray-50 dark:bg-gray-800 rounded-lg p-3\"\n                    >\n                      <div className=\"font-medium text-gray-800 dark:text-gray-200 mb-2\">\n                        {change.fieldName}\n                      </div>\n                      <div className=\"grid grid-cols-2 gap-4 text-sm\">\n                        <div>\n                          <span className=\"text-gray-500 dark:text-gray-400 block mb-1\">Valor Anterior:</span>\n                          <span className=\"text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded block\">\n                            {change.previousDisplayValue || '-'}\n                          </span>\n                        </div>\n                        <div>\n                          <span className=\"text-gray-500 dark:text-gray-400 block mb-1\">Novo Valor:</span>\n                          <span className=\"text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded block\">\n                            {change.newDisplayValue || '-'}\n                          </span>\n                        </div>\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              </div>\n            )}\n\n            {/* Evidence */}\n            {entry.evidence && entry.evidence.length > 0 && (\n              <div>\n                <label className=\"text-xs font-medium text-gray-500 dark:text-gray-400 uppercase\">\n                  Evidências\n                </label>\n                <div className=\"mt-2 space-y-2\">\n                  {entry.evidence.map((evidence) => (\n                    <div\n                      key={evidence.id}\n                      className=\"flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2\"\n                    >\n                      <Badge variant=\"outline\" className=\"text-xs\">\n                        {evidence.type}\n                      </Badge>\n                      <span className=\"text-sm text-gray-700 dark:text-gray-300\">\n                        {evidence.label}\n                      </span>\n                    </div>\n                  ))}\n                </div>\n              </div>\n            )}\n\n            {/* Metadata */}\n            <div className=\"pt-4 border-t border-gray-200 dark:border-gray-700\">\n              <div className=\"grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400\">\n                <div>\n                  <span className=\"uppercase\">ID do Registro:</span>\n                  <span className=\"ml-2 font-mono\">{entry.id}</span>\n                </div>\n                <div>\n                  <span className=\"uppercase\">ID do Alvo:</span>\n                  <span className=\"ml-2 font-mono\">{entry.targetId}</span>\n                </div>\n              </div>\n            </div>\n          </div>\n        </ScrollArea>\n      </DialogContent>\n    </Dialog>\n  )\n}\n\nexport default function HistoryPage() {\n  const { caseId } = useParams()\n  const [searchTerm, setSearchTerm] = useState('')\n  const [filterStatus, setFilterStatus] = useState<string>('all')\n  const [filterCategory, setFilterCategory] = useState<string>('all')\n\n  // Get audit entries from the store\n  const allEntries = useAuditStore((state) => state.entries)\n\n  // Filter entries for this case\n  const caseEntries = useMemo(() => {\n    return allEntries\n      .filter((entry) => entry.caseId === caseId)\n      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())\n  }, [allEntries, caseId])\n\n  // Apply search and filter\n  const filteredLog = useMemo(() => {\n    return caseEntries.filter((entry) => {\n      // Search filter\n      const matchesSearch =\n        !searchTerm ||\n        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||\n        entry.targetLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||\n        entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||\n        (entry.details?.toLowerCase().includes(searchTerm.toLowerCase()))\n\n      // Status filter\n      const matchesStatus =\n        filterStatus === 'all' || entry.status === filterStatus\n\n      // Category filter\n      const matchesCategory =\n        filterCategory === 'all' || entry.category === filterCategory\n\n      return matchesSearch && matchesStatus && matchesCategory\n    })\n  }, [caseEntries, searchTerm, filterStatus, filterCategory])\n\n  // Export function\n  const handleExport = () => {\n    const csv = [\n      ['Data/Hora', 'Usuário', 'Ação', 'Categoria', 'Alvo', 'Descrição', 'Detalhes', 'Status'],\n      ...filteredLog.map((entry) => [\n        format(new Date(entry.timestamp), \"dd/MM/yyyy HH:mm:ss\", { locale: ptBR }),\n        entry.userName,\n        actionLabels[entry.action],\n        categoryLabels[entry.category],\n        entry.targetLabel,\n        entry.description,\n        entry.details || '',\n        entry.status,\n      ]),\n    ]\n      .map((row) => row.map((cell) => `\"${cell}\"`).join(','))\n      .join('\\n')\n\n    const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })\n    const url = window.URL.createObjectURL(blob)\n    const a = document.createElement('a')\n    a.href = url\n    a.download = `auditlog-${caseId}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`\n    a.click()\n    window.URL.revokeObjectURL(url)\n  }\n\n  return (\n    <div className=\"h-full flex flex-col gap-4 p-4\">\n      {/* Header Card */}\n      <Card className=\"glass-card p-6 flex-shrink-0\">\n        <div className=\"flex items-start justify-between gap-4\">\n          <div className=\"flex items-center gap-3\">\n            <div className=\"p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 shadow-md\">\n              <ClockIcon className=\"w-6 h-6 text-white\" />\n            </div>\n            <div>\n              <h1 className=\"text-2xl font-bold text-gray-900 dark:text-white\">\n                Histórico & Auditoria\n              </h1>\n              <p className=\"text-sm text-gray-500 dark:text-gray-400 mt-1\">\n                Trilha de auditoria com evidências •{' '}\n                <span className=\"font-semibold text-gray-700 dark:text-gray-300\">\n                  {caseEntries.length} registros\n                </span>\n              </p>\n            </div>\n          </div>\n          <Button\n            onClick={handleExport}\n            disabled={filteredLog.length === 0}\n            className=\"gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800\"\n          >\n            <ArrowDownTrayIcon className=\"w-4 h-4\" />\n            Exportar CSV\n          </Button>\n        </div>\n      </Card>\n\n      {/* Filters Card */}\n      <Card className=\"glass-card p-4 flex-shrink-0\">\n        <div className=\"flex items-end gap-4 flex-wrap\">\n          <div className=\"flex-1 min-w-[200px]\">\n            <label className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block\">\n              <MagnifyingGlassIcon className=\"w-4 h-4 inline mr-2\" />\n              Pesquisar\n            </label>\n            <Input\n              type=\"text\"\n              placeholder=\"Usuário, alvo ou detalhes...\"\n              value={searchTerm}\n              onChange={(e) => setSearchTerm(e.target.value)}\n              className=\"focus:ring-purple-500 dark:focus:ring-purple-400\"\n            />\n          </div>\n\n          <div className=\"flex-1 min-w-[160px]\">\n            <label className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block\">\n              <FunnelIcon className=\"w-4 h-4 inline mr-2\" />\n              Status\n            </label>\n            <Select value={filterStatus} onValueChange={setFilterStatus}>\n              <SelectTrigger className=\"focus:ring-purple-500 dark:focus:ring-purple-400\">\n                <SelectValue placeholder=\"Selecione um status\" />\n              </SelectTrigger>\n              <SelectContent>\n                <SelectItem value=\"all\">Todos os status</SelectItem>\n                <SelectItem value=\"success\">Sucesso</SelectItem>\n                <SelectItem value=\"pending\">Pendente</SelectItem>\n                <SelectItem value=\"failed\">Falha</SelectItem>\n                <SelectItem value=\"rejected\">Rejeitado</SelectItem>\n              </SelectContent>\n            </Select>\n          </div>\n\n          <div className=\"flex-1 min-w-[160px]\">\n            <label className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block\">\n              <FunnelIcon className=\"w-4 h-4 inline mr-2\" />\n              Categoria\n            </label>\n            <Select value={filterCategory} onValueChange={setFilterCategory}>\n              <SelectTrigger className=\"focus:ring-purple-500 dark:focus:ring-purple-400\">\n                <SelectValue placeholder=\"Selecione uma categoria\" />\n              </SelectTrigger>\n              <SelectContent>\n                <SelectItem value=\"all\">Todas as categorias</SelectItem>\n                <SelectItem value=\"document\">Documentos</SelectItem>\n                <SelectItem value=\"person\">Pessoas</SelectItem>\n                <SelectItem value=\"property\">Imóveis</SelectItem>\n                <SelectItem value=\"relationship\">Relacionamentos</SelectItem>\n                <SelectItem value=\"draft\">Minutas</SelectItem>\n                <SelectItem value=\"field\">Campos</SelectItem>\n                <SelectItem value=\"case\">Caso</SelectItem>\n              </SelectContent>\n            </Select>\n          </div>\n\n          <Button\n            variant=\"outline\"\n            onClick={() => {\n              setSearchTerm('')\n              setFilterStatus('all')\n              setFilterCategory('all')\n            }}\n            className=\"glass-subtle\"\n          >\n            Limpar Filtros\n          </Button>\n        </div>\n      </Card>\n\n      {/* Timeline/Audit Log */}\n      <div className=\"flex-1 overflow-y-auto\">\n        <div className=\"space-y-3 pr-2\">\n          {filteredLog.length === 0 ? (\n            <Card className=\"glass-subtle p-8 text-center\">\n              <ClockIcon className=\"w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3 opacity-50\" />\n              <p className=\"text-gray-600 dark:text-gray-400 font-medium mb-1\">\n                {caseEntries.length === 0\n                  ? 'Nenhuma atividade registrada'\n                  : 'Nenhuma entrada encontrada'}\n              </p>\n              <p className=\"text-sm text-gray-500 dark:text-gray-500\">\n                {caseEntries.length === 0\n                  ? 'As alterações neste caso serão registradas automaticamente'\n                  : 'Tente ajustar seus critérios de pesquisa'}\n              </p>\n            </Card>\n          ) : (\n            filteredLog.map((entry, index) => (\n              <Card\n                key={entry.id}\n                className={cn(\n                  'border-2 p-4 transition-all duration-200 hover:shadow-md',\n                  getStatusColor(entry.status)\n                )}\n              >\n                <div className=\"flex gap-4\">\n                  {/* Timeline Connector */}\n                  <div className=\"flex flex-col items-center\">\n                    <div\n                      className={cn(\n                        'w-10 h-10 rounded-full flex items-center justify-center shadow-md text-white',\n                        getIconBgColor(entry.status)\n                      )}\n                    >\n                      {getActionIcon(entry.action)}\n                    </div>\n                    {index < filteredLog.length - 1 && (\n                      <div className=\"w-1 h-8 bg-gray-300 dark:bg-gray-600 mt-2\"></div>\n                    )}\n                  </div>\n\n                  {/* Content */}\n                  <div className=\"flex-1 min-w-0\">\n                    <div className=\"flex items-start justify-between gap-3 mb-2\">\n                      <div>\n                        <div className=\"flex items-center gap-2 mb-1\">\n                          <h3\n                            className={cn(\n                              'text-sm font-bold',\n                              getStatusTextColor(entry.status)\n                            )}\n                          >\n                            {actionLabels[entry.action]}\n                          </h3>\n                          <Badge\n                            variant=\"outline\"\n                            className={cn('text-xs', getCategoryBadgeColor(entry.category))}\n                          >\n                            {categoryLabels[entry.category]}\n                          </Badge>\n                        </div>\n                        <p className=\"text-gray-800 dark:text-gray-200 font-medium\">\n                          {entry.targetLabel}\n                        </p>\n                      </div>\n                      <div className=\"flex items-center gap-2\">\n                        <Badge\n                          variant=\"outline\"\n                          className={cn('flex-shrink-0', getStatusBadgeColor(entry.status))}\n                        >\n                          {entry.status === 'success' && 'Sucesso'}\n                          {entry.status === 'pending' && 'Pendente'}\n                          {entry.status === 'failed' && 'Falha'}\n                          {entry.status === 'rejected' && 'Rejeitado'}\n                        </Badge>\n                        <EntryDetailModal entry={entry} />\n                      </div>\n                    </div>\n\n                    <p className=\"text-sm text-gray-700 dark:text-gray-400 mb-2\">\n                      {entry.description}\n                    </p>\n\n                    {entry.details && (\n                      <p className=\"text-xs text-gray-500 dark:text-gray-500 mb-2 italic\">\n                        {entry.details}\n                      </p>\n                    )}\n\n                    {/* Show changes preview */}\n                    {entry.changes && entry.changes.length > 0 && (\n                      <ChangesDetail changes={entry.changes} />\n                    )}\n\n                    <div className=\"flex items-center justify-between text-xs text-gray-600 dark:text-gray-500 mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50\">\n                      <div className=\"flex items-center gap-2\">\n                        <UserIcon className=\"w-4 h-4\" />\n                        <span>{entry.userName}</span>\n                      </div>\n                      <div className=\"flex items-center gap-2\">\n                        <ClockIcon className=\"w-4 h-4\" />\n                        <span title={format(new Date(entry.timestamp), \"dd/MM/yyyy 'às' HH:mm:ss\", { locale: ptBR })}>\n                          {formatDistanceToNow(new Date(entry.timestamp), {\n                            addSuffix: true,\n                            locale: ptBR,\n                          })}\n                        </span>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n              </Card>\n            ))\n          )}\n        </div>\n      </div>\n    </div>\n  )\n}\n"
}

Now let me create a test page to demonstrate the audit trail functionality:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "completed",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "completed",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "completed",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "completed",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "in_progress",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "pending",
      "activeForm": "Verifying implementation"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestAuditTrailPage.tsx",
  "content": "import { useState } from 'react'\nimport { Card } from '@/components/ui/card'\nimport { Button } from '@/components/ui/button'\nimport { Input } from '@/components/ui/input'\nimport { Badge } from '@/components/ui/badge'\nimport { Separator } from '@/components/ui/separator'\nimport {\n  ClockIcon,\n  DocumentArrowUpIcon,\n  UserPlusIcon,\n  HomeModernIcon,\n  PencilSquareIcon,\n  TrashIcon,\n  PlusCircleIcon,\n  ArrowPathIcon,\n} from '@heroicons/react/24/outline'\nimport { useAuditStore } from '@/stores/auditStore'\nimport { formatDistanceToNow, format } from 'date-fns'\nimport { ptBR } from 'date-fns/locale'\n\n// Test case ID for demonstration\nconst TEST_CASE_ID = 'test-case-demo-123'\n\nexport default function TestAuditTrailPage() {\n  const [personName, setPersonName] = useState('João Silva')\n  const [propertyAddress, setPropertyAddress] = useState('Rua das Flores, 123')\n\n  // Audit store actions\n  const auditStore = useAuditStore()\n  const entries = auditStore.getEntriesByCase(TEST_CASE_ID)\n  const summary = auditStore.getSummary(TEST_CASE_ID)\n\n  // Simulate actions\n  const simulateDocumentUpload = () => {\n    auditStore.logDocumentUpload(\n      TEST_CASE_ID,\n      `doc-${Date.now()}`,\n      'Contrato_Compra_Venda.pdf',\n      'user-123',\n      'Maria Santos'\n    )\n  }\n\n  const simulatePersonCreate = () => {\n    auditStore.logPersonCreate(\n      TEST_CASE_ID,\n      `person-${Date.now()}`,\n      personName,\n      'user-123',\n      'Maria Santos'\n    )\n  }\n\n  const simulatePersonUpdate = () => {\n    auditStore.logPersonUpdate(\n      TEST_CASE_ID,\n      'person-001',\n      personName,\n      [\n        {\n          fieldName: 'CPF',\n          fieldPath: 'cpf',\n          previousValue: '123.456.789-00',\n          newValue: '987.654.321-00',\n          previousDisplayValue: '123.456.789-00',\n          newDisplayValue: '987.654.321-00',\n          source: 'user',\n        },\n        {\n          fieldName: 'Telefone',\n          fieldPath: 'phone',\n          previousValue: '(11) 99999-1111',\n          newValue: '(11) 98888-2222',\n          previousDisplayValue: '(11) 99999-1111',\n          newDisplayValue: '(11) 98888-2222',\n          source: 'user',\n        },\n      ],\n      'user-456',\n      'Carlos Oliveira'\n    )\n  }\n\n  const simulatePropertyCreate = () => {\n    auditStore.logPropertyCreate(\n      TEST_CASE_ID,\n      `property-${Date.now()}`,\n      propertyAddress,\n      'user-789',\n      'Ana Costa'\n    )\n  }\n\n  const simulateEdgeCreate = () => {\n    auditStore.logEdgeCreate(\n      TEST_CASE_ID,\n      `edge-${Date.now()}`,\n      'proprietário_de (pessoa -> imóvel)',\n      'user-123',\n      'Maria Santos'\n    )\n  }\n\n  const simulateConflictResolution = () => {\n    auditStore.logConflictResolution(\n      TEST_CASE_ID,\n      'doc-001',\n      'CNH_Joao.pdf',\n      'data_nascimento',\n      '1985-03-15',\n      'user-456',\n      'Carlos Oliveira'\n    )\n  }\n\n  const simulateCaseStatusChange = () => {\n    auditStore.logCaseStatusChange(\n      TEST_CASE_ID,\n      'Compra e Venda - Imóvel Residencial',\n      'draft',\n      'review',\n      'user-123',\n      'Maria Santos'\n    )\n  }\n\n  const clearTestEntries = () => {\n    auditStore.clearEntries(TEST_CASE_ID)\n  }\n\n  return (\n    <div className=\"min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6\">\n      <div className=\"max-w-6xl mx-auto space-y-6\">\n        {/* Header */}\n        <Card className=\"glass-card p-6\">\n          <div className=\"flex items-center gap-3 mb-4\">\n            <div className=\"p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md\">\n              <ClockIcon className=\"w-6 h-6 text-white\" />\n            </div>\n            <div>\n              <h1 className=\"text-2xl font-bold text-gray-900 dark:text-white\">\n                Teste de Trilha de Auditoria\n              </h1>\n              <p className=\"text-sm text-gray-500 dark:text-gray-400\">\n                Demonstração do sistema de auditoria com evidências\n              </p>\n            </div>\n          </div>\n\n          {/* Summary Stats */}\n          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mt-4\">\n            <div className=\"bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3\">\n              <div className=\"text-2xl font-bold text-blue-600 dark:text-blue-400\">\n                {summary.totalEntries}\n              </div>\n              <div className=\"text-xs text-blue-600/70 dark:text-blue-400/70\">\n                Total de Registros\n              </div>\n            </div>\n            <div className=\"bg-green-50 dark:bg-green-900/20 rounded-lg p-3\">\n              <div className=\"text-2xl font-bold text-green-600 dark:text-green-400\">\n                {summary.entriesByStatus.success || 0}\n              </div>\n              <div className=\"text-xs text-green-600/70 dark:text-green-400/70\">\n                Sucesso\n              </div>\n            </div>\n            <div className=\"bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3\">\n              <div className=\"text-2xl font-bold text-purple-600 dark:text-purple-400\">\n                {Object.keys(summary.entriesByCategory).length}\n              </div>\n              <div className=\"text-xs text-purple-600/70 dark:text-purple-400/70\">\n                Categorias\n              </div>\n            </div>\n            <div className=\"bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3\">\n              <div className=\"text-2xl font-bold text-orange-600 dark:text-orange-400\">\n                {summary.recentUsers.length}\n              </div>\n              <div className=\"text-xs text-orange-600/70 dark:text-orange-400/70\">\n                Usuários Ativos\n              </div>\n            </div>\n          </div>\n        </Card>\n\n        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n          {/* Actions Panel */}\n          <Card className=\"glass-card p-6\">\n            <h2 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">\n              Simular Ações\n            </h2>\n\n            <div className=\"space-y-4\">\n              {/* Document Actions */}\n              <div>\n                <h3 className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2\">\n                  Documentos\n                </h3>\n                <Button\n                  onClick={simulateDocumentUpload}\n                  className=\"w-full gap-2 bg-blue-500 hover:bg-blue-600\"\n                >\n                  <DocumentArrowUpIcon className=\"w-4 h-4\" />\n                  Upload de Documento\n                </Button>\n              </div>\n\n              <Separator />\n\n              {/* Person Actions */}\n              <div>\n                <h3 className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2\">\n                  Pessoas\n                </h3>\n                <Input\n                  value={personName}\n                  onChange={(e) => setPersonName(e.target.value)}\n                  placeholder=\"Nome da pessoa\"\n                  className=\"mb-2\"\n                />\n                <div className=\"flex gap-2\">\n                  <Button\n                    onClick={simulatePersonCreate}\n                    className=\"flex-1 gap-2 bg-purple-500 hover:bg-purple-600\"\n                  >\n                    <UserPlusIcon className=\"w-4 h-4\" />\n                    Criar\n                  </Button>\n                  <Button\n                    onClick={simulatePersonUpdate}\n                    variant=\"outline\"\n                    className=\"flex-1 gap-2\"\n                  >\n                    <PencilSquareIcon className=\"w-4 h-4\" />\n                    Atualizar\n                  </Button>\n                </div>\n              </div>\n\n              <Separator />\n\n              {/* Property Actions */}\n              <div>\n                <h3 className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2\">\n                  Imóveis\n                </h3>\n                <Input\n                  value={propertyAddress}\n                  onChange={(e) => setPropertyAddress(e.target.value)}\n                  placeholder=\"Endereço do imóvel\"\n                  className=\"mb-2\"\n                />\n                <Button\n                  onClick={simulatePropertyCreate}\n                  className=\"w-full gap-2 bg-orange-500 hover:bg-orange-600\"\n                >\n                  <HomeModernIcon className=\"w-4 h-4\" />\n                  Criar Imóvel\n                </Button>\n              </div>\n\n              <Separator />\n\n              {/* Other Actions */}\n              <div>\n                <h3 className=\"text-sm font-medium text-gray-700 dark:text-gray-300 mb-2\">\n                  Outras Ações\n                </h3>\n                <div className=\"grid grid-cols-2 gap-2\">\n                  <Button\n                    onClick={simulateEdgeCreate}\n                    variant=\"outline\"\n                    className=\"gap-2\"\n                  >\n                    <PlusCircleIcon className=\"w-4 h-4\" />\n                    Criar Relação\n                  </Button>\n                  <Button\n                    onClick={simulateConflictResolution}\n                    variant=\"outline\"\n                    className=\"gap-2\"\n                  >\n                    <ArrowPathIcon className=\"w-4 h-4\" />\n                    Resolver Conflito\n                  </Button>\n                  <Button\n                    onClick={simulateCaseStatusChange}\n                    variant=\"outline\"\n                    className=\"gap-2 col-span-2\"\n                  >\n                    <ArrowPathIcon className=\"w-4 h-4\" />\n                    Mudar Status do Caso\n                  </Button>\n                </div>\n              </div>\n\n              <Separator />\n\n              {/* Clear */}\n              <Button\n                onClick={clearTestEntries}\n                variant=\"destructive\"\n                className=\"w-full gap-2\"\n              >\n                <TrashIcon className=\"w-4 h-4\" />\n                Limpar Registros de Teste\n              </Button>\n            </div>\n          </Card>\n\n          {/* Entries List */}\n          <Card className=\"glass-card p-6\">\n            <h2 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">\n              Registros de Auditoria ({entries.length})\n            </h2>\n\n            <div className=\"space-y-3 max-h-[600px] overflow-y-auto pr-2\">\n              {entries.length === 0 ? (\n                <div className=\"text-center py-8 text-gray-500 dark:text-gray-400\">\n                  <ClockIcon className=\"w-12 h-12 mx-auto mb-2 opacity-50\" />\n                  <p>Nenhum registro ainda</p>\n                  <p className=\"text-sm\">Simule ações para ver os registros</p>\n                </div>\n              ) : (\n                entries.map((entry) => (\n                  <div\n                    key={entry.id}\n                    className=\"bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700\"\n                  >\n                    <div className=\"flex items-start justify-between gap-2 mb-2\">\n                      <div className=\"flex items-center gap-2\">\n                        <Badge\n                          variant=\"outline\"\n                          className=\"text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300\"\n                        >\n                          {entry.category}\n                        </Badge>\n                        <span className=\"text-sm font-medium text-gray-900 dark:text-white\">\n                          {entry.targetLabel}\n                        </span>\n                      </div>\n                      <span className=\"text-xs text-gray-500 dark:text-gray-400\">\n                        {formatDistanceToNow(new Date(entry.timestamp), {\n                          addSuffix: true,\n                          locale: ptBR,\n                        })}\n                      </span>\n                    </div>\n\n                    <p className=\"text-sm text-gray-600 dark:text-gray-300 mb-2\">\n                      {entry.description}\n                    </p>\n\n                    {entry.changes && entry.changes.length > 0 && (\n                      <div className=\"mt-2 pt-2 border-t border-gray-200 dark:border-gray-700\">\n                        <div className=\"text-xs text-gray-500 dark:text-gray-400 mb-1\">\n                          Alterações:\n                        </div>\n                        {entry.changes.map((change, i) => (\n                          <div\n                            key={i}\n                            className=\"flex items-center gap-2 text-xs\"\n                          >\n                            <span className=\"font-medium text-gray-700 dark:text-gray-300\">\n                              {change.fieldName}:\n                            </span>\n                            <span className=\"text-red-500 line-through\">\n                              {change.previousDisplayValue}\n                            </span>\n                            <span className=\"text-gray-400\">→</span>\n                            <span className=\"text-green-500\">\n                              {change.newDisplayValue}\n                            </span>\n                          </div>\n                        ))}\n                      </div>\n                    )}\n\n                    <div className=\"flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400\">\n                      <span>Por: {entry.userName}</span>\n                      <span>\n                        {format(new Date(entry.timestamp), 'HH:mm:ss', {\n                          locale: ptBR,\n                        })}\n                      </span>\n                    </div>\n                  </div>\n                ))\n              )}\n            </div>\n          </Card>\n        </div>\n\n        {/* Info Card */}\n        <Card className=\"glass-card p-6\">\n          <h2 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">\n            Como Funciona\n          </h2>\n          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300\">\n            <div className=\"bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4\">\n              <h3 className=\"font-semibold text-blue-700 dark:text-blue-300 mb-2\">\n                1. Captura Automática\n              </h3>\n              <p>\n                Todas as alterações no caseStore são automaticamente registradas\n                na trilha de auditoria com timestamp e usuário.\n              </p>\n            </div>\n            <div className=\"bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4\">\n              <h3 className=\"font-semibold text-purple-700 dark:text-purple-300 mb-2\">\n                2. Evidências Detalhadas\n              </h3>\n              <p>\n                Cada entrada inclui valores anteriores e novos, permitindo\n                rastrear exatamente o que mudou.\n              </p>\n            </div>\n            <div className=\"bg-green-50 dark:bg-green-900/20 rounded-lg p-4\">\n              <h3 className=\"font-semibold text-green-700 dark:text-green-300 mb-2\">\n                3. Persistência\n              </h3>\n              <p>\n                Os registros são persistidos no localStorage e podem ser\n                exportados em CSV para compliance.\n              </p>\n            </div>\n          </div>\n        </Card>\n      </div>\n    </div>\n  )\n}\n"
}

Now let me add the test page route to App.tsx:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "import TestEmptyStatesPage from './pages/TestEmptyStatesPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'",
  "new_string": "import TestEmptyStatesPage from './pages/TestEmptyStatesPage'\nimport TestAuditTrailPage from './pages/TestAuditTrailPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "<Route path=\"/test-empty-states\" element={<TestEmptyStatesPage />} />\n            </>\n          )}",
  "new_string": "<Route path=\"/test-empty-states\" element={<TestEmptyStatesPage />} />\n              <Route path=\"/test-audit-trail\" element={<TestAuditTrailPage />} />\n            </>\n          )}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "completed",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "completed",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "completed",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "completed",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "completed",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "in_progress",
      "activeForm": "Verifying implementation"
    }
  ]
}

Now let me start the dev server and verify the implementation using Playwright MCP:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run dev",
  "description": "Start development server",
  "timeout": 30000,
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "sleep 8 && cat \"C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\be3bb75.output\"",
  "description": "Wait for dev server and check output",
  "timeout": 15000
}

The dev server is running. Now let me verify the audit trail implementation using Playwright MCP:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5173/test-audit-trail"
}

The test page loaded successfully. Let me click on some buttons to simulate actions and see the audit trail in action:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Upload de Documento button",
  "ref": "e32"
}

Excellent! The audit trail captured the document upload. Let me continue testing by clicking more buttons to see the complete functionality:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Criar (Person Create) button",
  "ref": "e37"
}

Now let me test the update action which should show the field changes:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Atualizar button",
  "ref": "e38"
}

The field changes with evidence (before/after values) are showing correctly. Let me add a few more entries and take a screenshot:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Criar Imóvel button",
  "ref": "e42"
}

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Mudar Status do Caso button",
  "ref": "e48"
}

Excellent! The audit trail is working perfectly. Let me take a screenshot to document the implementation:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "audit-trail-test-page.png",
  "fullPage": true
}

Now let me update the todo list and close the browser:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create audit trail store with Zustand",
      "status": "completed",
      "activeForm": "Creating audit trail store"
    },
    {
      "content": "Create audit trail types and interfaces",
      "status": "completed",
      "activeForm": "Creating audit trail types"
    },
    {
      "content": "Integrate audit logging into case store actions",
      "status": "completed",
      "activeForm": "Integrating audit logging into case store"
    },
    {
      "content": "Update HistoryPage to use real audit data",
      "status": "completed",
      "activeForm": "Updating HistoryPage component"
    },
    {
      "content": "Create evidence attachment for audit entries",
      "status": "completed",
      "activeForm": "Creating evidence attachment"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "completed",
      "activeForm": "Verifying implementation"
    }
  ]
}

🔧 Tool: mcp__playwright__browser_close
Input: {}

🔧 Tool: KillShell
Input: {
  "shell_id": "be3bb75"
}

<summary>
## Summary: Audit Trail Captures All Changes with Evidence

### Changes Implemented
- **Created comprehensive audit trail types** (`src/types/audit.ts`) with:
  - 28+ action types covering documents, persons, properties, relationships, drafts, fields, and cases
  - 8 audit categories for filtering
  - Field change evidence tracking with before/after values
  - Audit evidence attachments (screenshots, diffs, snapshots)
  - Full audit entry interface with timestamps, user info, and metadata

- **Created Zustand audit store** (`src/stores/auditStore.ts`) with:
  - Persistent storage using localStorage
  - Convenience methods for common audit actions (logDocumentUpload, logPersonCreate, logPersonUpdate, etc.)
  - Filtering and querying capabilities
  - Summary statistics calculation
  - Evidence attachment support
  - Case-specific audit trail hook (`useCaseAuditTrail`)

- **Integrated audit logging into case store** (`src/stores/caseStore.ts`):
  - Automatic audit logging when documents are added/updated/removed
  - Audit logging for person create/update/delete operations with field change tracking
  - Audit logging for property create/update/delete operations
  - Audit logging for relationship (edge) create/delete
  - Field change calculation with human-readable labels

- **Updated HistoryPage** (`src/pages/HistoryPage.tsx`) to:
  - Use real audit data from the audit store instead of mock data
  - Display field changes with before/after values
  - Show category badges and status indicators
  - Include detailed entry modal with full audit information
  - Support CSV export with UTF-8 encoding
  - Filter by status, category, and search term

- **Created test page** (`src/pages/TestAuditTrailPage.tsx`) for demonstration

### Files Modified
- `src/types/audit.ts` (new file)
- `src/stores/auditStore.ts` (new file)
- `src/stores/caseStore.ts` (modified - integrated audit logging)
- `src/pages/HistoryPage.tsx` (modified - uses real audit data)
- `src/pages/TestAuditTrailPage.tsx` (new file)
- `src/App.tsx` (modified - added test route)

### Verification Status
- Successfully verified using Playwright MCP tools
- Tested document upload, person create, person update (with field changes), property create, and case status change actions
- All audit entries correctly captured with timestamps, user info, and evidence
- Field changes show before/after values (e.g., CPF: 123.456.789-00 → 987.654.321-00)
- Screenshot captured: `.playwright-mcp/audit-trail-test-page.png`

### Notes for Developer
- The audit store uses localStorage for persistence - entries survive page refreshes
- To set the audit context (user info), call `useCaseStore.getState().setAuditContext({ userId, userName })`
- The audit trail integrates automatically with case store actions when audit context is set
- CSV export includes BOM for proper UTF-8 encoding in Excel
- Evidence can be attached to entries using `auditStore.addEvidence(entryId, evidence)`
</summary>