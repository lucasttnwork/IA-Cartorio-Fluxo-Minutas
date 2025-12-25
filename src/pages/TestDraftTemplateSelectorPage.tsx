/**
 * Test page for Draft Template Selector component
 */

import { useState } from 'react'
import { DraftTemplateSelector } from '../components/editor'
import type { DraftTemplate } from '../types'

export default function TestDraftTemplateSelectorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)

  const handleSelectTemplate = (template: DraftTemplate) => {
    console.log('Template selected:', template)
    setSelectedTemplate(template)

    // Simulate creating a draft
    setTimeout(() => {
      alert(`Minuta criada com sucesso usando o modelo: ${template.name}`)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Draft Template Selector Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the template selection interface
          </p>
        </div>

        <DraftTemplateSelector
          onSelectTemplate={handleSelectTemplate}
        />

        {selectedTemplate && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Selected Template
            </h2>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto">
              {JSON.stringify(selectedTemplate, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
