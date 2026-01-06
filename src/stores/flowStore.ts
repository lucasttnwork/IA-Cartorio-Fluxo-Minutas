import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { ActType, Document, Person, Property, GraphEdge, Draft, Case } from '../types'
import { supabase } from '../lib/supabase'

// -----------------------------------------------------------------------------
// Flow Step Types
// -----------------------------------------------------------------------------

export type FlowStep =
  | 'case_creation'
  | 'document_upload'
  | 'entity_extraction'
  | 'canvas_review'
  | 'draft_generation'

export type FlowStepStatus = 'pending' | 'in_progress' | 'completed' | 'error'

export interface FlowStepInfo {
  id: FlowStep
  label: string
  description: string
  status: FlowStepStatus
  completedAt?: string
  error?: string
}

// -----------------------------------------------------------------------------
// Flow State Types
// -----------------------------------------------------------------------------

export interface FlowCaseData {
  id?: string
  title: string
  actType: ActType
}

export interface FlowDocumentData {
  documents: Document[]
  uploadProgress: Record<string, number>
}

export interface FlowExtractionData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  isProcessing: boolean
  processingProgress: number
}

export interface FlowDraftData {
  draft: Draft | null
  isGenerating: boolean
}

export interface FlowState {
  // Flow identification
  flowId: string | null
  isActive: boolean
  startedAt: string | null
  completedAt: string | null

  // Current step tracking
  currentStep: FlowStep
  steps: FlowStepInfo[]

  // Step-specific data
  caseData: FlowCaseData | null
  documentData: FlowDocumentData
  extractionData: FlowExtractionData
  draftData: FlowDraftData

  // Error handling
  globalError: string | null

  // Loading states
  isLoading: boolean
  isSaving: boolean
}

// -----------------------------------------------------------------------------
// Flow Actions
// -----------------------------------------------------------------------------

interface FlowActions {
  // Flow lifecycle
  startFlow: (actType?: ActType) => void
  resumeFlowForCase: (caseId: string) => Promise<void>
  completeFlow: () => void
  cancelFlow: () => void
  resetFlow: () => void

  // Step navigation
  goToStep: (step: FlowStep) => void
  nextStep: () => void
  previousStep: () => void
  canGoToStep: (step: FlowStep) => boolean

  // Step status management
  setStepStatus: (step: FlowStep, status: FlowStepStatus, error?: string) => void
  markStepCompleted: (step: FlowStep) => void
  markStepError: (step: FlowStep, error: string) => void

  // Case data management
  setCaseData: (data: Partial<FlowCaseData>) => void
  setCaseId: (id: string) => void

  // Document data management
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  removeDocument: (documentId: string) => void
  setUploadProgress: (documentId: string, progress: number) => void
  clearUploadProgress: (documentId: string) => void

  // Extraction data management
  setExtractionData: (data: Partial<FlowExtractionData>) => void
  setPeople: (people: Person[]) => void
  setProperties: (properties: Property[]) => void
  setEdges: (edges: GraphEdge[]) => void
  setExtractionProcessing: (isProcessing: boolean, progress?: number) => void

  // Draft data management
  setDraft: (draft: Draft | null) => void
  setDraftGenerating: (isGenerating: boolean) => void

  // Error handling
  setGlobalError: (error: string | null) => void
  clearErrors: () => void

  // Loading states
  setLoading: (isLoading: boolean) => void
  setSaving: (isSaving: boolean) => void

  // Utility methods
  getStepInfo: (step: FlowStep) => FlowStepInfo | undefined
  getCurrentStepInfo: () => FlowStepInfo | undefined
  getProgress: () => number
  isStepAccessible: (step: FlowStep) => boolean
}

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const FLOW_STEPS: FlowStepInfo[] = [
  {
    id: 'case_creation',
    label: 'Criar Caso',
    description: 'Defina o tipo de ato e título do caso',
    status: 'pending',
  },
  {
    id: 'document_upload',
    label: 'Upload de Documentos',
    description: 'Carregue os documentos necessários',
    status: 'pending',
  },
  {
    id: 'entity_extraction',
    label: 'Extração de Entidades',
    description: 'Extraia pessoas, imóveis e relacionamentos',
    status: 'pending',
  },
  {
    id: 'canvas_review',
    label: 'Revisão no Canvas',
    description: 'Revise e confirme as entidades extraídas',
    status: 'pending',
  },
  {
    id: 'draft_generation',
    label: 'Geração da Minuta',
    description: 'Gere a minuta do documento final',
    status: 'pending',
  },
]

const STEP_ORDER: FlowStep[] = [
  'case_creation',
  'document_upload',
  'entity_extraction',
  'canvas_review',
  'draft_generation',
]

function generateFlowId(): string {
  return `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const initialState: FlowState = {
  flowId: null,
  isActive: false,
  startedAt: null,
  completedAt: null,
  currentStep: 'case_creation',
  steps: FLOW_STEPS.map((step) => ({ ...step })),
  caseData: null,
  documentData: {
    documents: [],
    uploadProgress: {},
  },
  extractionData: {
    people: [],
    properties: [],
    edges: [],
    isProcessing: false,
    processingProgress: 0,
  },
  draftData: {
    draft: null,
    isGenerating: false,
  },
  globalError: null,
  isLoading: false,
  isSaving: false,
}

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------

export const useFlowStore = create<FlowState & FlowActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Flow lifecycle
        startFlow: (actType = 'purchase_sale') => {
          const now = new Date().toISOString()
          set({
            flowId: generateFlowId(),
            isActive: true,
            startedAt: now,
            completedAt: null,
            currentStep: 'case_creation',
            steps: FLOW_STEPS.map((step) => ({
              ...step,
              status: step.id === 'case_creation' ? 'in_progress' : 'pending',
              completedAt: undefined,
              error: undefined,
            })),
            caseData: {
              title: '',
              actType,
            },
            documentData: {
              documents: [],
              uploadProgress: {},
            },
            extractionData: {
              people: [],
              properties: [],
              edges: [],
              isProcessing: false,
              processingProgress: 0,
            },
            draftData: {
              draft: null,
              isGenerating: false,
            },
            globalError: null,
          })
        },

        resumeFlowForCase: async (caseId: string) => {
          const now = new Date().toISOString()
          set({ isLoading: true, globalError: null })

          try {
            // 1. Fetch case data from database
            const { data: caseDataResult, error: caseError } = await supabase
              .from('cases')
              .select('*')
              .eq('id', caseId)
              .single()

            if (caseError || !caseDataResult) {
              throw new Error(caseError?.message || 'Caso não encontrado')
            }

            const caseDataFromDb = caseDataResult as Case

            // 2. Fetch documents for the case
            const { data: documents, error: docsError } = await supabase
              .from('documents')
              .select('*')
              .eq('case_id', caseId)
              .order('created_at', { ascending: false })

            if (docsError) {
              console.error('Error fetching documents:', docsError)
            }

            // 3. Fetch people for the case
            const { data: people, error: peopleError } = await supabase
              .from('people')
              .select('*')
              .eq('case_id', caseId)

            if (peopleError) {
              console.error('Error fetching people:', peopleError)
            }

            // 4. Fetch properties for the case
            const { data: properties, error: propsError } = await supabase
              .from('properties')
              .select('*')
              .eq('case_id', caseId)

            if (propsError) {
              console.error('Error fetching properties:', propsError)
            }

            // 5. Fetch graph edges for the case
            const { data: edges, error: edgesError } = await supabase
              .from('graph_edges')
              .select('*')
              .eq('case_id', caseId)

            if (edgesError) {
              console.error('Error fetching edges:', edgesError)
            }

            // 6. Fetch draft for the case (if exists)
            const { data: draft, error: draftError } = await supabase
              .from('drafts')
              .select('*')
              .eq('case_id', caseId)
              .order('version', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (draftError) {
              console.error('Error fetching draft:', draftError)
            }

            // 7. Determine the correct step based on what data exists
            // We aim to resume at the furthest logical point while being conservative
            const hasDocuments = documents && documents.length > 0
            const hasEntities = (people && people.length > 0) || (properties && properties.length > 0)
            const hasDraft = draft !== null

            // Check if there are pending processing jobs (extraction in progress)
            const { data: pendingJobs } = await supabase
              .from('processing_jobs')
              .select('id, job_type, status')
              .eq('case_id', caseId)
              .in('status', ['pending', 'processing'])

            const hasActiveJobs = pendingJobs && pendingJobs.length > 0

            let currentStep: FlowStep = 'case_creation'
            const stepsStatuses: Record<FlowStep, 'pending' | 'completed' | 'in_progress'> = {
              case_creation: 'completed', // Case already exists
              document_upload: 'pending',
              entity_extraction: 'pending',
              canvas_review: 'pending',
              draft_generation: 'pending',
            }

            if (hasDocuments) {
              stepsStatuses.document_upload = 'completed'
              currentStep = 'entity_extraction'

              if (hasEntities) {
                stepsStatuses.entity_extraction = 'completed'
                currentStep = 'canvas_review'

                // Only mark canvas_review as completed if user has draft (meaning they proceeded past it)
                if (hasDraft) {
                  stepsStatuses.canvas_review = 'completed'
                  currentStep = 'draft_generation'
                  stepsStatuses.draft_generation = 'completed'
                }
              } else if (hasActiveJobs) {
                // Extraction is in progress, stay at entity_extraction
                currentStep = 'entity_extraction'
              }
            } else {
              // No documents yet, go to document_upload
              currentStep = 'document_upload'
            }

            // Mark current step as in_progress
            stepsStatuses[currentStep] = 'in_progress'

            // 8. Build the steps array with proper statuses
            const steps = FLOW_STEPS.map((step) => ({
              ...step,
              status: stepsStatuses[step.id] as 'pending' | 'completed' | 'in_progress',
              completedAt: stepsStatuses[step.id] === 'completed' ? now : undefined,
              error: undefined,
            }))

            // 9. Set the flow state
            set({
              flowId: generateFlowId(),
              isActive: true,
              startedAt: now,
              completedAt: hasDraft && stepsStatuses.draft_generation === 'completed' ? now : null,
              currentStep,
              steps,
              caseData: {
                id: caseDataFromDb.id,
                title: caseDataFromDb.title,
                actType: caseDataFromDb.act_type,
              },
              documentData: {
                documents: (documents || []) as Document[],
                uploadProgress: {},
              },
              extractionData: {
                people: (people || []) as Person[],
                properties: (properties || []) as Property[],
                edges: (edges || []) as GraphEdge[],
                isProcessing: false,
                processingProgress: 0,
              },
              draftData: {
                draft: draft as Draft | null,
                isGenerating: false,
              },
              globalError: null,
              isLoading: false,
            })

            console.log('[resumeFlowForCase] Flow resumed successfully:', {
              caseId,
              currentStep,
              documentsCount: documents?.length || 0,
              peopleCount: people?.length || 0,
              propertiesCount: properties?.length || 0,
              edgesCount: edges?.length || 0,
              hasDraft,
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar caso'
            console.error('[resumeFlowForCase] Error:', errorMessage)
            set({
              isLoading: false,
              globalError: errorMessage,
            })
          }
        },

        completeFlow: () => {
          const state = get()
          const now = new Date().toISOString()

          set({
            completedAt: now,
            steps: state.steps.map((step) =>
              step.id === 'draft_generation'
                ? { ...step, status: 'completed', completedAt: now }
                : step
            ),
          })
        },

        cancelFlow: () => {
          set({
            isActive: false,
            globalError: null,
          })
        },

        resetFlow: () => {
          set(initialState)
        },

        // Step navigation
        goToStep: (step) => {
          const state = get()
          if (!state.isStepAccessible(step)) return

          set({
            currentStep: step,
            steps: state.steps.map((s) =>
              s.id === step && s.status === 'pending'
                ? { ...s, status: 'in_progress' }
                : s
            ),
          })
        },

        nextStep: () => {
          const state = get()
          const currentIndex = STEP_ORDER.indexOf(state.currentStep)
          if (currentIndex < STEP_ORDER.length - 1) {
            const nextStep = STEP_ORDER[currentIndex + 1]
            state.markStepCompleted(state.currentStep)
            state.goToStep(nextStep)
          }
        },

        previousStep: () => {
          const state = get()
          const currentIndex = STEP_ORDER.indexOf(state.currentStep)
          if (currentIndex > 0) {
            const prevStep = STEP_ORDER[currentIndex - 1]
            set({ currentStep: prevStep })
          }
        },

        canGoToStep: (step) => {
          const state = get()
          const stepIndex = STEP_ORDER.indexOf(step)
          const currentIndex = STEP_ORDER.indexOf(state.currentStep)

          // Can always go back
          if (stepIndex <= currentIndex) return true

          // Can only go forward if previous steps are completed
          for (let i = 0; i < stepIndex; i++) {
            const prevStepInfo = state.steps.find((s) => s.id === STEP_ORDER[i])
            if (prevStepInfo?.status !== 'completed') return false
          }
          return true
        },

        // Step status management
        setStepStatus: (step, status, error) => {
          const state = get()
          set({
            steps: state.steps.map((s) =>
              s.id === step
                ? {
                    ...s,
                    status,
                    error,
                    completedAt: status === 'completed' ? new Date().toISOString() : s.completedAt,
                  }
                : s
            ),
          })
        },

        markStepCompleted: (step) => {
          get().setStepStatus(step, 'completed')
        },

        markStepError: (step, error) => {
          get().setStepStatus(step, 'error', error)
        },

        // Case data management
        setCaseData: (data) => {
          const state = get()
          set({
            caseData: state.caseData
              ? { ...state.caseData, ...data }
              : { title: '', actType: 'purchase_sale', ...data },
          })
        },

        setCaseId: (id) => {
          const state = get()
          if (state.caseData) {
            set({
              caseData: { ...state.caseData, id },
            })
          }
        },

        // Document data management
        setDocuments: (documents) => {
          const state = get()
          set({
            documentData: { ...state.documentData, documents },
          })
        },

        addDocument: (document) => {
          const state = get()
          set({
            documentData: {
              ...state.documentData,
              documents: [...state.documentData.documents, document],
            },
          })
        },

        removeDocument: (documentId) => {
          const state = get()
          set({
            documentData: {
              ...state.documentData,
              documents: state.documentData.documents.filter((d) => d.id !== documentId),
            },
          })
        },

        setUploadProgress: (documentId, progress) => {
          const state = get()
          set({
            documentData: {
              ...state.documentData,
              uploadProgress: {
                ...state.documentData.uploadProgress,
                [documentId]: progress,
              },
            },
          })
        },

        clearUploadProgress: (documentId) => {
          const state = get()
          const { [documentId]: _, ...rest } = state.documentData.uploadProgress
          set({
            documentData: {
              ...state.documentData,
              uploadProgress: rest,
            },
          })
        },

        // Extraction data management
        setExtractionData: (data) => {
          const state = get()
          set({
            extractionData: { ...state.extractionData, ...data },
          })
        },

        setPeople: (people) => {
          const state = get()
          set({
            extractionData: { ...state.extractionData, people },
          })
        },

        setProperties: (properties) => {
          const state = get()
          set({
            extractionData: { ...state.extractionData, properties },
          })
        },

        setEdges: (edges) => {
          const state = get()
          set({
            extractionData: { ...state.extractionData, edges },
          })
        },

        setExtractionProcessing: (isProcessing, progress = 0) => {
          const state = get()
          set({
            extractionData: {
              ...state.extractionData,
              isProcessing,
              processingProgress: progress,
            },
          })
        },

        // Draft data management
        setDraft: (draft) => {
          const state = get()
          set({
            draftData: { ...state.draftData, draft },
          })
        },

        setDraftGenerating: (isGenerating) => {
          const state = get()
          set({
            draftData: { ...state.draftData, isGenerating },
          })
        },

        // Error handling
        setGlobalError: (error) => {
          set({ globalError: error })
        },

        clearErrors: () => {
          const state = get()
          set({
            globalError: null,
            steps: state.steps.map((s) => ({ ...s, error: undefined })),
          })
        },

        // Loading states
        setLoading: (isLoading) => set({ isLoading }),
        setSaving: (isSaving) => set({ isSaving }),

        // Utility methods
        getStepInfo: (step) => {
          return get().steps.find((s) => s.id === step)
        },

        getCurrentStepInfo: () => {
          const state = get()
          return state.steps.find((s) => s.id === state.currentStep)
        },

        getProgress: () => {
          const state = get()
          const completedSteps = state.steps.filter((s) => s.status === 'completed').length
          return Math.round((completedSteps / state.steps.length) * 100)
        },

        isStepAccessible: (step) => {
          return get().canGoToStep(step)
        },
      }),
      {
        name: 'flow-store',
        partialize: (state) => ({
          flowId: state.flowId,
          isActive: state.isActive,
          startedAt: state.startedAt,
          currentStep: state.currentStep,
          steps: state.steps,
          caseData: state.caseData,
          documentData: {
            documents: state.documentData.documents,
            uploadProgress: {},
          },
          extractionData: {
            people: state.extractionData.people,
            properties: state.extractionData.properties,
            edges: state.extractionData.edges,
            isProcessing: false,
            processingProgress: 0,
          },
          draftData: {
            draft: state.draftData.draft,
            isGenerating: false,
          },
        }),
      }
    ),
    { name: 'flow-store' }
  )
)

// -----------------------------------------------------------------------------
// Selector Hooks
// -----------------------------------------------------------------------------

export function useFlowCurrentStep() {
  return useFlowStore((state) => ({
    currentStep: state.currentStep,
    stepInfo: state.steps.find((s) => s.id === state.currentStep),
  }))
}

export function useFlowProgress() {
  return useFlowStore((state) => ({
    progress: state.getProgress(),
    completedSteps: state.steps.filter((s) => s.status === 'completed').length,
    totalSteps: state.steps.length,
  }))
}

export function useFlowCaseData() {
  return useFlowStore((state) => state.caseData)
}

export function useFlowDocuments() {
  return useFlowStore((state) => state.documentData)
}

export function useFlowExtractionData() {
  return useFlowStore((state) => state.extractionData)
}

export function useFlowDraftData() {
  return useFlowStore((state) => state.draftData)
}

export function useFlowIsActive() {
  return useFlowStore((state) => state.isActive)
}

export default useFlowStore
