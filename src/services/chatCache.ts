/**
 * Chat Cache Service
 *
 * Manages caching of chat context to optimize AI API calls.
 * Uses localStorage for persistence and implements cache warming strategies.
 *
 * Features:
 * - Context caching (system prompts, draft content, conversation history)
 * - Cache invalidation on draft updates
 * - Automatic cache cleanup
 * - Cache metrics tracking
 */

import type { ChatMessage, DraftContent } from '../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChatContext {
  draftId: string
  draftContent: DraftContent | null
  draftHtml: string
  messages: ChatMessage[]
  systemPrompt: string
  cachedAt: string
  version: number
}

export interface CacheMetrics {
  hits: number
  misses: number
  size: number
  lastUpdated: string
}

export interface CacheEntry {
  context: ChatContext
  metrics: CacheMetrics
  expiresAt: string
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const CACHE_KEY_PREFIX = 'chat_context_'
const CACHE_VERSION = 1
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes
const MAX_CACHED_MESSAGES = 50 // Keep last 50 messages in cache
const MAX_CACHE_SIZE_MB = 5 // Maximum cache size per session

// -----------------------------------------------------------------------------
// System Prompt Template
// -----------------------------------------------------------------------------

/**
 * Generate system prompt for chat assistant
 */
function generateSystemPrompt(draftHtml: string, _draftContent: DraftContent | null): string {
  return `Você é um assistente especializado em edição de minutas jurídicas de cartório.

**CONTEXTO ATUAL DA MINUTA:**
${draftHtml || 'Nenhuma minuta carregada ainda.'}

**SUAS CAPACIDADES:**
1. Alterar condições de pagamento (interpretar linguagem natural)
2. Adicionar ou remover cláusulas
3. Regenerar seções específicas
4. Marcar campos como pendentes de confirmação
5. Resolver pendências com novos valores

**FORMATO DE RESPOSTA:**
- Seja claro e objetivo
- Confirme o que vai fazer antes de sugerir a operação
- Use formatação markdown quando apropriado
- Sempre peça confirmação para mudanças significativas

**IMPORTANTE:**
- Todas as alterações devem ser aprovadas pelo usuário
- Mantenha o tom profissional e formal adequado ao contexto jurídico
- Preserve a estrutura e formatação da minuta ao fazer alterações`
}

// -----------------------------------------------------------------------------
// Cache Key Management
// -----------------------------------------------------------------------------

/**
 * Generate cache key for a draft session
 */
function getCacheKey(draftId: string): string {
  return `${CACHE_KEY_PREFIX}${draftId}`
}

/**
 * Check if cache entry is expired
 */
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

/**
 * Calculate cache size in MB
 */
function calculateCacheSize(context: ChatContext): number {
  const json = JSON.stringify(context)
  const bytes = new Blob([json]).size
  return bytes / (1024 * 1024) // Convert to MB
}

// -----------------------------------------------------------------------------
// Cache Operations
// -----------------------------------------------------------------------------

/**
 * Warm up cache with initial context
 */
export function warmCache(
  draftId: string,
  draftContent: DraftContent | null,
  draftHtml: string,
  messages: ChatMessage[]
): ChatContext {
  const systemPrompt = generateSystemPrompt(draftHtml, draftContent)

  const context: ChatContext = {
    draftId,
    draftContent,
    draftHtml,
    messages: messages.slice(-MAX_CACHED_MESSAGES), // Keep only recent messages
    systemPrompt,
    cachedAt: new Date().toISOString(),
    version: CACHE_VERSION,
  }

  // Check cache size
  const size = calculateCacheSize(context)
  if (size > MAX_CACHE_SIZE_MB) {
    console.warn(`Cache size (${size.toFixed(2)}MB) exceeds limit. Reducing message count.`)
    // Keep fewer messages if cache is too large
    context.messages = messages.slice(-Math.floor(MAX_CACHED_MESSAGES / 2))
  }

  const entry: CacheEntry = {
    context,
    metrics: {
      hits: 0,
      misses: 0,
      size,
      lastUpdated: new Date().toISOString(),
    },
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  }

  try {
    const key = getCacheKey(draftId)
    localStorage.setItem(key, JSON.stringify(entry))
    console.log(`[ChatCache] Warmed cache for draft ${draftId}`)
  } catch (error) {
    console.error('[ChatCache] Failed to warm cache:', error)
    // If localStorage is full, try clearing old entries
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearExpiredCaches()
      try {
        const key = getCacheKey(draftId)
        localStorage.setItem(key, JSON.stringify(entry))
      } catch (retryError) {
        console.error('[ChatCache] Failed to warm cache even after cleanup:', retryError)
      }
    }
  }

  return context
}

/**
 * Get cached context for a draft
 */
export function getCachedContext(draftId: string): ChatContext | null {
  try {
    const key = getCacheKey(draftId)
    const cached = localStorage.getItem(key)

    if (!cached) {
      console.log(`[ChatCache] Cache miss for draft ${draftId}`)
      return null
    }

    const entry: CacheEntry = JSON.parse(cached)

    // Check expiration
    if (isExpired(entry.expiresAt)) {
      console.log(`[ChatCache] Cache expired for draft ${draftId}`)
      localStorage.removeItem(key)
      return null
    }

    // Update metrics
    entry.metrics.hits++
    entry.metrics.lastUpdated = new Date().toISOString()
    localStorage.setItem(key, JSON.stringify(entry))

    console.log(`[ChatCache] Cache hit for draft ${draftId} (hits: ${entry.metrics.hits})`)
    return entry.context
  } catch (error) {
    console.error('[ChatCache] Failed to get cached context:', error)
    return null
  }
}

/**
 * Update cache with new message
 */
export function updateCacheWithMessage(
  draftId: string,
  message: ChatMessage
): void {
  try {
    const key = getCacheKey(draftId)
    const cached = localStorage.getItem(key)

    if (!cached) {
      console.log(`[ChatCache] No cache to update for draft ${draftId}`)
      return
    }

    const entry: CacheEntry = JSON.parse(cached)

    // Add new message
    entry.context.messages.push(message)

    // Keep only recent messages
    if (entry.context.messages.length > MAX_CACHED_MESSAGES) {
      entry.context.messages = entry.context.messages.slice(-MAX_CACHED_MESSAGES)
    }

    // Update metadata
    entry.context.cachedAt = new Date().toISOString()
    entry.metrics.lastUpdated = new Date().toISOString()
    entry.metrics.size = calculateCacheSize(entry.context)

    // Extend expiration
    entry.expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString()

    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    console.error('[ChatCache] Failed to update cache with message:', error)
  }
}

/**
 * Invalidate cache when draft content changes
 */
export function invalidateCache(draftId: string): void {
  try {
    const key = getCacheKey(draftId)
    localStorage.removeItem(key)
    console.log(`[ChatCache] Invalidated cache for draft ${draftId}`)
  } catch (error) {
    console.error('[ChatCache] Failed to invalidate cache:', error)
  }
}

/**
 * Update cache when draft content changes
 */
export function updateCacheWithDraft(
  draftId: string,
  draftContent: DraftContent | null,
  draftHtml: string
): void {
  try {
    const key = getCacheKey(draftId)
    const cached = localStorage.getItem(key)

    if (!cached) {
      // No cache exists, warm it up
      warmCache(draftId, draftContent, draftHtml, [])
      return
    }

    const entry: CacheEntry = JSON.parse(cached)

    // Update draft content and regenerate system prompt
    entry.context.draftContent = draftContent
    entry.context.draftHtml = draftHtml
    entry.context.systemPrompt = generateSystemPrompt(draftHtml, draftContent)
    entry.context.cachedAt = new Date().toISOString()

    // Update metadata
    entry.metrics.lastUpdated = new Date().toISOString()
    entry.metrics.size = calculateCacheSize(entry.context)

    // Extend expiration
    entry.expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString()

    localStorage.setItem(key, JSON.stringify(entry))
    console.log(`[ChatCache] Updated cache with new draft content for ${draftId}`)
  } catch (error) {
    console.error('[ChatCache] Failed to update cache with draft:', error)
  }
}

/**
 * Clear all expired caches
 */
export function clearExpiredCaches(): void {
  try {
    const keys = Object.keys(localStorage)
    let clearedCount = 0

    for (const key of keys) {
      if (!key.startsWith(CACHE_KEY_PREFIX)) continue

      try {
        const cached = localStorage.getItem(key)
        if (!cached) continue

        const entry: CacheEntry = JSON.parse(cached)
        if (isExpired(entry.expiresAt)) {
          localStorage.removeItem(key)
          clearedCount++
        }
      } catch (error) {
        console.error(`[ChatCache] Failed to check expiration for ${key}:`, error)
      }
    }

    if (clearedCount > 0) {
      console.log(`[ChatCache] Cleared ${clearedCount} expired cache entries`)
    }
  } catch (error) {
    console.error('[ChatCache] Failed to clear expired caches:', error)
  }
}

/**
 * Get cache metrics for a draft
 */
export function getCacheMetrics(draftId: string): CacheMetrics | null {
  try {
    const key = getCacheKey(draftId)
    const cached = localStorage.getItem(key)

    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)
    return entry.metrics
  } catch (error) {
    console.error('[ChatCache] Failed to get cache metrics:', error)
    return null
  }
}

/**
 * Clear all chat caches (for maintenance)
 */
export function clearAllCaches(): void {
  try {
    const keys = Object.keys(localStorage)
    let clearedCount = 0

    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key)
        clearedCount++
      }
    }

    console.log(`[ChatCache] Cleared ${clearedCount} cache entries`)
  } catch (error) {
    console.error('[ChatCache] Failed to clear all caches:', error)
  }
}

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

export const chatCache = {
  warmCache,
  getCachedContext,
  updateCacheWithMessage,
  updateCacheWithDraft,
  invalidateCache,
  clearExpiredCaches,
  getCacheMetrics,
  clearAllCaches,
}

export default chatCache
