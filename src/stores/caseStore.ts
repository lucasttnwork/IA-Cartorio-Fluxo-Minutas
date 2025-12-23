import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Case, Person, Property, GraphEdge, Draft, Document } from '../types'

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
}

export const useCaseStore = create<CaseState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentCase: (caseData) => set({ currentCase: caseData }),

      // Document actions
      setDocuments: (documents) => set({ documents }),
      addDocument: (document) =>
        set((state) => ({ documents: [...state.documents, document] })),
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
        })),
      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        })),

      // People actions
      setPeople: (people) => set({ people }),
      addPerson: (person) =>
        set((state) => ({ people: [...state.people, person] })),
      updatePerson: (id, updates) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePerson: (id) =>
        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
        })),

      // Property actions
      setProperties: (properties) => set({ properties }),
      addProperty: (property) =>
        set((state) => ({ properties: [...state.properties, property] })),
      updateProperty: (id, updates) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProperty: (id) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        })),

      // Edge actions
      setEdges: (edges) => set({ edges }),
      addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
      updateEdge: (id, updates) =>
        set((state) => ({
          edges: state.edges.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeEdge: (id) =>
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
        })),

      setCurrentDraft: (draft) => set({ currentDraft: draft }),
      setLoading: (loading) => set({ isLoading: loading }),
      setProcessing: (processing) => set({ isProcessing: processing }),

      reset: () => set(initialState),
    }),
    { name: 'case-store' }
  )
)
