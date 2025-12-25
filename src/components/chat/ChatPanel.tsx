/**
 * ChatPanel Component
 *
 * A chat interface for conversational draft editing.
 * Displays message history and allows users to send requests for changes.
 *
 * Features:
 * - Message history display with auto-scroll
 * - Input field for user messages
 * - Loading state during AI processing
 * - Empty state when no messages
 * - Responsive layout
 */

import { useState, useRef, useEffect } from 'react'
import { ChatMessage as ChatMessageType, ChatOperation } from '../../types'
import { ChatMessage } from './ChatMessage'
import { PaperAirplaneIcon, SparklesIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import EmptyStateIllustration from '../common/EmptyStateIllustration'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChatPanelProps {
  sessionId?: string
  messages: ChatMessageType[]
  onSendMessage: (content: string) => Promise<void>
  onApproveOperation?: (messageId: string, operation: ChatOperation) => void
  onRejectOperation?: (messageId: string, operation: ChatOperation) => void
  onUndo?: () => void
  canUndo?: boolean
  isLoading?: boolean
  streamingMessageId?: string
  className?: string
}

// -----------------------------------------------------------------------------
// ChatPanel Component
// -----------------------------------------------------------------------------

export function ChatPanel({
  sessionId: _sessionId,
  messages,
  onSendMessage,
  onApproveOperation,
  onRejectOperation,
  onUndo,
  canUndo = false,
  isLoading = false,
  streamingMessageId,
  className = ''
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isLoading) {
      return
    }

    const message = inputValue.trim()
    setInputValue('')

    try {
      await onSendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <Card className={cn("flex flex-col h-full glass-card border-l shadow-lg", className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b glass-subtle">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500 dark:bg-purple-600 shadow-md">
              <SparklesIcon className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Assistente de Edição
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Converse para editar a minuta
              </p>
            </div>
          </div>

          {/* Undo Button */}
          {onUndo && (
            <Button
              onClick={onUndo}
              disabled={!canUndo || isLoading}
              title="Desfazer última operação (Ctrl+Z)"
              variant="outline"
              size="icon"
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowUturnLeftIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            // Empty State
            <div className="h-[calc(100vh-300px)] flex flex-col items-center justify-center text-center px-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-2xl"></div>
                <EmptyStateIllustration
                  type="chat"
                  className="relative w-32 h-32"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Bem-vindo ao Assistente de Edição
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
                Envie mensagens para editar a minuta de forma conversacional. Por exemplo:
              </p>
              <div className="mt-2 space-y-3 text-left w-full max-w-sm">
                <Card className="group glass-subtle hover:glass-card px-4 py-3 text-xs text-gray-700 dark:text-gray-300 transition-all hover:shadow-md hover:scale-[1.02] cursor-default">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">💬</span> "Altere o prazo de pagamento para 60 dias"
                </Card>
                <Card className="group glass-subtle hover:glass-card px-4 py-3 text-xs text-gray-700 dark:text-gray-300 transition-all hover:shadow-md hover:scale-[1.02] cursor-default">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">➕</span> "Adicione uma cláusula de multa por atraso"
                </Card>
                <Card className="group glass-subtle hover:glass-card px-4 py-3 text-xs text-gray-700 dark:text-gray-300 transition-all hover:shadow-md hover:scale-[1.02] cursor-default">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">🔄</span> "Regenere a seção de condições de pagamento"
                </Card>
              </div>
            </div>
          ) : (
            // Message List
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onApproveOperation={onApproveOperation}
                  onRejectOperation={onRejectOperation}
                  isStreaming={streamingMessageId === message.id}
                />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center shadow-md">
                    <SparklesIcon className="size-5 text-white animate-pulse" />
                  </div>
                  <Card className="flex-1 glass-subtle">
                    <div className="inline-block px-5 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce animation-delay-0"></div>
                        <div className="w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce animation-delay-150"></div>
                        <div className="w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce animation-delay-300"></div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-2 ml-1">
                      Processando sua solicitação...
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-4 border-t glass-subtle">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            disabled={isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none max-h-32",
              "focus:ring-purple-500 dark:focus:ring-purple-400"
            )}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            <PaperAirplaneIcon className="size-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Todas as alterações serão registradas no histórico de auditoria
        </p>
      </div>
    </Card>
  )
}

export default ChatPanel
