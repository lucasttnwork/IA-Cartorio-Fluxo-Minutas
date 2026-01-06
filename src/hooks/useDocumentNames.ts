/**
 * useDocumentNames Hook
 *
 * Fetches document names from an array of document IDs.
 * Used to display source document chips in entity cards.
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface DocumentNameInfo {
  id: string
  name: string
  doc_type: string | null
}

export function useDocumentNames(documentIds: string[] | null | undefined) {
  const [documents, setDocuments] = useState<DocumentNameInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Early return if no document IDs
    if (!documentIds || documentIds.length === 0) {
      setDocuments([])
      setLoading(false)
      setError(null)
      return
    }

    let isMounted = true

    const fetchDocumentNames = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('id, original_name, doc_type')
          .in('id', documentIds)

        if (fetchError) {
          throw fetchError
        }

        if (isMounted && data) {
          setDocuments(
            data.map((doc) => ({
              id: doc.id,
              name: doc.original_name,
              doc_type: doc.doc_type,
            }))
          )
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useDocumentNames] Error fetching document names:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch document names')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDocumentNames()

    return () => {
      isMounted = false
    }
  }, [documentIds])

  return { documents, loading, error }
}
