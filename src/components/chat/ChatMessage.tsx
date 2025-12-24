/**
 * ChatMessage Component
 *
 * Displays individual chat messages in the chat interface.
 * Supports user and assistant messages with different styling.
 * Shows operation previews for assistant messages with operations.
 */

import { ChatMessage as ChatMessageType, ChatOperation } from '../../types'
import {
  UserIcon,
  CpuChipIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChatMessageProps {
  message: ChatMessageType
  onApproveOperation?: (messageId: string, operation: ChatOperation) => void
  onRejectOperation?: (messageId: string, operation: ChatOperation) => void
  isStreaming?: boolean
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getOperationIcon(type: string) {
  switch (type) {
    case 'update_field':
      return <PencilSquareIcon className="w-4 h-4" />
    case 'regenerate_section':
      return <DocumentTextIcon className="w-4 h-4" />
    case 'add_clause':
      return <PlusCircleIcon className="w-4 h-4" />
    case 'remove_clause':
      return <TrashIcon className="w-4 h-4" />
    case 'mark_pending':
      return <ExclamationTriangleIcon className="w-4 h-4" />
    case 'resolve_pending':
      return <CheckCircleIcon className="w-4 h-4" />
    default:
      return <DocumentTextIcon className="w-4 h-4" />
  }
}

function getOperationLabel(type: string): string {
  switch (type) {
    case 'update_field':
      return 'Atualizar campo'
    case 'regenerate_section':
      return 'Regenerar seção'
    case 'add_clause':
      return 'Adicionar cláusula'
    case 'remove_clause':
      return 'Remover cláusula'
    case 'mark_pending':
      return 'Marcar como pendente'
    case 'resolve_pending':
      return 'Resolver pendência'
    default:
      return 'Operação'
  }
}

// -----------------------------------------------------------------------------
// Operation Preview Component
// -----------------------------------------------------------------------------

interface OperationPreviewProps {
  operation: ChatOperation
  messageId: string
  onApprove?: (messageId: string, operation: ChatOperation) => void
  onReject?: (messageId: string, operation: ChatOperation) => void
}

function OperationPreview({ operation, messageId, onApprove, onReject }: OperationPreviewProps) {
  const isPending = !operation.status || operation.status === 'pending_approval'
  const isApproved = operation.status === 'approved'
  const isRejected = operation.status === 'rejected'

  return (
    <div className={`mt-3 p-4 rounded-xl border-2 shadow-sm transition-all duration-200 ${
      isApproved
        ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border-green-300 dark:border-green-700'
        : isRejected
        ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border-red-300 dark:border-red-700'
        : 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-300 dark:border-blue-700'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2.5 text-sm font-semibold ${
          isApproved
            ? 'text-green-900 dark:text-green-100'
            : isRejected
            ? 'text-red-900 dark:text-red-100'
            : 'text-blue-900 dark:text-blue-100'
        }`}>
          {getOperationIcon(operation.type)}
          <span>{getOperationLabel(operation.type)}</span>
        </div>

        {/* Status Badge */}
        {isApproved && (
          <span className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full font-semibold shadow-sm">
            ✓ Aprovada
          </span>
        )}
        {isRejected && (
          <span className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full font-semibold shadow-sm">
            ✗ Rejeitada
          </span>
        )}
        {isPending && (
          <span className="text-xs px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full font-semibold shadow-sm animate-pulse-subtle">
            ⏳ Aguardando aprovação
          </span>
        )}
      </div>

      {operation.target_path && (
        <div className={`text-xs mb-1 ${
          isApproved
            ? 'text-green-700 dark:text-green-300'
            : isRejected
            ? 'text-red-700 dark:text-red-300'
            : 'text-blue-700 dark:text-blue-300'
        }`}>
          <span className="font-medium">Campo:</span> {operation.target_path}
        </div>
      )}

      {operation.section_id && (
        <div className={`text-xs mb-1 ${
          isApproved
            ? 'text-green-700 dark:text-green-300'
            : isRejected
            ? 'text-red-700 dark:text-red-300'
            : 'text-blue-700 dark:text-blue-300'
        }`}>
          <span className="font-medium">Seção:</span> {operation.section_id}
        </div>
      )}

      {operation.old_value !== undefined && operation.new_value !== undefined && (
        <div className="mt-2 space-y-1">
          <div className="text-xs">
            <span className="font-medium text-red-700 dark:text-red-400">Anterior:</span>{' '}
            <span className="text-gray-700 dark:text-gray-300">
              {typeof operation.old_value === 'object'
                ? JSON.stringify(operation.old_value)
                : String(operation.old_value)}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-medium text-green-700 dark:text-green-400">Novo:</span>{' '}
            <span className="text-gray-700 dark:text-gray-300">
              {typeof operation.new_value === 'object'
                ? JSON.stringify(operation.new_value)
                : String(operation.new_value)}
            </span>
          </div>
        </div>
      )}

      {operation.reason && (
        <div className={`mt-2 text-xs italic ${
          isApproved
            ? 'text-green-600 dark:text-green-400'
            : isRejected
            ? 'text-red-600 dark:text-red-400'
            : 'text-blue-600 dark:text-blue-400'
        }`}>
          {operation.reason}
        </div>
      )}

      {/* Action Buttons (only for pending operations) */}
      {isPending && onApprove && onReject && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onApprove(messageId, operation)}
            className="
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
              dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800
              text-white text-sm font-semibold rounded-xl
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500
              shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
            "
          >
            <CheckCircleIcon className="w-4 h-4" />
            Aprovar
          </button>
          <button
            onClick={() => onReject(messageId, operation)}
            className="
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
              dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800
              text-white text-sm font-semibold rounded-xl
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500
              shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
            "
          >
            <XMarkIcon className="w-4 h-4" />
            Rejeitar
          </button>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// ChatMessage Component
// -----------------------------------------------------------------------------

export function ChatMessage({ message, onApproveOperation, onRejectOperation, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md
        ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
          : isSystem
            ? 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700'
            : 'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700'
        }
      `}>
        {isUser ? (
          <UserIcon className="w-5 h-5 text-white" />
        ) : (
          <CpuChipIcon className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div className={`
          inline-block px-5 py-3 rounded-2xl shadow-sm
          ${isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white'
            : isSystem
              ? 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
              : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
          }
        `}>
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
            {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse"></span>}
          </p>
        </div>

        {/* Operation Preview (for assistant messages) */}
        {!isUser && message.operation && (
          <div className={isUser ? 'mr-0' : 'ml-0'}>
            <OperationPreview
              operation={message.operation}
              messageId={message.id}
              onApprove={onApproveOperation}
              onReject={onRejectOperation}
            />
          </div>
        )}

        {/* Timestamp */}
        <div className={`
          text-xs text-gray-500 dark:text-gray-400 mt-2 px-1
          ${isUser ? 'text-right' : 'text-left'}
        `}>
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
