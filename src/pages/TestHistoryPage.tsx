import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ClockIcon,
  UserIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuditStore } from '@/stores/auditStore'
import type { AuditEntry } from '@/types/audit'

// Test case ID for demonstration
const TEST_CASE_ID = 'test-case-demo-123'

function getCategoryBadgeColor(category: string) {
  switch (category) {
    case 'document':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    case 'person':
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    case 'property':
      return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
    case 'case':
      return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
    default:
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    case 'pending':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
  }
}

export default function TestHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Get audit entries from the store
  const allEntries = useAuditStore((state) => state.entries)

  // Filter entries for this case
  const caseEntries = useMemo(() => {
    return allEntries
      .filter((entry) => entry.caseId === TEST_CASE_ID)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [allEntries])

  // Apply search and filter
  const filteredLog = useMemo(() => {
    return caseEntries.filter((entry) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.targetLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.details?.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      const matchesStatus =
        filterStatus === 'all' || entry.status === filterStatus

      // Category filter
      const matchesCategory =
        filterCategory === 'all' || entry.category === filterCategory

      // Date range filter
      const entryDate = new Date(entry.timestamp)
      const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59')

      return matchesSearch && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo
    })
  }, [caseEntries, searchTerm, filterStatus, filterCategory, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Teste de Filtro por Data - Histórico & Auditoria
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Trilha de auditoria com filtros de data •{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {caseEntries.length} registros totais
                  </span>
                  {' • '}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {filteredLog.length} filtrados
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Filters Card */}
        <Card className="glass-card p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <MagnifyingGlassIcon className="w-4 h-4 inline mr-2" />
                Pesquisar
              </label>
              <Input
                type="text"
                placeholder="Usuário, alvo ou detalhes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <FunnelIcon className="w-4 h-4 inline mr-2" />
                Status
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="focus:ring-purple-500 dark:focus:ring-purple-400">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <FunnelIcon className="w-4 h-4 inline mr-2" />
                Categoria
              </label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="focus:ring-purple-500 dark:focus:ring-purple-400">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="document">Documentos</SelectItem>
                  <SelectItem value="person">Pessoas</SelectItem>
                  <SelectItem value="property">Imóveis</SelectItem>
                  <SelectItem value="case">Caso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <ClockIcon className="w-4 h-4 inline mr-2" />
                Data Inicial
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                <ClockIcon className="w-4 h-4 inline mr-2" />
                Data Final
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterCategory('all')
                setDateFrom('')
                setDateTo('')
              }}
              className="glass-subtle"
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Timeline/Audit Log */}
        <div className="space-y-3">
          {filteredLog.length === 0 ? (
            <Card className="glass-subtle p-8 text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                {caseEntries.length === 0
                  ? 'Nenhuma atividade registrada'
                  : 'Nenhuma entrada encontrada'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {caseEntries.length === 0
                  ? 'Vá para a página de teste de auditoria para criar registros'
                  : 'Tente ajustar seus critérios de pesquisa ou data'}
              </p>
            </Card>
          ) : (
            filteredLog.map((entry) => (
              <Card
                key={entry.id}
                className={cn(
                  'border-2 p-4 transition-all duration-200 hover:shadow-md',
                  getStatusColor(entry.status)
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getCategoryBadgeColor(entry.category))}
                      >
                        {entry.category}
                      </Badge>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {entry.targetLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">
                  {entry.description}
                </p>

                {entry.changes && entry.changes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Alterações:
                    </div>
                    {entry.changes.map((change, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {change.fieldName}:
                        </span>
                        <span className="text-red-500 line-through">
                          {change.previousDisplayValue}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-500">
                          {change.newDisplayValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-500 mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{entry.userName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>
                      {formatDistanceToNow(new Date(entry.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
