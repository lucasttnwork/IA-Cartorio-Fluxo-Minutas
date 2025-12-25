import { useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useFlowStore,
  useFlowCurrentStep,
  useFlowProgress,
  useFlowCaseData,
  useFlowDocuments,
  useFlowExtractionData,
  useFlowDraftData,
  useFlowIsActive,
  type FlowStep,
  type FlowCaseData,
} from '../stores/flowStore'
import { useCreateCase, casesQueryKey } from './useCases'
import { useCaseDocuments } from './useCaseDocuments'
import type { ActType, Document, Person, Property, GraphEdge, Draft } from '../types'

// -----------------------------------------------------------------------------
// Hook Return Type
// -----------------------------------------------------------------------------

export interface UsePurchaseSaleFlowReturn {
  // Flow state
  isActive: boolean
  flowId: string | null
  currentStep: FlowStep
  progress: number
  completedSteps: number
  totalSteps: number
  isLoading: boolean
  isSaving: boolean
  globalError: string | null

  // Step data
  caseData: FlowCaseData | null
  documents: Document[]
  uploadProgress: Record<string, number>
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  isExtracting: boolean
  extractionProgress: number
  draft: Draft | null
  isDraftGenerating: boolean

  // Flow lifecycle
  startFlow: (actType?: ActType) => void
  cancelFlow: () => void
  resetFlow: () => void
  resumeFlow: () => void

  // Step navigation
  goToStep: (step: FlowStep) => void
  nextStep: () => void
  previousStep: () => void
  canGoToStep: (step: FlowStep) => boolean
  canProceed: boolean
  canGoBack: boolean

  // Step-specific actions
  // Case creation
  updateCaseTitle: (title: string) => void
  updateActType: (actType: ActType) => void
  createCase: () => Promise<string | null>

  // Document upload
  addDocument: (document: Document) => void
  removeDocument: (documentId: string) => void
  setUploadProgress: (documentId: string, progress: number) => void
  clearUploadProgress: (documentId: string) => void
  hasDocuments: boolean

  // Entity extraction
  startExtraction: () => Promise<void>
  updatePeople: (people: Person[]) => void
  updateProperties: (properties: Property[]) => void
  updateEdges: (edges: GraphEdge[]) => void
  hasEntities: boolean

  // Draft generation
  generateDraft: () => Promise<void>
  updateDraft: (draft: Draft) => void
  hasDraft: boolean

  // Validation
  validateCurrentStep: () => { isValid: boolean; errors: string[] }
  getStepValidation: (step: FlowStep) => { isValid: boolean; errors: string[] }

  // Error handling
  setError: (error: string | null) => void
  clearErrors: () => void
  markStepError: (step: FlowStep, error: string) => void
}

// -----------------------------------------------------------------------------
// Step Validation Logic
// -----------------------------------------------------------------------------

function validateCaseCreation(caseData: FlowCaseData | null): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!caseData) {
    errors.push('Dados do caso nao definidos')
    return { isValid: false, errors }
  }

  if (!caseData.title || caseData.title.trim().length === 0) {
    errors.push('Titulo do caso e obrigatorio')
  }

  if (caseData.title && caseData.title.trim().length < 3) {
    errors.push('Titulo deve ter no minimo 3 caracteres')
  }

  if (!caseData.actType) {
    errors.push('Tipo de ato e obrigatorio')
  }

  return { isValid: errors.length === 0, errors }
}

function validateDocumentUpload(documents: Document[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (documents.length === 0) {
    errors.push('Pelo menos um documento e necessario')
  }

  const failedDocs = documents.filter(d => d.status === 'failed')
  if (failedDocs.length > 0) {
    errors.push(`${failedDocs.length} documento(s) com falha no upload`)
  }

  return { isValid: errors.length === 0, errors }
}

function validateEntityExtraction(
  people: Person[],
  properties: Property[],
  isProcessing: boolean
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (isProcessing) {
    errors.push('Extracao em andamento')
  }

  if (people.length === 0 && properties.length === 0) {
    errors.push('Nenhuma entidade extraida')
  }

  return { isValid: errors.length === 0, errors }
}

function validateCanvasReview(
  people: Person[],
  properties: Property[],
  edges: GraphEdge[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // At least one person is required for most acts
  if (people.length === 0) {
    errors.push('Pelo menos uma pessoa e necessaria')
  }

  // At least one property is required for purchase/sale
  if (properties.length === 0) {
    errors.push('Pelo menos um imovel e necessario')
  }

  // Check for unconfirmed edges (optional validation)
  const unconfirmedEdges = edges.filter(e => !e.confirmed)
  if (unconfirmedEdges.length > 0) {
    errors.push(`${unconfirmedEdges.length} relacionamento(s) nao confirmado(s)`)
  }

  return { isValid: errors.length === 0, errors }
}

function validateDraftGeneration(
  draft: Draft | null,
  isGenerating: boolean
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (isGenerating) {
    errors.push('Geracao de minuta em andamento')
  }

  if (!draft) {
    errors.push('Minuta nao gerada')
  }

  if (draft && draft.pending_items.length > 0) {
    const errorItems = draft.pending_items.filter(i => i.severity === 'error')
    if (errorItems.length > 0) {
      errors.push(`${errorItems.length} item(s) pendente(s) com erro`)
    }
  }

  return { isValid: errors.length === 0, errors }
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function usePurchaseSaleFlow(): UsePurchaseSaleFlowReturn {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createCaseMutation = useCreateCase()

  // Store selectors
  const isActive = useFlowIsActive()
  const { currentStep } = useFlowCurrentStep()
  const { progress, completedSteps, totalSteps } = useFlowProgress()
  const caseData = useFlowCaseData()
  const documentData = useFlowDocuments()
  const extractionData = useFlowExtractionData()
  const draftData = useFlowDraftData()

  // Direct store access for actions
  const store = useFlowStore()

  // Fetch documents from database for the current case
  const { documents: dbDocuments } = useCaseDocuments(caseData?.id)

  // Sync documents from database to flow store
  useEffect(() => {
    if (dbDocuments.length > 0) {
      store.setDocuments(dbDocuments)
    }
  }, [dbDocuments, store])

  // Computed values
  const hasDocuments = documentData.documents.length > 0
  const hasEntities = extractionData.people.length > 0 || extractionData.properties.length > 0
  const hasDraft = draftData.draft !== null

  // Determine if user can proceed to next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'case_creation':
        return validateCaseCreation(caseData).isValid && !!caseData?.id
      case 'document_upload':
        return validateDocumentUpload(documentData.documents).isValid
      case 'entity_extraction':
        return validateEntityExtraction(
          extractionData.people,
          extractionData.properties,
          extractionData.isProcessing
        ).isValid
      case 'canvas_review':
        // Canvas review validation is optional - can proceed with warnings
        return extractionData.people.length > 0 || extractionData.properties.length > 0
      case 'draft_generation':
        return hasDraft
      default:
        return false
    }
  }, [currentStep, caseData, documentData.documents, extractionData, hasDraft])

  // Determine if user can go back
  const canGoBack = useMemo(() => {
    const stepOrder: FlowStep[] = [
      'case_creation',
      'document_upload',
      'entity_extraction',
      'canvas_review',
      'draft_generation',
    ]
    return stepOrder.indexOf(currentStep) > 0
  }, [currentStep])

  // Validation for current step
  const validateCurrentStep = useCallback((): { isValid: boolean; errors: string[] } => {
    switch (currentStep) {
      case 'case_creation':
        return validateCaseCreation(caseData)
      case 'document_upload':
        return validateDocumentUpload(documentData.documents)
      case 'entity_extraction':
        return validateEntityExtraction(
          extractionData.people,
          extractionData.properties,
          extractionData.isProcessing
        )
      case 'canvas_review':
        return validateCanvasReview(
          extractionData.people,
          extractionData.properties,
          extractionData.edges
        )
      case 'draft_generation':
        return validateDraftGeneration(draftData.draft, draftData.isGenerating)
      default:
        return { isValid: false, errors: ['Etapa desconhecida'] }
    }
  }, [currentStep, caseData, documentData.documents, extractionData, draftData])

  // Validation for any step
  const getStepValidation = useCallback(
    (step: FlowStep): { isValid: boolean; errors: string[] } => {
      switch (step) {
        case 'case_creation':
          return validateCaseCreation(caseData)
        case 'document_upload':
          return validateDocumentUpload(documentData.documents)
        case 'entity_extraction':
          return validateEntityExtraction(
            extractionData.people,
            extractionData.properties,
            extractionData.isProcessing
          )
        case 'canvas_review':
          return validateCanvasReview(
            extractionData.people,
            extractionData.properties,
            extractionData.edges
          )
        case 'draft_generation':
          return validateDraftGeneration(draftData.draft, draftData.isGenerating)
        default:
          return { isValid: false, errors: ['Etapa desconhecida'] }
      }
    },
    [caseData, documentData.documents, extractionData, draftData]
  )

  // Flow lifecycle actions
  const startFlow = useCallback(
    (actType: ActType = 'purchase_sale') => {
      store.startFlow(actType)
      navigate('/flow/purchase-sale')
    },
    [store, navigate]
  )

  const cancelFlow = useCallback(() => {
    store.cancelFlow()
    navigate('/dashboard')
  }, [store, navigate])

  const resetFlow = useCallback(() => {
    store.resetFlow()
  }, [store])

  const resumeFlow = useCallback(() => {
    if (isActive) {
      navigate('/flow/purchase-sale')
    }
  }, [isActive, navigate])

  // Step navigation
  const goToStep = useCallback(
    (step: FlowStep) => {
      store.goToStep(step)
    },
    [store]
  )

  const nextStep = useCallback(() => {
    store.nextStep()
  }, [store])

  const previousStep = useCallback(() => {
    store.previousStep()
  }, [store])

  const canGoToStep = useCallback(
    (step: FlowStep) => {
      return store.canGoToStep(step)
    },
    [store]
  )

  // Case creation actions
  const updateCaseTitle = useCallback(
    (title: string) => {
      store.setCaseData({ title })
    },
    [store]
  )

  const updateActType = useCallback(
    (actType: ActType) => {
      store.setCaseData({ actType })
    },
    [store]
  )

  const createCase = useCallback(async (): Promise<string | null> => {
    if (!caseData) {
      store.setGlobalError('Dados do caso nao definidos')
      return null
    }

    const validation = validateCaseCreation(caseData)
    if (!validation.isValid) {
      store.setGlobalError(validation.errors.join('. '))
      return null
    }

    store.setLoading(true)
    try {
      const newCase = await createCaseMutation.mutateAsync({
        title: caseData.title,
        act_type: caseData.actType,
      })

      store.setCaseId(newCase.id)
      store.markStepCompleted('case_creation')

      // Invalidate cases query
      queryClient.invalidateQueries({ queryKey: casesQueryKey })

      return newCase.id
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar caso'
      store.markStepError('case_creation', errorMessage)
      store.setGlobalError(errorMessage)
      return null
    } finally {
      store.setLoading(false)
    }
  }, [caseData, createCaseMutation, store, queryClient])

  // Document actions
  const addDocument = useCallback(
    (document: Document) => {
      store.addDocument(document)
    },
    [store]
  )

  const removeDocument = useCallback(
    (documentId: string) => {
      store.removeDocument(documentId)
    },
    [store]
  )

  const setUploadProgress = useCallback(
    (documentId: string, progress: number) => {
      store.setUploadProgress(documentId, progress)
    },
    [store]
  )

  const clearUploadProgress = useCallback(
    (documentId: string) => {
      store.clearUploadProgress(documentId)
    },
    [store]
  )

  // Entity extraction actions
  const startExtraction = useCallback(async () => {
    store.setExtractionProcessing(true, 0)
    store.setStepStatus('entity_extraction', 'in_progress')

    try {
      // This would typically call an API to start extraction
      // For now, we'll simulate progress
      // The actual implementation would be integrated with the extraction service

      // Mark extraction as started
      store.setExtractionProcessing(true, 10)

      // Note: In a real implementation, this would:
      // 1. Call the extraction API
      // 2. Subscribe to real-time updates for progress
      // 3. Update people/properties as they are extracted

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na extracao'
      store.markStepError('entity_extraction', errorMessage)
      store.setGlobalError(errorMessage)
      store.setExtractionProcessing(false, 0)
    }
  }, [store])

  const updatePeople = useCallback(
    (people: Person[]) => {
      store.setPeople(people)
    },
    [store]
  )

  const updateProperties = useCallback(
    (properties: Property[]) => {
      store.setProperties(properties)
    },
    [store]
  )

  const updateEdges = useCallback(
    (edges: GraphEdge[]) => {
      store.setEdges(edges)
    },
    [store]
  )

  // Draft generation actions
  const generateDraft = useCallback(async () => {
    store.setDraftGenerating(true)
    store.setStepStatus('draft_generation', 'in_progress')

    try {
      // This would typically call an API to generate the draft
      // For now, we'll just mark as in progress

      // Note: In a real implementation, this would:
      // 1. Call the draft generation API with case data
      // 2. Subscribe to real-time updates for generation progress
      // 3. Update the draft when complete

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na geracao da minuta'
      store.markStepError('draft_generation', errorMessage)
      store.setGlobalError(errorMessage)
      store.setDraftGenerating(false)
    }
  }, [store])

  const updateDraft = useCallback(
    (draft: Draft) => {
      store.setDraft(draft)
      store.setDraftGenerating(false)
    },
    [store]
  )

  // Error handling
  const setError = useCallback(
    (error: string | null) => {
      store.setGlobalError(error)
    },
    [store]
  )

  const clearErrors = useCallback(() => {
    store.clearErrors()
  }, [store])

  const markStepError = useCallback(
    (step: FlowStep, error: string) => {
      store.markStepError(step, error)
    },
    [store]
  )

  return {
    // Flow state
    isActive,
    flowId: store.flowId,
    currentStep,
    progress,
    completedSteps,
    totalSteps,
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    globalError: store.globalError,

    // Step data
    caseData,
    documents: documentData.documents,
    uploadProgress: documentData.uploadProgress,
    people: extractionData.people,
    properties: extractionData.properties,
    edges: extractionData.edges,
    isExtracting: extractionData.isProcessing,
    extractionProgress: extractionData.processingProgress,
    draft: draftData.draft,
    isDraftGenerating: draftData.isGenerating,

    // Flow lifecycle
    startFlow,
    cancelFlow,
    resetFlow,
    resumeFlow,

    // Step navigation
    goToStep,
    nextStep,
    previousStep,
    canGoToStep,
    canProceed,
    canGoBack,

    // Step-specific actions
    updateCaseTitle,
    updateActType,
    createCase,
    addDocument,
    removeDocument,
    setUploadProgress,
    clearUploadProgress,
    hasDocuments,
    startExtraction,
    updatePeople,
    updateProperties,
    updateEdges,
    hasEntities,
    generateDraft,
    updateDraft,
    hasDraft,

    // Validation
    validateCurrentStep,
    getStepValidation,

    // Error handling
    setError,
    clearErrors,
    markStepError,
  }
}

export default usePurchaseSaleFlow
