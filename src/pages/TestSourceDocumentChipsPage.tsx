/**
 * Test page for Source Document Chips Feature
 *
 * Demonstrates the styled document chips in entity cards
 * without requiring database connections.
 */

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function TestSourceDocumentChipsPage() {
  // Mock document data to demonstrate the chip styling
  const mockDocuments = [
    { id: 'doc-1', name: 'CNH_Maria_Silva.pdf', doc_type: 'cnh' },
    { id: 'doc-2', name: 'Certidao_Casamento_Maria_Jose.pdf', doc_type: 'marriage_cert' },
    { id: 'doc-3', name: 'Escritura_Imovel_Rua_Flores_123.pdf', doc_type: 'deed' },
    { id: 'doc-4', name: 'IPTU_2024_Imovel.pdf', doc_type: 'iptu' },
    { id: 'doc-5', name: 'Procuracao_Publica_Compra_Venda.pdf', doc_type: 'proxy' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Test: Source Document Chips Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page demonstrates the new styled document chips feature in entity cards.
          </p>
        </div>

        {/* Example 1: Few Documents (3 or less) */}
        <Card>
          <CardHeader>
            <CardTitle>Example 1: Few Documents (Shows All)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Documentos de Origem (3)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockDocuments.slice(0, 3).map((doc) => (
                  <Badge
                    key={doc.id}
                    variant="outline"
                    className="text-xs font-normal max-w-[200px] truncate cursor-default hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={doc.name}
                  >
                    <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    {doc.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>13/14 campos preenchidos</span>
              <span>Criado em 15/01/2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Example 2: Many Documents (More than 3) */}
        <Card>
          <CardHeader>
            <CardTitle>Example 2: Many Documents (Shows 3 + "mais" button)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Documentos de Origem (5)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockDocuments.slice(0, 3).map((doc) => (
                  <Badge
                    key={doc.id}
                    variant="outline"
                    className="text-xs font-normal max-w-[200px] truncate cursor-default hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={doc.name}
                  >
                    <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    {doc.name}
                  </Badge>
                ))}
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  +{mockDocuments.length - 3} mais
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>10/14 campos preenchidos</span>
              <span>Criado em 16/01/2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Example 3: Expanded State (All Documents) */}
        <Card>
          <CardHeader>
            <CardTitle>Example 3: Expanded State (All Documents Visible)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Documentos de Origem (5)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockDocuments.map((doc) => (
                  <Badge
                    key={doc.id}
                    variant="outline"
                    className="text-xs font-normal max-w-[200px] truncate cursor-default hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={doc.name}
                  >
                    <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    {doc.name}
                  </Badge>
                ))}
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Mostrar menos
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>10/14 campos preenchidos</span>
              <span>Criado em 16/01/2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Example 4: Loading State */}
        <Card>
          <CardHeader>
            <CardTitle>Example 4: Loading State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="w-4 h-4 animate-pulse" />
              <span>Carregando documentos...</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>8/14 campos preenchidos</span>
              <span>Criado em 17/01/2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Example 5: No Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Example 5: No Documents (Fallback)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="w-4 h-4" />
              <span>0 documento(s)</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>5/14 campos preenchidos</span>
              <span>Criado em 18/01/2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Example 6: Property Card Style (Compact) */}
        <Card>
          <CardHeader>
            <CardTitle>Example 6: Property Card Style (Compact Spacing)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Documentos de Origem (3)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mockDocuments.slice(0, 3).map((doc) => (
                  <Badge
                    key={doc.id}
                    variant="outline"
                    className="text-xs font-normal max-w-[180px] truncate cursor-default hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={doc.name}
                  >
                    <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    {doc.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>6/6 campos</span>
              <span className="text-xs">15/01/2024</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              ✨ Features Demonstrated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>Document names displayed as individual styled Badge chips</li>
              <li>Document icon included in each chip for visual clarity</li>
              <li>Truncation for long document names with hover tooltip</li>
              <li>Maximum width constraint to prevent layout breaks</li>
              <li>Responsive wrapping for multiple documents</li>
              <li>Collapsible "show more/less" for many documents (3+ limit)</li>
              <li>Loading state with animated icon</li>
              <li>Graceful fallback when documents can't be loaded</li>
              <li>Hover effect on chips for better interactivity</li>
              <li>Dark mode support throughout</li>
              <li>Consistent spacing and alignment</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
