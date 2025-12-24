import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCase, useUpdateCase } from '../hooks/useCases'
import { CaseStatusBadge } from '../components/status'
import { formatDate } from '../utils/dateFormat'
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
        onError: (_error) => {
          console.error('Failed to update case status:', _error)
          alert('Failed to update status. Please try again.')
        },
      }
    )
  }

  const isArchived = caseData?.status === 'archived'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
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
        <Card className="glass-card">
          <CardContent className="pt-12 pb-12 text-center">
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
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Archived Banner */}
      {isArchived && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <ArchiveBoxIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-200">
            <h4 className="font-medium">This case is archived</h4>
            <p className="mt-1">
              Archived cases are read-only. You can unarchive this case to make changes.
            </p>
          </AlertDescription>
        </Alert>
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
            <Button
              onClick={() => setShowArchiveConfirm(true)}
              disabled={isUpdating}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <ArchiveBoxXMarkIcon className="w-5 h-5" />
              Unarchive
            </Button>
          ) : (
            <Button
              onClick={() => setShowArchiveConfirm(true)}
              disabled={isUpdating}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <ArchiveBoxIcon className="w-5 h-5" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Case Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
        </CardHeader>
        <CardContent>
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
                {formatDate(caseData.created_at, 'full')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(caseData.updated_at, 'full')}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Document management will be implemented here.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <DialogContent className="glass-dialog">
          <DialogHeader>
            <DialogTitle>
              {isArchived ? 'Unarchive Case' : 'Archive Case'}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {isArchived
              ? `Are you sure you want to unarchive "${caseData?.title}"? This will restore the case to draft status.`
              : `Are you sure you want to archive "${caseData?.title}"? Archived cases are read-only but can be restored later.`}
          </DialogDescription>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowArchiveConfirm(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchiveToggle}
              disabled={isUpdating}
            >
              {isUpdating ? 'Processing...' : isArchived ? 'Unarchive' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
