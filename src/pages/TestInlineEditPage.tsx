/**
 * TestInlineEditPage
 *
 * Test page for inline editing functionality in the draft editor.
 */

import { useState } from 'react'
import { TiptapEditor } from '../components/editor'
import { Card } from '@/components/ui/card'

export default function TestInlineEditPage() {
  const [content, setContent] = useState(`
    <h1>Contrato de Compra e Venda</h1>

    <h3>Qualificação das Partes</h3>
    <p><strong>VENDEDOR:</strong> <span data-field-path="people[0].full_name" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">João da Silva Santos</span>, CPF nº <span data-field-path="people[0].cpf" data-field-type="cpf" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">123.456.789-00</span>, nacionalidade <span data-field-path="people[0].nationality" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">brasileira</span>, estado civil <span data-field-path="people[0].marital_status" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">casado</span>, profissão <span data-field-path="people[0].profession" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">engenheiro</span>, residente e domiciliado(a) em <span data-field-path="people[0].address.street" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">Rua das Flores</span>, <span data-field-path="people[0].address.number" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">123</span>, <span data-field-path="people[0].address.city" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">São Paulo</span>/<span data-field-path="people[0].address.state" data-field-type="text" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">SP</span>.</p>

    <h3>Preço e Forma de Pagamento</h3>
    <p><strong>Valor Total:</strong> R$ <span data-field-path="deal.price" data-field-type="currency" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">250.000,00</span></p>
  `)

  const [editLog, setEditLog] = useState<Array<{ fieldPath: string; newValue: string; timestamp: string }>>([])

  const handleContentChange = (html: string) => {
    setContent(html)
    console.log('Content updated:', html)
  }

  const handleInlineEdit = (fieldPath: string, newValue: string) => {
    console.log('Inline edit:', fieldPath, '=', newValue)

    // Log the edit
    setEditLog(prev => [
      ...prev,
      {
        fieldPath,
        newValue,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])

    // In a real implementation, this would update the canonical data
    // For this test, we'll just update the content directly
    const updatedContent = content.replace(
      new RegExp(`(<span[^>]*data-field-path="${fieldPath}"[^>]*>)[^<]*(</span>)`),
      `$1${newValue}$2`
    )
    setContent(updatedContent)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="glass-card p-6 shadow-xl border-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Inline Field Editing Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Double-click on any <span className="text-blue-600 dark:text-blue-400 font-semibold">underlined field</span> to edit it inline.
          </p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2">
            <TiptapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Start typing..."
              onInlineEdit={handleInlineEdit}
              className="h-[600px]"
            />
          </div>

          {/* Edit Log */}
          <Card className="glass-card p-6 shadow-xl border-0 h-[600px] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Edit History
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {editLog.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No edits yet. Double-click a field to edit it.
                </p>
              ) : (
                editLog.map((edit, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <code className="text-xs text-blue-800 dark:text-blue-300 font-mono break-all">
                        {edit.fieldPath}
                      </code>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {edit.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      → {edit.newValue}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="glass-card p-6 shadow-xl border-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            How to Test
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Hover over any underlined field to see the hover effect</li>
            <li>Double-click on a field to open the edit popover</li>
            <li>Enter a new value in the input</li>
            <li>Click "Salvar" or press Enter to save</li>
            <li>The field will update and appear in the edit history</li>
            <li>Press Escape or click "Cancelar" to cancel editing</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
