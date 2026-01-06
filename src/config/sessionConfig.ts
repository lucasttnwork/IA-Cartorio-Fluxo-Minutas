/**
 * Session timeout configuration
 *
 * This configuration controls automatic logout after user inactivity.
 */

export const SESSION_CONFIG = {
  // Timeout duration in milliseconds (default: 15 minutes)
  TIMEOUT_DURATION: 15 * 60 * 1000,

  // Warning duration before timeout (default: 2 minutes)
  WARNING_DURATION: 2 * 60 * 1000,

  // Activity check interval (default: 30 seconds)
  CHECK_INTERVAL: 30 * 1000,

  // Events that count as user activity
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart'],
} as const

/**
 * Get time remaining until session expires
 */
export function getTimeRemaining(lastActivity: number): number {
  const now = Date.now()
  const elapsed = now - lastActivity
  const remaining = SESSION_CONFIG.TIMEOUT_DURATION - elapsed
  return Math.max(0, remaining)
}

/**
 * Format milliseconds into a human-readable time string
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  return `${seconds}s`
}

/**
 * Check if warning should be shown
 */
export function shouldShowWarning(lastActivity: number): boolean {
  const remaining = getTimeRemaining(lastActivity)
  return remaining <= SESSION_CONFIG.WARNING_DURATION && remaining > 0
}

/**
 * Check if session has expired
 */
export function hasSessionExpired(lastActivity: number): boolean {
  return getTimeRemaining(lastActivity) === 0
}
