/**
 * useBulkUpload Hook
 *
 * React hook for managing bulk file uploads with parallel processing,
 * progress tracking, and error handling.
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import {
  bulkUploadFiles,
  type BulkUploadOptions,
  type BulkUploadResult,
  type BulkOperationProgress,
  type BulkFileProgress,
} from '../services/bulkProcessingService'
import { UPLOAD_LIMITS, formatFileSize, formatRemainingTime } from '../config/uploadConfig'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface UseBulkUploadOptions {
  caseId: string
  onUploadStart?: (files: File[]) => void
  onUploadComplete?: (result: BulkUploadResult) => void
  onFileComplete?: (file: BulkFileProgress) => void
  onFileError?: (file: BulkFileProgress, error: Error) => void
  onError?: (error: Error) => void
  concurrency?: number
  autoRetry?: boolean
}

export interface BulkUploadState {
  isUploading: boolean
  progress: BulkOperationProgress | null
  result: BulkUploadResult | null
  error: Error | null
  files: File[]
}

export interface BulkUploadStats {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  pendingFiles: number
  inProgressFiles: number
  totalSize: string
  uploadedSize: string
  overallProgress: number
  estimatedTimeRemaining: string | null
  currentSpeed: string
  isComplete: boolean
}

export interface UseBulkUploadReturn {
  // State
  isUploading: boolean
  progress: BulkOperationProgress | null
  result: BulkUploadResult | null
  error: Error | null
  files: File[]
  stats: BulkUploadStats

  // Actions
  addFiles: (files: File[]) => void
  removeFile: (fileName: string) => void
  clearFiles: () => void
  startUpload: () => Promise<BulkUploadResult | null>
  cancelUpload: () => void
  reset: () => void

  // File progress
  getFileProgress: (fileName: string) => BulkFileProgress | undefined
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useBulkUpload(options: UseBulkUploadOptions): UseBulkUploadReturn {
  const {
    caseId,
    onUploadStart,
    onUploadComplete,
    onFileComplete,
    onFileError,
    onError,
    concurrency = UPLOAD_LIMITS.MAX_CONCURRENT_UPLOADS,
    autoRetry = UPLOAD_LIMITS.BATCH_PROCESSING.AUTO_RETRY_FAILED,
  } = options

  // State
  const [state, setState] = useState<BulkUploadState>({
    isUploading: false,
    progress: null,
    result: null,
    error: null,
    files: [],
  })

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Add files to upload queue
  const addFiles = useCallback((newFiles: File[]) => {
    setState(prev => {
      // Filter out duplicates by name
      const existingNames = new Set(prev.files.map(f => f.name))
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name))

      // Limit total files
      const combinedFiles = [...prev.files, ...uniqueNewFiles]
      const limitedFiles = combinedFiles.slice(0, UPLOAD_LIMITS.MAX_FILES_PER_BATCH)

      return {
        ...prev,
        files: limitedFiles,
      }
    })
  }, [])

  // Remove file from queue
  const removeFile = useCallback((fileName: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.name !== fileName),
    }))
  }, [])

  // Clear all files
  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      files: [],
      progress: null,
      result: null,
      error: null,
    }))
  }, [])

  // Start upload
  const startUpload = useCallback(async (): Promise<BulkUploadResult | null> => {
    if (state.files.length === 0) {
      return null
    }

    // Create abort controller
    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: null,
      result: null,
      error: null,
    }))

    onUploadStart?.(state.files)

    try {
      const uploadOptions: BulkUploadOptions = {
        concurrency,
        abortSignal: abortControllerRef.current.signal,
        retryFailedFiles: autoRetry,
        maxRetries: UPLOAD_LIMITS.MAX_RETRY_ATTEMPTS,
        onProgress: (progress) => {
          setState(prev => ({
            ...prev,
            progress,
          }))
        },
        onFileComplete: (file) => {
          onFileComplete?.(file)
        },
        onFileError: (file, error) => {
          onFileError?.(file, error)
        },
      }

      const result = await bulkUploadFiles(state.files, caseId, uploadOptions)

      setState(prev => ({
        ...prev,
        isUploading: false,
        result,
        files: [], // Clear files after successful upload
      }))

      onUploadComplete?.(result)
      return result

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      setState(prev => ({
        ...prev,
        isUploading: false,
        error: err,
      }))

      onError?.(err)
      return null
    } finally {
      abortControllerRef.current = null
    }
  }, [
    state.files,
    caseId,
    concurrency,
    autoRetry,
    onUploadStart,
    onUploadComplete,
    onFileComplete,
    onFileError,
    onError,
  ])

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setState(prev => ({
      ...prev,
      isUploading: false,
    }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    cancelUpload()
    setState({
      isUploading: false,
      progress: null,
      result: null,
      error: null,
      files: [],
    })
  }, [cancelUpload])

  // Get file progress
  const getFileProgress = useCallback((fileName: string): BulkFileProgress | undefined => {
    return state.progress?.files.get(fileName)
  }, [state.progress])

  // Compute stats
  const stats: BulkUploadStats = useMemo(() => {
    const progress = state.progress
    const files = state.files

    if (!progress) {
      const totalSize = files.reduce((sum, f) => sum + f.size, 0)
      return {
        totalFiles: files.length,
        completedFiles: 0,
        failedFiles: 0,
        pendingFiles: files.length,
        inProgressFiles: 0,
        totalSize: formatFileSize(totalSize),
        uploadedSize: '0 B',
        overallProgress: 0,
        estimatedTimeRemaining: null,
        currentSpeed: '0 B/s',
        isComplete: false,
      }
    }

    return {
      totalFiles: progress.totalFiles,
      completedFiles: progress.completedFiles,
      failedFiles: progress.failedFiles,
      pendingFiles: progress.pendingFiles,
      inProgressFiles: progress.inProgressFiles,
      totalSize: formatFileSize(progress.totalBytes),
      uploadedSize: formatFileSize(progress.uploadedBytes),
      overallProgress: Math.round(progress.overallProgress),
      estimatedTimeRemaining: progress.estimatedTimeRemaining
        ? formatRemainingTime(progress.estimatedTimeRemaining)
        : null,
      currentSpeed: formatFileSize(progress.currentSpeed) + '/s',
      isComplete: progress.isComplete,
    }
  }, [state.progress, state.files])

  return {
    // State
    isUploading: state.isUploading,
    progress: state.progress,
    result: state.result,
    error: state.error,
    files: state.files,
    stats,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    cancelUpload,
    reset,

    // File progress
    getFileProgress,
  }
}

export default useBulkUpload
