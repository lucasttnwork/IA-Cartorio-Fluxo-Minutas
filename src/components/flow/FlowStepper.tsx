/**
 * FlowStepper Component
 *
 * A step-by-step wizard indicator for the purchase/sale flow.
 * Shows all steps with their current status, allows navigation
 * to completed/accessible steps, and displays overall progress.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid'
import {
  FolderPlusIcon,
  DocumentArrowUpIcon,
  CpuChipIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { FlowStep, FlowStepInfo, FlowStepStatus } from '@/stores/flowStore'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FlowStepperProps {
  /** Array of step information */
  steps: FlowStepInfo[]
  /** Currently active step */
  currentStep: FlowStep
  /** Callback when a step is clicked */
  onStepClick?: (step: FlowStep) => void
  /** Function to check if a step is accessible */
  canGoToStep?: (step: FlowStep) => boolean
  /** Overall progress percentage (0-100) */
  progress?: number
  /** Orientation of the stepper */
  orientation?: 'horizontal' | 'vertical'
  /** Whether to show the progress bar */
  showProgress?: boolean
  /** Whether the stepper is compact */
  compact?: boolean
  /** Custom class name */
  className?: string
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

function getStepStatusStyles(
  status: FlowStepStatus,
  isActive: boolean,
  isAccessible: boolean
): {
  container: string
  icon: string
  text: string
  connector: string
} {
  if (status === 'completed') {
    return {
      container: 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600',
      icon: 'text-white',
      text: 'text-green-700 dark:text-green-400',
      connector: 'bg-green-500 dark:bg-green-600',
    }
  }

  if (status === 'error') {
    return {
      container: 'bg-red-500 dark:bg-red-600 border-red-500 dark:border-red-600',
      icon: 'text-white',
      text: 'text-red-700 dark:text-red-400',
      connector: 'bg-red-300 dark:bg-red-700',
    }
  }

  if (isActive) {
    return {
      container: 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600 ring-4 ring-blue-500/20 dark:ring-blue-400/20',
      icon: 'text-white',
      text: 'text-blue-700 dark:text-blue-400 font-medium',
      connector: 'bg-gray-300 dark:bg-gray-600',
    }
  }

  if (status === 'in_progress') {
    return {
      container: 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400',
      icon: 'text-blue-500 dark:text-blue-400',
      text: 'text-blue-700 dark:text-blue-400',
      connector: 'bg-gray-300 dark:bg-gray-600',
    }
  }

  // Pending
  if (isAccessible) {
    return {
      container: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
      icon: 'text-gray-500 dark:text-gray-400',
      text: 'text-gray-600 dark:text-gray-400',
      connector: 'bg-gray-300 dark:bg-gray-600',
    }
  }

  return {
    container: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700',
    icon: 'text-gray-400 dark:text-gray-500',
    text: 'text-gray-400 dark:text-gray-500',
    connector: 'bg-gray-200 dark:bg-gray-700',
  }
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface StepIndicatorProps {
  step: FlowStepInfo
  isActive: boolean
  isAccessible: boolean
  compact?: boolean
  onClick?: () => void
}

function StepIndicator({
  step,
  isActive,
  isAccessible,
  compact,
  onClick,
}: StepIndicatorProps) {
  const styles = getStepStatusStyles(step.status, isActive, isAccessible)
  const Icon = stepIcons[step.id]
  const canClick = isAccessible && onClick

  return (
    <motion.button
      type="button"
      disabled={!canClick}
      onClick={canClick ? onClick : undefined}
      className={cn(
        'relative flex items-center justify-center rounded-full border-2 transition-all duration-200',
        compact ? 'w-8 h-8' : 'w-10 h-10',
        styles.container,
        canClick && 'cursor-pointer hover:scale-105',
        !canClick && 'cursor-default'
      )}
      whileHover={canClick ? { scale: 1.05 } : undefined}
      whileTap={canClick ? { scale: 0.95 } : undefined}
      aria-label={`${step.label} - ${step.status}`}
      aria-current={isActive ? 'step' : undefined}
    >
      {step.status === 'completed' ? (
        <CheckCircleIcon className={cn('w-5 h-5', styles.icon)} />
      ) : step.status === 'error' ? (
        <ExclamationCircleIcon className={cn('w-5 h-5', styles.icon)} />
      ) : (
        <Icon className={cn(compact ? 'w-4 h-4' : 'w-5 h-5', styles.icon)} />
      )}

      {/* Active step pulse animation */}
      {isActive && step.status === 'in_progress' && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-blue-500 dark:border-blue-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.button>
  )
}

interface StepConnectorProps {
  isCompleted: boolean
  orientation: 'horizontal' | 'vertical'
}

function StepConnector({ isCompleted, orientation }: StepConnectorProps) {
  return (
    <div
      className={cn(
        'flex-1 transition-colors duration-300',
        orientation === 'horizontal' ? 'h-0.5 min-w-[20px]' : 'w-0.5 min-h-[20px]',
        isCompleted
          ? 'bg-green-500 dark:bg-green-600'
          : 'bg-gray-200 dark:bg-gray-700'
      )}
    />
  )
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function FlowStepper({
  steps,
  currentStep,
  onStepClick,
  canGoToStep,
  progress = 0,
  orientation = 'horizontal',
  showProgress = true,
  compact = false,
  className,
}: FlowStepperProps) {
  // Calculate default accessibility if not provided
  const checkAccessibility = useMemo(() => {
    if (canGoToStep) return canGoToStep

    // Default: can go to completed steps and current step
    const stepOrder = steps.map((s) => s.id)
    const currentIndex = stepOrder.indexOf(currentStep)

    return (step: FlowStep) => {
      const stepIndex = stepOrder.indexOf(step)
      return stepIndex <= currentIndex
    }
  }, [canGoToStep, steps, currentStep])

  const isHorizontal = orientation === 'horizontal'

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar (horizontal only) */}
      {showProgress && isHorizontal && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progresso do Fluxo
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Steps container */}
      <nav
        aria-label="Progress steps"
        className={cn(
          'flex',
          isHorizontal
            ? 'flex-row items-start justify-between'
            : 'flex-col items-start gap-2'
        )}
      >
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isAccessible = checkAccessibility(step.id)
          const isLast = index === steps.length - 1
          const prevStep = index > 0 ? steps[index - 1] : null
          const styles = getStepStatusStyles(step.status, isActive, isAccessible)

          return (
            <div
              key={step.id}
              className={cn(
                'flex',
                isHorizontal
                  ? 'flex-col items-center flex-1'
                  : 'flex-row items-start w-full gap-3'
              )}
            >
              {/* Step indicator and connector row */}
              <div
                className={cn(
                  'flex items-center',
                  isHorizontal ? 'w-full' : 'flex-col'
                )}
              >
                {/* Left connector (horizontal) or top connector (vertical) */}
                {index > 0 && (
                  <StepConnector
                    isCompleted={prevStep?.status === 'completed'}
                    orientation={orientation}
                  />
                )}

                {/* Step indicator */}
                <StepIndicator
                  step={step}
                  isActive={isActive}
                  isAccessible={isAccessible}
                  compact={compact}
                  onClick={
                    onStepClick && isAccessible
                      ? () => onStepClick(step.id)
                      : undefined
                  }
                />

                {/* Right connector (horizontal only) */}
                {!isLast && isHorizontal && (
                  <StepConnector
                    isCompleted={step.status === 'completed'}
                    orientation={orientation}
                  />
                )}
              </div>

              {/* Step label and description */}
              <div
                className={cn(
                  isHorizontal
                    ? 'mt-2 text-center max-w-[120px]'
                    : 'flex-1 min-w-0 py-1'
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    styles.text,
                    isHorizontal && compact && 'text-xs'
                  )}
                >
                  {step.label}
                </p>
                {!compact && (
                  <p
                    className={cn(
                      'text-xs text-gray-500 dark:text-gray-400 mt-0.5',
                      isHorizontal && 'line-clamp-2'
                    )}
                  >
                    {step.description}
                  </p>
                )}
                {step.error && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 line-clamp-1">
                    {step.error}
                  </p>
                )}
              </div>

              {/* Bottom connector for vertical orientation */}
              {!isLast && !isHorizontal && (
                <div className="ml-4 mt-2">
                  <StepConnector
                    isCompleted={step.status === 'completed'}
                    orientation={orientation}
                  />
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Current step indicator for mobile/compact */}
      {compact && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Etapa {steps.findIndex((s) => s.id === currentStep) + 1} de{' '}
            {steps.length}
          </p>
          <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
            {steps.find((s) => s.id === currentStep)?.label}
          </p>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Compact Variant
// -----------------------------------------------------------------------------

export interface FlowStepperCompactProps {
  /** Array of step information */
  steps: FlowStepInfo[]
  /** Currently active step */
  currentStep: FlowStep
  /** Overall progress percentage */
  progress?: number
  /** Custom class name */
  className?: string
}

/**
 * A compact, mobile-friendly version of the FlowStepper
 * that shows just dots and progress
 */
export function FlowStepperCompact({
  steps,
  currentStep,
  progress = 0,
  className,
}: FlowStepperCompactProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)
  const currentStepInfo = steps[currentIndex]

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <Progress value={progress} className="h-1.5 mb-3" />

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = step.status === 'completed'
          const hasError = step.status === 'error'

          return (
            <motion.div
              key={step.id}
              className={cn(
                'rounded-full transition-all duration-200',
                isActive
                  ? 'w-3 h-3 bg-blue-500 dark:bg-blue-400'
                  : isCompleted
                    ? 'w-2 h-2 bg-green-500 dark:bg-green-400'
                    : hasError
                      ? 'w-2 h-2 bg-red-500 dark:bg-red-400'
                      : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
              )}
              animate={isActive ? { scale: [1, 1.2, 1] } : undefined}
              transition={
                isActive
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
              aria-label={`Step ${index + 1}: ${step.label}`}
              aria-current={isActive ? 'step' : undefined}
            />
          )
        })}
      </div>

      {/* Current step label */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Etapa {currentIndex + 1} de {steps.length}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
          {currentStepInfo?.label}
        </p>
      </div>
    </div>
  )
}

export default FlowStepper
