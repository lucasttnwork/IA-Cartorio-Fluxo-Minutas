/**
 * useDraftAutoSave Hook
 *
 * Custom hook for auto-saving draft content to Supabase with debouncing.
 * Provides save status tracking and automatic updates after inactivity.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface UseDraftAutoSaveOptions {
  draftId: string | null
  content: string
  enabled?: boolean
  debounceMs?: number
}

export interface UseDraftAutoSaveResult {
  saveStatus: SaveStatus
  lastSaved: Date | null
  forceSave: () => Promise<void>
  error: string | null
}

export function useDraftAutoSave({
  draftId,
  content,
  enabled = true,
  debounceMs = 2000,
}: UseDraftAutoSaveOptions): UseDraftAutoSaveResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Track the current content and pending save
  const currentContentRef = useRef(content)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  /**
   * Save the current content to Supabase
   */
  const saveToDatabase = useCallback(async (contentToSave: string) => {
    if (!draftId || !enabled) {
      return
    }

    // Prevent concurrent saves
    if (isSavingRef.current) {
      return
    }

    try {
      isSavingRef.current = true
      setSaveStatus('saving')
      setError(null)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('drafts')
        .update({
          html_content: contentToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update status
      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch (err) {
      console.error('Error saving draft:', err)
      setSaveStatus('error')
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      isSavingRef.current = false
    }
  }, [draftId, enabled])

  /**
   * Force immediate save (exposed to component)
   */
  const forceSave = useCallback(async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    await saveToDatabase(currentContentRef.current)
  }, [saveToDatabase])

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(() => {
    if (!draftId || !enabled) {
      return
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Mark as unsaved
    setSaveStatus('unsaved')

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(currentContentRef.current)
    }, debounceMs)
  }, [draftId, enabled, debounceMs, saveToDatabase])

  /**
   * Watch for content changes and trigger debounced save
   */
  useEffect(() => {
    // Skip if content hasn't changed
    if (currentContentRef.current === content) {
      return
    }

    // Update ref
    currentContentRef.current = content

    // Don't trigger save on initial mount or empty content
    if (!content || !draftId) {
      return
    }

    // Schedule save
    scheduleSave()
  }, [content, draftId, scheduleSave])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Save on page unload (beforeunload)
   */
  useEffect(() => {
    if (!enabled || !draftId) {
      return
    }

    const handleBeforeUnload = () => {
      // If there are unsaved changes, save synchronously
      if (saveStatus === 'unsaved' && currentContentRef.current) {
        // Note: This is a best-effort save, may not complete before unload
        saveToDatabase(currentContentRef.current)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, draftId, saveStatus, saveToDatabase])

  return {
    saveStatus,
    lastSaved,
    forceSave,
    error,
  }
}
