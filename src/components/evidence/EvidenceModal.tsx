/**
 * EvidenceModal Component
 *
 * Main modal container for displaying document evidence with bounding box overlays.
 * Features portal rendering, focus trap, keyboard navigation, and backdrop click to close.
 *
 * Features:
 * - Uses ShadCN Dialog for proper accessibility and portal handling
 * - Supports ESC key to close
 * - Backdrop click closes the modal
 * - Manages bounding box navigation and selection
 * - Multi-page PDF navigation support
 * - Smooth enter/exit animations
 * - Focus restoration on close
 */

import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type {
  EvidenceModalProps,
  EvidenceModalConfig,
  DocumentDimensions,
  ViewerTransform,
} from '../../types/evidence'
import { DEFAULT_MODAL_CONFIG, DEFAULT_TRANSFORM } from '../../types/evidence'
import { DocumentViewer } from './DocumentViewer'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Box Navigation Controls Component
 */
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
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-2 py-1.5 z-20">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        aria-label="Evidência anterior"
        title="Evidência anterior (← ou ↑)"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </Button>

      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums min-w-[48px] text-center">
        {currentIndex + 1} / {totalBoxes}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onNext}
        aria-label="Próxima evidência"
        title="Próxima evidência (→ ou ↓)"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}

/**
 * Page Navigation Controls Component for Multi-page PDFs
 */
interface PageNavigationProps {
  currentPage: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
  onGoToPage: (page: number) => void
}

function PageNavigation({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onGoToPage,
}: PageNavigationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-3 py-2 z-20">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onPreviousPage}
        disabled={currentPage <= 1}
        aria-label="Página anterior"
        title="Página anterior (Page Up)"
        className="h-8 w-8 p-0"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2">
        <DocumentIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
          Página
        </span>
        <select
          value={currentPage}
          onChange={(e) => onGoToPage(Number(e.target.value))}
          className="h-7 px-2 text-sm font-medium rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Selecionar página"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          de {totalPages}
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        aria-label="Próxima página"
        title="Próxima página (Page Down)"
        className="h-8 w-8 p-0"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}

/**
 * Loading State Component
 */
function ModalLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando evidência...
        </span>
      </div>
    </div>
  )
}

/**
 * Error State Component
 */
interface ModalErrorProps {
  message: string
  onRetry?: () => void
  onClose: () => void
}

function ModalError({ message, onRetry, onClose }: ModalErrorProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
            <Button variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EvidenceModal Component
// ============================================================================

export function EvidenceModal({
  isOpen,
  evidence,
  onClose,
  onBoxOverride,
  config: configOverrides,
  className = '',
}: EvidenceModalProps) {
  // Merge config with defaults
  const config: EvidenceModalConfig = {
    ...DEFAULT_MODAL_CONFIG,
    ...configOverrides,
  }

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
  const [currentPage, setCurrentPage] = useState(evidence?.pageNumber ?? 1)

  // Get total pages from evidence
  const totalPages = evidence?.totalPages ?? 1

  // Filter bounding boxes for the current page
  const currentPageBoxes = useMemo(() => {
    if (!evidence?.boundingBoxes) return []
    return evidence.boundingBoxes.filter((box) => box.page === currentPage)
  }, [evidence?.boundingBoxes, currentPage])

  // Get total box count for current page
  const boxCount = currentPageBoxes.length

  // ============================================================================
  // Event Handlers
  // ============================================================================

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

  const handleBoxOverride = useCallback((boxId: string, newValue: string) => {
    onBoxOverride?.(boxId, newValue)
  }, [onBoxOverride])

  const handlePreviousBox = useCallback(() => {
    setSelectedBoxIndex((prev) => (prev <= 0 ? boxCount - 1 : prev - 1))
  }, [boxCount])

  const handleNextBox = useCallback(() => {
    setSelectedBoxIndex((prev) => (prev + 1) % boxCount)
  }, [boxCount])

  // Page navigation handlers
  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
    setSelectedBoxIndex(0)
    setTransform(DEFAULT_TRANSFORM)
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
    setSelectedBoxIndex(0)
    setTransform(DEFAULT_TRANSFORM)
  }, [totalPages])

  const handleGoToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
    setSelectedBoxIndex(0)
    setTransform(DEFAULT_TRANSFORM)
  }, [totalPages])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!config.enableKeyboardNavigation) return

    switch (e.key) {
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

      // Page navigation with PageUp/PageDown
      case 'PageUp':
        e.preventDefault()
        if (currentPage > 1) {
          handlePreviousPage()
        }
        break

      case 'PageDown':
        e.preventDefault()
        if (currentPage < totalPages) {
          handleNextPage()
        }
        break
    }
  }, [boxCount, config.enableKeyboardNavigation, currentPage, totalPages, handlePreviousPage, handleNextPage])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  // Track previous evidence ID to reset state when evidence changes
  const prevEvidenceIdRef = useRef<string | null>(null)

  // Reset state when evidence changes
  useEffect(() => {
    if (evidence && evidence.id !== prevEvidenceIdRef.current) {
      prevEvidenceIdRef.current = evidence.id
      setSelectedBoxIndex(0)
      setTransform(DEFAULT_TRANSFORM)
      setError(null)
      setCurrentPage(evidence.pageNumber ?? 1)
      // Note: isLoading is managed by the DocumentViewer's onImageLoad callback
      // We set it to false here so the DocumentViewer renders and can start loading
      setIsLoading(false)
    }
  }, [evidence])

  // ============================================================================
  // Build modal title and subtitle
  // ============================================================================

  const modalTitle = evidence?.documentName ?? 'Visualizar Evidência'
  const modalSubtitle = totalPages > 1
    ? `Página ${currentPage} de ${totalPages}${boxCount > 0 ? ` • ${boxCount} evidência${boxCount !== 1 ? 's' : ''}` : ''}`
    : boxCount > 0
    ? `${boxCount} evidência${boxCount !== 1 ? 's' : ''}`
    : undefined

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('glass-dialog max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0', className)}>
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between w-full">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {modalTitle}
              </DialogTitle>
              {modalSubtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {modalSubtitle}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div
          className="flex-1 relative overflow-hidden"
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Visualizador de evidência"
        >
          {/* Loading State */}
          {isLoading && !error && <ModalLoading />}

          {/* Error State */}
          {error && (
            <ModalError
              message={error}
              onClose={onClose}
            />
          )}

          {/* Page Navigation for Multi-page PDFs */}
          {config.showPageNavigation && !isLoading && !error && totalPages > 1 && (
            <PageNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              onGoToPage={handleGoToPage}
            />
          )}

          {/* Document Viewer with Bounding Boxes */}
          {evidence && !isLoading && !error && (
            <DocumentViewer
              imageUrl={evidence.imageUrl}
              alt={`Documento: ${evidence.documentName}`}
              transform={transform}
              onTransformChange={handleTransformChange}
              showControls={config.showZoomControls}
              onImageLoad={handleImageLoad}
              className="w-full h-full"
            >
              {/* Bounding Box Overlay - filtered by current page */}
              {dimensions.renderedWidth > 0 && (
                <BoundingBoxOverlay
                  boxes={currentPageBoxes}
                  dimensions={dimensions}
                  selectedIndex={selectedBoxIndex}
                  hoveredId={hoveredBoxId}
                  onBoxClick={handleBoxClick}
                  onBoxHover={handleBoxHover}
                  onBoxOverride={handleBoxOverride}
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
            ? `Exibindo ${evidence.documentName}, página ${currentPage} de ${totalPages}. ${boxCount} evidência${boxCount !== 1 ? 's' : ''} nesta página.`
            : ''}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceModal
