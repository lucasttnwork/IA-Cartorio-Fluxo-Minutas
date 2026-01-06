/**
 * BatchOperationsToolbar Component
 *
 * A floating toolbar that appears when documents are selected,
 * providing batch operations like delete, export, and reprocess.
 *
 * Features:
 * - Shows selected document count
 * - Batch delete with confirmation
 * - Batch export to PDF/JSON
 * - Clear selection
 * - Animated entrance/exit
 * - Dark mode support
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  TrashIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface BatchOperationsToolbarProps {
  /** Number of selected items */
  selectedCount: number
  /** Whether all items are selected */
  isAllSelected: boolean
  /** Total number of items */
  totalCount: number
  /** Callback to select all items */
  onSelectAll: () => void
  /** Callback to clear selection */
  onClearSelection: () => void
  /** Callback to delete selected items */
  onBatchDelete: () => void
  /** Callback to export selected items */
  onBatchExport?: () => void
  /** Callback to reprocess selected items */
  onBatchReprocess?: () => void
  /** Whether batch delete is in progress */
  isDeleting?: boolean
  /** Whether batch export is in progress */
  isExporting?: boolean
  /** Whether batch reprocess is in progress */
  isReprocessing?: boolean
  /** Additional class names */
  className?: string
}

export default function BatchOperationsToolbar({
  selectedCount,
  isAllSelected,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  onBatchExport,
  onBatchReprocess,
  isDeleting = false,
  isExporting = false,
  isReprocessing = false,
  className,
}: BatchOperationsToolbarProps) {
  const isProcessing = isDeleting || isExporting || isReprocessing

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            // Fixed positioning at bottom of viewport
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            // Glassmorphism styling
            'bg-white/95 dark:bg-gray-800/95',
            'backdrop-blur-lg',
            'border border-gray-200/50 dark:border-gray-700/50',
            'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',
            'rounded-xl',
            // Layout
            'flex items-center gap-2 px-4 py-3',
            className
          )}
          role="toolbar"
          aria-label="Operações em lote"
        >
          {/* Selection info */}
          <div className="flex items-center gap-3 pr-3 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                {selectedCount}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedCount === 1 ? 'documento selecionado' : 'documentos selecionados'}
              </span>
            </div>

            {/* Select all / Deselect all toggle */}
            {!isAllSelected && totalCount > selectedCount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 h-7 px-2"
                disabled={isProcessing}
              >
                <CheckIcon className="w-3.5 h-3.5 mr-1" />
                Selecionar todos ({totalCount})
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Batch reprocess */}
            {onBatchReprocess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBatchReprocess}
                disabled={isProcessing}
                className="gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                title="Reprocessar documentos selecionados"
              >
                <ArrowPathIcon className={cn('w-4 h-4', isReprocessing && 'animate-spin')} />
                <span className="hidden sm:inline">Reprocessar</span>
              </Button>
            )}

            {/* Batch export */}
            {onBatchExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBatchExport}
                disabled={isProcessing}
                className="gap-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Exportar documentos selecionados"
              >
                <ArrowDownTrayIcon className={cn('w-4 h-4', isExporting && 'animate-bounce')} />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}

            {/* Batch delete */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchDelete}
              disabled={isProcessing}
              className="gap-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Excluir documentos selecionados"
            >
              {isDeleting ? (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          </div>

          {/* Clear selection button */}
          <div className="pl-2 border-l border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              disabled={isProcessing}
              className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Limpar seleção"
              aria-label="Limpar seleção"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
