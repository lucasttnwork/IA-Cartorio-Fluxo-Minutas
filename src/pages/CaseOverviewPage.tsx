import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCase, useUpdateCase } from '../hooks/useCases'
import { CaseStatusBadge } from '../components/status'
import { formatDate } from '../utils/dateFormat'
import { ArrowPathIcon, ExclamationCircleIcon, ArchiveBoxIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline'
import type { CaseStatus } from '../types'

// Act type display labels
const actTypeLabels: Record<string, string> = {
  purchase_sale: 'Purchase & Sale',
  donation: 'Donation',
  exchange: 'Exchange',
  lease: 'Lease',
}

export default function CaseOverviewPage() {
  const { caseId } = useParams()
  const { data: caseData, isLoading, isError, error, refetch } = useCase(caseId)
  const { mutate: updateCase, isPending: isUpdating } = useUpdateCase()
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const handleArchiveToggle = () => {
    if (!caseData) return

    const newStatus: CaseStatus = caseData.status === 'archived' ? 'draft' : 'archived'

    updateCase(
      { id: caseData.id, status: newStatus },
      {
        onSuccess: () => {
          setShowArchiveConfirm(false)
        },
        onError: (error) => {
          console.error('Failed to update case status:', error)
          alert('Failed to update status. Please try again.')
        },
      }
    )
  }

  const canArchive = caseData && caseData.status !== 'archived'
  const isArchived = caseData?.status === 'archived'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="card p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !caseData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Case Overview
        </h1>
        <div className="card p-8 sm:p-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Failed to load case
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <div className="mt-6">
              <button onClick={() => refetch()} className="btn-secondary">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Archived Banner */}
      {isArchived && (
        <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ArchiveBoxIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                This case is archived
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Archived cases are read-only. You can unarchive this case to make changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {caseData.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {actTypeLabels[caseData.act_type] || caseData.act_type}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CaseStatusBadge
            caseId={caseData.id}
            currentStatus={caseData.status}
            readonly={isArchived}
          />
          {isArchived ? (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              disabled={isUpdating}
              className="btn-secondary"
            >
              <ArchiveBoxXMarkIcon className="w-5 h-5 mr-2" />
              Unarchive
            </button>
          ) : (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              disabled={isUpdating}
              className="btn-secondary"
            >
              <ArchiveBoxIcon className="w-5 h-5 mr-2" />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Case Information */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Case Information
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Case ID
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
              {caseData.id}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Act Type
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {actTypeLabels[caseData.act_type] || caseData.act_type}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDate(caseData.created_at, 'long')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Last Updated
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDate(caseData.updated_at, 'long')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Additional sections can be added here */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Documents
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Document management will be implemented here.
        </p>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-75 transition-opacity"
              onClick={() => setShowArchiveConfirm(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isArchived ? 'Unarchive Case' : 'Archive Case'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {isArchived
                  ? `Are you sure you want to unarchive "${caseData?.title}"? This will restore the case to draft status.`
                  : `Are you sure you want to archive "${caseData?.title}"? Archived cases are read-only but can be restored later.`}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  disabled={isUpdating}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveToggle}
                  disabled={isUpdating}
                  className="btn-primary"
                >
                  {isUpdating ? 'Processing...' : isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
