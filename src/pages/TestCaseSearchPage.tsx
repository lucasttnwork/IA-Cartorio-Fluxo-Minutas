import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

// Mock case data for testing
const mockCases = [
  {
    id: '1',
    title: 'Property Purchase - Silva Family',
    act_type: 'purchase_sale',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Donation Agreement - Santos to Children',
    act_type: 'donation',
    status: 'review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Property Exchange - Downtown Apartments',
    act_type: 'exchange',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Commercial Lease Agreement',
    act_type: 'lease',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'House Purchase - Downtown Location',
    act_type: 'purchase_sale',
    status: 'processing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Family Donation - Estate Transfer',
    act_type: 'donation',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const statusBadgeClasses: Record<string, string> = {
  draft: 'badge badge-info',
  processing: 'badge badge-warning',
  review: 'badge badge-warning',
  approved: 'badge badge-success',
  archived: 'badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

const statusLabels: Record<string, string> = {
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

export default function TestCaseSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter cases based on search query
  const filteredCases = mockCases.filter((caseItem) => {
    if (!debouncedSearchQuery.trim()) return true
    return caseItem.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  })

  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Case Search Test
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Testing the case search functionality
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search cases by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            data-testid="search-input"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
              data-testid="clear-search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {debouncedSearchQuery ? (
            <span data-testid="search-results">
              Found {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''} matching "{debouncedSearchQuery}"
            </span>
          ) : (
            <span>Showing all {mockCases.length} cases</span>
          )}
        </div>

        {/* Cases Grid */}
        {filteredCases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 sm:p-12"
            data-testid="empty-state"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No cases found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No cases match "{debouncedSearchQuery}". Try a different search term.
              </p>
              <div className="mt-6">
                <button
                  onClick={clearSearch}
                  className="btn-secondary"
                >
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Clear Search
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="cases-grid">
            {filteredCases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-hover p-4"
                data-testid={`case-card-${caseItem.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
                    {caseItem.title}
                  </h3>
                  <span className={statusBadgeClasses[caseItem.status]}>
                    {statusLabels[caseItem.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {actTypeLabels[caseItem.act_type] || caseItem.act_type.replace('_', ' ')}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
