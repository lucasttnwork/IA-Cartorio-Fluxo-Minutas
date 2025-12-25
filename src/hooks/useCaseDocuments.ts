import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Document } from '../types'

/**
 * Hook to fetch and subscribe to documents for a specific case
 * Provides real-time updates when documents are added, modified, or deleted
 */
export function useCaseDocuments(caseId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!caseId) {
      setDocuments([])
      return
    }

    setIsLoading(true)

    // Fetch initial documents
    const fetchDocuments = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setDocuments((data || []) as Document[])
        setError(null)
      } catch (err) {
        console.error('Error fetching documents:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch documents'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`documents:case_id=eq.${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments((prev) => [payload.new as Document, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === (payload.new as Document).id
                  ? (payload.new as Document)
                  : doc
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) =>
              prev.filter((doc) => doc.id !== (payload.old as Document).id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [caseId])

  return {
    documents,
    isLoading,
    error,
    refetch: () => {
      if (caseId) {
        setIsLoading(true)
        supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })
          .then(({ data, error: fetchError }) => {
            if (fetchError) {
              setError(fetchError)
            } else {
              setDocuments((data || []) as Document[])
              setError(null)
            }
            setIsLoading(false)
          })
      }
    },
  }
}

export default useCaseDocuments
