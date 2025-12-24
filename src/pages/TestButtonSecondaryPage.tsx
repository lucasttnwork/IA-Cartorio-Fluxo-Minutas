import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

export default function TestButtonSecondaryPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Secondary Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of secondary button variants for non-primary actions.
          </p>
        </div>

        {/* Secondary Button Variants */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Secondary Button Variants
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Three variants available: solid, outline, and ghost for different levels of visual emphasis.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-secondary">
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Settings (Solid)
            </button>
            <button className="btn-secondary-outline">
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Settings (Outline)
            </button>
            <button className="btn-secondary-ghost">
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Settings (Ghost)
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
              <span className="text-sm text-gray-500 w-24">Sec. Outline:</span>
              <button className="btn-secondary-outline">Secondary Outline</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Sec. Ghost:</span>
              <button className="btn-secondary-ghost">Secondary Ghost</button>
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

        {/* Secondary Buttons with Icons */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Secondary Buttons with Icons
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-secondary">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download
            </button>
            <button className="btn-secondary">
              <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
              Duplicate
            </button>
            <button className="btn-secondary">
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh
            </button>
            <button className="btn-secondary">
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filter
            </button>
            <button className="btn-secondary">
              <EllipsisHorizontalIcon className="w-5 h-5 mr-2" />
              More Options
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
            <button className="btn-secondary" disabled>
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Disabled (Solid)
            </button>
            <button className="btn-secondary-outline" disabled>
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Disabled (Outline)
            </button>
            <button className="btn-secondary-ghost" disabled>
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Disabled (Ghost)
            </button>
          </div>
        </section>

        {/* Use Case: Modal Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Modal Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Common pattern for secondary actions alongside primary actions.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
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
                    Confirm Action
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Would you like to proceed with this action?
                  </p>
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
                      alert('Action confirmed!')
                      setShowModal(false)
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Use Case: Toolbar Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Toolbar Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Secondary buttons work great in toolbars for auxiliary actions.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg flex flex-wrap items-center gap-2">
            <button className="btn-primary">
              Save Document
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button className="btn-secondary-ghost">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export
            </button>
            <button className="btn-secondary-ghost">
              <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
              Duplicate
            </button>
            <button className="btn-secondary-ghost">
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>
        </section>

        {/* Use Case: Inline Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Inline Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Ghost and outline variants for less prominent actions in lists.
          </p>
          <div className="space-y-3">
            {['Document 1.pdf', 'Document 2.pdf', 'Contract.docx'].map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <span className="text-gray-900 dark:text-white">{doc}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary-ghost text-sm py-1 px-3">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button className="btn-secondary-ghost text-sm py-1 px-3">
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use Case: Form Actions */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Use Case: Form Actions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Using secondary outline for cancel actions in forms.
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
              <button className="btn-secondary-outline">
                Cancel
              </button>
              <button className="btn-primary">
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
            <button className="btn-secondary text-xs py-1 px-2">
              Extra Small
            </button>
            <button className="btn-secondary text-sm py-1.5 px-3">
              Small
            </button>
            <button className="btn-secondary">
              Default
            </button>
            <button className="btn-secondary text-lg py-3 px-6">
              Large
            </button>
          </div>
        </section>

        {/* Icon-only Buttons */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Icon-only Buttons
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Secondary buttons can be used for icon-only actions.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-secondary !px-2">
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            <button className="btn-secondary-outline !px-2">
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button className="btn-secondary-ghost !px-2">
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
