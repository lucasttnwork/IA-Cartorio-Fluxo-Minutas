import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClockIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useAuditStore } from '@/stores/auditStore'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { exportAuditToCSV, exportAuditToJSON, exportAuditSummary } from '@/utils/auditExport'

// Test case ID for demonstration
const TEST_CASE_ID = 'test-case-demo-123'

export default function TestAuditExportPage() {
  const auditStore = useAuditStore()
  const entries = auditStore.getEntriesByCase(TEST_CASE_ID)
  const summary = auditStore.getSummary(TEST_CASE_ID)

  // Export handlers
  const handleExportCSV = () => {
    exportAuditToCSV(entries, {
      filename: `auditlog-${TEST_CASE_ID}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`,
      includeChanges: true,
      includeEvidence: true,
      includeMetadata: true,
    })
  }

  const handleExportJSON = () => {
    exportAuditToJSON(entries, {
      filename: `auditlog-${TEST_CASE_ID}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`,
    })
  }

  const handleExportSummary = () => {
    exportAuditSummary(entries, {
      filename: `audit-summary-${TEST_CASE_ID}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <ArrowDownTrayIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teste de Exportação de Auditoria
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Demonstração das funcionalidades de exportação de relatórios
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.totalEntries}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Total de Registros
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.entriesByStatus.success || 0}
              </div>
              <div className="text-xs text-green-600/70 dark:text-green-400/70">
                Sucesso
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(summary.entriesByCategory).length}
              </div>
              <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                Categorias
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {summary.recentUsers.length}
              </div>
              <div className="text-xs text-orange-600/70 dark:text-orange-400/70">
                Usuários Ativos
              </div>
            </div>
          </div>
        </Card>

        {/* Export Options */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Opções de Exportação
          </h2>

          <div className="space-y-4">
            {/* CSV Export */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    Exportar CSV Completo
                  </h3>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-2">
                    Arquivo CSV com todos os campos incluindo alterações, evidências e metadados.
                    Compatível com Excel e Google Sheets.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/40">
                      Data/Hora
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/40">
                      Usuário
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/40">
                      Alterações
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/40">
                      Evidências
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/40">
                      Metadados
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleExportCSV}
                  disabled={entries.length === 0}
                  className="gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* JSON Export */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    Exportar JSON
                  </h3>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mb-2">
                    Arquivo JSON estruturado com todos os dados de auditoria.
                    Ideal para integração com outros sistemas e análise programática.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/40">
                      Estruturado
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/40">
                      API-Ready
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/40">
                      Completo
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleExportJSON}
                  disabled={entries.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Exportar JSON
                </Button>
              </div>
            </div>

            {/* Summary Export */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                    Exportar Resumo
                  </h3>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mb-2">
                    Relatório resumido em texto com estatísticas e últimas atividades.
                    Fácil leitura e compartilhamento.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/40">
                      Estatísticas
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/40">
                      Últimas Entradas
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/40">
                      Texto Plano
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleExportSummary}
                  disabled={entries.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Exportar Resumo
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Entries Preview */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Últimos Registros ({entries.length})
          </h2>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum registro ainda</p>
                <p className="text-sm">
                  Vá para a{' '}
                  <a href="/test-audit-trail" className="text-blue-500 hover:underline">
                    página de teste
                  </a>{' '}
                  para criar registros de auditoria
                </p>
              </div>
            ) : (
              entries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                      >
                        {entry.category}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.targetLabel}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(entry.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {entry.description}
                  </p>

                  {entry.changes && entry.changes.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.changes.length} alteração(ões) registrada(s)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sobre os Formatos de Exportação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                CSV
              </h3>
              <ul className="text-xs space-y-1">
                <li>• Compatível com Excel</li>
                <li>• Fácil análise de dados</li>
                <li>• UTF-8 com BOM</li>
                <li>• Inclui todas as colunas</li>
              </ul>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                JSON
              </h3>
              <ul className="text-xs space-y-1">
                <li>• Formato estruturado</li>
                <li>• Dados aninhados preservados</li>
                <li>• Ideal para APIs</li>
                <li>• Formatado e legível</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                Resumo
              </h3>
              <ul className="text-xs space-y-1">
                <li>• Estatísticas agregadas</li>
                <li>• Fácil leitura humana</li>
                <li>• Últimas 10 entradas</li>
                <li>• Formato de relatório</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
