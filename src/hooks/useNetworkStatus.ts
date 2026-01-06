import { useEffect, useState, useCallback } from 'react'

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Whether the browser is currently online */
  isOnline: boolean
  /** Whether we've just come back online after being offline */
  wasOffline: boolean
  /** Timestamp when we last went offline */
  offlineSince: Date | null
  /** How long we were offline (in ms) - only available after coming back online */
  offlineDuration: number | null
}

/**
 * Custom hook for monitoring network connectivity status
 *
 * Features:
 * - Detects online/offline status using navigator.onLine and network events
 * - Tracks duration of offline periods
 * - Provides wasOffline flag for showing "back online" notifications
 * - Works across all modern browsers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, wasOffline, offlineDuration } = useNetworkStatus()
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />
 *   }
 *
 *   if (wasOffline) {
 *     return <div>You're back online! Offline for {offlineDuration}ms</div>
 *   }
 *
 *   return <div>Normal content</div>
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus & {
  /** Manually clear the wasOffline flag */
  clearWasOffline: () => void
} {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Initialize with current status
    // navigator.onLine can be undefined in some environments
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine
    }
    return true // Assume online if we can't detect
  })

  const [wasOffline, setWasOffline] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null)

  const handleOnline = useCallback(() => {
    setIsOnline(true)

    // Calculate how long we were offline
    if (offlineSince) {
      const duration = Date.now() - offlineSince.getTime()
      setOfflineDuration(duration)
      setWasOffline(true)

      // Auto-clear wasOffline after 5 seconds
      setTimeout(() => {
        setWasOffline(false)
        setOfflineDuration(null)
      }, 5000)
    }

    setOfflineSince(null)
  }, [offlineSince])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setOfflineSince(new Date())
    setWasOffline(false)
    setOfflineDuration(null)
  }, [])

  const clearWasOffline = useCallback(() => {
    setWasOffline(false)
    setOfflineDuration(null)
  }, [])

  useEffect(() => {
    // Sync state with navigator on mount
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      setIsOnline(navigator.onLine)
      if (!navigator.onLine) {
        setOfflineSince(new Date())
      }
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return {
    isOnline,
    wasOffline,
    offlineSince,
    offlineDuration,
    clearWasOffline,
  }
}

/**
 * Format offline duration into a human-readable string
 */
export function formatOfflineDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return 'alguns segundos'
  }

  const seconds = Math.floor(durationMs / 1000)
  if (seconds < 60) {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`
  }
  return `${hours} hora${hours !== 1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`
}
