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
  isOverridden?: boolean
  overriddenValue?: string
  onEdit?: () => void
}

function Tooltip({
  label,
  confidence,
  value,
  position,
  visible,
  isOverridden,
  overriddenValue,
  onEdit
}: TooltipProps) {
  if (!visible) return null

  const confidencePercent = Math.round(confidence * 100)
  const displayValue = isOverridden ? overriddenValue : value

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
      <div className="glass-popover p-3 min-w-[120px] max-w-[280px]">
        {/* Label */}
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {label}
        </div>

        {/* Extracted value if provided */}
        {displayValue && (
          <div className="mt-1">
            <div className={`text-xs break-words ${isOverridden ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              {displayValue}
            </div>
            {isOverridden && (
              <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5 italic">
                Original: {value || '-'}
              </div>
            )}
          </div>
        )}

        {/* Override indicator badge */}
        {isOverridden && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Valor corrigido
          </div>
        )}

        {/* Bottom row: confidence + edit button */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Confidence score */}
          <div className="flex items-center gap-1.5">
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

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
              title="Corrigir valor"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar
            </button>
          )}
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
  onOverride,
  style: styleOverrides,
  className = '',
}: HighlightBoxProps) {
  // Local hover state for internal tooltip management
  const [localHover, setLocalHover] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
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

  // Handle edit mode
  const handleEditClick = useCallback(() => {
    const currentValue = box.isOverridden ? box.overriddenValue : box.extractedText
    setEditValue(currentValue || '')
    setIsEditing(true)
  }, [box.isOverridden, box.overriddenValue, box.extractedText])

  const handleEditSave = useCallback(() => {
    if (editValue.trim() && onOverride) {
      onOverride(editValue.trim())
    }
    setIsEditing(false)
  }, [editValue, onOverride])

  const handleEditCancel = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
  }, [])

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
      {showTooltip && !isEditing && (
        <foreignObject
          x={0}
          y={0}
          width="100%"
          height="100%"
          style={{ overflow: 'visible', pointerEvents: 'auto' }}
        >
          <Tooltip
            label={box.label}
            confidence={box.confidence}
            value={box.extractedText}
            position={tooltipPosition}
            visible={showTooltip}
            isOverridden={box.isOverridden}
            overriddenValue={box.overriddenValue}
            onEdit={onOverride ? handleEditClick : undefined}
          />
        </foreignObject>
      )}

      {/* Edit Modal - rendered as foreignObject */}
      {isEditing && (
        <foreignObject
          x={0}
          y={0}
          width="100%"
          height="100%"
          style={{ overflow: 'visible', pointerEvents: 'auto' }}
        >
          <div
            style={{
              position: 'absolute',
              left: tooltipPosition.x,
              top: tooltipPosition.y - 100,
              transform: 'translateX(-50%)',
              zIndex: 100,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-popover p-3 min-w-[250px] max-w-[350px]">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Corrigir valor
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {box.label}
              </div>

              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    handleEditSave()
                  } else if (e.key === 'Escape') {
                    e.stopPropagation()
                    handleEditCancel()
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o valor correto"
                autoFocus
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEditSave}
                  className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs rounded transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export default HighlightBox
