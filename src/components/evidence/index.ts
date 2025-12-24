/**
 * Evidence Components Barrel Export
 *
 * Re-exports all evidence modal related components for convenient importing.
 *
 * Usage:
 * import { EvidenceModal, DocumentViewer, BoundingBoxOverlay, HighlightBox } from '@/components/evidence'
 */

// Main modal container component with portal, backdrop, and focus trap
export { default as EvidenceModal } from './EvidenceModal'

// Document viewer with pan/zoom controls using CSS transforms
export { default as DocumentViewer } from './DocumentViewer'

// SVG overlay container for rendering multiple bounding boxes
export { default as BoundingBoxOverlay } from './BoundingBoxOverlay'

// Individual highlight box component with hover tooltip
export { default as HighlightBox } from './HighlightBox'
