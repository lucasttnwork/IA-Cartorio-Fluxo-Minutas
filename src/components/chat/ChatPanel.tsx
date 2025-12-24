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
  sessionId,
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
    <div className={`flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 shadow-md">
              <SparklesIcon className="w-5 h-5 text-white" />
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
            <button
              onClick={onUndo}
              disabled={!canUndo || isLoading}
              title="Desfazer última operação"
              className="
                p-2 rounded-lg
                bg-gray-100 hover:bg-gray-200
                dark:bg-gray-700 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-300
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-purple-500
                shadow-sm hover:shadow-md
                transform hover:scale-105 active:scale-95
              "
            >
              <ArrowUturnLeftIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-purple-500/20 dark:bg-purple-400/20 rounded-full blur-2xl"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center shadow-xl">
                <SparklesIcon className="w-10 h-10 text-white animate-pulse-subtle" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Bem-vindo ao Assistente de Edição
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
              Envie mensagens para editar a minuta de forma conversacional. Por exemplo:
            </p>
            <div className="mt-2 space-y-3 text-left w-full max-w-sm">
              <div className="group px-4 py-3 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-xs text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md hover:scale-[1.02] cursor-default">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">💬</span> "Altere o prazo de pagamento para 60 dias"
              </div>
              <div className="group px-4 py-3 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-xs text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md hover:scale-[1.02] cursor-default">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">➕</span> "Adicione uma cláusula de multa por atraso"
              </div>
              <div className="group px-4 py-3 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-xs text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md hover:scale-[1.02] cursor-default">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">🔄</span> "Regenere a seção de condições de pagamento"
              </div>
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
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center shadow-md">
                  <SparklesIcon className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="inline-block px-5 py-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-2 ml-1">
                    Processando sua solicitação...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            disabled={isLoading}
            rows={1}
            className="
              flex-1 resize-none rounded-xl px-4 py-3
              border-2 border-gray-200 dark:border-gray-600
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
              focus:border-purple-500 dark:focus:border-purple-400
              disabled:opacity-50 disabled:cursor-not-allowed
              max-h-32 overflow-y-auto scrollbar-thin
              transition-all duration-200
              shadow-sm hover:shadow-md
            "
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="
              flex-shrink-0 px-5 py-3 rounded-xl
              bg-gradient-to-br from-purple-500 to-purple-600
              hover:from-purple-600 hover:to-purple-700
              dark:from-purple-600 dark:to-purple-700
              dark:hover:from-purple-700 dark:hover:to-purple-800
              text-white font-semibold
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:from-purple-500 disabled:hover:to-purple-600
              focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
              focus:ring-offset-2
              shadow-md hover:shadow-lg
              transform hover:scale-105 active:scale-95
            "
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Todas as alterações serão registradas no histórico de auditoria
        </p>
      </div>
    </div>
  )
}

export default ChatPanel
