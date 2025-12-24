/**
 * Custom hook for subscribing to real-time document status updates.
 * Uses Supabase Realtime to listen for changes to documents in a specific case.
 */

import { useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Document, DocumentStatus } from '../types'

export interface DocumentStatusUpdate {
  documentId: string
  previousStatus: DocumentStatus | null
  newStatus: DocumentStatus
  document: Partial<Document>
  timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

export interface UseDocumentStatusSubscriptionOptions {
  /** Case ID to subscribe to */
  caseId: string
  /** Callback when a document is inserted */
  onDocumentInsert?: (document: Document) => void
  /** Callback when a document is updated */
  onDocumentUpdate?: (update: DocumentStatusUpdate) => void
  /** Callback when a document is deleted */
  onDocumentDelete?: (documentId: string) => void
  /** Callback for any status change */
  onStatusChange?: (update: DocumentStatusUpdate) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
}

export interface UseDocumentStatusSubscriptionReturn {
  /** Whether the subscription is active */
  isSubscribed: boolean
  /** Manually unsubscribe */
  unsubscribe: () => void
  /** Manually resubscribe */
  resubscribe: () => void
}

export function useDocumentStatusSubscription({
  caseId,
  onDocumentInsert,
  onDocumentUpdate,
  onDocumentDelete,
  onStatusChange,
  enabled = true,
}: UseDocumentStatusSubscriptionOptions): UseDocumentStatusSubscriptionReturn {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)

  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<Document>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === 'INSERT' && newRecord) {
        const document = newRecord as Document
        onDocumentInsert?.(document)

        const update: DocumentStatusUpdate = {
          documentId: document.id,
          previousStatus: null,
          newStatus: document.status,
          document,
          timestamp: new Date().toISOString(),
          eventType: 'INSERT',
        }
        onStatusChange?.(update)
      }

      if (eventType === 'UPDATE' && newRecord) {
        const newDoc = newRecord as Document
        const oldDoc = oldRecord as Partial<Document> | null

        const update: DocumentStatusUpdate = {
          documentId: newDoc.id,
          previousStatus: (oldDoc?.status as DocumentStatus) || null,
          newStatus: newDoc.status,
          document: newDoc,
          timestamp: new Date().toISOString(),
          eventType: 'UPDATE',
        }

        onDocumentUpdate?.(update)

        // Only trigger status change callback if status actually changed
        if (oldDoc?.status !== newDoc.status) {
          onStatusChange?.(update)
        }
      }

      if (eventType === 'DELETE' && oldRecord) {
        const oldDoc = oldRecord as Document
        onDocumentDelete?.(oldDoc.id)

        const update: DocumentStatusUpdate = {
          documentId: oldDoc.id,
          previousStatus: oldDoc.status,
          newStatus: oldDoc.status,
          document: oldDoc,
          timestamp: new Date().toISOString(),
          eventType: 'DELETE',
        }
        onStatusChange?.(update)
      }
    },
    [onDocumentInsert, onDocumentUpdate, onDocumentDelete, onStatusChange]
  )

  const subscribe = useCallback(() => {
    if (!caseId || !enabled || channelRef.current) return

    const channelName = `documents:case:${caseId}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `case_id=eq.${caseId}`,
        },
        handlePayload
      )
      .subscribe((status) => {
        isSubscribedRef.current = status === 'SUBSCRIBED'
        if (status === 'SUBSCRIBED') {
          console.log(`[DocumentStatus] Subscribed to case: ${caseId}`)
        }
      })
  }, [caseId, enabled, handlePayload])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log(`[DocumentStatus] Unsubscribing from case: ${caseId}`)
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isSubscribedRef.current = false
    }
  }, [caseId])

  const resubscribe = useCallback(() => {
    unsubscribe()
    subscribe()
  }, [unsubscribe, subscribe])

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return {
    isSubscribed: isSubscribedRef.current,
    unsubscribe,
    resubscribe,
  }
}

export default useDocumentStatusSubscription
