/**
 * useDocumentPreview Hook
 *
 * A hook for managing document previews for any supported document type.
 * Handles signed URL generation, caching, and cleanup for images, PDFs, and other files.
 *
 * Features:
 * - Generates signed URLs for documents from Supabase storage
 * - Caches URLs to avoid unnecessary API calls
 * - Handles URL expiration and refresh
 * - Provides loading and error states
 * - Cleans up URLs on unmount
 * - Works with any document type (images, PDFs, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSignedUrl } from '../lib/supabase'
import type { Document } from '../types'

export interface UseDocumentPreviewOptions {
  /** URL expiration time in seconds (default: 1 hour) */
  expiresIn?: number
  /** Whether to automatically load the preview */
  autoLoad?: boolean
}

export interface UseDocumentPreviewReturn {
  /** The signed URL for the document */
  documentUrl: string | null
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
 * Hook for managing document preview URLs for any document type
 */
export function useDocumentPreview(
  document: Document | null,
  options: UseDocumentPreviewOptions = {}
): UseDocumentPreviewReturn {
  const { expiresIn = 3600, autoLoad = true } = options

  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache for URL timestamps to track expiration
  const urlCacheRef = useRef<Map<string, { url: string; expiresAt: number }>>(new Map())

  /**
   * Check if document type supports preview
   */
  const supportsPreview = useCallback((doc: Document | null): boolean => {
    if (!doc) return false
    const mimeType = doc.mime_type || ''
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    )
  }, [])

  /**
   * Load or refresh the signed URL
   */
  const loadUrl = useCallback(async () => {
    if (!document) {
      setDocumentUrl(null)
      return
    }

    // Check cache first
    const cached = urlCacheRef.current.get(document.id)
    if (cached && cached.expiresAt > Date.now()) {
      setDocumentUrl(cached.url)
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
        setDocumentUrl(url)
      } else {
        setError('Nao foi possivel carregar o documento')
        setDocumentUrl(null)
      }
    } catch (err) {
      console.error('Error loading document URL:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar documento')
      setDocumentUrl(null)
    } finally {
      setIsLoading(false)
    }
  }, [document, expiresIn])

  /**
   * Clear the cached URL
   */
  const clearUrl = useCallback(() => {
    if (document) {
      urlCacheRef.current.delete(document.id)
    }
    setDocumentUrl(null)
    setError(null)
  }, [document])

  // Auto-load URL when document changes
  useEffect(() => {
    if (autoLoad && document) {
      loadUrl()
    } else if (!document) {
      setDocumentUrl(null)
    }
  }, [document?.id, autoLoad, loadUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear cache on unmount
      urlCacheRef.current.clear()
    }
  }, [])

  return {
    documentUrl,
    isLoading,
    error,
    loadUrl,
    clearUrl,
  }
}

/**
 * Hook for managing document preview modal state
 * Combines modal state with URL loading
 */
export interface UseDocumentPreviewModalReturn {
  /** The currently previewing document */
  previewDocument: Document | null
  /** Whether the preview modal is open */
  isPreviewOpen: boolean
  /** The signed URL for the document */
  documentUrl: string | null
  /** Whether the URL is loading */
  isLoading: boolean
  /** Error if URL loading failed */
  error: string | null
  /** Open preview for a document */
  openPreview: (document: Document) => void
  /** Close the preview modal */
  closePreview: () => void
  /** Retry loading the URL */
  retryLoad: () => void
}

export function useDocumentPreviewModal(
  options: UseDocumentPreviewOptions = {}
): UseDocumentPreviewModalReturn {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const {
    documentUrl,
    isLoading,
    error,
    loadUrl,
    clearUrl,
  } = useDocumentPreview(previewDocument, { ...options, autoLoad: false })

  const openPreview = useCallback((document: Document) => {
    setPreviewDocument(document)
    setIsPreviewOpen(true)
    // URL will be loaded after state updates
  }, [])

  // Load URL when preview opens
  useEffect(() => {
    if (isPreviewOpen && previewDocument) {
      loadUrl()
    }
  }, [isPreviewOpen, previewDocument, loadUrl])

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false)
    // Clear document after animation
    setTimeout(() => {
      setPreviewDocument(null)
      clearUrl()
    }, 300)
  }, [clearUrl])

  const retryLoad = useCallback(() => {
    loadUrl()
  }, [loadUrl])

  return {
    previewDocument,
    isPreviewOpen,
    documentUrl,
    isLoading,
    error,
    openPreview,
    closePreview,
    retryLoad,
  }
}

export default useDocumentPreview
