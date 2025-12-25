/**
 * Custom hook for real-time document processing status monitoring.
 *
 * Provides a comprehensive view of document processing progress including:
 * - OCR job status and results
 * - Gemini extraction job status and insights
 * - Consensus job status
 * - Entity extraction job status
 * - Overall progress tracking
 * - Error handling with retry capabilities
 *
 * Uses Supabase Realtime to listen for changes to processing jobs and documents.
 */

import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  documentProcessingService,
  ProcessingStatus,
  OcrResultsWithQuality,
  GeminiInsights,
  DocumentProcessingResults,
  RetryJobResult,
} from '../services/documentProcessingService'
import type { DocumentStatus } from '../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Processing stage for UI display
 */
export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'ocr'
  | 'extraction'
  | 'consensus'
  | 'entity_extraction'
  | 'complete'
  | 'failed'

/**
 * State for the document processing hook
 */
export interface DocumentProcessingState {
  /** Current processing status */
  status: ProcessingStatus | null
  /** OCR results with quality metrics */
  ocrResults: OcrResultsWithQuality | null
  /** Gemini extraction insights */
  geminiInsights: GeminiInsights | null
  /** Complete processing results */
  fullResults: DocumentProcessingResults | null
  /** Current processing stage */
  currentStage: ProcessingStage
  /** Whether data is being loaded */
  isLoading: boolean
  /** Whether the subscription is active */
  isSubscribed: boolean
  /** Any error that occurred */
  error: Error | null
  /** Last update timestamp */
  lastUpdated: string | null
}

/**
 * Options for the document processing status hook
 */
export interface UseDocumentProcessingStatusOptions {
  /** Document ID to monitor */
  documentId: string
  /** Whether to automatically fetch OCR results when available */
  fetchOcrResults?: boolean
  /** Whether to automatically fetch Gemini insights when available */
  fetchGeminiInsights?: boolean
  /** Whether to fetch complete results on completion */
  fetchFullResults?: boolean
  /** Callback when processing starts */
  onProcessingStart?: (documentId: string) => void
  /** Callback when OCR completes */
  onOcrComplete?: (ocrResults: OcrResultsWithQuality) => void
  /** Callback when extraction completes */
  onExtractionComplete?: (insights: GeminiInsights) => void
  /** Callback when all processing completes */
  onProcessingComplete?: (results: DocumentProcessingResults) => void
  /** Callback when processing fails */
  onProcessingFailed?: (errors: string[]) => void
  /** Callback on any status change */
  onStatusChange?: (status: ProcessingStatus) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
  /** Polling interval in milliseconds (fallback if realtime fails) */
  pollingInterval?: number
}

/**
 * Return value from the document processing status hook
 */
export interface UseDocumentProcessingStatusReturn {
  /** Current state */
  state: DocumentProcessingState
  /** Manually refresh status */
  refresh: () => Promise<void>
  /** Retry a specific failed job */
  retryJob: (jobId: string) => Promise<RetryJobResult>
  /** Retry all failed jobs */
  retryAllFailed: () => Promise<{
    success: boolean
    retriedCount: number
    failedCount: number
    errors: string[]
  }>
  /** Manually unsubscribe */
  unsubscribe: () => void
  /** Manually resubscribe */
  resubscribe: () => void
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Determine current processing stage from status
 */
function determineStage(status: ProcessingStatus | null): ProcessingStage {
  if (!status) return 'idle'

  // Check for failures first
  if (status.hasErrors) {
    // Only mark as failed if critical jobs failed
    const criticalFailed =
      status.ocrJob?.status === 'failed' ||
      status.extractionJob?.status === 'failed'
    if (criticalFailed) return 'failed'
  }

  // Check if complete
  if (status.isComplete) return 'complete'

  // Determine current active stage
  if (status.entityExtractionJob?.status === 'processing') {
    return 'entity_extraction'
  }
  if (status.consensusJob?.status === 'processing') {
    return 'consensus'
  }
  if (status.extractionJob?.status === 'processing') {
    return 'extraction'
  }
  if (status.ocrJob?.status === 'processing') {
    return 'ocr'
  }

  // Check pending jobs
  if (
    status.ocrJob?.status === 'pending' ||
    status.extractionJob?.status === 'pending'
  ) {
    return status.ocrJob?.status === 'pending' ? 'ocr' : 'extraction'
  }

  // Default based on document status
  if (status.documentStatus === 'uploaded') return 'idle'
  if (status.documentStatus === 'processing') return 'ocr'

  return 'idle'
}

/**
 * Get human-readable stage label
 */
export function getStageLabel(stage: ProcessingStage): string {
  const labels: Record<ProcessingStage, string> = {
    idle: 'Aguardando processamento',
    uploading: 'Enviando documento',
    ocr: 'Extraindo texto (OCR)',
    extraction: 'Analisando com IA',
    consensus: 'Consolidando dados',
    entity_extraction: 'Identificando entidades',
    complete: 'Processamento concluído',
    failed: 'Falha no processamento',
  }
  return labels[stage]
}

/**
 * Get stage progress percentage
 */
export function getStageProgress(stage: ProcessingStage): number {
  const progress: Record<ProcessingStage, number> = {
    idle: 0,
    uploading: 10,
    ocr: 30,
    extraction: 60,
    consensus: 80,
    entity_extraction: 90,
    complete: 100,
    failed: 0,
  }
  return progress[stage]
}

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: DocumentProcessingState = {
  status: null,
  ocrResults: null,
  geminiInsights: null,
  fullResults: null,
  currentStage: 'idle',
  isLoading: false,
  isSubscribed: false,
  error: null,
  lastUpdated: null,
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useDocumentProcessingStatus({
  documentId,
  fetchOcrResults = true,
  fetchGeminiInsights = true,
  fetchFullResults = true,
  onProcessingStart,
  onOcrComplete,
  onExtractionComplete,
  onProcessingComplete,
  onProcessingFailed,
  onStatusChange,
  enabled = true,
  pollingInterval = 5000,
}: UseDocumentProcessingStatusOptions): UseDocumentProcessingStatusReturn {
  const [state, setState] = useState<DocumentProcessingState>(initialState)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const previousStatusRef = useRef<ProcessingStatus | null>(null)
  const previousStageRef = useRef<ProcessingStage>('idle')

  // Memoize documentId to prevent unnecessary re-subscriptions
  const memoizedDocId = useMemo(() => documentId, [documentId])

  /**
   * Fetch current processing status
   */
  const fetchStatus = useCallback(async () => {
    if (!memoizedDocId) return

    try {
      const { data, error } = await documentProcessingService.getProcessingStatus(
        memoizedDocId
      )

      if (error) {
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
        }))
        return
      }

      if (data) {
        const newStage = determineStage(data)
        const prevStatus = previousStatusRef.current

        setState((prev) => ({
          ...prev,
          status: data,
          currentStage: newStage,
          error: null,
          lastUpdated: new Date().toISOString(),
          isLoading: false,
        }))

        // Trigger callbacks based on status changes
        onStatusChange?.(data)

        // Check for processing start
        if (
          !prevStatus &&
          (data.ocrJob?.status === 'processing' ||
            data.extractionJob?.status === 'processing')
        ) {
          onProcessingStart?.(memoizedDocId)
        }

        // Check for failures
        if (data.hasErrors && data.errorMessages.length > 0) {
          const hadErrorsBefore = prevStatus?.hasErrors
          if (!hadErrorsBefore) {
            onProcessingFailed?.(data.errorMessages)
          }
        }

        // Check for completion
        if (data.isComplete && !prevStatus?.isComplete) {
          // Fetch complete results if requested
          if (fetchFullResults) {
            const { data: results } =
              await documentProcessingService.getDocumentProcessingResults(
                memoizedDocId
              )
            if (results) {
              setState((prev) => ({
                ...prev,
                fullResults: results,
                ocrResults: results.ocrResults,
                geminiInsights: results.geminiInsights,
              }))
              onProcessingComplete?.(results)
            }
          }
        }

        // Check for OCR completion
        if (
          fetchOcrResults &&
          data.ocrJob?.status === 'completed' &&
          prevStatus?.ocrJob?.status !== 'completed'
        ) {
          const { data: ocrResults } =
            await documentProcessingService.getOcrResults(memoizedDocId)
          if (ocrResults) {
            setState((prev) => ({
              ...prev,
              ocrResults,
            }))
            onOcrComplete?.(ocrResults)
          }
        }

        // Check for extraction completion
        if (
          fetchGeminiInsights &&
          data.extractionJob?.status === 'completed' &&
          prevStatus?.extractionJob?.status !== 'completed'
        ) {
          const { data: insights } =
            await documentProcessingService.getGeminiInsights(memoizedDocId)
          if (insights) {
            setState((prev) => ({
              ...prev,
              geminiInsights: insights,
            }))
            onExtractionComplete?.(insights)
          }
        }

        previousStatusRef.current = data
        previousStageRef.current = newStage
      }
    } catch (err) {
      console.error('[useDocumentProcessingStatus] Error fetching status:', err)
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Unknown error'),
        isLoading: false,
      }))
    }
  }, [
    memoizedDocId,
    fetchOcrResults,
    fetchGeminiInsights,
    fetchFullResults,
    onStatusChange,
    onProcessingStart,
    onProcessingFailed,
    onProcessingComplete,
    onOcrComplete,
    onExtractionComplete,
  ])

  /**
   * Manually refresh status
   */
  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    await fetchStatus()
  }, [fetchStatus])

  /**
   * Retry a specific failed job
   */
  const retryJob = useCallback(
    async (jobId: string): Promise<RetryJobResult> => {
      const result = await documentProcessingService.retryProcessingJob(jobId)
      if (result.success) {
        // Refresh status after retry
        await fetchStatus()
      }
      return result
    },
    [fetchStatus]
  )

  /**
   * Retry all failed jobs
   */
  const retryAllFailed = useCallback(async () => {
    const result = await documentProcessingService.retryAllFailedJobs(
      memoizedDocId
    )
    if (result.retriedCount > 0) {
      // Refresh status after retries
      await fetchStatus()
    }
    return result
  }, [memoizedDocId, fetchStatus])

  /**
   * Subscribe to real-time updates
   */
  const subscribe = useCallback(() => {
    if (!memoizedDocId || !enabled || channelRef.current) return

    const channelName = `doc_processing:${memoizedDocId}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `document_id=eq.${memoizedDocId}`,
        },
        () => {
          // Fetch updated status when jobs change
          fetchStatus()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${memoizedDocId}`,
        },
        () => {
          // Fetch updated status when document changes
          fetchStatus()
        }
      )
      .subscribe((status) => {
        const isSubscribed = status === 'SUBSCRIBED'
        setState((prev) => ({ ...prev, isSubscribed }))

        if (isSubscribed) {
          console.log(
            `[useDocumentProcessingStatus] Subscribed to document: ${memoizedDocId}`
          )
          // Fetch initial status after subscribing
          fetchStatus()
        }
      })
  }, [memoizedDocId, enabled, fetchStatus])

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log(
        `[useDocumentProcessingStatus] Unsubscribing from document: ${memoizedDocId}`
      )
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setState((prev) => ({ ...prev, isSubscribed: false }))
    }

    // Clear polling interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [memoizedDocId])

  /**
   * Resubscribe to real-time updates
   */
  const resubscribe = useCallback(() => {
    unsubscribe()
    subscribe()
  }, [unsubscribe, subscribe])

  /**
   * Set up polling as fallback
   */
  const setupPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    if (!enabled || !memoizedDocId) return

    // Only poll if not yet complete
    pollingRef.current = setInterval(() => {
      // Skip polling if processing is complete
      if (previousStatusRef.current?.isComplete) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        return
      }

      fetchStatus()
    }, pollingInterval)
  }, [enabled, memoizedDocId, pollingInterval, fetchStatus])

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    if (enabled && memoizedDocId) {
      setState((prev) => ({ ...prev, isLoading: true }))
      subscribe()
      setupPolling()
    }

    return () => {
      unsubscribe()
    }
  }, [enabled, memoizedDocId, subscribe, setupPolling, unsubscribe])

  // Reset state when document changes
  useEffect(() => {
    previousStatusRef.current = null
    previousStageRef.current = 'idle'
    setState(initialState)
  }, [memoizedDocId])

  return {
    state,
    refresh,
    retryJob,
    retryAllFailed,
    unsubscribe,
    resubscribe,
  }
}

// -----------------------------------------------------------------------------
// Utility Hooks
// -----------------------------------------------------------------------------

/**
 * Hook to get just the current processing stage
 */
export function useProcessingStage(documentId: string, enabled = true): {
  stage: ProcessingStage
  label: string
  progress: number
  isLoading: boolean
} {
  const { state } = useDocumentProcessingStatus({
    documentId,
    fetchOcrResults: false,
    fetchGeminiInsights: false,
    fetchFullResults: false,
    enabled,
  })

  return {
    stage: state.currentStage,
    label: getStageLabel(state.currentStage),
    progress: state.status?.overallProgress ?? getStageProgress(state.currentStage),
    isLoading: state.isLoading,
  }
}

/**
 * Hook to check if document processing is complete
 */
export function useIsProcessingComplete(
  documentId: string,
  enabled = true
): {
  isComplete: boolean
  hasErrors: boolean
  isLoading: boolean
} {
  const { state } = useDocumentProcessingStatus({
    documentId,
    fetchOcrResults: false,
    fetchGeminiInsights: false,
    fetchFullResults: false,
    enabled,
  })

  return {
    isComplete: state.status?.isComplete ?? false,
    hasErrors: state.status?.hasErrors ?? false,
    isLoading: state.isLoading,
  }
}

export default useDocumentProcessingStatus
