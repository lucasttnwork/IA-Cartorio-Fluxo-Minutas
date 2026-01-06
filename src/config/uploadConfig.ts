/**
 * Upload Configuration
 *
 * Centralized configuration for file upload handling, including
 * large file thresholds, chunked upload settings, and validation rules.
 */

// File size thresholds in bytes
export const UPLOAD_SIZE_THRESHOLDS = {
  // Maximum file size allowed (50MB)
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  // Size at which to show a warning before upload (10MB)
  WARNING_THRESHOLD: 10 * 1024 * 1024,

  // Size above which to use chunked upload (5MB)
  CHUNKED_UPLOAD_THRESHOLD: 5 * 1024 * 1024,

  // Size of each chunk for chunked upload (1MB)
  CHUNK_SIZE: 1 * 1024 * 1024,

  // Minimum file size for validation
  MIN_FILE_SIZE: 10,
} as const

// Upload limits
export const UPLOAD_LIMITS = {
  // Maximum number of files per batch upload
  MAX_FILES_PER_BATCH: 50,

  // Maximum total size for batch upload (500MB)
  MAX_BATCH_SIZE: 500 * 1024 * 1024,

  // Maximum concurrent uploads (optimized for performance)
  MAX_CONCURRENT_UPLOADS: 5,

  // Retry attempts for failed uploads
  MAX_RETRY_ATTEMPTS: 3,

  // Delay between retries (ms)
  RETRY_DELAY: 1000,

  // Batch processing settings
  BATCH_PROCESSING: {
    // Number of concurrent processing jobs
    CONCURRENT_PROCESSING_JOBS: 10,
    // Minimum time between progress updates (ms)
    PROGRESS_UPDATE_INTERVAL: 100,
    // Enable auto-retry for failed uploads in batch
    AUTO_RETRY_FAILED: true,
    // Show estimated time remaining
    SHOW_ETA: true,
  },
} as const

// Accepted file types for document upload
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
} as const

// Human-readable file type labels
export const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/tiff': 'TIFF Image',
  'image/webp': 'WebP Image',
}

// File size categories for UI display
export type FileSizeCategory = 'small' | 'medium' | 'large' | 'very_large'

export function getFileSizeCategory(sizeInBytes: number): FileSizeCategory {
  if (sizeInBytes < 1 * 1024 * 1024) return 'small' // < 1MB
  if (sizeInBytes < 5 * 1024 * 1024) return 'medium' // 1-5MB
  if (sizeInBytes < 20 * 1024 * 1024) return 'large' // 5-20MB
  return 'very_large' // > 20MB
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Format upload speed for display
export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
}

// Format remaining time for display
export function formatRemainingTime(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return 'Calculating...'
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.ceil(seconds % 60)
    return `${minutes}m ${secs}s remaining`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.ceil((seconds % 3600) / 60)
  return `${hours}h ${minutes}m remaining`
}

// Check if file requires warning before upload
export function requiresUploadWarning(file: File): boolean {
  return file.size >= UPLOAD_SIZE_THRESHOLDS.WARNING_THRESHOLD
}

// Check if file exceeds maximum size
export function exceedsMaxSize(file: File): boolean {
  return file.size > UPLOAD_SIZE_THRESHOLDS.MAX_FILE_SIZE
}

// Check if file should use chunked upload
export function shouldUseChunkedUpload(file: File): boolean {
  return file.size >= UPLOAD_SIZE_THRESHOLDS.CHUNKED_UPLOAD_THRESHOLD
}

// Get warning message for large files
export function getLargeFileWarningMessage(file: File): string {
  const sizeFormatted = formatFileSize(file.size)
  const category = getFileSizeCategory(file.size)

  if (category === 'very_large') {
    return `Este arquivo é muito grande (${sizeFormatted}). O upload pode demorar vários minutos. Deseja continuar?`
  }

  if (category === 'large') {
    return `Este arquivo é grande (${sizeFormatted}). O upload pode levar algum tempo dependendo da sua conexão.`
  }

  return `Arquivo grande detectado (${sizeFormatted}).`
}

// Get error message for files that exceed max size
export function getFileTooLargeMessage(file: File): string {
  return `O arquivo "${file.name}" (${formatFileSize(file.size)}) excede o limite máximo de ${formatFileSize(UPLOAD_SIZE_THRESHOLDS.MAX_FILE_SIZE)}.`
}

// Calculate estimated upload time based on file size (rough estimate)
export function estimateUploadTime(fileSizeBytes: number, speedBytesPerSecond: number = 500 * 1024): number {
  return fileSizeBytes / speedBytesPerSecond
}

// Validate file for upload
export interface FileValidationResult {
  isValid: boolean
  error?: {
    code: 'TOO_LARGE' | 'TOO_SMALL' | 'INVALID_TYPE' | 'EMPTY'
    message: string
  }
  warning?: {
    code: 'LARGE_FILE' | 'SLOW_UPLOAD'
    message: string
  }
}

export function validateFileForUpload(file: File): FileValidationResult {
  // Check for empty files
  if (file.size === 0) {
    return {
      isValid: false,
      error: {
        code: 'EMPTY',
        message: 'O arquivo está vazio.',
      },
    }
  }

  // Check for files too small
  if (file.size < UPLOAD_SIZE_THRESHOLDS.MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        code: 'TOO_SMALL',
        message: `O arquivo é muito pequeno (${formatFileSize(file.size)}).`,
      },
    }
  }

  // Check for files too large
  if (file.size > UPLOAD_SIZE_THRESHOLDS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        code: 'TOO_LARGE',
        message: getFileTooLargeMessage(file),
      },
    }
  }

  // Check file type
  const isAcceptedType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)
  if (!isAcceptedType) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_TYPE',
        message: `Tipo de arquivo não suportado: ${file.type || 'desconhecido'}. Use PDF, JPG, PNG, TIFF ou WebP.`,
      },
    }
  }

  // Check for large file warning
  if (requiresUploadWarning(file)) {
    return {
      isValid: true,
      warning: {
        code: 'LARGE_FILE',
        message: getLargeFileWarningMessage(file),
      },
    }
  }

  return { isValid: true }
}

// Calculate batch statistics
export interface BatchStatistics {
  totalFiles: number
  totalSize: number
  totalSizeFormatted: string
  largeFilesCount: number
  estimatedTime: string
  requiresWarning: boolean
  exceedsBatchLimit: boolean
}

export function calculateBatchStatistics(files: File[]): BatchStatistics {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const largeFilesCount = files.filter(f => requiresUploadWarning(f)).length
  const estimatedSeconds = estimateUploadTime(totalSize)

  return {
    totalFiles: files.length,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    largeFilesCount,
    estimatedTime: formatRemainingTime(estimatedSeconds),
    requiresWarning: largeFilesCount > 0 || totalSize >= UPLOAD_SIZE_THRESHOLDS.WARNING_THRESHOLD,
    exceedsBatchLimit: totalSize > UPLOAD_LIMITS.MAX_BATCH_SIZE || files.length > UPLOAD_LIMITS.MAX_FILES_PER_BATCH,
  }
}
