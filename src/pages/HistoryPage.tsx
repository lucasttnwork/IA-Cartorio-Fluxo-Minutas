import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
  PencilSquareIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Mock data type
interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  target: string
  details: string
  status: 'success' | 'pending' | 'rejected'
}

// Mock audit log data
const mockAuditLog: AuditEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    user: 'João Silva',
    action: 'update_field',
    target: 'Valor do imóvel',
    details: 'Alterado de R$ 350.000,00 para R$ 380.000,00',
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    user: 'Maria Santos',
    action: 'add_clause',
    target: 'Cláusula de Rescisão',
    details: 'Nova cláusula adicionada à seção de condições',
    status: 'success',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    user: 'João Silva',
    action: 'regenerate_section',
    target: 'Seção de Obrigações',
    details: 'Seção regenerada completamente',
    status: 'pending',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    user: 'Admin User',
    action: 'remove_clause',
    target: 'Cláusula Obsoleta',
    details: 'Cláusula removida por não estar mais necessária',
    status: 'success',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    user: 'Maria Santos',
    action: 'update_field',
    target: 'Data de Vencimento',
    details: 'Data alterada para 30/12/2025',
    status: 'rejected',
  },
]

function getActionIcon(action: string) {
  switch (action) {
    case 'update_field':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'regenerate_section':
      return <DocumentTextIcon className="w-5 h-5" />
    case 'add_clause':
      return <PlusCircleIcon className="w-5 h-5" />
    case 'remove_clause':
      return <TrashIcon className="w-5 h-5" />
    case 'mark_pending':
      return <ClockIcon className="w-5 h-5" />
    case 'resolve_pending':
      return <CheckCircleIcon className="w-5 h-5" />
    default:
      return <DocumentTextIcon className="w-5 h-5" />
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'update_field':
      return 'Atualizar Campo'
    case 'regenerate_section':
      return 'Regenerar Seção'
    case 'add_clause':
      return 'Adicionar Cláusula'
    case 'remove_clause':
      return 'Remover Cláusula'
    case 'mark_pending':
      return 'Marcar Pendente'
    case 'resolve_pending':
      return 'Resolver Pendência'
    default:
      return 'Operação'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    case 'pending':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    case 'rejected':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
  }
}

function getStatusTextColor(status: string) {
  switch (status) {
    case 'success':
      return 'text-green-700 dark:text-green-300'
    case 'pending':
      return 'text-yellow-700 dark:text-yellow-300'
    case 'rejected':
      return 'text-red-700 dark:text-red-300'
    default:
      return 'text-gray-700 dark:text-gray-300'
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
    case 'rejected':
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
    default:
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
  }
}

export default function HistoryPage() {
  const { caseId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Filter logic
  const filteredLog = mockAuditLog.filter((entry) => {
    const matchesSearch =
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' || entry.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleExport = () => {
    // Mock export function
    const csv = [
      ['Data/Hora', 'Usuário', 'Ação', 'Alvo', 'Detalhes', 'Status'],
      ...filteredLog.map((entry) => [
        new Date(entry.timestamp).toLocaleString('pt-BR'),
        entry.user,
        getActionLabel(entry.action),
        entry.target,
        entry.details,
        entry.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditlog-${caseId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header Card */}
      <Card className="glass-card p-6 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 shadow-md">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Histórico & Auditoria
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Caso: <span className="font-semibold text-gray-700 dark:text-gray-300">{caseId || 'N/A'}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            className="gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {/* Filters Card */}
      <Card className="glass-card p-4 flex-shrink-0">
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

          <div className="flex-1 min-w-[180px]">
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
                <SelectItem value="success">✓ Sucesso</SelectItem>
                <SelectItem value="pending">⏳ Pendente</SelectItem>
                <SelectItem value="rejected">✗ Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('all')
            }}
            className="glass-subtle"
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Timeline/Audit Log */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 pr-2">
          {filteredLog.length === 0 ? (
            <Card className="glass-subtle p-8 text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                Nenhuma entrada encontrada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Tente ajustar seus critérios de pesquisa
              </p>
            </Card>
          ) : (
            filteredLog.map((entry, index) => (
              <Card
                key={entry.id}
                className={cn(
                  'border-2 p-4 transition-all duration-200 hover:shadow-md',
                  getStatusColor(entry.status)
                )}
              >
                <div className="flex gap-4">
                  {/* Timeline Connector */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shadow-md',
                      entry.status === 'success' && 'bg-green-500 dark:bg-green-600 text-white',
                      entry.status === 'pending' && 'bg-yellow-500 dark:bg-yellow-600 text-white',
                      entry.status === 'rejected' && 'bg-red-500 dark:bg-red-600 text-white',
                    )}>
                      {getActionIcon(entry.action)}
                    </div>
                    {index < filteredLog.length - 1 && (
                      <div className="w-1 h-8 bg-gray-300 dark:bg-gray-600 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className={cn(
                          'text-sm font-bold mb-1',
                          getStatusTextColor(entry.status)
                        )}>
                          {getActionLabel(entry.action)}
                        </h3>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {entry.target}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'flex-shrink-0',
                          getStatusBadgeColor(entry.status)
                        )}
                      >
                        {entry.status === 'success' && '✓ Sucesso'}
                        {entry.status === 'pending' && '⏳ Pendente'}
                        {entry.status === 'rejected' && '✗ Rejeitado'}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-3">
                      {entry.details}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-500">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>{entry.user}</span>
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
