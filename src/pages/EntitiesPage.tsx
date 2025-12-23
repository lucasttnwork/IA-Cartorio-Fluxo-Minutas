import { useParams } from 'react-router-dom'

export default function EntitiesPage() {
  const { caseId } = useParams()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Entities
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Case ID: {caseId}
      </p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Person and Property cards will be displayed here.
      </p>
    </div>
  )
}
