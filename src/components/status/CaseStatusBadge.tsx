import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import type { CaseStatus } from '../../types'
import { useUpdateCase } from '../../hooks/useCases'

// Status badge classes following design system
const statusBadgeClasses: Record<CaseStatus, string> = {
  draft: 'badge badge-info',
  processing: 'badge badge-warning',
  review: 'badge badge-warning',
  approved: 'badge badge-success',
  archived: 'badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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

  if (readonly || availableTransitions.length === 0) {
    return (
      <span className={statusBadgeClasses[currentStatus]}>
        {statusLabels[currentStatus]}
      </span>
    )
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className={`${statusBadgeClasses[currentStatus]} cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1`}
        disabled={isPending || isChanging}
      >
        {statusLabels[currentStatus]}
        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {availableTransitions.map((status) => (
              <Menu.Item key={status}>
                {({ active }) => (
                  <button
                    onClick={() => handleStatusChange(status)}
                    className={`${
                      active
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } group flex w-full items-center px-4 py-2 text-sm`}
                    disabled={isPending || isChanging}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{statusLabels[status]}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {statusDescriptions[status]}
                      </div>
                    </div>
                    {currentStatus === status && (
                      <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

// Export helper functions for use in other components
export { validTransitions, statusLabels, statusDescriptions }
