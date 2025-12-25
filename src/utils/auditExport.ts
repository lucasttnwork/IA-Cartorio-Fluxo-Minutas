import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AuditEntry, AuditActionType, AuditCategory } from '../types/audit'

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

// Status labels
const statusLabels: Record<string, string> = {
  success: 'Sucesso',
  pending: 'Pendente',
  failed: 'Falha',
  rejected: 'Rejeitado',
}

/**
 * Escape CSV cell value to handle special characters
 */
function escapeCsvCell(value: string | null | undefined): string {
  if (value == null) return ''

  const stringValue = String(value)

  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Format field changes for CSV export
 */
function formatFieldChanges(entry: AuditEntry): string {
  if (!entry.changes || entry.changes.length === 0) {
    return ''
  }

  return entry.changes
    .map((change) => {
      const prev = change.previousDisplayValue || change.previousValue || '-'
      const next = change.newDisplayValue || change.newValue || '-'
      return `${change.fieldName}: ${prev} → ${next}`
    })
    .join('; ')
}

/**
 * Format evidence for CSV export
 */
function formatEvidence(entry: AuditEntry): string {
  if (!entry.evidence || entry.evidence.length === 0) {
    return ''
  }

  return entry.evidence
    .map((evidence) => `${evidence.type}: ${evidence.label}`)
    .join('; ')
}

/**
 * Export audit entries to CSV format
 */
export function exportAuditToCSV(
  entries: AuditEntry[],
  options: {
    filename?: string
    includeChanges?: boolean
    includeEvidence?: boolean
    includeMetadata?: boolean
  } = {}
): void {
  const {
    filename = `auditlog-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`,
    includeChanges = true,
    includeEvidence = true,
    includeMetadata = false,
  } = options

  // Build header row
  const headers = [
    'Data/Hora',
    'Usuário',
    'Função',
    'Ação',
    'Categoria',
    'Tipo do Alvo',
    'Alvo',
    'Descrição',
    'Detalhes',
    'Status',
  ]

  if (includeChanges) {
    headers.push('Alterações')
  }

  if (includeEvidence) {
    headers.push('Evidências')
  }

  if (includeMetadata) {
    headers.push('ID do Registro', 'ID do Alvo', 'ID do Caso')
  }

  // Build data rows
  const rows = entries.map((entry) => {
    const row = [
      format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      entry.userName,
      entry.userRole || '-',
      actionLabels[entry.action] || entry.action,
      categoryLabels[entry.category] || entry.category,
      entry.targetType,
      entry.targetLabel,
      entry.description,
      entry.details || '-',
      statusLabels[entry.status] || entry.status,
    ]

    if (includeChanges) {
      row.push(formatFieldChanges(entry))
    }

    if (includeEvidence) {
      row.push(formatEvidence(entry))
    }

    if (includeMetadata) {
      row.push(entry.id, entry.targetId, entry.caseId)
    }

    return row
  })

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')

  // Create blob with UTF-8 BOM for proper Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })

  // Trigger download
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  // Cleanup
  window.URL.revokeObjectURL(url)
}

/**
 * Export audit entries to JSON format (alternative export)
 */
export function exportAuditToJSON(
  entries: AuditEntry[],
  options: {
    filename?: string
    pretty?: boolean
  } = {}
): void {
  const {
    filename = `auditlog-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`,
    pretty = true,
  } = options

  const jsonContent = JSON.stringify(entries, null, pretty ? 2 : 0)

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Generate a summary report in text format
 */
export function exportAuditSummary(
  entries: AuditEntry[],
  options: {
    filename?: string
  } = {}
): void {
  const {
    filename = `audit-summary-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`,
  } = options

  // Calculate statistics
  const totalEntries = entries.length
  const uniqueUsers = new Set(entries.map((e) => e.userName)).size
  const categories = entries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const statuses = entries.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const dateRange = entries.length > 0
    ? `${format(new Date(entries[entries.length - 1].timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })} - ${format(new Date(entries[0].timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
    : 'N/A'

  // Build report
  const report = `
============================================
RELATÓRIO RESUMIDO DE AUDITORIA
============================================

Data do Relatório: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
Período Analisado: ${dateRange}

--------------------------------------------
ESTATÍSTICAS GERAIS
--------------------------------------------

Total de Registros: ${totalEntries}
Usuários Únicos: ${uniqueUsers}

--------------------------------------------
POR CATEGORIA
--------------------------------------------

${Object.entries(categories)
  .map(([category, count]) => `${categoryLabels[category as AuditCategory] || category}: ${count}`)
  .join('\n')}

--------------------------------------------
POR STATUS
--------------------------------------------

${Object.entries(statuses)
  .map(([status, count]) => `${statusLabels[status] || status}: ${count}`)
  .join('\n')}

--------------------------------------------
ENTRADAS RECENTES (últimas 10)
--------------------------------------------

${entries
  .slice(0, 10)
  .map((entry, i) => `
${i + 1}. ${actionLabels[entry.action]}
   Alvo: ${entry.targetLabel}
   Usuário: ${entry.userName}
   Data: ${format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
   Descrição: ${entry.description}
`)
  .join('\n')}

============================================
FIM DO RELATÓRIO
============================================
`.trim()

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
