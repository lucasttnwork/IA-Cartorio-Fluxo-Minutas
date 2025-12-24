/**
 * DraftPage Component
 *
 * Draft editor with integrated chat interface for conversational editing.
 * Features a two-panel layout with the Tiptap editor on the left and
 * the chat panel on the right.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TiptapEditor } from '../components/editor'
import { ChatPanel } from '../components/chat'
import { chatService } from '../services/chat'
import { draftOperationsService } from '../services/draftOperations'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { ChatMessage, ChatSession, PendingItem, ChatOperation } from '../types'

export default function DraftPage() {
  const { caseId } = useParams()
  const [content, setContent] = useState('')
  const [pendingItems, _setPendingItems] = useState<PendingItem[]>([])
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operationHistory, setOperationHistory] = useState<Array<{
    messageId: string
    operation: ChatOperation
    previousContent?: string
    timestamp: string
  }>>([])

  // Mock draft ID - in a real app, this would come from the route or be fetched
  const draftId = 'draft-1'

  // Initialize chat session
  useEffect(() => {
    if (!caseId) return

    const initChatSession = async () => {
      try {
        const { data, error } = await chatService.getOrCreateChatSession(
          caseId,
          draftId
        )

        if (error) {
          console.error('Error initializing chat session:', error)
          setError('Não foi possível inicializar a sessão de chat')
          return
        }

        if (data) {
          setChatSession(data)

          // Load existing messages
          const { data: existingMessages, error: messagesError } =
            await chatService.getMessages({ sessionId: data.id })

          if (messagesError) {
            console.error('Error loading messages:', messagesError)
          } else if (existingMessages) {
            setMessages(existingMessages)
          }
        }
      } catch (err) {
        console.error('Error in chat session initialization:', err)
        setError('Erro ao inicializar chat')
      }
    }

    initChatSession()
  }, [caseId, draftId])

  // Subscribe to new messages
  useEffect(() => {
    if (!chatSession) return

    const unsubscribe = chatService.subscribeToChatMessages(
      chatSession.id,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage])
      }
    )

    return () => {
      unsubscribe()
    }
  }, [chatSession])

  const handleContentChange = (html: string) => {
    setContent(html)
    // Here you can save the content to the backend
    console.log('Content updated:', html)
  }

  const handleApproveOperation = async (messageId: string, operation: ChatOperation) => {
    if (!chatSession) return

    try {
      // Save current content to operation history before applying
      const previousContent = content

      // Update operation status to approved
      const updatedOperation = { ...operation, status: 'approved' as const }

      // Update message in database
      await chatService.updateMessageOperation(messageId, updatedOperation)

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, operation: updatedOperation } : msg
        )
      )

      // Apply operation to draft
      const result = await draftOperationsService.applyOperation({
        caseId: caseId!,
        draftId: draftId,
        operation: updatedOperation,
      })

      if (result.success && result.updatedDraft) {
        console.log('Operation applied successfully:', result)

        // Update draft content in the editor
        if (result.updatedDraft.html_content) {
          setContent(result.updatedDraft.html_content)
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

        // Show success notification
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: '✅ Alterações aprovadas e aplicadas com sucesso à minuta.',
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        console.error('Failed to apply operation:', result.error)

        // Show error notification
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: `❌ Erro ao aplicar alterações: ${result.error}`,
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.error('Error approving operation:', err)
      setError('Erro ao aprovar operação')
    }
  }

  const handleRejectOperation = async (messageId: string, operation: ChatOperation) => {
    if (!chatSession) return

    try {
      // Update operation status to rejected
      const updatedOperation = { ...operation, status: 'rejected' as const }

      // Update message in database
      await chatService.updateMessageOperation(messageId, updatedOperation)

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, operation: updatedOperation } : msg
        )
      )

      // Show notification
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          session_id: chatSession.id,
          role: 'system',
          content: '❌ Operação rejeitada. A minuta não foi alterada.',
          operation: null,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.error('Error rejecting operation:', err)
      setError('Erro ao rejeitar operação')
    }
  }

  const handleUndo = async () => {
    if (!chatSession || operationHistory.length === 0) return

    try {
      // Get the last operation from history
      const lastEntry = operationHistory[operationHistory.length - 1]

      // Restore previous content
      if (lastEntry.previousContent !== undefined) {
        setContent(lastEntry.previousContent)
      }

      // Remove the operation from history
      setOperationHistory((prev) => prev.slice(0, -1))

      // Update the message operation status to 'rejected' to indicate it was undone
      await chatService.updateMessageOperation(lastEntry.messageId, {
        ...lastEntry.operation,
        status: 'rejected',
      })

      // Update local messages state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === lastEntry.messageId
            ? { ...msg, operation: { ...lastEntry.operation, status: 'rejected' as const } }
            : msg
        )
      )

      // Show undo notification
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          session_id: chatSession.id,
          role: 'system',
          content: '↩️ Última operação desfeita com sucesso.',
          operation: null,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.error('Error undoing operation:', err)
      setError('Erro ao desfazer operação')
    }
  }

  const handleSendMessage = async (messageContent: string) => {
    if (!chatSession) {
      console.error('No chat session available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Send user message
      const { data: userMessage, error: sendError } =
        await chatService.sendMessage({
          sessionId: chatSession.id,
          content: messageContent,
          role: 'user',
        })

      if (sendError) {
        throw new Error('Failed to send message')
      }

      if (userMessage) {
        setMessages((prev) => [...prev, userMessage])
      }

      // Process message and get AI response
      const { data: assistantMessage, error: processError } =
        await chatService.processMessage(chatSession.id, messageContent)

      if (processError) {
        throw new Error('Failed to process message')
      }

      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage])

        // Operations are now pending approval - user must approve them
        // No automatic application
      }
    } catch (err) {
      console.error('Error handling message:', err)
      setError('Erro ao processar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 p-4">
      {/* Header Card */}
      <Card className="glass-card p-6 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-md">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editor de Minuta
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Caso: <span className="font-semibold text-gray-700 dark:text-gray-300">{caseId || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 shadow-md">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Erro
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        </Alert>
      )}

      {/* Two-Panel Layout */}
      <div className={cn("flex-1 flex gap-4 overflow-hidden", error && "pt-0")}>
        {/* Left Panel - Editor */}
        <div className="flex-1 overflow-hidden rounded-lg shadow-lg">
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Comece a escrever a minuta..."
            className="h-full"
            pendingItems={pendingItems}
          />
        </div>

        {/* Right Panel - Chat */}
        <div className="w-96 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
          <ChatPanel
            sessionId={chatSession?.id}
            messages={messages}
            onSendMessage={handleSendMessage}
            onApproveOperation={handleApproveOperation}
            onRejectOperation={handleRejectOperation}
            onUndo={handleUndo}
            canUndo={operationHistory.length > 0}
            isLoading={isLoading}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
