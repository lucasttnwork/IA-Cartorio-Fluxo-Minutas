import { useState } from 'react'
import { TiptapEditor } from '../components/editor'
import { useDraftAutoSave } from '../hooks/useDraftAutoSave'
import { exportDraftAsHTML, exportDraftAsPDF } from '../utils/exportDraft'
import { Button } from '../components/ui/button'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function TestTiptapEditorPage() {
  const [content, setContent] = useState('<h1>Welcome to the Draft Editor</h1><p>Start typing to test the formatting toolbar...</p>')

  // Demo auto-save with a test draft ID
  const { saveStatus, lastSaved, forceSave } = useDraftAutoSave({
    draftId: 'test-draft-demo',
    content,
    enabled: true,
    debounceMs: 2000,
  })

  const handleContentChange = (html: string) => {
    setContent(html)
    console.log('Content updated:', html)
  }

  const handleExportHTML = () => {
    exportDraftAsHTML({
      title: 'Test_Draft_Export',
      content,
      metadata: {
        caseId: 'test-case-demo',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  }

  const handleExportPDF = () => {
    exportDraftAsPDF({
      title: 'Test_Draft_Export',
      content,
      metadata: {
        caseId: 'test-case-demo',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Tiptap Editor - Toolbar Formatting Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test all the formatting options available in the rich text editor.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportPDF}
                disabled={!content}
                className="flex items-center gap-2"
                variant="outline"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                onClick={handleExportHTML}
                disabled={!content}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export HTML
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start typing to test the editor..."
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            onForceSave={forceSave}
          />
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Features to Test
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>✅ <strong>Text Formatting:</strong> Bold, Italic, Strikethrough, Code, Highlight</li>
            <li>✅ <strong>Headings:</strong> H1, H2, H3</li>
            <li>✅ <strong>Lists:</strong> Bullet lists and numbered lists</li>
            <li>✅ <strong>Code Block:</strong> Multi-line code formatting</li>
            <li>✅ <strong>Blockquote:</strong> Quote formatting</li>
            <li>✅ <strong>Horizontal Rule:</strong> Visual separator</li>
            <li>✅ <strong>Undo/Redo:</strong> History navigation</li>
            <li>✅ <strong>Track Changes:</strong> Toggle track changes mode (Ctrl+Shift+T) to highlight insertions and deletions</li>
            <li>✅ <strong>Auto-save:</strong> Changes are automatically saved after 2 seconds of inactivity (see status indicator in toolbar)</li>
          </ul>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            HTML Output (Live Preview)
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
            <code className="text-gray-800 dark:text-gray-200">{content}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
