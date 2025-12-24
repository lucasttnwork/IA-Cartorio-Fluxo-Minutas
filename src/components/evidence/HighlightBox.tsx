/**
 * HighlightBox Component
 *
 * Individual SVG rectangle component for highlighting regions on a document.
 * Features hover tooltip displaying label and confidence score.
 *
 * Used within BoundingBoxOverlay to render individual evidence regions.
 */

import { useState, useRef, useMemo, useCallback } from 'react'
import type {
  HighlightBoxProps,
  HighlightBoxStyle,
  TooltipPosition,
} from '../../types/evidence'
import { getBoxStyleForConfidence } from '../../types/evidence'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Default style values for the highlight box */
const DEFAULT_STYLE: HighlightBoxStyle = {
  strokeColor: '#3b82f6', // blue-500
  fillColor: '#3b82f6',
  fillOpacity: 0.1,
  strokeWidth: 2,
  borderRadius: 2,
}

/** Offset for tooltip positioning */
const TOOLTIP_OFFSET = 8

/** Animation duration for transitions */
const TRANSITION_DURATION = 150

// -----------------------------------------------------------------------------
// Tooltip Component
// -----------------------------------------------------------------------------

interface TooltipProps {
  label: string
  confidence: number
  value?: string
  position: TooltipPosition
  visible: boolean
}

function Tooltip({ label, confidence, value, position, visible }: TooltipProps) {
  if (!visible) return null

  const confidencePercent = Math.round(confidence * 100)

  // Determine confidence level for styling
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.8) return 'text-green-600 dark:text-green-400'
    if (conf >= 0.5) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceBgColor = (conf: number): string => {
    if (conf >= 0.8) return 'bg-green-100 dark:bg-green-900/30'
    if (conf >= 0.5) return 'bg-amber-100 dark:bg-amber-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  // Calculate tooltip offset based on placement
  const getPlacementStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 50,
      pointerEvents: 'none',
    }

    switch (position.placement) {
      case 'top':
        return {
          ...baseStyles,
          left: position.x,
          bottom: `calc(100% - ${position.y}px + ${TOOLTIP_OFFSET}px)`,
          transform: 'translateX(-50%)',
        }
      case 'bottom':
        return {
          ...baseStyles,
          left: position.x,
          top: position.y + TOOLTIP_OFFSET,
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          ...baseStyles,
          right: `calc(100% - ${position.x}px + ${TOOLTIP_OFFSET}px)`,
          top: position.y,
          transform: 'translateY(-50%)',
        }
      case 'right':
        return {
          ...baseStyles,
          left: position.x + TOOLTIP_OFFSET,
          top: position.y,
          transform: 'translateY(-50%)',
        }
      default:
        return baseStyles
    }
  }

  return (
    <div
      style={getPlacementStyles()}
      className="evidence-tooltip"
      role="tooltip"
      aria-live="polite"
    >
      <div className="glass-popover p-3 min-w-[120px] max-w-[250px]">
        {/* Label */}
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {label}
        </div>

        {/* Extracted value if provided */}
        {value && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
            {value}
          </div>
        )}

        {/* Confidence score */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Confiança:
          </span>
          <span
            className={`
              text-xs font-medium px-2 py-1 rounded-md
              ${getConfidenceBgColor(confidence)}
              ${getConfidenceColor(confidence)}
            `}
          >
            {confidencePercent}%
          </span>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// HighlightBox Component
// -----------------------------------------------------------------------------

export function HighlightBox({
  box,
  scale,
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style: styleOverrides,
  className = '',
}: HighlightBoxProps) {
  // Local hover state for internal tooltip management
  const [localHover, setLocalHover] = useState(false)
  const rectRef = useRef<SVGRectElement>(null)

  // Determine if tooltip should show (either controlled or local hover)
  const showTooltip = isHovered || localHover

  // Calculate the style based on confidence level, with overrides
  const computedStyle = useMemo((): HighlightBoxStyle => {
    // Start with confidence-based style
    const baseStyle = box.color
      ? { ...DEFAULT_STYLE, strokeColor: box.color, fillColor: box.color }
      : getBoxStyleForConfidence(box.confidence)

    // Apply any custom overrides
    return {
      ...baseStyle,
      ...styleOverrides,
    }
  }, [box.color, box.confidence, styleOverrides])

  // Calculate scaled coordinates
  const scaledCoords = useMemo(() => ({
    x: box.x * scale.x,
    y: box.y * scale.y,
    width: box.width * scale.x,
    height: box.height * scale.y,
  }), [box.x, box.y, box.width, box.height, scale.x, scale.y])

  // Calculate tooltip position
  const tooltipPosition = useMemo((): TooltipPosition => {
    const centerX = scaledCoords.x + scaledCoords.width / 2
    const topY = scaledCoords.y

    // Default to top placement
    return {
      x: centerX,
      y: topY,
      placement: 'top',
    }
  }, [scaledCoords])

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setLocalHover(true)
    onMouseEnter?.()
  }, [onMouseEnter])

  const handleMouseLeave = useCallback(() => {
    setLocalHover(false)
    onMouseLeave?.()
  }, [onMouseLeave])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }, [onClick])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }, [onClick])

  // Compute dynamic styles for different states
  const getStateStyles = (): {
    strokeWidth: number
    fillOpacity: number
    strokeColor: string
    fillColor: string
  } => {
    const base = {
      strokeWidth: computedStyle.strokeWidth,
      fillOpacity: computedStyle.fillOpacity,
      strokeColor: computedStyle.strokeColor,
      fillColor: computedStyle.fillColor,
    }

    if (isSelected) {
      return {
        ...base,
        strokeWidth: base.strokeWidth + 1,
        fillOpacity: base.fillOpacity + 0.1,
      }
    }

    if (showTooltip) {
      return {
        ...base,
        strokeWidth: base.strokeWidth + 0.5,
        fillOpacity: base.fillOpacity + 0.05,
      }
    }

    return base
  }

  const stateStyles = getStateStyles()

  return (
    <g
      className={`highlight-box-group ${className}`}
      data-box-id={box.id}
      data-field-name={box.fieldName}
    >
      {/* Main highlight rectangle */}
      <rect
        ref={rectRef}
        x={scaledCoords.x}
        y={scaledCoords.y}
        width={scaledCoords.width}
        height={scaledCoords.height}
        rx={computedStyle.borderRadius}
        ry={computedStyle.borderRadius}
        fill={stateStyles.fillColor}
        fillOpacity={stateStyles.fillOpacity}
        stroke={stateStyles.strokeColor}
        strokeWidth={stateStyles.strokeWidth}
        className={`
          highlight-box
          cursor-pointer
          transition-all
          ${isSelected ? 'highlight-box-selected' : ''}
          ${showTooltip ? 'highlight-box-hovered' : ''}
        `}
        style={{
          transitionDuration: `${TRANSITION_DURATION}ms`,
          transitionProperty: 'fill-opacity, stroke-width',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${box.label}: ${box.extractedText || 'Visualizar evidência'}. Confiança: ${Math.round(box.confidence * 100)}%`}
        aria-pressed={isSelected}
      />

      {/* Selection indicator ring when selected */}
      {isSelected && (
        <rect
          x={scaledCoords.x - 3}
          y={scaledCoords.y - 3}
          width={scaledCoords.width + 6}
          height={scaledCoords.height + 6}
          rx={(computedStyle.borderRadius || 0) + 2}
          ry={(computedStyle.borderRadius || 0) + 2}
          fill="none"
          stroke={stateStyles.strokeColor}
          strokeWidth={1}
          strokeDasharray="4 2"
          className="highlight-box-selection-ring animate-pulse-subtle"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Tooltip - rendered as foreignObject for HTML content */}
      {showTooltip && (
        <foreignObject
          x={0}
          y={0}
          width="100%"
          height="100%"
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <Tooltip
            label={box.label}
            confidence={box.confidence}
            value={box.extractedText}
            position={tooltipPosition}
            visible={showTooltip}
          />
        </foreignObject>
      )}
    </g>
  )
}

export default HighlightBox
