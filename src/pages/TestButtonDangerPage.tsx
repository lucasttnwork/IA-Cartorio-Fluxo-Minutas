import { useState } from 'react'
import {
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  XCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'

export default function TestButtonDangerPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Danger Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of danger button variants for destructive actions.
          </p>
        </div>

        {/* Danger Button Variants */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Danger Button Variants
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Three variants available: solid, outline, and ghost for different levels of visual emphasis.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-danger">
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete (Solid)
            </button>
            <button className="btn-danger-outline">
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete (Outline)
            </button>
            <button className="btn-danger-ghost">
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete (Ghost)
            </button>
          </div>
        </section>

        {/* Comparison with Other Button Types */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Button Type Comparison
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Side-by-side comparison with other button styles.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Primary:</span>
              <button className="btn-primary">Primary Action</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Secondary:</span>
              <button className="btn-secondary">Secondary Action</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Danger:</span>
              <button className="btn-danger">Danger Action</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Ghost:</span>
              <button className="btn-ghost">Ghost Action</button>
            </div>
          </div>
        </section>

        {/* Danger Buttons with Icons */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Danger Buttons with Icons
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-danger">
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete Item
            </button>
            <button className="btn-danger">
              <XMarkIcon className="w-5 h-5 mr-2" />
              Cancel Order
            </button>
            <button className="btn-danger">
              <XCircleIcon className="w-5 h-5 mr-2" />
              Remove User
            </button>
            <button className="btn-danger">
              <NoSymbolIcon className="w-5 h-5 mr-2" />
              Block Account
            </button>
            <button className="btn-danger">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              Force Reset
            </button>
          </div>
        </section>

        {/* Disabled States */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Disabled States
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            All button variants have proper disabled styling.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-danger" disabled>
              <TrashIcon className="w-5 h-5 mr-2" />
              Disabled (Solid)
            </button>
            <button className="btn-danger-outline" disabled>
              <TrashIcon className="w-5 h-5 mr-2" />
              Disabled (Outline)
            </button>
            <button className="btn-danger-ghost" disabled>
              <TrashIcon className="w-5 h-5 mr-2" />
              Disabled (Ghost)
            </button>
          </div>
        </section>

        {/* Use Case: Confirmation Modal */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Confirmation Modal
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Common pattern for destructive action confirmation.
          </p>
          <button
            className="btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Delete Case
          </button>

          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowDeleteModal(false)}
              />
              <div className="card relative shadow-xl p-6 max-w-md w-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Case
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Are you sure you want to delete this case? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      alert('Case deleted!')
                      setShowDeleteModal(false)
                    }}
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Use Case: Inline Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Inline Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Ghost and outline variants for less prominent destructive actions.
          </p>
          <div className="space-y-3">
            {['Document 1.pdf', 'Document 2.pdf', 'Contract.docx'].map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <span className="text-gray-900 dark:text-white">{doc}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary text-sm py-1 px-3">
                    View
                  </button>
                  <button className="btn-danger-ghost text-sm py-1 px-3">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use Case: Form Cancel */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Form Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Using danger outline for cancel/discard actions in forms.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Case Title
              </label>
              <input
                type="text"
                className="input"
                defaultValue="Property Sale - 123 Main Street"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-danger-outline">
                <XMarkIcon className="w-5 h-5 mr-2" />
                Discard Changes
              </button>
              <button className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* Button Sizes (using custom classes) */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Button Sizes (with Tailwind utilities)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Combine with Tailwind utilities for different sizes.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-danger text-xs py-1 px-2">
              Extra Small
            </button>
            <button className="btn-danger text-sm py-1.5 px-3">
              Small
            </button>
            <button className="btn-danger">
              Default
            </button>
            <button className="btn-danger text-lg py-3 px-6">
              Large
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
