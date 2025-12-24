/**
 * ConflictCard Component
 *
 * Displays a single field conflict between OCR and LLM extraction results.
 * Allows users to review both values and select the correct one for resolution.
 *
 * Features:
 * - Shows OCR and LLM extracted values side by side
 * - Displays similarity score and conflict reason
 * - Allows selection of preferred value or custom input
 * - Supports resolution with optional notes
 * - Animated status transitions
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { ConflictField, ConflictFieldStatus, ConflictReason } from '../../types'

// ============================================================================
// Types
// ============================================================================

export interface ConflictCardProps {
  /** The conflict field data */
  conflict: ConflictField
  /** Callback when a value is selected for resolution */
  onResolve?: (fieldPath: string, resolvedValue: unknown, note?: string) => void
  /** Whether the card is in a loading state */
  isLoading?: boolean
  /** Whether the card is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show detailed information */
  showDetails?: boolean
  /** Additional class name */
  className?: string
}

export type ValueSource = 'ocr' | 'llm' | 'custom'

// ============================================================================
// Configuration
// ============================================================================

interface StatusConfig {
  label: string
  icon: typeof CheckCircleIcon
  bgClassName: string
  textClassName: string
  borderClassName: string
}

const statusConfigs: Record<ConflictFieldStatus, StatusConfig> = {
  pending: {
    label: 'Pending Review',
    icon: ClockIcon,
    bgClassName: 'bg-amber-50 dark:bg-amber-900/20',
    textClassName: 'text-amber-700 dark:text-amber-300',
    borderClassName: 'border-amber-200 dark:border-amber-800',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircleIcon,
    bgClassName: 'bg-green-50 dark:bg-green-900/20',
    textClassName: 'text-green-700 dark:text-green-300',
    borderClassName: 'border-green-200 dark:border-green-800',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircleIcon,
    bgClassName: 'bg-blue-50 dark:bg-blue-900/20',
    textClassName: 'text-blue-700 dark:text-blue-300',
    borderClassName: 'border-blue-200 dark:border-blue-800',
  },
}

const conflictReasonLabels: Record<ConflictReason, string> = {
  low_similarity: 'Low similarity score',
  type_mismatch: 'Data type mismatch',
  format_difference: 'Format difference',
  partial_match: 'Partial match detected',
  ocr_confidence_low: 'Low OCR confidence',
  llm_confidence_low: 'Low LLM confidence',
  both_confidence_low: 'Both sources have low confidence',
  semantic_difference: 'Semantic difference',
  missing_value: 'Missing value in one source',
}

const sizeClasses = {
  sm: {
    card: 'p-3',
    title: 'text-sm',
    value: 'text-xs',
    badge: 'text-xs px-1.5 py-0.5',
  },
  md: {
    card: 'p-4',
    title: 'text-base',
    value: 'text-sm',
    badge: 'text-xs px-2 py-0.5',
  },
  lg: {
    card: 'p-5',
    title: 'text-lg',
    value: 'text-base',
    badge: 'text-sm px-2.5 py-1',
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatFieldName(fieldPath: string): string {
  // Convert dot notation path to human readable format
  // e.g., "person.full_name" -> "Person Full Name"
  return fieldPath
    .split('.')
    .map(part => part.replace(/_/g, ' '))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' > ')
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function getSimilarityColor(score: number): string {
  if (score >= 0.85) return 'text-green-600 dark:text-green-400'
  if (score >= 0.7) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 0.5) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getSimilarityBgColor(score: number): string {
  if (score >= 0.85) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 0.7) return 'bg-yellow-100 dark:bg-yellow-900/30'
  if (score >= 0.5) return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

// ============================================================================
// Sub-components
// ============================================================================

interface ValueCardProps {
  source: 'ocr' | 'llm'
  value: unknown
  confidence?: number
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
  size: 'sm' | 'md' | 'lg'
}

function ValueCard({
  source,
  value,
  confidence,
  isSelected,
  onSelect,
  disabled,
  size,
}: ValueCardProps) {
  const Icon = source === 'ocr' ? DocumentTextIcon : SparklesIcon
  const label = source === 'ocr' ? 'OCR Result' : 'LLM Result'
  const sizeConfig = sizeClasses[size]

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative w-full text-left rounded-lg border-2 transition-all duration-200
        ${sizeConfig.card}
        ${isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${source === 'ocr' ? 'text-blue-500' : 'text-purple-500'}`} />
        <span className={`font-medium ${sizeConfig.value} text-gray-700 dark:text-gray-300`}>
          {label}
        </span>
        {confidence !== undefined && (
          <span className={`${sizeConfig.badge} rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`}>
            {Math.round(confidence * 100)}%
          </span>
        )}
        {isSelected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto"
          >
            <CheckCircleIcon className="w-5 h-5 text-primary-500" />
          </motion.span>
        )}
      </div>

      {/* Value */}
      <div className={`
        ${sizeConfig.value} text-gray-900 dark:text-gray-100
        font-mono bg-gray-50 dark:bg-gray-900 rounded p-2
        max-h-24 overflow-y-auto
        whitespace-pre-wrap break-words
      `}>
        {formatValue(value)}
      </div>
    </motion.button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ConflictCard({
  conflict,
  onResolve,
  isLoading = false,
  disabled = false,
  size = 'md',
  showDetails = true,
  className = '',
}: ConflictCardProps) {
  const [selectedSource, setSelectedSource] = useState<ValueSource | null>(null)
  const [customValue, setCustomValue] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = statusConfigs[conflict.status]
  const StatusIcon = statusConfig.icon
  const sizeConfig = sizeClasses[size]

  const isResolved = conflict.status === 'resolved' || conflict.status === 'confirmed'
  const canResolve = !isResolved && !disabled && !isLoading && selectedSource !== null

  const handleSelectOcr = useCallback(() => {
    if (disabled || isResolved) return
    setSelectedSource('ocr')
    setShowCustomInput(false)
  }, [disabled, isResolved])

  const handleSelectLlm = useCallback(() => {
    if (disabled || isResolved) return
    setSelectedSource('llm')
    setShowCustomInput(false)
  }, [disabled, isResolved])

  const handleSelectCustom = useCallback(() => {
    if (disabled || isResolved) return
    setSelectedSource('custom')
    setShowCustomInput(true)
  }, [disabled, isResolved])

  const handleResolve = useCallback(() => {
    if (!canResolve || !onResolve) return

    let resolvedValue: unknown
    if (selectedSource === 'ocr') {
      resolvedValue = conflict.ocrValue
    } else if (selectedSource === 'llm') {
      resolvedValue = conflict.llmValue
    } else {
      resolvedValue = customValue
    }

    onResolve(conflict.fieldPath, resolvedValue, resolutionNote || undefined)
  }, [canResolve, onResolve, selectedSource, conflict, customValue, resolutionNote])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        rounded-xl border shadow-sm overflow-hidden
        ${statusConfig.borderClassName}
        ${statusConfig.bgClassName}
        ${className}
      `}
    >
      {/* Header */}
      <div className={`${sizeConfig.card} border-b ${statusConfig.borderClassName}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Field Name */}
            <h3 className={`font-semibold ${sizeConfig.title} text-gray-900 dark:text-white truncate`}>
              {formatFieldName(conflict.fieldPath)}
            </h3>

            {/* Field Path */}
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              {conflict.fieldPath}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`
            flex items-center gap-1.5 rounded-full
            ${sizeConfig.badge}
            ${statusConfig.bgClassName}
            ${statusConfig.textClassName}
            border ${statusConfig.borderClassName}
          `}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="font-medium">{statusConfig.label}</span>
          </div>
        </div>

        {/* Conflict Info */}
        {showDetails && conflict.status === 'pending' && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Similarity Score */}
            <div className={`
              flex items-center gap-1.5 rounded-full px-2 py-1
              ${getSimilarityBgColor(conflict.similarityScore)}
            `}>
              <ArrowsRightLeftIcon className={`w-3.5 h-3.5 ${getSimilarityColor(conflict.similarityScore)}`} />
              <span className={`text-xs font-medium ${getSimilarityColor(conflict.similarityScore)}`}>
                {Math.round(conflict.similarityScore * 100)}% match
              </span>
            </div>

            {/* Conflict Reason */}
            {conflict.conflictReason && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>{conflictReasonLabels[conflict.conflictReason]}</span>
              </div>
            )}
          </div>
        )}

        {/* Resolved Info */}
        {isResolved && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            {conflict.reviewedBy && (
              <span>Reviewed by {conflict.reviewedBy}</span>
            )}
            {conflict.reviewedAt && (
              <span className="ml-2">
                on {new Date(conflict.reviewedAt).toLocaleDateString()}
              </span>
            )}
            {conflict.resolutionNote && (
              <p className="mt-1 italic">"{conflict.resolutionNote}"</p>
            )}
          </div>
        )}
      </div>

      {/* Values Comparison */}
      <div className={`${sizeConfig.card}`}>
        {isResolved ? (
          // Show final value for resolved conflicts
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resolved Value
            </p>
            <div className={`
              ${sizeConfig.value} text-gray-900 dark:text-gray-100
              font-mono bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700
            `}>
              {formatValue(conflict.finalValue)}
            </div>

            {/* Expandable original values */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              {isExpanded ? 'Hide original values' : 'Show original values'}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">OCR</p>
                      <div className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded p-2">
                        {formatValue(conflict.ocrValue)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">LLM</p>
                      <div className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded p-2">
                        {formatValue(conflict.llmValue)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          // Show selectable values for pending conflicts
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ValueCard
                source="ocr"
                value={conflict.ocrValue}
                confidence={conflict.ocrConfidence}
                isSelected={selectedSource === 'ocr'}
                onSelect={handleSelectOcr}
                disabled={disabled || isLoading}
                size={size}
              />
              <ValueCard
                source="llm"
                value={conflict.llmValue}
                confidence={conflict.llmConfidence}
                isSelected={selectedSource === 'llm'}
                onSelect={handleSelectLlm}
                disabled={disabled || isLoading}
                size={size}
              />
            </div>

            {/* Custom Value Option */}
            <div className="mt-3">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  disabled={disabled || isLoading}
                  className={`
                    flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400
                    hover:text-primary-600 dark:hover:text-primary-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  `}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  <span>Enter custom value</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <PencilSquareIcon className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Custom Value
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false)
                        if (selectedSource === 'custom') setSelectedSource(null)
                      }}
                      className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter the correct value..."
                    disabled={disabled || isLoading}
                    className={`
                      w-full rounded-lg border-2 px-3 py-2
                      ${selectedSource === 'custom'
                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                      }
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${sizeConfig.value}
                    `}
                  />
                </motion.div>
              )}
            </div>

            {/* Resolution Note */}
            {selectedSource && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Resolution note (optional)
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Add a note explaining your choice..."
                  disabled={disabled || isLoading}
                  rows={2}
                  className={`
                    w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    resize-none
                    ${sizeConfig.value}
                  `}
                />
              </motion.div>
            )}

            {/* Resolve Button */}
            {onResolve && (
              <div className="mt-4 flex justify-end">
                <motion.button
                  type="button"
                  onClick={handleResolve}
                  disabled={!canResolve}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                    bg-primary-600 hover:bg-primary-700
                    text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                    ${sizeConfig.value}
                  `}
                  whileHover={canResolve ? { scale: 1.02 } : undefined}
                  whileTap={canResolve ? { scale: 0.98 } : undefined}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Resolve Conflict</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Compact Variant for Lists
// ============================================================================

export interface ConflictCardCompactProps {
  conflict: ConflictField
  onClick?: () => void
  className?: string
}

export function ConflictCardCompact({
  conflict,
  onClick,
  className = '',
}: ConflictCardCompactProps) {
  const statusConfig = statusConfigs[conflict.status]
  const StatusIcon = statusConfig.icon

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-all duration-200
        ${statusConfig.borderClassName}
        bg-white dark:bg-gray-800
        hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700
        ${className}
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {formatFieldName(conflict.fieldPath)}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            OCR: {formatValue(conflict.ocrValue).slice(0, 30)}...
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`
            text-xs font-medium px-2 py-0.5 rounded-full
            ${getSimilarityBgColor(conflict.similarityScore)}
            ${getSimilarityColor(conflict.similarityScore)}
          `}>
            {Math.round(conflict.similarityScore * 100)}%
          </span>
          <StatusIcon className={`w-4 h-4 ${statusConfig.textClassName}`} />
        </div>
      </div>
    </motion.button>
  )
}

export default ConflictCard
