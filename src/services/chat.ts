/**
 * Chat Service
 *
 * Handles chat operations for draft editing including:
 * - Creating chat sessions
 * - Sending and receiving messages
 * - Managing message history
 * - Applying operations to drafts
 */

import { supabase } from '../lib/supabase'
import type { ChatSession, ChatMessage, ChatOperation } from '../types'
import { parsePaymentTerms, formatPaymentSchedule, containsPaymentTerms } from '../utils/paymentTermsParser'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CreateChatSessionParams {
  caseId: string
  draftId: string
}

export interface SendMessageParams {
  sessionId: string
  content: string
  role?: 'user' | 'assistant' | 'system'
  operation?: ChatOperation
}

export interface GetMessagesParams {
  sessionId: string
  limit?: number
  offset?: number
}

// -----------------------------------------------------------------------------
// Chat Session Operations
// -----------------------------------------------------------------------------

/**
 * Create a new chat session for a draft
 */
export async function createChatSession(
  params: CreateChatSessionParams
): Promise<{ data: ChatSession | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chat_sessions')
    .insert({
      case_id: params.caseId,
      draft_id: params.draftId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating chat session:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get existing chat session for a draft
 */
export async function getChatSession(
  draftId: string
): Promise<{ data: ChatSession | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chat_sessions')
    .select('*')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error getting chat session:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get or create a chat session for a draft
 */
export async function getOrCreateChatSession(
  caseId: string,
  draftId: string
): Promise<{ data: ChatSession | null; error: Error | null }> {
  // Try to get existing session first
  const { data: existing, error: getError } = await getChatSession(draftId)

  if (getError) {
    return { data: null, error: getError }
  }

  if (existing) {
    return { data: existing, error: null }
  }

  // Create new session if none exists
  return createChatSession({ caseId, draftId })
}

// -----------------------------------------------------------------------------
// Message Operations
// -----------------------------------------------------------------------------

/**
 * Send a message in a chat session
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .insert({
      session_id: params.sessionId,
      role: params.role || 'user',
      content: params.content,
      operation: params.operation || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get messages for a chat session
 */
export async function getMessages(
  params: GetMessagesParams
): Promise<{ data: ChatMessage[] | null; error: Error | null }> {
  const limit = params.limit || 100
  const offset = params.offset || 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .select('*')
    .eq('session_id', params.sessionId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error getting messages:', error)
    return { data: null, error }
  }

  return { data: data || [], error: null }
}

/**
 * Subscribe to new messages in a chat session
 */
export function subscribeToChatMessages(
  sessionId: string,
  callback: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        callback(payload.new as ChatMessage)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Update the operation status of a chat message
 */
export async function updateMessageOperation(
  messageId: string,
  operation: ChatOperation
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .update({ operation })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    console.error('Error updating message operation:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// -----------------------------------------------------------------------------
// Clause Content Extraction Helpers
// -----------------------------------------------------------------------------

/**
 * Extract clause content from user message
 */
function extractClauseContent(message: string): string | null {
  // Pattern 1: "adicionar cláusula: [content]" or "incluir cláusula: [content]"
  const colonPattern = /(?:adicionar|incluir)\s+(?:uma\s+)?cláusula\s*[:\-]\s*(.+)/i
  const colonMatch = message.match(colonPattern)
  if (colonMatch && colonMatch[1]) {
    return colonMatch[1].trim()
  }

  // Pattern 2: "adicionar cláusula de [topic]"
  const dePattern = /(?:adicionar|incluir)\s+(?:uma\s+)?cláusula\s+de\s+(.+)/i
  const deMatch = message.match(dePattern)
  if (deMatch && deMatch[1]) {
    // Generate default content based on topic
    const topic = deMatch[1].trim()
    return generateDefaultClauseContent(topic)
  }

  // Pattern 3: "adicionar cláusula sobre [topic]"
  const sobrePattern = /(?:adicionar|incluir)\s+(?:uma\s+)?cláusula\s+sobre\s+(.+)/i
  const sobreMatch = message.match(sobrePattern)
  if (sobreMatch && sobreMatch[1]) {
    const topic = sobreMatch[1].trim()
    return generateDefaultClauseContent(topic)
  }

  // Pattern 4: quoted content "adicionar a cláusula '[content]'"
  const quotePattern = /(?:adicionar|incluir).*?['"]([^'"]+)['"]/i
  const quoteMatch = message.match(quotePattern)
  if (quoteMatch && quoteMatch[1]) {
    return quoteMatch[1].trim()
  }

  return null
}

/**
 * Extract clause identifier from user message for removal
 */
function extractClauseIdentifier(message: string): string | null {
  const lowerMessage = message.toLowerCase()

  // Pattern 1: "remover a cláusula 3" or "excluir cláusula 2"
  const numberPattern = /(?:remover|deletar|excluir)\s+(?:a\s+)?cláusula\s+(\d+)/i
  const numberMatch = message.match(numberPattern)
  if (numberMatch && numberMatch[1]) {
    return numberMatch[1] // Return just the number
  }

  // Pattern 2: "remover a cláusula de multa" or "excluir cláusula de garantia"
  const titleDePattern = /(?:remover|deletar|excluir)\s+(?:a\s+)?cláusula\s+de\s+([^.]+?)(?:\.|$)/i
  const titleDeMatch = message.match(titleDePattern)
  if (titleDeMatch && titleDeMatch[1]) {
    return titleDeMatch[1].trim()
  }

  // Pattern 3: "remover a cláusula sobre sigilo"
  const titleSobrePattern = /(?:remover|deletar|excluir)\s+(?:a\s+)?cláusula\s+sobre\s+([^.]+?)(?:\.|$)/i
  const titleSobreMatch = message.match(titleSobrePattern)
  if (titleSobreMatch && titleSobreMatch[1]) {
    return titleSobreMatch[1].trim()
  }

  // Pattern 4: quoted title "remover a cláusula 'Multa'"
  const quotePattern = /(?:remover|deletar|excluir).*?['"]([^'"]+)['"]/i
  const quoteMatch = message.match(quotePattern)
  if (quoteMatch && quoteMatch[1]) {
    return quoteMatch[1].trim()
  }

  // Pattern 5: Just "remover cláusula X" where X is any word
  const simplePattern = /(?:remover|deletar|excluir)\s+(?:a\s+)?cláusula\s+(\w+)/i
  const simpleMatch = message.match(simplePattern)
  if (simpleMatch && simpleMatch[1] && !['de', 'do', 'da', 'sobre'].includes(simpleMatch[1].toLowerCase())) {
    return simpleMatch[1].trim()
  }

  return null
}

/**
 * Extract clause title from user message
 */
function extractClauseTitle(message: string): string | null {
  // Pattern: "cláusula de [title]"
  const dePattern = /cláusula\s+de\s+([^:\-]+?)(?:[:\-]|$)/i
  const deMatch = message.match(dePattern)
  if (deMatch && deMatch[1]) {
    return capitalizeTitle(deMatch[1].trim())
  }

  // Pattern: "cláusula sobre [title]"
  const sobrePattern = /cláusula\s+sobre\s+([^:\-]+?)(?:[:\-]|$)/i
  const sobreMatch = message.match(sobrePattern)
  if (sobreMatch && sobreMatch[1]) {
    return capitalizeTitle(sobreMatch[1].trim())
  }

  return null
}

/**
 * Generate default clause content based on topic
 */
function generateDefaultClauseContent(topic: string): string {
  const lowerTopic = topic.toLowerCase()

  if (lowerTopic.includes('multa')) {
    return 'Em caso de inadimplemento, será aplicada multa de 2% (dois por cento) sobre o valor devido, além de juros de mora de 1% (um por cento) ao mês.'
  }

  if (lowerTopic.includes('prazo') || lowerTopic.includes('entrega')) {
    return 'O prazo para cumprimento das obrigações estabelecidas neste instrumento é de [DEFINIR PRAZO], contado a partir da assinatura do presente contrato.'
  }

  if (lowerTopic.includes('garantia')) {
    return 'As partes deverão fornecer garantias adequadas para o cumprimento das obrigações assumidas neste instrumento, conforme acordado entre as partes.'
  }

  if (lowerTopic.includes('rescisão') || lowerTopic.includes('resilição')) {
    return 'O presente contrato poderá ser rescindido mediante notificação prévia de [DEFINIR PRAZO], sem prejuízo das obrigações já assumidas pelas partes.'
  }

  if (lowerTopic.includes('confidencialidade') || lowerTopic.includes('sigilo')) {
    return 'As partes se comprometem a manter sigilo sobre todas as informações confidenciais trocadas durante a vigência deste contrato.'
  }

  // Generic clause content
  return `Cláusula referente a ${topic}.`
}

/**
 * Capitalize clause title
 */
function capitalizeTitle(title: string): string {
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Extract section ID from regenerate message
 */
function extractSectionId(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Map keywords to section IDs
  const sectionKeywords: Record<string, string[]> = {
    'header': ['cabeçalho', 'título', 'header'],
    'parties': ['partes', 'participantes', 'contratantes', 'qualificação'],
    'object': ['objeto', 'bem', 'imóvel', 'propriedade'],
    'price': ['preço', 'valor', 'pagamento', 'condições', 'financeiro'],
    'conditions': ['condições', 'obrigações', 'responsabilidades'],
    'clauses': ['cláusulas', 'disposições'],
    'closing': ['encerramento', 'assinatura', 'fecho', 'testemunhas']
  }

  // Check for each section's keywords
  for (const [sectionId, keywords] of Object.entries(sectionKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return sectionId
      }
    }
  }

  // Default to 'conditions' if no specific section is mentioned
  return 'conditions'
}

/**
 * Get display name for section ID
 */
function getSectionDisplayName(sectionId: string): string {
  const displayNames: Record<string, string> = {
    'header': 'Cabeçalho',
    'parties': 'Qualificação das Partes',
    'object': 'Do Objeto',
    'price': 'Preço e Condições de Pagamento',
    'conditions': 'Condições Gerais',
    'clauses': 'Cláusulas Especiais',
    'closing': 'Encerramento e Assinaturas'
  }

  return displayNames[sectionId] || 'Seção Desconhecida'
}

// -----------------------------------------------------------------------------
// Mock AI Response (Replace with actual AI integration)
// -----------------------------------------------------------------------------

/**
 * Process user message and generate AI response
 * Handles payment term changes via natural language
 */
export async function processMessage(
  sessionId: string,
  userMessage: string
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800))

  let responseContent = ''
  let operation: ChatOperation | null = null

  const lowerMessage = userMessage.toLowerCase()

  // Priority 1: Resolve pending (check first)
  // Check for explicit resolve/confirm keywords combined with pendency mention
  const isResolvePending = (lowerMessage.includes('resolver') || lowerMessage.includes('confirmar') || lowerMessage.includes('confirme')) &&
                          (lowerMessage.includes('pendente') || lowerMessage.includes('pendência'))

  if (isResolvePending) {
    // Extract the field and new value
    let targetField = 'campo não especificado'
    let newValue: any = null

    // Try to extract the field from common patterns
    if (lowerMessage.includes('valor') || lowerMessage.includes('preço')) {
      targetField = 'deal.price'

      // Try to extract the value (e.g., "R$ 500.000,00" or "500000")
      const valueMatch = userMessage.match(/R\$?\s*([\d.,]+)/i)
      if (valueMatch) {
        // Parse the value, removing dots and replacing comma with dot
        const cleanValue = valueMatch[1].replace(/\./g, '').replace(',', '.')
        newValue = parseFloat(cleanValue)
      }
    } else if (lowerMessage.includes('pagamento')) {
      targetField = 'deal.paymentSchedule'
      // For payment schedule, we'd need more complex parsing
      // For now, just resolve it without changing the value
    } else if (lowerMessage.includes('prazo')) {
      targetField = 'deal.conditions'
    }

    // Build the response
    if (newValue !== null) {
      const formattedValue = typeof newValue === 'number'
        ? `R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : newValue

      responseContent = `✅ Vou resolver a pendência do campo "${targetField}".\n\nNovo valor: ${formattedValue}\n\nO campo não será mais destacado como pendente e o valor será atualizado na minuta.`
      operation = {
        type: 'resolve_pending',
        target_path: targetField,
        new_value: newValue,
        reason: `Pendência resolvida via chat: "${userMessage}"`,
        status: 'pending_approval'
      }
    } else {
      responseContent = `✅ Vou resolver a pendência do campo "${targetField}".\n\nO campo não será mais destacado como pendente na minuta.`
      operation = {
        type: 'resolve_pending',
        target_path: targetField,
        reason: `Pendência resolvida via chat: "${userMessage}"`,
        status: 'pending_approval'
      }
    }
  }
  // Priority 2: Mark pending (check before payment terms)
  else if (lowerMessage.includes('marcar') || lowerMessage.includes('marque')) {
    // Extract what needs to be marked as pending
    let targetField = 'campo não especificado'
    let reason = 'Pendente de confirmação conforme solicitado via chat'

    // Try to extract the field from common patterns
    if (lowerMessage.includes('valor') || lowerMessage.includes('preço')) {
      targetField = 'deal.price'
      reason = 'Valor pendente de confirmação'
    } else if (lowerMessage.includes('pagamento')) {
      targetField = 'deal.paymentSchedule'
      reason = 'Condições de pagamento pendentes de confirmação'
    } else if (lowerMessage.includes('prazo')) {
      targetField = 'deal.conditions'
      reason = 'Prazo pendente de confirmação'
    }

    // Extract custom reason if provided
    const reasonMatch = lowerMessage.match(/(?:como|de)\s+(.+?)(?:$|\.)/i)
    if (reasonMatch && reasonMatch[1]) {
      reason = reasonMatch[1].trim()
    }

    responseContent = `Vou marcar "${targetField}" como pendente de confirmação.\n\nMotivo: ${reason}\n\nO campo será destacado em amarelo na minuta até ser confirmado.`
    operation = {
      type: 'mark_pending',
      target_path: targetField,
      reason: reason,
      status: 'pending_approval'
    }
  }
  // Priority 2: Payment terms parsing
  else if (containsPaymentTerms(userMessage)) {
    const parseResult = parsePaymentTerms(userMessage)

    if (parseResult.success && parseResult.paymentSchedule) {
      const formattedSchedule = formatPaymentSchedule(parseResult.paymentSchedule)

      responseContent = `✅ Entendi! Vou alterar as condições de pagamento para:\n\n${formattedSchedule}\n\nAs alterações serão aplicadas à seção "Preço e Pagamento" da minuta.`

      operation = {
        type: 'update_field',
        target_path: 'deal.paymentSchedule',
        old_value: null, // Will be populated from current draft
        new_value: parseResult.paymentSchedule,
        reason: `Alteração de condições de pagamento via chat: "${userMessage}"`,
        status: 'pending_approval'
      }
    } else {
      responseContent = `❌ ${parseResult.error}\n\nPor favor, reformule usando um formato como:\n• "30% à vista e 70% em 60 dias"\n• "100% à vista"\n• "3 parcelas iguais"\n• "R$ 50.000 à vista e R$ 150.000 em 90 dias"`
    }
  }
  // Pattern 2: Regenerate section
  else if (lowerMessage.includes('regenerar') || lowerMessage.includes('reescrever')) {
    // Extract section ID from the message
    const sectionId = extractSectionId(userMessage)
    const sectionName = getSectionDisplayName(sectionId)

    responseContent = `Vou regenerar a seção "${sectionName}" com base nos dados atualizados do caso.\n\nA seção será reescrita mantendo a formatação e estrutura adequadas.`
    operation = {
      type: 'regenerate_section',
      section_id: sectionId,
      reason: `Regeneração da seção "${sectionName}" solicitada via chat`,
      status: 'pending_approval'
    }
  }
  // Pattern 3: Add clause
  else if (lowerMessage.includes('adicionar') || lowerMessage.includes('incluir')) {
    // Extract clause content from the message
    const clauseContent = extractClauseContent(userMessage)

    if (clauseContent) {
      responseContent = `Vou adicionar a seguinte cláusula à minuta:\n\n"${clauseContent}"\n\nPor favor, revise e aprove a adição.`
      operation = {
        type: 'add_clause',
        new_value: {
          content: clauseContent,
          title: extractClauseTitle(userMessage) || 'Nova Cláusula'
        },
        reason: 'Solicitação do usuário via chat',
        status: 'pending_approval'
      }
    } else {
      responseContent = 'Para adicionar uma cláusula, especifique o conteúdo. Por exemplo:\n\n"Adicionar cláusula de multa por atraso de 2% ao mês"\n\nOu:\n\n"Incluir cláusula: O comprador se compromete a pagar multa de 10% em caso de desistência"'
    }
  }
  // Pattern 4: Remove clause
  else if (lowerMessage.includes('remover') || lowerMessage.includes('deletar') || lowerMessage.includes('excluir')) {
    // Extract clause identifier (number or title)
    const clauseIdentifier = extractClauseIdentifier(userMessage)

    if (clauseIdentifier) {
      responseContent = `Vou remover a cláusula "${clauseIdentifier}".\n\nPor favor, revise e aprove a remoção.`
      operation = {
        type: 'remove_clause',
        target_path: clauseIdentifier,
        old_value: clauseIdentifier,
        reason: 'Solicitação do usuário via chat',
        status: 'pending_approval'
      }
    } else {
      responseContent = 'Para remover uma cláusula, especifique qual cláusula deseja remover. Por exemplo:\n\n"Remover a cláusula 3"\n\nOu:\n\n"Excluir a cláusula de multa por atraso"'
    }
  }
  // Default: General help
  else {
    responseContent = `Como posso ajudar a editar a minuta?

📝 **Exemplos de solicitações:**

**Condições de Pagamento:**
• "Alterar pagamento para 30% à vista e 70% em 60 dias"
• "Mudar para 100% à vista"
• "Trocar para 3 parcelas iguais"

**Outras Operações:**
• "Regenerar a seção de condições"
• "Adicionar cláusula de multa"
• "Remover a cláusula 3"
• "Excluir a cláusula de garantia"

**Gerenciar Pendências:**
• "Marcar o valor como pendente de confirmação"
• "Marque o prazo de pagamento como pendente"
• "O valor do imóvel é R$ 500.000,00, pode confirmar"
• "Confirmar a pendência do valor"
• "Resolver a pendência do pagamento"`
  }

  // Send assistant response
  return sendMessage({
    sessionId,
    role: 'assistant',
    content: responseContent,
    operation: operation || undefined,
  })
}

// -----------------------------------------------------------------------------
// Chat Service Export
// -----------------------------------------------------------------------------

export const chatService = {
  createChatSession,
  getChatSession,
  getOrCreateChatSession,
  sendMessage,
  getMessages,
  subscribeToChatMessages,
  updateMessageOperation,
  processMessage,
}

export default chatService
