/**
 * DocumentViewer Component
 *
 * Image display component with pan/zoom controls using CSS transforms.
 * Provides a container for viewing document images with interactive
 * zoom and pan functionality.
 *
 * Features:
 * - Mouse wheel zoom (centered on cursor position)
 * - Click and drag panning
 * - Zoom control buttons (zoom in, zoom out, reset)
 * - Smooth CSS transitions for animations
 * - Responsive resize handling
 * - Image loading state management
 * - Renders children as overlay (for bounding boxes)
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  DocumentViewerProps,
  DocumentDimensions,
  ViewerTransform,
} from '../../types/evidence'
import { DEFAULT_ZOOM_CONFIG, DEFAULT_TRANSFORM } from '../../types/evidence'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Debounce delay for resize handling in ms */
const RESIZE_DEBOUNCE_MS = 150

/** Minimum drag distance to consider it a pan operation */
const MIN_DRAG_DISTANCE = 5

/** Scroll wheel zoom sensitivity */
const WHEEL_ZOOM_SENSITIVITY = 0.001

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate the new transform after zooming centered on a point
 */
function zoomAtPoint(
  currentTransform: ViewerTransform,
  newScale: number,
  pointX: number,
  pointY: number
): ViewerTransform {
  // Calculate the point in the original coordinate system
  const originX = (pointX - currentTransform.x) / currentTransform.scale
  const originY = (pointY - currentTransform.y) / currentTransform.scale

  // Calculate new position to keep the point stationary
  const newX = pointX - originX * newScale
  const newY = pointY - originY * newScale

  return {
    x: newX,
    y: newY,
    scale: newScale,
  }
}

// -----------------------------------------------------------------------------
// Zoom Controls Component
// -----------------------------------------------------------------------------

interface ZoomControlsProps {
  scale: number
  minScale: number
  maxScale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

function ZoomControls({
  scale,
  minScale,
  maxScale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const scalePercent = Math.round(scale * 100)
  const canZoomIn = scale < maxScale
  const canZoomOut = scale > minScale

  return (
    <div className="document-viewer-controls absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 glass-popover p-1 z-10">
      {/* Zoom Out Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={cn(
          "h-9 w-9",
          !canZoomOut && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Diminuir zoom"
        title="Diminuir zoom (- ou scroll para baixo)"
      >
        <MagnifyingGlassMinusIcon className="w-5 h-5" />
      </Button>

      {/* Zoom Level Display */}
      <span className="min-w-[56px] text-center text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
        {scalePercent}%
      </span>

      {/* Zoom In Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={cn(
          "h-9 w-9",
          !canZoomIn && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Aumentar zoom"
        title="Aumentar zoom (+ ou scroll para cima)"
      >
        <MagnifyingGlassPlusIcon className="w-5 h-5" />
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Reset Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-9 w-9"
        aria-label="Redefinir zoom"
        title="Redefinir zoom (0)"
      >
        <ArrowsPointingOutIcon className="w-5 h-5" />
      </Button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Loading Spinner Component
// -----------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando documento...
        </span>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Error Display Component
// -----------------------------------------------------------------------------

interface ErrorDisplayProps {
  message: string
  onRetry?: () => void
}

function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col items-center gap-3 text-center p-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-500"
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
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// DocumentViewer Component
// -----------------------------------------------------------------------------

export function DocumentViewer({
  imageUrl,
  alt = 'Documento',
  transform,
  onTransformChange,
  zoomConfig = DEFAULT_ZOOM_CONFIG,
  showControls = true,
  children,
  onImageLoad,
  className = '',
}: DocumentViewerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Image dimensions
  const [dimensions, setDimensions] = useState<DocumentDimensions>({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
  })

  // Panning state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)

  // Merged zoom config with defaults
  const mergedZoomConfig = useMemo(() => ({
    ...DEFAULT_ZOOM_CONFIG,
    ...zoomConfig,
  }), [zoomConfig])

  // -----------------------------------------------------------------------------
  // Image Loading
  // -----------------------------------------------------------------------------

  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)

    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current

      const newDimensions: DocumentDimensions = {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: container.clientWidth,
        renderedHeight: container.clientHeight,
      }

      setDimensions(newDimensions)
      onImageLoad?.(newDimensions)
    }
  }, [onImageLoad])

  const handleImageError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    setErrorMessage('Não foi possível carregar o documento')
  }, [])

  const handleRetry = useCallback(() => {
    setIsLoading(true)
    setHasError(false)
    setErrorMessage('')

    // Force image reload by updating src
    if (imageRef.current) {
      const currentSrc = imageRef.current.src
      imageRef.current.src = ''
      imageRef.current.src = currentSrc
    }
  }, [])

  // -----------------------------------------------------------------------------
  // Resize Handling
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current) return

    let resizeTimeout: ReturnType<typeof setTimeout>

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (containerRef.current && imageRef.current) {
          const newDimensions: DocumentDimensions = {
            naturalWidth: imageRef.current.naturalWidth,
            naturalHeight: imageRef.current.naturalHeight,
            renderedWidth: containerRef.current.clientWidth,
            renderedHeight: containerRef.current.clientHeight,
          }
          setDimensions(newDimensions)
        }
      }, RESIZE_DEBOUNCE_MS)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
    }
  }, [])

  // -----------------------------------------------------------------------------
  // Zoom Handlers
  // -----------------------------------------------------------------------------

  const handleZoomIn = useCallback(() => {
    const newScale = clamp(
      transform.scale + mergedZoomConfig.zoomStep,
      mergedZoomConfig.minScale,
      mergedZoomConfig.maxScale
    )

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), mergedZoomConfig.animationDuration)

    onTransformChange({
      ...transform,
      scale: newScale,
    })
  }, [transform, mergedZoomConfig, onTransformChange])

  const handleZoomOut = useCallback(() => {
    const newScale = clamp(
      transform.scale - mergedZoomConfig.zoomStep,
      mergedZoomConfig.minScale,
      mergedZoomConfig.maxScale
    )

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), mergedZoomConfig.animationDuration)

    onTransformChange({
      ...transform,
      scale: newScale,
    })
  }, [transform, mergedZoomConfig, onTransformChange])

  const handleResetZoom = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), mergedZoomConfig.animationDuration)

    onTransformChange(DEFAULT_TRANSFORM)
  }, [mergedZoomConfig.animationDuration, onTransformChange])

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      // Calculate cursor position relative to container
      const rect = container.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      // Calculate zoom change based on wheel delta
      const zoomDelta = -e.deltaY * WHEEL_ZOOM_SENSITIVITY * transform.scale
      const newScale = clamp(
        transform.scale + zoomDelta,
        mergedZoomConfig.minScale,
        mergedZoomConfig.maxScale
      )

      // Only update if scale changed
      if (newScale !== transform.scale) {
        const newTransform = zoomAtPoint(transform, newScale, cursorX, cursorY)
        onTransformChange(newTransform)
      }
    },
    [transform, mergedZoomConfig, onTransformChange]
  )

  // -----------------------------------------------------------------------------
  // Pan Handlers
  // -----------------------------------------------------------------------------

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return

      // Don't start panning if clicking on controls
      if ((e.target as HTMLElement).closest('.document-viewer-controls')) {
        return
      }

      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setPanOffset({ x: transform.x, y: transform.y })

      // Prevent text selection during drag
      e.preventDefault()
    },
    [transform.x, transform.y]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return

      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y

      // Only update if we've moved enough
      if (Math.abs(deltaX) > MIN_DRAG_DISTANCE || Math.abs(deltaY) > MIN_DRAG_DISTANCE) {
        onTransformChange({
          ...transform,
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY,
        })
      }
    },
    [isPanning, panStart, panOffset, transform, onTransformChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Handle mouse leaving the container while panning
  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
    }
  }, [isPanning])

  // -----------------------------------------------------------------------------
  // Touch Handlers (for mobile support)
  // -----------------------------------------------------------------------------

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        setIsPanning(true)
        setPanStart({ x: touch.clientX, y: touch.clientY })
        setPanOffset({ x: transform.x, y: transform.y })
      }
    },
    [transform.x, transform.y]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPanning || e.touches.length !== 1) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - panStart.x
      const deltaY = touch.clientY - panStart.y

      if (Math.abs(deltaX) > MIN_DRAG_DISTANCE || Math.abs(deltaY) > MIN_DRAG_DISTANCE) {
        onTransformChange({
          ...transform,
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY,
        })
      }
    },
    [isPanning, panStart, panOffset, transform, onTransformChange]
  )

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  // -----------------------------------------------------------------------------
  // Transform Style
  // -----------------------------------------------------------------------------

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
      transformOrigin: '0 0',
      transition: isAnimating
        ? `transform ${mergedZoomConfig.animationDuration}ms ease-out`
        : isPanning
        ? 'none'
        : 'transform 100ms ease-out',
    }),
    [transform, isAnimating, isPanning, mergedZoomConfig.animationDuration]
  )

  // -----------------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className={`
        document-viewer
        relative
        w-full
        h-full
        overflow-hidden
        bg-gray-100
        dark:bg-gray-900
        select-none
        ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}
        ${className}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="img"
      aria-label={alt}
      tabIndex={0}
    >
      {/* Loading State */}
      {isLoading && <LoadingSpinner />}

      {/* Error State */}
      {hasError && <ErrorDisplay message={errorMessage} onRetry={handleRetry} />}

      {/* Document Container */}
      <div
        className="document-viewer-content absolute inset-0"
        style={transformStyle}
      >
        {/* Document Image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          className={`
            max-w-none
            h-auto
            ${isLoading ? 'invisible' : 'visible'}
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />

        {/* Overlay Container for Bounding Boxes */}
        {!isLoading && !hasError && dimensions.renderedWidth > 0 && (
          <div
            className="document-viewer-overlay absolute top-0 left-0"
            style={{
              width: dimensions.renderedWidth,
              height: dimensions.renderedHeight,
            }}
          >
            {children}
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      {showControls && !isLoading && !hasError && (
        <ZoomControls
          scale={transform.scale}
          minScale={mergedZoomConfig.minScale}
          maxScale={mergedZoomConfig.maxScale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetZoom}
        />
      )}

      {/* Screen reader status for zoom level */}
      <div className="sr-only" role="status" aria-live="polite">
        Nível de zoom: {Math.round(transform.scale * 100)}%
      </div>
    </div>
  )
}

export default DocumentViewer
