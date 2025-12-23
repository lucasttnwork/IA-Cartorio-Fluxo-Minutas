import { useParams } from 'react-router-dom'

export default function CanvasPage() {
  const { caseId } = useParams()

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Canvas
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Case ID: {caseId}
      </p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Infinite canvas with React Flow will be implemented here.
      </p>
    </div>
  )
}
