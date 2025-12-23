import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper to get signed URLs for document storage
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Error getting signed URL:', error)
    return null
  }

  return data.signedUrl
}

// Helper to upload document
export async function uploadDocument(
  file: File,
  caseId: string
): Promise<{ path: string; error: Error | null }> {
  const fileName = `${caseId}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { path: '', error }
  }

  return { path: data.path, error: null }
}

// Subscribe to realtime changes
export function subscribeToCase(
  caseId: string,
  callbacks: {
    onDocumentChange?: (payload: unknown) => void
    onEntityChange?: (payload: unknown) => void
    onDraftChange?: (payload: unknown) => void
  }
) {
  const channel = supabase
    .channel(`case:${caseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onDocumentChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'people',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onEntityChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onEntityChange?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'drafts',
        filter: `case_id=eq.${caseId}`,
      },
      (payload) => callbacks.onDraftChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export default supabase
