/**
 * DocumentCard Component
 *
 * A visually styled card component for displaying document information.
 * Features glassmorphism effects, status indicators, and interactive hover states.
 *
 * Features:
 * - Document type icon with colored background
 * - Status badge with icon
 * - Document type detection with confidence indicator
 * - File metadata (size, pages, date)
 * - Action buttons (view, delete)
 * - Smooth hover and focus animations
 * - Dark mode support
 */

import { motion } from 'framer-motion'
import {
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DocumentTypeBadge } from '@/components/status/DocumentTypeBadge'
import { cn } from '@/lib/utils'
import type { Document, DocumentStatus, DocumentType } from '../../types'

export interface DocumentCardProps {
  /** The document data */
  document: Document
  /** Callback when the view button is clicked */
  onView?: (document: Document) => void
  /** Callback when the delete button is clicked */
  onDelete?: (documentId: string) => void
  /** Callback when the reprocess button is clicked */
  onReprocess?: (documentId: string) => void
  /** Whether the card is selected */
  isSelected?: boolean
  /** Callback when the card is clicked */
  onClick?: (document: Document) => void
  /** Animation delay for staggered lists */
  animationDelay?: number
  /** Additional class names */
  className?: string
  /** Optional thumbnail URL for image documents */
  thumbnailUrl?: string
  /** Whether reprocessing is in progress for this document */
  isReprocessing?: boolean
  /** Whether selection mode is enabled */
  selectionMode?: boolean
  /** Callback when selection checkbox is toggled */
  onSelectionToggle?: (documentId: string) => void
}

// Status configuration with styling
const statusConfig: Record<DocumentStatus, {
  label: string
  className: string
  bgClass: string
  icon: typeof CheckCircleIcon
}> = {
  uploaded: {
    label: 'Enviado',
    className: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    icon: ClockIcon,
  },
  processing: {
    label: 'Processando',
    className: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    icon: ArrowPathIcon,
  },
  processed: {
    label: 'Processado',
    className: 'text-green-700 dark:text-green-300',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircleIcon,
  },
  needs_review: {
    label: 'Revisão Necessária',
    className: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    icon: ExclamationCircleIcon,
  },
  approved: {
    label: 'Aprovado',
    className: 'text-green-700 dark:text-green-300',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircleIcon,
  },
  failed: {
    label: 'Falhou',
    className: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    icon: ExclamationCircleIcon,
  },
}

// Document type labels in Portuguese
const documentTypeLabels: Record<DocumentType, string> = {
  cnh: 'CNH',
  rg: 'RG',
  marriage_cert: 'Certidão de Casamento',
  deed: 'Escritura',
  proxy: 'Procuração',
  iptu: 'IPTU',
  birth_cert: 'Certidão de Nascimento',
  other: 'Outro',
}

// Format file size to human readable
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format date to Brazilian format
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format confidence percentage
const formatConfidence = (confidence: number | null): string => {
  if (confidence === null || confidence === undefined) return ''
  return `${Math.round(confidence * 100)}%`
}

// Get confidence color class
const getConfidenceColor = (confidence: number | null): string => {
  if (confidence === null || confidence === undefined) return 'text-gray-500'
  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
  if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

// Get document type badge styling based on confidence
const getDocTypeBadgeClass = (confidence: number | null): string => {
  if (confidence === null || confidence === undefined) {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  }
  if (confidence >= 0.8) {
    return 'bg-gradient-to-br from-green-100 to-green-50 text-green-800 dark:from-green-900/40 dark:to-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800/50'
  }
  if (confidence >= 0.5) {
    return 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-800 dark:from-yellow-900/40 dark:to-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50'
  }
  return 'bg-gradient-to-br from-red-100 to-red-50 text-red-800 dark:from-red-900/40 dark:to-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800/50'
}

// Get document icon component based on mime type
const getDocumentIconComponent = (mimeType: string): { icon: typeof DocumentIcon; bgClass: string; iconClass: string } => {
  if (mimeType === 'application/pdf') {
    return {
      icon: DocumentTextIcon,
      bgClass: 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20',
      iconClass: 'text-red-600 dark:text-red-400',
    }
  }
  if (mimeType.startsWith('image/')) {
    return {
      icon: PhotoIcon,
      bgClass: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20',
      iconClass: 'text-blue-600 dark:text-blue-400',
    }
  }
  return {
    icon: DocumentIcon,
    bgClass: 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800',
    iconClass: 'text-gray-600 dark:text-gray-400',
  }
}

export default function DocumentCard({
  document,
  onView,
  onDelete,
  onReprocess,
  isSelected = false,
  onClick,
  animationDelay = 0,
  className = '',
  thumbnailUrl,
  isReprocessing = false,
  selectionMode = false,
  onSelectionToggle,
}: DocumentCardProps) {
  const statusInfo = statusConfig[document.status]
  const StatusIcon = statusInfo.icon
  const { icon: DocIcon, bgClass: docIconBg, iconClass: docIconClass } = getDocumentIconComponent(document.mime_type)

  // Check if this is an image document
  const isImageDocument = document.mime_type.startsWith('image/')

  // Handle checkbox click in selection mode
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionToggle?.(document.id)
  }

  // Handle card click - in selection mode, toggle selection; otherwise use onClick
  const handleCardClick = () => {
    if (selectionMode) {
      onSelectionToggle?.(document.id)
    } else {
      onClick?.(document)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{
        delay: animationDelay,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={cn(
        // Base card styling with glassmorphism
        'group relative overflow-hidden rounded-xl',
        'bg-white/80 dark:bg-gray-800/80',
        'backdrop-blur-md',
        'border border-gray-200/50 dark:border-gray-700/50',
        'shadow-sm hover:shadow-lg',
        'transition-all duration-300 ease-out',
        // Selection state
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 bg-blue-50/50 dark:bg-blue-900/20',
        // Selection mode hover state
        selectionMode && !isSelected && 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-2 dark:hover:ring-blue-600 dark:ring-offset-gray-900',
        // Cursor state
        (onClick || selectionMode) && 'cursor-pointer',
        className
      )}
      onClick={handleCardClick}
      role={(onClick || selectionMode) ? 'button' : undefined}
      tabIndex={(onClick || selectionMode) ? 0 : undefined}
      onKeyDown={(onClick || selectionMode) ? (e) => e.key === 'Enter' && handleCardClick() : undefined}
    >
      {/* Decorative gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />

      {/* Processing indicator bar */}
      {document.status === 'processing' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse" />
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Selection checkbox - shown in selection mode */}
          {selectionMode && (
            <div
              className="flex-shrink-0 flex items-center"
              onClick={handleCheckboxClick}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                  isSelected
                    ? 'bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                )}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Selecionar ${document.original_name}`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Document Icon/Thumbnail with styled container */}
          <div className={cn(
            'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden',
            'shadow-sm border border-white/20 dark:border-gray-600/30',
            'transition-transform duration-300 group-hover:scale-105',
            !thumbnailUrl && docIconBg
          )}>
            {isImageDocument && thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={document.original_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <DocIcon className={cn('size-7', docIconClass)} />
            )}
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title row with badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {document.original_name}
                </h3>
              </div>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 px-2.5 py-0.5 font-medium border',
                  statusInfo.bgClass,
                  statusInfo.className
                )}
              >
                <StatusIcon className={cn(
                  'size-3.5',
                  document.status === 'processing' && 'animate-spin'
                )} />
                {statusInfo.label}
              </Badge>

              {/* Document Type Badge with Confidence */}
              {document.doc_type && (
                <DocumentTypeBadge
                  type={document.doc_type}
                  confidence={document.doc_type_confidence}
                  showConfidence={true}
                  showIcon={true}
                  size="sm"
                  animate={false}
                />
              )}
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                {formatFileSize(document.file_size)}
              </span>
              {document.page_count && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {document.page_count} página{document.page_count !== 1 ? 's' : ''}
                  </span>
                </>
              )}
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="inline-flex items-center gap-1">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(document.created_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex items-center gap-1 transition-opacity duration-200">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onView(document)
                }}
                className="h-9 w-9 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                title="Ver documento"
              >
                <EyeIcon className="size-4" />
              </Button>
            )}
            {onReprocess && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onReprocess(document.id)
                }}
                disabled={isReprocessing || document.status === 'processing'}
                className="h-9 w-9 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-50"
                title="Reprocessar documento"
              >
                <ArrowPathIcon className={cn('size-4', isReprocessing && 'animate-spin')} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(document.id)
                }}
                className="h-9 w-9 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                title="Remover documento"
              >
                <TrashIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line based on status */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300',
        'opacity-0 group-hover:opacity-100',
        document.status === 'processed' && 'bg-gradient-to-r from-green-400 to-green-500',
        document.status === 'processing' && 'bg-gradient-to-r from-amber-400 to-amber-500',
        document.status === 'uploaded' && 'bg-gradient-to-r from-blue-400 to-blue-500',
        document.status === 'failed' && 'bg-gradient-to-r from-red-400 to-red-500',
        document.status === 'needs_review' && 'bg-gradient-to-r from-amber-400 to-amber-500',
        document.status === 'approved' && 'bg-gradient-to-r from-green-400 to-green-500'
      )} />
    </motion.div>
  )
}
