/**
 * Production Supabase Configuration
 *
 * This module provides production-optimized configuration for the Supabase client,
 * including connection pooling, retry logic, and environment-specific settings.
 */

import type { SupabaseClientOptions } from '@supabase/supabase-js'
import { config, isProduction, isDevelopment } from '../config/environment'
import type { Database } from '../types/database'

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Retry configuration for failed requests
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxRetries: isProduction ? 3 : 1,

  /** Initial delay between retries in milliseconds */
  initialRetryDelayMs: 1000,

  /** Maximum delay between retries in milliseconds */
  maxRetryDelayMs: 10000,

  /** Multiplier for exponential backoff */
  backoffMultiplier: 2,

  /** HTTP status codes that should trigger a retry */
  retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const

/**
 * Connection configuration
 */
export const CONNECTION_CONFIG = {
  /** Request timeout in milliseconds */
  requestTimeout: isProduction ? 30000 : 60000,

  /** Realtime heartbeat interval in milliseconds */
  realtimeHeartbeatMs: 30000,

  /** Realtime reconnect delay in milliseconds */
  realtimeReconnectDelayMs: isProduction ? 1000 : 100,

  /** Maximum number of realtime reconnect attempts */
  realtimeMaxReconnects: 10,
} as const

/**
 * Auth configuration
 */
export const AUTH_CONFIG = {
  /** Whether to automatically refresh tokens */
  autoRefreshToken: true,

  /** Whether to persist session in storage */
  persistSession: true,

  /** Whether to detect session from URL (for OAuth callbacks) */
  detectSessionInUrl: true,

  /** Storage key for session data */
  storageKey: 'minuta-canvas-auth',

  /** Flow type for authentication */
  flowType: 'pkce' as const,
} as const

/**
 * Realtime configuration
 */
export const REALTIME_CONFIG = {
  /** Events per second limit */
  eventsPerSecond: isProduction ? 10 : 20,

  /** Broadcast self option */
  broadcastSelf: false,

  /** Acknowledgment option for broadcasts */
  ack: false,
} as const

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  /** Default bucket for documents */
  documentsBucket: 'documents',

  /** Default cache control header for uploads */
  defaultCacheControl: isProduction ? '31536000' : '3600', // 1 year in prod, 1 hour in dev

  /** Maximum file size in bytes (50MB) */
  maxFileSize: 50 * 1024 * 1024,

  /** Allowed MIME types for document uploads */
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],

  /** Default signed URL expiration in seconds */
  signedUrlExpiration: isProduction ? 3600 : 7200, // 1 hour in prod, 2 hours in dev
} as const

// ============================================================================
// Supabase Client Options Factory
// ============================================================================

/**
 * Create production-optimized Supabase client options
 *
 * @returns Configured SupabaseClientOptions for the Database type
 */
export function createSupabaseClientOptions(): SupabaseClientOptions<'public'> {
  return {
    auth: {
      autoRefreshToken: AUTH_CONFIG.autoRefreshToken,
      persistSession: AUTH_CONFIG.persistSession,
      detectSessionInUrl: AUTH_CONFIG.detectSessionInUrl,
      storageKey: AUTH_CONFIG.storageKey,
      flowType: AUTH_CONFIG.flowType,
      // Use localStorage for browser storage
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },

    realtime: {
      params: {
        eventsPerSecond: REALTIME_CONFIG.eventsPerSecond,
      },
    },

    global: {
      headers: {
        'x-application-name': config.app.name,
        'x-environment': config.app.environment,
      },
      // Custom fetch implementation with timeout
      fetch: createFetchWithTimeout(CONNECTION_CONFIG.requestTimeout),
    },

    db: {
      schema: 'public',
    },
  }
}

/**
 * Create a fetch function with timeout support
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Fetch function with timeout
 */
function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

// ============================================================================
// Retry Utilities
// ============================================================================

/**
 * Calculate delay for exponential backoff
 *
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number): number {
  const delay =
    RETRY_CONFIG.initialRetryDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt)
  return Math.min(delay, RETRY_CONFIG.maxRetryDelayMs)
}

/**
 * Check if a status code is retryable
 *
 * @param status - HTTP status code
 * @returns Whether the status code should trigger a retry
 */
export function isRetryableStatus(status: number): boolean {
  return (RETRY_CONFIG.retryableStatuses as readonly number[]).includes(status)
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Async function to execute
 * @param options - Optional retry configuration overrides
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<typeof RETRY_CONFIG>
): Promise<T> {
  const config = { ...RETRY_CONFIG, ...options }
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if we should retry
      if (attempt < config.maxRetries) {
        // Check if it's a retryable error
        const isRetryable =
          error instanceof Error &&
          (error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNRESET'))

        if (isRetryable) {
          const delay = calculateRetryDelay(attempt)

          if (isDevelopment) {
            console.warn(
              `Retrying operation (attempt ${attempt + 1}/${config.maxRetries}) after ${delay}ms`
            )
          }

          await sleep(delay)
          continue
        }
      }

      // Don't retry, throw the error
      throw error
    }
  }

  throw lastError || new Error('Operation failed after max retries')
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// Realtime Channel Configuration
// ============================================================================

/**
 * Configuration for creating realtime channels
 */
export interface RealtimeChannelConfig {
  /** Channel name */
  name: string

  /** Tables to subscribe to */
  tables: Array<{
    name: string
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    filter?: string
  }>

  /** Callback for connection status changes */
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void
}

/**
 * Default channel options for production
 */
export const DEFAULT_CHANNEL_OPTIONS = {
  config: {
    broadcast: {
      self: REALTIME_CONFIG.broadcastSelf,
      ack: REALTIME_CONFIG.ack,
    },
    presence: {
      key: '', // Will be set dynamically
    },
  },
} as const

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileForUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    const maxSizeMB = STORAGE_CONFIG.maxFileSize / (1024 * 1024)
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    }
  }

  if (!(STORAGE_CONFIG.allowedMimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${STORAGE_CONFIG.allowedMimeTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Generate a unique file path for storage
 *
 * @param caseId - Case ID
 * @param originalName - Original file name
 * @returns Unique file path
 */
export function generateStoragePath(caseId: string, originalName: string): string {
  const timestamp = Date.now()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${caseId}/${timestamp}-${sanitizedName}`
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Supabase error codes and their user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'O endereço de email fornecido é inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/email-already-in-use': 'Este email já está em uso.',
  'auth/weak-password': 'A senha é muito fraca.',
  'auth/expired-token': 'Sua sessão expirou. Por favor, faça login novamente.',

  // Database errors
  '23505': 'Este registro já existe.',
  '23503': 'Não é possível excluir este registro pois ele está sendo usado.',
  '42501': 'Você não tem permissão para realizar esta ação.',
  'PGRST301': 'Recurso não encontrado.',

  // Network errors
  'FetchError': 'Erro de conexão. Verifique sua internet.',
  'AbortError': 'A requisição demorou muito. Tente novamente.',

  // Default
  default: 'Ocorreu um erro inesperado. Tente novamente.',
} as const

/**
 * Get a user-friendly error message from a Supabase error
 *
 * @param error - Error object from Supabase
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.default

  // Handle Supabase errors
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string; name?: string }

    // Check for specific error codes
    if (err.code && ERROR_MESSAGES[err.code]) {
      return ERROR_MESSAGES[err.code]
    }

    // Check for error name (like AbortError)
    if (err.name && ERROR_MESSAGES[err.name]) {
      return ERROR_MESSAGES[err.name]
    }

    // Return the message if available
    if (err.message) {
      return err.message
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  return ERROR_MESSAGES.default
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Log Supabase client configuration (safe for logging, no secrets)
 */
export function logSupabaseConfig(): void {
  if (!isDevelopment) return

  console.log('Supabase Configuration:', {
    url: config.supabase.url,
    environment: config.app.environment,
    auth: AUTH_CONFIG,
    realtime: REALTIME_CONFIG,
    retry: RETRY_CONFIG,
    connection: CONNECTION_CONFIG,
  })
}

// ============================================================================
// Type Exports
// ============================================================================

export type { Database }

// ============================================================================
// Default Export
// ============================================================================

export default {
  createSupabaseClientOptions,
  RETRY_CONFIG,
  CONNECTION_CONFIG,
  AUTH_CONFIG,
  REALTIME_CONFIG,
  STORAGE_CONFIG,
  withRetry,
  validateFileForUpload,
  generateStoragePath,
  getErrorMessage,
  logSupabaseConfig,
}
