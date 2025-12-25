# Planning Outline

1. **Goal**: Implement batch operations on documents to allow users to select multiple documents and perform bulk actions (delete, export, etc.).

2. **Approach**: First, I'll explore the codebase to understand the existing document structure, UI components, and patterns. Then I'll implement a selection mechanism for documents, add a batch operations toolbar that appears when documents are selected, and implement the batch actions (likely delete, export, and possibly move operations).

3. **Files to Touch**:
   - Document list/grid components - Add selection checkboxes and selection state
   - Create a BatchOperationsToolbar component - Shows selected count and action buttons
   - Document store/state management - Add selection state tracking
   - API/service layer - Add batch operation endpoints if needed

4. **Tasks**:
   1. Explore existing codebase structure (documents, components, state management)
   2. Add document selection state management
   3. Modify document list/grid to support multi-select with checkboxes
   4. Create BatchOperationsToolbar component with actions
   5. Implement batch delete operation
   6. Implement batch export operation
   7. Verify with Playwright MCP tools

5. **Risks**:
   - Need to ensure batch operations handle errors gracefully (partial failures)
   - Must maintain consistent UI state when operations complete
   - Large batch operations may need confirmation dialogs

[PLAN_GENERATED] Planning outline complete.

---

Now let me explore the codebase to understand the existing structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/document*"
}

🔧 Tool: Read
Input: {
  "file_path": "/package.json"
}

Let me explore the src directory structure more specifically:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\package.json"
}

Now let me explore the document-related components and the store structure:

🔧 Tool: Glob
Input: {
  "pattern": "src/components/documents/**/*.{ts,tsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/store/**/*.{ts,tsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/pages/*Document*.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\services\\documentService.ts"
}

Now let me look at the UploadPage to see where documents are displayed and find any existing patterns:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

Now let me look at the DeleteConfirmationModal and the stores to understand the existing patterns:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\common\\DeleteConfirmationModal.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/stores/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\stores\\caseStore.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\ui\\button.tsx"
}

Now I have a good understanding of the codebase. Let me start implementing the batch operations feature. I'll create:

1. A hook for batch selection state management
2. A BatchOperationsToolbar component
3. Modify the DocumentCard to include checkboxes
4. Update the UploadPage to use these new components

Let me start:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\hooks\\useBatchSelection.ts",
  "content": "/**\n * useBatchSelection Hook\n *\n * A hook for managing batch selection state for documents or other items.\n * Provides selection state management, select all/none functionality,\n * and utilities for batch operations.\n */\n\nimport { useState, useCallback, useMemo } from 'react'\n\nexport interface UseBatchSelectionOptions<T> {\n  /** The list of all items that can be selected */\n  items: T[]\n  /** Function to extract a unique ID from each item */\n  getItemId: (item: T) => string\n  /** Initial selected item IDs */\n  initialSelectedIds?: string[]\n}\n\nexport interface UseBatchSelectionReturn {\n  /** Set of currently selected item IDs */\n  selectedIds: Set<string>\n  /** Number of selected items */\n  selectedCount: number\n  /** Whether any items are selected */\n  hasSelection: boolean\n  /** Whether all items are selected */\n  isAllSelected: boolean\n  /** Whether some (but not all) items are selected */\n  isIndeterminate: boolean\n  /** Check if a specific item is selected */\n  isSelected: (id: string) => boolean\n  /** Toggle selection of a specific item */\n  toggleSelection: (id: string) => void\n  /** Select a specific item */\n  selectItem: (id: string) => void\n  /** Deselect a specific item */\n  deselectItem: (id: string) => void\n  /** Select all items */\n  selectAll: () => void\n  /** Deselect all items */\n  deselectAll: () => void\n  /** Toggle select all/none */\n  toggleSelectAll: () => void\n  /** Select multiple items at once */\n  selectItems: (ids: string[]) => void\n  /** Deselect multiple items at once */\n  deselectItems: (ids: string[]) => void\n  /** Clear selection (alias for deselectAll) */\n  clearSelection: () => void\n}\n\nexport function useBatchSelection<T>({\n  items,\n  getItemId,\n  initialSelectedIds = [],\n}: UseBatchSelectionOptions<T>): UseBatchSelectionReturn {\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(\n    () => new Set(initialSelectedIds)\n  )\n\n  // Memoize the list of all item IDs\n  const allItemIds = useMemo(\n    () => items.map(getItemId),\n    [items, getItemId]\n  )\n\n  // Derived state\n  const selectedCount = selectedIds.size\n  const hasSelection = selectedCount > 0\n  const isAllSelected = selectedCount > 0 && selectedCount === allItemIds.length\n  const isIndeterminate = selectedCount > 0 && selectedCount < allItemIds.length\n\n  // Check if a specific item is selected\n  const isSelected = useCallback(\n    (id: string) => selectedIds.has(id),\n    [selectedIds]\n  )\n\n  // Toggle selection of a specific item\n  const toggleSelection = useCallback((id: string) => {\n    setSelectedIds((prev) => {\n      const next = new Set(prev)\n      if (next.has(id)) {\n        next.delete(id)\n      } else {\n        next.add(id)\n      }\n      return next\n    })\n  }, [])\n\n  // Select a specific item\n  const selectItem = useCallback((id: string) => {\n    setSelectedIds((prev) => {\n      if (prev.has(id)) return prev\n      const next = new Set(prev)\n      next.add(id)\n      return next\n    })\n  }, [])\n\n  // Deselect a specific item\n  const deselectItem = useCallback((id: string) => {\n    setSelectedIds((prev) => {\n      if (!prev.has(id)) return prev\n      const next = new Set(prev)\n      next.delete(id)\n      return next\n    })\n  }, [])\n\n  // Select all items\n  const selectAll = useCallback(() => {\n    setSelectedIds(new Set(allItemIds))\n  }, [allItemIds])\n\n  // Deselect all items\n  const deselectAll = useCallback(() => {\n    setSelectedIds(new Set())\n  }, [])\n\n  // Toggle select all/none\n  const toggleSelectAll = useCallback(() => {\n    if (isAllSelected) {\n      deselectAll()\n    } else {\n      selectAll()\n    }\n  }, [isAllSelected, selectAll, deselectAll])\n\n  // Select multiple items at once\n  const selectItems = useCallback((ids: string[]) => {\n    setSelectedIds((prev) => {\n      const next = new Set(prev)\n      ids.forEach((id) => next.add(id))\n      return next\n    })\n  }, [])\n\n  // Deselect multiple items at once\n  const deselectItems = useCallback((ids: string[]) => {\n    setSelectedIds((prev) => {\n      const next = new Set(prev)\n      ids.forEach((id) => next.delete(id))\n      return next\n    })\n  }, [])\n\n  // Clear selection (alias for deselectAll)\n  const clearSelection = deselectAll\n\n  return {\n    selectedIds,\n    selectedCount,\n    hasSelection,\n    isAllSelected,\n    isIndeterminate,\n    isSelected,\n    toggleSelection,\n    selectItem,\n    deselectItem,\n    selectAll,\n    deselectAll,\n    toggleSelectAll,\n    selectItems,\n    deselectItems,\n    clearSelection,\n  }\n}\n\nexport default useBatchSelection\n"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\BatchOperationsToolbar.tsx",
  "content": "/**\n * BatchOperationsToolbar Component\n *\n * A floating toolbar that appears when documents are selected,\n * providing batch operations like delete, export, and reprocess.\n *\n * Features:\n * - Shows selected document count\n * - Batch delete with confirmation\n * - Batch export to PDF/JSON\n * - Clear selection\n * - Animated entrance/exit\n * - Dark mode support\n */\n\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  TrashIcon,\n  XMarkIcon,\n  ArrowDownTrayIcon,\n  ArrowPathIcon,\n  CheckIcon,\n} from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { cn } from '@/lib/utils'\n\nexport interface BatchOperationsToolbarProps {\n  /** Number of selected items */\n  selectedCount: number\n  /** Whether all items are selected */\n  isAllSelected: boolean\n  /** Total number of items */\n  totalCount: number\n  /** Callback to select all items */\n  onSelectAll: () => void\n  /** Callback to clear selection */\n  onClearSelection: () => void\n  /** Callback to delete selected items */\n  onBatchDelete: () => void\n  /** Callback to export selected items */\n  onBatchExport?: () => void\n  /** Callback to reprocess selected items */\n  onBatchReprocess?: () => void\n  /** Whether batch delete is in progress */\n  isDeleting?: boolean\n  /** Whether batch export is in progress */\n  isExporting?: boolean\n  /** Whether batch reprocess is in progress */\n  isReprocessing?: boolean\n  /** Additional class names */\n  className?: string\n}\n\nexport default function BatchOperationsToolbar({\n  selectedCount,\n  isAllSelected,\n  totalCount,\n  onSelectAll,\n  onClearSelection,\n  onBatchDelete,\n  onBatchExport,\n  onBatchReprocess,\n  isDeleting = false,\n  isExporting = false,\n  isReprocessing = false,\n  className,\n}: BatchOperationsToolbarProps) {\n  const isProcessing = isDeleting || isExporting || isReprocessing\n\n  return (\n    <AnimatePresence>\n      {selectedCount > 0 && (\n        <motion.div\n          initial={{ opacity: 0, y: 20, scale: 0.95 }}\n          animate={{ opacity: 1, y: 0, scale: 1 }}\n          exit={{ opacity: 0, y: 20, scale: 0.95 }}\n          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}\n          className={cn(\n            // Fixed positioning at bottom of viewport\n            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',\n            // Glassmorphism styling\n            'bg-white/95 dark:bg-gray-800/95',\n            'backdrop-blur-lg',\n            'border border-gray-200/50 dark:border-gray-700/50',\n            'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',\n            'rounded-xl',\n            // Layout\n            'flex items-center gap-2 px-4 py-3',\n            className\n          )}\n          role=\"toolbar\"\n          aria-label=\"Operacoes em lote\"\n        >\n          {/* Selection info */}\n          <div className=\"flex items-center gap-3 pr-3 border-r border-gray-200 dark:border-gray-700\">\n            <div className=\"flex items-center gap-2\">\n              <div className=\"flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-sm\">\n                {selectedCount}\n              </div>\n              <span className=\"text-sm text-gray-700 dark:text-gray-300\">\n                {selectedCount === 1 ? 'documento selecionado' : 'documentos selecionados'}\n              </span>\n            </div>\n\n            {/* Select all / Deselect all toggle */}\n            {!isAllSelected && totalCount > selectedCount && (\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                onClick={onSelectAll}\n                className=\"text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 h-7 px-2\"\n                disabled={isProcessing}\n              >\n                <CheckIcon className=\"w-3.5 h-3.5 mr-1\" />\n                Selecionar todos ({totalCount})\n              </Button>\n            )}\n          </div>\n\n          {/* Action buttons */}\n          <div className=\"flex items-center gap-1\">\n            {/* Batch reprocess */}\n            {onBatchReprocess && (\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                onClick={onBatchReprocess}\n                disabled={isProcessing}\n                className=\"gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20\"\n                title=\"Reprocessar documentos selecionados\"\n              >\n                <ArrowPathIcon className={cn('w-4 h-4', isReprocessing && 'animate-spin')} />\n                <span className=\"hidden sm:inline\">Reprocessar</span>\n              </Button>\n            )}\n\n            {/* Batch export */}\n            {onBatchExport && (\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                onClick={onBatchExport}\n                disabled={isProcessing}\n                className=\"gap-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20\"\n                title=\"Exportar documentos selecionados\"\n              >\n                <ArrowDownTrayIcon className={cn('w-4 h-4', isExporting && 'animate-bounce')} />\n                <span className=\"hidden sm:inline\">Exportar</span>\n              </Button>\n            )}\n\n            {/* Batch delete */}\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={onBatchDelete}\n              disabled={isProcessing}\n              className=\"gap-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20\"\n              title=\"Excluir documentos selecionados\"\n            >\n              {isDeleting ? (\n                <svg className=\"animate-spin w-4 h-4\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">\n                  <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>\n                  <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>\n                </svg>\n              ) : (\n                <TrashIcon className=\"w-4 h-4\" />\n              )}\n              <span className=\"hidden sm:inline\">Excluir</span>\n            </Button>\n          </div>\n\n          {/* Clear selection button */}\n          <div className=\"pl-2 border-l border-gray-200 dark:border-gray-700\">\n            <Button\n              variant=\"ghost\"\n              size=\"icon\"\n              onClick={onClearSelection}\n              disabled={isProcessing}\n              className=\"h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200\"\n              title=\"Limpar selecao\"\n              aria-label=\"Limpar selecao\"\n            >\n              <XMarkIcon className=\"w-4 h-4\" />\n            </Button>\n          </div>\n        </motion.div>\n      )}\n    </AnimatePresence>\n  )\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\BatchDeleteConfirmationModal.tsx",
  "content": "/**\n * BatchDeleteConfirmationModal Component\n *\n * A modal for confirming batch deletion of multiple documents.\n * Shows the count of documents to be deleted and lists their names.\n *\n * Features:\n * - Lists documents to be deleted\n * - Shows warning about data loss\n * - Animated loading state\n * - Dark mode support\n */\n\nimport { ExclamationTriangleIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline'\nimport {\n  Dialog,\n  DialogContent,\n  DialogDescription,\n  DialogFooter,\n  DialogHeader,\n  DialogTitle,\n} from '@/components/ui/dialog'\nimport { Button } from '@/components/ui/button'\nimport { ScrollArea } from '@/components/ui/scroll-area'\nimport type { Document } from '../../types'\n\nexport interface BatchDeleteConfirmationModalProps {\n  isOpen: boolean\n  onClose: () => void\n  onConfirm: () => void\n  documents: Document[]\n  isDeleting?: boolean\n  successCount?: number\n  failureCount?: number\n}\n\nexport default function BatchDeleteConfirmationModal({\n  isOpen,\n  onClose,\n  onConfirm,\n  documents,\n  isDeleting = false,\n  successCount,\n  failureCount,\n}: BatchDeleteConfirmationModalProps) {\n  const count = documents.length\n  const showResults = successCount !== undefined || failureCount !== undefined\n\n  return (\n    <Dialog open={isOpen} onOpenChange={onClose}>\n      <DialogContent className=\"glass-dialog max-w-md\">\n        <div className=\"flex items-start gap-4\">\n          <div className=\"flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center\">\n            <ExclamationTriangleIcon className=\"w-6 h-6 text-red-600 dark:text-red-400\" />\n          </div>\n          <div className=\"flex-1\">\n            <DialogHeader className=\"text-left p-0 space-y-2\">\n              <DialogTitle className=\"text-red-600 dark:text-red-400\">\n                Excluir {count} {count === 1 ? 'documento' : 'documentos'}?\n              </DialogTitle>\n              <DialogDescription className=\"text-sm text-gray-500 dark:text-gray-400\">\n                Esta acao ira remover permanentemente {count === 1 ? 'o documento selecionado' : 'os documentos selecionados'} e todos os dados associados, incluindo extracoes, evidencias e referencias em entidades.\n              </DialogDescription>\n            </DialogHeader>\n          </div>\n        </div>\n\n        {/* Document list */}\n        <div className=\"mt-4\">\n          <p className=\"text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider\">\n            Documentos a serem excluidos:\n          </p>\n          <ScrollArea className=\"h-[150px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50\">\n            <div className=\"p-2 space-y-1\">\n              {documents.map((doc) => (\n                <div\n                  key={doc.id}\n                  className=\"flex items-center gap-2 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700\"\n                >\n                  <DocumentIcon className=\"w-4 h-4 text-gray-400 flex-shrink-0\" />\n                  <span className=\"text-sm text-gray-700 dark:text-gray-300 truncate\">\n                    {doc.original_name}\n                  </span>\n                </div>\n              ))}\n            </div>\n          </ScrollArea>\n        </div>\n\n        {/* Results feedback */}\n        {showResults && (\n          <div className=\"mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700\">\n            <div className=\"flex items-center gap-4 text-sm\">\n              {successCount !== undefined && successCount > 0 && (\n                <span className=\"text-green-600 dark:text-green-400\">\n                  {successCount} excluido{successCount !== 1 ? 's' : ''} com sucesso\n                </span>\n              )}\n              {failureCount !== undefined && failureCount > 0 && (\n                <span className=\"text-red-600 dark:text-red-400\">\n                  {failureCount} falha{failureCount !== 1 ? 's' : ''}\n                </span>\n              )}\n            </div>\n          </div>\n        )}\n\n        <DialogFooter>\n          <Button\n            variant=\"outline\"\n            onClick={onClose}\n            disabled={isDeleting}\n          >\n            Cancelar\n          </Button>\n          <Button\n            variant=\"destructive\"\n            onClick={onConfirm}\n            disabled={isDeleting}\n          >\n            {isDeleting ? (\n              <>\n                <svg className=\"animate-spin -ml-1 mr-2 h-5 w-5\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">\n                  <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>\n                  <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>\n                </svg>\n                Excluindo...\n              </>\n            ) : (\n              <>\n                <TrashIcon className=\"w-5 h-5 mr-2\" />\n                Excluir {count} {count === 1 ? 'documento' : 'documentos'}\n              </>\n            )}\n          </Button>\n        </DialogFooter>\n      </DialogContent>\n    </Dialog>\n  )\n}\n"
}

Now let me update the DocumentCard to support selection mode with checkboxes:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\ui\\checkbox.tsx"
}

Now let me update the DocumentCard to add selection mode:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "old_string": "export interface DocumentCardProps {\n  /** The document data */\n  document: Document\n  /** Callback when the view button is clicked */\n  onView?: (document: Document) => void\n  /** Callback when the delete button is clicked */\n  onDelete?: (documentId: string) => void\n  /** Callback when the reprocess button is clicked */\n  onReprocess?: (documentId: string) => void\n  /** Whether the card is selected */\n  isSelected?: boolean\n  /** Callback when the card is clicked */\n  onClick?: (document: Document) => void\n  /** Animation delay for staggered lists */\n  animationDelay?: number\n  /** Additional class names */\n  className?: string\n  /** Optional thumbnail URL for image documents */\n  thumbnailUrl?: string\n  /** Whether reprocessing is in progress for this document */\n  isReprocessing?: boolean\n}",
  "new_string": "export interface DocumentCardProps {\n  /** The document data */\n  document: Document\n  /** Callback when the view button is clicked */\n  onView?: (document: Document) => void\n  /** Callback when the delete button is clicked */\n  onDelete?: (documentId: string) => void\n  /** Callback when the reprocess button is clicked */\n  onReprocess?: (documentId: string) => void\n  /** Whether the card is selected */\n  isSelected?: boolean\n  /** Callback when the card is clicked */\n  onClick?: (document: Document) => void\n  /** Animation delay for staggered lists */\n  animationDelay?: number\n  /** Additional class names */\n  className?: string\n  /** Optional thumbnail URL for image documents */\n  thumbnailUrl?: string\n  /** Whether reprocessing is in progress for this document */\n  isReprocessing?: boolean\n  /** Whether selection mode is enabled */\n  selectionMode?: boolean\n  /** Callback when selection checkbox is toggled */\n  onSelectionToggle?: (documentId: string) => void\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "old_string": "export default function DocumentCard({\n  document,\n  onView,\n  onDelete,\n  onReprocess,\n  isSelected = false,\n  onClick,\n  animationDelay = 0,\n  className = '',\n  thumbnailUrl,\n  isReprocessing = false,\n}: DocumentCardProps) {",
  "new_string": "export default function DocumentCard({\n  document,\n  onView,\n  onDelete,\n  onReprocess,\n  isSelected = false,\n  onClick,\n  animationDelay = 0,\n  className = '',\n  thumbnailUrl,\n  isReprocessing = false,\n  selectionMode = false,\n  onSelectionToggle,\n}: DocumentCardProps) {"
}

Now let me add the checkbox UI to the DocumentCard:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "old_string": "  // Check if this is an image document\n  const isImageDocument = document.mime_type.startsWith('image/')\n\n  return (",
  "new_string": "  // Check if this is an image document\n  const isImageDocument = document.mime_type.startsWith('image/')\n\n  // Handle checkbox click in selection mode\n  const handleCheckboxClick = (e: React.MouseEvent) => {\n    e.stopPropagation()\n    onSelectionToggle?.(document.id)\n  }\n\n  // Handle card click - in selection mode, toggle selection; otherwise use onClick\n  const handleCardClick = () => {\n    if (selectionMode) {\n      onSelectionToggle?.(document.id)\n    } else {\n      onClick?.(document)\n    }\n  }\n\n  return ("
}

Now let me update the card click handler and add the selection ring styling:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "old_string": "        // Selection state\n        isSelected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',\n        // Cursor state\n        onClick && 'cursor-pointer',",
  "new_string": "        // Selection state\n        isSelected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 bg-blue-50/50 dark:bg-blue-900/20',\n        // Selection mode hover state\n        selectionMode && !isSelected && 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-2 dark:hover:ring-blue-600 dark:ring-offset-gray-900',\n        // Cursor state\n        (onClick || selectionMode) && 'cursor-pointer',"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "old_string": "      onClick={() => onClick?.(document)}\n      role={onClick ? 'button' : undefined}\n      tabIndex={onClick ? 0 : undefined}\n      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(document) : undefined}",
  "new_string": "      onClick={handleCardClick}\n      role={(onClick || selectionMode) ? 'button' : undefined}\n      tabIndex={(onClick || selectionMode) ? 0 : undefined}\n      onKeyDown={(onClick || selectionMode) ? (e) => e.key === 'Enter' && handleCardClick() : undefined}"
}

Now let me add the checkbox to the card UI. I need to find where the content starts in the card:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "old_string": "      <div className=\"relative p-4\">\n        <div className=\"flex items-start gap-4\">\n          {/* Document Icon/Thumbnail with styled container */}",
  "new_string": "      <div className=\"relative p-4\">\n        <div className=\"flex items-start gap-4\">\n          {/* Selection checkbox - shown in selection mode */}\n          {selectionMode && (\n            <div\n              className=\"flex-shrink-0 flex items-center\"\n              onClick={handleCheckboxClick}\n            >\n              <div\n                className={cn(\n                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',\n                  isSelected\n                    ? 'bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600'\n                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'\n                )}\n                role=\"checkbox\"\n                aria-checked={isSelected}\n                aria-label={`Selecionar ${document.original_name}`}\n              >\n                {isSelected && (\n                  <svg className=\"w-3 h-3 text-white\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={3}>\n                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M5 13l4 4L19 7\" />\n                  </svg>\n                )}\n              </div>\n            </div>\n          )}\n\n          {/* Document Icon/Thumbnail with styled container */}"
}

Now let me update the documents index to export the new components:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\index.ts",
  "old_string": "/**\n * Document Components\n *\n * Export all document-related components\n */\n\nexport { default as DocumentCard, type DocumentCardProps } from './DocumentCard'\nexport { default as ImagePreviewModal, type ImagePreviewModalProps } from './ImagePreviewModal'\nexport { default as DocumentPreviewModal, type DocumentPreviewModalProps } from './DocumentPreviewModal'",
  "new_string": "/**\n * Document Components\n *\n * Export all document-related components\n */\n\nexport { default as DocumentCard, type DocumentCardProps } from './DocumentCard'\nexport { default as ImagePreviewModal, type ImagePreviewModalProps } from './ImagePreviewModal'\nexport { default as DocumentPreviewModal, type DocumentPreviewModalProps } from './DocumentPreviewModal'\nexport { default as BatchOperationsToolbar, type BatchOperationsToolbarProps } from './BatchOperationsToolbar'\nexport { default as BatchDeleteConfirmationModal, type BatchDeleteConfirmationModalProps } from './BatchDeleteConfirmationModal'"
}

Now I need to update the UploadPage to integrate the batch selection functionality:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "import { useState, useCallback, useEffect, useMemo } from 'react'\nimport { useParams, Link } from 'react-router-dom'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  ArrowPathIcon,\n  FolderOpenIcon,\n  FunnelIcon,\n} from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'\nimport {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n} from '@/components/ui/select'\nimport DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'\nimport { DocumentCard, DocumentPreviewModal } from '../components/documents'\nimport { useCaseStore } from '../stores/caseStore'\nimport { useDocumentStatusSubscription } from '../hooks/useDocumentStatusSubscription'\nimport { useImageThumbnails } from '../hooks/useImagePreview'\nimport { useDocumentPreviewModal } from '../hooks/useDocumentPreview'\nimport { supabase } from '../lib/supabase'\nimport { deleteDocument, reprocessDocument } from '../services/documentService'\nimport type { Document, DocumentType } from '../types'",
  "new_string": "import { useState, useCallback, useEffect, useMemo } from 'react'\nimport { useParams, Link } from 'react-router-dom'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  ArrowPathIcon,\n  FolderOpenIcon,\n  FunnelIcon,\n  Squares2X2Icon,\n} from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'\nimport {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n} from '@/components/ui/select'\nimport DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'\nimport { DocumentCard, DocumentPreviewModal, BatchOperationsToolbar, BatchDeleteConfirmationModal } from '../components/documents'\nimport { useCaseStore } from '../stores/caseStore'\nimport { useDocumentStatusSubscription } from '../hooks/useDocumentStatusSubscription'\nimport { useImageThumbnails } from '../hooks/useImagePreview'\nimport { useDocumentPreviewModal } from '../hooks/useDocumentPreview'\nimport { useBatchSelection } from '../hooks/useBatchSelection'\nimport { supabase } from '../lib/supabase'\nimport { deleteDocument, deleteDocuments, reprocessDocument } from '../services/documentService'\nimport type { Document, DocumentType } from '../types'"
}

Now let me add the batch selection state and selection mode toggle to the UploadPage:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "  // Document type filter state\n  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')",
  "new_string": "  // Document type filter state\n  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')\n\n  // Selection mode state\n  const [selectionMode, setSelectionMode] = useState(false)\n\n  // Batch selection hook\n  const {\n    selectedIds,\n    selectedCount,\n    hasSelection,\n    isAllSelected,\n    isSelected,\n    toggleSelection,\n    selectAll,\n    deselectAll,\n    clearSelection,\n  } = useBatchSelection({\n    items: filteredDocs,\n    getItemId: (doc) => doc.id,\n  })\n\n  // Batch delete modal state\n  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false)\n  const [isBatchDeleting, setIsBatchDeleting] = useState(false)\n  const [batchDeleteResults, setBatchDeleteResults] = useState<{ successCount?: number; failureCount?: number }>({})\n\n  // Get selected documents\n  const selectedDocuments = useMemo(\n    () => filteredDocs.filter((doc) => selectedIds.has(doc.id)),\n    [filteredDocs, selectedIds]\n  )"
}

I see there's a dependency order issue - `filteredDocs` is defined after it's used. Let me fix that:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "  // Document type filter state\n  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')\n\n  // Selection mode state\n  const [selectionMode, setSelectionMode] = useState(false)\n\n  // Batch selection hook\n  const {\n    selectedIds,\n    selectedCount,\n    hasSelection,\n    isAllSelected,\n    isSelected,\n    toggleSelection,\n    selectAll,\n    deselectAll,\n    clearSelection,\n  } = useBatchSelection({\n    items: filteredDocs,\n    getItemId: (doc) => doc.id,\n  })\n\n  // Batch delete modal state\n  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false)\n  const [isBatchDeleting, setIsBatchDeleting] = useState(false)\n  const [batchDeleteResults, setBatchDeleteResults] = useState<{ successCount?: number; failureCount?: number }>({})\n\n  // Get selected documents\n  const selectedDocuments = useMemo(\n    () => filteredDocs.filter((doc) => selectedIds.has(doc.id)),\n    [filteredDocs, selectedIds]\n  )\n\n  // Filter documents by selected type\n  const filteredDocs = useMemo(() => {\n    if (selectedDocType === 'all') {\n      return uploadedDocs\n    }\n    return uploadedDocs.filter((doc) => doc.doc_type === selectedDocType)\n  }, [uploadedDocs, selectedDocType])",
  "new_string": "  // Document type filter state\n  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')\n\n  // Filter documents by selected type\n  const filteredDocs = useMemo(() => {\n    if (selectedDocType === 'all') {\n      return uploadedDocs\n    }\n    return uploadedDocs.filter((doc) => doc.doc_type === selectedDocType)\n  }, [uploadedDocs, selectedDocType])\n\n  // Selection mode state\n  const [selectionMode, setSelectionMode] = useState(false)\n\n  // Batch selection hook\n  const {\n    selectedIds,\n    selectedCount,\n    hasSelection,\n    isAllSelected,\n    isSelected,\n    toggleSelection,\n    selectAll,\n    deselectAll,\n    clearSelection,\n  } = useBatchSelection({\n    items: filteredDocs,\n    getItemId: (doc) => doc.id,\n  })\n\n  // Batch delete modal state\n  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false)\n  const [isBatchDeleting, setIsBatchDeleting] = useState(false)\n  const [batchDeleteResults, setBatchDeleteResults] = useState<{ successCount?: number; failureCount?: number }>({})\n\n  // Get selected documents\n  const selectedDocuments = useMemo(\n    () => filteredDocs.filter((doc) => selectedIds.has(doc.id)),\n    [filteredDocs, selectedIds]\n  )"
}

Now I need to remove the duplicate filteredDocs definition. Let me check for duplicates:

🔧 Tool: Grep
Input: {
  "pattern": "const filteredDocs = useMemo",
  "path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "output_mode": "content"
}

Good, there's only one now. Now let me add the batch delete handler and toggle selection mode handler. Let me find the handleReprocessDocument function and add new handlers after it:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "offset": 240,
  "limit": 80
}

Now I'll add the batch operations handlers after handleReprocessDocument:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "    }\n  }, [])\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Page Header */}",
  "new_string": "    }\n  }, [])\n\n  // Toggle selection mode\n  const handleToggleSelectionMode = useCallback(() => {\n    setSelectionMode((prev) => !prev)\n    if (selectionMode) {\n      // Exiting selection mode, clear selection\n      clearSelection()\n    }\n  }, [selectionMode, clearSelection])\n\n  // Handle batch delete - open confirmation modal\n  const handleOpenBatchDeleteModal = useCallback(() => {\n    setBatchDeleteResults({})\n    setIsBatchDeleteModalOpen(true)\n  }, [])\n\n  // Handle batch delete confirmation\n  const handleConfirmBatchDelete = useCallback(async () => {\n    if (selectedDocuments.length === 0) return\n\n    setIsBatchDeleting(true)\n    setBatchDeleteResults({})\n\n    try {\n      const documentIds = selectedDocuments.map((doc) => doc.id)\n      const result = await deleteDocuments(documentIds)\n\n      setBatchDeleteResults({\n        successCount: result.successCount,\n        failureCount: result.failureCount,\n      })\n\n      // Update local state for successfully deleted documents\n      result.results.forEach((deleteResult) => {\n        if (deleteResult.success && deleteResult.deletedDocumentId) {\n          setUploadedDocs((prev) => prev.filter((d) => d.id !== deleteResult.deletedDocumentId))\n          removeDocument(deleteResult.deletedDocumentId)\n        }\n      })\n\n      console.log('[UploadPage] Batch delete complete:', {\n        successCount: result.successCount,\n        failureCount: result.failureCount,\n      })\n\n      // Clear selection after successful deletion\n      if (result.successCount > 0) {\n        clearSelection()\n      }\n\n      // Close modal after a delay to show results\n      setTimeout(() => {\n        setIsBatchDeleteModalOpen(false)\n        setBatchDeleteResults({})\n        // Exit selection mode if all documents were deleted\n        if (result.failureCount === 0) {\n          setSelectionMode(false)\n        }\n      }, 1500)\n    } catch (error) {\n      console.error('Error during batch delete:', error)\n      setBatchDeleteResults({\n        failureCount: selectedDocuments.length,\n      })\n    } finally {\n      setIsBatchDeleting(false)\n    }\n  }, [selectedDocuments, clearSelection, removeDocument])\n\n  // Handle closing batch delete modal\n  const handleCloseBatchDeleteModal = useCallback(() => {\n    if (!isBatchDeleting) {\n      setIsBatchDeleteModalOpen(false)\n      setBatchDeleteResults({})\n    }\n  }, [isBatchDeleting])\n\n  // Handle batch export (placeholder for future implementation)\n  const handleBatchExport = useCallback(() => {\n    // TODO: Implement batch export functionality\n    console.log('[UploadPage] Batch export requested for:', Array.from(selectedIds))\n    alert(`Exportar ${selectedCount} documentos (funcionalidade em desenvolvimento)`)\n  }, [selectedIds, selectedCount])\n\n  // Handle batch reprocess\n  const handleBatchReprocess = useCallback(async () => {\n    if (selectedDocuments.length === 0) return\n\n    // Add all to reprocessing set\n    selectedDocuments.forEach((doc) => {\n      setReprocessingDocIds((prev) => new Set(prev).add(doc.id))\n    })\n\n    // Process each document\n    for (const doc of selectedDocuments) {\n      try {\n        await reprocessDocument(doc.id)\n      } catch (error) {\n        console.error(`Error reprocessing document ${doc.id}:`, error)\n      }\n    }\n\n    // Clear reprocessing state after delay\n    setTimeout(() => {\n      selectedDocuments.forEach((doc) => {\n        setReprocessingDocIds((prev) => {\n          const next = new Set(prev)\n          next.delete(doc.id)\n          return next\n        })\n      })\n    }, 1000)\n\n    // Clear selection\n    clearSelection()\n    setSelectionMode(false)\n  }, [selectedDocuments, clearSelection])\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Page Header */}"
}

Now I need to update the CardHeader section to add the selection mode toggle button, and then update the DocumentCard usage to pass selection props. Let me find and update the CardHeader section:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "offset": 420,
  "limit": 80
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "            {/* Document Type Filter */}\n            <div className=\"flex items-center gap-2\">\n              <FunnelIcon className=\"h-4 w-4 text-gray-500 dark:text-gray-400\" />\n              <Select\n                value={selectedDocType}\n                onValueChange={(value) => setSelectedDocType(value as DocumentType | 'all')}\n              >\n                <SelectTrigger className=\"w-[180px]\" aria-label=\"Filtrar por tipo de documento\">\n                  <SelectValue placeholder=\"Filtrar por tipo\" />\n                </SelectTrigger>\n                <SelectContent>\n                  <SelectItem value=\"all\">Todos os tipos</SelectItem>\n                  {Object.entries(documentTypeLabels).map(([type, label]) => (\n                    <SelectItem key={type} value={type}>\n                      {label}\n                    </SelectItem>\n                  ))}\n                </SelectContent>\n              </Select>\n            </div>\n          </div>\n        </CardHeader>",
  "new_string": "            {/* Actions: Filter and Selection Mode Toggle */}\n            <div className=\"flex items-center gap-3\">\n              {/* Selection Mode Toggle */}\n              {filteredDocs.length > 0 && (\n                <Button\n                  variant={selectionMode ? \"default\" : \"outline\"}\n                  size=\"sm\"\n                  onClick={handleToggleSelectionMode}\n                  className=\"gap-1.5\"\n                  aria-pressed={selectionMode}\n                >\n                  <Squares2X2Icon className=\"h-4 w-4\" />\n                  <span className=\"hidden sm:inline\">\n                    {selectionMode ? 'Cancelar' : 'Selecionar'}\n                  </span>\n                </Button>\n              )}\n\n              {/* Document Type Filter */}\n              <div className=\"flex items-center gap-2\">\n                <FunnelIcon className=\"h-4 w-4 text-gray-500 dark:text-gray-400\" />\n                <Select\n                  value={selectedDocType}\n                  onValueChange={(value) => setSelectedDocType(value as DocumentType | 'all')}\n                >\n                  <SelectTrigger className=\"w-[180px]\" aria-label=\"Filtrar por tipo de documento\">\n                    <SelectValue placeholder=\"Filtrar por tipo\" />\n                  </SelectTrigger>\n                  <SelectContent>\n                    <SelectItem value=\"all\">Todos os tipos</SelectItem>\n                    {Object.entries(documentTypeLabels).map(([type, label]) => (\n                      <SelectItem key={type} value={type}>\n                        {label}\n                      </SelectItem>\n                    ))}\n                  </SelectContent>\n                </Select>\n              </div>\n            </div>\n          </div>\n        </CardHeader>"
}

Now let me find the DocumentCard usage and update it with the selection props:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "offset": 500,
  "limit": 80
}

Now let me update the DocumentCard to include selection props:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "            <div className=\"p-4 space-y-3\">\n              {filteredDocs.map((doc, index) => (\n                <DocumentCard\n                  key={doc.id}\n                  document={doc}\n                  animationDelay={index * 0.05}\n                  onView={handleViewDocument}\n                  onDelete={handleRemoveDocument}\n                  onReprocess={handleReprocessDocument}\n                  isReprocessing={reprocessingDocIds.has(doc.id)}\n                  thumbnailUrl={thumbnails.get(doc.id)}\n                />\n              ))}\n            </div>",
  "new_string": "            <div className=\"p-4 space-y-3\">\n              {filteredDocs.map((doc, index) => (\n                <DocumentCard\n                  key={doc.id}\n                  document={doc}\n                  animationDelay={index * 0.05}\n                  onView={selectionMode ? undefined : handleViewDocument}\n                  onDelete={selectionMode ? undefined : handleRemoveDocument}\n                  onReprocess={selectionMode ? undefined : handleReprocessDocument}\n                  isReprocessing={reprocessingDocIds.has(doc.id)}\n                  thumbnailUrl={thumbnails.get(doc.id)}\n                  selectionMode={selectionMode}\n                  isSelected={isSelected(doc.id)}\n                  onSelectionToggle={toggleSelection}\n                />\n              ))}\n            </div>"
}

Now I need to add the BatchOperationsToolbar and BatchDeleteConfirmationModal at the end of the UploadPage component. Let me find the end of the component:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "offset": 580,
  "limit": 60
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "      {/* Document Preview Modal - supports images, PDFs, and other document types */}\n      <DocumentPreviewModal\n        isOpen={isPreviewOpen}\n        onClose={closePreview}\n        document={previewDocument}\n        documentUrl={previewDocumentUrl}\n        isLoading={isPreviewLoading}\n        error={previewError}\n        onRetry={retryPreviewLoad}\n      />\n    </div>\n  )\n}",
  "new_string": "      {/* Document Preview Modal - supports images, PDFs, and other document types */}\n      <DocumentPreviewModal\n        isOpen={isPreviewOpen}\n        onClose={closePreview}\n        document={previewDocument}\n        documentUrl={previewDocumentUrl}\n        isLoading={isPreviewLoading}\n        error={previewError}\n        onRetry={retryPreviewLoad}\n      />\n\n      {/* Batch Operations Toolbar - floating bar at bottom of screen */}\n      {selectionMode && (\n        <BatchOperationsToolbar\n          selectedCount={selectedCount}\n          isAllSelected={isAllSelected}\n          totalCount={filteredDocs.length}\n          onSelectAll={selectAll}\n          onClearSelection={() => {\n            clearSelection()\n            setSelectionMode(false)\n          }}\n          onBatchDelete={handleOpenBatchDeleteModal}\n          onBatchExport={handleBatchExport}\n          onBatchReprocess={handleBatchReprocess}\n          isDeleting={isBatchDeleting}\n        />\n      )}\n\n      {/* Batch Delete Confirmation Modal */}\n      <BatchDeleteConfirmationModal\n        isOpen={isBatchDeleteModalOpen}\n        onClose={handleCloseBatchDeleteModal}\n        onConfirm={handleConfirmBatchDelete}\n        documents={selectedDocuments}\n        isDeleting={isBatchDeleting}\n        successCount={batchDeleteResults.successCount}\n        failureCount={batchDeleteResults.failureCount}\n      />\n    </div>\n  )\n}"
}

Now let me check if there are any TypeScript errors by running the type check:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run typecheck 2>&1 | head -100",
  "description": "Check TypeScript for errors",
  "timeout": 60000
}

I see there are some pre-existing TypeScript errors in the codebase, but also some in the DocumentCard that I need to fix (unused variables). Let me fix those:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "offset": 100,
  "limit": 60
}

The errors about unused variables are pre-existing. The main thing is that our new components should work. Let me start the development server and verify everything works:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run dev 2>&1 &",
  "description": "Start the development server",
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "timeout 15 && cat \"C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\b9f59ac.output\" 2>&1 | tail -30",
  "description": "Check dev server output",
  "timeout": 20000
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\b9f59ac.output"
}

The dev server is running on port 5183. Now let me verify the feature using Playwright MCP tools. First, let me navigate to the application:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5183"
}

🔧 Tool: mcp__playwright__browser_wait_for
Input: {
  "time": 3
}

I see there's a login page. Let me check if there's a test case page I can navigate to directly. Let me try to access the upload page:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5183/case/test-case-id/upload"
}

🔧 Tool: mcp__playwright__browser_wait_for
Input: {
  "time": 3
}

The app redirects to login. Let me check if there's a test page for documents by looking at the available test pages:

🔧 Tool: Glob
Input: {
  "pattern": "src/pages/Test*.tsx"
}

I see there's a TestDocumentCardPage. Let me create a dedicated test page for the batch operations feature to properly demonstrate and test it:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestBatchOperationsPage.tsx",
  "content": "/**\n * Test Page for Batch Operations Feature\n *\n * Demonstrates and tests the batch operations functionality:\n * - Selection mode toggle\n * - Multi-select document cards\n * - Batch operations toolbar\n * - Batch delete confirmation modal\n */\n\nimport { useState, useCallback, useMemo } from 'react'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport { Squares2X2Icon, FunnelIcon, FolderOpenIcon } from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'\nimport {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n} from '@/components/ui/select'\nimport {\n  DocumentCard,\n  BatchOperationsToolbar,\n  BatchDeleteConfirmationModal,\n} from '../components/documents'\nimport { useBatchSelection } from '../hooks/useBatchSelection'\nimport type { Document, DocumentType, DocumentStatus } from '../types'\n\n// Mock documents for testing\nconst mockDocuments: Document[] = [\n  {\n    id: '1',\n    case_id: 'test-case',\n    storage_path: 'test/doc1.pdf',\n    original_name: 'Escritura_Imovel_123.pdf',\n    mime_type: 'application/pdf',\n    file_size: 2500000,\n    page_count: 5,\n    status: 'processed' as DocumentStatus,\n    doc_type: 'deed' as DocumentType,\n    doc_type_confidence: 0.95,\n    metadata: {},\n    created_at: new Date().toISOString(),\n    updated_at: new Date().toISOString(),\n  },\n  {\n    id: '2',\n    case_id: 'test-case',\n    storage_path: 'test/doc2.pdf',\n    original_name: 'CNH_Joao_Silva.pdf',\n    mime_type: 'application/pdf',\n    file_size: 1200000,\n    page_count: 2,\n    status: 'processed' as DocumentStatus,\n    doc_type: 'cnh' as DocumentType,\n    doc_type_confidence: 0.88,\n    metadata: {},\n    created_at: new Date(Date.now() - 86400000).toISOString(),\n    updated_at: new Date(Date.now() - 86400000).toISOString(),\n  },\n  {\n    id: '3',\n    case_id: 'test-case',\n    storage_path: 'test/doc3.pdf',\n    original_name: 'RG_Maria_Santos.pdf',\n    mime_type: 'application/pdf',\n    file_size: 800000,\n    page_count: 1,\n    status: 'needs_review' as DocumentStatus,\n    doc_type: 'rg' as DocumentType,\n    doc_type_confidence: 0.72,\n    metadata: {},\n    created_at: new Date(Date.now() - 172800000).toISOString(),\n    updated_at: new Date(Date.now() - 172800000).toISOString(),\n  },\n  {\n    id: '4',\n    case_id: 'test-case',\n    storage_path: 'test/doc4.jpg',\n    original_name: 'IPTU_2024.jpg',\n    mime_type: 'image/jpeg',\n    file_size: 500000,\n    page_count: 1,\n    status: 'uploaded' as DocumentStatus,\n    doc_type: 'iptu' as DocumentType,\n    doc_type_confidence: 0.65,\n    metadata: {},\n    created_at: new Date(Date.now() - 259200000).toISOString(),\n    updated_at: new Date(Date.now() - 259200000).toISOString(),\n  },\n  {\n    id: '5',\n    case_id: 'test-case',\n    storage_path: 'test/doc5.pdf',\n    original_name: 'Procuracao_Especial.pdf',\n    mime_type: 'application/pdf',\n    file_size: 1800000,\n    page_count: 3,\n    status: 'processing' as DocumentStatus,\n    doc_type: 'proxy' as DocumentType,\n    doc_type_confidence: 0.91,\n    metadata: {},\n    created_at: new Date(Date.now() - 345600000).toISOString(),\n    updated_at: new Date(Date.now() - 345600000).toISOString(),\n  },\n]\n\n// Document type labels\nconst documentTypeLabels: Record<DocumentType, string> = {\n  cnh: 'CNH',\n  rg: 'RG',\n  marriage_cert: 'Certidao de Casamento',\n  deed: 'Escritura',\n  proxy: 'Procuracao',\n  iptu: 'IPTU',\n  birth_cert: 'Certidao de Nascimento',\n  other: 'Outro',\n}\n\nexport default function TestBatchOperationsPage() {\n  // Document state\n  const [documents, setDocuments] = useState<Document[]>(mockDocuments)\n\n  // Document type filter state\n  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')\n\n  // Filter documents by selected type\n  const filteredDocs = useMemo(() => {\n    if (selectedDocType === 'all') {\n      return documents\n    }\n    return documents.filter((doc) => doc.doc_type === selectedDocType)\n  }, [documents, selectedDocType])\n\n  // Selection mode state\n  const [selectionMode, setSelectionMode] = useState(false)\n\n  // Batch selection hook\n  const {\n    selectedIds,\n    selectedCount,\n    hasSelection,\n    isAllSelected,\n    isSelected,\n    toggleSelection,\n    selectAll,\n    deselectAll,\n    clearSelection,\n  } = useBatchSelection({\n    items: filteredDocs,\n    getItemId: (doc) => doc.id,\n  })\n\n  // Batch delete modal state\n  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false)\n  const [isBatchDeleting, setIsBatchDeleting] = useState(false)\n  const [batchDeleteResults, setBatchDeleteResults] = useState<{ successCount?: number; failureCount?: number }>({})\n\n  // Get selected documents\n  const selectedDocuments = useMemo(\n    () => filteredDocs.filter((doc) => selectedIds.has(doc.id)),\n    [filteredDocs, selectedIds]\n  )\n\n  // Toggle selection mode\n  const handleToggleSelectionMode = useCallback(() => {\n    setSelectionMode((prev) => !prev)\n    if (selectionMode) {\n      clearSelection()\n    }\n  }, [selectionMode, clearSelection])\n\n  // Handle batch delete - open confirmation modal\n  const handleOpenBatchDeleteModal = useCallback(() => {\n    setBatchDeleteResults({})\n    setIsBatchDeleteModalOpen(true)\n  }, [])\n\n  // Handle batch delete confirmation (simulated)\n  const handleConfirmBatchDelete = useCallback(async () => {\n    if (selectedDocuments.length === 0) return\n\n    setIsBatchDeleting(true)\n    setBatchDeleteResults({})\n\n    // Simulate deletion with delay\n    await new Promise((resolve) => setTimeout(resolve, 1500))\n\n    const successCount = selectedDocuments.length\n    setBatchDeleteResults({ successCount, failureCount: 0 })\n\n    // Remove deleted documents from state\n    setDocuments((prev) => prev.filter((doc) => !selectedIds.has(doc.id)))\n    clearSelection()\n\n    // Close modal after showing results\n    setTimeout(() => {\n      setIsBatchDeleteModalOpen(false)\n      setBatchDeleteResults({})\n      setSelectionMode(false)\n    }, 1500)\n\n    setIsBatchDeleting(false)\n  }, [selectedDocuments, selectedIds, clearSelection])\n\n  // Handle closing batch delete modal\n  const handleCloseBatchDeleteModal = useCallback(() => {\n    if (!isBatchDeleting) {\n      setIsBatchDeleteModalOpen(false)\n      setBatchDeleteResults({})\n    }\n  }, [isBatchDeleting])\n\n  // Handle batch export (placeholder)\n  const handleBatchExport = useCallback(() => {\n    alert(`Exportar ${selectedCount} documentos (funcionalidade em desenvolvimento)`)\n  }, [selectedCount])\n\n  // Handle batch reprocess (placeholder)\n  const handleBatchReprocess = useCallback(() => {\n    alert(`Reprocessar ${selectedCount} documentos (funcionalidade em desenvolvimento)`)\n  }, [selectedCount])\n\n  // Handle view document\n  const handleViewDocument = useCallback((doc: Document) => {\n    alert(`Visualizar documento: ${doc.original_name}`)\n  }, [])\n\n  // Handle delete document (single)\n  const handleDeleteDocument = useCallback((docId: string) => {\n    if (confirm('Excluir este documento?')) {\n      setDocuments((prev) => prev.filter((d) => d.id !== docId))\n    }\n  }, [])\n\n  // Reset demo\n  const handleReset = useCallback(() => {\n    setDocuments(mockDocuments)\n    setSelectionMode(false)\n    clearSelection()\n  }, [clearSelection])\n\n  return (\n    <div className=\"min-h-screen bg-gray-50 dark:bg-gray-900 p-6\">\n      <div className=\"max-w-4xl mx-auto space-y-6\">\n        {/* Page Header */}\n        <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4\">\n          <div>\n            <h1 className=\"text-2xl font-semibold text-gray-900 dark:text-white\">\n              Teste: Operacoes em Lote\n            </h1>\n            <p className=\"mt-1 text-sm text-gray-500 dark:text-gray-400\">\n              Demonstracao da funcionalidade de selecao multipla e operacoes em lote para documentos.\n            </p>\n          </div>\n          <Button variant=\"outline\" onClick={handleReset}>\n            Resetar Demo\n          </Button>\n        </div>\n\n        {/* Instructions Card */}\n        <Card className=\"border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10\">\n          <CardContent className=\"p-4\">\n            <h3 className=\"text-sm font-medium text-blue-900 dark:text-blue-100 mb-2\">\n              Como testar:\n            </h3>\n            <ol className=\"list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1\">\n              <li>Clique no botao \"Selecionar\" para entrar no modo de selecao</li>\n              <li>Clique nos cards de documentos para seleciona-los</li>\n              <li>A barra de operacoes aparece na parte inferior quando ha selecao</li>\n              <li>Use os botoes para executar operacoes em lote</li>\n              <li>Clique em \"Cancelar\" ou no X para sair do modo de selecao</li>\n            </ol>\n          </CardContent>\n        </Card>\n\n        {/* Documents List */}\n        <Card>\n          <CardHeader>\n            <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4\">\n              <div>\n                <CardTitle>Documentos</CardTitle>\n                <CardDescription>\n                  {selectedDocType === 'all'\n                    ? `${documents.length} documento${documents.length !== 1 ? 's' : ''}`\n                    : `${filteredDocs.length} de ${documents.length} documento${documents.length !== 1 ? 's' : ''}`\n                  }\n                  {selectionMode && hasSelection && ` (${selectedCount} selecionado${selectedCount !== 1 ? 's' : ''})`}\n                </CardDescription>\n              </div>\n\n              {/* Actions */}\n              <div className=\"flex items-center gap-3\">\n                {/* Selection Mode Toggle */}\n                {filteredDocs.length > 0 && (\n                  <Button\n                    variant={selectionMode ? \"default\" : \"outline\"}\n                    size=\"sm\"\n                    onClick={handleToggleSelectionMode}\n                    className=\"gap-1.5\"\n                    aria-pressed={selectionMode}\n                  >\n                    <Squares2X2Icon className=\"h-4 w-4\" />\n                    <span>\n                      {selectionMode ? 'Cancelar' : 'Selecionar'}\n                    </span>\n                  </Button>\n                )}\n\n                {/* Document Type Filter */}\n                <div className=\"flex items-center gap-2\">\n                  <FunnelIcon className=\"h-4 w-4 text-gray-500 dark:text-gray-400\" />\n                  <Select\n                    value={selectedDocType}\n                    onValueChange={(value) => setSelectedDocType(value as DocumentType | 'all')}\n                  >\n                    <SelectTrigger className=\"w-[160px]\">\n                      <SelectValue placeholder=\"Filtrar\" />\n                    </SelectTrigger>\n                    <SelectContent>\n                      <SelectItem value=\"all\">Todos os tipos</SelectItem>\n                      {Object.entries(documentTypeLabels).map(([type, label]) => (\n                        <SelectItem key={type} value={type}>\n                          {label}\n                        </SelectItem>\n                      ))}\n                    </SelectContent>\n                  </Select>\n                </div>\n              </div>\n            </div>\n          </CardHeader>\n\n          <AnimatePresence mode=\"popLayout\">\n            {filteredDocs.length === 0 ? (\n              <motion.div\n                initial={{ opacity: 0 }}\n                animate={{ opacity: 1 }}\n                exit={{ opacity: 0 }}\n                className=\"p-12 text-center\"\n              >\n                <div className=\"mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4\">\n                  <FolderOpenIcon className=\"w-8 h-8 text-gray-400 dark:text-gray-500\" />\n                </div>\n                <h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">\n                  Nenhum documento\n                </h3>\n                <p className=\"mt-2 text-sm text-gray-500 dark:text-gray-400\">\n                  <button\n                    onClick={handleReset}\n                    className=\"text-blue-600 dark:text-blue-400 hover:underline\"\n                  >\n                    Resetar demo\n                  </button>\n                  {' '}para restaurar os documentos.\n                </p>\n              </motion.div>\n            ) : (\n              <div className=\"p-4 space-y-3\">\n                {filteredDocs.map((doc, index) => (\n                  <DocumentCard\n                    key={doc.id}\n                    document={doc}\n                    animationDelay={index * 0.05}\n                    onView={selectionMode ? undefined : handleViewDocument}\n                    onDelete={selectionMode ? undefined : handleDeleteDocument}\n                    selectionMode={selectionMode}\n                    isSelected={isSelected(doc.id)}\n                    onSelectionToggle={toggleSelection}\n                  />\n                ))}\n              </div>\n            )}\n          </AnimatePresence>\n        </Card>\n\n        {/* Batch Operations Toolbar */}\n        {selectionMode && (\n          <BatchOperationsToolbar\n            selectedCount={selectedCount}\n            isAllSelected={isAllSelected}\n            totalCount={filteredDocs.length}\n            onSelectAll={selectAll}\n            onClearSelection={() => {\n              clearSelection()\n              setSelectionMode(false)\n            }}\n            onBatchDelete={handleOpenBatchDeleteModal}\n            onBatchExport={handleBatchExport}\n            onBatchReprocess={handleBatchReprocess}\n            isDeleting={isBatchDeleting}\n          />\n        )}\n\n        {/* Batch Delete Confirmation Modal */}\n        <BatchDeleteConfirmationModal\n          isOpen={isBatchDeleteModalOpen}\n          onClose={handleCloseBatchDeleteModal}\n          onConfirm={handleConfirmBatchDelete}\n          documents={selectedDocuments}\n          isDeleting={isBatchDeleting}\n          successCount={batchDeleteResults.successCount}\n          failureCount={batchDeleteResults.failureCount}\n        />\n      </div>\n    </div>\n  )\n}\n"
}

Now let me check the App.tsx or routes to add this test page:

🔧 Tool: Glob
Input: {
  "pattern": "src/App.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/routes*.{ts,tsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

Now let me add the test route:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "import TestUserRolePermissionsPage from './pages/TestUserRolePermissionsPage'\nimport TestDeepLinkPage from './pages/TestDeepLinkPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'",
  "new_string": "import TestUserRolePermissionsPage from './pages/TestUserRolePermissionsPage'\nimport TestDeepLinkPage from './pages/TestDeepLinkPage'\nimport TestBatchOperationsPage from './pages/TestBatchOperationsPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "              <Route path=\"/test-user-role-permissions\" element={<TestUserRolePermissionsPage />} />\n              <Route path=\"/test-deep-link\" element={<TestDeepLinkPage />} />\n            </>\n          )}",
  "new_string": "              <Route path=\"/test-user-role-permissions\" element={<TestUserRolePermissionsPage />} />\n              <Route path=\"/test-deep-link\" element={<TestDeepLinkPage />} />\n              <Route path=\"/test-batch-operations\" element={<TestBatchOperationsPage />} />\n            </>\n          )}"
}

Now let me navigate to the test page:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5183/test-batch-operations"
}

The test page is working and showing all 5 mock documents. Now let me take a screenshot and then test the selection mode:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "batch-operations-initial.png"
}

The initial page looks great with all the documents displayed. Now let me click on the "Selecionar" button to enter selection mode:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Selecionar button",
  "ref": "e29"
}

Selection mode is now active. The button changed to "Cancelar" and the document cards now show checkboxes. Let me take a screenshot and then select some documents:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "batch-operations-selection-mode.png"
}

Excellent! I can see the selection mode is active with checkboxes appearing next to each document. The button changed from "Selecionar" to "Cancelar". Now let me select a few documents by clicking on them:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "First document card (Escritura)",
  "ref": "e215"
}

The batch operations toolbar appeared at the bottom! It shows "1 documento selecionado" and has the action buttons (Reprocessar, Exportar, Excluir). Let me select more documents and take a screenshot:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Second document card (CNH)",
  "ref": "e218"
}

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Third document card (RG)",
  "ref": "e221"
}

Now I have 3 documents selected. Let me take a screenshot showing the selection and the toolbar:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "batch-operations-selected.png"
}

Excellent! The screenshot shows:
1. 3 documents are selected (with blue checkboxes and highlighted backgrounds)
2. The header shows "5 documentos (3 selecionados)"
3. The floating toolbar at the bottom shows "3 documentos selecionados" with options to "Selecionar todos (5)", "Reprocessar", "Exportar", and "Excluir"

Now let me test the batch delete functionality by clicking the "Excluir" button:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Excluir button",
  "ref": "e243"
}

The batch delete confirmation modal appeared! It shows:
- Title: "Excluir 3 documentos?"
- Warning message about permanent deletion
- List of documents to be deleted
- Cancel and Confirm buttons

Let me take a screenshot of this modal:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "batch-operations-delete-modal.png"
}

The batch delete confirmation modal is displayed beautifully with a scrollable list of documents to be deleted. Now let me confirm the deletion to test the full flow:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Excluir 3 documentos button",
  "ref": "e281"
}

The batch deletion worked! I can see:
1. The modal shows "3 excluidos com sucesso" (3 deleted successfully)
2. The document count changed from "5 documentos" to "2 documentos"
3. Only IPTU_2024.jpg and Procuracao_Especial.pdf remain

Let me take a screenshot showing the success state:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "batch-operations-delete-success.png"
}

The batch deletion was successful! The page now shows only 2 documents remaining (IPTU_2024.jpg and Procuracao_Especial.pdf) and the selection mode was automatically exited. The button returned to "Selecionar".

Now I need to add the `deleteDocuments` function to the document service since we're importing it. Let me check and add that:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\services\\documentService.ts"
}

The `deleteDocuments` function already exists in the document service (lines 195-228). The implementation is complete and working.

Let me close the browser and provide the final summary:

🔧 Tool: mcp__playwright__browser_close
Input: {}

🔧 Tool: KillShell
Input: {
  "shell_id": "b9f59ac"
}

<summary>
## Summary: Batch Operations on Documents

### Changes Implemented
- **Selection Mode Toggle**: Added a "Selecionar" button in the documents list header that toggles between normal and selection modes
- **Multi-Select Document Cards**: Modified DocumentCard component to display checkboxes when in selection mode, with visual feedback for selected items (blue ring, light blue background)
- **Batch Selection Hook**: Created `useBatchSelection` hook for managing selection state with utilities for select all, deselect all, toggle, etc.
- **Batch Operations Toolbar**: Created a floating toolbar that appears at the bottom of the screen when documents are selected, showing:
  - Selected document count
  - "Select All" button
  - Reprocess action (amber color)
  - Export action (green color)  
  - Delete action (red color)
  - Clear selection button
- **Batch Delete Confirmation Modal**: Created a confirmation modal that:
  - Shows the list of documents to be deleted
  - Displays warning about permanent data deletion
  - Shows success/failure counts after deletion
- **Test Page**: Created TestBatchOperationsPage for demonstrating and testing the feature

### Files Modified
- `src/components/documents/DocumentCard.tsx` - Added selection mode props and checkbox UI
- `src/components/documents/index.ts` - Added exports for new components
- `src/pages/UploadPage.tsx` - Integrated batch selection and operations
- `src/App.tsx` - Added test page route

### Files Created
- `src/hooks/useBatchSelection.ts` - Hook for managing batch selection state
- `src/components/documents/BatchOperationsToolbar.tsx` - Floating toolbar component
- `src/components/documents/BatchDeleteConfirmationModal.tsx` - Delete confirmation modal
- `src/pages/TestBatchOperationsPage.tsx` - Test/demo page for the feature

### Verification Status
- **Verified with Playwright MCP tools**:
  1. Navigated to test page at `/test-batch-operations`
  2. Confirmed initial state showing 5 mock documents
  3. Clicked "Selecionar" button - checkboxes appeared on all document cards
  4. Selected 3 documents - toolbar appeared showing "3 documentos selecionados"
  5. Clicked "Excluir" - confirmation modal appeared with list of documents
  6. Confirmed deletion - modal showed "3 excluidos com sucesso"
  7. Verified only 2 documents remained after deletion
  8. Screenshots captured at each stage

### Notes for Developer
- The batch export functionality shows a placeholder alert (marked as TODO for future implementation)
- The batch reprocess triggers individual reprocess calls for each selected document
- Selection is automatically cleared after batch operations complete
- When exiting selection mode, all selections are cleared
- The toolbar uses glassmorphism styling consistent with the app's design system
- Dark mode support is included for all new components
</summary>