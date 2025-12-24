import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Case, ActType, CaseStatus, PaginatedResponse } from '../types'

// Query key for cases
export const casesQueryKey = ['cases'] as const

// Fetch all cases for the current user's organization
export function useCases() {
  const { appUser } = useAuth()

  return useQuery({
    queryKey: casesQueryKey,
    queryFn: async (): Promise<Case[]> => {
      if (!appUser?.organization_id) {
        return []
      }

      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('organization_id', appUser.organization_id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching cases:', error)
        throw error
      }

      return (data ?? []) as Case[]
    },
    enabled: !!appUser?.organization_id,
  })
}

// Fetch cases with pagination
export type SortField = 'updated_at' | 'created_at' | 'title' | 'status' | 'act_type'
export type SortOrder = 'asc' | 'desc'

interface UsePaginatedCasesParams {
  page?: number
  pageSize?: number
  searchQuery?: string
  sortField?: SortField
  sortOrder?: SortOrder
  statusFilter?: CaseStatus | 'all'
}

export function usePaginatedCases({
  page = 1,
  pageSize = 6,
  searchQuery = '',
  sortField = 'updated_at',
  sortOrder = 'desc',
  statusFilter = 'all'
}: UsePaginatedCasesParams = {}) {
  const { appUser } = useAuth()

  return useQuery({
    queryKey: [...casesQueryKey, 'paginated', page, pageSize, searchQuery, sortField, sortOrder, statusFilter],
    queryFn: async (): Promise<PaginatedResponse<Case>> => {
      if (!appUser?.organization_id) {
        return {
          data: [],
          total: 0,
          page,
          page_size: pageSize,
          has_more: false,
        }
      }

      // Calculate range for Supabase
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Build query with optional search
      let countQuery = supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', appUser.organization_id)

      let dataQuery = supabase
        .from('cases')
        .select('*')
        .eq('organization_id', appUser.organization_id)

      // Apply search filter if provided
      if (searchQuery.trim()) {
        const searchFilter = `title.ilike.%${searchQuery}%`
        countQuery = countQuery.or(searchFilter)
        dataQuery = dataQuery.or(searchFilter)
      }

      // Apply status filter if provided
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter)
        dataQuery = dataQuery.eq('status', statusFilter)
      }

      // Fetch total count
      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('Error fetching cases count:', countError)
        throw countError
      }

      const totalCount = count ?? 0

      // Fetch paginated data with dynamic sorting
      const { data, error } = await dataQuery
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to)

      if (error) {
        console.error('Error fetching cases:', error)
        throw error
      }

      return {
        data: (data ?? []) as Case[],
        total: totalCount,
        page,
        page_size: pageSize,
        has_more: to < totalCount - 1,
      }
    },
    enabled: !!appUser?.organization_id,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page (React Query v5)
  })
}

// Fetch a single case by ID
export function useCase(caseId: string | undefined) {
  return useQuery({
    queryKey: [...casesQueryKey, caseId],
    queryFn: async (): Promise<Case | null> => {
      if (!caseId) return null

      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single()

      if (error) {
        console.error('Error fetching case:', error)
        throw error
      }

      return data as Case
    },
    enabled: !!caseId,
  })
}

// Create a new case
interface DealDetailsInput {
  price?: number
  payment_method?: 'full' | 'installments'
  installments_count?: number
}

interface CreateCaseInput {
  title: string
  act_type: ActType
  description?: string
  deal_details?: DealDetailsInput
  notes?: string
}

export function useCreateCase() {
  const queryClient = useQueryClient()
  const { appUser, user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateCaseInput): Promise<Case> => {
      if (!appUser?.organization_id || !user?.id) {
        throw new Error('User not authenticated')
      }

      // Build canonical_data with deal details if provided
      let canonicalData = null
      if (input.deal_details || input.description || input.notes) {
        canonicalData = {
          people: [],
          properties: [],
          edges: [],
          deal: input.deal_details ? {
            type: input.act_type,
            price: input.deal_details.price,
            paymentSchedule: input.deal_details.payment_method === 'installments' && input.deal_details.installments_count ? {
              entries: Array.from({ length: input.deal_details.installments_count }, (_, i) => ({
                description: `Installment ${i + 1}`,
                percentage: 100 / input.deal_details!.installments_count!,
              }))
            } : undefined,
          } : null,
          metadata: {
            description: input.description || null,
            notes: input.notes || null,
          },
        }
      }

      // Use explicit type assertion for Supabase insert
      const insertData = {
        organization_id: appUser.organization_id,
        title: input.title,
        act_type: input.act_type,
        status: 'draft' as CaseStatus,
        created_by: user.id,
        assigned_to: null,
        canonical_data: canonicalData,
      }

      const { data, error } = await supabase
        .from('cases')
        .insert(insertData as never)
        .select()
        .single()

      if (error) {
        console.error('Error creating case:', error)
        throw error
      }

      return data as Case
    },
    onSuccess: () => {
      // Invalidate cases query to refetch the list
      queryClient.invalidateQueries({ queryKey: casesQueryKey })
    },
  })
}

// Update a case
interface UpdateCaseInput {
  id: string
  title?: string
  status?: CaseStatus
  act_type?: ActType
  assigned_to?: string | null
}

export function useUpdateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateCaseInput): Promise<Case> => {
      const { id, ...updates } = input

      const { data, error } = await supabase
        .from('cases')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating case:', error)
        throw error
      }

      return data as Case
    },
    onSuccess: (data) => {
      // Invalidate both the list and the specific case query
      queryClient.invalidateQueries({ queryKey: casesQueryKey })
      queryClient.invalidateQueries({ queryKey: [...casesQueryKey, data.id] })
    },
  })
}

// Delete a case
export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (caseId: string): Promise<void> => {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId)

      if (error) {
        console.error('Error deleting case:', error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate cases query to refetch the list
      queryClient.invalidateQueries({ queryKey: casesQueryKey })
    },
  })
}
