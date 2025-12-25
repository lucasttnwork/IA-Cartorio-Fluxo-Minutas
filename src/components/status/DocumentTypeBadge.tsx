/**
 * DocumentTypeBadge Component
 *
 * A visually distinct badge component for displaying document types.
 * Each document type has its own unique color scheme and optional icon
 * to make it easy to identify document categories at a glance.
 *
 * Features:
 * - Unique color scheme per document type
 * - Optional icons for each type
 * - Confidence indicator support
 * - Size variants (sm, md, lg)
 * - Dark mode support
 * - Accessible color contrasts (WCAG AA compliant)
 */

import { motion } from 'framer-motion'
import {
  IdentificationIcon,
  DocumentTextIcon,
  HeartIcon,
  HomeIcon,
  DocumentIcon,
  ReceiptPercentIcon,
  UserIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DocumentType } from '@/types'

export interface DocumentTypeBadgeProps {
  /** The document type to display */
  type: DocumentType
  /** Optional confidence score (0-1) */
  confidence?: number | null
  /** Whether to show the confidence percentage */
  showConfidence?: boolean
  /** Whether to show the icon */
  showIcon?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to animate on mount */
  animate?: boolean
  /** Additional class names */
  className?: string
  /** Callback when badge is clicked */
  onClick?: () => void
}

interface TypeConfig {
  label: string
  shortLabel: string
  icon: typeof DocumentIcon
  // Light mode styles
  bgClass: string
  textClass: string
  borderClass: string
  // Dark mode styles
  darkBgClass: string
  darkTextClass: string
  darkBorderClass: string
  // Icon color
  iconClass: string
  darkIconClass: string
}

/**
 * Configuration for each document type with distinct visual styling
 */
const typeConfigs: Record<DocumentType, TypeConfig> = {
  cnh: {
    label: 'CNH',
    shortLabel: 'CNH',
    icon: IdentificationIcon,
    bgClass: 'bg-gradient-to-br from-blue-100 to-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    darkBgClass: 'dark:from-blue-900/40 dark:to-blue-900/20',
    darkTextClass: 'dark:text-blue-300',
    darkBorderClass: 'dark:border-blue-700/50',
    iconClass: 'text-blue-600',
    darkIconClass: 'dark:text-blue-400',
  },
  rg: {
    label: 'RG',
    shortLabel: 'RG',
    icon: IdentificationIcon,
    bgClass: 'bg-gradient-to-br from-indigo-100 to-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-200',
    darkBgClass: 'dark:from-indigo-900/40 dark:to-indigo-900/20',
    darkTextClass: 'dark:text-indigo-300',
    darkBorderClass: 'dark:border-indigo-700/50',
    iconClass: 'text-indigo-600',
    darkIconClass: 'dark:text-indigo-400',
  },
  marriage_cert: {
    label: 'Certidao de Casamento',
    shortLabel: 'Casamento',
    icon: HeartIcon,
    bgClass: 'bg-gradient-to-br from-pink-100 to-pink-50',
    textClass: 'text-pink-800',
    borderClass: 'border-pink-200',
    darkBgClass: 'dark:from-pink-900/40 dark:to-pink-900/20',
    darkTextClass: 'dark:text-pink-300',
    darkBorderClass: 'dark:border-pink-700/50',
    iconClass: 'text-pink-600',
    darkIconClass: 'dark:text-pink-400',
  },
  birth_cert: {
    label: 'Certidao de Nascimento',
    shortLabel: 'Nascimento',
    icon: UserIcon,
    bgClass: 'bg-gradient-to-br from-cyan-100 to-cyan-50',
    textClass: 'text-cyan-800',
    borderClass: 'border-cyan-200',
    darkBgClass: 'dark:from-cyan-900/40 dark:to-cyan-900/20',
    darkTextClass: 'dark:text-cyan-300',
    darkBorderClass: 'dark:border-cyan-700/50',
    iconClass: 'text-cyan-600',
    darkIconClass: 'dark:text-cyan-400',
  },
  deed: {
    label: 'Escritura',
    shortLabel: 'Escritura',
    icon: DocumentTextIcon,
    bgClass: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    darkBgClass: 'dark:from-emerald-900/40 dark:to-emerald-900/20',
    darkTextClass: 'dark:text-emerald-300',
    darkBorderClass: 'dark:border-emerald-700/50',
    iconClass: 'text-emerald-600',
    darkIconClass: 'dark:text-emerald-400',
  },
  proxy: {
    label: 'Procuracao',
    shortLabel: 'Procuracao',
    icon: DocumentTextIcon,
    bgClass: 'bg-gradient-to-br from-purple-100 to-purple-50',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
    darkBgClass: 'dark:from-purple-900/40 dark:to-purple-900/20',
    darkTextClass: 'dark:text-purple-300',
    darkBorderClass: 'dark:border-purple-700/50',
    iconClass: 'text-purple-600',
    darkIconClass: 'dark:text-purple-400',
  },
  iptu: {
    label: 'IPTU',
    shortLabel: 'IPTU',
    icon: HomeIcon,
    bgClass: 'bg-gradient-to-br from-orange-100 to-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
    darkBgClass: 'dark:from-orange-900/40 dark:to-orange-900/20',
    darkTextClass: 'dark:text-orange-300',
    darkBorderClass: 'dark:border-orange-700/50',
    iconClass: 'text-orange-600',
    darkIconClass: 'dark:text-orange-400',
  },
  other: {
    label: 'Outro',
    shortLabel: 'Outro',
    icon: QuestionMarkCircleIcon,
    bgClass: 'bg-gradient-to-br from-gray-100 to-gray-50',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-200',
    darkBgClass: 'dark:from-gray-700 dark:to-gray-800',
    darkTextClass: 'dark:text-gray-300',
    darkBorderClass: 'dark:border-gray-600',
    iconClass: 'text-gray-600',
    darkIconClass: 'dark:text-gray-400',
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

/**
 * Get confidence level styling
 */
const getConfidenceStyle = (confidence: number | null | undefined) => {
  if (confidence === null || confidence === undefined) return ''
  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
  if (confidence >= 0.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Format confidence as percentage
 */
const formatConfidence = (confidence: number | null | undefined): string => {
  if (confidence === null || confidence === undefined) return ''
  return `${Math.round(confidence * 100)}%`
}

export function DocumentTypeBadge({
  type,
  confidence,
  showConfidence = true,
  showIcon = true,
  size = 'md',
  animate = true,
  className = '',
  onClick,
}: DocumentTypeBadgeProps) {
  const config = typeConfigs[type]
  const sizeConfig = sizeClasses[size]
  const Icon = config.icon
  const isClickable = !!onClick

  const badgeContent = (
    <Badge
      className={cn(
        'inline-flex items-center rounded-full font-semibold relative',
        'border shadow-sm',
        // Light mode styles
        config.bgClass,
        config.textClass,
        config.borderClass,
        // Dark mode styles
        config.darkBgClass,
        config.darkTextClass,
        config.darkBorderClass,
        // Size styles
        sizeConfig.badge,
        // Interactive styles
        isClickable && 'cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      aria-label={`Tipo de documento: ${config.label}`}
      tabIndex={isClickable ? 0 : undefined}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            config.iconClass,
            config.darkIconClass
          )}
        />
      )}
      <span className="truncate">{size === 'sm' ? config.shortLabel : config.label}</span>
      {showConfidence && confidence !== null && confidence !== undefined && (
        <span className={cn('font-bold', getConfidenceStyle(confidence))}>
          ({formatConfidence(confidence)})
        </span>
      )}
    </Badge>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="inline-flex"
      >
        {badgeContent}
      </motion.div>
    )
  }

  return badgeContent
}

/**
 * Get the label for a document type
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  return typeConfigs[type]?.label ?? 'Desconhecido'
}

/**
 * Get the short label for a document type
 */
export function getDocumentTypeShortLabel(type: DocumentType): string {
  return typeConfigs[type]?.shortLabel ?? 'N/A'
}

/**
 * Get the icon component for a document type
 */
export function getDocumentTypeIcon(type: DocumentType): typeof DocumentIcon {
  return typeConfigs[type]?.icon ?? QuestionMarkCircleIcon
}

export default DocumentTypeBadge
