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
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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

function getStatusIcon(status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying') {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-4 h-4 text-green-500 dark:text-green-400" />
    case 'failed':
      return <ExclamationCircleIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
    case 'processing':
    case 'retrying':
      return <ArrowPathIcon className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
    default:
      return <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
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
      <Card className={cn('glass-card', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <QueueListIcon className="w-5 h-5" />
            <span className="text-sm">No processing jobs</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div layout className={cn(className)}>
      <Card className="glass-card overflow-hidden">
        {/* Header with overall progress */}
        <div
          className={cn(
            'p-4 border-b border-gray-200/50 dark:border-gray-700/50',
            onToggleCollapse && 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors'
          )}
          onClick={onToggleCollapse}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <ArrowPathIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />
              ) : isComplete ? (
                failedJobs > 0 ? (
                  <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                )
              ) : (
                <ClockIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
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
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <Progress
            value={overallProgress}
            className="h-2 bg-gray-200 dark:bg-gray-700"
          />

          {/* Quick stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
              {pendingJobs} pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse-subtle" />
              {processingJobs} processing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" />
              {completedJobs} completed
            </span>
            {failedJobs > 0 && (
              <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full" />
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
              <CardContent className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Processing Steps
                </h4>
                <div className="space-y-3">
                  {Array.from(jobsByType.entries()).map(([type, typeJobs]) => {
                    const info = jobTypeInfos[type]
                    const completed = typeJobs.filter(j => j.status === 'completed').length
                    const failed = typeJobs.filter(j => j.status === 'failed').length
                    const typeProgress = Math.round((completed / typeJobs.length) * 100)
                    const processing = typeJobs.filter(j => j.status === 'processing' || j.status === 'retrying').length

                    return (
                      <div key={type} className="flex items-center gap-3">
                        <info.icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {info.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {completed}/{typeJobs.length}
                            </span>
                          </div>
                          <Progress
                            value={typeProgress}
                            className={cn(
                              'h-1.5',
                              failed > 0 ? 'bg-red-500 dark:bg-red-400' :
                              processing > 0 ? 'bg-blue-500 dark:bg-blue-400' :
                              'bg-green-500 dark:bg-green-400'
                            )}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>

              {/* Document-level progress */}
              {documents.length > 0 && documentProgress.size > 0 && (
                <CardContent className="p-4 max-h-48 overflow-y-auto">
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
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30"
                        >
                          <DocumentIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {doc.original_name}
                            </p>
                            <Progress
                              value={docProgress}
                              className={cn(
                                'h-1 mt-1',
                                hasFailed ? 'bg-red-500 dark:bg-red-400' : 'bg-green-500 dark:bg-green-400'
                              )}
                            />
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
                </CardContent>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

export default ProcessingStatusPanel
