import { useState } from 'react'
import {
  PlusIcon,
  CheckIcon,
  ArrowRightIcon,
  DocumentPlusIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function TestButtonPrimaryPage() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Primary Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of primary button variants for main actions and call-to-action elements.
          </p>
        </div>

        {/* Primary Button Variants */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Primary Button Variants
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Three variants available: solid, outline, and ghost for different levels of visual emphasis.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create (Solid)
            </button>
            <button className="btn-primary-outline">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create (Outline)
            </button>
            <button className="btn-primary-ghost">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create (Ghost)
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

        {/* Primary Buttons with Icons */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Primary Buttons with Icons
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Case
            </button>
            <button className="btn-primary">
              <DocumentPlusIcon className="w-5 h-5 mr-2" />
              Add Document
            </button>
            <button className="btn-primary">
              <PaperAirplaneIcon className="w-5 h-5 mr-2" />
              Submit
            </button>
            <button className="btn-primary">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download
            </button>
            <button className="btn-primary">
              <CheckIcon className="w-5 h-5 mr-2" />
              Confirm
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
            <button className="btn-primary" disabled>
              <PlusIcon className="w-5 h-5 mr-2" />
              Disabled (Solid)
            </button>
            <button className="btn-primary-outline" disabled>
              <PlusIcon className="w-5 h-5 mr-2" />
              Disabled (Outline)
            </button>
            <button className="btn-primary-ghost" disabled>
              <PlusIcon className="w-5 h-5 mr-2" />
              Disabled (Ghost)
            </button>
          </div>
        </section>

        {/* Loading State */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading State
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Primary button with loading indicator for async operations.
          </p>
          <button
            className="btn-primary"
            onClick={handleLoadingDemo}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                Click to Load
              </>
            )}
          </button>
        </section>

        {/* Use Case: Call to Action */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Call to Action
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Primary buttons for main call-to-action elements.
          </p>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Start Your New Case
            </h3>
            <p className="text-blue-100 mb-6">
              Begin processing documents with AI-powered entity resolution.
            </p>
            <button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors">
              Get Started
              <ArrowRightIcon className="w-5 h-5 inline-block ml-2" />
            </button>
          </div>
        </section>

        {/* Use Case: Modal Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Modal Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Common pattern for modal confirmation with primary action.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <DocumentPlusIcon className="w-5 h-5 mr-2" />
            Open Modal
          </button>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowModal(false)}
              />
              <div className="card relative shadow-xl p-6 max-w-md w-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New Case
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fill in the details to create a new document case.
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Case Title
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter case title..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      alert('Case created!')
                      setShowModal(false)
                    }}
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Case
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Use Case: Form Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Form Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Using primary button as the main form action.
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                className="input"
                rows={3}
                defaultValue="Standard property sale transaction with single buyer and seller."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary">
                <CheckIcon className="w-5 h-5 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* Button Sizes */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Button Sizes (with Tailwind utilities)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Combine with Tailwind utilities for different sizes.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary text-xs py-1 px-2">
              Extra Small
            </button>
            <button className="btn-primary text-sm py-1.5 px-3">
              Small
            </button>
            <button className="btn-primary">
              Default
            </button>
            <button className="btn-primary text-lg py-3 px-6">
              Large
            </button>
          </div>
        </section>

        {/* Icon-Only Buttons */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Icon-Only Buttons
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Primary buttons with icons only for compact UI elements.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary p-2">
              <PlusIcon className="w-5 h-5" />
            </button>
            <button className="btn-primary-outline p-2">
              <PlusIcon className="w-5 h-5" />
            </button>
            <button className="btn-primary-ghost p-2">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Variant Comparison */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Primary Variants Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Variant</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Normal</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">With Icon</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Disabled</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Solid</td>
                  <td className="py-4 px-4"><button className="btn-primary">Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary"><PlusIcon className="w-4 h-4 mr-1" />Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary" disabled>Button</button></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Outline</td>
                  <td className="py-4 px-4"><button className="btn-primary-outline">Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-outline"><PlusIcon className="w-4 h-4 mr-1" />Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-outline" disabled>Button</button></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Ghost</td>
                  <td className="py-4 px-4"><button className="btn-primary-ghost">Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-ghost"><PlusIcon className="w-4 h-4 mr-1" />Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-ghost" disabled>Button</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
