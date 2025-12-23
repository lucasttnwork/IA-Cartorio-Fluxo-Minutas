import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusIcon, FolderIcon } from '@heroicons/react/24/outline'
import type { Case, CaseStatus } from '../types'

// Placeholder data - will be replaced with actual API calls
const mockCases: Case[] = []

const statusColors: Record<CaseStatus, string> = {
  draft: 'badge-info',
  processing: 'badge-warning',
  review: 'badge-warning',
  approved: 'badge-success',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function DashboardPage() {
  const [cases] = useState<Case[]>(mockCases)
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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

      {cases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No cases yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new case
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Case
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem, index) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/case/${caseItem.id}`}
                className="card-hover block p-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {caseItem.title}
                  </h3>
                  <span className={statusColors[caseItem.status]}>
                    {caseItem.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {caseItem.act_type.replace('_', ' ')}
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Created{' '}
                  {new Date(caseItem.created_at).toLocaleDateString('pt-BR')}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Case Modal - placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Case
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Case creation form will be implemented here.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button className="btn-primary">Create</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
