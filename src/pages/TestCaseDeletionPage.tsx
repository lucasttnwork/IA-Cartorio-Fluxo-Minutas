import { useState } from 'react'
import { TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal'
import type { Case } from '../types'

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

const statusBadgeClasses = {
  draft: 'badge badge-info',
  processing: 'badge badge-warning',
  review: 'badge badge-warning',
  approved: 'badge badge-success',
  archived: 'badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (caseItem: Case, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCaseToDelete(caseItem)
    setShowDeleteModal(true)
    setOpenMenuId(null)
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

  const toggleMenu = (caseId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(openMenuId === caseId ? null : caseId)
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
          <div className="card p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              All cases have been deleted. Refresh the page to reset.
            </p>
            <button
              onClick={() => setCases(mockCases)}
              className="btn-primary mt-4"
            >
              Reset Cases
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem: Case) => (
              <div key={caseItem.id} className="relative">
                <div className="card-hover block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
                      {caseItem.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={statusBadgeClasses[caseItem.status]}>
                        {statusLabels[caseItem.status]}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(caseItem.id, e)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="More options"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        {openMenuId === caseItem.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                              <button
                                onClick={(e) => handleDeleteClick(caseItem, e)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete Case
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {actTypeLabels[caseItem.act_type] || caseItem.act_type.replace('_', ' ')}
                  </p>
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    ID: {caseItem.id}
                  </p>
                </div>
              </div>
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
