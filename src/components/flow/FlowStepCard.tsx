/**
 * FlowStepCard Component
 *
 * A container card for individual steps in the purchase/sale flow.
 * Provides visual feedback for step status, loading states, and errors.
 *
 * Features:
 * - Status-based visual styling (pending, active, completed, error)
 * - Header with step icon, title, and status badge
 * - Loading state with spinner animation
 * - Error display with optional retry action
 * - Smooth enter/exit animations
 * - Navigation buttons (next/previous/skip)
 */

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import {
  FolderPlusIcon,
  DocumentArrowUpIcon,
  CpuChipIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { FlowStep, FlowStepStatus } from '@/stores/flowStore'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FlowStepCardProps {
  /** The step identifier */
  step: FlowStep
  /** Step title displayed in the header */
  title: string
  /** Step description displayed below the title */
  description?: string
  /** Current status of the step */
  status: FlowStepStatus
  /** Whether this step is currently active */
  isActive: boolean
  /** The content to render inside the card */
  children: ReactNode
  /** Loading state indicator */
  isLoading?: boolean
  /** Loading message to display */
  loadingMessage?: string
  /** Error message to display */
  error?: string | null
  /** Callback when retry button is clicked */
  onRetry?: () => void
  /** Callback when next button is clicked */
  onNext?: () => void
  /** Callback when previous button is clicked */
  onPrevious?: () => void
  /** Callback when skip button is clicked */
  onSkip?: () => void
  /** Whether the next button is disabled */
  nextDisabled?: boolean
  /** Whether the previous button is disabled */
  previousDisabled?: boolean
  /** Whether to show navigation buttons */
  showNavigation?: boolean
  /** Whether to show the skip button */
  showSkip?: boolean
  /** Custom label for next button */
  nextLabel?: string
  /** Custom label for previous button */
  previousLabel?: string
  /** Optional footer content (rendered before navigation) */
  footer?: ReactNode
  /** Custom class name */
  className?: string
  /** Custom content class name */
  contentClassName?: string
}

// -----------------------------------------------------------------------------
// Step Icons Mapping
// -----------------------------------------------------------------------------

const stepIcons: Record<FlowStep, typeof FolderPlusIcon> = {
  case_creation: FolderPlusIcon,
  document_upload: DocumentArrowUpIcon,
  entity_extraction: CpuChipIcon,
  canvas_review: PresentationChartLineIcon,
  draft_generation: DocumentTextIcon,
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getStatusStyles(status: FlowStepStatus, isActive: boolean) {
  if (status === 'completed') {
    return {
      border: 'border-green-200 dark:border-green-800',
      header: 'bg-green-50/50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      badgeText: 'Concluído',
    }
  }

  if (status === 'error') {
    return {
      border: 'border-red-200 dark:border-red-800',
      header: 'bg-red-50/50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      badgeText: 'Erro',
    }
  }

  if (isActive || status === 'in_progress') {
    return {
      border: 'border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20 dark:ring-blue-400/20',
      header: 'bg-blue-50/50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      badgeText: 'Em Progresso',
    }
  }

  // Pending
  return {
    border: 'border-gray-200 dark:border-gray-700',
    header: 'bg-gray-50/50 dark:bg-gray-800/50',
    icon: 'text-gray-400 dark:text-gray-500',
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    badgeText: 'Pendente',
  }
}

function getStatusIcon(status: FlowStepStatus, isActive: boolean) {
  if (status === 'completed') {
    return <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
  }
  if (status === 'error') {
    return <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
  }
  if (isActive || status === 'in_progress') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <ArrowPathIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
      </motion.div>
    )
  }
  return null
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface LoadingOverlayProps {
  message?: string
}

function LoadingOverlay({ message = 'Processando...' }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl"
    >
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <ArrowPathIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </motion.div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>
    </motion.div>
  )
}

interface StepNavigationProps {
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  nextDisabled?: boolean
  previousDisabled?: boolean
  showSkip?: boolean
  nextLabel?: string
  previousLabel?: string
}

function StepNavigation({
  onNext,
  onPrevious,
  onSkip,
  nextDisabled = false,
  previousDisabled = false,
  showSkip = false,
  nextLabel = 'Próximo',
  previousLabel = 'Voltar',
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
      <div>
        {onPrevious && (
          <Button
            variant="ghost"
            onClick={onPrevious}
            disabled={previousDisabled}
            className="gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {previousLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Pular
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        )}

        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="gap-2"
          >
            {nextLabel}
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function FlowStepCard({
  step,
  title,
  description,
  status,
  isActive,
  children,
  isLoading = false,
  loadingMessage,
  error,
  onRetry,
  onNext,
  onPrevious,
  onSkip,
  nextDisabled = false,
  previousDisabled = false,
  showNavigation = true,
  showSkip = false,
  nextLabel,
  previousLabel,
  footer,
  className,
  contentClassName,
}: FlowStepCardProps) {
  const styles = getStatusStyles(status, isActive)
  const Icon = stepIcons[step]
  const StatusIcon = getStatusIcon(status, isActive)

  // Animation variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  }

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: 0.1, duration: 0.2 },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          styles.border,
          className
        )}
      >
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && <LoadingOverlay message={loadingMessage} />}
        </AnimatePresence>

        {/* Header */}
        <CardHeader
          className={cn(
            'flex flex-row items-start gap-4 space-y-0 pb-4',
            styles.header
          )}
        >
          {/* Step Icon */}
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-lg',
              isActive || status === 'in_progress'
                ? 'bg-blue-100 dark:bg-blue-900/50'
                : status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/50'
                  : status === 'error'
                    ? 'bg-red-100 dark:bg-red-900/50'
                    : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Icon className={cn('w-6 h-6', styles.icon)} />
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </CardTitle>
              {StatusIcon}
            </div>
            {description && (
              <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </CardDescription>
            )}
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              'flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full',
              styles.badge
            )}
          >
            {styles.badgeText}
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className={cn('pt-0', contentClassName)}>
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <Alert variant="destructive">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{error}</span>
                      {onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRetry}
                          className="ml-4"
                        >
                          <ArrowPathIcon className="w-4 h-4 mr-2" />
                          Tentar Novamente
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            {children}

            {/* Footer */}
            {footer && (
              <div className="mt-4">
                {footer}
              </div>
            )}

            {/* Navigation */}
            {showNavigation && (onNext || onPrevious) && (
              <StepNavigation
                onNext={onNext}
                onPrevious={onPrevious}
                onSkip={onSkip}
                nextDisabled={nextDisabled}
                previousDisabled={previousDisabled}
                showSkip={showSkip}
                nextLabel={nextLabel}
                previousLabel={previousLabel}
              />
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// -----------------------------------------------------------------------------
// Compact Variant
// -----------------------------------------------------------------------------

export interface FlowStepCardCompactProps {
  /** The step identifier */
  step: FlowStep
  /** Step title */
  title: string
  /** Current status */
  status: FlowStepStatus
  /** Whether this step is active */
  isActive: boolean
  /** Callback when card is clicked */
  onClick?: () => void
  /** Whether the card is clickable */
  disabled?: boolean
  /** Custom class name */
  className?: string
}

/**
 * A compact version of FlowStepCard for sidebar/summary views
 */
export function FlowStepCardCompact({
  step,
  title,
  status,
  isActive,
  onClick,
  disabled = false,
  className,
}: FlowStepCardCompactProps) {
  const styles = getStatusStyles(status, isActive)
  const Icon = stepIcons[step]

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
        styles.border,
        !disabled && onClick && 'cursor-pointer hover:shadow-md',
        disabled && 'opacity-50 cursor-not-allowed',
        isActive && 'ring-2 ring-blue-500/20 dark:ring-blue-400/20',
        className
      )}
      whileHover={!disabled && onClick ? { scale: 1.01 } : undefined}
      whileTap={!disabled && onClick ? { scale: 0.99 } : undefined}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 p-1.5 rounded-md',
          isActive || status === 'in_progress'
            ? 'bg-blue-100 dark:bg-blue-900/50'
            : status === 'completed'
              ? 'bg-green-100 dark:bg-green-900/50'
              : status === 'error'
                ? 'bg-red-100 dark:bg-red-900/50'
                : 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <Icon className={cn('w-4 h-4', styles.icon)} />
      </div>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-left text-sm font-medium truncate',
          isActive
            ? 'text-blue-700 dark:text-blue-300'
            : status === 'completed'
              ? 'text-green-700 dark:text-green-300'
              : status === 'error'
                ? 'text-red-700 dark:text-red-300'
                : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {title}
      </span>

      {/* Status indicator */}
      {status === 'completed' && (
        <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
      )}
      {status === 'error' && (
        <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
      )}
      {(isActive || status === 'in_progress') && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="flex-shrink-0"
        >
          <ArrowPathIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        </motion.div>
      )}
    </motion.button>
  )
}

export default FlowStepCard
