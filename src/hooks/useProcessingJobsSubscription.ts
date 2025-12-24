/**
 * Custom hook for subscribing to real-time processing job status updates.
 * Uses Supabase Realtime to listen for changes to processing_jobs in a specific case.
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ProcessingJob, JobStatus, JobType } from '../types'

export interface ProcessingJobUpdate {
  jobId: string
  documentId: string | null
  jobType: JobType
  previousStatus: JobStatus | null
  newStatus: JobStatus
  job: Partial<ProcessingJob>
  timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  progress?: number // Calculated based on status
  errorMessage?: string | null
}

export interface ProcessingJobsState {
  /** All active jobs for the case */
  jobs: Map<string, ProcessingJob>
  /** Jobs by document ID */
  jobsByDocument: Map<string, ProcessingJob[]>
  /** Total number of jobs */
  totalJobs: number
  /** Number of pending jobs */
  pendingJobs: number
  /** Number of processing jobs */
  processingJobs: number
  /** Number of completed jobs */
  completedJobs: number
  /** Number of failed jobs */
  failedJobs: number
  /** Overall progress (0-100) */
  overallProgress: number
  /** Whether all jobs are complete */
  isComplete: boolean
  /** Whether any jobs are currently processing */
  isProcessing: boolean
}

export interface UseProcessingJobsSubscriptionOptions {
  /** Case ID to subscribe to */
  caseId: string
  /** Optional document ID to filter jobs */
  documentId?: string
  /** Callback when a job is created */
  onJobCreated?: (job: ProcessingJob) => void
  /** Callback when a job status changes */
  onJobStatusChange?: (update: ProcessingJobUpdate) => void
  /** Callback when a job completes successfully */
  onJobComplete?: (job: ProcessingJob) => void
  /** Callback when a job fails */
  onJobFailed?: (job: ProcessingJob) => void
  /** Callback when all jobs are complete */
  onAllJobsComplete?: (state: ProcessingJobsState) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
}

export interface UseProcessingJobsSubscriptionReturn {
  /** Current state of processing jobs */
  state: ProcessingJobsState
  /** Whether the subscription is active */
  isSubscribed: boolean
  /** Manually unsubscribe */
  unsubscribe: () => void
  /** Manually resubscribe */
  resubscribe: () => void
  /** Refresh jobs from database */
  refreshJobs: () => Promise<void>
}

const initialState: ProcessingJobsState = {
  jobs: new Map(),
  jobsByDocument: new Map(),
  totalJobs: 0,
  pendingJobs: 0,
  processingJobs: 0,
  completedJobs: 0,
  failedJobs: 0,
  overallProgress: 0,
  isComplete: false,
  isProcessing: false,
}

function calculateProgress(status: JobStatus): number {
  switch (status) {
    case 'pending':
      return 0
    case 'processing':
      return 50
    case 'completed':
      return 100
    case 'failed':
      return 100
    case 'retrying':
      return 25
    default:
      return 0
  }
}

function calculateState(jobs: Map<string, ProcessingJob>): ProcessingJobsState {
  const jobsArray = Array.from(jobs.values())
  const jobsByDocument = new Map<string, ProcessingJob[]>()

  let pendingJobs = 0
  let processingJobs = 0
  let completedJobs = 0
  let failedJobs = 0

  jobsArray.forEach((job) => {
    // Count by status
    switch (job.status) {
      case 'pending':
        pendingJobs++
        break
      case 'processing':
      case 'retrying':
        processingJobs++
        break
      case 'completed':
        completedJobs++
        break
      case 'failed':
        failedJobs++
        break
    }

    // Group by document
    if (job.document_id) {
      const docJobs = jobsByDocument.get(job.document_id) || []
      docJobs.push(job)
      jobsByDocument.set(job.document_id, docJobs)
    }
  })

  const totalJobs = jobsArray.length
  const finishedJobs = completedJobs + failedJobs
  const overallProgress = totalJobs > 0 ? Math.round((finishedJobs / totalJobs) * 100) : 0
  const isComplete = totalJobs > 0 && finishedJobs === totalJobs
  const isProcessing = processingJobs > 0 || (pendingJobs > 0 && !isComplete)

  return {
    jobs,
    jobsByDocument,
    totalJobs,
    pendingJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    overallProgress,
    isComplete,
    isProcessing,
  }
}

export function useProcessingJobsSubscription({
  caseId,
  documentId,
  onJobCreated,
  onJobStatusChange,
  onJobComplete,
  onJobFailed,
  onAllJobsComplete,
  enabled = true,
}: UseProcessingJobsSubscriptionOptions): UseProcessingJobsSubscriptionReturn {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const [state, setState] = useState<ProcessingJobsState>(initialState)
  const prevCompleteRef = useRef(false)

  const updateState = useCallback((updater: (jobs: Map<string, ProcessingJob>) => Map<string, ProcessingJob>) => {
    setState((prevState) => {
      const newJobs = updater(new Map(prevState.jobs))
      const newState = calculateState(newJobs)

      // Check if all jobs just completed
      if (newState.isComplete && !prevCompleteRef.current && newState.totalJobs > 0) {
        onAllJobsComplete?.(newState)
      }
      prevCompleteRef.current = newState.isComplete

      return newState
    })
  }, [onAllJobsComplete])

  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<ProcessingJob>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      // Filter by document ID if specified
      if (documentId) {
        const recordDocId = (newRecord as ProcessingJob)?.document_id || (oldRecord as ProcessingJob)?.document_id
        if (recordDocId !== documentId) return
      }

      if (eventType === 'INSERT' && newRecord) {
        const job = newRecord as ProcessingJob
        onJobCreated?.(job)

        updateState((jobs) => {
          jobs.set(job.id, job)
          return jobs
        })

        const update: ProcessingJobUpdate = {
          jobId: job.id,
          documentId: job.document_id,
          jobType: job.job_type,
          previousStatus: null,
          newStatus: job.status,
          job,
          timestamp: new Date().toISOString(),
          eventType: 'INSERT',
          progress: calculateProgress(job.status),
        }
        onJobStatusChange?.(update)
      }

      if (eventType === 'UPDATE' && newRecord) {
        const job = newRecord as ProcessingJob
        const oldJob = oldRecord as Partial<ProcessingJob> | null

        updateState((jobs) => {
          jobs.set(job.id, job)
          return jobs
        })

        const update: ProcessingJobUpdate = {
          jobId: job.id,
          documentId: job.document_id,
          jobType: job.job_type,
          previousStatus: (oldJob?.status as JobStatus) || null,
          newStatus: job.status,
          job,
          timestamp: new Date().toISOString(),
          eventType: 'UPDATE',
          progress: calculateProgress(job.status),
          errorMessage: job.error_message,
        }

        // Only trigger status change callback if status actually changed
        if (oldJob?.status !== job.status) {
          onJobStatusChange?.(update)

          if (job.status === 'completed') {
            onJobComplete?.(job)
          } else if (job.status === 'failed') {
            onJobFailed?.(job)
          }
        }
      }

      if (eventType === 'DELETE' && oldRecord) {
        const oldJob = oldRecord as ProcessingJob

        updateState((jobs) => {
          jobs.delete(oldJob.id)
          return jobs
        })

        const update: ProcessingJobUpdate = {
          jobId: oldJob.id,
          documentId: oldJob.document_id,
          jobType: oldJob.job_type,
          previousStatus: oldJob.status,
          newStatus: oldJob.status,
          job: oldJob,
          timestamp: new Date().toISOString(),
          eventType: 'DELETE',
          progress: 0,
        }
        onJobStatusChange?.(update)
      }
    },
    [documentId, onJobCreated, onJobStatusChange, onJobComplete, onJobFailed, updateState]
  )

  const refreshJobs = useCallback(async () => {
    if (!caseId) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('processing_jobs')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })

      if (documentId) {
        query = query.eq('document_id', documentId)
      }

      const { data, error } = await query as { data: ProcessingJob[] | null; error: unknown }

      if (error) {
        console.error('[ProcessingJobs] Error fetching jobs:', error)
        return
      }

      if (data) {
        const jobsMap = new Map<string, ProcessingJob>()
        data.forEach((job: ProcessingJob) => {
          jobsMap.set(job.id, job as ProcessingJob)
        })

        setState(calculateState(jobsMap))
        console.log(`[ProcessingJobs] Loaded ${data.length} jobs for case: ${caseId}`)
      }
    } catch (err) {
      console.error('[ProcessingJobs] Error refreshing jobs:', err)
    }
  }, [caseId, documentId])

  const subscribe = useCallback(() => {
    if (!caseId || !enabled || channelRef.current) return

    const channelName = documentId
      ? `processing_jobs:doc:${documentId}`
      : `processing_jobs:case:${caseId}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `case_id=eq.${caseId}`,
        },
        handlePayload
      )
      .subscribe((status) => {
        isSubscribedRef.current = status === 'SUBSCRIBED'
        if (status === 'SUBSCRIBED') {
          console.log(`[ProcessingJobs] Subscribed to case: ${caseId}`)
          // Load initial jobs after subscribing
          refreshJobs()
        }
      })
  }, [caseId, documentId, enabled, handlePayload, refreshJobs])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log(`[ProcessingJobs] Unsubscribing from case: ${caseId}`)
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isSubscribedRef.current = false
    }
  }, [caseId])

  const resubscribe = useCallback(() => {
    unsubscribe()
    subscribe()
  }, [unsubscribe, subscribe])

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return {
    state,
    isSubscribed: isSubscribedRef.current,
    unsubscribe,
    resubscribe,
    refreshJobs,
  }
}

export default useProcessingJobsSubscription
