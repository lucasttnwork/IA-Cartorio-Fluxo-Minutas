import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  SESSION_CONFIG,
  getTimeRemaining,
  shouldShowWarning,
  hasSessionExpired,
} from '../config/sessionConfig'

export interface SessionTimeoutState {
  showWarning: boolean
  timeRemaining: number
  isExpired: boolean
}

export function useSessionTimeout() {
  const { user, signOut } = useAuth()
  const [state, setState] = useState<SessionTimeoutState>({
    showWarning: false,
    timeRemaining: SESSION_CONFIG.TIMEOUT_DURATION,
    isExpired: false,
  })

  const lastActivityRef = useRef<number>(Date.now())
  const checkIntervalRef = useRef<NodeJS.Timeout>()
  const activityThrottleRef = useRef<NodeJS.Timeout>()

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    // Throttle activity updates to avoid excessive re-renders
    if (activityThrottleRef.current) {
      clearTimeout(activityThrottleRef.current)
    }

    activityThrottleRef.current = setTimeout(() => {
      lastActivityRef.current = Date.now()

      // Reset warning if user becomes active again
      setState(prev => {
        if (prev.showWarning) {
          return {
            showWarning: false,
            timeRemaining: SESSION_CONFIG.TIMEOUT_DURATION,
            isExpired: false,
          }
        }
        return prev
      })
    }, 1000) // Throttle to 1 second
  }, [])

  // Extend session manually (from warning dialog)
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now()
    setState({
      showWarning: false,
      timeRemaining: SESSION_CONFIG.TIMEOUT_DURATION,
      isExpired: false,
    })
  }, [])

  // Check session status periodically
  useEffect(() => {
    if (!user) {
      return
    }

    const checkSession = () => {
      const remaining = getTimeRemaining(lastActivityRef.current)
      const showWarning = shouldShowWarning(lastActivityRef.current)
      const isExpired = hasSessionExpired(lastActivityRef.current)

      setState({
        showWarning,
        timeRemaining: remaining,
        isExpired,
      })

      // Auto-logout if session expired
      if (isExpired) {
        console.log('Session expired due to inactivity')
        signOut()
      }
    }

    // Check immediately
    checkSession()

    // Set up periodic checks
    checkIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.CHECK_INTERVAL)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [user, signOut])

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      return
    }

    const events = SESSION_CONFIG.ACTIVITY_EVENTS

    // Add event listeners for user activity
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })

      // Cleanup throttle timeout
      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current)
      }
    }
  }, [user, updateActivity])

  return {
    ...state,
    extendSession,
  }
}
