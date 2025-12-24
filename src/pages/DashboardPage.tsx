import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  FolderIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { usePaginatedCases, useDeleteCase, type SortField, type SortOrder } from '../hooks/useCases'
import CreateCaseModal from '../components/case/CreateCaseModal'
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal'
import { Pagination } from '../components/common/Pagination'
import SortControls, { type SortOption } from '../components/common/SortControls'
import type { Case, CaseStatus } from '../types'
import { formatDate } from '../utils/dateFormat'

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

// Act type display labels
const actTypeLabels: Record<string, string> = {
  purchase_sale: 'Purchase & Sale',
  donation: 'Donation',
  exchange: 'Exchange',
  lease: 'Lease',
}

// Loading skeleton component
function CaseCardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="mt-3 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  )
}

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'updated_at',
    order: 'desc'
  })

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      // Reset to first page when search changes
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearchQuery])

  const { data: paginatedData, isLoading, isError, error, refetch } = usePaginatedCases({
    page: currentPage,
    pageSize,
    searchQuery: debouncedSearchQuery,
    sortField: sortOption.field,
    sortOrder: sortOption.order,
    statusFilter
  })
  const { mutate: deleteCase, isPending: isDeleting } = useDeleteCase()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const cases = paginatedData?.data ?? []
  const totalCases = paginatedData?.total ?? 0
  const totalPages = Math.ceil(totalCases / pageSize)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setOpenMenuId(null)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
    setOpenMenuId(null)
  }

  const handleDeleteClick = (caseItem: Case, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCaseToDelete(caseItem)
    setShowDeleteModal(true)
    setOpenMenuId(null)
  }

  const handleConfirmDelete = () => {
    if (caseToDelete) {
      deleteCase(caseToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false)
          setCaseToDelete(null)
        },
        onError: (error) => {
          console.error('Failed to delete case:', error)
          alert('Failed to delete case. Please try again.')
        }
      })
    }
  }

  const toggleMenu = (caseId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(openMenuId === caseId ? null : caseId)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort)
    setCurrentPage(1) // Reset to first page when sort changes
  }

  const handleStatusFilterChange = (newStatus: CaseStatus | 'all') => {
    setStatusFilter(newStatus)
    setCurrentPage(1) // Reset to first page when status filter changes
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Following design system spacing and typography */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Cases
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your document cases and drafts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Case
        </button>
      </div>

      {/* Search Bar, Status Filter, and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search cases by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as CaseStatus | 'all')}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="processing">Processing</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>
        <SortControls currentSort={sortOption} onSortChange={handleSortChange} />
      </div>

      {/* Content Section */}
      {isLoading ? (
        /* Loading State - Skeleton cards */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <CaseCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 sm:p-12"
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Failed to load cases
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => refetch()}
                className="btn-secondary"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      ) : cases.length === 0 ? (
        /* Empty State - Using card design system component */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 sm:p-12"
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {debouncedSearchQuery ? (
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              ) : (
                <FolderIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {debouncedSearchQuery ? 'No cases found' : 'No cases yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {debouncedSearchQuery
                ? `No cases match "${debouncedSearchQuery}". Try a different search term.`
                : 'Get started by creating a new case to manage your notary documents and drafts.'}
            </p>
            <div className="mt-6">
              {debouncedSearchQuery ? (
                <button
                  onClick={clearSearch}
                  className="btn-secondary"
                >
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Case
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Cases Grid - Using card-hover design system component */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem: Case, index: number) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <Link
                  to={`/case/${caseItem.id}`}
                  className="card-hover block p-4"
                >
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
                    Created {formatDate(caseItem.created_at, 'medium')}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCases}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[6, 12, 24, 48]}
              />
            </div>
          )}
        </>
      )}

      {/* Create Case Modal - Enhanced multi-step flow */}
      <CreateCaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Delete Confirmation Modal */}
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
  )
}
