// ============================================================================
// Evidence Modal Types
// Types and interfaces for the evidence modal component system with
// SVG-based bounding box overlays for document highlighting
// ============================================================================

import type { BoundingBox, DocumentType } from './index'

// -----------------------------------------------------------------------------
// Bounding Box Types
// -----------------------------------------------------------------------------

/**
 * Extended bounding box with additional metadata for visualization
 */
export interface EvidenceBoundingBox extends BoundingBox {
  /** Unique identifier for the bounding box */
  id: string
  /** Page number where the box is located (1-indexed) */
  page: number
  /** Label to display in tooltip */
  label: string
  /** Confidence score (0-1) for the extraction */
  confidence: number
  /** Optional color override for the box */
  color?: string
  /** Field name this box is associated with */
  fieldName?: string
  /** The extracted text content within this box */
  extractedText?: string
}

/**
 * Highlight box state for interaction handling
 */
export interface HighlightBoxState {
  /** Whether the box is currently hovered */
  isHovered: boolean
  /** Whether the box is currently selected/focused */
  isSelected: boolean
  /** Whether the box is actively being navigated to */
  isNavigating: boolean
}

/**
 * Highlight box style configuration
 */
export interface HighlightBoxStyle {
  /** Stroke color for the box border */
  strokeColor: string
  /** Fill color for the box background */
  fillColor: string
  /** Opacity for the fill (0-1) */
  fillOpacity: number
  /** Stroke width in pixels */
  strokeWidth: number
  /** Border radius for rounded corners */
  borderRadius?: number
}

// -----------------------------------------------------------------------------
// Document Viewer Types
// -----------------------------------------------------------------------------

/**
 * Transform state for pan/zoom functionality
 */
export interface ViewerTransform {
  /** X translation offset */
  x: number
  /** Y translation offset */
  y: number
  /** Zoom scale factor (1 = 100%) */
  scale: number
}

/**
 * Document dimensions for proper scaling
 */
export interface DocumentDimensions {
  /** Natural width of the document image */
  naturalWidth: number
  /** Natural height of the document image */
  naturalHeight: number
  /** Rendered width in the viewport */
  renderedWidth: number
  /** Rendered height in the viewport */
  renderedHeight: number
}

/**
 * Zoom configuration options
 */
export interface ZoomConfig {
  /** Minimum zoom level */
  minScale: number
  /** Maximum zoom level */
  maxScale: number
  /** Zoom step increment */
  zoomStep: number
  /** Duration for zoom animations in ms */
  animationDuration: number
}

/**
 * Pan constraints for the document viewer
 */
export interface PanConstraints {
  /** Minimum X position */
  minX: number
  /** Maximum X position */
  maxX: number
  /** Minimum Y position */
  minY: number
  /** Maximum Y position */
  maxY: number
}

// -----------------------------------------------------------------------------
// Modal Types
// -----------------------------------------------------------------------------

/**
 * Evidence item data for display in the modal
 */
export interface EvidenceItem {
  /** Unique identifier */
  id: string
  /** Document ID this evidence belongs to */
  documentId: string
  /** URL to the document image */
  imageUrl: string
  /** Document type */
  documentType?: DocumentType
  /** Original document filename */
  documentName: string
  /** Page number (1-indexed) */
  pageNumber: number
  /** Total pages in the document */
  totalPages: number
  /** Bounding boxes to highlight */
  boundingBoxes: EvidenceBoundingBox[]
  /** Entity type this evidence is for */
  entityType?: 'person' | 'property'
  /** Entity ID this evidence is for */
  entityId?: string
  /** Field name being evidenced */
  fieldName?: string
  /** The extracted/verified value */
  extractedValue?: string
}

/**
 * Modal configuration options
 */
export interface EvidenceModalConfig {
  /** Whether to show zoom controls */
  showZoomControls?: boolean
  /** Whether to enable keyboard navigation */
  enableKeyboardNavigation?: boolean
  /** Whether to show box navigation controls */
  showBoxNavigation?: boolean
  /** Whether to show page navigation for multi-page docs */
  showPageNavigation?: boolean
  /** Initial zoom level */
  initialZoom?: number
  /** Debounce time for resize handling in ms */
  resizeDebounceMs?: number
  /** Whether to animate transitions */
  enableAnimations?: boolean
  /** Theme for the modal */
  theme?: 'light' | 'dark'
}

/**
 * Modal state management
 */
export interface EvidenceModalState {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Currently displayed evidence item */
  currentEvidence: EvidenceItem | null
  /** Index of the currently selected bounding box */
  selectedBoxIndex: number
  /** Current viewer transform state */
  transform: ViewerTransform
  /** Whether the modal is loading content */
  isLoading: boolean
  /** Error message if any */
  error: string | null
}

/**
 * Modal action types for state management
 */
export type EvidenceModalAction =
  | { type: 'OPEN'; payload: EvidenceItem }
  | { type: 'CLOSE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_BOX'; payload: number }
  | { type: 'NEXT_BOX' }
  | { type: 'PREV_BOX' }
  | { type: 'SET_TRANSFORM'; payload: ViewerTransform }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET_ZOOM' }
  | { type: 'CENTER_ON_BOX'; payload: number }
  | { type: 'SET_PAGE'; payload: number }

// -----------------------------------------------------------------------------
// Tooltip Types
// -----------------------------------------------------------------------------

/**
 * Tooltip position configuration
 */
export interface TooltipPosition {
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Preferred placement relative to the box */
  placement: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Tooltip content for bounding box hover
 */
export interface BoxTooltipContent {
  /** Field label */
  label: string
  /** Extracted value */
  value?: string
  /** Confidence score (0-1) */
  confidence: number
  /** Source of the extraction */
  source?: 'ocr' | 'llm' | 'consensus'
}

// -----------------------------------------------------------------------------
// Event Callback Types
// -----------------------------------------------------------------------------

/**
 * Callback for when a bounding box is clicked
 */
export type OnBoxClickHandler = (boxId: string, boxIndex: number) => void

/**
 * Callback for when a bounding box is hovered
 */
export type OnBoxHoverHandler = (boxId: string | null) => void

/**
 * Callback for when the modal is closed
 */
export type OnModalCloseHandler = () => void

/**
 * Callback for transform changes
 */
export type OnTransformChangeHandler = (transform: ViewerTransform) => void

// -----------------------------------------------------------------------------
// Props Types for Components
// -----------------------------------------------------------------------------

/**
 * Props for the EvidenceModal component
 */
export interface EvidenceModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Evidence item to display */
  evidence: EvidenceItem | null
  /** Callback when modal closes */
  onClose: OnModalCloseHandler
  /** Optional configuration */
  config?: EvidenceModalConfig
  /** Custom class name */
  className?: string
}

/**
 * Props for the DocumentViewer component
 */
export interface DocumentViewerProps {
  /** URL to the document image */
  imageUrl: string
  /** Alt text for the image */
  alt?: string
  /** Current transform state */
  transform: ViewerTransform
  /** Callback for transform changes */
  onTransformChange: OnTransformChangeHandler
  /** Zoom configuration */
  zoomConfig?: ZoomConfig
  /** Whether to show zoom controls */
  showControls?: boolean
  /** Children to render as overlay (e.g., bounding boxes) */
  children?: React.ReactNode
  /** Callback when image loads */
  onImageLoad?: (dimensions: DocumentDimensions) => void
  /** Custom class name */
  className?: string
}

/**
 * Props for the BoundingBoxOverlay component
 */
export interface BoundingBoxOverlayProps {
  /** Bounding boxes to render */
  boxes: EvidenceBoundingBox[]
  /** Document dimensions for scaling */
  dimensions: DocumentDimensions
  /** Index of the currently selected box */
  selectedIndex?: number
  /** ID of the currently hovered box */
  hoveredId?: string | null
  /** Callback when a box is clicked */
  onBoxClick?: OnBoxClickHandler
  /** Callback when a box is hovered */
  onBoxHover?: OnBoxHoverHandler
  /** Custom class name */
  className?: string
}

/**
 * Props for the HighlightBox component
 */
export interface HighlightBoxProps {
  /** Bounding box data */
  box: EvidenceBoundingBox
  /** Scale factor for coordinate conversion */
  scale: { x: number; y: number }
  /** Whether this box is selected */
  isSelected?: boolean
  /** Whether this box is hovered */
  isHovered?: boolean
  /** Callback when clicked */
  onClick?: () => void
  /** Callback when mouse enters */
  onMouseEnter?: () => void
  /** Callback when mouse leaves */
  onMouseLeave?: () => void
  /** Custom style overrides */
  style?: Partial<HighlightBoxStyle>
  /** Custom class name */
  className?: string
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

/**
 * Default zoom configuration
 */
export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  minScale: 0.5,
  maxScale: 4,
  zoomStep: 0.25,
  animationDuration: 200,
}

/**
 * Default modal configuration
 */
export const DEFAULT_MODAL_CONFIG: EvidenceModalConfig = {
  showZoomControls: true,
  enableKeyboardNavigation: true,
  showBoxNavigation: true,
  showPageNavigation: true,
  initialZoom: 1,
  resizeDebounceMs: 150,
  enableAnimations: true,
  theme: 'light',
}

/**
 * Default initial transform state
 */
export const DEFAULT_TRANSFORM: ViewerTransform = {
  x: 0,
  y: 0,
  scale: 1,
}

/**
 * Default highlight box styles by confidence level
 */
export const DEFAULT_BOX_STYLES: Record<'high' | 'medium' | 'low', HighlightBoxStyle> = {
  high: {
    strokeColor: '#22c55e', // green-500
    fillColor: '#22c55e',
    fillOpacity: 0.1,
    strokeWidth: 2,
    borderRadius: 2,
  },
  medium: {
    strokeColor: '#f59e0b', // amber-500
    fillColor: '#f59e0b',
    fillOpacity: 0.1,
    strokeWidth: 2,
    borderRadius: 2,
  },
  low: {
    strokeColor: '#ef4444', // red-500
    fillColor: '#ef4444',
    fillOpacity: 0.1,
    strokeWidth: 2,
    borderRadius: 2,
  },
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

/**
 * Confidence level derived from score
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Get confidence level from numeric score
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

/**
 * Get box style based on confidence level
 */
export function getBoxStyleForConfidence(confidence: number): HighlightBoxStyle {
  return DEFAULT_BOX_STYLES[getConfidenceLevel(confidence)]
}
