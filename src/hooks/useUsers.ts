import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { User } from '../types'

// Query key for users
export const usersQueryKey = ['users'] as const

// Fetch all users in the current organization
export function useUsers() {
  const { appUser } = useAuth()

  return useQuery({
    queryKey: usersQueryKey,
    queryFn: async (): Promise<User[]> => {
      if (!appUser?.organization_id) {
        return []
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', appUser.organization_id)
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }

      return (data ?? []) as User[]
    },
    enabled: !!appUser?.organization_id,
  })
}
