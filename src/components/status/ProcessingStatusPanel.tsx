/**
 * ProcessingStatusPanel Component
 *
 * Displays overall processing status for a case, including:
 * - Total progress
 * - Individual document processing status
 * - Job queue information
 * - Real-time updates
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentIcon,
  CpuChipIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import type { ProcessingJobsState } from '../../hooks/useProcessingJobsSubscription'
import type { Document, ProcessingJob, JobType } from '../../types'

export interface ProcessingStatusPanelProps {
  /** Processing jobs state from useProcessingJobsSubscription */
  jobsState: ProcessingJobsState
  /** Documents being processed */
  documents?: Document[]
  /** Whether to show detailed job breakdown */
  showDetails?: boolean
  /** Whether the panel is collapsed */
  collapsed?: boolean
  /** Callback when collapse state changes */
  onToggleCollapse?: () => void
  /** Custom class name */
  className?: string
}

interface JobTypeInfo {
  label: string
  description: string
  icon: typeof CpuChipIcon
}

const jobTypeInfos: Record<JobType, JobTypeInfo> = {
  ocr: {
    label: 'OCR',
    description: 'Text extraction',
    icon: DocumentIcon,
  },
  extraction: {
    label: 'Extraction',
    description: 'Data extraction',
    icon: CpuChipIcon,
  },
  consensus: {
    label: 'Consensus',
    description: 'Data validation',
    icon: CheckCircleIcon,
  },
  entity_resolution: {
    label: 'Entity Resolution',
    description: 'Entity matching',
    icon: QueueListIcon,
  },
  entity_extraction: {
    label: 'Entity Extraction',
    description: 'AI entity extraction',
    icon: CpuChipIcon,
  },
  draft: {
    label: 'Draft',
    description: 'Document generation',
    icon: DocumentIcon,
  },
}

function getProgressColor(progress: number): string {
  if (progress === 100) return 'bg-green-500'
  if (progress >= 75) return 'bg-blue-500'
  if (progress >= 50) return 'bg-yellow-500'
  if (progress >= 25) return 'bg-orange-500'
  return 'bg-gray-400'
}

function getStatusIcon(status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying') {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />
    case 'failed':
      return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
    case 'processing':
    case 'retrying':
      return <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
    default:
      return <ClockIcon className="w-4 h-4 text-gray-400" />
  }
}

export function ProcessingStatusPanel({
  jobsState,
  documents = [],
  showDetails = true,
  collapsed = false,
  onToggleCollapse,
  className = '',
}: ProcessingStatusPanelProps) {
  const {
    totalJobs,
    pendingJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    overallProgress,
    isComplete,
    isProcessing,
    jobs,
    jobsByDocument,
  } = jobsState

  // Group jobs by type for summary
  const jobsByType = useMemo(() => {
    const grouped = new Map<JobType, ProcessingJob[]>()
    jobs.forEach((job) => {
      const typeJobs = grouped.get(job.job_type) || []
      typeJobs.push(job)
      grouped.set(job.job_type, typeJobs)
    })
    return grouped
  }, [jobs])

  // Calculate per-document progress
  const documentProgress = useMemo(() => {
    const progress = new Map<string, { total: number; completed: number; failed: number }>()

    jobsByDocument.forEach((docJobs, docId) => {
      const completed = docJobs.filter(j => j.status === 'completed').length
      const failed = docJobs.filter(j => j.status === 'failed').length
      progress.set(docId, {
        total: docJobs.length,
        completed,
        failed,
      })
    })

    return progress
  }, [jobsByDocument])

  // If no jobs, show empty state
  if (totalJobs === 0) {
    return (
      <div className={`card p-4 ${className}`}>
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <QueueListIcon className="w-5 h-5" />
          <span className="text-sm">No processing jobs</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      layout
      className={`card overflow-hidden ${className}`}
    >
      {/* Header with overall progress */}
      <div
        className={`p-4 border-b border-gray-200 dark:border-gray-700 ${onToggleCollapse ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
            ) : isComplete ? (
              failedJobs > 0 ? (
                <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              )
            ) : (
              <ClockIcon className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="font-medium text-gray-900 dark:text-white">
              Processing Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {overallProgress}%
            </span>
            {onToggleCollapse && (
              <motion.button
                animate={{ rotate: collapsed ? 0 : 180 }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${getProgressColor(overallProgress)}`}
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            {pendingJobs} pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {processingJobs} processing
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {completedJobs} completed
          </span>
          {failedJobs > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {failedJobs} failed
            </span>
          )}
        </div>
      </div>

      {/* Detailed view */}
      <AnimatePresence>
        {showDetails && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Job type breakdown */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Processing Steps
              </h4>
              <div className="space-y-2">
                {Array.from(jobsByType.entries()).map(([type, typeJobs]) => {
                  const info = jobTypeInfos[type]
                  const completed = typeJobs.filter(j => j.status === 'completed').length
                  const failed = typeJobs.filter(j => j.status === 'failed').length
                  const processing = typeJobs.filter(j => j.status === 'processing' || j.status === 'retrying').length
                  const typeProgress = Math.round((completed / typeJobs.length) * 100)

                  return (
                    <div key={type} className="flex items-center gap-3">
                      <info.icon className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {info.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {completed}/{typeJobs.length}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              failed > 0 ? 'bg-red-500' : processing > 0 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${typeProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Document-level progress */}
            {documents.length > 0 && documentProgress.size > 0 && (
              <div className="p-4 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Documents
                </h4>
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const progress = documentProgress.get(doc.id)
                    if (!progress) return null

                    const docProgress = progress.total > 0
                      ? Math.round((progress.completed / progress.total) * 100)
                      : 0
                    const hasFailed = progress.failed > 0

                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <DocumentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {doc.original_name}
                          </p>
                          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                            <motion.div
                              className={`h-full rounded-full ${hasFailed ? 'bg-red-500' : 'bg-green-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${docProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {progress.completed}/{progress.total}
                        </span>
                        {getStatusIcon(
                          hasFailed ? 'failed' :
                          docProgress === 100 ? 'completed' :
                          docProgress > 0 ? 'processing' : 'pending'
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ProcessingStatusPanel
