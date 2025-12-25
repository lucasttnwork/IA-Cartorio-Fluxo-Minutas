/**
 * Draft Operations Service
 *
 * Handles applying chat operations to draft canonical data and regenerating sections.
 * This service acts as the bridge between chat commands and the actual draft updates.
 */

import { supabase } from '../lib/supabase'
import type { ChatOperation, CanonicalData, PaymentSchedule, Draft, DraftTemplate } from '../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ApplyOperationParams {
  caseId: string
  draftId: string
  operation: ChatOperation
  userId?: string
}

export interface ApplyOperationResult {
  success: boolean
  updatedCanonicalData?: CanonicalData
  updatedDraft?: Draft
  error?: string
}

// -----------------------------------------------------------------------------
// Operation Application Functions
// -----------------------------------------------------------------------------

/**
 * Apply a chat operation to update the canonical data and draft
 */
export async function applyOperation(
  params: ApplyOperationParams
): Promise<ApplyOperationResult> {
  const { caseId, draftId, operation, userId } = params

  try {
    // Get current case canonical data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseData, error: caseError } = await (supabase as any)
      .from('cases')
      .select('canonical_data')
      .eq('id', caseId)
      .single()

    if (caseError) {
      return {
        success: false,
        error: `Erro ao buscar dados do caso: ${caseError.message}`,
      }
    }

    let canonicalData: CanonicalData = caseData.canonical_data || {
      people: [],
      properties: [],
      edges: [],
      deal: null,
    }

    // Apply operation based on type
    switch (operation.type) {
      case 'update_field':
        canonicalData = await applyFieldUpdate(canonicalData, operation)
        break

      case 'regenerate_section':
        // Regenerate section with canonical data
        // This will trigger section regeneration in regenerateDraftSections
        break

      case 'add_clause':
        // Handle adding a clause - this doesn't modify canonical data
        // The clause will be added directly to the draft
        break

      case 'remove_clause':
        // Handle removing a clause
        break

      case 'mark_pending':
        // Handle marking a field as pending - this adds a pending item to the draft
        break

      case 'resolve_pending':
        // Handle resolving a pending item
        break

      default:
        return {
          success: false,
          error: `Tipo de operação não suportado: ${operation.type}`,
        }
    }

    // Update canonical data in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('cases')
      .update({ canonical_data: canonicalData, updated_at: new Date().toISOString() })
      .eq('id', caseId)

    if (updateError) {
      return {
        success: false,
        error: `Erro ao atualizar dados canônicos: ${updateError.message}`,
      }
    }

    // Log the operation in the operations_log table
    if (userId) {
      await logOperation({
        caseId,
        draftId,
        userId,
        operation,
      })
    }

    // Regenerate affected draft sections
    const updatedDraft = await regenerateDraftSections(draftId, operation, canonicalData)

    return {
      success: true,
      updatedCanonicalData: canonicalData,
      updatedDraft,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao aplicar operação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Apply field update operation to canonical data
 */
async function applyFieldUpdate(
  canonicalData: CanonicalData,
  operation: ChatOperation
): Promise<CanonicalData> {
  if (!operation.target_path) {
    throw new Error('Campo target_path é obrigatório para update_field')
  }

  // Parse the path (e.g., "deal.paymentSchedule")
  const pathParts = operation.target_path.split('.')

  // Clone the canonical data to avoid mutation
  const updated = JSON.parse(JSON.stringify(canonicalData)) as CanonicalData

  // Navigate to the target field and update it
  let current: any = updated

  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i]

    if (!current[part]) {
      current[part] = {}
    }

    current = current[part]
  }

  const finalKey = pathParts[pathParts.length - 1]

  // Store old value in operation for audit trail
  operation.old_value = current[finalKey]

  // Apply new value
  current[finalKey] = operation.new_value

  return updated
}

/**
 * Regenerate draft sections affected by the operation
 */
async function regenerateDraftSections(
  draftId: string,
  operation: ChatOperation,
  canonicalData: CanonicalData
): Promise<Draft | undefined> {
  // Get current draft
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: draft, error } = await (supabase as any)
    .from('drafts')
    .select('*')
    .eq('id', draftId)
    .single()

  if (error) {
    console.error('Error fetching draft:', error)
    return undefined
  }

  // Handle add_clause operation
  if (operation.type === 'add_clause' && operation.new_value) {
    return await addClauseToDraft(draft, operation)
  }

  // Handle remove_clause operation
  if (operation.type === 'remove_clause') {
    return await removeClauseFromDraft(draft, operation)
  }

  // Handle mark_pending operation
  if (operation.type === 'mark_pending') {
    return await markFieldAsPending(draft, operation)
  }

  // Handle resolve_pending operation
  if (operation.type === 'resolve_pending') {
    return await resolvePendingItem(draft, operation)
  }

  // Determine which section to regenerate based on operation
  let sectionToRegenerate = operation.section_id

  if (!sectionToRegenerate && operation.target_path) {
    // Map target_path to section
    if (operation.target_path.includes('paymentSchedule') || operation.target_path.includes('price')) {
      sectionToRegenerate = 'price'
    }
  }

  if (sectionToRegenerate && draft.content?.sections) {
    // Find and regenerate the section
    const sectionIndex = draft.content.sections.findIndex(
      (s: any) => s.type === sectionToRegenerate || s.id === sectionToRegenerate
    )

    if (sectionIndex >= 0) {
      // Generate new content for the section based on canonical data
      const newContent = await generateSectionContent(sectionToRegenerate, canonicalData)

      draft.content.sections[sectionIndex].content = newContent

      // Update draft in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedDraft } = await (supabase as any)
        .from('drafts')
        .update({
          content: draft.content,
          html_content: generateHtmlFromContent(draft.content),
        })
        .eq('id', draftId)
        .select()
        .single()

      return updatedDraft
    }
  }

  return draft
}

/**
 * Add a new clause to the draft
 */
async function addClauseToDraft(
  draft: Draft,
  operation: ChatOperation
): Promise<Draft | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clauseData = operation.new_value as any

  if (!clauseData || !clauseData.content) {
    console.error('Invalid clause data:', clauseData)
    return draft
  }

  // Initialize content structure if needed
  if (!draft.content) {
    draft.content = { sections: [] }
  }

  if (!draft.content.sections) {
    draft.content.sections = []
  }

  // Find the "clauses" section or create it
  let clausesSection = draft.content.sections.find(
    (s: any) => s.type === 'clauses'
  )

  if (!clausesSection) {
    // Create clauses section if it doesn't exist
    clausesSection = {
      id: 'clauses',
      title: 'Cláusulas Especiais',
      type: 'clauses',
      content: '',
      order: draft.content.sections.length
    }
    draft.content.sections.push(clausesSection)
  }

  // Generate clause HTML
  const clauseTitle = clauseData.title || 'Nova Cláusula'
  const clauseContent = clauseData.content

  // Count existing clauses to determine the number
  const existingClauses = (clausesSection.content.match(/<h4>/g) || []).length
  const clauseNumber = existingClauses + 1

  const newClauseHtml = `
<h4>Cláusula ${clauseNumber} - ${clauseTitle}</h4>
<p>${clauseContent}</p>
`

  // Append the new clause to the section
  if (clausesSection.content) {
    clausesSection.content += '\n' + newClauseHtml
  } else {
    clausesSection.content = newClauseHtml
  }

  // Update draft in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedDraft } = await (supabase as any)
    .from('drafts')
    .update({
      content: draft.content,
      html_content: generateHtmlFromContent(draft.content),
      updated_at: new Date().toISOString()
    })
    .eq('id', draft.id)
    .select()
    .single()

  return updatedDraft || draft
}

/**
 * Remove a clause from the draft
 */
async function removeClauseFromDraft(
  draft: Draft,
  operation: ChatOperation
): Promise<Draft | undefined> {
  // The clause identifier should be in operation.target_path (e.g., "clause-3" or "Cláusula 3")
  // or in operation.old_value (the clause title or number)
  const clauseIdentifier = operation.target_path || operation.old_value

  if (!clauseIdentifier) {
    console.error('No clause identifier provided for removal')
    return draft
  }

  // Initialize content structure if needed
  if (!draft.content || !draft.content.sections) {
    console.error('Draft has no content sections')
    return draft
  }

  // Find the "clauses" section
  const clausesSection = draft.content.sections.find(
    (s: any) => s.type === 'clauses'
  )

  if (!clausesSection || !clausesSection.content) {
    console.error('No clauses section found in draft')
    return draft
  }

  // Parse the clause identifier to extract the clause number or title
  let clauseToRemove: number | string | null = null

  // Try to extract clause number from various formats
  const numericMatch = String(clauseIdentifier).match(/\d+/)
  if (numericMatch) {
    clauseToRemove = parseInt(numericMatch[0], 10)
  } else {
    // It might be a clause title
    clauseToRemove = String(clauseIdentifier)
  }

  if (clauseToRemove === null) {
    console.error('Could not parse clause identifier:', clauseIdentifier)
    return draft
  }

  // Remove the clause from the content
  let updatedContent = clausesSection.content

  if (typeof clauseToRemove === 'number') {
    // Remove by clause number
    // Pattern: <h4>Cláusula {number} - {title}</h4>\n<p>{content}</p>
    const clausePattern = new RegExp(
      `<h4>Cláusula\\s+${clauseToRemove}\\s*-[^<]*</h4>\\s*<p>[^<]*</p>`,
      'gi'
    )
    updatedContent = updatedContent.replace(clausePattern, '')
  } else {
    // Remove by clause title (partial match)
    const titlePattern = new RegExp(
      `<h4>Cláusula\\s+\\d+\\s*-\\s*[^<]*${clauseToRemove}[^<]*</h4>\\s*<p>[^<]*</p>`,
      'gi'
    )
    updatedContent = updatedContent.replace(titlePattern, '')
  }

  // Clean up extra whitespace and newlines
  updatedContent = updatedContent.trim()

  // Renumber remaining clauses
  let clauseNumber = 1
  updatedContent = updatedContent.replace(
    /<h4>Cláusula\s+\d+\s*-\s*([^<]+)<\/h4>/gi,
    (match, title) => {
      return `<h4>Cláusula ${clauseNumber++} - ${title}</h4>`
    }
  )

  // Update the section content
  clausesSection.content = updatedContent

  // Update draft in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedDraft } = await (supabase as any)
    .from('drafts')
    .update({
      content: draft.content,
      html_content: generateHtmlFromContent(draft.content),
      updated_at: new Date().toISOString()
    })
    .eq('id', draft.id)
    .select()
    .single()

  return updatedDraft || draft
}

/**
 * Generate section content based on canonical data
 * This regenerates a specific section using canonical data and AI-like formatting
 */
async function generateSectionContent(sectionType: string, canonicalData: CanonicalData): Promise<string> {
  switch (sectionType) {
    case 'header':
      return generateHeaderSection(canonicalData)

    case 'parties':
      return generatePartiesSection(canonicalData)

    case 'object':
      return generateObjectSection(canonicalData)

    case 'price':
      return generatePriceSection(canonicalData)

    case 'conditions':
      return generateConditionsSection(canonicalData)

    case 'clauses':
      return generateClausesSection(canonicalData)

    case 'closing':
      return generateClosingSection(canonicalData)

    default:
      return '<p>Conteúdo da seção a ser gerado</p>'
  }
}

/**
 * Generate header section
 */
function generateHeaderSection(canonicalData: CanonicalData): string {
  const dealType = canonicalData.deal?.type || 'CONTRATO'

  return `<h1 style="text-align: center; font-weight: bold; font-size: 1.25rem; margin-bottom: 1rem;">
${dealType.toUpperCase()}
</h1>`
}

/**
 * Generate parties qualification section
 */
function generatePartiesSection(canonicalData: CanonicalData): string {
  if (!canonicalData.people || canonicalData.people.length === 0) {
    return '<p>Qualificação das partes a ser definida.</p>'
  }

  let html = '<h3>Qualificação das Partes</h3>\n'

  canonicalData.people.forEach((person, index) => {
    const role = determinePersonRole(person.id, canonicalData.edges)
    const personPath = `people[${index}]`

    html += `<p><strong>${role}:</strong> `
    html += wrapEditableField(person.full_name || 'Nome não informado', `${personPath}.full_name`, 'text')

    if (person.cpf) {
      html += `, CPF nº `
      html += wrapEditableField(formatCPF(person.cpf), `${personPath}.cpf`, 'cpf')
    }

    if (person.rg && person.rg_issuer) {
      html += `, RG nº `
      html += wrapEditableField(person.rg, `${personPath}.rg`, 'text')
      html += ` (`
      html += wrapEditableField(person.rg_issuer, `${personPath}.rg_issuer`, 'text')
      html += `)`
    }

    if (person.nationality) {
      html += `, nacionalidade `
      html += wrapEditableField(person.nationality, `${personPath}.nationality`, 'text')
    }

    if (person.marital_status) {
      html += `, estado civil `
      html += wrapEditableField(person.marital_status.toLowerCase(), `${personPath}.marital_status`, 'text')
    }

    if (person.profession) {
      html += `, profissão `
      html += wrapEditableField(person.profession.toLowerCase(), `${personPath}.profession`, 'text')
    }

    if (person.address) {
      const addr = person.address
      html += `, residente e domiciliado(a) em `
      html += wrapEditableField(addr.street, `${personPath}.address.street`, 'text')
      html += `, `
      html += wrapEditableField(addr.number, `${personPath}.address.number`, 'text')
      if (addr.complement) {
        html += `, `
        html += wrapEditableField(addr.complement, `${personPath}.address.complement`, 'text')
      }
      html += `, `
      html += wrapEditableField(addr.neighborhood, `${personPath}.address.neighborhood`, 'text')
      html += `, `
      html += wrapEditableField(addr.city, `${personPath}.address.city`, 'text')
      html += `/`
      html += wrapEditableField(addr.state, `${personPath}.address.state`, 'text')
      html += `, CEP `
      html += wrapEditableField(formatCEP(addr.zip), `${personPath}.address.zip`, 'text')
    }

    html += '.</p>\n'
  })

  return html
}

/**
 * Generate object section
 */
function generateObjectSection(canonicalData: CanonicalData): string {
  if (!canonicalData.properties || canonicalData.properties.length === 0) {
    return '<p>Objeto do contrato a ser definido.</p>'
  }

  let html = '<h3>Do Objeto</h3>\n'

  const property = canonicalData.properties[0] // For simplicity, use first property

  html += '<p>O objeto do presente contrato é '

  if (property.property_type) {
    html += `${property.property_type.toLowerCase()} `
  } else {
    html += 'o imóvel '
  }

  if (property.address) {
    const addr = property.address
    html += `localizado em ${addr.street}, ${addr.number}`
    if (addr.complement) html += `, ${addr.complement}`
    html += `, ${addr.neighborhood}, ${addr.city}/${addr.state}, CEP ${formatCEP(addr.zip)}`
  }

  if (property.registry_number && property.registry_office) {
    html += `, registrado no ${property.registry_office} sob matrícula nº ${property.registry_number}`
  }

  if (property.area && property.area_unit) {
    html += `, com área de ${property.area.toLocaleString('pt-BR')} ${property.area_unit}`
  }

  if (property.iptu_number) {
    html += `, IPTU nº ${property.iptu_number}`
  }

  html += '.</p>\n'

  if (property.description) {
    html += `<p>${property.description}</p>\n`
  }

  return html
}

/**
 * Generate price and payment section
 */
function generatePriceSection(canonicalData: CanonicalData): string {
  if (!canonicalData.deal) {
    return '<p>Condições de pagamento a ser definidas.</p>'
  }

  if (canonicalData.deal.paymentSchedule) {
    return formatPaymentScheduleSection(
      canonicalData.deal.paymentSchedule,
      canonicalData.deal.price
    )
  }

  let html = '<h3>Preço e Forma de Pagamento</h3>\n'

  if (canonicalData.deal.price) {
    const formattedPrice = canonicalData.deal.price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    html += `<p><strong>Valor Total:</strong> R$ `
    html += wrapEditableField(formattedPrice, 'deal.price', 'currency')
    html += `</p>\n`
  }

  return html
}

/**
 * Generate conditions section
 */
function generateConditionsSection(canonicalData: CanonicalData): string {
  let html = '<h3>Condições Gerais</h3>\n'

  if (canonicalData.deal?.conditions && canonicalData.deal.conditions.length > 0) {
    html += '<ul>\n'
    canonicalData.deal.conditions.forEach(condition => {
      html += `<li>${condition}</li>\n`
    })
    html += '</ul>\n'
  } else {
    html += '<p>As partes se obrigam a cumprir todas as disposições legais aplicáveis ao presente contrato.</p>\n'
  }

  return html
}

/**
 * Generate clauses section
 */
function generateClausesSection(canonicalData: CanonicalData): string {
  let html = '<h3>Cláusulas Especiais</h3>\n'
  html += '<p>Não há cláusulas especiais neste momento.</p>\n'
  return html
}

/**
 * Generate closing section
 */
function generateClosingSection(canonicalData: CanonicalData): string {
  let html = '<h3>Encerramento</h3>\n'
  html += '<p>E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma.</p>\n'

  const city = canonicalData.people[0]?.address?.city || '[CIDADE]'
  const state = canonicalData.people[0]?.address?.state || '[UF]'
  const date = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  html += `<p style="text-align: right;">${city}/${state}, ${date}</p>\n`

  // Signature lines
  html += '\n<div style="margin-top: 3rem;">\n'
  canonicalData.people.forEach(person => {
    html += `<p style="margin-top: 2rem; border-top: 1px solid #000; width: 50%; margin-left: auto; margin-right: auto; text-align: center; padding-top: 0.5rem;">
${person.full_name || 'Nome não informado'}
</p>\n`
  })
  html += '</div>\n'

  return html
}

/**
 * Helper: Determine person's role in the deal
 */
function determinePersonRole(personId: string, edges: any[]): string {
  if (!edges || edges.length === 0) return 'PARTE'

  const edge = edges.find(e =>
    (e.source_type === 'person' && e.source_id === personId) ||
    (e.target_type === 'person' && e.target_id === personId)
  )

  if (!edge) return 'PARTE'

  const relationship = edge.relationship?.toLowerCase() || ''

  if (relationship.includes('seller') || relationship.includes('vendedor')) {
    return 'VENDEDOR'
  }
  if (relationship.includes('buyer') || relationship.includes('comprador')) {
    return 'COMPRADOR'
  }
  if (relationship.includes('lessor') || relationship.includes('locador')) {
    return 'LOCADOR'
  }
  if (relationship.includes('lessee') || relationship.includes('locatário')) {
    return 'LOCATÁRIO'
  }

  return 'PARTE'
}

/**
 * Helper: Format CPF
 */
function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Helper: Format CEP
 */
function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) return cep
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Helper: Wrap a field value in an inline-editable span
 */
function wrapEditableField(value: string, fieldPath: string, fieldType: string = 'text'): string {
  return `<span data-field-path="${fieldPath}" data-field-type="${fieldType}" class="inline-edit-field" style="cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;">${value}</span>`
}

/**
 * Format payment schedule into section text
 */
function formatPaymentScheduleSection(schedule: PaymentSchedule, totalPrice?: number): string {
  if (!schedule.entries || schedule.entries.length === 0) {
    return '<p>Condições de pagamento a definir.</p>'
  }

  let html = '<h3>Preço e Forma de Pagamento</h3>\n'

  if (totalPrice) {
    html += `<p><strong>Valor Total:</strong> R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>\n`
  }

  html += '<p><strong>Condições de Pagamento:</strong></p>\n<ul>\n'

  schedule.entries.forEach((entry) => {
    let entryText = `<li>${entry.description}`

    if (entry.percentage !== undefined) {
      entryText += ` - ${entry.percentage}%`

      if (totalPrice) {
        const amount = (totalPrice * entry.percentage) / 100
        entryText += ` (R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
      }
    }

    if (entry.amount !== undefined) {
      entryText += ` - R$ ${entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    if (entry.due_date) {
      const date = new Date(entry.due_date)
      entryText += ` - Vencimento: ${date.toLocaleDateString('pt-BR')}`
    }

    entryText += '</li>'
    html += entryText + '\n'
  })

  html += '</ul>'

  return html
}

/**
 * Generate HTML from draft content
 */
function generateHtmlFromContent(content: any): string {
  if (!content.sections) {
    return ''
  }

  return content.sections
    .map((section: any) => {
      return `<section id="${section.id}" data-section-type="${section.type}">
  ${section.content}
</section>`
    })
    .join('\n\n')
}

/**
 * Mark a field as pending in the draft
 */
async function markFieldAsPending(
  draft: Draft,
  operation: ChatOperation
): Promise<Draft | undefined> {
  if (!operation.target_path) {
    console.error('target_path is required for mark_pending operation')
    return draft
  }

  // Initialize pending_items array if needed
  if (!draft.pending_items) {
    draft.pending_items = []
  }

  // Generate a unique ID for the pending item
  const pendingItemId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Determine section_id from target_path
  let sectionId = 'unknown'
  if (operation.target_path.includes('price') || operation.target_path.includes('paymentSchedule')) {
    sectionId = 'price'
  } else if (operation.target_path.includes('conditions')) {
    sectionId = 'conditions'
  } else if (operation.target_path.includes('parties')) {
    sectionId = 'parties'
  }

  // Create the pending item
  const pendingItem = {
    id: pendingItemId,
    section_id: sectionId,
    field_path: operation.target_path,
    reason: operation.reason || 'Pendente de confirmação',
    severity: 'warning' as const
  }

  // Add to pending items list
  draft.pending_items.push(pendingItem)

  // Update draft in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedDraft } = await (supabase as any)
    .from('drafts')
    .update({
      pending_items: draft.pending_items,
      updated_at: new Date().toISOString()
    })
    .eq('id', draft.id)
    .select()
    .single()

  return updatedDraft || draft
}

/**
 * Resolve a pending item in the draft
 * If operation includes new_value, also update the canonical data field
 */
async function resolvePendingItem(
  draft: Draft,
  operation: ChatOperation
): Promise<Draft | undefined> {
  if (!operation.target_path) {
    console.error('target_path is required for resolve_pending operation')
    return draft
  }

  // Initialize pending_items array if needed
  if (!draft.pending_items) {
    draft.pending_items = []
  }

  // Find and remove the pending item with matching field_path
  draft.pending_items = draft.pending_items.filter(
    item => item.field_path !== operation.target_path
  )

  // If new_value is provided, we also need to update the field value
  // This requires updating the case's canonical_data
  if (operation.new_value !== undefined && draft.case_id) {
    try {
      // Get current case canonical data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: caseData, error: caseError } = await (supabase as any)
        .from('cases')
        .select('canonical_data')
        .eq('id', draft.case_id)
        .single()

      if (!caseError && caseData) {
        let canonicalData = caseData.canonical_data || {}

        // Parse the path (e.g., "deal.price")
        const pathParts = operation.target_path.split('.')
        let current: any = canonicalData

        // Navigate to the target field and update it
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i]
          if (!current[part]) {
            current[part] = {}
          }
          current = current[part]
        }

        const finalKey = pathParts[pathParts.length - 1]
        current[finalKey] = operation.new_value

        // Update canonical data in the database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('cases')
          .update({
            canonical_data: canonicalData,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.case_id)

        // Regenerate affected sections
        // For price changes, regenerate the price section
        if (operation.target_path.includes('price') || operation.target_path.includes('paymentSchedule')) {
          const newContent = await generateSectionContent('price', canonicalData)

          if (draft.content?.sections) {
            const sectionIndex = draft.content.sections.findIndex(
              (s: any) => s.type === 'price' || s.id === 'price'
            )

            if (sectionIndex >= 0) {
              draft.content.sections[sectionIndex].content = newContent
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating canonical data during resolve_pending:', error)
      // Continue with removing the pending item even if update fails
    }
  }

  // Update draft in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedDraft } = await (supabase as any)
    .from('drafts')
    .update({
      pending_items: draft.pending_items,
      content: draft.content,
      html_content: draft.content ? generateHtmlFromContent(draft.content) : draft.html_content,
      updated_at: new Date().toISOString()
    })
    .eq('id', draft.id)
    .select()
    .single()

  return updatedDraft || draft
}

/**
 * Log operation in the audit trail
 */
async function logOperation(params: {
  caseId: string
  draftId: string
  userId: string
  operation: ChatOperation
}): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('operations_log').insert({
      case_id: params.caseId,
      draft_id: params.draftId,
      user_id: params.userId,
      operation_type: params.operation.type,
      target_path: params.operation.target_path || '',
      old_value: params.operation.old_value,
      new_value: params.operation.new_value,
      reason: params.operation.reason || '',
    })
  } catch (error) {
    console.error('Error logging operation:', error)
    // Don't fail the operation if logging fails
  }
}

// -----------------------------------------------------------------------------
// Draft Template Functions
// -----------------------------------------------------------------------------

/**
 * Create a new draft from a template
 */
export interface CreateDraftFromTemplateParams {
  caseId: string
  template: DraftTemplate
  userId?: string
}

export interface CreateDraftFromTemplateResult {
  success: boolean
  draft?: Draft
  error?: string
}

export async function createDraftFromTemplate(
  params: CreateDraftFromTemplateParams
): Promise<CreateDraftFromTemplateResult> {
  const { caseId, template, userId } = params

  try {
    // Check if a draft already exists for this case
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingDrafts, error: checkError } = await (supabase as any)
      .from('drafts')
      .select('id, version')
      .eq('case_id', caseId)
      .order('version', { ascending: false })
      .limit(1)

    if (checkError) {
      return {
        success: false,
        error: `Erro ao verificar minutas existentes: ${checkError.message}`,
      }
    }

    // Determine version number
    const version = existingDrafts && existingDrafts.length > 0
      ? existingDrafts[0].version + 1
      : 1

    // Create draft content from template
    const draftContent = {
      sections: template.sections.map(section => ({
        ...section,
        // Ensure sections are properly ordered
        order: section.order,
      })),
    }

    // Generate HTML content from sections
    const htmlContent = generateHtmlFromContent(draftContent)

    // Create the draft in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newDraft, error: createError } = await (supabase as any)
      .from('drafts')
      .insert({
        case_id: caseId,
        version,
        content: draftContent,
        html_content: htmlContent,
        pending_items: [],
        status: 'generated',
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        error: `Erro ao criar minuta: ${createError.message}`,
      }
    }

    // Log the template creation if userId is provided
    if (userId && newDraft) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('operations_log').insert({
          case_id: caseId,
          draft_id: newDraft.id,
          user_id: userId,
          operation_type: 'create_from_template',
          target_path: '',
          old_value: null,
          new_value: { template_id: template.id, template_name: template.name },
          reason: `Minuta criada a partir do modelo: ${template.name}`,
        })
      } catch (logError) {
        console.error('Error logging template creation:', logError)
        // Don't fail the operation if logging fails
      }
    }

    return {
      success: true,
      draft: newDraft,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao criar minuta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

// -----------------------------------------------------------------------------
// Draft Version Functions
// -----------------------------------------------------------------------------

/**
 * Get all versions of drafts for a case
 */
export interface GetDraftVersionsParams {
  caseId: string
}

export interface GetDraftVersionsResult {
  success: boolean
  versions?: Draft[]
  error?: string
}

export async function getDraftVersions(
  params: GetDraftVersionsParams
): Promise<GetDraftVersionsResult> {
  const { caseId } = params

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: versions, error } = await (supabase as any)
      .from('drafts')
      .select('*')
      .eq('case_id', caseId)
      .order('version', { ascending: false })

    if (error) {
      return {
        success: false,
        error: `Erro ao buscar versões: ${error.message}`,
      }
    }

    return {
      success: true,
      versions: versions || [],
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar versões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Get a specific draft version by ID
 */
export interface GetDraftVersionParams {
  draftId: string
}

export interface GetDraftVersionResult {
  success: boolean
  draft?: Draft
  error?: string
}

export async function getDraftVersion(
  params: GetDraftVersionParams
): Promise<GetDraftVersionResult> {
  const { draftId } = params

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase as any)
      .from('drafts')
      .select('*')
      .eq('id', draftId)
      .single()

    if (error) {
      return {
        success: false,
        error: `Erro ao buscar versão: ${error.message}`,
      }
    }

    return {
      success: true,
      draft,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao buscar versão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Create a new version from an existing draft
 * This creates a copy of the current draft with an incremented version number
 */
export interface CreateNewVersionParams {
  caseId: string
  baseDraftId?: string // If not provided, uses the latest version
  userId?: string
}

export interface CreateNewVersionResult {
  success: boolean
  draft?: Draft
  error?: string
}

export async function createNewVersion(
  params: CreateNewVersionParams
): Promise<CreateNewVersionResult> {
  const { caseId, baseDraftId, userId } = params

  try {
    // Get the base draft (either specified or latest)
    let baseDraft: Draft

    if (baseDraftId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('drafts')
        .select('*')
        .eq('id', baseDraftId)
        .single()

      if (error) {
        return {
          success: false,
          error: `Erro ao buscar minuta base: ${error.message}`,
        }
      }

      baseDraft = data
    } else {
      // Get latest version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('drafts')
        .select('*')
        .eq('case_id', caseId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return {
          success: false,
          error: `Erro ao buscar última versão: ${error.message}`,
        }
      }

      baseDraft = data
    }

    // Get the highest version number for this case
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingDrafts, error: checkError } = await (supabase as any)
      .from('drafts')
      .select('version')
      .eq('case_id', caseId)
      .order('version', { ascending: false })
      .limit(1)

    if (checkError) {
      return {
        success: false,
        error: `Erro ao verificar versões existentes: ${checkError.message}`,
      }
    }

    const newVersion = existingDrafts && existingDrafts.length > 0
      ? existingDrafts[0].version + 1
      : 1

    // Create new draft version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newDraft, error: createError } = await (supabase as any)
      .from('drafts')
      .insert({
        case_id: caseId,
        version: newVersion,
        content: baseDraft.content,
        html_content: baseDraft.html_content,
        pending_items: baseDraft.pending_items || [],
        status: 'generated',
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        error: `Erro ao criar nova versão: ${createError.message}`,
      }
    }

    // Log the version creation if userId is provided
    if (userId && newDraft) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('operations_log').insert({
          case_id: caseId,
          draft_id: newDraft.id,
          user_id: userId,
          operation_type: 'create_new_version',
          target_path: '',
          old_value: { base_version: baseDraft.version },
          new_value: { new_version: newVersion },
          reason: `Nova versão criada a partir da versão ${baseDraft.version}`,
        })
      } catch (logError) {
        console.error('Error logging version creation:', logError)
        // Don't fail the operation if logging fails
      }
    }

    return {
      success: true,
      draft: newDraft,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao criar nova versão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

// -----------------------------------------------------------------------------
// Service Export
// -----------------------------------------------------------------------------

export const draftOperationsService = {
  applyOperation,
  createDraftFromTemplate,
  getDraftVersions,
  getDraftVersion,
  createNewVersion,
}

export default draftOperationsService
