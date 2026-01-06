import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Case, Person, Property, GraphEdge, Draft, Document } from '../types'
import { useAuditStore } from './auditStore'
import type { FieldChangeEvidence } from '../types/audit'

// Helper to calculate field changes
function calculateFieldChanges<T extends Record<string, unknown>>(
  original: T,
  updates: Partial<T>,
  fieldLabels?: Record<string, string>
): FieldChangeEvidence[] {
  const changes: FieldChangeEvidence[] = []

  for (const key of Object.keys(updates) as (keyof T)[]) {
    const previousValue = original[key]
    const newValue = updates[key]

    // Only record if value actually changed
    if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
      changes.push({
        fieldName: fieldLabels?.[key as string] || String(key),
        fieldPath: String(key),
        previousValue,
        newValue,
        previousDisplayValue: formatDisplayValue(previousValue),
        newDisplayValue: formatDisplayValue(newValue),
        source: 'user',
      })
    }
  }

  return changes
}

// Helper to format display value
function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

interface AuditContext {
  userId: string
  userName: string
}

interface CaseState {
  // Current case data
  currentCase: Case | null
  documents: Document[]
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  currentDraft: Draft | null

  // Loading states
  isLoading: boolean
  isProcessing: boolean

  // Audit context
  auditContext: AuditContext | null
  setAuditContext: (context: AuditContext | null) => void

  // Actions
  setCurrentCase: (caseData: Case | null) => void
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  removeDocument: (id: string) => void

  setPeople: (people: Person[]) => void
  addPerson: (person: Person) => void
  updatePerson: (id: string, updates: Partial<Person>) => void
  removePerson: (id: string) => void

  setProperties: (properties: Property[]) => void
  addProperty: (property: Property) => void
  updateProperty: (id: string, updates: Partial<Property>) => void
  removeProperty: (id: string) => void

  setEdges: (edges: GraphEdge[]) => void
  addEdge: (edge: GraphEdge) => void
  updateEdge: (id: string, updates: Partial<GraphEdge>) => void
  removeEdge: (id: string) => void

  setCurrentDraft: (draft: Draft | null) => void
  setLoading: (loading: boolean) => void
  setProcessing: (processing: boolean) => void

  reset: () => void
}

const initialState = {
  currentCase: null,
  documents: [],
  people: [],
  properties: [],
  edges: [],
  currentDraft: null,
  isLoading: false,
  isProcessing: false,
  auditContext: null,
}

export const useCaseStore = create<CaseState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setAuditContext: (context) => set({ auditContext: context }),

      setCurrentCase: (caseData) => set({ currentCase: caseData }),

      // Document actions with audit logging
      setDocuments: (documents) => set({ documents }),

      addDocument: (document) => {
        const state = get()
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({ documents: [...state.documents, document] }))

        // Log audit entry
        if (state.currentCase && ctx) {
          auditStore.logDocumentUpload(
            state.currentCase.id,
            document.id,
            document.original_name,
            ctx.userId,
            ctx.userName
          )
        }
      },

      updateDocument: (id, updates) => {
        const state = get()
        const doc = state.documents.find((d) => d.id === id)

        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))

        // Log audit entry for status changes
        if (doc && state.currentCase && state.auditContext && updates.status && updates.status !== doc.status) {
          const auditStore = useAuditStore.getState()
          auditStore.addEntry({
            caseId: state.currentCase.id,
            action: 'document_status_change',
            category: 'document',
            targetType: 'document',
            targetId: id,
            targetLabel: doc.original_name,
            description: `Status do documento "${doc.original_name}" foi alterado`,
            details: `De "${doc.status}" para "${updates.status}"`,
            changes: [{
              fieldName: 'Status',
              fieldPath: 'status',
              previousValue: doc.status,
              newValue: updates.status,
              previousDisplayValue: doc.status,
              newDisplayValue: updates.status,
              source: 'user',
            }],
            userId: state.auditContext.userId,
            userName: state.auditContext.userName,
          })
        }
      },

      removeDocument: (id) => {
        const state = get()
        const doc = state.documents.find((d) => d.id === id)
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }))

        // Log audit entry
        if (doc && state.currentCase && ctx) {
          auditStore.logDocumentDelete(
            state.currentCase.id,
            id,
            doc.original_name,
            ctx.userId,
            ctx.userName
          )
        }
      },

      // People actions with audit logging
      setPeople: (people) => set({ people }),

      addPerson: (person) => {
        const state = get()
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({ people: [...state.people, person] }))

        // Log audit entry
        if (state.currentCase && ctx) {
          auditStore.logPersonCreate(
            state.currentCase.id,
            person.id,
            person.full_name,
            ctx.userId,
            ctx.userName
          )
        }
      },

      updatePerson: (id, updates) => {
        const state = get()
        const person = state.people.find((p) => p.id === id)
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({
          people: state.people.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))

        // Log audit entry with field changes
        if (person && state.currentCase && ctx) {
          const changes = calculateFieldChanges(person, updates, {
            full_name: 'Nome Completo',
            cpf: 'CPF',
            rg: 'RG',
            birth_date: 'Data de Nascimento',
            marital_status: 'Estado Civil',
            profession: 'Profissão',
            email: 'E-mail',
            phone: 'Telefone',
            address: 'Endereço',
          })

          if (changes.length > 0) {
            auditStore.logPersonUpdate(
              state.currentCase.id,
              id,
              person.full_name,
              changes,
              ctx.userId,
              ctx.userName
            )
          }
        }
      },

      removePerson: (id) => {
        const state = get()
        const person = state.people.find((p) => p.id === id)
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
        }))

        // Log audit entry
        if (person && state.currentCase && ctx) {
          auditStore.logPersonDelete(
            state.currentCase.id,
            id,
            person.full_name,
            ctx.userId,
            ctx.userName
          )
        }
      },

      // Property actions with audit logging
      setProperties: (properties) => set({ properties }),

      addProperty: (property) => {
        const state = get()
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({ properties: [...state.properties, property] }))

        // Log audit entry
        if (state.currentCase && ctx) {
          const label = property.registry_number || property.address?.street || 'Imóvel sem identificação'
          auditStore.logPropertyCreate(
            state.currentCase.id,
            property.id,
            label,
            ctx.userId,
            ctx.userName
          )
        }
      },

      updateProperty: (id, updates) => {
        const state = get()
        const property = state.properties.find((p) => p.id === id)
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))

        // Log audit entry with field changes
        if (property && state.currentCase && ctx) {
          const changes = calculateFieldChanges(property, updates, {
            registry_number: 'Matrícula',
            registry_office: 'Cartório',
            address: 'Endereço',
            area_sqm: 'Área (m²)',
            description: 'Descrição',
            iptu_number: 'IPTU',
          })

          if (changes.length > 0) {
            const label = property.registry_number || property.address?.street || 'Imóvel sem identificação'
            auditStore.logPropertyUpdate(
              state.currentCase.id,
              id,
              label,
              changes,
              ctx.userId,
              ctx.userName
            )
          }
        }
      },

      removeProperty: (id) => {
        const state = get()
        const property = state.properties.find((p) => p.id === id)
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        }))

        // Log audit entry
        if (property && state.currentCase && ctx) {
          const label = property.registry_number || property.address?.street || 'Imóvel sem identificação'
          auditStore.logPropertyDelete(
            state.currentCase.id,
            id,
            label,
            ctx.userId,
            ctx.userName
          )
        }
      },

      // Edge actions with audit logging
      setEdges: (edges) => set({ edges }),

      addEdge: (edge) => {
        const state = get()
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({ edges: [...state.edges, edge] }))

        // Log audit entry
        if (state.currentCase && ctx) {
          const label = `${edge.relationship} (${edge.source_type} -> ${edge.target_type})`
          auditStore.logEdgeCreate(
            state.currentCase.id,
            edge.id,
            label,
            ctx.userId,
            ctx.userName
          )
        }
      },

      updateEdge: (id, updates) => {
        set((state) => ({
          edges: state.edges.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      removeEdge: (id) => {
        const state = get()
        const edge = state.edges.find((e) => e.id === id)
        const auditStore = useAuditStore.getState()
        const ctx = state.auditContext

        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
        }))

        // Log audit entry
        if (edge && state.currentCase && ctx) {
          const label = `${edge.relationship} (${edge.source_type} -> ${edge.target_type})`
          auditStore.logEdgeDelete(
            state.currentCase.id,
            id,
            label,
            ctx.userId,
            ctx.userName
          )
        }
      },

      setCurrentDraft: (draft) => set({ currentDraft: draft }),
      setLoading: (loading) => set({ isLoading: loading }),
      setProcessing: (processing) => set({ isProcessing: processing }),

      reset: () => set(initialState),
    }),
    { name: 'case-store' }
  )
)
