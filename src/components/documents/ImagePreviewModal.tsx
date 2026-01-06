/**
 * ImagePreviewModal Component
 *
 * A modal component for previewing uploaded image documents.
 * Features pan/zoom controls, image information display, and download capability.
 *
 * Features:
 * - Full-screen image preview
 * - Zoom controls (zoom in, zoom out, reset, fit to screen)
 * - Pan/drag to navigate zoomed images
 * - Image metadata display (dimensions, file size, type)
 * - Download button
 * - Keyboard navigation (arrow keys for pan, +/- for zoom, Escape to close)
 * - Touch support for mobile devices
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Document } from '../../types'

export interface ImagePreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** The document to preview */
  document: Document | null
  /** The signed URL for the image */
  imageUrl: string | null
  /** Optional callback when download is clicked */
  onDownload?: (document: Document) => void
}

interface Transform {
  x: number
  y: number
  scale: number
}

const MIN_SCALE = 0.25
const MAX_SCALE = 5
const ZOOM_STEP = 0.25

/**
 * Format file size to human readable
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get image type label
 */
const getImageTypeLabel = (mimeType: string): string => {
  const types: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/tiff': 'TIFF',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  }
  return types[mimeType] || 'Imagem'
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  document,
  imageUrl,
  onDownload,
}: ImagePreviewModalProps) {
  // Image state
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  // Transform state
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransform({ x: 0, y: 0, scale: 1 })
      setIsLoading(true)
      setHasError(false)
      setImageDimensions({ width: 0, height: 0 })
    }
  }, [isOpen, imageUrl])

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
    }
  }, [])

  // Handle image error
  const handleImageError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + ZOOM_STEP, MAX_SCALE),
    }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - ZOOM_STEP, MIN_SCALE),
    }))
  }, [])

  const handleResetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const imageWidth = imageRef.current.naturalWidth
    const imageHeight = imageRef.current.naturalHeight

    const scaleX = containerWidth / imageWidth
    const scaleY = containerHeight / imageHeight
    const scale = Math.min(scaleX, scaleY, 1) * 0.9 // 90% of max fit

    setTransform({ x: 0, y: 0, scale })
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001 * transform.scale
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta))
    setTransform((prev) => ({ ...prev, scale: newScale }))
  }, [transform.scale])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    e.preventDefault()
  }, [transform.x, transform.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    }))
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          handleResetZoom()
          break
        case 'ArrowUp':
          setTransform((prev) => ({ ...prev, y: prev.y + 50 }))
          break
        case 'ArrowDown':
          setTransform((prev) => ({ ...prev, y: prev.y - 50 }))
          break
        case 'ArrowLeft':
          setTransform((prev) => ({ ...prev, x: prev.x + 50 }))
          break
        case 'ArrowRight':
          setTransform((prev) => ({ ...prev, x: prev.x - 50 }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom])

  // Handle download
  const handleDownload = useCallback(() => {
    if (document && imageUrl) {
      const link = window.document.createElement('a')
      link.href = imageUrl
      link.download = document.original_name
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      onDownload?.(document)
    }
  }, [document, imageUrl, onDownload])

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[95vh] p-0 gap-0 bg-gray-900 border-gray-700 flex flex-col [&>button]:hidden">
        {/* Header - Navbar minimalista */}
        <DialogHeader className="h-12 px-4 border-b border-gray-700/50 flex flex-row items-center justify-between gap-3 bg-gray-900/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <DialogTitle className="text-sm text-white truncate font-medium">
              {document.original_name}
            </DialogTitle>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 shrink-0">
              <span>{getImageTypeLabel(document.mime_type)}</span>
              <span className="text-gray-600">•</span>
              <span>{formatFileSize(document.file_size)}</span>
              {imageDimensions.width > 0 && (
                <>
                  <span className="text-gray-600">•</span>
                  <span>{imageDimensions.width}x{imageDimensions.height}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              title="Baixar imagem"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              title="Fechar (Esc)"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Image Container */}
        <div
          ref={containerRef}
          className={cn(
            "flex-1 relative overflow-hidden bg-gray-950",
            isPanning ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isLoading && imageUrl && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">
                    Carregando imagem...
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {hasError && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3 text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
                    <XMarkIcon className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm text-gray-400">
                    Não foi possível carregar a imagem
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsLoading(true)
                      setHasError(false)
                    }}
                    className="mt-2 text-gray-300 border-gray-600 hover:bg-gray-800"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image */}
          {imageUrl && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transition: isPanning ? 'none' : 'transform 150ms ease-out',
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={document.original_name}
                className={cn(
                  "max-w-none select-none",
                  isLoading && "invisible"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        {!isLoading && !hasError && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl p-1 border border-gray-700">
            {/* Zoom Out */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={transform.scale <= MIN_SCALE}
              className="h-9 w-9 text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
              title="Diminuir zoom (-)"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </Button>

            {/* Zoom Level */}
            <span className="min-w-[56px] text-center text-sm font-medium text-gray-300 tabular-nums">
              {Math.round(transform.scale * 100)}%
            </span>

            {/* Zoom In */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={transform.scale >= MAX_SCALE}
              className="h-9 w-9 text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
              title="Aumentar zoom (+)"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-600 mx-1" />

            {/* Fit to Screen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFitToScreen}
              className="h-9 w-9 text-gray-300 hover:text-white hover:bg-gray-700"
              title="Ajustar na tela"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </Button>

            {/* Reset */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-9 px-3 text-gray-300 hover:text-white hover:bg-gray-700"
              title="Redefinir zoom (0)"
            >
              100%
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
