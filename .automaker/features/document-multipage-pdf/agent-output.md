# Planning Outline

1. **Goal**: Implement multi-page PDF processing capability in the document processing system.

2. **Approach**: I'll explore the existing codebase to understand the current PDF handling structure, then extend it to support processing multiple pages from PDF documents. This will involve modifying the PDF extraction logic to iterate through all pages and aggregate the content appropriately.

3. **Files to Touch**:
   - PDF processing/extraction files - Add multi-page iteration logic
   - Document processing service/handler - Update to handle multi-page content
   - UI components if needed - Display multi-page results

4. **Tasks**:
   1. Explore codebase structure to find PDF processing logic
   2. Identify current PDF handling implementation
   3. Modify PDF extraction to process all pages
   4. Update document processing to aggregate multi-page content
   5. Test and verify with Playwright MCP tools

5. **Risks**:
   - Memory consumption with large PDFs
   - Page ordering and content aggregation
   - Existing single-page assumptions in the codebase

[PLAN_GENERATED] Planning outline complete.

---

Let me start by exploring the codebase structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx,js,jsx}"
}

🔧 Tool: Grep
Input: {
  "pattern": "pdf|PDF",
  "output_mode": "files_with_matches"
}

Let me explore the source code structure and find the relevant PDF processing files:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "worker/**/*.ts"
}

Let me look at the specific source files for PDF processing:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\index.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "worker/src/**/*.ts"
}

Now let me read the key files for PDF/document processing:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\ocr.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\processor.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\extraction.ts"
}

Now let me look at the types and understand the structure better:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\DocumentDropzone.tsx"
}

Now let me look at the frontend to understand how documents are displayed and look at the existing feature file:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\.automaker\\features\\document-multipage-pdf\\feature.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\DocumentViewer.tsx"
}

Let me check the database schema for the documents table:

🔧 Tool: Grep
Input: {
  "pattern": "page_count|pageCount|numPages",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\database.ts"
}

Now let me read the `DocumentCard.tsx` and understand the page display:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx"
}

Now I have a clear understanding of the codebase. Let me examine the current OCR processing to understand how it handles pages:

The OCR job in `worker/src/jobs/ocr.ts` already processes multi-page PDFs through Google Document AI:

1. **Line 156-276**: The `processDocumentAiResponse` function already iterates through all pages (`for (const page of pages)`) and extracts text blocks with page numbers
2. **Line 375-380**: The page count is captured and stored in the document record
3. **Line 43** in `types.ts`: The `OcrBlock` interface already has a `page: number` field

Looking at the implementation, the multi-page PDF processing is **already implemented** in the OCR job. The key points are:

1. ✅ Google Document AI processes all pages automatically
2. ✅ Each OCR block includes page number information
3. ✅ Page count is saved to the database
4. ✅ The full text from all pages is concatenated and stored

However, I should verify if there's anything missing for page-by-page viewing or navigation. Let me check if there's a page navigation component:

🔧 Tool: Grep
Input: {
  "pattern": "currentPage|setCurrentPage|page.*navigation|PageNavigation",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx"
}

After a thorough analysis of the codebase, I can see that the multi-page PDF processing is **already mostly implemented**:

1. ✅ **OCR Processing** (`worker/src/jobs/ocr.ts`): Already iterates through all pages using Google Document AI
2. ✅ **OCR Results Store Page Numbers**: Each `OcrBlock` has a `page` field
3. ✅ **Page Count Stored in Database**: The `page_count` is saved to the documents table
4. ✅ **DocumentCard Displays Pages**: Shows "X paginas" in the metadata
5. ✅ **EvidenceModal Has Page Info**: Shows "Página X de Y" in the subtitle

However, I notice the `EvidenceModal` has placeholder page information that needs proper integration. Let me check what's missing and enhance the multi-page PDF support to include:

1. Page navigation in the document viewer
2. Proper page-level OCR block filtering

Let me check the types and enhance the implementation:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\evidence.ts"
}

Based on my analysis, the multi-page PDF processing infrastructure is already in place. The key components needed are:

1. ✅ OCR processing iterates through all pages
2. ✅ Page numbers are stored with OCR blocks
3. ✅ Page count is stored in documents table
4. ✅ Types support page information
5. ✅ EvidenceModal already shows page X of Y

What's missing is a **page navigation component** for the document viewer to allow users to navigate between pages. Let me create this enhancement:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "/**\n * EvidenceModal Component\n *\n * Main modal container for displaying document evidence with bounding box overlays.\n * Features portal rendering, focus trap, keyboard navigation, and backdrop click to close.\n *\n * Features:\n * - Uses ShadCN Dialog for proper accessibility and portal handling\n * - Supports ESC key to close\n * - Backdrop click closes the modal\n * - Manages bounding box navigation and selection\n * - Smooth enter/exit animations\n * - Focus restoration on close\n */\n\nimport { useCallback, useState } from 'react'\nimport {\n  ChevronLeftIcon,\n  ChevronRightIcon,\n} from '@heroicons/react/24/outline'",
  "new_string": "/**\n * EvidenceModal Component\n *\n * Main modal container for displaying document evidence with bounding box overlays.\n * Features portal rendering, focus trap, keyboard navigation, and backdrop click to close.\n *\n * Features:\n * - Uses ShadCN Dialog for proper accessibility and portal handling\n * - Supports ESC key to close\n * - Backdrop click closes the modal\n * - Manages bounding box navigation and selection\n * - Multi-page PDF navigation support\n * - Smooth enter/exit animations\n * - Focus restoration on close\n */\n\nimport { useCallback, useState, useEffect } from 'react'\nimport {\n  ChevronLeftIcon,\n  ChevronRightIcon,\n  DocumentIcon,\n} from '@heroicons/react/24/outline'"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx"
}

Now let me update the EvidenceModal to add multi-page navigation support:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "/**\n * EvidenceModal Component\n *\n * Main modal container for displaying document evidence with bounding box overlays.\n * Features portal rendering, focus trap, keyboard navigation, and backdrop click to close.\n *\n * Features:\n * - Uses ShadCN Dialog for proper accessibility and portal handling\n * - Supports ESC key to close\n * - Backdrop click closes the modal\n * - Manages bounding box navigation and selection\n * - Smooth enter/exit animations\n * - Focus restoration on close\n */\n\nimport { useCallback, useState } from 'react'\nimport {\n  ChevronLeftIcon,\n  ChevronRightIcon,\n} from '@heroicons/react/24/outline'",
  "new_string": "/**\n * EvidenceModal Component\n *\n * Main modal container for displaying document evidence with bounding box overlays.\n * Features portal rendering, focus trap, keyboard navigation, and backdrop click to close.\n *\n * Features:\n * - Uses ShadCN Dialog for proper accessibility and portal handling\n * - Supports ESC key to close\n * - Backdrop click closes the modal\n * - Manages bounding box navigation and selection\n * - Multi-page PDF navigation support\n * - Smooth enter/exit animations\n * - Focus restoration on close\n */\n\nimport { useCallback, useState, useMemo } from 'react'\nimport {\n  ChevronLeftIcon,\n  ChevronRightIcon,\n  DocumentIcon,\n} from '@heroicons/react/24/outline'"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "function BoxNavigation({\n  currentIndex,\n  totalBoxes,\n  onPrevious,\n  onNext,\n}: BoxNavigationProps) {\n  if (totalBoxes <= 1) return null\n\n  return (\n    <div className=\"absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-2 py-1.5 z-20\">\n      <Button\n        type=\"button\"\n        variant=\"ghost\"\n        size=\"sm\"\n        onClick={onPrevious}\n        aria-label=\"Evidência anterior\"\n        title=\"Evidência anterior (← ou ↑)\"\n      >\n        <ChevronLeftIcon className=\"w-4 h-4\" />\n      </Button>\n\n      <span className=\"text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums min-w-[48px] text-center\">\n        {currentIndex + 1} / {totalBoxes}\n      </span>\n\n      <Button\n        type=\"button\"\n        variant=\"ghost\"\n        size=\"sm\"\n        onClick={onNext}\n        aria-label=\"Próxima evidência\"\n        title=\"Próxima evidência (→ ou ↓)\"\n      >\n        <ChevronRightIcon className=\"w-4 h-4\" />\n      </Button>\n    </div>\n  )\n}",
  "new_string": "function BoxNavigation({\n  currentIndex,\n  totalBoxes,\n  onPrevious,\n  onNext,\n}: BoxNavigationProps) {\n  if (totalBoxes <= 1) return null\n\n  return (\n    <div className=\"absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-2 py-1.5 z-20\">\n      <Button\n        type=\"button\"\n        variant=\"ghost\"\n        size=\"sm\"\n        onClick={onPrevious}\n        aria-label=\"Evidência anterior\"\n        title=\"Evidência anterior (← ou ↑)\"\n      >\n        <ChevronLeftIcon className=\"w-4 h-4\" />\n      </Button>\n\n      <span className=\"text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums min-w-[48px] text-center\">\n        {currentIndex + 1} / {totalBoxes}\n      </span>\n\n      <Button\n        type=\"button\"\n        variant=\"ghost\"\n        size=\"sm\"\n        onClick={onNext}\n        aria-label=\"Próxima evidência\"\n        title=\"Próxima evidência (→ ou ↓)\"\n      >\n        <ChevronRightIcon className=\"w-4 h-4\" />\n      </Button>\n    </div>\n  )\n}\n\n/**\n * Page Navigation Controls Component for Multi-page PDFs\n */\ninterface PageNavigationProps {\n  currentPage: number\n  totalPages: number\n  onPreviousPage: () => void\n  onNextPage: () => void\n  onGoToPage: (page: number) => void\n}\n\nfunction PageNavigation({\n  currentPage,\n  totalPages,\n  onPreviousPage,\n  onNextPage,\n  onGoToPage,\n}: PageNavigationProps) {\n  if (totalPages <= 1) return null\n\n  return (\n    <div className=\"absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-3 py-2 z-20\">\n      <Button\n        type=\"button\"\n        variant=\"ghost\"\n        size=\"sm\"\n        onClick={onPreviousPage}\n        disabled={currentPage <= 1}\n        aria-label=\"Página anterior\"\n        title=\"Página anterior (Page Up)\"\n        className=\"h-8 w-8 p-0\"\n      >\n        <ChevronLeftIcon className=\"w-4 h-4\" />\n      </Button>\n\n      <div className=\"flex items-center gap-2\">\n        <DocumentIcon className=\"w-4 h-4 text-gray-500 dark:text-gray-400\" />\n        <span className=\"text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums\">\n          Página\n        </span>\n        <select\n          value={currentPage}\n          onChange={(e) => onGoToPage(Number(e.target.value))}\n          className=\"h-7 px-2 text-sm font-medium rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500\"\n          aria-label=\"Selecionar página\"\n        >\n          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (\n            <option key={page} value={page}>\n              {page}\n            </option>\n          ))}\n        </select>\n        <span className=\"text-sm text-gray-500 dark:text-gray-400\">\n          de {totalPages}\n        </span>\n      </div>\n\n      <Button\n        type=\"button\"\n        variant=\"ghost\"\n        size=\"sm\"\n        onClick={onNextPage}\n        disabled={currentPage >= totalPages}\n        aria-label=\"Próxima página\"\n        title=\"Próxima página (Page Down)\"\n        className=\"h-8 w-8 p-0\"\n      >\n        <ChevronRightIcon className=\"w-4 h-4\" />\n      </Button>\n    </div>\n  )\n}"
}

Now let me update the EvidenceModal component to include page navigation state and handlers:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "  // State management\n  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0)\n  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null)\n  const [transform, setTransform] = useState<ViewerTransform>(DEFAULT_TRANSFORM)\n  const [dimensions, setDimensions] = useState<DocumentDimensions>({\n    naturalWidth: 0,\n    naturalHeight: 0,\n    renderedWidth: 0,\n    renderedHeight: 0,\n  })\n  const [isLoading, setIsLoading] = useState(true)\n  const [error, setError] = useState<string | null>(null)\n\n  // Get total box count\n  const boxCount = evidence?.boundingBoxes.length ?? 0",
  "new_string": "  // State management\n  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0)\n  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null)\n  const [transform, setTransform] = useState<ViewerTransform>(DEFAULT_TRANSFORM)\n  const [dimensions, setDimensions] = useState<DocumentDimensions>({\n    naturalWidth: 0,\n    naturalHeight: 0,\n    renderedWidth: 0,\n    renderedHeight: 0,\n  })\n  const [isLoading, setIsLoading] = useState(true)\n  const [error, setError] = useState<string | null>(null)\n  const [currentPage, setCurrentPage] = useState(evidence?.pageNumber ?? 1)\n\n  // Get total pages from evidence\n  const totalPages = evidence?.totalPages ?? 1\n\n  // Filter bounding boxes for the current page\n  const currentPageBoxes = useMemo(() => {\n    if (!evidence?.boundingBoxes) return []\n    return evidence.boundingBoxes.filter((box) => box.page === currentPage)\n  }, [evidence?.boundingBoxes, currentPage])\n\n  // Get total box count for current page\n  const boxCount = currentPageBoxes.length"
}

Now let me add the page navigation handlers:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "  const handleNextBox = useCallback(() => {\n    setSelectedBoxIndex((prev) => (prev + 1) % boxCount)\n  }, [boxCount])\n\n  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {",
  "new_string": "  const handleNextBox = useCallback(() => {\n    setSelectedBoxIndex((prev) => (prev + 1) % boxCount)\n  }, [boxCount])\n\n  // Page navigation handlers\n  const handlePreviousPage = useCallback(() => {\n    setCurrentPage((prev) => Math.max(1, prev - 1))\n    setSelectedBoxIndex(0)\n    setTransform(DEFAULT_TRANSFORM)\n  }, [])\n\n  const handleNextPage = useCallback(() => {\n    setCurrentPage((prev) => Math.min(totalPages, prev + 1))\n    setSelectedBoxIndex(0)\n    setTransform(DEFAULT_TRANSFORM)\n  }, [totalPages])\n\n  const handleGoToPage = useCallback((page: number) => {\n    setCurrentPage(Math.max(1, Math.min(totalPages, page)))\n    setSelectedBoxIndex(0)\n    setTransform(DEFAULT_TRANSFORM)\n  }, [totalPages])\n\n  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {"
}

Now let me update the keyboard handler to include page navigation with PageUp/PageDown:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {\n    if (!config.enableKeyboardNavigation) return\n\n    switch (e.key) {\n      case 'ArrowRight':\n      case 'ArrowDown':\n        e.preventDefault()\n        if (boxCount > 0) {\n          setSelectedBoxIndex((prev) => (prev + 1) % boxCount)\n        }\n        break\n\n      case 'ArrowLeft':\n      case 'ArrowUp':\n        e.preventDefault()\n        if (boxCount > 0) {\n          setSelectedBoxIndex((prev) => (prev <= 0 ? boxCount - 1 : prev - 1))\n        }\n        break\n\n      case 'Home':\n        e.preventDefault()\n        setSelectedBoxIndex(0)\n        break\n\n      case 'End':\n        e.preventDefault()\n        setSelectedBoxIndex(Math.max(0, boxCount - 1))\n        break\n    }\n  }, [boxCount, config.enableKeyboardNavigation])",
  "new_string": "  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {\n    if (!config.enableKeyboardNavigation) return\n\n    switch (e.key) {\n      case 'ArrowRight':\n      case 'ArrowDown':\n        e.preventDefault()\n        if (boxCount > 0) {\n          setSelectedBoxIndex((prev) => (prev + 1) % boxCount)\n        }\n        break\n\n      case 'ArrowLeft':\n      case 'ArrowUp':\n        e.preventDefault()\n        if (boxCount > 0) {\n          setSelectedBoxIndex((prev) => (prev <= 0 ? boxCount - 1 : prev - 1))\n        }\n        break\n\n      case 'Home':\n        e.preventDefault()\n        setSelectedBoxIndex(0)\n        break\n\n      case 'End':\n        e.preventDefault()\n        setSelectedBoxIndex(Math.max(0, boxCount - 1))\n        break\n\n      // Page navigation with PageUp/PageDown\n      case 'PageUp':\n        e.preventDefault()\n        if (currentPage > 1) {\n          handlePreviousPage()\n        }\n        break\n\n      case 'PageDown':\n        e.preventDefault()\n        if (currentPage < totalPages) {\n          handleNextPage()\n        }\n        break\n    }\n  }, [boxCount, config.enableKeyboardNavigation, currentPage, totalPages, handlePreviousPage, handleNextPage])"
}

Now I need to update the reset state and subtitle to use the currentPage state, and update the render to pass the filtered boxes:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "  // Reset state when evidence changes\n  if (evidence && evidence.id !== (evidence as any)?.previousId) {\n    setSelectedBoxIndex(0)\n    setTransform(DEFAULT_TRANSFORM)\n    setIsLoading(true)\n    setError(null)\n  }\n\n  // ============================================================================\n  // Build modal title and subtitle\n  // ============================================================================\n\n  const modalTitle = evidence?.documentName ?? 'Visualizar Evidência'\n  const modalSubtitle = evidence\n    ? `Página ${evidence.pageNumber} de ${evidence.totalPages}`\n    : undefined",
  "new_string": "  // Reset state when evidence changes\n  if (evidence && evidence.id !== (evidence as any)?.previousId) {\n    setSelectedBoxIndex(0)\n    setTransform(DEFAULT_TRANSFORM)\n    setIsLoading(true)\n    setError(null)\n    setCurrentPage(evidence.pageNumber ?? 1)\n  }\n\n  // ============================================================================\n  // Build modal title and subtitle\n  // ============================================================================\n\n  const modalTitle = evidence?.documentName ?? 'Visualizar Evidência'\n  const modalSubtitle = totalPages > 1\n    ? `Página ${currentPage} de ${totalPages}${boxCount > 0 ? ` • ${boxCount} evidência${boxCount !== 1 ? 's' : ''}` : ''}`\n    : boxCount > 0\n    ? `${boxCount} evidência${boxCount !== 1 ? 's' : ''}`\n    : undefined"
}

Now let me add the PageNavigation component to the render and update the BoundingBoxOverlay to use the filtered boxes. Let me read the current render section:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "offset": 397,
  "limit": 100
}

Now let me update the render section to use `currentPageBoxes` instead of `evidence.boundingBoxes`, add the PageNavigation component, and update the screen reader text:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "          {/* Document Viewer with Bounding Boxes */}\n          {evidence && !isLoading && !error && (\n            <DocumentViewer\n              imageUrl={evidence.imageUrl}\n              alt={`Documento: ${evidence.documentName}`}\n              transform={transform}\n              onTransformChange={handleTransformChange}\n              showControls={config.showZoomControls}\n              onImageLoad={handleImageLoad}\n              className=\"w-full h-full\"\n            >\n              {/* Bounding Box Overlay */}\n              {dimensions.renderedWidth > 0 && (\n                <BoundingBoxOverlay\n                  boxes={evidence.boundingBoxes}\n                  dimensions={dimensions}\n                  selectedIndex={selectedBoxIndex}\n                  hoveredId={hoveredBoxId}\n                  onBoxClick={handleBoxClick}\n                  onBoxHover={handleBoxHover}\n                />\n              )}\n            </DocumentViewer>\n          )}\n\n          {/* Box Navigation */}\n          {config.showBoxNavigation && !isLoading && !error && boxCount > 1 && (\n            <BoxNavigation\n              currentIndex={selectedBoxIndex}\n              totalBoxes={boxCount}\n              onPrevious={handlePreviousBox}\n              onNext={handleNextBox}\n            />\n          )}\n        </div>\n\n        {/* Screen reader announcements */}\n        <div className=\"sr-only\" role=\"status\" aria-live=\"polite\">\n          {isLoading\n            ? 'Carregando documento...'\n            : evidence\n            ? `Exibindo ${evidence.documentName}, página ${evidence.pageNumber} de ${evidence.totalPages}. ${boxCount} evidência${boxCount !== 1 ? 's' : ''} destacada${boxCount !== 1 ? 's' : ''}.`\n            : ''}\n        </div>",
  "new_string": "          {/* Page Navigation for Multi-page PDFs */}\n          {config.showPageNavigation && !isLoading && !error && totalPages > 1 && (\n            <PageNavigation\n              currentPage={currentPage}\n              totalPages={totalPages}\n              onPreviousPage={handlePreviousPage}\n              onNextPage={handleNextPage}\n              onGoToPage={handleGoToPage}\n            />\n          )}\n\n          {/* Document Viewer with Bounding Boxes */}\n          {evidence && !isLoading && !error && (\n            <DocumentViewer\n              imageUrl={evidence.imageUrl}\n              alt={`Documento: ${evidence.documentName}`}\n              transform={transform}\n              onTransformChange={handleTransformChange}\n              showControls={config.showZoomControls}\n              onImageLoad={handleImageLoad}\n              className=\"w-full h-full\"\n            >\n              {/* Bounding Box Overlay - filtered by current page */}\n              {dimensions.renderedWidth > 0 && (\n                <BoundingBoxOverlay\n                  boxes={currentPageBoxes}\n                  dimensions={dimensions}\n                  selectedIndex={selectedBoxIndex}\n                  hoveredId={hoveredBoxId}\n                  onBoxClick={handleBoxClick}\n                  onBoxHover={handleBoxHover}\n                />\n              )}\n            </DocumentViewer>\n          )}\n\n          {/* Box Navigation */}\n          {config.showBoxNavigation && !isLoading && !error && boxCount > 1 && (\n            <BoxNavigation\n              currentIndex={selectedBoxIndex}\n              totalBoxes={boxCount}\n              onPrevious={handlePreviousBox}\n              onNext={handleNextBox}\n            />\n          )}\n        </div>\n\n        {/* Screen reader announcements */}\n        <div className=\"sr-only\" role=\"status\" aria-live=\"polite\">\n          {isLoading\n            ? 'Carregando documento...'\n            : evidence\n            ? `Exibindo ${evidence.documentName}, página ${currentPage} de ${totalPages}. ${boxCount} evidência${boxCount !== 1 ? 's' : ''} nesta página.`\n            : ''}\n        </div>"
}

The EvidenceModal now has multi-page PDF navigation support. Now let me also update the OCR types to ensure page information is properly handled. Let me also check if there's a test page for the evidence modal that needs updating:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestEvidenceModalPage.tsx"
}

The test page already has multi-page document examples. Let me update it to add better multi-page testing with boxes on different pages:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestEvidenceModalPage.tsx",
  "old_string": "/**\n * Sample evidence item for property document with multiple pages\n */\nconst sampleEvidenceProperty: EvidenceItem = {\n  id: 'evidence-property-1',\n  documentId: 'doc-property-001',\n  imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=1100&fit=crop',\n  documentType: 'deed',\n  documentName: 'Escritura do Imóvel - Matrícula 12345',\n  pageNumber: 1,\n  totalPages: 3,\n  boundingBoxes: [\n    {\n      id: 'prop-box-1',\n      page: 1,\n      label: 'Número da Matrícula',\n      confidence: 0.98,\n      x: 150,\n      y: 100,\n      width: 200,\n      height: 40,\n      fieldName: 'registrationNumber',\n      extractedText: '12.345',\n    },\n    {\n      id: 'prop-box-2',\n      page: 1,\n      label: 'Endereço do Imóvel',\n      confidence: 0.85,\n      x: 100,\n      y: 200,\n      width: 400,\n      height: 60,\n      fieldName: 'propertyAddress',\n      extractedText: 'Av. Paulista, 1000, Apto 101 - Bela Vista - São Paulo/SP',\n    },\n    {\n      id: 'prop-box-3',\n      page: 1,\n      label: 'Área Total',\n      confidence: 0.92,\n      x: 100,\n      y: 300,\n      width: 150,\n      height: 35,\n      fieldName: 'totalArea',\n      extractedText: '85,00 m²',\n    },\n  ],\n  entityType: 'property',\n  entityId: 'property-001',\n  fieldName: 'deed',\n}",
  "new_string": "/**\n * Sample evidence item for property document with multiple pages\n * Includes bounding boxes on different pages to test multi-page navigation\n */\nconst sampleEvidenceProperty: EvidenceItem = {\n  id: 'evidence-property-1',\n  documentId: 'doc-property-001',\n  imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=1100&fit=crop',\n  documentType: 'deed',\n  documentName: 'Escritura do Imóvel - Matrícula 12345',\n  pageNumber: 1,\n  totalPages: 3,\n  boundingBoxes: [\n    // Page 1 boxes\n    {\n      id: 'prop-box-1',\n      page: 1,\n      label: 'Número da Matrícula',\n      confidence: 0.98,\n      x: 150,\n      y: 100,\n      width: 200,\n      height: 40,\n      fieldName: 'registrationNumber',\n      extractedText: '12.345',\n    },\n    {\n      id: 'prop-box-2',\n      page: 1,\n      label: 'Endereço do Imóvel',\n      confidence: 0.85,\n      x: 100,\n      y: 200,\n      width: 400,\n      height: 60,\n      fieldName: 'propertyAddress',\n      extractedText: 'Av. Paulista, 1000, Apto 101 - Bela Vista - São Paulo/SP',\n    },\n    // Page 2 boxes\n    {\n      id: 'prop-box-3',\n      page: 2,\n      label: 'Área Total',\n      confidence: 0.92,\n      x: 100,\n      y: 150,\n      width: 150,\n      height: 35,\n      fieldName: 'totalArea',\n      extractedText: '85,00 m²',\n    },\n    {\n      id: 'prop-box-4',\n      page: 2,\n      label: 'Valor Venal',\n      confidence: 0.88,\n      x: 100,\n      y: 220,\n      width: 180,\n      height: 35,\n      fieldName: 'assessedValue',\n      extractedText: 'R$ 450.000,00',\n    },\n    // Page 3 boxes\n    {\n      id: 'prop-box-5',\n      page: 3,\n      label: 'Assinatura do Vendedor',\n      confidence: 0.75,\n      x: 150,\n      y: 350,\n      width: 200,\n      height: 60,\n      fieldName: 'sellerSignature',\n      extractedText: '[Assinatura]',\n    },\n    {\n      id: 'prop-box-6',\n      page: 3,\n      label: 'Assinatura do Comprador',\n      confidence: 0.78,\n      x: 400,\n      y: 350,\n      width: 200,\n      height: 60,\n      fieldName: 'buyerSignature',\n      extractedText: '[Assinatura]',\n    },\n  ],\n  entityType: 'property',\n  entityId: 'property-001',\n  fieldName: 'deed',\n}"
}

Now let me update the keyboard shortcuts reference in the test page to include the new page navigation shortcuts:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestEvidenceModalPage.tsx",
  "old_string": "      {/* Keyboard Shortcuts Reference */}\n      <Alert className=\"border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20\">\n        <AlertDescription className=\"text-blue-900 dark:text-blue-100\">\n          <h2 className=\"text-sm font-medium mb-3\">\n            ⌨️ Atalhos de Teclado (quando o modal está aberto)\n          </h2>\n          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3 text-sm\">\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">ESC</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Fechar</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">← / ↑</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Box anterior</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">→ / ↓</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Próximo box</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">Home</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Primeiro box</span>\n            </div>\n          </div>\n        </AlertDescription>\n      </Alert>",
  "new_string": "      {/* Keyboard Shortcuts Reference */}\n      <Alert className=\"border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20\">\n        <AlertDescription className=\"text-blue-900 dark:text-blue-100\">\n          <h2 className=\"text-sm font-medium mb-3\">\n            ⌨️ Atalhos de Teclado (quando o modal está aberto)\n          </h2>\n          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3 text-sm\">\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">ESC</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Fechar</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">← / ↑</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Box anterior</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">→ / ↓</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Próximo box</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">Home</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Primeiro box</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">PgUp</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Página anterior</span>\n            </div>\n            <div className=\"flex items-center gap-2\">\n              <kbd className=\"px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs\">PgDn</kbd>\n              <span className=\"text-gray-600 dark:text-gray-400\">Próxima página</span>\n            </div>\n          </div>\n        </AlertDescription>\n      </Alert>"
}

Now let me update the features checklist to include multi-page navigation:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestEvidenceModalPage.tsx",
  "old_string": "              <li className=\"flex items-start gap-2\">\n                <span className=\"text-green-500 mt-0.5\">✓</span>\n                <span className=\"text-gray-700 dark:text-gray-300\">\n                  <strong>Navegação por teclado</strong> - ESC fecha, setas navegam entre boxes\n                </span>\n              </li>",
  "new_string": "              <li className=\"flex items-start gap-2\">\n                <span className=\"text-green-500 mt-0.5\">✓</span>\n                <span className=\"text-gray-700 dark:text-gray-300\">\n                  <strong>Navegação por teclado</strong> - ESC fecha, setas navegam entre boxes, PgUp/PgDn navegam páginas\n                </span>\n              </li>\n              <li className=\"flex items-start gap-2\">\n                <span className=\"text-green-500 mt-0.5\">✓</span>\n                <span className=\"text-gray-700 dark:text-gray-300\">\n                  <strong>Multi-page PDF</strong> - Navegação entre páginas com filtro de bounding boxes por página\n                </span>\n              </li>"
}

Now let me also update the description for the property document test case:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestEvidenceModalPage.tsx",
  "old_string": "                    <p className=\"text-sm text-gray-500 dark:text-gray-400 mt-0.5\">\n                      Escritura com 3 campos destacados, documento multi-página\n                    </p>\n                    <div className=\"flex flex-wrap gap-2 mt-2\">\n                      <span className=\"text-xs text-gray-500 dark:text-gray-400\">\n                        Página 1 de 3\n                      </span>\n                    </div>",
  "new_string": "                    <p className=\"text-sm text-gray-500 dark:text-gray-400 mt-0.5\">\n                      Escritura com 6 campos distribuídos em 3 páginas - testa navegação multi-página\n                    </p>\n                    <div className=\"flex flex-wrap gap-2 mt-2\">\n                      <Badge variant=\"outline\">Página 1: 2 campos</Badge>\n                      <Badge variant=\"outline\">Página 2: 2 campos</Badge>\n                      <Badge variant=\"outline\">Página 3: 2 campos</Badge>\n                    </div>"
}

Now let's start the dev server and verify the implementation using Playwright MCP:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run dev 2>&1 &",
  "description": "Start Vite development server",
  "timeout": 15000,
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "sleep 5 && cat \"C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\b855afe.output\"",
  "description": "Check dev server output",
  "timeout": 10000
}

The dev server is running on port 5177. Now let's verify using Playwright MCP:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5177/test/evidence-modal"
}

Let me check the routes available:

🔧 Tool: Grep
Input: {
  "pattern": "TestEvidenceModalPage|evidence-modal",
  "output_mode": "content",
  "path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src"
}

The route is `/test-evidence-modal` not `/test/evidence-modal`. Let me navigate to the correct URL:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5177/test-evidence-modal"
}

The page is loading correctly. I can see the multi-page test case is showing "Escritura com 6 campos distribuídos em 3 páginas - testa navegação multi-página". Now let me click on the "Documento de Imóvel" button to test the multi-page navigation:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Visualizar button for property document",
  "ref": "e61"
}

There's an infinite re-render loop. The issue is in the state reset logic where we're checking and setting state in the render phase. Let me fix this:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "offset": 370,
  "limit": 30
}

The issue is that we're setting state directly in the render phase. This was already problematic code in the original, but now with more state updates it's causing an infinite loop. Let me fix this by using `useEffect`:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "import { useCallback, useState, useMemo } from 'react'",
  "new_string": "import { useCallback, useState, useMemo, useEffect, useRef } from 'react'"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "  const handleOpenChange = (open: boolean) => {\n    if (!open) {\n      onClose()\n    }\n  }\n\n  // Reset state when evidence changes\n  if (evidence && evidence.id !== (evidence as any)?.previousId) {\n    setSelectedBoxIndex(0)\n    setTransform(DEFAULT_TRANSFORM)\n    setIsLoading(true)\n    setError(null)\n    setCurrentPage(evidence.pageNumber ?? 1)\n  }",
  "new_string": "  const handleOpenChange = (open: boolean) => {\n    if (!open) {\n      onClose()\n    }\n  }\n\n  // Track previous evidence ID to reset state when evidence changes\n  const prevEvidenceIdRef = useRef<string | null>(null)\n\n  // Reset state when evidence changes\n  useEffect(() => {\n    if (evidence && evidence.id !== prevEvidenceIdRef.current) {\n      prevEvidenceIdRef.current = evidence.id\n      setSelectedBoxIndex(0)\n      setTransform(DEFAULT_TRANSFORM)\n      setIsLoading(true)\n      setError(null)\n      setCurrentPage(evidence.pageNumber ?? 1)\n    }\n  }, [evidence])"
}

Now let me test again:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5177/test-evidence-modal"
}

Now let me click on the multi-page document to test the modal:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Visualizar button for property document",
  "ref": "e61"
}

The modal opened and I can see it's showing:
- **Title**: "Escritura do Imóvel - Matrícula 12345"
- **Subtitle**: "Página 1 de 3 • 2 evidências"

This shows the multi-page navigation is working! Let me wait for the image to load and take a snapshot:

🔧 Tool: mcp__playwright__browser_wait_for
Input: {
  "time": 3
}

Let me get the current snapshot to see the full modal state:

🔧 Tool: mcp__playwright__browser_snapshot
Input: {}

The modal is open with "Página 1 de 3 • 2 evidências". The image is still loading. Let me take a screenshot to capture the current state:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "multipage-pdf-modal-page1.png"
}

The modal is showing correctly with:
- **Title**: "Escritura do Imóvel - Matrícula 12345"
- **Subtitle**: "Página 1 de 3 • 2 evidências"

The image is loading from Unsplash. Let me wait a bit more and then take another screenshot:

🔧 Tool: mcp__playwright__browser_wait_for
Input: {
  "time": 5
}

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "multipage-pdf-modal-loaded.png"
}

The image is still loading (the Unsplash image might be slow). The key thing is the modal is displaying correctly with the multi-page information. The issue is that the page navigation component should be showing but it's not visible because the image hasn't loaded yet.

Looking at the code, the `PageNavigation` component only renders when `!isLoading`. Let me check the code flow - the `isLoading` state might not be correctly updated. Let me look at the issue:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "offset": 430,
  "limit": 60
}

I see the issue - the `isLoading` is set to `true` by the useEffect when evidence changes, but the modal is waiting for the DocumentViewer's image to load, which it can't do because the DocumentViewer won't even render while `isLoading` is true.

The `isLoading` state in the modal should be separate from the image loading in DocumentViewer. Let me check the handleImageLoad callback:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "offset": 275,
  "limit": 30
}

I see - the `handleImageLoad` sets `isLoading` to false. The problem is that the DocumentViewer component has its own internal loading state. The modal's `isLoading` state is different from the viewer's state.

Looking at the render logic:
1. When `isLoading=true`: Shows loading spinner
2. When `isLoading=false`: Shows DocumentViewer

But the DocumentViewer itself has its own loading state. The modal's `isLoading` is reset to `true` when evidence changes, and it should be set to `false` immediately when we have evidence so the DocumentViewer can start loading.

The issue is that the useEffect sets `isLoading` to `true`, but then the DocumentViewer is never rendered because `!isLoading` is false. Let me fix this:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "old_string": "  // Reset state when evidence changes\n  useEffect(() => {\n    if (evidence && evidence.id !== prevEvidenceIdRef.current) {\n      prevEvidenceIdRef.current = evidence.id\n      setSelectedBoxIndex(0)\n      setTransform(DEFAULT_TRANSFORM)\n      setIsLoading(true)\n      setError(null)\n      setCurrentPage(evidence.pageNumber ?? 1)\n    }\n  }, [evidence])",
  "new_string": "  // Reset state when evidence changes\n  useEffect(() => {\n    if (evidence && evidence.id !== prevEvidenceIdRef.current) {\n      prevEvidenceIdRef.current = evidence.id\n      setSelectedBoxIndex(0)\n      setTransform(DEFAULT_TRANSFORM)\n      setError(null)\n      setCurrentPage(evidence.pageNumber ?? 1)\n      // Note: isLoading is managed by the DocumentViewer's onImageLoad callback\n      // We set it to false here so the DocumentViewer renders and can start loading\n      setIsLoading(false)\n    }\n  }, [evidence])"
}

Actually, the issue is that the DocumentViewer has its own internal loading. Let me check the DocumentViewer to understand better and also look at how the modal's loading state should work. The `isLoading` state in the modal might be redundant since the DocumentViewer manages its own loading state.

Let me look at how the modal originally worked:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\evidence\\EvidenceModal.tsx",
  "offset": 248,
  "limit": 30
}

I see - the modal has an `isLoading` state that starts as `true`. The DocumentViewer also has its own internal loading state. The problem is that:

1. Modal initially has `isLoading = true`
2. DocumentViewer is only rendered when `!isLoading` 
3. So the image never loads and `handleImageLoad` is never called to set `isLoading = false`

This is a catch-22. The fix I made should work - setting `isLoading = false` when evidence changes. Let me refresh and test:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5177/test-evidence-modal"
}

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Visualizar button for property document",
  "ref": "e61"
}

Excellent! Now the modal is working perfectly! I can see:

1. **Page Navigation Component**: Shows "Página" with a dropdown selector (1, 2, 3) and "de 3"
2. **Page 1 Content**: Shows "2 evidências" - the 2 bounding boxes for page 1 ("Número da Matrícula" and "Endereço do Imóvel")
3. **Box Navigation**: Shows "1 / 2" for navigating between boxes on this page
4. **Zoom Controls**: Working properly
5. **Screen reader status**: "Exibindo Escritura do Imóvel - Matrícula 12345, página 1 de 3. 2 evidências nesta página."

Let me take a screenshot and then test the page navigation:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "multipage-pdf-page1-working.png"
}

Now let me test navigating to page 2 by clicking the next page button:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Next page button",
  "ref": "e155"
}

The page navigation is working perfectly! Now we're on **Page 2** and I can see:

1. **Header updated**: "Página 2 de 3 • 2 evidências"
2. **Dropdown updated**: Option "2" is now selected
3. **Different bounding boxes for Page 2**: "Área Total: 85,00 m²" and "Valor Venal: R$ 450.000,00"
4. **Previous page button enabled**: Now clickable
5. **Screen reader status updated**: "Exibindo Escritura do Imóvel - Matrícula 12345, página 2 de 3. 2 evidências nesta página."

Let me navigate to page 3 and take a screenshot:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Next page button",
  "ref": "e155"
}

Now we're on **Page 3** and everything is working:

1. **Header**: "Página 3 de 3 • 2 evidências"
2. **Dropdown**: Option "3" is selected
3. **Page 3 bounding boxes**: "Assinatura do Vendedor" and "Assinatura do Comprador"
4. **Next page button disabled**: Can't go beyond page 3
5. **Screen reader status**: "Exibindo Escritura do Imóvel - Matrícula 12345, página 3 de 3. 2 evidências nesta página."

Let me take a final screenshot and close the modal:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "multipage-pdf-page3-final.png"
}

Now let me close the modal and browser:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Close button",
  "ref": "e177"
}

The modal closed successfully. Now let me close the browser and provide the summary:

🔧 Tool: mcp__playwright__browser_close
Input: {}

<summary>
## Summary: Multi-page PDF Processing

### Changes Implemented
- **Added Page Navigation Component**: Created a `PageNavigation` component in `EvidenceModal.tsx` that displays page controls with previous/next buttons and a dropdown selector for direct page access
- **Page-based Bounding Box Filtering**: Added `useMemo` hook to filter bounding boxes by current page, so each page only shows its relevant evidence markers
- **Current Page State Management**: Added `currentPage` state with handlers for `handlePreviousPage`, `handleNextPage`, and `handleGoToPage`
- **Keyboard Navigation Support**: Added PageUp/PageDown keyboard shortcuts for navigating between pages in the document viewer
- **Updated Modal Header**: The subtitle now dynamically shows "Página X de Y • N evidências" for multi-page documents
- **Screen Reader Support**: Updated ARIA live region to announce current page and evidence count
- **Fixed Infinite Re-render Bug**: Converted direct render-phase state updates to proper `useEffect` with ref tracking
- **Updated Test Page**: Enhanced `TestEvidenceModalPage.tsx` with a multi-page document test case that has bounding boxes distributed across 3 pages

### Files Modified
- `src/components/evidence/EvidenceModal.tsx` - Added PageNavigation component, page state management, keyboard handlers, and page-filtered bounding boxes
- `src/pages/TestEvidenceModalPage.tsx` - Updated test data with multi-page document example and added keyboard shortcut documentation

### Verification Status
Successfully verified using Playwright MCP tools:
1. ✅ Navigated to `/test-evidence-modal` page
2. ✅ Opened multi-page document modal ("Escritura do Imóvel - Matrícula 12345")
3. ✅ Verified Page 1 shows "Página 1 de 3 • 2 evidências" with correct bounding boxes ("Número da Matrícula", "Endereço do Imóvel")
4. ✅ Navigated to Page 2 - shows different bounding boxes ("Área Total", "Valor Venal")
5. ✅ Navigated to Page 3 - shows page 3 bounding boxes ("Assinatura do Vendedor", "Assinatura do Comprador")
6. ✅ Verified dropdown selector updates correctly
7. ✅ Verified previous/next buttons enable/disable appropriately
8. ✅ Modal closes properly

### Notes for Developer
- The OCR processing in `worker/src/jobs/ocr.ts` already supports multi-page PDF processing - it iterates through all pages from Google Document AI and stores page numbers with each OCR block
- The `page_count` field is already stored in the documents table
- Each `EvidenceBoundingBox` has a `page` property that determines which page it belongs to
- In production, the image URL would need to change per page (currently uses same image for demo)
- For actual PDF rendering, you may want to integrate a PDF.js viewer or convert PDF pages to images on the backend
</summary>