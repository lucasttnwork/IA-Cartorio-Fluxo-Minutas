
🔧 Tool: Glob
Input: {
  "pattern": "**/*.{tsx,ts,jsx,js}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/package.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.css"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\main.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/components/**/*.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\case\\CreateCaseModal.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\styles\\index.css"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/App.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

# Specification: Evidence Modal with Document Highlighting

## 1. Problem

Users need to view document evidence with visual highlighting of relevant regions to verify extracted data. Currently, there's no way to display document images with bounding boxes highlighting where specific information was extracted, making it difficult to validate OCR/LLM extraction results.

## 2. Solution

Create a reusable modal component system with SVG-based bounding box overlays that displays document images with highlighted evidence regions, supporting pan/zoom, multi-box navigation, and keyboard accessibility.

## 3. Acceptance Criteria

- **GIVEN** a document with extracted evidence data, **WHEN** the EvidenceModal is opened, **THEN** the document image displays with SVG bounding boxes highlighting relevant regions
- **GIVEN** multiple bounding boxes on a document, **WHEN** the user clicks on a box or uses arrow keys, **THEN** the view centers and zooms to the selected box with smooth animation
- **GIVEN** the modal is open, **WHEN** the user presses ESC or clicks the backdrop, **THEN** the modal closes with proper focus restoration
- **GIVEN** a responsive viewport, **WHEN** the window is resized, **THEN** bounding box coordinates scale correctly to maintain accuracy (debounced at 150ms)
- **GIVEN** a bounding box with a label, **WHEN** the user hovers over the box, **THEN** a tooltip displays the label and confidence score

## 4. Files to Modify

| File | Purpose | Action |
|------|---------|--------|
| src/components/evidence/EvidenceModal.tsx | Main modal container with portal, backdrop, focus trap | create |
| src/components/evidence/DocumentViewer.tsx | Image display with pan/zoom controls using CSS transforms | create |
| src/components/evidence/BoundingBoxOverlay.tsx | SVG layer for rendering multiple highlight boxes | create |
| src/components/evidence/HighlightBox.tsx | Individual box component with hover tooltip | create |
| src/components/evidence/index.ts | Barrel export for evidence components | create |
| src/types/evidence.ts | TypeScript interfaces for evidence modal data structures | create |
| src/hooks/useEvidenceModal.ts | Custom hook for modal state management | create |
| src/styles/index.css | Add evidence modal specific styles | modify |
| src/App.tsx | Add test route for evidence modal | modify |
| src/pages/TestEvidenceModalPage.tsx | Test page for visual verification | create |

## 5. Implementation Tasks

```tasks
- [ ] T001: Create evidence types and interfaces | File: src/types/evidence.ts
- [ ] T002: Create useEvidenceModal hook for state management | File: src/hooks/useEvidenceModal.ts
- [ ] T003: Create HighlightBox component with hover tooltip | File: src/components/evidence/HighlightBox.tsx
- [ ] T004: Create BoundingBoxOverlay SVG container component | File: src/components/evidence/BoundingBoxOverlay.tsx
- [ ] T005: Create DocumentViewer with pan/zoom controls | File: src/components/evidence/DocumentViewer.tsx
- [ ] T006: Create EvidenceModal container with portal and focus trap | File: src/components/evidence/EvidenceModal.tsx
- [ ] T007: Create barrel export for evidence components | File: src/components/evidence/index.ts
- [ ] T008: Add evidence modal CSS styles | File: src/styles/index.css
- [ ] T009: Create TestEvidenceModalPage for verification | File: src/pages/TestEvidenceModalPage.tsx
- [ ] T010: Add test route to App.tsx | File: src/App.tsx
```

## 6. Verification

1. Navigate to `/test-evidence-modal` in development mode
2. Open the modal with sample document and bounding boxes
3. Verify bounding boxes render with correct colors and positions
4. Test pan/zoom functionality with mouse wheel and controls
5. Test keyboard navigation (ESC to close, arrows to navigate boxes)
6. Test click-to-focus on bounding boxes
7. Verify hover tooltips display labels and confidence
8. Resize browser window to verify responsive scaling
9. Test focus trap remains within modal
10. Verify accessibility with screen reader

---

[SPEC_GENERATED] Please review the specification above. Reply with 'approved' to proceed or provide feedback for revisions.Now I have a good understanding of the existing type patterns. I can see there's already a `BoundingBox` interface and an `Evidence` interface defined. For the evidence modal, I need to create types that extend and complement these existing types for the modal component system with SVG-based bounding box overlays.

Let me create the `src/types/evidence.ts` file with the necessary types and interfaces:Now let me verify the file was created correctly and check if TypeScript compilation would work by looking at how other files import types:The file has been created successfully. Let me also run a quick TypeScript check to ensure there are no type errors:The TypeScript compilation shows only a pre-existing unrelated error in `supabase.ts` (unused imports), and no errors in the newly created `src/types/evidence.ts` file. This confirms our types file is correctly structured.

## Summary: Task T001 Completed ✅

I have created `src/types/evidence.ts` with comprehensive types and interfaces for the Evidence Modal component system. The file includes:

### Bounding Box Types
- **`EvidenceBoundingBox`**: Extends the existing `BoundingBox` with id, page, label, confidence, color, fieldName, and extractedText
- **`HighlightBoxState`**: Tracks hover, selection, and navigation states
- **`HighlightBoxStyle`**: Configures stroke color, fill color, opacity, stroke width, and border radius

### Document Viewer Types
- **`ViewerTransform`**: Pan/zoom state (x, y, scale)
- **`DocumentDimensions`**: Natural and rendered image dimensions for scaling
- **`ZoomConfig`**: Min/max scale, zoom step, animation duration
- **`PanConstraints`**: Viewport boundary constraints

### Modal Types
- **`EvidenceItem`**: Main data structure with document info, image URL, bounding boxes
- **`EvidenceModalConfig`**: Configuration options (zoom controls, keyboard nav, animations, theme)
- **`EvidenceModalState`**: Complete modal state (open, evidence, selectedBox, transform, loading, error)
- **`EvidenceModalAction`**: Discriminated union for reducer actions

### Tooltip Types
- **`TooltipPosition`**: Position and placement configuration
- **`BoxTooltipContent`**: Label, value, confidence, and source

### Event Callback Types
- `OnBoxClickHandler`, `OnBoxHoverHandler`, `OnModalCloseHandler`, `OnTransformChangeHandler`

### Component Props
- **`EvidenceModalProps`**, **`DocumentViewerProps`**, **`BoundingBoxOverlayProps`**, **`HighlightBoxProps`**

### Default Values & Utilities
- `DEFAULT_ZOOM_CONFIG`, `DEFAULT_MODAL_CONFIG`, `DEFAULT_TRANSFORM`
- `DEFAULT_BOX_STYLES`: Color-coded by confidence level (green/amber/red)
- `getConfidenceLevel()` and `getBoxStyleForConfidence()` utility functionsThe TypeScript compilation shows only a pre-existing unrelated error in `supabase.ts` (unused imports), and no errors in the newly created `src/types/evidence.ts` file. This confirms our types file is correctly structured.

## Summary: Task T001 Completed ✅

I have created `src/types/evidence.ts` with comprehensive types and interfaces for the Evidence Modal component system. The file includes:

### Bounding Box Types
- **`EvidenceBoundingBox`**: Extends the existing `BoundingBox` with id, page, label, confidence, color, fieldName, and extractedText
- **`HighlightBoxState`**: Tracks hover, selection, and navigation states
- **`HighlightBoxStyle`**: Configures stroke color, fill color, opacity, stroke width, and border radius

### Document Viewer Types
- **`ViewerTransform`**: Pan/zoom state (x, y, scale)
- **`DocumentDimensions`**: Natural and rendered image dimensions for scaling
- **`ZoomConfig`**: Min/max scale, zoom step, animation duration
- **`PanConstraints`**: Viewport boundary constraints

### Modal Types
- **`EvidenceItem`**: Main data structure with document info, image URL, bounding boxes
- **`EvidenceModalConfig`**: Configuration options (zoom controls, keyboard nav, animations, theme)
- **`EvidenceModalState`**: Complete modal state (open, evidence, selectedBox, transform, loading, error)
- **`EvidenceModalAction`**: Discriminated union for reducer actions

### Tooltip Types
- **`TooltipPosition`**: Position and placement configuration
- **`BoxTooltipContent`**: Label, value, confidence, and source

### Event Callback Types
- `OnBoxClickHandler`, `OnBoxHoverHandler`, `OnModalCloseHandler`, `OnTransformChangeHandler`

### Component Props
- **`EvidenceModalProps`**, **`DocumentViewerProps`**, **`BoundingBoxOverlayProps`**, **`HighlightBoxProps`**

### Default Values & Utilities
- `DEFAULT_ZOOM_CONFIG`, `DEFAULT_MODAL_CONFIG`, `DEFAULT_TRANSFORM`
- `DEFAULT_BOX_STYLES`: Color-coded by confidence level (green/amber/red)
- `getConfidenceLevel()` and `getBoxStyleForConfidence()` utility functionsLet me examine the existing hooks to understand the patterns used in the codebase:Now I understand the patterns used in the codebase. Let me create the `useEvidenceModal` hook with proper state management using the types defined in T001:Now let me verify the file was created correctly by running TypeScript type checking:The file compiles without TypeScript errors. Let me also verify the imports are correct by checking if the project can build:The TypeScript check passed with no errors. Let me read the file to confirm it was written correctly:The hook has been created successfully. 

## Summary: Task T002 Completed

I've created the `useEvidenceModal` hook at `src/hooks/useEvidenceModal.ts` with the following features:

### State Management
- **Reducer-based state** using `useReducer` for predictable state updates
- **Initial state** with modal closed, no evidence, and default transform
- **Actions handled**: OPEN, CLOSE, SET_LOADING, SET_ERROR, SELECT_BOX, NEXT_BOX, PREV_BOX, SET_TRANSFORM, ZOOM_IN, ZOOM_OUT, RESET_ZOOM, CENTER_ON_BOX, SET_PAGE

### Exposed API
- **`state`**: Current modal state (isOpen, currentEvidence, selectedBoxIndex, transform, isLoading, error)
- **`config`**: Merged configuration with defaults
- **`openModal(evidence)`**: Opens modal with evidence data, stores previous focus for restoration
- **`closeModal()`**: Closes modal and restores focus
- **`selectBox(index)`**: Selects a specific bounding box
- **`nextBox()` / `prevBox()`**: Circular navigation through bounding boxes
- **`setTransform(transform)`**: Sets pan/zoom transform
- **`zoomIn()` / `zoomOut()` / `resetZoom()`**: Zoom controls
- **`centerOnBox(index, dimensions)`**: Centers view on a specific bounding box
- **`setLoading(bool)` / `setError(string)`**: Loading/error state management
- **`selectedBox`**: Derived state for currently selected bounding box
- **`previousFocusRef`**: Reference for focus restoration

### Keyboard Navigation (when modal is open)
- **Escape**: Close modal
- **Arrow keys**: Navigate between bounding boxes
- **+/-**: Zoom in/out
- **0**: Reset zoom
- **Home/End**: Jump to first/last box

### Accessibility Features
- Focus restoration when modal closes
- Keyboard navigation support (configurable)
- Skips input elements when handling keyboard eventsThe hook has been created successfully. 

## Summary: Task T002 Completed

I've created the `useEvidenceModal` hook at `src/hooks/useEvidenceModal.ts` with the following features:

### State Management
- **Reducer-based state** using `useReducer` for predictable state updates
- **Initial state** with modal closed, no evidence, and default transform
- **Actions handled**: OPEN, CLOSE, SET_LOADING, SET_ERROR, SELECT_BOX, NEXT_BOX, PREV_BOX, SET_TRANSFORM, ZOOM_IN, ZOOM_OUT, RESET_ZOOM, CENTER_ON_BOX, SET_PAGE

### Exposed API
- **`state`**: Current modal state (isOpen, currentEvidence, selectedBoxIndex, transform, isLoading, error)
- **`config`**: Merged configuration with defaults
- **`openModal(evidence)`**: Opens modal with evidence data, stores previous focus for restoration
- **`closeModal()`**: Closes modal and restores focus
- **`selectBox(index)`**: Selects a specific bounding box
- **`nextBox()` / `prevBox()`**: Circular navigation through bounding boxes
- **`setTransform(transform)`**: Sets pan/zoom transform
- **`zoomIn()` / `zoomOut()` / `resetZoom()`**: Zoom controls
- **`centerOnBox(index, dimensions)`**: Centers view on a specific bounding box
- **`setLoading(bool)` / `setError(string)`**: Loading/error state management
- **`selectedBox`**: Derived state for currently selected bounding box
- **`previousFocusRef`**: Reference for focus restoration

### Keyboard Navigation (when modal is open)
- **Escape**: Close modal
- **Arrow keys**: Navigate between bounding boxes
- **+/-**: Zoom in/out
- **0**: Reset zoom
- **Home/End**: Jump to first/last box

### Accessibility Features
- Focus restoration when modal closes
- Keyboard navigation support (configurable)
- Skips input elements when handling keyboard eventsNow let me look at an existing component to understand the coding patterns used in this project:Now I have a good understanding of the project structure and patterns. Let me check if the evidence folder exists and create the HighlightBox component:The directory doesn't exist yet. Let me create the HighlightBox component:Now let me add the CSS styles for the HighlightBox component to the styles file:Now let me verify the component is correct by checking if it compiles properly (checking for any import issues):Those are just JSX flag errors because I'm checking the file directly without the tsconfig. Let me use a proper check via the project's build system:The TypeScript check passed with no errors. Let me read back the created component to verify everything looks correct:The component looks good. Let me verify that the component compiles correctly as part of the project by checking for any eslint errors:ESLint is not configured for this project. Let me do a final verification by running the vite development build to catch any compilation errors:The build completed successfully without any errors. The `HighlightBox` component is now properly integrated into the project.

## Summary - Task T003 Complete

I have successfully implemented the **HighlightBox component** (`src/components/evidence/HighlightBox.tsx`) with the following features:

### Component Features:
1. **SVG-based Highlight Rectangle** - Renders as an SVG `<rect>` element that can be used within the BoundingBoxOverlay container
2. **Hover Tooltip** - Displays a styled tooltip on hover showing:
   - Field label
   - Extracted text value (optional)
   - Confidence score with color-coded indicator (green/amber/red based on confidence level)
3. **Confidence-based Styling** - Automatically applies colors based on confidence level:
   - High (≥80%): Green
   - Medium (50-79%): Amber
   - Low (<50%): Red
4. **Selection State** - Visual feedback when a box is selected (thicker border, dashed selection ring with animation)
5. **Hover State** - Visual feedback when hovering (increased opacity and border width)
6. **Accessibility** - Full keyboard support with:
   - `tabIndex` for keyboard navigation
   - `role="button"` with `aria-label` for screen readers
   - `aria-pressed` state for selection
   - `Enter` and `Space` key handlers
7. **Scale Support** - Properly scales coordinates based on the document dimensions
8. **Custom Style Overrides** - Supports custom color and style overrides via props

### CSS Additions:
Added CSS styles to `src/styles/index.css`:
- `.highlight-box` - Base cursor and outline styles
- `.highlight-box-selected` - Drop shadow effect for selected state
- `.highlight-box-hovered` - Drop shadow effect for hover state
- `.highlight-box-selection-ring` - Animated dashed border for selection
- `.evidence-tooltip` - Fade-in animation for tooltips

### Props Interface:
The component accepts props matching the `HighlightBoxProps` interface from `src/types/evidence.ts`:
- `box`: The bounding box data (coordinates, label, confidence, etc.)
- `scale`: Scale factors for x and y coordinate conversion
- `isSelected`: Whether the box is currently selected
- `isHovered`: Controlled hover state
- `onClick`, `onMouseEnter`, `onMouseLeave`: Event callbacks
- `style`: Optional style overrides
- `className`: Optional custom CSS classThe build completed successfully without any errors. The `HighlightBox` component is now properly integrated into the project.

## Summary - Task T003 Complete

I have successfully implemented the **HighlightBox component** (`src/components/evidence/HighlightBox.tsx`) with the following features:

### Component Features:
1. **SVG-based Highlight Rectangle** - Renders as an SVG `<rect>` element that can be used within the BoundingBoxOverlay container
2. **Hover Tooltip** - Displays a styled tooltip on hover showing:
   - Field label
   - Extracted text value (optional)
   - Confidence score with color-coded indicator (green/amber/red based on confidence level)
3. **Confidence-based Styling** - Automatically applies colors based on confidence level:
   - High (≥80%): Green
   - Medium (50-79%): Amber
   - Low (<50%): Red
4. **Selection State** - Visual feedback when a box is selected (thicker border, dashed selection ring with animation)
5. **Hover State** - Visual feedback when hovering (increased opacity and border width)
6. **Accessibility** - Full keyboard support with:
   - `tabIndex` for keyboard navigation
   - `role="button"` with `aria-label` for screen readers
   - `aria-pressed` state for selection
   - `Enter` and `Space` key handlers
7. **Scale Support** - Properly scales coordinates based on the document dimensions
8. **Custom Style Overrides** - Supports custom color and style overrides via props

### CSS Additions:
Added CSS styles to `src/styles/index.css`:
- `.highlight-box` - Base cursor and outline styles
- `.highlight-box-selected` - Drop shadow effect for selected state
- `.highlight-box-hovered` - Drop shadow effect for hover state
- `.highlight-box-selection-ring` - Animated dashed border for selection
- `.evidence-tooltip` - Fade-in animation for tooltips

### Props Interface:
The component accepts props matching the `HighlightBoxProps` interface from `src/types/evidence.ts`:
- `box`: The bounding box data (coordinates, label, confidence, etc.)
- `scale`: Scale factors for x and y coordinate conversion
- `isSelected`: Whether the box is currently selected
- `isHovered`: Controlled hover state
- `onClick`, `onMouseEnter`, `onMouseLeave`: Event callbacks
- `style`: Optional style overrides
- `className`: Optional custom CSS classNow I have a good understanding of the types and the HighlightBox component. Let me create the BoundingBoxOverlay component that serves as the SVG container for multiple HighlightBox components.Now let me verify the component was created correctly and check if there are any TypeScript issues by checking the imports:The component is created. Let me verify TypeScript compilation by running a type check:There's an unused variable warning. Let me fix that:Now let me run the TypeScript check again to confirm everything is working:No errors. The component compiles successfully. Let me summarize what was implemented.

## Summary - Task T004 Completed

I created the **BoundingBoxOverlay** SVG container component at `src/components/evidence/BoundingBoxOverlay.tsx`. 

### Key Features Implemented:

1. **SVG Container Structure**
   - Full-width/height SVG element positioned absolutely over the document
   - Proper `viewBox` for coordinate system matching rendered dimensions
   - `pointerEvents: none` on container with `pointerEvents: auto` on the boxes group for proper click handling

2. **Coordinate Scaling**
   - `calculateScale()` helper function converts natural document coordinates to rendered viewport coordinates
   - Prevents division by zero with minimum dimension safeguards
   - Memoized scale calculation for performance

3. **Box Rendering**
   - Renders sorted `HighlightBox` components for each bounding box
   - `sortBoxesByPosition()` ensures consistent tab order (top-to-bottom, left-to-right)
   - Tracks selected and hovered state per box

4. **SVG Defs**
   - Includes reusable filter definitions for glow effects and drop shadows
   - `box-glow` filter for selected box emphasis
   - `tooltip-shadow` filter for tooltip styling

5. **Accessibility**
   - Proper `role="img"` with descriptive `aria-label` in Portuguese
   - Screen reader announcements for box count
   - Hidden but accessible text element for assistive technology

6. **Edge Case Handling**
   - Returns `null` if dimensions are invalid (< 1px)
   - Returns `null` if no boxes to render
   - Graceful handling of empty/invalid statesNo errors. The component compiles successfully. Let me summarize what was implemented.

## Summary - Task T004 Completed

I created the **BoundingBoxOverlay** SVG container component at `src/components/evidence/BoundingBoxOverlay.tsx`. 

### Key Features Implemented:

1. **SVG Container Structure**
   - Full-width/height SVG element positioned absolutely over the document
   - Proper `viewBox` for coordinate system matching rendered dimensions
   - `pointerEvents: none` on container with `pointerEvents: auto` on the boxes group for proper click handling

2. **Coordinate Scaling**
   - `calculateScale()` helper function converts natural document coordinates to rendered viewport coordinates
   - Prevents division by zero with minimum dimension safeguards
   - Memoized scale calculation for performance

3. **Box Rendering**
   - Renders sorted `HighlightBox` components for each bounding box
   - `sortBoxesByPosition()` ensures consistent tab order (top-to-bottom, left-to-right)
   - Tracks selected and hovered state per box

4. **SVG Defs**
   - Includes reusable filter definitions for glow effects and drop shadows
   - `box-glow` filter for selected box emphasis
   - `tooltip-shadow` filter for tooltip styling

5. **Accessibility**
   - Proper `role="img"` with descriptive `aria-label` in Portuguese
   - Screen reader announcements for box count
   - Hidden but accessible text element for assistive technology

6. **Edge Case Handling**
   - Returns `null` if dimensions are invalid (< 1px)
   - Returns `null` if no boxes to render
   - Graceful handling of empty/invalid statesNow I have all the context I need. Let me also check the existing components for styling patterns:Now I have a good understanding of the codebase patterns. Let me create the DocumentViewer component with pan/zoom controls:Now let me verify the component works by checking that all imports are correct:The JSX errors are just due to the standalone TypeScript check without the full project config. Let me run a proper check through the project's build system:The TypeScript check passed without errors. Let me verify the file was created correctly by reading it back:The DocumentViewer component has been successfully created. Let me provide a summary of what was implemented:

## Summary: Task T005 Completed

I created the `DocumentViewer` component at `src/components/evidence/DocumentViewer.tsx` with the following features:

### Core Features:
1. **Pan/Zoom Controls using CSS Transforms**
   - Mouse wheel zoom centered on cursor position
   - Click and drag panning with smooth handling
   - Touch support for mobile devices (single-finger panning)

2. **Zoom Control Buttons**
   - Zoom in (+) button with keyboard shortcut hint
   - Zoom out (-) button with keyboard shortcut hint  
   - Reset zoom button to return to 100%
   - Visual display of current zoom percentage

3. **Image Loading Management**
   - Loading spinner with Portuguese text ("Carregando documento...")
   - Error state display with retry option
   - Proper image dimension tracking

4. **Responsive Handling**
   - ResizeObserver for container size changes
   - Debounced resize handling (150ms as per spec)
   - Document dimensions update on resize

5. **Accessibility Features**
   - ARIA labels in Portuguese
   - Screen reader status announcements
   - Keyboard focusable container
   - Proper button states and titles

6. **Integration with Existing Architecture**
   - Uses types from `../../types/evidence` (ViewerTransform, DocumentDimensions, DocumentViewerProps)
   - Uses default configs (DEFAULT_ZOOM_CONFIG, DEFAULT_TRANSFORM)
   - Renders children as overlay for bounding boxes (BoundingBoxOverlay)
   - Follows existing codebase patterns (Tailwind CSS, dark mode support)

### Helper Components:
- `ZoomControls`: Floating control bar with zoom buttons
- `LoadingSpinner`: Loading state indicator
- `ErrorDisplay`: Error state with retry optionThe DocumentViewer component has been successfully created. Let me provide a summary of what was implemented:

## Summary: Task T005 Completed

I created the `DocumentViewer` component at `src/components/evidence/DocumentViewer.tsx` with the following features:

### Core Features:
1. **Pan/Zoom Controls using CSS Transforms**
   - Mouse wheel zoom centered on cursor position
   - Click and drag panning with smooth handling
   - Touch support for mobile devices (single-finger panning)

2. **Zoom Control Buttons**
   - Zoom in (+) button with keyboard shortcut hint
   - Zoom out (-) button with keyboard shortcut hint  
   - Reset zoom button to return to 100%
   - Visual display of current zoom percentage

3. **Image Loading Management**
   - Loading spinner with Portuguese text ("Carregando documento...")
   - Error state display with retry option
   - Proper image dimension tracking

4. **Responsive Handling**
   - ResizeObserver for container size changes
   - Debounced resize handling (150ms as per spec)
   - Document dimensions update on resize

5. **Accessibility Features**
   - ARIA labels in Portuguese
   - Screen reader status announcements
   - Keyboard focusable container
   - Proper button states and titles

6. **Integration with Existing Architecture**
   - Uses types from `../../types/evidence` (ViewerTransform, DocumentDimensions, DocumentViewerProps)
   - Uses default configs (DEFAULT_ZOOM_CONFIG, DEFAULT_TRANSFORM)
   - Renders children as overlay for bounding boxes (BoundingBoxOverlay)
   - Follows existing codebase patterns (Tailwind CSS, dark mode support)

### Helper Components:
- `ZoomControls`: Floating control bar with zoom buttons
- `LoadingSpinner`: Loading state indicator
- `ErrorDisplay`: Error state with retry optionNow let me also read the BoundingBoxOverlay component which will be used by the EvidenceModal:Now I have all the context needed. Let me create the EvidenceModal container with portal and focus trap:Now let me verify the file was created correctly and check if there are any issues with the implementation:The TypeScript compilation passes without errors. Let me also verify that the component follows the patterns established in the existing codebase by reading the file I just created:The component has been created successfully. Let me provide a summary of what was implemented.

## Summary: Task T006 Complete ✅

I created the **EvidenceModal** component at `src/components/evidence/EvidenceModal.tsx`. Here's what was implemented:

### Key Features

1. **Portal Rendering**
   - Creates a dedicated portal root (`evidence-modal-root`) in `document.body`
   - Ensures proper z-index stacking for modal overlay

2. **Focus Trap**
   - Stores the previously focused element when modal opens
   - Traps Tab/Shift+Tab navigation within the modal
   - Restores focus to the previously focused element when modal closes

3. **Keyboard Navigation**
   - ESC key closes the modal
   - Arrow keys (Left/Right, Up/Down) navigate between bounding boxes
   - Home/End keys jump to first/last bounding box
   - Keyboard navigation respects `config.enableKeyboardNavigation` setting

4. **Backdrop Behavior**
   - Semi-transparent backdrop with click-to-close functionality
   - Prevents body scroll when modal is open

5. **Modal Structure**
   - **ModalHeader**: Shows document name, page number, and close button
   - **ModalLoading**: Loading spinner state
   - **ModalError**: Error state with retry option
   - **BoxNavigation**: Previous/Next navigation controls for multiple bounding boxes

6. **Integration**
   - Uses `DocumentViewer` for pan/zoom functionality
   - Renders `BoundingBoxOverlay` as children within DocumentViewer
   - Manages state for selected box, hovered box, transform, and dimensions
   - Supports all configuration options from `EvidenceModalConfig`

7. **Accessibility**
   - Proper ARIA attributes (`role="dialog"`, `aria-modal`, `aria-label`)
   - Screen reader announcements for loading state and evidence count
   - Focus management follows WCAG guidelines

8. **Animations**
   - Smooth enter/exit animations using Framer Motion
   - Spring-based transitions for natural feelThe component has been created successfully. Let me provide a summary of what was implemented.

## Summary: Task T006 Complete ✅

I created the **EvidenceModal** component at `src/components/evidence/EvidenceModal.tsx`. Here's what was implemented:

### Key Features

1. **Portal Rendering**
   - Creates a dedicated portal root (`evidence-modal-root`) in `document.body`
   - Ensures proper z-index stacking for modal overlay

2. **Focus Trap**
   - Stores the previously focused element when modal opens
   - Traps Tab/Shift+Tab navigation within the modal
   - Restores focus to the previously focused element when modal closes

3. **Keyboard Navigation**
   - ESC key closes the modal
   - Arrow keys (Left/Right, Up/Down) navigate between bounding boxes
   - Home/End keys jump to first/last bounding box
   - Keyboard navigation respects `config.enableKeyboardNavigation` setting

4. **Backdrop Behavior**
   - Semi-transparent backdrop with click-to-close functionality
   - Prevents body scroll when modal is open

5. **Modal Structure**
   - **ModalHeader**: Shows document name, page number, and close button
   - **ModalLoading**: Loading spinner state
   - **ModalError**: Error state with retry option
   - **BoxNavigation**: Previous/Next navigation controls for multiple bounding boxes

6. **Integration**
   - Uses `DocumentViewer` for pan/zoom functionality
   - Renders `BoundingBoxOverlay` as children within DocumentViewer
   - Manages state for selected box, hovered box, transform, and dimensions
   - Supports all configuration options from `EvidenceModalConfig`

7. **Accessibility**
   - Proper ARIA attributes (`role="dialog"`, `aria-modal`, `aria-label`)
   - Screen reader announcements for loading state and evidence count
   - Focus management follows WCAG guidelines

8. **Animations**
   - Smooth enter/exit animations using Framer Motion
   - Spring-based transitions for natural feelLet me examine an existing barrel export file to follow the existing patterns:Now I have all the information I need. I can see:

1. The existing barrel export pattern from `src/components/case/index.ts` uses `export { default as ComponentName } from './ComponentName'`
2. The evidence folder has 4 components:
   - `EvidenceModal.tsx` - exports `EvidenceModal` as both named and default export
   - `DocumentViewer.tsx` - exports `DocumentViewer` as both named and default export
   - `BoundingBoxOverlay.tsx` - exports `BoundingBoxOverlay` as both named and default export
   - `HighlightBox.tsx` - exports `HighlightBox` as both named and default export

Let me also check the types file to see if there are any types we should re-export:Now I have all the information needed. I'll create the barrel export file following the existing pattern from the codebase. The barrel export should export all four evidence components:Let me check other barrel exports in the codebase to ensure I'm following the correct pattern more closely:I see there are two patterns used in the codebase:
1. `export { default as ComponentName } from './ComponentName'` - for default exports
2. `export { ComponentName } from './ComponentName'` - for named exports with optional type exports

The status folder also exports the Props types. Let me update the barrel export to follow a cleaner pattern that matches the codebase conventions better:Now let me verify the file is correctly created by reading it one more time:## Summary: Task T007 Completed

I've successfully created the barrel export file for evidence components at `src/components/evidence/index.ts`.

**What was implemented:**

The barrel export file re-exports all 4 evidence modal components using the `export { default as ComponentName } from './ComponentName'` pattern, which is consistent with the existing codebase conventions (matching `src/components/entities/index.ts`).

**Components exported:**
1. **EvidenceModal** - Main modal container with portal, backdrop, and focus trap
2. **DocumentViewer** - Image display with pan/zoom controls using CSS transforms  
3. **BoundingBoxOverlay** - SVG container for rendering multiple bounding boxes
4. **HighlightBox** - Individual highlight box component with hover tooltip

**Usage example:**
```typescript
import { EvidenceModal, DocumentViewer, BoundingBoxOverlay, HighlightBox } from '@/components/evidence'
```

This enables clean imports from a single module path rather than importing from individual component files.## Summary: Task T007 Completed

I've successfully created the barrel export file for evidence components at `src/components/evidence/index.ts`.

**What was implemented:**

The barrel export file re-exports all 4 evidence modal components using the `export { default as ComponentName } from './ComponentName'` pattern, which is consistent with the existing codebase conventions (matching `src/components/entities/index.ts`).

**Components exported:**
1. **EvidenceModal** - Main modal container with portal, backdrop, and focus trap
2. **DocumentViewer** - Image display with pan/zoom controls using CSS transforms  
3. **BoundingBoxOverlay** - SVG container for rendering multiple bounding boxes
4. **HighlightBox** - Individual highlight box component with hover tooltip

**Usage example:**
```typescript
import { EvidenceModal, DocumentViewer, BoundingBoxOverlay, HighlightBox } from '@/components/evidence'
```

This enables clean imports from a single module path rather than importing from individual component files.Now let me also read the BoundingBoxOverlay component to understand all the CSS classes that need to be styled:Now I have a complete picture of all the components and their CSS classes. I can see that the `index.css` file already has some evidence modal styles added (lines 414-471), but looking at the components, there are additional styles that should be added to ensure complete coverage. Let me add the remaining CSS styles for the evidence modal components:The CSS styles have been added successfully. Let me provide a summary of what was implemented for task T008:

## Summary - Task T008: Add Evidence Modal CSS Styles

I've expanded the evidence modal CSS styles in `src/styles/index.css` with comprehensive styling for all evidence modal components. The styles added include:

### 1. **Evidence Modal Container Styles**
- Modal container with proper stacking context (`isolation: isolate`)
- Backdrop with blur effect (`backdrop-filter: blur(4px)`)
- Modal panel z-index and performance optimizations (`will-change: transform, opacity`)
- Header and content area styling
- Box navigation control bar with backdrop blur

### 2. **Document Viewer Styles**
- GPU acceleration for smooth pan/zoom (`transform: translateZ(0)`, `backface-visibility: hidden`)
- Content wrapper with `will-change: transform` for performance
- Overlay container z-index management
- Zoom control bar with blur effect
- Cursor states for grab/grabbing during pan operations
- User selection prevention during panning

### 3. **Bounding Box Overlay Styles**
- SVG crisp rendering (`shape-rendering: geometricPrecision`)
- Pointer events management for boxes

### 4. **Highlight Box Styles**
- Base styles with smooth transitions for hover/selection states
- Focus-visible outline for keyboard accessibility
- Selected state with glow drop-shadow effect
- Hovered state with subtle glow
- Selection ring animation (pulsing dashed border)
- CSS custom properties for confidence-based coloring (high/medium/low)

### 5. **Evidence Tooltip Styles**
- Fade-in animation
- High z-index for visibility
- Arrow indicator styles for different placements
- Dark mode support

### 6. **Responsive Adjustments**
- Mobile (≤640px): Full-screen modal, adjusted controls positioning
- Tablet (641px-1024px): Moderate margins

### 7. **Accessibility Enhancements**
- High contrast mode support with increased stroke widths and darker backdrop
- Reduced motion support that disables all animations and transitions
- Focus-visible improvements for keyboard navigation
- Skip link styling for modal accessibility

### 8. **Print Styles**
- Static positioning for printing
- Hidden controls and backdrop
- Print color adjustment for accurate bounding box colorsThe CSS styles have been added successfully. Let me provide a summary of what was implemented for task T008:

## Summary - Task T008: Add Evidence Modal CSS Styles

I've expanded the evidence modal CSS styles in `src/styles/index.css` with comprehensive styling for all evidence modal components. The styles added include:

### 1. **Evidence Modal Container Styles**
- Modal container with proper stacking context (`isolation: isolate`)
- Backdrop with blur effect (`backdrop-filter: blur(4px)`)
- Modal panel z-index and performance optimizations (`will-change: transform, opacity`)
- Header and content area styling
- Box navigation control bar with backdrop blur

### 2. **Document Viewer Styles**
- GPU acceleration for smooth pan/zoom (`transform: translateZ(0)`, `backface-visibility: hidden`)
- Content wrapper with `will-change: transform` for performance
- Overlay container z-index management
- Zoom control bar with blur effect
- Cursor states for grab/grabbing during pan operations
- User selection prevention during panning

### 3. **Bounding Box Overlay Styles**
- SVG crisp rendering (`shape-rendering: geometricPrecision`)
- Pointer events management for boxes

### 4. **Highlight Box Styles**
- Base styles with smooth transitions for hover/selection states
- Focus-visible outline for keyboard accessibility
- Selected state with glow drop-shadow effect
- Hovered state with subtle glow
- Selection ring animation (pulsing dashed border)
- CSS custom properties for confidence-based coloring (high/medium/low)

### 5. **Evidence Tooltip Styles**
- Fade-in animation
- High z-index for visibility
- Arrow indicator styles for different placements
- Dark mode support

### 6. **Responsive Adjustments**
- Mobile (≤640px): Full-screen modal, adjusted controls positioning
- Tablet (641px-1024px): Moderate margins

### 7. **Accessibility Enhancements**
- High contrast mode support with increased stroke widths and darker backdrop
- Reduced motion support that disables all animations and transitions
- Focus-visible improvements for keyboard navigation
- Skip link styling for modal accessibility

### 8. **Print Styles**
- Static positioning for printing
- Hidden controls and backdrop
- Print color adjustment for accurate bounding box colorsLet me read an existing test page to understand the pattern used:Now I have a good understanding of the existing components and patterns. Let me create the TestEvidenceModalPage:Now let me verify the file was created correctly and check for any potential issues with the imports:I see there are some type errors related to the `DocumentType`. Let me check what valid document types are available in the project:I see the valid `DocumentType` values are: `'cnh' | 'rg' | 'marriage_cert' | 'deed' | 'proxy' | 'iptu' | 'birth_cert' | 'other'`. Let me fix the test page to use valid document types:Now let me run a quick test to make sure the file can be type-checked correctly via the Vite build system:The build succeeded. Let me verify the file was created correctly by reading it:The file is complete. Let me provide a summary of what was implemented:

---

## Summary: Task T009 Completed

I created the `TestEvidenceModalPage.tsx` file for visual verification of the Evidence Modal component. Here's what was implemented:

### File Created
- **`src/pages/TestEvidenceModalPage.tsx`** - Test page for the Evidence Modal component

### Features Included

1. **Sample Data Sets**
   - `sampleEvidenceRG` - RG document with 5 bounding boxes at various confidence levels (high, medium, low)
   - `sampleEvidenceProperty` - Property deed document with 3 bounding boxes, simulating multi-page document
   - `sampleEvidenceSingleBox` - Edge case with only 1 bounding box (navigation controls hidden)
   - `sampleEvidenceNoBoxes` - Edge case with no bounding boxes

2. **Test Cases UI**
   - Card-based layout for each test scenario
   - Visual indicators for confidence levels (badges)
   - "Visualizar" buttons to open the modal with specific evidence

3. **Keyboard Shortcuts Reference**
   - Visual guide showing ESC, arrow keys, and Home key shortcuts
   - Styled with `<kbd>` elements for visual clarity

4. **Features Checklist**
   - 8-item verification checklist covering:
     - Bounding box rendering with confidence-based colors
     - Pan/zoom functionality
     - Keyboard navigation
     - Click-to-select boxes
     - Hover tooltips
     - Responsive behavior
     - Focus trap
     - Backdrop click to close

5. **Quick Actions**
   - "Abrir Modal Padrão" - Opens the default RG evidence
   - "Ciclar Evidências" - Cycles through all evidence samples

6. **Implementation Notes**
   - Informational section explaining placeholder images, OCR/LLM integration points, portal usage, Framer Motion, and resize debounce

### Technical Details
- Uses correct `DocumentType` values (`'rg'`, `'deed'`, `'proxy'`, `'other'`)
- Follows existing codebase patterns (similar to `TestExpandableCardPage.tsx`)
- Imports from the barrel export `'../components/evidence'`
- Uses Heroicons for visual icons
- Build verified successfully with `npm run build`The file is complete. Let me provide a summary of what was implemented:

---

## Summary: Task T009 Completed

I created the `TestEvidenceModalPage.tsx` file for visual verification of the Evidence Modal component. Here's what was implemented:

### File Created
- **`src/pages/TestEvidenceModalPage.tsx`** - Test page for the Evidence Modal component

### Features Included

1. **Sample Data Sets**
   - `sampleEvidenceRG` - RG document with 5 bounding boxes at various confidence levels (high, medium, low)
   - `sampleEvidenceProperty` - Property deed document with 3 bounding boxes, simulating multi-page document
   - `sampleEvidenceSingleBox` - Edge case with only 1 bounding box (navigation controls hidden)
   - `sampleEvidenceNoBoxes` - Edge case with no bounding boxes

2. **Test Cases UI**
   - Card-based layout for each test scenario
   - Visual indicators for confidence levels (badges)
   - "Visualizar" buttons to open the modal with specific evidence

3. **Keyboard Shortcuts Reference**
   - Visual guide showing ESC, arrow keys, and Home key shortcuts
   - Styled with `<kbd>` elements for visual clarity

4. **Features Checklist**
   - 8-item verification checklist covering:
     - Bounding box rendering with confidence-based colors
     - Pan/zoom functionality
     - Keyboard navigation
     - Click-to-select boxes
     - Hover tooltips
     - Responsive behavior
     - Focus trap
     - Backdrop click to close

5. **Quick Actions**
   - "Abrir Modal Padrão" - Opens the default RG evidence
   - "Ciclar Evidências" - Cycles through all evidence samples

6. **Implementation Notes**
   - Informational section explaining placeholder images, OCR/LLM integration points, portal usage, Framer Motion, and resize debounce

### Technical Details
- Uses correct `DocumentType` values (`'rg'`, `'deed'`, `'proxy'`, `'other'`)
- Follows existing codebase patterns (similar to `TestExpandableCardPage.tsx`)
- Imports from the barrel export `'../components/evidence'`
- Uses Heroicons for visual icons
- Build verified successfully with `npm run build`Now I understand the structure. I need to add a test route for the TestEvidenceModalPage to App.tsx. I'll follow the existing pattern for test routes.Task T010 is complete. Let me verify the final state of the file:## Task T010 Complete: Add test route to App.tsx

### Summary of Implementation

I added the test route for the Evidence Modal component to `src/App.tsx`:

1. **Added import statement** (line 23):
   ```typescript
   import TestEvidenceModalPage from './pages/TestEvidenceModalPage'
   ```

2. **Added route** (line 54) within the development test routes section:
   ```typescript
   <Route path="/test-evidence-modal" element={<TestEvidenceModalPage />} />
   ```

### Details
- The route follows the existing pattern for development test routes
- It's wrapped in the `{import.meta.env.DEV && (...)}` conditional, ensuring it only appears in development mode
- The route is accessible at `/test-evidence-modal` when running the dev server
- This bypasses authentication for UI testing purposes, consistent with other test routes

### Verification
Navigate to `http://localhost:5173/test-evidence-modal` (or your dev server URL) to verify the Evidence Modal component works correctly.## Task T010 Complete: Add test route to App.tsx

### Summary of Implementation

I added the test route for the Evidence Modal component to `src/App.tsx`:

1. **Added import statement** (line 23):
   ```typescript
   import TestEvidenceModalPage from './pages/TestEvidenceModalPage'
   ```

2. **Added route** (line 54) within the development test routes section:
   ```typescript
   <Route path="/test-evidence-modal" element={<TestEvidenceModalPage />} />
   ```

### Details
- The route follows the existing pattern for development test routes
- It's wrapped in the `{import.meta.env.DEV && (...)}` conditional, ensuring it only appears in development mode
- The route is accessible at `/test-evidence-modal` when running the dev server
- This bypasses authentication for UI testing purposes, consistent with other test routes

### Verification
Navigate to `http://localhost:5173/test-evidence-modal` (or your dev server URL) to verify the Evidence Modal component works correctly.