/**
 * Large File Warning Dialog Component
 *
 * Displays a confirmation dialog when users attempt to upload large files,
 * providing information about estimated upload time and file details.
 */

import { useCallback, useMemo } from 'react'
import {
  ExclamationTriangleIcon,
  DocumentIcon,
  ClockIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  formatFileSize,
  formatRemainingTime,
  getFileSizeCategory,
  calculateBatchStatistics,
  type BatchStatistics,
} from '../../config/uploadConfig'

interface LargeFileWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  files: File[]
}

export default function LargeFileWarningDialog({
  isOpen,
  onClose,
  onConfirm,
  files,
}: LargeFileWarningDialogProps) {
  const statistics: BatchStatistics = useMemo(
    () => calculateBatchStatistics(files),
    [files]
  )

  const handleConfirm = useCallback(() => {
    onConfirm()
    onClose()
  }, [onConfirm, onClose])

  // Get severity level based on total size
  const severity = useMemo(() => {
    const totalMB = statistics.totalSize / (1024 * 1024)
    if (totalMB >= 100) return 'critical'
    if (totalMB >= 50) return 'high'
    if (totalMB >= 20) return 'medium'
    return 'low'
  }, [statistics.totalSize])

  const severityColors = {
    critical: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
    high: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    low: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  }

  const severityTextColors = {
    critical: 'text-red-700 dark:text-red-300',
    high: 'text-orange-700 dark:text-orange-300',
    medium: 'text-yellow-700 dark:text-yellow-300',
    low: 'text-blue-700 dark:text-blue-300',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className={`h-6 w-6 ${severityTextColors[severity]}`} />
            <span>Upload de Arquivos Grandes</span>
          </DialogTitle>
          <DialogDescription>
            {statistics.largeFilesCount === 1
              ? 'Você está prestes a enviar um arquivo grande.'
              : `Você está prestes a enviar ${statistics.largeFilesCount} arquivos grandes.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary Card */}
          <div className={`rounded-lg border p-4 ${severityColors[severity]}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DocumentIcon className={`h-5 w-5 ${severityTextColors[severity]}`} />
                <div>
                  <p className={`text-sm font-medium ${severityTextColors[severity]}`}>
                    {statistics.totalFiles} arquivo{statistics.totalFiles !== 1 ? 's' : ''}
                  </p>
                  <p className={`text-xs ${severityTextColors[severity]} opacity-80`}>
                    Total: {statistics.totalSizeFormatted}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className={`h-5 w-5 ${severityTextColors[severity]}`} />
                <div>
                  <p className={`text-sm font-medium ${severityTextColors[severity]}`}>
                    Tempo Estimado
                  </p>
                  <p className={`text-xs ${severityTextColors[severity]} opacity-80`}>
                    {statistics.estimatedTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* File List */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Arquivos para upload:
            </h4>
            <ScrollArea className="h-40 rounded-md border bg-gray-50 dark:bg-gray-800/50">
              <div className="p-3 space-y-2">
                {files.map((file, index) => {
                  const sizeCategory = getFileSizeCategory(file.size)
                  const isLarge = sizeCategory === 'large' || sizeCategory === 'very_large'

                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <DocumentIcon
                          className={`h-4 w-4 flex-shrink-0 ${
                            isLarge
                              ? 'text-yellow-500'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs flex-shrink-0 px-2 py-0.5 rounded ${
                          isLarge
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Progress visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Uso do limite de upload</span>
              <span>
                {statistics.totalSizeFormatted} / 200 MB
              </span>
            </div>
            <Progress
              value={Math.min((statistics.totalSize / (200 * 1024 * 1024)) * 100, 100)}
              className="h-2"
            />
          </div>

          {/* Warning text */}
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="mb-2">
              <strong>Dicas para uploads grandes:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Mantenha a página aberta durante o upload</li>
              <li>Verifique sua conexão com a internet</li>
              <li>Uploads interrompidos podem ser retomados</li>
              <li>Arquivos serão processados automaticamente após o upload</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="gap-2"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Continuar Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
