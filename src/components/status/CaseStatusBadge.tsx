import { useState } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import type { CaseStatus } from '../../types'
import { useUpdateCase } from '../../hooks/useCases'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Status badge variant mapping
const statusVariants: Record<CaseStatus, {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
}> = {
  draft: {
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  processing: {
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  },
  review: {
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  approved: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  archived: {
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
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
  const [isChanging, setIsChanging] = useState(false)

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (newStatus === currentStatus || !isValidTransition(currentStatus, newStatus)) {
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

  const availableTransitions = validTransitions[currentStatus] || []
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export helper functions for use in other components
export { validTransitions, statusLabels, statusDescriptions }
