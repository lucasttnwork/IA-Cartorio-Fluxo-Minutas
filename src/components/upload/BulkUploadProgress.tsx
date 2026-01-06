/**
 * BulkUploadProgress Component
 *
 * Displays detailed progress for bulk file uploads including:
 * - Overall progress bar and statistics
 * - Per-file progress with status indicators
 * - Upload speed and estimated time remaining
 * - Error display and retry options
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  ClockIcon,
  BoltIcon,
  XMarkIcon,
  PauseIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { BulkOperationProgress, BulkFileProgress } from '../../services/bulkProcessingService'
import type { BulkUploadStats } from '../../hooks/useBulkUpload'
import { formatFileSize } from '../../config/uploadConfig'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BulkUploadProgressProps {
  progress: BulkOperationProgress | null
  stats: BulkUploadStats
  isUploading: boolean
  onCancel?: () => void
  onRetryFailed?: () => void
  showDetailedProgress?: boolean
  className?: string
}

// -----------------------------------------------------------------------------
// Helper Components
// -----------------------------------------------------------------------------

/**
 * Status icon for file progress
 */
function FileStatusIcon({ status }: { status: BulkFileProgress['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    case 'failed':
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
    case 'cancelled':
      return <PauseIcon className="w-5 h-5 text-gray-400" />
    case 'uploading':
      return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
    case 'processing':
      return <BoltIcon className="w-5 h-5 text-yellow-500 animate-pulse" />
    case 'uploaded':
      return <CloudArrowUpIcon className="w-5 h-5 text-blue-400" />
    default:
      return <DocumentIcon className="w-5 h-5 text-gray-400" />
  }
}

/**
 * Status label text
 */
function getStatusLabel(status: BulkFileProgress['status']): string {
  switch (status) {
    case 'pending':
      return 'Aguardando'
    case 'uploading':
      return 'Enviando...'
    case 'uploaded':
      return 'Enviado'
    case 'processing':
      return 'Processando...'
    case 'completed':
      return 'Concluído'
    case 'failed':
      return 'Falhou'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

/**
 * File progress row
 */
function FileProgressRow({ file }: { file: BulkFileProgress }) {
  const showProgress = file.status === 'uploading' || file.status === 'processing'
  const progressValue = file.status === 'processing'
    ? file.processingProgress
    : file.uploadProgress

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        file.status === 'failed' && 'bg-red-50 dark:bg-red-900/20',
        file.status === 'completed' && 'bg-green-50 dark:bg-green-900/20',
        file.status === 'uploading' && 'bg-blue-50 dark:bg-blue-900/20',
        file.status === 'processing' && 'bg-yellow-50 dark:bg-yellow-900/20',
        file.status === 'pending' && 'bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        <FileStatusIcon status={file.status} />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.fileName}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatFileSize(file.fileSize)}
          </span>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-1.5">
            <Progress value={progressValue} className="h-1.5" />
          </div>
        )}

        {/* Status / Error */}
        <div className="mt-1 flex items-center gap-2">
          <span className={cn(
            'text-xs',
            file.status === 'failed' && 'text-red-600 dark:text-red-400',
            file.status === 'completed' && 'text-green-600 dark:text-green-400',
            file.status === 'uploading' && 'text-blue-600 dark:text-blue-400',
            file.status === 'processing' && 'text-yellow-600 dark:text-yellow-400',
            file.status === 'pending' && 'text-gray-500 dark:text-gray-400'
          )}>
            {file.error || getStatusLabel(file.status)}
          </span>
          {file.retryCount > 0 && file.status !== 'completed' && (
            <span className="text-xs text-orange-500">
              (Tentativa {file.retryCount + 1})
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function BulkUploadProgress({
  progress,
  stats,
  isUploading,
  onCancel,
  onRetryFailed,
  showDetailedProgress = true,
  className,
}: BulkUploadProgressProps) {
  // Get sorted file list
  const fileList = useMemo(() => {
    if (!progress) return []
    return Array.from(progress.files.values()).sort((a, b) => {
      // Sort by status priority: uploading/processing first, then completed, then failed, then pending
      const priority: Record<string, number> = {
        uploading: 0,
        processing: 1,
        uploaded: 2,
        failed: 3,
        completed: 4,
        pending: 5,
        cancelled: 6,
      }
      return (priority[a.status] || 10) - (priority[b.status] || 10)
    })
  }, [progress])

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    fileList.forEach(file => {
      counts[file.status] = (counts[file.status] || 0) + 1
    })
    return counts
  }, [fileList])

  // Don't render if no files and not uploading
  if (!isUploading && stats.totalFiles === 0) {
    return null
  }

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isUploading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-500" />
                Enviando {stats.totalFiles} arquivo{stats.totalFiles !== 1 ? 's' : ''}...
              </>
            ) : stats.isComplete ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                Upload Concluído
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="w-5 h-5 text-gray-400" />
                Upload em Lote
              </>
            )}
          </CardTitle>

          {isUploading && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-500 hover:text-red-500"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Progresso Geral
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats.overallProgress}%
            </span>
          </div>
          <Progress value={stats.overallProgress} className="h-2" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Completed */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-green-600 dark:text-green-400">Concluídos</p>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                {stats.completedFiles}/{stats.totalFiles}
              </p>
            </div>
          </div>

          {/* In Progress */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <ArrowPathIcon className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Em Progresso</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {stats.inProgressFiles}
              </p>
            </div>
          </div>

          {/* Failed */}
          {stats.failedFiles > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">Falharam</p>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {stats.failedFiles}
                </p>
              </div>
            </div>
          )}

          {/* Speed & ETA */}
          {isUploading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stats.currentSpeed}
                </p>
                {stats.estimatedTimeRemaining && (
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {stats.estimatedTimeRemaining}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Size Progress */}
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {stats.uploadedSize} / {stats.totalSize}
        </div>

        {/* Detailed File Progress */}
        {showDetailedProgress && fileList.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Detalhes dos Arquivos
              </h4>
              {stats.failedFiles > 0 && !isUploading && onRetryFailed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryFailed}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Tentar Novamente ({stats.failedFiles})
                </Button>
              )}
            </div>

            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-4">
                <AnimatePresence mode="popLayout">
                  {fileList.map(file => (
                    <FileProgressRow key={file.id} file={file} />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
