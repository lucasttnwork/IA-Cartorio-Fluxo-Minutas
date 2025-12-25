import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClockIcon,
  DocumentArrowUpIcon,
  UserPlusIcon,
  HomeModernIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuditStore } from '@/stores/auditStore'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Test case ID for demonstration
const TEST_CASE_ID = 'test-case-demo-123'

export default function TestAuditTrailPage() {
  const [personName, setPersonName] = useState('João Silva')
  const [propertyAddress, setPropertyAddress] = useState('Rua das Flores, 123')
  const [selectedUserId, setSelectedUserId] = useState<string>('all')

  // Audit store actions
  const auditStore = useAuditStore()
  const allEntries = auditStore.getEntriesByCase(TEST_CASE_ID)
  const summary = auditStore.getSummary(TEST_CASE_ID)

  // Extract unique users from entries
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map<string, { userId: string; userName: string }>()
    allEntries.forEach((entry) => {
      if (!usersMap.has(entry.userId)) {
        usersMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
        })
      }
    })
    return Array.from(usersMap.values())
  }, [allEntries])

  // Filter entries by selected user
  const entries = useMemo(() => {
    if (selectedUserId === 'all') {
      return allEntries
    }
    return allEntries.filter((entry) => entry.userId === selectedUserId)
  }, [allEntries, selectedUserId])

  // Handle filter clear
  const clearUserFilter = () => {
    setSelectedUserId('all')
  }

  // Simulate actions
  const simulateDocumentUpload = () => {
    auditStore.logDocumentUpload(
      TEST_CASE_ID,
      `doc-${Date.now()}`,
      'Contrato_Compra_Venda.pdf',
      'user-123',
      'Maria Santos'
    )
  }

  const simulatePersonCreate = () => {
    auditStore.logPersonCreate(
      TEST_CASE_ID,
      `person-${Date.now()}`,
      personName,
      'user-123',
      'Maria Santos'
    )
  }

  const simulatePersonUpdate = () => {
    auditStore.logPersonUpdate(
      TEST_CASE_ID,
      'person-001',
      personName,
      [
        {
          fieldName: 'CPF',
          fieldPath: 'cpf',
          previousValue: '123.456.789-00',
          newValue: '987.654.321-00',
          previousDisplayValue: '123.456.789-00',
          newDisplayValue: '987.654.321-00',
          source: 'user',
        },
        {
          fieldName: 'Telefone',
          fieldPath: 'phone',
          previousValue: '(11) 99999-1111',
          newValue: '(11) 98888-2222',
          previousDisplayValue: '(11) 99999-1111',
          newDisplayValue: '(11) 98888-2222',
          source: 'user',
        },
      ],
      'user-456',
      'Carlos Oliveira'
    )
  }

  const simulatePropertyCreate = () => {
    auditStore.logPropertyCreate(
      TEST_CASE_ID,
      `property-${Date.now()}`,
      propertyAddress,
      'user-789',
      'Ana Costa'
    )
  }

  const simulateEdgeCreate = () => {
    auditStore.logEdgeCreate(
      TEST_CASE_ID,
      `edge-${Date.now()}`,
      'proprietário_de (pessoa -> imóvel)',
      'user-123',
      'Maria Santos'
    )
  }

  const simulateConflictResolution = () => {
    auditStore.logConflictResolution(
      TEST_CASE_ID,
      'doc-001',
      'CNH_Joao.pdf',
      'data_nascimento',
      '1985-03-15',
      'user-456',
      'Carlos Oliveira'
    )
  }

  const simulateCaseStatusChange = () => {
    auditStore.logCaseStatusChange(
      TEST_CASE_ID,
      'Compra e Venda - Imóvel Residencial',
      'draft',
      'review',
      'user-123',
      'Maria Santos'
    )
  }

  const clearTestEntries = () => {
    auditStore.clearEntries(TEST_CASE_ID)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teste de Trilha de Auditoria
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Demonstração do sistema de auditoria com evidências
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions Panel */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Simular Ações
            </h2>

            <div className="space-y-4">
              {/* Document Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documentos
                </h3>
                <Button
                  onClick={simulateDocumentUpload}
                  className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  Upload de Documento
                </Button>
              </div>

              <Separator />

              {/* Person Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pessoas
                </h3>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Nome da pessoa"
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={simulatePersonCreate}
                    className="flex-1 gap-2 bg-purple-500 hover:bg-purple-600"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Criar
                  </Button>
                  <Button
                    onClick={simulatePersonUpdate}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Property Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imóveis
                </h3>
                <Input
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="Endereço do imóvel"
                  className="mb-2"
                />
                <Button
                  onClick={simulatePropertyCreate}
                  className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <HomeModernIcon className="w-4 h-4" />
                  Criar Imóvel
                </Button>
              </div>

              <Separator />

              {/* Other Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Outras Ações
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={simulateEdgeCreate}
                    variant="outline"
                    className="gap-2"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Criar Relação
                  </Button>
                  <Button
                    onClick={simulateConflictResolution}
                    variant="outline"
                    className="gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Resolver Conflito
                  </Button>
                  <Button
                    onClick={simulateCaseStatusChange}
                    variant="outline"
                    className="gap-2 col-span-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Mudar Status do Caso
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Clear */}
              <Button
                onClick={clearTestEntries}
                variant="destructive"
                className="w-full gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Limpar Registros de Teste
              </Button>
            </div>
          </Card>

          {/* Entries List */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registros de Auditoria ({entries.length})
              </h2>
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-500" />
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Filtrar por usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUserId !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearUserFilter}
                    className="h-8 w-8 p-0"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum registro ainda</p>
                  <p className="text-sm">Simule ações para ver os registros</p>
                </div>
              ) : (
                entries.map((entry) => (
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

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <span>Por: {entry.userName}</span>
                      <span>
                        {format(new Date(entry.timestamp), 'HH:mm:ss', {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                1. Captura Automática
              </h3>
              <p>
                Todas as alterações no caseStore são automaticamente registradas
                na trilha de auditoria com timestamp e usuário.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                2. Evidências Detalhadas
              </h3>
              <p>
                Cada entrada inclui valores anteriores e novos, permitindo
                rastrear exatamente o que mudou.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                3. Persistência
              </h3>
              <p>
                Os registros são persistidos no localStorage e podem ser
                exportados em CSV para compliance.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
