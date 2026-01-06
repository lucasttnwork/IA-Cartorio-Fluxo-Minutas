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
import { supabase, createProcessingJob, subscribeToCase } from '../lib/supabase'
import { checkWorkerHealth, getWorkerStartInstructions } from '../lib/workerHealth'
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
  resumeFlowForCase: (caseId: string) => Promise<void>

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
  refreshDocuments: () => Promise<void>
  hasDocuments: boolean

  // Entity extraction
  startExtraction: () => Promise<void>
  refreshEntities: () => Promise<void>
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
  markStepCompleted: (step: FlowStep) => void
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
  }, [dbDocuments]) // store is stable, no need in deps

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
      navigate('/purchase-sale-flow')
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
      navigate('/purchase-sale-flow')
    }
  }, [isActive, navigate])

  const resumeFlowForCase = useCallback(async (caseId: string) => {
    await store.resumeFlowForCase(caseId)
  }, [store])

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

  // Refresh documents from database
  const refreshDocuments = useCallback(async () => {
    if (!caseData?.id) return

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseData.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error refreshing documents:', error)
        return
      }

      if (data) {
        store.setDocuments(data as unknown as Document[])
      }
    } catch (err) {
      console.error('Error refreshing documents:', err)
    }
  }, [caseData?.id, store])

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
    if (!caseData?.id) {
      store.setGlobalError('Caso nao encontrado')
      return
    }

    // Check if worker is running before creating jobs
    console.log('[StartExtraction] Checking worker health...')
    const workerHealth = await checkWorkerHealth()

    if (!workerHealth.isHealthy) {
      const instructions = getWorkerStartInstructions()
      const errorMessage = `Worker offline: ${workerHealth.error || 'Não foi possível conectar'}\n\n${instructions}`
      store.setGlobalError(errorMessage)
      store.markStepError('entity_extraction', errorMessage)
      console.error('[StartExtraction] Worker health check failed:', workerHealth)
      return
    }

    console.log('[StartExtraction] Worker is healthy:', workerHealth)

    store.setExtractionProcessing(true, 0)
    store.setStepStatus('entity_extraction', 'in_progress')

    try {
      // Type definitions for Supabase queries
      type DocRow = { id: string; status: string }
      type JobRow = { id: string; job_type: string; status: string; document_id: string }
      type ExtractionRow = { id: string; llm_result: unknown }

      // Get ALL documents for this case
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id, status')
        .eq('case_id', caseData.id) as { data: DocRow[] | null; error: unknown }

      if (docsError) {
        throw new Error(`Erro ao buscar documentos: ${(docsError as Error).message}`)
      }

      if (!docs || docs.length === 0) {
        throw new Error('Nenhum documento encontrado para extrair')
      }

      // All documents can be processed - no filtering needed anymore
      // Status 'uploaded' -> needs OCR first
      // Status 'processed' -> OCR done, needs extraction or entity_extraction
      // Status 'processing' -> job already running, skip
      // Status 'failed' -> will be retried
      const docsToProcess = docs.filter(d => d.status !== 'processing')

      if (docsToProcess.length === 0) {
        // All documents are currently processing - just set up monitoring
        console.log('[StartExtraction] All documents are currently processing, setting up monitoring')
        store.setExtractionProcessing(true, 25)
      }

      store.setExtractionProcessing(true, 5)

      // Create jobs for documents that need processing
      // Using Promise.all for PARALLEL job creation (faster)
      const jobPromises: Promise<void>[] = []
      const totalDocs = docsToProcess.length

      for (const doc of docsToProcess) {
        const jobPromise = (async () => {
          // Check if there's already a pending/processing job for this document
          const { data: existingJobs } = await supabase
            .from('processing_jobs')
            .select('id, job_type, status')
            .eq('document_id', doc.id)
            .in('status', ['pending', 'processing']) as { data: JobRow[] | null; error: unknown }

          const hasActiveJob = existingJobs && existingJobs.length > 0

          if (!hasActiveJob) {
            // Determine which job to create based on document status
            if (doc.status === 'uploaded' || doc.status === 'failed') {
              // Document needs OCR first - pipeline will auto-trigger extraction -> entity_extraction -> entity_resolution
              console.log(`[StartExtraction] Creating OCR job for document ${doc.id}`)
              await createProcessingJob(caseData.id, doc.id, 'ocr')
            } else if (doc.status === 'processed') {
              // Check if extraction already happened
              const { data: extraction } = await supabase
                .from('extractions')
                .select('id, llm_result')
                .eq('document_id', doc.id)
                .single() as { data: ExtractionRow | null; error: unknown }

              if (extraction?.llm_result) {
                // Extraction done, create entity_extraction job
                console.log(`[StartExtraction] Creating entity_extraction job for document ${doc.id}`)
                await createProcessingJob(caseData.id, doc.id, 'entity_extraction')
              } else {
                // Need to run extraction first
                console.log(`[StartExtraction] Creating extraction job for document ${doc.id}`)
                await createProcessingJob(caseData.id, doc.id, 'extraction')
              }
            }
          } else {
            console.log(`[StartExtraction] Document ${doc.id} already has active job, skipping`)
          }
        })()

        jobPromises.push(jobPromise)
      }

      // Wait for all job creation in parallel
      await Promise.all(jobPromises)

      // Update progress after all jobs created
      store.setExtractionProcessing(true, 25)
      console.log(`[StartExtraction] Created jobs for ${totalDocs} documents (parallel creation)`)

      // Set up realtime subscription to monitor progress
      const currentCaseId = caseData.id
      let pollingInterval: NodeJS.Timeout | null = null
      let timeoutTimer: NodeJS.Timeout | null = null
      let unsubscribed = false

      const cleanupAndComplete = async (reason: 'success' | 'timeout' | 'error' = 'success') => {
        if (unsubscribed) return
        unsubscribed = true

        console.log(`[CleanupAndComplete] Cleaning up extraction monitoring (${reason})`)

        // Clear polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval)
          pollingInterval = null
        }

        // Clear timeout timer
        if (timeoutTimer) {
          clearTimeout(timeoutTimer)
          timeoutTimer = null
        }

        // Unsubscribe from realtime
        unsubscribe()

        if (reason === 'timeout') {
          // Timeout - show error but don't fail completely
          const message = 'Tempo limite excedido. Verifique se o worker está rodando.'
          store.setGlobalError(message)
          store.setExtractionProcessing(false, store.extractionData.processingProgress)
          return
        }

        if (reason === 'error') {
          // Error already handled
          store.setExtractionProcessing(false, 0)
          return
        }

        // Success - fetch final entities
        const peopleResult = await supabase.from('people').select('*').eq('case_id', currentCaseId)
        const propertiesResult = await supabase.from('properties').select('*').eq('case_id', currentCaseId)
        const edgesResult = await supabase.from('graph_edges').select('*').eq('case_id', currentCaseId)

        console.log('[CleanupAndComplete] Entities fetched:', {
          people: peopleResult.data?.length || 0,
          properties: propertiesResult.data?.length || 0,
          edges: edgesResult.data?.length || 0,
        })

        if (peopleResult.data) {
          store.setPeople(peopleResult.data as unknown as Person[])
        }
        if (propertiesResult.data) {
          store.setProperties(propertiesResult.data as unknown as Property[])
        }
        if (edgesResult.data) {
          store.setEdges(edgesResult.data as unknown as GraphEdge[])
        }

        // Verify that entities were actually created
        const hasEntities = (peopleResult.data && peopleResult.data.length > 0) ||
                           (propertiesResult.data && propertiesResult.data.length > 0)

        if (!hasEntities) {
          console.warn('[CleanupAndComplete] No entities found after extraction completed')
          store.setGlobalError(
            'A extração foi concluída mas nenhuma entidade foi encontrada. Verifique se os documentos contêm informações de pessoas ou imóveis.'
          )
          store.setExtractionProcessing(false, 100)
          store.markStepError('entity_extraction', 'Nenhuma entidade extraída')
          return
        }

        // Mark extraction as complete with entities found
        console.log('[CleanupAndComplete] Extraction completed successfully with entities')
        store.setExtractionProcessing(false, 100)
        store.markStepCompleted('entity_extraction')
      }

      // Set maximum timeout of 5 minutes to prevent infinite polling
      timeoutTimer = setTimeout(() => {
        console.warn('[StartExtraction] Timeout after 5 minutes')
        cleanupAndComplete('timeout')
      }, 5 * 60 * 1000) // 5 minutes

      const unsubscribe = subscribeToCase(currentCaseId, {
        onProcessingJobChange: async (payload: unknown) => {
          const jobPayload = payload as { new?: { status?: string; job_type?: string } }

          console.log('[SubscriptionChange] Job changed:', {
            jobType: jobPayload.new?.job_type,
            status: jobPayload.new?.status,
          })

          // When entity_resolution completes, cleanup and complete
          if (jobPayload.new?.job_type === 'entity_resolution' && jobPayload.new?.status === 'completed') {
            console.log('[SubscriptionChange] Entity resolution completed, calling cleanupAndComplete')
            await cleanupAndComplete()
          }

          // Update progress based on job status
          if (jobPayload.new?.status === 'completed') {
            const currentProgress = store.extractionData.processingProgress
            const newProgress = Math.min(currentProgress + 15, 95)
            console.log('[SubscriptionChange] Job completed, updating progress:', currentProgress, '->', newProgress)
            store.setExtractionProcessing(true, newProgress)
          }
        },
        onEntityChange: async () => {
          console.log('[SubscriptionChange] Entity changed, refreshing entities')
          // Refresh entities when they change
          const peopleResult = await supabase.from('people').select('*').eq('case_id', currentCaseId)
          const propertiesResult = await supabase.from('properties').select('*').eq('case_id', currentCaseId)

          console.log('[SubscriptionChange] Entities refreshed:', {
            people: peopleResult.data?.length || 0,
            properties: propertiesResult.data?.length || 0,
          })

          if (peopleResult.data) {
            store.setPeople(peopleResult.data as unknown as Person[])
          }
          if (propertiesResult.data) {
            store.setProperties(propertiesResult.data as unknown as Property[])
          }
        },
      })

      // Start active polling to ensure progress updates even if subscription fails
      let consecutiveNoProgressCount = 0
      let entityResolutionWaitCount = 0 // Counter for waiting on entity_resolution after all doc jobs complete
      const MAX_ENTITY_RESOLUTION_WAIT = 30 // Wait up to 60 seconds (30 polls * 2s) for entity_resolution

      const pollJobProgress = async () => {
        try {
          // Get all jobs for this case
          const { data: allJobs } = await supabase
            .from('processing_jobs')
            .select('id, job_type, status, document_id')
            .eq('case_id', currentCaseId)
            .in('job_type', ['ocr', 'extraction', 'entity_extraction', 'entity_resolution']) as { data: JobRow[] | null; error: unknown }

          if (!allJobs || allJobs.length === 0) {
            console.warn('[PollJobProgress] No jobs found for case', currentCaseId)
            return
          }

          // Count jobs by status
          const completedJobs = allJobs.filter(j => j.status === 'completed').length
          const failedJobs = allJobs.filter(j => j.status === 'failed').length
          const processingJobs = allJobs.filter(j => j.status === 'processing').length
          const pendingJobs = allJobs.filter(j => j.status === 'pending').length
          const totalJobs = allJobs.length

          // Calculate real progress: 25% (initial) + 70% (jobs completion) = 95% max
          // Final 5% reserved for entity fetching which completes at 100%
          const jobProgress = Math.round((completedJobs / totalJobs) * 70)
          const calculatedProgress = Math.min(25 + jobProgress, 95)

          // Get current progress
          const currentProgress = store.extractionData.processingProgress

          // Track if progress is stuck
          if (calculatedProgress <= currentProgress) {
            consecutiveNoProgressCount++

            // If no progress for 30 seconds (15 polls at 2s interval) and worker might be offline
            if (consecutiveNoProgressCount >= 15 && (processingJobs > 0 || pendingJobs > 0)) {
              console.warn('[PollJobProgress] No progress detected. Worker may be offline.')
              store.setGlobalError(
                'Nenhum progresso detectado. Verifique se o worker está rodando (npm run dev no diretório worker/).'
              )
            }
          } else {
            // Progress detected, reset counter
            consecutiveNoProgressCount = 0
            store.setExtractionProcessing(true, calculatedProgress)
            console.log(
              `[PollJobProgress] Progress: ${calculatedProgress}% ` +
              `(${completedJobs}/${totalJobs} completed, ${processingJobs} processing, ${pendingJobs} pending, ${failedJobs} failed)`
            )
          }

          // Check if any entity_resolution job completed
          const entityResolutionJob = allJobs.find(j => j.job_type === 'entity_resolution' && j.status === 'completed')
          if (entityResolutionJob) {
            console.log('[PollJobProgress] Entity resolution job completed:', entityResolutionJob.id)
            console.log('[PollJobProgress] Calling cleanupAndComplete to finalize extraction...')
            await cleanupAndComplete('success')
            return
          }

          // FALLBACK: Check if all document-level jobs are completed but no entity_resolution exists
          // This can happen if worker has connectivity issues or entity_resolution was never created
          const documentLevelJobs = allJobs.filter(j =>
            j.job_type === 'ocr' || j.job_type === 'extraction' || j.job_type === 'entity_extraction'
          )
          const allDocJobsCompleted = documentLevelJobs.length > 0 &&
            documentLevelJobs.every(j => j.status === 'completed')
          const entityResolutionPending = allJobs.find(
            j => j.job_type === 'entity_resolution' && (j.status === 'pending' || j.status === 'processing')
          )

          if (allDocJobsCompleted && !entityResolutionJob) {
            entityResolutionWaitCount++
            console.log(`[PollJobProgress] All document jobs completed, waiting for entity_resolution... (${entityResolutionWaitCount}/${MAX_ENTITY_RESOLUTION_WAIT})`)

            // Check if entities were already created
            const [peopleResult, propertiesResult] = await Promise.all([
              supabase.from('people').select('id').eq('case_id', currentCaseId).limit(1),
              supabase.from('properties').select('id').eq('case_id', currentCaseId).limit(1)
            ])

            const hasExistingEntities =
              (peopleResult.data && peopleResult.data.length > 0) ||
              (propertiesResult.data && propertiesResult.data.length > 0)

            if (hasExistingEntities) {
              console.log('[PollJobProgress] Found existing entities, completing extraction...')
              store.setExtractionProcessing(true, 98)
              await cleanupAndComplete('success')
              return
            }

            // If we've been waiting too long without entity_resolution
            if (entityResolutionWaitCount >= MAX_ENTITY_RESOLUTION_WAIT) {
              console.warn('[PollJobProgress] Timeout waiting for entity_resolution job')

              // Final check for entities one more time
              const [finalPeopleResult, finalPropertiesResult] = await Promise.all([
                supabase.from('people').select('*').eq('case_id', currentCaseId),
                supabase.from('properties').select('*').eq('case_id', currentCaseId)
              ])

              const finalHasEntities =
                (finalPeopleResult.data && finalPeopleResult.data.length > 0) ||
                (finalPropertiesResult.data && finalPropertiesResult.data.length > 0)

              if (finalHasEntities) {
                console.log('[PollJobProgress] Found entities on final check, completing...')
                if (finalPeopleResult.data) {
                  store.setPeople(finalPeopleResult.data as unknown as Person[])
                }
                if (finalPropertiesResult.data) {
                  store.setProperties(finalPropertiesResult.data as unknown as Property[])
                }
                store.setExtractionProcessing(false, 100)
                store.markStepCompleted('entity_extraction')
                if (pollingInterval) {
                  clearInterval(pollingInterval)
                  pollingInterval = null
                }
                return
              } else {
                // No entities after all this time - show warning but allow user to continue
                console.warn('[PollJobProgress] No entities found after timeout, marking as complete with warning')
                store.setGlobalError(
                  'Extração concluída, mas nenhuma entidade foi encontrada nos documentos. Verifique se os documentos contêm informações de pessoas ou imóveis.'
                )
                store.setExtractionProcessing(false, 100)
                store.markStepError('entity_extraction', 'Nenhuma entidade extraída')
                if (pollingInterval) {
                  clearInterval(pollingInterval)
                  pollingInterval = null
                }
                return
              }
            }

            // If there's no entity_resolution job pending or processing, try to create one
            if (!entityResolutionPending && entityResolutionWaitCount <= 5) {
              console.log('[PollJobProgress] No entity_resolution job found, attempting to create one...')

              try {
                const { error: createJobError } = await createProcessingJob(
                  currentCaseId,
                  null, // entity_resolution is case-level
                  'entity_resolution'
                )

                if (createJobError) {
                  // Job might already exist, ignore duplicate errors
                  const errorMsg = typeof createJobError === 'object' && createJobError !== null
                    ? (createJobError as { message?: string }).message || String(createJobError)
                    : String(createJobError)
                  if (!errorMsg.includes('duplicate') && !errorMsg.includes('unique')) {
                    console.error('[PollJobProgress] Failed to create entity_resolution job:', createJobError)
                  }
                } else {
                  console.log('[PollJobProgress] Created entity_resolution job, waiting for completion...')
                }
              } catch (jobCreateError) {
                console.error('[PollJobProgress] Error creating entity_resolution job:', jobCreateError)
              }
            }

            // Update progress to show we're in the final stage
            if (calculatedProgress >= 90) {
              store.setExtractionProcessing(true, Math.min(calculatedProgress + 1, 97))
            }
          } else {
            // Reset wait count if not in the waiting state
            entityResolutionWaitCount = 0
          }

          // Check for failures
          if (failedJobs > 0) {
            const failedJobsList = allJobs.filter(j => j.status === 'failed')
            console.error('[PollJobProgress] Jobs failed:', failedJobsList)

            // If ALL jobs failed, stop and show error
            if (failedJobs === totalJobs) {
              const errorMsg = `Todos os ${failedJobs} jobs falharam. Verifique os logs do worker.`
              store.setGlobalError(errorMsg)
              store.markStepError('entity_extraction', errorMsg)
              await cleanupAndComplete('error')
              return
            }

            // If SOME jobs failed but not all, show warning but continue
            if (failedJobs > 0 && failedJobs < totalJobs) {
              store.setGlobalError(
                `Atenção: ${failedJobs} de ${totalJobs} jobs falharam. Verifique os logs.`
              )
            }
          }
        } catch (error) {
          console.error('[PollJobProgress] Error polling jobs:', error)
          // Don't fail completely on polling errors, just log them
        }
      }

      // Start polling every 2 seconds
      pollingInterval = setInterval(pollJobProgress, 2000)

      // Do an immediate poll
      await pollJobProgress()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na extracao'
      store.markStepError('entity_extraction', errorMessage)
      store.setGlobalError(errorMessage)
      store.setExtractionProcessing(false, 0)
    }
  }, [store, caseData?.id])

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

  // Refresh entities from database
  const refreshEntities = useCallback(async () => {
    if (!caseData?.id) {
      console.warn('[RefreshEntities] No case ID available')
      return
    }

    console.log('[RefreshEntities] Fetching entities for case:', caseData.id)

    try {
      const [peopleResult, propertiesResult, edgesResult] = await Promise.all([
        supabase.from('people').select('*').eq('case_id', caseData.id),
        supabase.from('properties').select('*').eq('case_id', caseData.id),
        supabase.from('graph_edges').select('*').eq('case_id', caseData.id),
      ])

      console.log('[RefreshEntities] Entities fetched:', {
        people: peopleResult.data?.length || 0,
        properties: propertiesResult.data?.length || 0,
        edges: edgesResult.data?.length || 0,
      })

      if (peopleResult.data) {
        store.setPeople(peopleResult.data as unknown as Person[])
      }
      if (propertiesResult.data) {
        store.setProperties(propertiesResult.data as unknown as Property[])
      }
      if (edgesResult.data) {
        store.setEdges(edgesResult.data as unknown as GraphEdge[])
      }

      // If entities exist now, mark step as completed
      const hasEntitiesNow = (peopleResult.data && peopleResult.data.length > 0) ||
                            (propertiesResult.data && propertiesResult.data.length > 0)

      if (hasEntitiesNow) {
        console.log('[RefreshEntities] Entities found, marking step as completed')
        store.markStepCompleted('entity_extraction')
      }
    } catch (error) {
      console.error('[RefreshEntities] Error fetching entities:', error)
    }
  }, [caseData?.id, store])

  // Draft generation actions
  const generateDraft = useCallback(async () => {
    const currentCaseId = caseData?.id

    if (!currentCaseId) {
      store.markStepError('draft_generation', 'Caso nao encontrado')
      return
    }

    // Prevent multiple concurrent calls
    if (store.draftData.isGenerating) {
      console.log('[generateDraft] Already generating, ignoring call')
      return
    }

    store.setDraftGenerating(true)
    store.setStepStatus('draft_generation', 'in_progress')
    console.log('[generateDraft] Starting draft generation for case:', currentCaseId)

    // Keep track of channels for cleanup
    let draftChannel: ReturnType<typeof supabase.channel> | null = null
    let jobChannel: ReturnType<typeof supabase.channel> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (draftChannel) {
        draftChannel.unsubscribe()
        draftChannel = null
      }
      if (jobChannel) {
        jobChannel.unsubscribe()
        jobChannel = null
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    try {
      // 1. Create draft job in the database
      const { data: job, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          case_id: currentCaseId,
          document_id: null, // Draft jobs are case-level
          job_type: 'draft',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        })
        .select()
        .single()

      if (jobError) throw new Error(jobError.message)
      console.log('[generateDraft] Job created:', job.id)

      // 2. Set up Realtime Subscription for drafts
      draftChannel = supabase
        .channel(`draft-generation-${currentCaseId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'drafts',
          filter: `case_id=eq.${currentCaseId}`
        }, (payload) => {
          console.log('[generateDraft] Draft created via subscription:', payload.new)
          store.setDraft(payload.new as Draft)
          store.setStepStatus('draft_generation', 'completed')
          store.markStepCompleted('draft_generation')
          store.setDraftGenerating(false)
          cleanup()
        })
        .subscribe()

      // 3. Also monitor the job for failures
      jobChannel = supabase
        .channel(`draft-job-${job.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `id=eq.${job.id}`
        }, (payload) => {
          const updatedJob = payload.new as { status: string; error_message?: string }
          console.log('[generateDraft] Job updated:', updatedJob.status)

          if (updatedJob.status === 'failed') {
            store.markStepError('draft_generation', updatedJob.error_message || 'Falha na geracao da minuta')
            store.setDraftGenerating(false)
            cleanup()
          }
        })
        .subscribe()

      // 4. Safety timeout (5 minutes)
      timeoutId = setTimeout(() => {
        if (store.draftData.isGenerating) {
          console.warn('[generateDraft] Timeout reached')
          store.markStepError('draft_generation', 'Timeout na geracao da minuta. Verifique se o worker esta rodando.')
          store.setDraftGenerating(false)
          cleanup()
        }
      }, 5 * 60 * 1000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na geracao da minuta'
      console.error('[generateDraft] Error:', errorMessage)
      store.markStepError('draft_generation', errorMessage)
      store.setGlobalError(errorMessage)
      store.setDraftGenerating(false)
      cleanup()
    }
  }, [caseData?.id, store])

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

  const markStepCompleted = useCallback(
    (step: FlowStep) => {
      store.markStepCompleted(step)
    },
    [store]
  )

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
    resumeFlowForCase,

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
    refreshDocuments,
    hasDocuments,
    startExtraction,
    refreshEntities,
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
    markStepCompleted,
    markStepError,
  }
}

export default usePurchaseSaleFlow
