import { useCallback, useState, useMemo } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { UploadProgress, Document } from '../../types'
import { supabase, createProcessingJob } from '../../lib/supabase'
import { validateFileContent, FileValidationError } from '../../utils/fileValidation'
import {
  UPLOAD_SIZE_THRESHOLDS,
  UPLOAD_LIMITS,
  ACCEPTED_FILE_TYPES,
  formatFileSize,
  formatUploadSpeed,
  formatRemainingTime,
  getFileSizeCategory,
  validateFileForUpload,
  calculateBatchStatistics,
} from '../../config/uploadConfig'
import {
  smartUpload,
  type UploadProgressInfo,
} from '../../utils/chunkedUpload'
import LargeFileWarningDialog from './LargeFileWarningDialog'

interface DocumentDropzoneProps {
  caseId: string
  onUploadStart?: (files: File[]) => void
  onUploadProgress?: (progress: UploadProgress[]) => void
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: Error) => void
  disabled?: boolean
}

export interface UploadResult {
  file_name: string
  success: boolean
  document_id?: string
  storage_path?: string
  error?: string
}

interface FileWithPreview extends File {
  preview?: string
}

interface ExtendedUploadProgress extends UploadProgress {
  speed?: number
  remainingTime?: number
  currentChunk?: number
  totalChunks?: number
  isLargeFile?: boolean
}

export default function DocumentDropzone({
  caseId,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError: _onUploadError,
  disabled = false,
}: DocumentDropzoneProps) {
  // Note: onUploadError is available but currently handled inline in the upload function
  void _onUploadError // suppress unused variable warning
  const [uploadQueue, setUploadQueue] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<Map<string, ExtendedUploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)

  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<Map<string, FileValidationError>>(new Map())

  // State for large file warning dialog
  const [showLargeFileWarning, setShowLargeFileWarning] = useState(false)
  const [pendingLargeFiles, setPendingLargeFiles] = useState<File[]>([])

  // Calculate batch statistics for the queue
  const batchStats = useMemo(
    () => calculateBatchStatistics(uploadQueue),
    [uploadQueue]
  )

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files (type/size rejection by dropzone)
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const errorMessages = rejection.errors.map((e) => {
            if (e.code === 'file-too-large') {
              return `Arquivo muito grande (máx ${formatFileSize(UPLOAD_SIZE_THRESHOLDS.MAX_FILE_SIZE)})`
            }
            if (e.code === 'file-invalid-type') {
              return 'Tipo de arquivo inválido (PDF, JPG, PNG, TIFF, WebP permitidos)'
            }
            return e.message
          })

          // Add to progress with error status
          setUploadProgress((prev) => {
            const newMap = new Map(prev)
            newMap.set(rejection.file.name, {
              file_name: rejection.file.name,
              progress: 0,
              status: 'error',
              error: errorMessages.join(', '),
            })
            return newMap
          })
        })
      }

      // Validate accepted files for corruption/invalid content and size
      if (acceptedFiles.length > 0) {
        const validFiles: File[] = []
        const largeFiles: File[] = []
        const newValidationErrors = new Map<string, FileValidationError>()

        // Validate each file
        for (const file of acceptedFiles) {
          // First check size constraints
          const sizeValidation = validateFileForUpload(file)

          if (!sizeValidation.isValid && sizeValidation.error) {
            newValidationErrors.set(file.name, {
              code: sizeValidation.error.code === 'TOO_LARGE' ? 'CORRUPT_FILE' : 'EMPTY_FILE',
              message: sizeValidation.error.message,
            })

            setUploadProgress((prev) => {
              const newMap = new Map(prev)
              newMap.set(file.name, {
                file_name: file.name,
                progress: 0,
                status: 'error',
                error: sizeValidation.error?.message || 'Arquivo inválido',
              })
              return newMap
            })
            continue
          }

          // Then validate file content
          const validationResult = await validateFileContent(file)

          if (!validationResult.isValid && validationResult.error) {
            // File is corrupt or invalid
            newValidationErrors.set(file.name, validationResult.error)

            // Add to progress with error status
            setUploadProgress((prev) => {
              const newMap = new Map(prev)
              newMap.set(file.name, {
                file_name: file.name,
                progress: 0,
                status: 'error',
                error: validationResult.error?.message || 'Arquivo corrompido ou inválido',
              })
              return newMap
            })
          } else {
            // File is valid
            validFiles.push(file)

            // Track if it's a large file
            if (sizeValidation.warning?.code === 'LARGE_FILE') {
              largeFiles.push(file)
            }
          }
        }

        // Update validation errors state
        if (newValidationErrors.size > 0) {
          setValidationErrors((prev) => {
            const updated = new Map(prev)
            newValidationErrors.forEach((error, fileName) => {
              updated.set(fileName, error)
            })
            return updated
          })
        }

        // Add valid files to queue
        if (validFiles.length > 0) {
          const filesWithPreview = validFiles.map((file) =>
            Object.assign(file, {
              preview: file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : undefined,
            })
          )

          setUploadQueue((prev) => {
            const newQueue = [...prev, ...filesWithPreview]
            // Limit total files
            return newQueue.slice(0, UPLOAD_LIMITS.MAX_FILES_PER_BATCH)
          })

          // Initialize progress for new files (pending state, not uploading yet)
          setUploadProgress((prev) => {
            const newMap = new Map(prev)
            filesWithPreview.forEach((file) => {
              if (!newMap.has(file.name)) {
                const sizeCategory = getFileSizeCategory(file.size)
                newMap.set(file.name, {
                  file_name: file.name,
                  progress: 0,
                  status: 'uploading',
                  isLargeFile: sizeCategory === 'large' || sizeCategory === 'very_large',
                })
              }
            })
            return newMap
          })

          // Show warning dialog for large files
          if (largeFiles.length > 0) {
            setPendingLargeFiles(largeFiles)
            setShowLargeFileWarning(true)
          }
        }
      }
    },
    []
  )

  // Clear validation error for a specific file
  const clearValidationError = useCallback((fileName: string) => {
    setValidationErrors((prev) => {
      const newMap = new Map(prev)
      newMap.delete(fileName)
      return newMap
    })
    setUploadProgress((prev) => {
      const newMap = new Map(prev)
      newMap.delete(fileName)
      return newMap
    })
  }, [])

  // Remove file from queue
  const removeFile = useCallback((fileName: string) => {
    setUploadQueue((prev) => {
      const file = prev.find((f) => f.name === fileName)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.name !== fileName)
    })
    setUploadProgress((prev) => {
      const newMap = new Map(prev)
      newMap.delete(fileName)
      return newMap
    })
  }, [])

  // Handle progress updates from smart upload
  const handleUploadProgress = useCallback((progressInfo: UploadProgressInfo) => {
    setUploadProgress((prev) => {
      const newMap = new Map(prev)
      newMap.set(progressInfo.fileName, {
        file_name: progressInfo.fileName,
        progress: progressInfo.percentage,
        status: progressInfo.status === 'complete'
          ? 'complete'
          : progressInfo.status === 'error'
          ? 'error'
          : progressInfo.status === 'processing'
          ? 'processing'
          : 'uploading',
        error: progressInfo.error,
        speed: progressInfo.speed,
        remainingTime: progressInfo.remainingTime,
        currentChunk: progressInfo.currentChunk,
        totalChunks: progressInfo.totalChunks,
        isLargeFile: progressInfo.totalChunks > 1,
      })
      return newMap
    })
  }, [])

  // Upload files to Supabase and trigger OCR processing
  const uploadFiles = useCallback(async () => {
    if (uploadQueue.length === 0 || isUploading) return

    setIsUploading(true)
    onUploadStart?.(uploadQueue)

    const results: UploadResult[] = []

    for (const file of uploadQueue) {
      try {
        // Use smart upload (chooses chunked or standard based on file size)
        const uploadResult = await smartUpload(
          file,
          caseId,
          handleUploadProgress
        )

        if (!uploadResult.success || !uploadResult.path) {
          throw new Error(uploadResult.error || 'Failed to upload file to storage')
        }

        // Update progress to show database operation
        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          const current = newMap.get(file.name)
          newMap.set(file.name, {
            ...current,
            file_name: file.name,
            progress: 80,
            status: 'processing',
          })
          return newMap
        })

        // Create document record in database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: docData, error: docError } = await (supabase as any)
          .from('documents')
          .insert({
            case_id: caseId,
            storage_path: uploadResult.path,
            original_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            status: 'uploaded',
            metadata: {
              upload_duration_ms: uploadResult.uploadDuration,
              used_chunked_upload: uploadResult.totalBytesUploaded !== file.size,
            },
          })
          .select()
          .single() as { data: Document | null; error: { message: string } | null }

        if (docError || !docData) {
          throw new Error(docError?.message || 'Failed to create document record')
        }

        // Create OCR processing job
        const { error: jobError } = await createProcessingJob(
          caseId,
          docData.id,
          'ocr'
        )

        if (jobError) {
          console.warn('Failed to create OCR job:', jobError)
          // Don't throw - document was uploaded successfully, just OCR job failed
        }

        // Mark as complete
        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          newMap.set(file.name, {
            file_name: file.name,
            progress: 100,
            status: 'complete',
          })
          return newMap
        })

        results.push({
          file_name: file.name,
          success: true,
          document_id: docData.id,
          storage_path: uploadResult.path,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        console.error('Upload error:', error)

        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          newMap.set(file.name, {
            file_name: file.name,
            progress: 0,
            status: 'error',
            error: errorMessage,
          })
          return newMap
        })

        results.push({
          file_name: file.name,
          success: false,
          error: errorMessage,
        })
      }

      // Notify progress update
      onUploadProgress?.(Array.from(uploadProgress.values()))
    }

    setIsUploading(false)
    onUploadComplete?.(results)

    // Clear completed files from queue after a delay
    setTimeout(() => {
      setUploadQueue((prev) => {
        prev.forEach((f) => {
          if (f.preview) URL.revokeObjectURL(f.preview)
        })
        return []
      })
    }, 2000)
  }, [uploadQueue, isUploading, caseId, onUploadStart, onUploadProgress, onUploadComplete, uploadProgress, handleUploadProgress])

  // Clear all files
  const clearAll = useCallback(() => {
    uploadQueue.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setUploadQueue([])
    setUploadProgress(new Map())
    setValidationErrors(new Map())
  }, [uploadQueue])

  // Handle large file warning confirmation
  const handleLargeFileConfirm = useCallback(() => {
    setShowLargeFileWarning(false)
    setPendingLargeFiles([])
    // Files are already in the queue, just close the dialog
  }, [])

  // Handle large file warning cancel
  const handleLargeFileCancel = useCallback(() => {
    // Remove large files from queue
    pendingLargeFiles.forEach((file) => {
      removeFile(file.name)
    })
    setShowLargeFileWarning(false)
    setPendingLargeFiles([])
  }, [pendingLargeFiles, removeFile])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: UPLOAD_SIZE_THRESHOLDS.MAX_FILE_SIZE,
    maxFiles: UPLOAD_LIMITS.MAX_FILES_PER_BATCH,
    disabled: disabled || isUploading,
    multiple: true,
  })

  // Get status icon for file
  const getStatusIcon = (progress: ExtendedUploadProgress) => {
    switch (progress.status) {
      case 'complete':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return progress.isLargeFile ? (
          <BoltIcon className="w-5 h-5 text-yellow-500 animate-pulse" />
        ) : (
          <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <Card
        {...getRootProps()}
        className={cn(
          "group",
          isDragActive && !isDragReject && "dropzone-active",
          isDragReject && "dropzone-reject",
          (disabled || isUploading) && "dropzone-disabled",
          !isDragActive && !isDragReject && !disabled && !isUploading && "dropzone-idle"
        )}
      >
        <input {...getInputProps()} aria-label="File upload input" />

        <CardContent className="p-10">
          <motion.div
            animate={{
              scale: isDragActive ? 1.02 : 1,
              y: isDragActive ? -8 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              animate={{
                rotate: isDragActive ? [0, -5, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: isDragActive ? Infinity : 0,
                repeatDelay: 0.5,
              }}
              className={cn(
                isDragActive && !isDragReject && "dropzone-icon-active",
                isDragReject && "dropzone-icon-reject",
                !isDragActive && !isDragReject && "dropzone-icon-idle"
              )}
            >
              <CloudArrowUpIcon
                className={cn(
                  "w-10 h-10 transition-all duration-300",
                  isDragActive && !isDragReject && "text-white",
                  isDragReject && "text-white",
                  !isDragActive && !isDragReject && "text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                )}
              />
            </motion.div>

            {isDragActive && !isDragReject ? (
              <>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 tracking-tight">
                  Solte os arquivos aqui
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  Solte para fazer upload
                </p>
              </>
            ) : isDragReject ? (
              <>
                <p className="text-xl font-bold text-red-700 dark:text-red-300 tracking-tight">
                  Tipo de arquivo inválido
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                  Use arquivos PDF, JPG, PNG, TIFF ou WebP
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Arraste e solte documentos aqui
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-medium">
                  ou clique para selecionar arquivos
                </p>
                <div className="mt-5 px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    PDF, JPG, PNG, TIFF, WebP • Máx {formatFileSize(UPLOAD_SIZE_THRESHOLDS.MAX_FILE_SIZE)} • Até {UPLOAD_LIMITS.MAX_FILES_PER_BATCH} arquivos
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Validation Errors Alert */}
      <AnimatePresence>
        {validationErrors.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <AlertTitle className="text-red-800 dark:text-red-300">
                {validationErrors.size === 1
                  ? 'Arquivo corrompido ou inválido detectado'
                  : `${validationErrors.size} arquivos corrompidos ou inválidos detectados`}
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-400">
                <div className="mt-2 space-y-2">
                  {Array.from(validationErrors.entries()).map(([fileName, error]) => (
                    <div
                      key={fileName}
                      className="flex items-start justify-between gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileName}</p>
                        <p className="text-xs mt-0.5">{error.message}</p>
                        {error.details && (
                          <p className="text-xs mt-1 opacity-80">{error.details}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => clearValidationError(fileName)}
                        className="h-6 w-6 flex-shrink-0 hover:bg-red-200 dark:hover:bg-red-800"
                        aria-label={`Dismiss error for ${fileName}`}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Queue Header with Statistics */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {uploadQueue.length} arquivo{uploadQueue.length !== 1 ? 's' : ''} selecionado{uploadQueue.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Total: {batchStats.totalSizeFormatted}
                  {batchStats.largeFilesCount > 0 && (
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                      ({batchStats.largeFilesCount} arquivo{batchStats.largeFilesCount !== 1 ? 's' : ''} grande{batchStats.largeFilesCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isUploading}
                className="h-8"
              >
                Limpar tudo
              </Button>
            </div>

            {/* File List */}
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-4">
                {uploadQueue.map((file) => {
                  const progress = uploadProgress.get(file.name)
                  const sizeCategory = getFileSizeCategory(file.size)
                  const isLargeFile = sizeCategory === 'large' || sizeCategory === 'very_large'

                  return (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        isLargeFile ? "file-queue-card-large" : "file-queue-card"
                      )}>
                        <CardContent className="p-4 flex items-center gap-4">
                          {/* File Icon or Preview */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden shadow-md">
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <DocumentIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              {isLargeFile && (
                                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-sm">
                                  <BoltIcon className="w-3 h-3 mr-0.5" />
                                  Grande
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </span>
                              {progress?.status === 'error' && progress.error && (
                                <Alert variant="destructive" className="py-1 px-2 border-0">
                                  <AlertDescription className="text-xs">
                                    {progress.error}
                                  </AlertDescription>
                                </Alert>
                              )}
                              {/* Show speed and remaining time for large files */}
                              {progress?.status === 'uploading' && progress.speed !== undefined && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{formatUploadSpeed(progress.speed)}</span>
                                  {progress.remainingTime !== undefined && progress.remainingTime < Infinity && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {formatRemainingTime(progress.remainingTime)}
                                      </span>
                                    </>
                                  )}
                                  {progress.currentChunk !== undefined && progress.totalChunks !== undefined && progress.totalChunks > 1 && (
                                    <>
                                      <span>•</span>
                                      <span>Chunk {progress.currentChunk}/{progress.totalChunks}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {progress && progress.status !== 'error' && progress.status !== 'complete' && (
                              <Progress
                                value={progress.progress}
                                className={cn(
                                  "mt-2 h-1.5",
                                  isLargeFile && "bg-yellow-100 dark:bg-yellow-900/30"
                                )}
                              />
                            )}
                          </div>

                          {/* Status / Remove Button */}
                          <div className="flex-shrink-0">
                            {progress && progress.status !== 'uploading' ? (
                              getStatusIcon(progress)
                            ) : isUploading && progress?.status === 'uploading' ? (
                              getStatusIcon(progress)
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(file.name)}
                                disabled={isUploading}
                                className="h-8 w-8"
                                aria-label={`Remove ${file.name}`}
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Batch Warning */}
            {batchStats.requiresWarning && !isUploading && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
                  {batchStats.largeFilesCount > 0
                    ? `${batchStats.largeFilesCount} arquivo${batchStats.largeFilesCount !== 1 ? 's são' : ' é'} grande${batchStats.largeFilesCount !== 1 ? 's' : ''}. O upload pode demorar ${batchStats.estimatedTime}.`
                    : `Upload total de ${batchStats.totalSizeFormatted}. Tempo estimado: ${batchStats.estimatedTime}.`}
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={uploadFiles}
                disabled={isUploading || uploadQueue.length === 0}
                size="lg"
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Enviar {uploadQueue.length} arquivo{uploadQueue.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large File Warning Dialog */}
      <LargeFileWarningDialog
        isOpen={showLargeFileWarning}
        onClose={handleLargeFileCancel}
        onConfirm={handleLargeFileConfirm}
        files={pendingLargeFiles}
      />
    </div>
  )
}
