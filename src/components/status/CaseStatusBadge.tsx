import { useState } from 'react'
import { ChevronDownIcon, CheckIcon, ShieldExclamationIcon } from '@heroicons/react/20/solid'
import type { CaseStatus } from '../../types'
import { useUpdateCase } from '../../hooks/useCases'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Status badge variant mapping - Design system compliant
const statusVariants: Record<CaseStatus, {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
}> = {
  draft: {
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50',
  },
  processing: {
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-800/50',
  },
  review: {
    variant: 'default',
    className: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50',
  },
  approved: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200/50 dark:border-green-800/50',
  },
  archived: {
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/50',
  },
}

// Status display labels
const statusLabels: Record<CaseStatus, string> = {
  draft: 'Draft',
  processing: 'Processing',
  review: 'Review',
  approved: 'Approved',
  archived: 'Archived',
}

// Status descriptions
const statusDescriptions: Record<CaseStatus, string> = {
  draft: 'Case is being prepared',
  processing: 'Documents are being processed',
  review: 'Case is under review',
  approved: 'Case has been approved',
  archived: 'Case has been archived',
}

// Define valid status transitions
const validTransitions: Record<CaseStatus, CaseStatus[]> = {
  draft: ['processing', 'archived'],
  processing: ['review', 'draft', 'archived'],
  review: ['approved', 'processing', 'archived'],
  approved: ['archived'],
  archived: ['draft'], // Allow unarchiving
}

// Helper function to check if user role can perform a status transition
const canUserTransitionToStatus = (
  userRole: 'clerk' | 'supervisor' | 'admin' | undefined,
  targetStatus: CaseStatus
): boolean => {
  // If no user role, deny all transitions
  if (!userRole) return false

  // Clerks cannot transition to 'approved' status
  if (userRole === 'clerk' && targetStatus === 'approved') {
    return false
  }

  // Supervisors and admins can perform all transitions
  return true
}

interface CaseStatusBadgeProps {
  caseId: string
  currentStatus: CaseStatus
  readonly?: boolean
  onStatusChange?: (newStatus: CaseStatus) => void
}

export default function CaseStatusBadge({
  caseId,
  currentStatus,
  readonly = false,
  onStatusChange,
}: CaseStatusBadgeProps) {
  const { mutate: updateCase, isPending } = useUpdateCase()
  const { appUser } = useAuth()
  const [isChanging, setIsChanging] = useState(false)

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (newStatus === currentStatus || !isValidTransition(currentStatus, newStatus)) {
      return
    }

    // Check if user has permission to perform this transition
    if (!canUserTransitionToStatus(appUser?.role, newStatus)) {
      alert('You do not have permission to approve cases. Only supervisors and admins can approve.')
      return
    }

    setIsChanging(true)
    updateCase(
      { id: caseId, status: newStatus },
      {
        onSuccess: () => {
          setIsChanging(false)
          onStatusChange?.(newStatus)
        },
        onError: (error) => {
          setIsChanging(false)
          console.error('Failed to update case status:', error)
          alert('Failed to update status. Please try again.')
        },
      }
    )
  }

  const isValidTransition = (from: CaseStatus, to: CaseStatus): boolean => {
    return validTransitions[from]?.includes(to) ?? false
  }

  // Filter transitions based on user role permissions
  const allTransitions = validTransitions[currentStatus] || []
  const availableTransitions = allTransitions.filter(status =>
    canUserTransitionToStatus(appUser?.role, status)
  )
  const config = statusVariants[currentStatus]

  if (readonly || availableTransitions.length === 0) {
    return (
      <Badge className={cn(config.className)}>
        {statusLabels[currentStatus]}
      </Badge>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          className={cn(
            config.className,
            'cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1'
          )}
          aria-label={`Change status from ${statusLabels[currentStatus]}`}
        >
          {statusLabels[currentStatus]}
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="glass-popover w-56"
        align="end"
      >
        {availableTransitions.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={isPending || isChanging}
            className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700"
          >
            <div className="flex items-center w-full">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {statusLabels[status]}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {statusDescriptions[status]}
                </div>
              </div>
              {currentStatus === status && (
                <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-2" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        {/* Show restricted options for clerks with permission message */}
        {appUser?.role === 'clerk' && allTransitions.some(status => status === 'approved' && !availableTransitions.includes(status)) && (
          <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700 mt-1">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <ShieldExclamationIcon className="h-4 w-4 flex-shrink-0" />
              <span>Approval requires supervisor or admin role</span>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export helper functions for use in other components
export { validTransitions, statusLabels, statusDescriptions }
