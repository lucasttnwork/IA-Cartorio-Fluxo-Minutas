/**
 * TestChatInterfacePage - Test page for chat interface
 *
 * This page demonstrates the chat interface integrated with the draft editor.
 * It uses mock data to showcase the chat functionality without requiring
 * a full case setup or database connection.
 */

import { useState } from 'react'
import { TiptapEditor } from '../components/editor'
import { ChatPanel } from '../components/chat'
import { parsePaymentTerms, formatPaymentSchedule, containsPaymentTerms } from '../utils/paymentTermsParser'
import { useChatHistory } from '../hooks/useChatHistory'
import type { ChatMessage, ChatOperation } from '../types'

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

  // Pattern 4: quoted content
  const quotePattern = /(?:adicionar|incluir).*?['"]([^'"]+)['"]/i
  const quoteMatch = message.match(quotePattern)
  if (quoteMatch && quoteMatch[1]) {
    return quoteMatch[1].trim()
  }

  return null
}

/**
 * Extract clause title from user message
 */
function extractClauseTitle(message: string): string | null {
  const dePattern = /cláusula\s+de\s+([^:\-]+?)(?:[:\-]|$)/i
  const deMatch = message.match(dePattern)
  if (deMatch && deMatch[1]) {
    return capitalizeTitle(deMatch[1].trim())
  }

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

export default function TestChatInterfacePage() {
  const [content, setContent] = useState(`
    <h1>Escritura Pública de Compra e Venda de Imóvel</h1>

    <h2>Das Partes</h2>
    <p><strong>VENDEDOR:</strong> João Silva, brasileiro, casado, empresário, portador do CPF 123.456.789-00, residente na Rua das Flores, 123, São Paulo - SP.</p>

    <p><strong>COMPRADOR:</strong> Maria Santos, brasileira, solteira, engenheira, portadora do CPF 987.654.321-00, residente na Avenida Paulista, 456, São Paulo - SP.</p>

    <h2>Do Objeto</h2>
    <p>O presente instrumento tem por objeto a compra e venda do imóvel localizado na Rua das Acácias, 789, Bairro Jardim Europa, São Paulo - SP, com área de 250m², registrado sob matrícula nº 12.345 no 1º Cartório de Registro de Imóveis.</p>

    <h2>Do Preço e Condições de Pagamento</h2>
    <p>O valor total da transação é de R$ 500.000,00 (quinhentos mil reais), sendo:</p>
    <ul>
      <li>30% de entrada no ato da assinatura</li>
      <li>70% restante em 60 dias</li>
    </ul>
  `)

  // Use the chat history hook with persistence enabled
  const { messages, setMessages, addMessage, updateMessage } = useChatHistory({
    sessionId: 'test-session',
    initialMessages: [
      {
        id: '1',
        session_id: 'test-session',
        role: 'system',
        content: 'Chat interface iniciada. Você pode editar a minuta através de mensagens.',
        operation: null,
        created_at: new Date(Date.now() - 60000).toISOString(),
      },
    ],
    enablePersistence: true
  })

  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | undefined>()
  const [operationHistory, setOperationHistory] = useState<Array<{
    messageId: string
    operation: ChatOperation
    previousContent: string
    timestamp: string
  }>>([])

  const handleContentChange = (html: string) => {
    setContent(html)
    console.log('Content updated:', html)
  }

  const handleApproveOperation = async (messageId: string, operation: ChatOperation) => {
    console.log('Approving operation:', messageId, operation)

    // Save current content to operation history before applying
    const previousContent = content

    // Update operation status to approved
    const updatedOperation = { ...operation, status: 'approved' as const }

    // Update message using the hook's method
    updateMessage(messageId, { operation: updatedOperation })

    // Apply the operation to the content
    if (operation.type === 'update_field' && operation.new_value) {
      const paymentSchedule = operation.new_value as any
      const updatedContent = content.replace(
        /<ul>[\s\S]*?<\/ul>/,
        `<ul>\n${paymentSchedule.entries.map((entry: any) => {
          let text = `      <li>${entry.description}`
          if (entry.percentage !== undefined) {
            text += ` - ${entry.percentage}%`
          }
          if (entry.amount !== undefined) {
            text += ` - R$ ${entry.amount.toLocaleString('pt-BR')}`
          }
          if (entry.due_date) {
            const date = new Date(entry.due_date)
            text += ` (${date.toLocaleDateString('pt-BR')})`
          }
          return text + '</li>'
        }).join('\n')}\n    </ul>`
      )
      setContent(updatedContent)
    } else if (operation.type === 'add_clause' && operation.new_value) {
      // Handle clause addition
      const clauseData = operation.new_value as any
      const clauseTitle = clauseData.title || 'Nova Cláusula'
      const clauseContent = clauseData.content

      // Count existing clauses in the content
      const existingClauses = (content.match(/<h2>Cláusula/g) || []).length
      const clauseNumber = existingClauses + 1

      // Add the new clause at the end
      const newClauseHtml = `\n\n    <h2>Cláusula ${clauseNumber} - ${clauseTitle}</h2>\n    <p>${clauseContent}</p>`

      const updatedContent = content.trim() + newClauseHtml
      setContent(updatedContent)
    } else if (operation.type === 'remove_clause') {
      // Handle clause removal
      const clauseIdentifier = operation.target_path || operation.old_value

      if (clauseIdentifier) {
        let updatedContent = content

        // Try to extract clause number
        const numericMatch = String(clauseIdentifier).match(/\d+/)
        if (numericMatch) {
          const clauseNumber = parseInt(numericMatch[0], 10)
          // Remove by clause number
          const clausePattern = new RegExp(
            `<h2>Cláusula\\s+${clauseNumber}\\s*-[^<]*</h2>\\s*<p>[^<]*</p>`,
            'gi'
          )
          updatedContent = updatedContent.replace(clausePattern, '')
        } else {
          // Remove by clause title (partial match)
          const titlePattern = new RegExp(
            `<h2>Cláusula\\s+\\d+\\s*-\\s*[^<]*${clauseIdentifier}[^<]*</h2>\\s*<p>[^<]*</p>`,
            'gi'
          )
          updatedContent = updatedContent.replace(titlePattern, '')
        }

        // Renumber remaining clauses
        let clauseNum = 1
        updatedContent = updatedContent.replace(
          /<h2>Cláusula\s+\d+\s*-\s*([^<]+)<\/h2>/gi,
          (match, title) => {
            return `<h2>Cláusula ${clauseNum++} - ${title}</h2>`
          }
        )

        setContent(updatedContent)
      }
    }

    // Add to operation history for undo
    setOperationHistory((prev) => [
      ...prev,
      {
        messageId,
        operation: updatedOperation,
        previousContent,
        timestamp: new Date().toISOString(),
      },
    ])

    // Add success message using the hook's method
    const successMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: 'test-session',
      role: 'system',
      content: '✅ Alterações aprovadas e aplicadas com sucesso à minuta.',
      operation: null,
      created_at: new Date().toISOString(),
    }
    addMessage(successMessage)
  }

  const handleRejectOperation = async (messageId: string, operation: ChatOperation) => {
    console.log('Rejecting operation:', messageId, operation)

    // Update operation status to rejected
    const updatedOperation = { ...operation, status: 'rejected' as const }

    // Update message using the hook's method
    updateMessage(messageId, { operation: updatedOperation })

    // Add rejection message using the hook's method
    const rejectMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: 'test-session',
      role: 'system',
      content: '❌ Operação rejeitada. A minuta não foi alterada.',
      operation: null,
      created_at: new Date().toISOString(),
    }
    addMessage(rejectMessage)
  }

  const handleUndo = () => {
    if (operationHistory.length === 0) return

    // Get the last operation from history
    const lastEntry = operationHistory[operationHistory.length - 1]

    // Restore previous content
    setContent(lastEntry.previousContent)

    // Remove the operation from history
    setOperationHistory((prev) => prev.slice(0, -1))

    // Update the message operation status to 'rejected' to indicate it was undone
    updateMessage(lastEntry.messageId, {
      operation: { ...lastEntry.operation, status: 'rejected' as const }
    })

    // Show undo notification
    const undoMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: 'test-session',
      role: 'system',
      content: '↩️ Última operação desfeita com sucesso.',
      operation: null,
      created_at: new Date().toISOString(),
    }
    addMessage(undoMessage)
  }

  /**
   * Streams a message by gradually revealing its content
   */
  const streamMessage = async (messageId: string, fullContent: string, operation: any = null) => {
    // Split content into words for smoother streaming
    const words = fullContent.split(' ')
    let currentContent = ''

    // Create initial empty message
    const initialMessage: ChatMessage = {
      id: messageId,
      session_id: 'test-session',
      role: 'assistant',
      content: '',
      operation: null,
      created_at: new Date().toISOString(),
    }
    addMessage(initialMessage)
    setStreamingMessageId(messageId)

    // Stream words progressively
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i]

      updateMessage(messageId, { content: currentContent })

      // Delay between words (30-60ms for natural feel)
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 30))
    }

    // Add operation after streaming is complete
    if (operation) {
      updateMessage(messageId, { operation })
    }

    // Mark streaming as complete
    setStreamingMessageId(undefined)
  }

  const handleSendMessage = async (messageContent: string) => {
    setIsLoading(true)

    // Add user message using the hook's method
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: 'test-session',
      role: 'user',
      content: messageContent,
      operation: null,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)

    // Simulate AI processing delay (shorter since we'll stream the response)
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Generate assistant response using payment terms parser
    let responseContent = ''
    let operation = null

    const lowerMessage = messageContent.toLowerCase()

    // Priority 1: Resolve pending (check first)
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
        const valueMatch = messageContent.match(/R\$?\s*([\d.,]+)/i)
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
          type: 'resolve_pending' as const,
          target_path: targetField,
          new_value: newValue,
          reason: `Pendência resolvida via chat: "${messageContent}"`,
          status: 'pending_approval'
        }
      } else {
        responseContent = `✅ Vou resolver a pendência do campo "${targetField}".\n\nO campo não será mais destacado como pendente na minuta.`
        operation = {
          type: 'resolve_pending' as const,
          target_path: targetField,
          reason: `Pendência resolvida via chat: "${messageContent}"`,
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

      responseContent = `✅ Vou marcar "${targetField}" como pendente de confirmação.\n\nMotivo: ${reason}\n\nO campo será destacado em amarelo na minuta até ser confirmado.`
      operation = {
        type: 'mark_pending' as const,
        target_path: targetField,
        reason: reason,
        status: 'pending_approval'
      }
    }
    // Priority 2: Payment terms parsing
    else if (containsPaymentTerms(messageContent)) {
      const parseResult = parsePaymentTerms(messageContent)

      if (parseResult.success && parseResult.paymentSchedule) {
        const formattedSchedule = formatPaymentSchedule(parseResult.paymentSchedule)

        responseContent = `✅ Entendi! Vou alterar as condições de pagamento para:\n\n${formattedSchedule}\n\nAs alterações serão aplicadas à seção "Preço e Pagamento" da minuta.`

        operation = {
          type: 'update_field' as const,
          target_path: 'deal.paymentSchedule',
          old_value: null,
          new_value: parseResult.paymentSchedule,
          reason: `Alteração de condições de pagamento via chat: "${messageContent}"`,
          status: 'pending_approval'
        }

        // Content will be updated only after approval
      } else {
        responseContent = `❌ ${parseResult.error}\n\nPor favor, reformule usando um formato como:\n• "30% à vista e 70% em 60 dias"\n• "100% à vista"\n• "3 parcelas iguais"\n• "R$ 50.000 à vista e R$ 150.000 em 90 dias"`
      }
    }
    // Pattern 2: Regenerate section
    else if (lowerMessage.includes('regenerar') || lowerMessage.includes('reescrever')) {
      // Extract section ID from the message
      const sectionId = extractSectionId(messageContent)
      const sectionName = getSectionDisplayName(sectionId)

      responseContent = `Vou regenerar a seção "${sectionName}" com base nos dados atualizados do caso.\n\nA seção será reescrita mantendo a formatação e estrutura adequadas.`
      operation = {
        type: 'regenerate_section' as const,
        section_id: sectionId,
        reason: `Regeneração da seção "${sectionName}" solicitada via chat`,
        status: 'pending_approval'
      }
    }
    // Pattern 3: Add clause
    else if (lowerMessage.includes('adicionar') || lowerMessage.includes('incluir')) {
      // Extract clause content from the message
      const clauseContent = extractClauseContent(messageContent)

      if (clauseContent) {
        responseContent = `Vou adicionar a seguinte cláusula à minuta:\n\n"${clauseContent}"\n\nPor favor, revise e aprove a adição.`
        operation = {
          type: 'add_clause' as const,
          new_value: {
            content: clauseContent,
            title: extractClauseTitle(messageContent) || 'Nova Cláusula'
          },
          reason: 'Solicitação do usuário via chat',
          status: 'pending_approval'
        }
      } else if (lowerMessage.includes('cláusula')) {
        responseContent = 'Para adicionar uma cláusula, especifique o conteúdo. Por exemplo:\n\n"Adicionar cláusula de multa por atraso de 2% ao mês"\n\nOu:\n\n"Incluir cláusula: O comprador se compromete a pagar multa de 10% em caso de desistência"'
      }
    }
    // Pattern 4: Remove clause
    else if (lowerMessage.includes('remover') || lowerMessage.includes('deletar') || lowerMessage.includes('excluir')) {
      // Extract clause identifier (number or title)
      const clauseIdentifier = extractClauseIdentifier(messageContent)

      if (clauseIdentifier) {
        responseContent = `Vou remover a cláusula "${clauseIdentifier}".\n\nPor favor, revise e aprove a remoção.`
        operation = {
          type: 'remove_clause' as const,
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
• "Remover cláusula X"
• "Marcar o valor como pendente de confirmação"
• "Marque o prazo de pagamento como pendente"`
    }

    // Stream the response instead of adding it all at once
    const messageId = `msg-${Date.now() + 1}`
    setIsLoading(false)
    await streamMessage(messageId, responseContent, operation)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Test: Chat Interface for Draft Editing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page demonstrates the chat interface integrated with the Tiptap editor.
            Try sending messages to edit the draft.
          </p>
        </div>

        {/* Two-Panel Layout */}
        <div className="h-[calc(100vh-12rem)] flex gap-6">
          {/* Left Panel - Editor */}
          <div className="flex-1 overflow-hidden">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Draft Editor
              </h2>
            </div>
            <TiptapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Comece a escrever a minuta..."
              className="h-full"
            />
          </div>

          {/* Right Panel - Chat */}
          <div className="w-96 flex-shrink-0">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat Assistant
              </h2>
            </div>
            <ChatPanel
              sessionId="test-session"
              messages={messages}
              onSendMessage={handleSendMessage}
              onApproveOperation={handleApproveOperation}
              onRejectOperation={handleRejectOperation}
              onUndo={handleUndo}
              canUndo={operationHistory.length > 0}
              isLoading={isLoading}
              streamingMessageId={streamingMessageId}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
