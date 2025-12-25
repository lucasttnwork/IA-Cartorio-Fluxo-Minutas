/**
 * Test Bulk Upload Page
 *
 * Demonstrates the bulk upload functionality with parallel processing,
 * progress tracking, and error handling.
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  TrashIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useBulkUpload } from '../hooks/useBulkUpload'
import { BulkUploadProgress } from '../components/upload'
import { UPLOAD_LIMITS, formatFileSize, ACCEPTED_FILE_TYPES } from '../config/uploadConfig'
import type { BulkUploadResult, BulkFileProgress } from '../services/bulkProcessingService'

// Mock case ID for testing
const TEST_CASE_ID = 'test-case-' + Date.now()

export default function TestBulkUploadPage() {
  const [uploadResults, setUploadResults] = useState<BulkUploadResult | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([])

  // Add notification helper
  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  // Use bulk upload hook
  const {
    isUploading,
    progress,
    files,
    stats,
    error,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    cancelUpload,
    reset,
  } = useBulkUpload({
    caseId: TEST_CASE_ID,
    concurrency: UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS,
    autoRetry: true,
    onUploadStart: (files) => {
      console.log('[TestBulkUpload] Upload started:', files.length, 'files')
      addNotification('success', `Iniciando upload de ${files.length} arquivos...`)
    },
    onUploadComplete: (result) => {
      console.log('[TestBulkUpload] Upload complete:', result)
      setUploadResults(result)
      if (result.failedFiles > 0) {
        addNotification('error', `Upload concluído: ${result.successfulFiles} sucesso, ${result.failedFiles} falhas`)
      } else {
        addNotification('success', `Upload concluído: ${result.successfulFiles} arquivos enviados!`)
      }
    },
    onFileComplete: (file: BulkFileProgress) => {
      console.log('[TestBulkUpload] File complete:', file.fileName)
    },
    onFileError: (file: BulkFileProgress, error: Error) => {
      console.error('[TestBulkUpload] File error:', file.fileName, error)
    },
    onError: (error) => {
      console.error('[TestBulkUpload] Error:', error)
      addNotification('error', `Erro: ${error.message}`)
    },
  })

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addFiles,
    accept: ACCEPTED_FILE_TYPES,
    disabled: isUploading,
    multiple: true,
    maxFiles: UPLOAD_LIMITS.MAX_FILES_PER_BATCH,
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teste de Upload em Lote
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Demonstra o upload paralelo de múltiplos arquivos com acompanhamento de progresso.
          </p>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{notification.message}</AlertDescription>
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro no Upload</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Dropzone */}
        <Card
          {...getRootProps()}
          className={cn(
            'cursor-pointer transition-all duration-200',
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <CardContent className="py-12 text-center">
            <motion.div
              animate={{ scale: isDragActive ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className={cn(
                'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4',
                isDragActive
                  ? 'bg-blue-100 dark:bg-blue-800'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}>
                <CloudArrowUpIcon className={cn(
                  'w-8 h-8',
                  isDragActive
                    ? 'text-blue-500'
                    : 'text-gray-400'
                )} />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive
                  ? 'Solte os arquivos aqui'
                  : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                PDF, JPG, PNG, TIFF, WebP • Máximo {UPLOAD_LIMITS.MAX_FILES_PER_BATCH} arquivos
              </p>
            </motion.div>
          </CardContent>
        </Card>

        {/* File Queue */}
        {files.length > 0 && !isUploading && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Arquivos Selecionados ({files.length})
                  </CardTitle>
                  <CardDescription>
                    Total: {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFiles}
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={startUpload}
                    className="gap-1"
                  >
                    <BoltIcon className="w-4 h-4" />
                    Enviar Todos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <DocumentIcon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.name)
                        }}
                        className="h-8 w-8"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {(isUploading || progress) && (
          <BulkUploadProgress
            progress={progress}
            stats={stats}
            isUploading={isUploading}
            onCancel={cancelUpload}
            showDetailedProgress={true}
          />
        )}

        {/* Results */}
        {uploadResults && !isUploading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultados do Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {uploadResults.totalFiles}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {uploadResults.successfulFiles}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Sucesso</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {uploadResults.failedFiles}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">Falhas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(uploadResults.duration / 1000).toFixed(1)}s
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Duração</p>
                </div>
              </div>

              {/* Errors List */}
              {uploadResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Erros ({uploadResults.errors.length})
                  </h4>
                  <div className="space-y-1">
                    {uploadResults.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-500">
                        • {err.fileName}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={reset}>
                  Novo Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Recursos de Performance
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Upload paralelo com {UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS} arquivos simultâneos</li>
              <li>• Retry automático para arquivos que falharem</li>
              <li>• Upload em chunks para arquivos grandes (maior que 5MB)</li>
              <li>• Acompanhamento em tempo real do progresso</li>
              <li>• Estimativa de tempo restante e velocidade</li>
              <li>• Suporte para até {UPLOAD_LIMITS.MAX_FILES_PER_BATCH} arquivos por lote</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
