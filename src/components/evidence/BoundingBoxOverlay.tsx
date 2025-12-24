/**
 * BoundingBoxOverlay Component
 *
 * SVG container component that renders multiple HighlightBox components
 * as an overlay on top of a document image. Handles coordinate scaling
 * from natural document dimensions to rendered viewport size.
 *
 * Features:
 * - Scales bounding box coordinates to match rendered document size
 * - Manages selection and hover state for child boxes
 * - Provides smooth animations for state transitions
 * - Supports keyboard navigation between boxes
 */

import { useMemo, useCallback } from 'react'
import type {
  BoundingBoxOverlayProps,
  EvidenceBoundingBox,
} from '../../types/evidence'
import { HighlightBox } from './HighlightBox'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Minimum dimension threshold to prevent rendering issues */
const MIN_DIMENSION = 1

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Calculate scale factors for converting from natural to rendered coordinates
 */
function calculateScale(
  naturalWidth: number,
  naturalHeight: number,
  renderedWidth: number,
  renderedHeight: number
): { x: number; y: number } {
  // Prevent division by zero
  const safeNaturalWidth = Math.max(naturalWidth, MIN_DIMENSION)
  const safeNaturalHeight = Math.max(naturalHeight, MIN_DIMENSION)

  return {
    x: renderedWidth / safeNaturalWidth,
    y: renderedHeight / safeNaturalHeight,
  }
}

/**
 * Sort boxes by position for consistent tab order
 * Primary sort: top to bottom (y coordinate)
 * Secondary sort: left to right (x coordinate)
 */
function sortBoxesByPosition(boxes: EvidenceBoundingBox[]): EvidenceBoundingBox[] {
  return [...boxes].sort((a, b) => {
    // First compare by y position (top to bottom)
    if (Math.abs(a.y - b.y) > 10) {
      return a.y - b.y
    }
    // If y positions are similar, compare by x (left to right)
    return a.x - b.x
  })
}

// -----------------------------------------------------------------------------
// BoundingBoxOverlay Component
// -----------------------------------------------------------------------------

export function BoundingBoxOverlay({
  boxes,
  dimensions,
  selectedIndex,
  hoveredId,
  onBoxClick,
  onBoxHover,
  className = '',
}: BoundingBoxOverlayProps) {
  // Calculate scale factors based on document dimensions
  const scale = useMemo(() => {
    return calculateScale(
      dimensions.naturalWidth,
      dimensions.naturalHeight,
      dimensions.renderedWidth,
      dimensions.renderedHeight
    )
  }, [
    dimensions.naturalWidth,
    dimensions.naturalHeight,
    dimensions.renderedWidth,
    dimensions.renderedHeight,
  ])

  // Sort boxes for consistent rendering order
  const sortedBoxes = useMemo(() => sortBoxesByPosition(boxes), [boxes])

  // Create click handler for each box
  const handleBoxClick = useCallback(
    (boxId: string, index: number) => {
      onBoxClick?.(boxId, index)
    },
    [onBoxClick]
  )

  // Create hover enter handler
  const handleBoxMouseEnter = useCallback(
    (boxId: string) => {
      onBoxHover?.(boxId)
    },
    [onBoxHover]
  )

  // Create hover leave handler
  const handleBoxMouseLeave = useCallback(() => {
    onBoxHover?.(null)
  }, [onBoxHover])

  // Don't render if dimensions are invalid
  if (
    dimensions.renderedWidth < MIN_DIMENSION ||
    dimensions.renderedHeight < MIN_DIMENSION
  ) {
    return null
  }

  // Don't render if no boxes
  if (boxes.length === 0) {
    return null
  }

  return (
    <svg
      className={`bounding-box-overlay ${className}`}
      width={dimensions.renderedWidth}
      height={dimensions.renderedHeight}
      viewBox={`0 0 ${dimensions.renderedWidth} ${dimensions.renderedHeight}`}
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none', // Allow clicks to pass through to document
        overflow: 'visible',
      }}
      role="img"
      aria-label={`Documento com ${boxes.length} região${boxes.length !== 1 ? 's' : ''} destacada${boxes.length !== 1 ? 's' : ''}`}
    >
      {/* Defs for reusable elements like filters */}
      <defs>
        {/* Subtle glow effect for selected boxes */}
        <filter id="box-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Drop shadow for tooltips */}
        <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Render all bounding boxes */}
      <g className="bounding-boxes" style={{ pointerEvents: 'auto' }}>
        {sortedBoxes.map((box) => {
          // Find the original index for selection comparison
          const originalIndex = boxes.findIndex((b) => b.id === box.id)
          const isSelected = selectedIndex === originalIndex
          const isHovered = hoveredId === box.id

          return (
            <HighlightBox
              key={box.id}
              box={box}
              scale={scale}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleBoxClick(box.id, originalIndex)}
              onMouseEnter={() => handleBoxMouseEnter(box.id)}
              onMouseLeave={handleBoxMouseLeave}
            />
          )
        })}
      </g>

      {/* Screen reader announcement for box count */}
      <text
        x="-9999"
        y="-9999"
        aria-hidden="false"
        role="status"
        className="sr-only"
      >
        {boxes.length} evidência{boxes.length !== 1 ? 's' : ''} encontrada{boxes.length !== 1 ? 's' : ''}
      </text>
    </svg>
  )
}

export default BoundingBoxOverlay
