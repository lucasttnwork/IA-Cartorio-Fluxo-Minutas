import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Person, Property, GraphEdge, Document } from '../types'

export interface CanvasData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  documents: Document[]
}

export function useCanvasData(caseId: string | undefined) {
  const [data, setData] = useState<CanvasData>({
    people: [],
    properties: [],
    edges: [],
    documents: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!caseId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch people, properties, edges, and documents in parallel
      const [peopleResult, propertiesResult, edgesResult, documentsResult] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('people')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('properties')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('graph_edges')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .eq('doc_type', 'proxy')
          .order('created_at', { ascending: false }),
      ])

      if (peopleResult.error) {
        throw new Error(`Falha ao buscar pessoas: ${peopleResult.error.message}`)
      }
      if (propertiesResult.error) {
        throw new Error(`Falha ao buscar imóveis: ${propertiesResult.error.message}`)
      }
      if (edgesResult.error) {
        throw new Error(`Falha ao buscar arestas: ${edgesResult.error.message}`)
      }
      if (documentsResult.error) {
        throw new Error(`Falha ao buscar documentos: ${documentsResult.error.message}`)
      }

      setData({
        people: (peopleResult.data as Person[]) || [],
        properties: (propertiesResult.data as Property[]) || [],
        edges: (edgesResult.data as GraphEdge[]) || [],
        documents: (documentsResult.data as Document[]) || [],
      })
    } catch (err) {
      console.error('Erro ao carregar dados do canvas:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados do canvas')
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  // Load data on mount and when caseId changes
  // Note: loadData is wrapped in useCallback with caseId as dependency,
  // so this effect only re-runs when caseId changes (not on every render)
  useEffect(() => {
    loadData()
  }, [loadData])

  // Subscribe to real-time updates
  // This effect depends on loadData to ensure it reloads when data fetching logic changes.
  // The cleanup function properly unsubscribes from the Supabase channel when the effect
  // re-runs or when the component unmounts, preventing memory leaks and stale subscriptions.
  useEffect(() => {
    if (!caseId) return

    const channel = supabase
      .channel(`canvas:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'people',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          // Reload data when people change
          loadData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          // Reload data when properties change
          loadData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'graph_edges',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          // Reload data when edges change
          loadData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          // Reload data when documents change
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [caseId, loadData])

  return {
    data,
    isLoading,
    error,
    reload: loadData,
  }
}
