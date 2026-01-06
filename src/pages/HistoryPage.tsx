import { useState, useMemo } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DocumentArrowUpIcon,
  UserPlusIcon,
  HomeModernIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuditStore, useCaseAuditTrail } from '@/stores/auditStore'
import type { AuditEntry, AuditActionType, AuditCategory, FieldChangeEvidence } from '@/types/audit'
import { exportAuditToCSV, exportAuditToJSON, exportAuditSummary } from '@/utils/auditExport'

// Action icon mapping
function getActionIcon(action: AuditActionType) {
  switch (action) {
    // Document actions
    case 'document_upload':
      return <DocumentArrowUpIcon className="w-5 h-5" />
    case 'document_delete':
      return <TrashIcon className="w-5 h-5" />
    case 'document_approve':
      return <CheckCircleIcon className="w-5 h-5" />
    case 'document_reject':
      return <ExclamationTriangleIcon className="w-5 h-5" />
    case 'document_status_change':
      return <ArrowPathIcon className="w-5 h-5" />

    // Person actions
    case 'person_create':
      return <UserPlusIcon className="w-5 h-5" />
    case 'person_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'person_delete':
      return <TrashIcon className="w-5 h-5" />
    case 'person_merge':
      return <LinkIcon className="w-5 h-5" />

    // Property actions
    case 'property_create':
      return <HomeModernIcon className="w-5 h-5" />
    case 'property_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'property_delete':
      return <TrashIcon className="w-5 h-5" />

    // Relationship actions
    case 'edge_create':
      return <LinkIcon className="w-5 h-5" />
    case 'edge_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'edge_delete':
      return <TrashIcon className="w-5 h-5" />
    case 'edge_confirm':
      return <CheckCircleIcon className="w-5 h-5" />

    // Draft actions
    case 'draft_create':
      return <DocumentTextIcon className="w-5 h-5" />
    case 'draft_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'draft_approve':
      return <CheckCircleIcon className="w-5 h-5" />
    case 'draft_section_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'draft_clause_add':
      return <PlusCircleIcon className="w-5 h-5" />
    case 'draft_clause_remove':
      return <TrashIcon className="w-5 h-5" />

    // Field actions
    case 'field_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'field_resolve_conflict':
      return <CheckCircleIcon className="w-5 h-5" />

    // Case actions
    case 'case_create':
      return <PlusCircleIcon className="w-5 h-5" />
    case 'case_update':
      return <PencilSquareIcon className="w-5 h-5" />
    case 'case_status_change':
      return <ArrowPathIcon className="w-5 h-5" />
    case 'case_assign':
      return <UserIcon className="w-5 h-5" />

    default:
      return <DocumentTextIcon className="w-5 h-5" />
  }
}

// Action labels mapping
const actionLabels: Record<AuditActionType, string> = {
  document_upload: 'Upload de Documento',
  document_delete: 'Exclusão de Documento',
  document_approve: 'Aprovação de Documento',
  document_reject: 'Rejeição de Documento',
  document_status_change: 'Alteração de Status',
  person_create: 'Criação de Pessoa',
  person_update: 'Atualização de Pessoa',
  person_delete: 'Exclusão de Pessoa',
  person_merge: 'Mesclagem de Pessoas',
  property_create: 'Criação de Imóvel',
  property_update: 'Atualização de Imóvel',
  property_delete: 'Exclusão de Imóvel',
  edge_create: 'Criação de Relacionamento',
  edge_update: 'Atualização de Relacionamento',
  edge_delete: 'Exclusão de Relacionamento',
  edge_confirm: 'Confirmação de Relacionamento',
  draft_create: 'Criação de Minuta',
  draft_update: 'Atualização de Minuta',
  draft_approve: 'Aprovação de Minuta',
  draft_section_update: 'Atualização de Seção',
  draft_clause_add: 'Adição de Cláusula',
  draft_clause_remove: 'Remoção de Cláusula',
  field_update: 'Atualização de Campo',
  field_resolve_conflict: 'Resolução de Conflito',
  case_create: 'Criação de Caso',
  case_update: 'Atualização de Caso',
  case_status_change: 'Alteração de Status do Caso',
  case_assign: 'Atribuição de Caso',
  custom: 'Ação Personalizada',
}

// Category labels mapping
const categoryLabels: Record<AuditCategory, string> = {
  document: 'Documento',
  person: 'Pessoa',
  property: 'Imóvel',
  relationship: 'Relacionamento',
  draft: 'Minuta',
  field: 'Campo',
  case: 'Caso',
  system: 'Sistema',
}

// Status styling
function getStatusColor(status: AuditEntry['status']) {
  switch (status) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    case 'pending':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    case 'failed':
    case 'rejected':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
  }
}

function getStatusTextColor(status: AuditEntry['status']) {
  switch (status) {
    case 'success':
      return 'text-green-700 dark:text-green-300'
    case 'pending':
      return 'text-yellow-700 dark:text-yellow-300'
    case 'failed':
    case 'rejected':
      return 'text-red-700 dark:text-red-300'
    default:
      return 'text-gray-700 dark:text-gray-300'
  }
}

function getStatusBadgeColor(status: AuditEntry['status']) {
  switch (status) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
    case 'failed':
    case 'rejected':
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
    default:
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
  }
}

function getIconBgColor(status: AuditEntry['status']) {
  switch (status) {
    case 'success':
      return 'bg-green-500 dark:bg-green-600'
    case 'pending':
      return 'bg-yellow-500 dark:bg-yellow-600'
    case 'failed':
    case 'rejected':
      return 'bg-red-500 dark:bg-red-600'
    default:
      return 'bg-gray-500 dark:bg-gray-600'
  }
}

// Category colors
function getCategoryBadgeColor(category: AuditCategory) {
  switch (category) {
    case 'document':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    case 'person':
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    case 'property':
      return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
    case 'relationship':
      return 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'
    case 'draft':
      return 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
    case 'field':
      return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
    case 'case':
      return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
    case 'system':
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300'
    default:
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300'
  }
}

// Changes detail component
function ChangesDetail({ changes }: { changes: FieldChangeEvidence[] }) {
  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Alterações Detalhadas
      </h4>
      <div className="space-y-2">
        {changes.map((change, index) => (
          <div
            key={index}
            className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2"
          >
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              {change.fieldName}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="line-through text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                {change.previousDisplayValue || '-'}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                {change.newDisplayValue || '-'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Entry detail modal
function EntryDetailModal({ entry }: { entry: AuditEntry }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <EyeIcon className="w-4 h-4" />
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg text-white', getIconBgColor(entry.status))}>
              {getActionIcon(entry.action)}
            </div>
            {actionLabels[entry.action]}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Alvo
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {entry.targetLabel}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Categoria
                </label>
                <Badge className={cn('mt-1', getCategoryBadgeColor(entry.category))}>
                  {categoryLabels[entry.category]}
                </Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usuário
                </label>
                <p className="text-gray-900 dark:text-white">
                  {entry.userName}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Data/Hora
                </label>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Descrição
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {entry.description}
              </p>
            </div>

            {/* Details */}
            {entry.details && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Detalhes Adicionais
                </label>
                <p className="text-gray-600 dark:text-gray-400">
                  {entry.details}
                </p>
              </div>
            )}

            {/* Changes */}
            {entry.changes && entry.changes.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Campos Alterados
                </label>
                <div className="mt-2 space-y-2">
                  {entry.changes.map((change, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                    >
                      <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {change.fieldName}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block mb-1">Valor Anterior:</span>
                          <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded block">
                            {change.previousDisplayValue || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block mb-1">Novo Valor:</span>
                          <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded block">
                            {change.newDisplayValue || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {entry.evidence && entry.evidence.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Evidências
                </label>
                <div className="mt-2 space-y-2">
                  {entry.evidence.map((evidence) => (
                    <div
                      key={evidence.id}
                      className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2"
                    >
                      <Badge variant="outline" className="text-xs">
                        {evidence.type}
                      </Badge>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {evidence.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <span className="uppercase">ID do Registro:</span>
                  <span className="ml-2 font-mono">{entry.id}</span>
                </div>
                <div>
                  <span className="uppercase">ID do Alvo:</span>
                  <span className="ml-2 font-mono">{entry.targetId}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default function HistoryPage() {
  const { caseId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Get audit entries from the store
  const allEntries = useAuditStore((state) => state.entries)

  // Filter entries for this case
  const caseEntries = useMemo(() => {
    return allEntries
      .filter((entry) => entry.caseId === caseId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [allEntries, caseId])

  // Extract available sections from draft-related entries
  const availableSections = useMemo(() => {
    const sections = new Map<string, string>()
    caseEntries.forEach((entry) => {
      if (entry.category === 'draft' && entry.metadata?.sectionId && entry.metadata?.sectionTitle) {
        sections.set(
          entry.metadata.sectionId as string,
          entry.metadata.sectionTitle as string
        )
      }
    })
    return Array.from(sections.entries()).map(([id, title]) => ({ id, title }))
  }, [caseEntries])

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

      // Section filter (only applies to draft category entries)
      const matchesSection =
        filterSection === 'all' ||
        (entry.category === 'draft' && entry.metadata?.sectionId === filterSection)

      // Date range filter
      const entryDate = new Date(entry.timestamp)
      const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59')

      return matchesSearch && matchesStatus && matchesCategory && matchesSection && matchesDateFrom && matchesDateTo
    })
  }, [caseEntries, searchTerm, filterStatus, filterCategory, filterSection, dateFrom, dateTo])

  // Export function - now using the enhanced export utility
  const handleExport = () => {
    exportAuditToCSV(filteredLog, {
      filename: `auditlog-${caseId}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`,
      includeChanges: true,
      includeEvidence: true,
      includeMetadata: true,
    })
  }

  // Export as JSON
  const handleExportJSON = () => {
    exportAuditToJSON(filteredLog, {
      filename: `auditlog-${caseId}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`,
    })
  }

  // Export summary report
  const handleExportSummary = () => {
    exportAuditSummary(filteredLog, {
      filename: `audit-summary-${caseId}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`,
    })
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
                Trilha de auditoria com evidências •{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {caseEntries.length} registros
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={filteredLog.length === 0}
              className="gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={handleExportJSON}
              disabled={filteredLog.length === 0}
              variant="outline"
              className="gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              JSON
            </Button>
            <Button
              onClick={handleExportSummary}
              disabled={filteredLog.length === 0}
              variant="outline"
              className="gap-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Resumo
            </Button>
          </div>
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
                <SelectItem value="relationship">Relacionamentos</SelectItem>
                <SelectItem value="draft">Minutas</SelectItem>
                <SelectItem value="field">Campos</SelectItem>
                <SelectItem value="case">Caso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              <FunnelIcon className="w-4 h-4 inline mr-2" />
              Seção
            </label>
            <Select
              value={filterSection}
              onValueChange={setFilterSection}
              disabled={availableSections.length === 0}
            >
              <SelectTrigger className="focus:ring-purple-500 dark:focus:ring-purple-400">
                <SelectValue placeholder="Selecione uma seção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as seções</SelectItem>
                {availableSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
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
              setFilterSection('all')
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
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 pr-2">
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
                  ? 'As alterações neste caso serão registradas automaticamente'
                  : 'Tente ajustar seus critérios de pesquisa'}
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
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shadow-md text-white',
                        getIconBgColor(entry.status)
                      )}
                    >
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={cn(
                              'text-sm font-bold',
                              getStatusTextColor(entry.status)
                            )}
                          >
                            {actionLabels[entry.action]}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getCategoryBadgeColor(entry.category))}
                          >
                            {categoryLabels[entry.category]}
                          </Badge>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {entry.targetLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn('flex-shrink-0', getStatusBadgeColor(entry.status))}
                        >
                          {entry.status === 'success' && 'Sucesso'}
                          {entry.status === 'pending' && 'Pendente'}
                          {entry.status === 'failed' && 'Falha'}
                          {entry.status === 'rejected' && 'Rejeitado'}
                        </Badge>
                        <EntryDetailModal entry={entry} />
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">
                      {entry.description}
                    </p>

                    {entry.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 italic">
                        {entry.details}
                      </p>
                    )}

                    {/* Show changes preview */}
                    {entry.changes && entry.changes.length > 0 && (
                      <ChangesDetail changes={entry.changes} />
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-500 mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>{entry.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span title={format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}>
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
