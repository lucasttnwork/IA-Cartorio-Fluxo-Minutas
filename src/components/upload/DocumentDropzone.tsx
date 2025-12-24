import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { UploadProgress, Document } from '../../types'
import { supabase, uploadDocument, createProcessingJob } from '../../lib/supabase'

// Accepted file types for document upload
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
}

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Maximum number of files per upload
const MAX_FILES = 20

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
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const errorMessages = rejection.errors.map((e) => {
            if (e.code === 'file-too-large') {
              return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
            }
            if (e.code === 'file-invalid-type') {
              return 'Invalid file type (PDF, JPG, PNG, TIFF, WebP allowed)'
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

      // Add accepted files to queue
      if (acceptedFiles.length > 0) {
        const filesWithPreview = acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: file.type.startsWith('image/')
              ? URL.createObjectURL(file)
              : undefined,
          })
        )

        setUploadQueue((prev) => {
          const newQueue = [...prev, ...filesWithPreview]
          // Limit total files
          return newQueue.slice(0, MAX_FILES)
        })

        // Initialize progress for new files
        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          filesWithPreview.forEach((file) => {
            if (!newMap.has(file.name)) {
              newMap.set(file.name, {
                file_name: file.name,
                progress: 0,
                status: 'uploading',
              })
            }
          })
          return newMap
        })
      }
    },
    []
  )

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

  // Upload files to Supabase and trigger OCR processing
  const uploadFiles = useCallback(async () => {
    if (uploadQueue.length === 0 || isUploading) return

    setIsUploading(true)
    onUploadStart?.(uploadQueue)

    const results: UploadResult[] = []

    for (const file of uploadQueue) {
      // Update progress to uploading
      setUploadProgress((prev) => {
        const newMap = new Map(prev)
        newMap.set(file.name, {
          file_name: file.name,
          progress: 10,
          status: 'uploading',
        })
        return newMap
      })

      try {
        // 1. Upload file to Supabase Storage
        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          newMap.set(file.name, {
            file_name: file.name,
            progress: 30,
            status: 'uploading',
          })
          return newMap
        })

        const { path, error: uploadError } = await uploadDocument(file, caseId)

        if (uploadError || !path) {
          throw new Error(uploadError?.message || 'Failed to upload file to storage')
        }

        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          newMap.set(file.name, {
            file_name: file.name,
            progress: 60,
            status: 'uploading',
          })
          return newMap
        })

        // 2. Create document record in database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: docData, error: docError } = await (supabase as any)
          .from('documents')
          .insert({
            case_id: caseId,
            storage_path: path,
            original_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            status: 'uploaded',
            metadata: {},
          })
          .select()
          .single() as { data: Document | null; error: { message: string } | null }

        if (docError || !docData) {
          throw new Error(docError?.message || 'Failed to create document record')
        }

        setUploadProgress((prev) => {
          const newMap = new Map(prev)
          newMap.set(file.name, {
            file_name: file.name,
            progress: 80,
            status: 'processing',
          })
          return newMap
        })

        // 3. Create OCR processing job
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
          storage_path: path,
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
  }, [uploadQueue, isUploading, caseId, onUploadStart, onUploadProgress, onUploadComplete, uploadProgress])

  // Clear all files
  const clearAll = useCallback(() => {
    uploadQueue.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setUploadQueue([])
    setUploadProgress(new Map())
  }, [uploadQueue])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    disabled: disabled || isUploading,
    multiple: true,
  })

  // Get status icon for file
  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : disabled || isUploading
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{
            scale: isDragActive ? 1.05 : 1,
            y: isDragActive ? -5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col items-center"
        >
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isDragActive && !isDragReject
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : isDragReject
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
              }
            `}
          >
            <CloudArrowUpIcon
              className={`w-8 h-8 ${
                isDragActive && !isDragReject
                  ? 'text-blue-500'
                  : isDragReject
                  ? 'text-red-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            />
          </div>

          {isDragActive && !isDragReject ? (
            <>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                Drop files here
              </p>
              <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                Release to upload
              </p>
            </>
          ) : isDragReject ? (
            <>
              <p className="text-lg font-medium text-red-600 dark:text-red-400">
                Invalid file type
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                Please use PDF, JPG, PNG, TIFF, or WebP files
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Drag & drop documents here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse files
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                PDF, JPG, PNG, TIFF, WebP - Max {MAX_FILE_SIZE / 1024 / 1024}MB per file - Up to {MAX_FILES} files
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* File Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Queue Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''} selected
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  disabled={isUploading}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {uploadQueue.map((file) => {
                const progress = uploadProgress.get(file.name)
                return (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    {/* File Icon or Preview */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DocumentIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                        {progress?.status === 'error' && (
                          <span className="text-xs text-red-500">{progress.error}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {progress && progress.status !== 'error' && progress.status !== 'complete' && (
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.progress}%` }}
                            className={`h-full rounded-full ${
                              progress.status === 'processing'
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status / Remove Button */}
                    <div className="flex-shrink-0">
                      {progress ? (
                        getStatusIcon(progress.status)
                      ) : (
                        <button
                          onClick={() => removeFile(file.name)}
                          disabled={isUploading}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Upload Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={uploadFiles}
                disabled={isUploading || uploadQueue.length === 0}
                className="btn-primary"
              >
                {isUploading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                    Upload {uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
