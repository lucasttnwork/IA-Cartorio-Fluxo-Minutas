import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Organization } from '../types'
import { useAuth } from './useAuth'

interface UpdateOrganizationInput {
  name?: string
  settings?: Record<string, unknown>
}

export function useOrganization() {
  const { appUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: organization, isLoading, error } = useQuery<Organization>({
    queryKey: ['organization', appUser?.organization_id],
    queryFn: async () => {
      if (!appUser?.organization_id) {
        throw new Error('No organization ID found')
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', appUser.organization_id)
        .single()

      if (error) throw error
      return data as Organization
    },
    enabled: !!appUser?.organization_id,
  })

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      if (!appUser?.organization_id) {
        throw new Error('No organization ID found')
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(input)
        .eq('id', appUser.organization_id)
        .select()
        .single()

      if (error) throw error
      return data as Organization
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', appUser?.organization_id], data)
      queryClient.invalidateQueries({ queryKey: ['organization', appUser?.organization_id] })
    },
  })

  return {
    organization,
    isLoading,
    error,
    updateOrganization: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
