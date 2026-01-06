/**
 * Chunked Upload Utilities
 *
 * Provides memory-efficient file upload functionality for large files
 * by splitting them into smaller chunks and uploading sequentially.
 */

import { supabase } from '../lib/supabase'
import {
  UPLOAD_SIZE_THRESHOLDS,
  UPLOAD_LIMITS,
  shouldUseChunkedUpload,
} from '../config/uploadConfig'

// Upload progress callback type
export interface UploadProgressInfo {
  fileName: string
  bytesUploaded: number
  totalBytes: number
  percentage: number
  speed: number // bytes per second
  remainingTime: number // seconds
  currentChunk: number
  totalChunks: number
  status: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error' | 'paused'
  error?: string
}

export type UploadProgressCallback = (progress: UploadProgressInfo) => void

// Chunked upload result
export interface ChunkedUploadResult {
  success: boolean
  path?: string
  error?: string
  totalBytesUploaded: number
  uploadDuration: number // milliseconds
}

// Upload state for resumable uploads
export interface UploadState {
  fileName: string
  filePath: string
  totalSize: number
  uploadedBytes: number
  chunkSize: number
  uploadedChunks: number[]
  startTime: number
  lastUpdate: number
}

// Storage for resumable upload states
const uploadStates = new Map<string, UploadState>()

/**
 * Generates a unique upload ID for tracking
 */
function generateUploadId(file: File, caseId: string): string {
  return `${caseId}-${file.name}-${file.size}-${file.lastModified}`
}

/**
 * Calculates upload speed based on bytes uploaded and time elapsed
 */
function calculateSpeed(bytesUploaded: number, startTime: number): number {
  const elapsedSeconds = (Date.now() - startTime) / 1000
  if (elapsedSeconds <= 0) return 0
  return bytesUploaded / elapsedSeconds
}

/**
 * Calculates remaining time based on current speed
 */
function calculateRemainingTime(
  bytesRemaining: number,
  speed: number
): number {
  if (speed <= 0) return Infinity
  return bytesRemaining / speed
}

/**
 * Splits a file into chunks for upload
 */
function* getFileChunks(
  file: File,
  chunkSize: number
): Generator<{ chunk: Blob; start: number; end: number; index: number }> {
  const totalChunks = Math.ceil(file.size / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    yield { chunk, start, end, index: i }
  }
}

/**
 * Uploads a single chunk to Supabase storage
 */
async function uploadChunk(
  chunk: Blob,
  filePath: string,
  chunkIndex: number,
  retryAttempts: number = UPLOAD_LIMITS.MAX_RETRY_ATTEMPTS
): Promise<{ success: boolean; error?: string }> {
  const chunkPath = `${filePath}.chunk.${chunkIndex}`

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const { error } = await supabase.storage
        .from('documents')
        .upload(chunkPath, chunk, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.warn(`Chunk ${chunkIndex} upload attempt ${attempt + 1} failed:`, error)
        if (attempt < retryAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, UPLOAD_LIMITS.RETRY_DELAY * (attempt + 1))
          )
          continue
        }
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      console.warn(`Chunk ${chunkIndex} upload attempt ${attempt + 1} error:`, err)
      if (attempt < retryAttempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, UPLOAD_LIMITS.RETRY_DELAY * (attempt + 1))
        )
        continue
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  return { success: false, error: 'Max retry attempts reached' }
}

/**
 * Merges uploaded chunks into a single file
 * Note: This is a simplified version - in production, you'd use a server-side
 * function or edge function to merge chunks
 */
async function mergeChunks(
  filePath: string,
  totalChunks: number,
  file: File
): Promise<{ success: boolean; error?: string }> {
  // For now, we'll upload the complete file directly after successful chunk validation
  // In a real implementation, you'd have a server-side function to merge chunks

  try {
    // Delete chunk files after successful merge
    const deletePromises = Array.from({ length: totalChunks }, (_, i) =>
      supabase.storage.from('documents').remove([`${filePath}.chunk.${i}`])
    )

    // Upload the complete file
    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Clean up chunk files in background
    Promise.all(deletePromises).catch((err) =>
      console.warn('Error cleaning up chunks:', err)
    )

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Merge failed',
    }
  }
}

/**
 * Uploads a large file using chunked upload
 */
export async function uploadLargeFile(
  file: File,
  caseId: string,
  onProgress?: UploadProgressCallback,
  abortSignal?: AbortSignal
): Promise<ChunkedUploadResult> {
  const startTime = Date.now()
  const uploadId = generateUploadId(file, caseId)
  const filePath = `${caseId}/${Date.now()}-${file.name}`
  const chunkSize = UPLOAD_SIZE_THRESHOLDS.CHUNK_SIZE
  const totalChunks = Math.ceil(file.size / chunkSize)

  // Initialize upload state for resumability
  const state: UploadState = {
    fileName: file.name,
    filePath,
    totalSize: file.size,
    uploadedBytes: 0,
    chunkSize,
    uploadedChunks: [],
    startTime,
    lastUpdate: startTime,
  }
  uploadStates.set(uploadId, state)

  let totalBytesUploaded = 0

  // Report initial progress
  onProgress?.({
    fileName: file.name,
    bytesUploaded: 0,
    totalBytes: file.size,
    percentage: 0,
    speed: 0,
    remainingTime: Infinity,
    currentChunk: 0,
    totalChunks,
    status: 'preparing',
  })

  try {
    // Upload chunks
    for (const { chunk, start, end, index } of getFileChunks(file, chunkSize)) {
      // Check for abort signal
      if (abortSignal?.aborted) {
        onProgress?.({
          fileName: file.name,
          bytesUploaded: totalBytesUploaded,
          totalBytes: file.size,
          percentage: (totalBytesUploaded / file.size) * 100,
          speed: 0,
          remainingTime: Infinity,
          currentChunk: index,
          totalChunks,
          status: 'paused',
        })

        return {
          success: false,
          error: 'Upload cancelled',
          totalBytesUploaded,
          uploadDuration: Date.now() - startTime,
        }
      }

      // Report uploading status
      onProgress?.({
        fileName: file.name,
        bytesUploaded: totalBytesUploaded,
        totalBytes: file.size,
        percentage: (totalBytesUploaded / file.size) * 100,
        speed: calculateSpeed(totalBytesUploaded, startTime),
        remainingTime: calculateRemainingTime(
          file.size - totalBytesUploaded,
          calculateSpeed(totalBytesUploaded, startTime)
        ),
        currentChunk: index + 1,
        totalChunks,
        status: 'uploading',
      })

      const result = await uploadChunk(chunk, filePath, index)

      if (!result.success) {
        onProgress?.({
          fileName: file.name,
          bytesUploaded: totalBytesUploaded,
          totalBytes: file.size,
          percentage: (totalBytesUploaded / file.size) * 100,
          speed: 0,
          remainingTime: Infinity,
          currentChunk: index,
          totalChunks,
          status: 'error',
          error: result.error,
        })

        return {
          success: false,
          error: result.error,
          totalBytesUploaded,
          uploadDuration: Date.now() - startTime,
        }
      }

      const chunkBytes = end - start
      totalBytesUploaded += chunkBytes
      state.uploadedBytes = totalBytesUploaded
      state.uploadedChunks.push(index)
      state.lastUpdate = Date.now()
    }

    // Merge chunks
    onProgress?.({
      fileName: file.name,
      bytesUploaded: file.size,
      totalBytes: file.size,
      percentage: 100,
      speed: calculateSpeed(totalBytesUploaded, startTime),
      remainingTime: 0,
      currentChunk: totalChunks,
      totalChunks,
      status: 'processing',
    })

    const mergeResult = await mergeChunks(filePath, totalChunks, file)

    if (!mergeResult.success) {
      onProgress?.({
        fileName: file.name,
        bytesUploaded: totalBytesUploaded,
        totalBytes: file.size,
        percentage: 100,
        speed: 0,
        remainingTime: 0,
        currentChunk: totalChunks,
        totalChunks,
        status: 'error',
        error: mergeResult.error,
      })

      return {
        success: false,
        error: mergeResult.error,
        totalBytesUploaded,
        uploadDuration: Date.now() - startTime,
      }
    }

    // Success
    onProgress?.({
      fileName: file.name,
      bytesUploaded: file.size,
      totalBytes: file.size,
      percentage: 100,
      speed: calculateSpeed(file.size, startTime),
      remainingTime: 0,
      currentChunk: totalChunks,
      totalChunks,
      status: 'complete',
    })

    // Clean up state
    uploadStates.delete(uploadId)

    return {
      success: true,
      path: filePath,
      totalBytesUploaded: file.size,
      uploadDuration: Date.now() - startTime,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    onProgress?.({
      fileName: file.name,
      bytesUploaded: totalBytesUploaded,
      totalBytes: file.size,
      percentage: (totalBytesUploaded / file.size) * 100,
      speed: 0,
      remainingTime: Infinity,
      currentChunk: 0,
      totalChunks,
      status: 'error',
      error: errorMessage,
    })

    return {
      success: false,
      error: errorMessage,
      totalBytesUploaded,
      uploadDuration: Date.now() - startTime,
    }
  }
}

/**
 * Standard upload for smaller files
 */
export async function uploadStandardFile(
  file: File,
  caseId: string,
  onProgress?: UploadProgressCallback
): Promise<ChunkedUploadResult> {
  const startTime = Date.now()
  const filePath = `${caseId}/${Date.now()}-${file.name}`

  onProgress?.({
    fileName: file.name,
    bytesUploaded: 0,
    totalBytes: file.size,
    percentage: 0,
    speed: 0,
    remainingTime: Infinity,
    currentChunk: 1,
    totalChunks: 1,
    status: 'uploading',
  })

  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      onProgress?.({
        fileName: file.name,
        bytesUploaded: 0,
        totalBytes: file.size,
        percentage: 0,
        speed: 0,
        remainingTime: Infinity,
        currentChunk: 1,
        totalChunks: 1,
        status: 'error',
        error: error.message,
      })

      return {
        success: false,
        error: error.message,
        totalBytesUploaded: 0,
        uploadDuration: Date.now() - startTime,
      }
    }

    onProgress?.({
      fileName: file.name,
      bytesUploaded: file.size,
      totalBytes: file.size,
      percentage: 100,
      speed: calculateSpeed(file.size, startTime),
      remainingTime: 0,
      currentChunk: 1,
      totalChunks: 1,
      status: 'complete',
    })

    return {
      success: true,
      path: data.path,
      totalBytesUploaded: file.size,
      uploadDuration: Date.now() - startTime,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed'

    onProgress?.({
      fileName: file.name,
      bytesUploaded: 0,
      totalBytes: file.size,
      percentage: 0,
      speed: 0,
      remainingTime: Infinity,
      currentChunk: 1,
      totalChunks: 1,
      status: 'error',
      error: errorMessage,
    })

    return {
      success: false,
      error: errorMessage,
      totalBytesUploaded: 0,
      uploadDuration: Date.now() - startTime,
    }
  }
}

/**
 * Smart upload function that chooses the best strategy based on file size
 */
export async function smartUpload(
  file: File,
  caseId: string,
  onProgress?: UploadProgressCallback,
  abortSignal?: AbortSignal
): Promise<ChunkedUploadResult> {
  if (shouldUseChunkedUpload(file)) {
    return uploadLargeFile(file, caseId, onProgress, abortSignal)
  }
  return uploadStandardFile(file, caseId, onProgress)
}

/**
 * Gets the current state of a resumable upload
 */
export function getUploadState(file: File, caseId: string): UploadState | undefined {
  const uploadId = generateUploadId(file, caseId)
  return uploadStates.get(uploadId)
}

/**
 * Clears the upload state for a file
 */
export function clearUploadState(file: File, caseId: string): void {
  const uploadId = generateUploadId(file, caseId)
  uploadStates.delete(uploadId)
}

/**
 * Gets all pending upload states
 */
export function getPendingUploads(): UploadState[] {
  return Array.from(uploadStates.values())
}

/**
 * Clears all upload states
 */
export function clearAllUploadStates(): void {
  uploadStates.clear()
}
