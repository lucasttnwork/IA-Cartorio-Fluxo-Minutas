/**
 * DocumentStatusBadge Component
 *
 * Displays the current processing status of a document with animated transitions
 * and real-time updates. Shows appropriate icons and colors based on status.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'
import type { DocumentStatus, JobStatus } from '../../types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface DocumentStatusBadgeProps {
  /** Current document status */
  status: DocumentStatus
  /** Optional job status for more granular display */
  jobStatus?: JobStatus
  /** Optional job progress (0-100) */
  progress?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the label text */
  showLabel?: boolean
  /** Whether to animate status changes */
  animate?: boolean
  /** Custom class name */
  className?: string
  /** Callback when badge is clicked */
  onClick?: () => void
}

interface StatusConfig {
  label: string
  shortLabel: string
  icon: typeof CheckCircleIcon
  className: string
  animate?: boolean
}

const statusConfigs: Record<DocumentStatus, StatusConfig> = {
  uploaded: {
    label: 'Uploaded',
    shortLabel: 'Uploaded',
    icon: ClockIcon,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50',
  },
  processing: {
    label: 'Processing',
    shortLabel: 'Processing',
    icon: ArrowPathIcon,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-800/50',
    animate: true,
  },
  processed: {
    label: 'Processed',
    shortLabel: 'Done',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200/50 dark:border-green-800/50',
  },
  needs_review: {
    label: 'Needs Review',
    shortLabel: 'Review',
    icon: EyeIcon,
    className: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50',
  },
  approved: {
    label: 'Approved',
    shortLabel: 'Approved',
    icon: DocumentCheckIcon,
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50',
  },
  failed: {
    label: 'Failed',
    shortLabel: 'Failed',
    icon: ExclamationCircleIcon,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200/50 dark:border-red-800/50',
  },
}

const sizeClasses = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-5 h-5',
  },
}

export function DocumentStatusBadge({
  status,
  jobStatus,
  progress,
  size = 'md',
  showLabel = true,
  animate = true,
  className = '',
  onClick,
}: DocumentStatusBadgeProps) {
  const [prevStatus, setPrevStatus] = useState(status)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const config = statusConfigs[status]
  const sizeConfig = sizeClasses[size]
  const Icon = config.icon

  // Handle status transitions
  useEffect(() => {
    if (status !== prevStatus) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setPrevStatus(status)
        setIsTransitioning(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [status, prevStatus])

  // Determine the label based on job status if processing
  const displayLabel = (() => {
    if (status === 'processing' && jobStatus) {
      switch (jobStatus) {
        case 'pending':
          return 'Queued'
        case 'processing':
          return progress !== undefined ? `${progress}%` : 'Processing'
        case 'retrying':
          return 'Retrying'
        default:
          return config.label
      }
    }
    return showLabel ? config.label : config.shortLabel
  })()

  const isClickable = !!onClick

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={animate ? { opacity: 0, scale: 0.9 } : false}
        animate={{ opacity: 1, scale: 1 }}
        exit={animate ? { opacity: 0, scale: 0.9 } : undefined}
        transition={{ duration: 0.2 }}
        className="relative inline-flex"
      >
        <Badge
          className={cn(
            'inline-flex items-center rounded-full font-medium relative',
            config.className,
            sizeConfig.badge,
            isClickable && 'cursor-pointer hover:opacity-80 transition-opacity',
            isTransitioning && 'ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-500',
            className
          )}
          onClick={onClick}
          role={isClickable ? 'button' : 'status'}
          aria-label={`Document status: ${config.label}`}
          tabIndex={isClickable ? 0 : undefined}
        >
          <Icon
            className={cn(
              sizeConfig.icon,
              config.animate && 'animate-spin'
            )}
          />
          {showLabel && (
            <span className="truncate">{displayLabel}</span>
          )}

          {/* Progress indicator for processing status */}
          {status === 'processing' && progress !== undefined && progress > 0 && progress < 100 && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-yellow-600 dark:bg-yellow-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          )}
        </Badge>
      </motion.div>
    </AnimatePresence>
  )
}

export default DocumentStatusBadge
