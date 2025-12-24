import { useState } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal'
import type { Case } from '../types'
import { TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'

// Mock case data for testing
const mockCases: Case[] = [
  {
    id: '1',
    organization_id: 'org1',
    act_type: 'purchase_sale',
    status: 'draft',
    title: 'Property Sale - 123 Main Street',
    created_by: 'user1',
    assigned_to: null,
    canonical_data: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    organization_id: 'org1',
    act_type: 'donation',
    status: 'processing',
    title: 'Donation Agreement - Family Trust',
    created_by: 'user1',
    assigned_to: 'user2',
    canonical_data: null,
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-16T09:15:00Z',
  },
  {
    id: '3',
    organization_id: 'org1',
    act_type: 'lease',
    status: 'review',
    title: 'Commercial Lease - Downtown Office',
    created_by: 'user2',
    assigned_to: 'user1',
    canonical_data: null,
    created_at: '2024-01-08T16:45:00Z',
    updated_at: '2024-01-17T11:20:00Z',
  },
]

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'processing':
    case 'review':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'approved':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    case 'archived':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  }
}

const statusLabels = {
  draft: 'Draft',
  processing: 'Processing',
  review: 'Review',
  approved: 'Approved',
  archived: 'Archived',
}

const actTypeLabels: Record<string, string> = {
  purchase_sale: 'Purchase & Sale',
  donation: 'Donation',
  exchange: 'Exchange',
  lease: 'Lease',
}

export default function TestCaseDeletionPage() {
  const [cases, setCases] = useState<Case[]>(mockCases)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (caseItem: Case) => {
    setCaseToDelete(caseItem)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (caseToDelete) {
      setIsDeleting(true)
      // Simulate API call
      setTimeout(() => {
        setCases(cases.filter((c) => c.id !== caseToDelete.id))
        setIsDeleting(false)
        setShowDeleteModal(false)
        setCaseToDelete(null)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Case Deletion Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing case deletion with confirmation modal
          </p>
        </div>

        {cases.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                All cases have been deleted. Refresh the page to reset.
              </p>
              <Button onClick={() => setCases(mockCases)}>Reset Cases</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem: Case) => (
              <Card key={caseItem.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
                      {caseItem.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(caseItem.status)}`}>
                        {statusLabels[caseItem.status as keyof typeof statusLabels]}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(caseItem)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete Case
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {actTypeLabels[caseItem.act_type] || caseItem.act_type.replace('_', ' ')}
                  </p>
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    ID: {caseItem.id}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setCaseToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Case"
          message={`Are you sure you want to delete "${caseToDelete?.title}"? This action cannot be undone and will remove all associated documents and data.`}
          confirmLabel="Delete Case"
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}
