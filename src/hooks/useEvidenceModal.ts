/**
 * Custom hook for managing evidence modal state.
 * Provides state management for opening/closing the modal, navigating between
 * bounding boxes, handling zoom/pan transforms, and keyboard navigation.
 */

import { useReducer, useCallback, useEffect, useRef } from 'react'
import type {
  EvidenceItem,
  EvidenceModalState,
  EvidenceModalAction,
  EvidenceModalConfig,
  ViewerTransform,
  EvidenceBoundingBox,
  DocumentDimensions,
} from '../types/evidence'
import {
  DEFAULT_MODAL_CONFIG,
  DEFAULT_TRANSFORM,
  DEFAULT_ZOOM_CONFIG,
} from '../types/evidence'

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: EvidenceModalState = {
  isOpen: false,
  currentEvidence: null,
  selectedBoxIndex: -1,
  transform: DEFAULT_TRANSFORM,
  isLoading: false,
  error: null,
}

// -----------------------------------------------------------------------------
// Reducer
// -----------------------------------------------------------------------------

function evidenceModalReducer(
  state: EvidenceModalState,
  action: EvidenceModalAction
): EvidenceModalState {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        isOpen: true,
        currentEvidence: action.payload,
        selectedBoxIndex: action.payload.boundingBoxes.length > 0 ? 0 : -1,
        transform: DEFAULT_TRANSFORM,
        isLoading: false,
        error: null,
      }

    case 'CLOSE':
      return {
        ...initialState,
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }

    case 'SELECT_BOX': {
      const boxCount = state.currentEvidence?.boundingBoxes.length ?? 0
      const newIndex = Math.max(-1, Math.min(action.payload, boxCount - 1))
      return {
        ...state,
        selectedBoxIndex: newIndex,
      }
    }

    case 'NEXT_BOX': {
      const boxCount = state.currentEvidence?.boundingBoxes.length ?? 0
      if (boxCount === 0) return state
      const nextIndex = (state.selectedBoxIndex + 1) % boxCount
      return {
        ...state,
        selectedBoxIndex: nextIndex,
      }
    }

    case 'PREV_BOX': {
      const boxCount = state.currentEvidence?.boundingBoxes.length ?? 0
      if (boxCount === 0) return state
      const prevIndex = state.selectedBoxIndex <= 0
        ? boxCount - 1
        : state.selectedBoxIndex - 1
      return {
        ...state,
        selectedBoxIndex: prevIndex,
      }
    }

    case 'SET_TRANSFORM':
      return {
        ...state,
        transform: action.payload,
      }

    case 'ZOOM_IN': {
      const newScale = Math.min(
        state.transform.scale + DEFAULT_ZOOM_CONFIG.zoomStep,
        DEFAULT_ZOOM_CONFIG.maxScale
      )
      return {
        ...state,
        transform: {
          ...state.transform,
          scale: newScale,
        },
      }
    }

    case 'ZOOM_OUT': {
      const newScale = Math.max(
        state.transform.scale - DEFAULT_ZOOM_CONFIG.zoomStep,
        DEFAULT_ZOOM_CONFIG.minScale
      )
      return {
        ...state,
        transform: {
          ...state.transform,
          scale: newScale,
        },
      }
    }

    case 'RESET_ZOOM':
      return {
        ...state,
        transform: DEFAULT_TRANSFORM,
      }

    case 'CENTER_ON_BOX': {
      // This action is handled with additional logic in the hook
      // since it requires document dimensions
      return {
        ...state,
        selectedBoxIndex: action.payload,
      }
    }

    case 'SET_PAGE':
      // Page navigation would update the evidence item
      // For now, just return current state as multi-page support
      // will be handled when switching evidence items
      return state

    default:
      return state
  }
}

// -----------------------------------------------------------------------------
// Hook Options
// -----------------------------------------------------------------------------

export interface UseEvidenceModalOptions {
  /** Optional modal configuration overrides */
  config?: Partial<EvidenceModalConfig>
  /** Callback when modal opens */
  onOpen?: (evidence: EvidenceItem) => void
  /** Callback when modal closes */
  onClose?: () => void
  /** Callback when a bounding box is selected */
  onBoxSelect?: (box: EvidenceBoundingBox, index: number) => void
  /** Callback when transform changes */
  onTransformChange?: (transform: ViewerTransform) => void
}

// -----------------------------------------------------------------------------
// Hook Return Type
// -----------------------------------------------------------------------------

export interface UseEvidenceModalReturn {
  /** Current modal state */
  state: EvidenceModalState
  /** Merged configuration */
  config: EvidenceModalConfig
  /** Open the modal with evidence data */
  openModal: (evidence: EvidenceItem) => void
  /** Close the modal */
  closeModal: () => void
  /** Select a specific bounding box by index */
  selectBox: (index: number) => void
  /** Navigate to the next bounding box */
  nextBox: () => void
  /** Navigate to the previous bounding box */
  prevBox: () => void
  /** Set the viewer transform (pan/zoom) */
  setTransform: (transform: ViewerTransform) => void
  /** Zoom in */
  zoomIn: () => void
  /** Zoom out */
  zoomOut: () => void
  /** Reset zoom to default */
  resetZoom: () => void
  /** Center view on a specific bounding box */
  centerOnBox: (index: number, dimensions?: DocumentDimensions) => void
  /** Set loading state */
  setLoading: (loading: boolean) => void
  /** Set error state */
  setError: (error: string | null) => void
  /** Get the currently selected bounding box */
  selectedBox: EvidenceBoundingBox | null
  /** Reference to track the previously focused element for focus restoration */
  previousFocusRef: React.RefObject<HTMLElement | null>
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useEvidenceModal(
  options: UseEvidenceModalOptions = {}
): UseEvidenceModalReturn {
  const { config: configOverrides, onOpen, onClose, onBoxSelect, onTransformChange } = options

  // Merge configuration with defaults
  const config: EvidenceModalConfig = {
    ...DEFAULT_MODAL_CONFIG,
    ...configOverrides,
  }

  // State management with reducer
  const [state, dispatch] = useReducer(evidenceModalReducer, initialState)

  // Track previously focused element for focus restoration
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // -----------------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------------

  const openModal = useCallback((evidence: EvidenceItem) => {
    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement | null
    dispatch({ type: 'OPEN', payload: evidence })
    onOpen?.(evidence)
  }, [onOpen])

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE' })
    // Restore focus to the previously focused element
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus()
    }
    onClose?.()
  }, [onClose])

  const selectBox = useCallback((index: number) => {
    dispatch({ type: 'SELECT_BOX', payload: index })
    const box = state.currentEvidence?.boundingBoxes[index]
    if (box) {
      onBoxSelect?.(box, index)
    }
  }, [state.currentEvidence?.boundingBoxes, onBoxSelect])

  const nextBox = useCallback(() => {
    dispatch({ type: 'NEXT_BOX' })
  }, [])

  const prevBox = useCallback(() => {
    dispatch({ type: 'PREV_BOX' })
  }, [])

  const setTransform = useCallback((transform: ViewerTransform) => {
    dispatch({ type: 'SET_TRANSFORM', payload: transform })
    onTransformChange?.(transform)
  }, [onTransformChange])

  const zoomIn = useCallback(() => {
    dispatch({ type: 'ZOOM_IN' })
  }, [])

  const zoomOut = useCallback(() => {
    dispatch({ type: 'ZOOM_OUT' })
  }, [])

  const resetZoom = useCallback(() => {
    dispatch({ type: 'RESET_ZOOM' })
  }, [])

  const centerOnBox = useCallback((index: number, dimensions?: DocumentDimensions) => {
    if (!state.currentEvidence || !dimensions) {
      dispatch({ type: 'CENTER_ON_BOX', payload: index })
      return
    }

    const box = state.currentEvidence.boundingBoxes[index]
    if (!box) return

    // Calculate the center of the bounding box in rendered coordinates
    const scaleX = dimensions.renderedWidth / dimensions.naturalWidth
    const scaleY = dimensions.renderedHeight / dimensions.naturalHeight

    const boxCenterX = (box.x + box.width / 2) * scaleX
    const boxCenterY = (box.y + box.height / 2) * scaleY

    // Calculate the offset to center the box in the viewport
    const viewportCenterX = dimensions.renderedWidth / 2
    const viewportCenterY = dimensions.renderedHeight / 2

    const newTransform: ViewerTransform = {
      x: viewportCenterX - boxCenterX,
      y: viewportCenterY - boxCenterY,
      scale: Math.min(2, DEFAULT_ZOOM_CONFIG.maxScale), // Zoom in a bit when centering
    }

    dispatch({ type: 'SET_TRANSFORM', payload: newTransform })
    dispatch({ type: 'SELECT_BOX', payload: index })
    onTransformChange?.(newTransform)
  }, [state.currentEvidence, onTransformChange])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  // -----------------------------------------------------------------------------
  // Keyboard Navigation
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!state.isOpen || !config.enableKeyboardNavigation) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if focus is in an input element
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          closeModal()
          break

        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          nextBox()
          break

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          prevBox()
          break

        case '+':
        case '=':
          event.preventDefault()
          zoomIn()
          break

        case '-':
        case '_':
          event.preventDefault()
          zoomOut()
          break

        case '0':
          event.preventDefault()
          resetZoom()
          break

        case 'Home':
          event.preventDefault()
          selectBox(0)
          break

        case 'End':
          event.preventDefault()
          if (state.currentEvidence) {
            selectBox(state.currentEvidence.boundingBoxes.length - 1)
          }
          break

        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    state.isOpen,
    state.currentEvidence,
    config.enableKeyboardNavigation,
    closeModal,
    nextBox,
    prevBox,
    zoomIn,
    zoomOut,
    resetZoom,
    selectBox,
  ])

  // -----------------------------------------------------------------------------
  // Derived State
  // -----------------------------------------------------------------------------

  const selectedBox: EvidenceBoundingBox | null =
    state.currentEvidence && state.selectedBoxIndex >= 0
      ? state.currentEvidence.boundingBoxes[state.selectedBoxIndex] ?? null
      : null

  // -----------------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------------

  return {
    state,
    config,
    openModal,
    closeModal,
    selectBox,
    nextBox,
    prevBox,
    setTransform,
    zoomIn,
    zoomOut,
    resetZoom,
    centerOnBox,
    setLoading,
    setError,
    selectedBox,
    previousFocusRef,
  }
}

export default useEvidenceModal
