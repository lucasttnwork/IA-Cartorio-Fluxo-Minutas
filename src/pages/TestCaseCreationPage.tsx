/**
 * Test page for verifying the CreateCaseModal component in isolation.
 * This page bypasses authentication for UI testing purposes.
 *
 * Access at: /test-case-creation
 *
 * NOTE: This page should only be available in development mode.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import CreateCaseModal from '../components/case/CreateCaseModal'

export default function TestCaseCreationPage() {
  const [showModal, setShowModal] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Case Creation - UI Test Page
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            This page allows testing the CreateCaseModal component in isolation.
          </p>
        </div>

        {/* Test Controls */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Controls
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowModal(true)
                setLastAction('Modal opened')
              }}
              className="btn-primary"
            >
              Open Create Case Modal
            </button>
          </div>

          {lastAction && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Last action: {lastAction}
              </p>
            </motion.div>
          )}
        </div>

        {/* Feature Checklist */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Feature Checklist
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Multi-step form flow (3 steps)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Case title input with validation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Act type selection (Purchase/Sale, Donation, Exchange, Lease)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Description field (optional)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Deal details: Price input with R$ prefix</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Payment method selection (Full payment / Installments)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Installments count (when applicable)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Summary review before creation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Notes field (optional)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Step indicator progress</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Animated transitions between steps</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Form validation with error messages</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setLastAction('Modal closed')
        }}
      />
    </div>
  )
}
