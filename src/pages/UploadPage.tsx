import { useParams } from 'react-router-dom'

export default function UploadPage() {
  const { caseId } = useParams()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Document Upload
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Case ID: {caseId}
      </p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Document upload dropzone will be implemented here.
      </p>
    </div>
  )
}
