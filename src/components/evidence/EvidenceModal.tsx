/**
 * EvidenceModal Component
 *
 * Main modal container for displaying document evidence with bounding box overlays.
 * Features portal rendering, focus trap, keyboard navigation, and backdrop click to close.
 *
 * Features:
 * - Renders to document.body via portal for proper z-index stacking
 * - Traps focus within modal for accessibility
 * - Supports ESC key to close
 * - Backdrop click closes the modal
 * - Manages bounding box navigation and selection
 * - Smooth enter/exit animations
 * - Focus restoration on close
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import type {
  EvidenceModalProps,
  EvidenceModalConfig,
  DocumentDimensions,
  ViewerTransform,
} from '../../types/evidence'
import { DEFAULT_MODAL_CONFIG, DEFAULT_TRANSFORM } from '../../types/evidence'
import { DocumentViewer } from './DocumentViewer'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** ID for the portal root element */
const PORTAL_ROOT_ID = 'evidence-modal-root'

/** Focusable element selector for focus trap */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get or create the portal root element
 */
function getPortalRoot(): HTMLElement {
  let root = document.getElementById(PORTAL_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = PORTAL_ROOT_ID
    document.body.appendChild(root)
  }
  return root
}

// -----------------------------------------------------------------------------
// Modal Header Component
// -----------------------------------------------------------------------------

interface ModalHeaderProps {
  title: string
  subtitle?: string
  onClose: () => void
}

function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div className="evidence-modal-header flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-4 p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label="Fechar modal"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Box Navigation Controls Component
// -----------------------------------------------------------------------------

interface BoxNavigationProps {
  currentIndex: number
  totalBoxes: number
  onPrevious: () => void
  onNext: () => void
}

function BoxNavigation({
  currentIndex,
  totalBoxes,
  onPrevious,
  onNext,
}: BoxNavigationProps) {
  if (totalBoxes <= 1) return null

  return (
    <div className="evidence-modal-box-nav absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 z-20">
      <button
        type="button"
        onClick={onPrevious}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Evidência anterior"
        title="Evidência anterior (← ou ↑)"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>

      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums min-w-[48px] text-center">
        {currentIndex + 1} / {totalBoxes}
      </span>

      <button
        type="button"
        onClick={onNext}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Próxima evidência"
        title="Próxima evidência (→ ou ↓)"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Loading State Component
// -----------------------------------------------------------------------------

function ModalLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando evidência...
        </span>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Error State Component
// -----------------------------------------------------------------------------

interface ModalErrorProps {
  message: string
  onRetry?: () => void
  onClose: () => void
}

function ModalError({ message, onRetry, onClose }: ModalErrorProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4 text-center p-6 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Erro ao carregar
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-secondary text-sm"
            >
              Tentar novamente
            </button>
          )}
          <button
            onClick={onClose}
            className="btn-primary text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// EvidenceModal Component
// -----------------------------------------------------------------------------

export function EvidenceModal({
  isOpen,
  evidence,
  onClose,
  config: configOverrides,
  className = '',
}: EvidenceModalProps) {
  // Merge config with defaults
  const config: EvidenceModalConfig = {
    ...DEFAULT_MODAL_CONFIG,
    ...configOverrides,
  }

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // State management
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0)
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null)
  const [transform, setTransform] = useState<ViewerTransform>(DEFAULT_TRANSFORM)
  const [dimensions, setDimensions] = useState<DocumentDimensions>({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get total box count
  const boxCount = evidence?.boundingBoxes.length ?? 0

  // -----------------------------------------------------------------------------
  // Focus Management
  // -----------------------------------------------------------------------------

  // Store previously focused element when opening
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus trap - trap focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current

    // Focus the modal container initially
    modal.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      if (e.shiftKey) {
        // Shift + Tab: focus last element if currently on first
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: focus first element if currently on last
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])

  // Restore focus when closing
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // -----------------------------------------------------------------------------
  // Keyboard Navigation
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen || !config.enableKeyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break

        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          if (boxCount > 0) {
            setSelectedBoxIndex((prev) => (prev + 1) % boxCount)
          }
          break

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          if (boxCount > 0) {
            setSelectedBoxIndex((prev) => (prev <= 0 ? boxCount - 1 : prev - 1))
          }
          break

        case 'Home':
          e.preventDefault()
          setSelectedBoxIndex(0)
          break

        case 'End':
          e.preventDefault()
          setSelectedBoxIndex(Math.max(0, boxCount - 1))
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, boxCount, config.enableKeyboardNavigation, onClose])

  // Reset state when evidence changes
  useEffect(() => {
    if (evidence) {
      setSelectedBoxIndex(0)
      setTransform(DEFAULT_TRANSFORM)
      setIsLoading(true)
      setError(null)
    }
  }, [evidence?.id])

  // -----------------------------------------------------------------------------
  // Event Handlers
  // -----------------------------------------------------------------------------

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the backdrop itself
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const handleTransformChange = useCallback((newTransform: ViewerTransform) => {
    setTransform(newTransform)
  }, [])

  const handleImageLoad = useCallback((dims: DocumentDimensions) => {
    setDimensions(dims)
    setIsLoading(false)
    setError(null)
  }, [])

  const handleBoxClick = useCallback((_boxId: string, index: number) => {
    setSelectedBoxIndex(index)
  }, [])

  const handleBoxHover = useCallback((boxId: string | null) => {
    setHoveredBoxId(boxId)
  }, [])

  const handlePreviousBox = useCallback(() => {
    setSelectedBoxIndex((prev) => (prev <= 0 ? boxCount - 1 : prev - 1))
  }, [boxCount])

  const handleNextBox = useCallback(() => {
    setSelectedBoxIndex((prev) => (prev + 1) % boxCount)
  }, [boxCount])

  // -----------------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------------

  // Get the portal root
  const portalRoot = getPortalRoot()

  // Build modal title
  const modalTitle = evidence?.documentName ?? 'Visualizar Evidência'
  const modalSubtitle = evidence
    ? `Página ${evidence.pageNumber} de ${evidence.totalPages}`
    : undefined

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="evidence-modal-container fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evidence-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="evidence-modal-backdrop absolute inset-0 bg-black/60"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className={`
              evidence-modal
              absolute inset-4 sm:inset-6 md:inset-8 lg:inset-12
              bg-white dark:bg-gray-800
              rounded-xl
              shadow-2xl
              overflow-hidden
              flex flex-col
              ${className}
            `}
            tabIndex={-1}
          >
            {/* Header */}
            <ModalHeader
              title={modalTitle}
              subtitle={modalSubtitle}
              onClose={onClose}
            />

            {/* Content Area */}
            <div className="evidence-modal-content flex-1 relative overflow-hidden">
              {/* Loading State */}
              {isLoading && !error && <ModalLoading />}

              {/* Error State */}
              {error && (
                <ModalError
                  message={error}
                  onClose={onClose}
                />
              )}

              {/* Document Viewer with Bounding Boxes */}
              {evidence && (
                <DocumentViewer
                  imageUrl={evidence.imageUrl}
                  alt={`Documento: ${evidence.documentName}`}
                  transform={transform}
                  onTransformChange={handleTransformChange}
                  showControls={config.showZoomControls}
                  onImageLoad={handleImageLoad}
                  className="w-full h-full"
                >
                  {/* Bounding Box Overlay */}
                  {dimensions.renderedWidth > 0 && (
                    <BoundingBoxOverlay
                      boxes={evidence.boundingBoxes}
                      dimensions={dimensions}
                      selectedIndex={selectedBoxIndex}
                      hoveredId={hoveredBoxId}
                      onBoxClick={handleBoxClick}
                      onBoxHover={handleBoxHover}
                    />
                  )}
                </DocumentViewer>
              )}

              {/* Box Navigation */}
              {config.showBoxNavigation && !isLoading && !error && boxCount > 1 && (
                <BoxNavigation
                  currentIndex={selectedBoxIndex}
                  totalBoxes={boxCount}
                  onPrevious={handlePreviousBox}
                  onNext={handleNextBox}
                />
              )}
            </div>

            {/* Screen reader announcements */}
            <div className="sr-only" role="status" aria-live="polite">
              {isLoading
                ? 'Carregando documento...'
                : evidence
                ? `Exibindo ${evidence.documentName}, página ${evidence.pageNumber} de ${evidence.totalPages}. ${boxCount} evidência${boxCount !== 1 ? 's' : ''} destacada${boxCount !== 1 ? 's' : ''}.`
                : ''}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalRoot
  )
}

export default EvidenceModal
