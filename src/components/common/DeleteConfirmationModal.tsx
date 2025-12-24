import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isDeleting?: boolean
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="card relative shadow-xl p-6 max-w-md w-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="w-5 h-5 mr-2" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
