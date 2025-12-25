/**
 * useChatHistory Hook
 *
 * Custom hook for managing chat message history with persistent storage.
 * Provides localStorage backup for offline support and session persistence.
 *
 * Features:
 * - Automatically saves messages to localStorage
 * - Loads messages from localStorage on mount
 * - Syncs with Supabase when available
 * - Clears history when needed
 */

import { useState, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types'
import { chatCache } from '../services/chatCache'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'chat_history_'
const MAX_MESSAGES_IN_STORAGE = 500 // Limit to prevent localStorage overflow

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get storage key for a specific session
 */
function getStorageKey(sessionId: string): string {
  return `${STORAGE_KEY_PREFIX}${sessionId}`
}

/**
 * Load messages from localStorage
 */
function loadMessagesFromStorage(sessionId: string): ChatMessage[] {
  try {
    const key = getStorageKey(sessionId)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return []
    }

    const messages = JSON.parse(stored) as ChatMessage[]
    return Array.isArray(messages) ? messages : []
  } catch (error) {
    console.error('Error loading chat history from localStorage:', error)
    return []
  }
}

/**
 * Save messages to localStorage
 */
function saveMessagesToStorage(sessionId: string, messages: ChatMessage[]): void {
  try {
    const key = getStorageKey(sessionId)

    // Limit the number of messages to prevent localStorage overflow
    const messagesToStore = messages.slice(-MAX_MESSAGES_IN_STORAGE)

    localStorage.setItem(key, JSON.stringify(messagesToStore))
  } catch (error) {
    console.error('Error saving chat history to localStorage:', error)

    // If quota exceeded, try to clear old messages and retry
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        const key = getStorageKey(sessionId)
        const halfMessages = messages.slice(-Math.floor(MAX_MESSAGES_IN_STORAGE / 2))
        localStorage.setItem(key, JSON.stringify(halfMessages))
      } catch (retryError) {
        console.error('Failed to save chat history even after reducing size:', retryError)
      }
    }
  }
}

/**
 * Clear messages from localStorage
 */
function clearMessagesFromStorage(sessionId: string): void {
  try {
    const key = getStorageKey(sessionId)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing chat history from localStorage:', error)
  }
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export interface UseChatHistoryOptions {
  sessionId: string
  initialMessages?: ChatMessage[]
  enablePersistence?: boolean
}

export interface UseChatHistoryReturn {
  messages: ChatMessage[]
  addMessage: (message: ChatMessage) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  clearHistory: () => void
  loadFromStorage: () => ChatMessage[]
}

/**
 * Custom hook for managing chat message history with persistence
 */
export function useChatHistory(options: UseChatHistoryOptions): UseChatHistoryReturn {
  const {
    sessionId,
    initialMessages = [],
    enablePersistence = true
  } = options

  // Load initial messages from storage or use provided initial messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (enablePersistence) {
      const stored = loadMessagesFromStorage(sessionId)
      return stored.length > 0 ? stored : initialMessages
    }
    return initialMessages
  })

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (enablePersistence && sessionId) {
      saveMessagesToStorage(sessionId, messages)
    }
  }, [messages, sessionId, enablePersistence])

  /**
   * Add a new message to the history
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  /**
   * Update an existing message
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    )
  }, [])

  /**
   * Clear all messages from history and storage
   */
  const clearHistory = useCallback(() => {
    setMessages([])
    if (enablePersistence) {
      clearMessagesFromStorage(sessionId)
      // Also clear context cache if sessionId is a draftId
      try {
        chatCache.invalidateCache(sessionId)
      } catch (error) {
        console.error('Failed to invalidate context cache:', error)
      }
    }
  }, [sessionId, enablePersistence])

  /**
   * Load messages from storage (useful for manual refresh)
   */
  const loadFromStorage = useCallback(() => {
    if (enablePersistence) {
      const stored = loadMessagesFromStorage(sessionId)
      setMessages(stored)
      return stored
    }
    return []
  }, [sessionId, enablePersistence])

  return {
    messages,
    addMessage,
    updateMessage,
    setMessages,
    clearHistory,
    loadFromStorage
  }
}

export default useChatHistory
