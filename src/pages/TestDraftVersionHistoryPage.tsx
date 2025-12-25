/**
 * Test Page for Draft Version History Component
 *
 * Demonstrates the draft versioning feature with mock data
 */

import { useState } from 'react'
import { DraftVersionHistory, DraftComparison } from '../components/editor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import type { Draft } from '../types'

export default function TestDraftVersionHistoryPage() {
  // Mock draft versions data
  const mockVersions: Draft[] = [
    {
      id: 'draft-v5',
      case_id: 'case-123',
      version: 5,
      content: {
        sections: [
          {
            id: 'header',
            title: 'Cabeçalho',
            type: 'header',
            content: '<h1>CONTRATO DE COMPRA E VENDA</h1>',
            order: 1,
          },
        ],
      },
      html_content: '<h1>CONTRATO DE COMPRA E VENDA</h1><p>Versão 5 - Versão mais recente com todas as correções...</p>',
      pending_items: [],
      status: 'reviewing',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: 'draft-v4',
      case_id: 'case-123',
      version: 4,
      content: {
        sections: [
          {
            id: 'header',
            title: 'Cabeçalho',
            type: 'header',
            content: '<h1>CONTRATO DE COMPRA E VENDA</h1>',
            order: 1,
          },
        ],
      },
      html_content: '<h1>CONTRATO DE COMPRA E VENDA</h1><p>Versão 4 - Adicionadas cláusulas especiais...</p>',
      pending_items: [
        {
          id: 'pending-1',
          section_id: 'price',
          field_path: 'deal.price',
          reason: 'Valor não confirmado',
          severity: 'warning',
        },
      ],
      status: 'generated',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: 'draft-v3',
      case_id: 'case-123',
      version: 3,
      content: {
        sections: [
          {
            id: 'header',
            title: 'Cabeçalho',
            type: 'header',
            content: '<h1>CONTRATO DE COMPRA E VENDA</h1>',
            order: 1,
          },
        ],
      },
      html_content: '<h1>CONTRATO DE COMPRA E VENDA</h1><p>Versão 3 - Correções nas qualificações das partes...</p>',
      pending_items: [],
      status: 'approved',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
    {
      id: 'draft-v2',
      case_id: 'case-123',
      version: 2,
      content: {
        sections: [
          {
            id: 'header',
            title: 'Cabeçalho',
            type: 'header',
            content: '<h1>CONTRATO DE COMPRA E VENDA</h1>',
            order: 1,
          },
        ],
      },
      html_content: '<h1>CONTRATO DE COMPRA E VENDA</h1><p>Versão 2 - Ajustes iniciais...</p>',
      pending_items: [],
      status: 'generated',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      id: 'draft-v1',
      case_id: 'case-123',
      version: 1,
      content: {
        sections: [
          {
            id: 'header',
            title: 'Cabeçalho',
            type: 'header',
            content: '<h1>CONTRATO DE COMPRA E VENDA</h1>',
            order: 1,
          },
        ],
      },
      html_content: '<h1>CONTRATO DE COMPRA E VENDA</h1><p>Versão 1 - Primeira versão gerada...</p>',
      pending_items: [],
      status: 'generated',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
  ]

  const [currentVersionId, setCurrentVersionId] = useState<string>('draft-v5')
  const [selectedVersion, setSelectedVersion] = useState<Draft | null>(mockVersions[0])
  const [compareVersions, setCompareVersions] = useState<{ a: string; b: string } | null>(null)

  const handleVersionSelect = (versionId: string) => {
    const version = mockVersions.find(v => v.id === versionId)
    if (version) {
      setCurrentVersionId(versionId)
      setSelectedVersion(version)
      setCompareVersions(null)
      console.log('Selected version:', version.version)
    }
  }

  const handleCompareVersions = (versionAId: string, versionBId: string) => {
    setCompareVersions({ a: versionAId, b: versionBId })
    console.log('Comparing versions:', versionAId, versionBId)
  }

  const handleCreateNewVersion = () => {
    console.log('Creating new version from:', currentVersionId)
    alert('Em um ambiente real, isso criaria uma nova versão baseada na versão atual.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Histórico de Versões - Teste
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Demonstração do componente DraftVersionHistory
                </p>
              </div>
            </div>
            <Button onClick={handleCreateNewVersion}>
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Nova Versão
            </Button>
          </div>
        </Card>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Version History Panel */}
          <div className="lg:col-span-1">
            <DraftVersionHistory
              versions={mockVersions}
              currentVersionId={currentVersionId}
              onVersionSelect={handleVersionSelect}
              onCompareVersions={handleCompareVersions}
            />
          </div>

          {/* Content Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Pré-visualização da Versão
                  </h2>
                  {selectedVersion && (
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">
                        Versão {selectedVersion.version}
                      </span>
                      <span>•</span>
                      <span>
                        Status: {selectedVersion.status === 'generated' ? 'Gerado' : selectedVersion.status === 'reviewing' ? 'Em Revisão' : 'Aprovado'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(selectedVersion.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {compareVersions ? (
                  // Comparison view using DraftComparison component
                  <DraftComparison
                    versionA={mockVersions.find(v => v.id === compareVersions.a)!}
                    versionB={mockVersions.find(v => v.id === compareVersions.b)!}
                    onClose={() => setCompareVersions(null)}
                  />
                ) : selectedVersion ? (
                  // Single version view
                  <div className="space-y-4">
                    {selectedVersion.pending_items && selectedVersion.pending_items.length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                          ⚠️ Itens Pendentes ({selectedVersion.pending_items.length})
                        </h4>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          {selectedVersion.pending_items.map(item => (
                            <li key={item.id}>
                              • {item.reason} ({item.field_path})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Card className="p-6 bg-white dark:bg-gray-800">
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: selectedVersion.html_content
                        }}
                      />
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="outline" size="sm">
                        📋 Copiar Versão
                      </Button>
                      <Button variant="outline" size="sm">
                        📥 Exportar como PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        🔄 Restaurar Esta Versão
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Selecione uma versão para visualizar</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Feature Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            ✨ Recursos do Sistema de Versionamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-semibold mb-2">📝 Gerenciamento de Versões:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Criação automática de novas versões</li>
                <li>• Histórico completo de todas as versões</li>
                <li>• Metadados (data, status, pendências)</li>
                <li>• Numeração sequencial de versões</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔍 Visualização e Comparação:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Visualização de qualquer versão anterior</li>
                <li>• Comparação lado a lado de versões</li>
                <li>• Identificação visual da versão atual</li>
                <li>• Indicadores de itens pendentes</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
