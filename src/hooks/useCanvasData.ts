import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Person, Property, GraphEdge } from '../types'

export interface CanvasData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
}

export function useCanvasData(caseId: string | undefined) {
  const [data, setData] = useState<CanvasData>({
    people: [],
    properties: [],
    edges: [],
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
      // Fetch people, properties, and edges in parallel
      const [peopleResult, propertiesResult, edgesResult] = await Promise.all([
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
      ])

      if (peopleResult.error) {
        throw new Error(`Failed to fetch people: ${peopleResult.error.message}`)
      }
      if (propertiesResult.error) {
        throw new Error(`Failed to fetch properties: ${propertiesResult.error.message}`)
      }
      if (edgesResult.error) {
        throw new Error(`Failed to fetch edges: ${edgesResult.error.message}`)
      }

      setData({
        people: (peopleResult.data as Person[]) || [],
        properties: (propertiesResult.data as Property[]) || [],
        edges: (edgesResult.data as GraphEdge[]) || [],
      })
    } catch (err) {
      console.error('Error loading canvas data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load canvas data')
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  // Load data on mount and when caseId changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Subscribe to real-time updates
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
