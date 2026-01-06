/**
 * NotificationContext - Provides global realtime notification system
 * Subscribes to document and processing job events and shows toast notifications
 */

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { showToast } from '@/lib/toast'
import { useDocumentStatusSubscription } from '@/hooks/useDocumentStatusSubscription'
import { useProcessingJobsSubscription } from '@/hooks/useProcessingJobsSubscription'
import type { DocumentStatusUpdate } from '@/hooks/useDocumentStatusSubscription'
import type { ProcessingJobUpdate } from '@/hooks/useProcessingJobsSubscription'

interface NotificationContextValue {
  /** Whether notifications are enabled globally */
  enabled: boolean
  /** Enable notifications */
  enable: () => void
  /** Disable notifications */
  disable: () => void
  /** Whether notifications are muted for current page */
  isMutedForCurrentPage: boolean
  /** Mute notifications for current page */
  muteCurrentPage: () => void
  /** Unmute notifications for current page */
  unmuteCurrentPage: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps {
  children: React.ReactNode
  /** Case ID to subscribe to (if provided) */
  caseId?: string
  /** Whether to enable notifications by default */
  defaultEnabled?: boolean
}

/**
 * Debounce notifications to avoid spam
 */
const useNotificationDebounce = (delay = 1000) => {
  const [lastNotificationTime, setLastNotificationTime] = useState<Record<string, number>>({})

  const shouldShowNotification = useCallback(
    (key: string): boolean => {
      const now = Date.now()
      const lastTime = lastNotificationTime[key] || 0

      if (now - lastTime < delay) {
        return false
      }

      setLastNotificationTime((prev) => ({ ...prev, [key]: now }))
      return true
    },
    [lastNotificationTime, delay]
  )

  return shouldShowNotification
}

export function NotificationProvider({
  children,
  caseId,
  defaultEnabled = true,
}: NotificationProviderProps) {
  const [enabled, setEnabled] = useState(defaultEnabled)
  const [mutedPages, setMutedPages] = useState<Set<string>>(new Set())
  const location = useLocation()
  const shouldShowNotification = useNotificationDebounce(2000)

  const isMutedForCurrentPage = mutedPages.has(location.pathname)

  // Document status subscription callbacks
  const handleDocumentInsert = useCallback(
    (update: DocumentStatusUpdate) => {
      if (!enabled || isMutedForCurrentPage) return

      // Don't spam on insert - user likely knows they uploaded a document
      if (!shouldShowNotification(`doc-insert-${update.documentId}`)) return

      const docName = (update.document as any).original_name || 'Documento'
      showToast.info('Documento enviado', `${docName} foi enviado com sucesso`)
    },
    [enabled, isMutedForCurrentPage, shouldShowNotification]
  )

  const handleDocumentStatusChange = useCallback(
    (update: DocumentStatusUpdate) => {
      if (!enabled || isMutedForCurrentPage) return
      if (!shouldShowNotification(`doc-status-${update.documentId}`)) return

      const docName = (update.document as any).original_name || 'Documento'

      // Only show notifications for significant status changes
      if (update.newStatus === 'processed') {
        showToast.success('Documento processado', `${docName} foi processado com sucesso`)
      } else if (update.newStatus === 'failed') {
        showToast.error('Erro no processamento', `Falha ao processar ${docName}`)
      } else if (update.newStatus === 'processing') {
        showToast.info('Processando documento', `${docName} está sendo processado`)
      }
    },
    [enabled, isMutedForCurrentPage, shouldShowNotification]
  )

  // Processing job subscription callbacks
  const handleJobComplete = useCallback(
    (update: ProcessingJobUpdate) => {
      if (!enabled || isMutedForCurrentPage) return
      if (!shouldShowNotification(`job-complete-${update.jobId}`)) return

      const jobTypeLabels: Record<string, string> = {
        ocr: 'OCR',
        entity_extraction: 'Extração de entidades',
        type_detection: 'Detecção de tipo',
        consensus: 'Consenso',
      }

      const jobLabel = jobTypeLabels[update.jobType] || update.jobType
      showToast.success('Processamento concluído', `${jobLabel} finalizado com sucesso`)
    },
    [enabled, isMutedForCurrentPage, shouldShowNotification]
  )

  const handleJobFailed = useCallback(
    (update: ProcessingJobUpdate) => {
      if (!enabled || isMutedForCurrentPage) return
      if (!shouldShowNotification(`job-failed-${update.jobId}`)) return

      const jobTypeLabels: Record<string, string> = {
        ocr: 'OCR',
        entity_extraction: 'Extração de entidades',
        type_detection: 'Detecção de tipo',
        consensus: 'Consenso',
      }

      const jobLabel = jobTypeLabels[update.jobType] || update.jobType
      const errorMsg = update.errorMessage || 'Erro desconhecido'
      showToast.error('Erro no processamento', `${jobLabel} falhou: ${errorMsg}`)
    },
    [enabled, isMutedForCurrentPage, shouldShowNotification]
  )

  const handleAllJobsComplete = useCallback(() => {
    if (!enabled || isMutedForCurrentPage) return
    if (!shouldShowNotification('all-jobs-complete')) return

    showToast.success(
      'Processamento finalizado',
      'Todos os documentos foram processados com sucesso'
    )
  }, [enabled, isMutedForCurrentPage, shouldShowNotification])

  // Subscribe to document status changes
  useDocumentStatusSubscription({
    caseId: caseId || '',
    enabled: !!caseId && enabled,
    onDocumentInsert: (doc) =>
      handleDocumentInsert({
        documentId: doc.id,
        previousStatus: null,
        newStatus: doc.status,
        document: doc,
        timestamp: new Date().toISOString(),
        eventType: 'INSERT',
      }),
    onStatusChange: handleDocumentStatusChange,
  })

  // Subscribe to processing job updates
  const { state: jobsState } = useProcessingJobsSubscription({
    caseId: caseId || '',
    enabled: !!caseId && enabled,
    onJobStatusChange: (update) => {
      if (update.newStatus === 'completed') {
        handleJobComplete(update)
      } else if (update.newStatus === 'failed') {
        handleJobFailed(update)
      }
    },
    onAllJobsComplete: handleAllJobsComplete,
  })

  // Log jobs state for debugging
  useEffect(() => {
    if (jobsState.totalJobs > 0) {
      console.log('[NotificationProvider] Jobs state:', {
        total: jobsState.totalJobs,
        pending: jobsState.pendingJobs,
        processing: jobsState.processingJobs,
        completed: jobsState.completedJobs,
        failed: jobsState.failedJobs,
        progress: jobsState.overallProgress,
      })
    }
  }, [jobsState])

  const value: NotificationContextValue = {
    enabled,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    isMutedForCurrentPage,
    muteCurrentPage: () => setMutedPages((prev) => new Set(prev).add(location.pathname)),
    unmuteCurrentPage: () =>
      setMutedPages((prev) => {
        const next = new Set(prev)
        next.delete(location.pathname)
        return next
      }),
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
