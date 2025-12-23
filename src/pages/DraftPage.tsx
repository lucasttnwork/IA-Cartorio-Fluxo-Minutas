import { useParams } from 'react-router-dom'

export default function DraftPage() {
  const { caseId } = useParams()

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Draft Editor
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Case ID: {caseId}
      </p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Tiptap editor with chat panel will be implemented here.
      </p>
    </div>
  )
}
