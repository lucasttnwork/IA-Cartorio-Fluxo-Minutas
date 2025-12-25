/**
 * useImagePreview Hook
 *
 * A hook for managing image document previews.
 * Handles signed URL generation, caching, and cleanup.
 *
 * Features:
 * - Generates signed URLs for image documents from Supabase storage
 * - Caches URLs to avoid unnecessary API calls
 * - Handles URL expiration and refresh
 * - Provides loading and error states
 * - Cleans up URLs on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSignedUrl } from '../lib/supabase'
import type { Document } from '../types'

export interface UseImagePreviewOptions {
  /** URL expiration time in seconds (default: 1 hour) */
  expiresIn?: number
  /** Whether to automatically load the preview */
  autoLoad?: boolean
}

export interface UseImagePreviewReturn {
  /** The signed URL for the image */
  imageUrl: string | null
  /** Whether the URL is being loaded */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
  /** Function to manually load/refresh the URL */
  loadUrl: () => Promise<void>
  /** Function to clear the cached URL */
  clearUrl: () => void
}

/**
 * Hook for managing image document preview URLs
 */
export function useImagePreview(
  document: Document | null,
  options: UseImagePreviewOptions = {}
): UseImagePreviewReturn {
  const { expiresIn = 3600, autoLoad = true } = options

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache for URL timestamps to track expiration
  const urlCacheRef = useRef<Map<string, { url: string; expiresAt: number }>>(new Map())

  /**
   * Check if document is an image
   */
  const isImageDocument = document?.mime_type?.startsWith('image/') ?? false

  /**
   * Load or refresh the signed URL
   */
  const loadUrl = useCallback(async () => {
    if (!document || !isImageDocument) {
      setImageUrl(null)
      return
    }

    // Check cache first
    const cached = urlCacheRef.current.get(document.id)
    if (cached && cached.expiresAt > Date.now()) {
      setImageUrl(cached.url)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const url = await getSignedUrl(document.storage_path, expiresIn)

      if (url) {
        // Cache the URL with expiration (subtract 5 minutes for safety margin)
        urlCacheRef.current.set(document.id, {
          url,
          expiresAt: Date.now() + (expiresIn - 300) * 1000,
        })
        setImageUrl(url)
      } else {
        setError('Nao foi possivel carregar a imagem')
        setImageUrl(null)
      }
    } catch (err) {
      console.error('Error loading image URL:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar imagem')
      setImageUrl(null)
    } finally {
      setIsLoading(false)
    }
  }, [document, isImageDocument, expiresIn])

  /**
   * Clear the cached URL
   */
  const clearUrl = useCallback(() => {
    if (document) {
      urlCacheRef.current.delete(document.id)
    }
    setImageUrl(null)
    setError(null)
  }, [document])

  // Auto-load URL when document changes
  useEffect(() => {
    if (autoLoad && document && isImageDocument) {
      loadUrl()
    } else if (!document || !isImageDocument) {
      setImageUrl(null)
    }
  }, [document?.id, isImageDocument, autoLoad, loadUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear cache on unmount
      urlCacheRef.current.clear()
    }
  }, [])

  return {
    imageUrl,
    isLoading,
    error,
    loadUrl,
    clearUrl,
  }
}

/**
 * Hook for batch loading image thumbnails
 */
export interface UseImageThumbnailsReturn {
  /** Map of document IDs to thumbnail URLs */
  thumbnails: Map<string, string>
  /** Whether thumbnails are being loaded */
  isLoading: boolean
  /** Function to load thumbnail for a specific document */
  loadThumbnail: (document: Document) => Promise<void>
}

export function useImageThumbnails(
  documents: Document[],
  options: UseImagePreviewOptions = {}
): UseImageThumbnailsReturn {
  const { expiresIn = 3600 } = options

  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  // Cache for URL timestamps
  const urlCacheRef = useRef<Map<string, { url: string; expiresAt: number }>>(new Map())

  /**
   * Load thumbnail for a single document
   */
  const loadThumbnail = useCallback(async (document: Document) => {
    if (!document.mime_type?.startsWith('image/')) return

    // Check cache first
    const cached = urlCacheRef.current.get(document.id)
    if (cached && cached.expiresAt > Date.now()) {
      setThumbnails((prev) => {
        const next = new Map(prev)
        next.set(document.id, cached.url)
        return next
      })
      return
    }

    try {
      const url = await getSignedUrl(document.storage_path, expiresIn)

      if (url) {
        // Cache the URL
        urlCacheRef.current.set(document.id, {
          url,
          expiresAt: Date.now() + (expiresIn - 300) * 1000,
        })

        setThumbnails((prev) => {
          const next = new Map(prev)
          next.set(document.id, url)
          return next
        })
      }
    } catch (err) {
      console.error(`Error loading thumbnail for document ${document.id}:`, err)
    }
  }, [expiresIn])

  // Load thumbnails for all image documents
  useEffect(() => {
    const imageDocuments = documents.filter((doc) =>
      doc.mime_type?.startsWith('image/')
    )

    if (imageDocuments.length === 0) return

    setIsLoading(true)

    const loadAll = async () => {
      await Promise.all(imageDocuments.map(loadThumbnail))
      setIsLoading(false)
    }

    loadAll()
  }, [documents, loadThumbnail])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      urlCacheRef.current.clear()
    }
  }, [])

  return {
    thumbnails,
    isLoading,
    loadThumbnail,
  }
}

export default useImagePreview
