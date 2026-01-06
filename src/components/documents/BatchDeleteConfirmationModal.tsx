/**
 * BatchDeleteConfirmationModal Component
 *
 * A modal for confirming batch deletion of multiple documents.
 * Shows the count of documents to be deleted and lists their names.
 *
 * Features:
 * - Lists documents to be deleted
 * - Shows warning about data loss
 * - Animated loading state
 * - Dark mode support
 */

import { ExclamationTriangleIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Document } from '../../types'

export interface BatchDeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  documents: Document[]
  isDeleting?: boolean
  successCount?: number
  failureCount?: number
}

export default function BatchDeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  documents,
  isDeleting = false,
  successCount,
  failureCount,
}: BatchDeleteConfirmationModalProps) {
  const count = documents.length
  const showResults = successCount !== undefined || failureCount !== undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-dialog max-w-md">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <DialogHeader className="text-left p-0 space-y-2">
              <DialogTitle className="text-red-600 dark:text-red-400">
                Excluir {count} {count === 1 ? 'documento' : 'documentos'}?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Esta ação irá remover permanentemente {count === 1 ? 'o documento selecionado' : 'os documentos selecionados'} e todos os dados associados, incluindo extrações, evidências e referências em entidades.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Document list */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Documentos a serem excluídos:
          </p>
          <ScrollArea className="h-[150px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="p-2 space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                  <DocumentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {doc.original_name}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Results feedback */}
        {showResults && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm">
              {successCount !== undefined && successCount > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  {successCount} excluido{successCount !== 1 ? 's' : ''} com sucesso
                </span>
              )}
              {failureCount !== undefined && failureCount > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {failureCount} falha{failureCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Excluindo...
              </>
            ) : (
              <>
                <TrashIcon className="w-5 h-5 mr-2" />
                Excluir {count} {count === 1 ? 'documento' : 'documentos'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
