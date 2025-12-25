import { useEffect, useState, useCallback } from 'react'

const REDUCED_MOTION_KEY = 'reduced-motion-preference'
const REDUCED_MOTION_CLASS = 'reduced-motion'

/**
 * Custom hook for managing reduced motion preference
 *
 * Features:
 * - localStorage persistence
 * - System preference detection (prefers-reduced-motion)
 * - Automatic DOM update with 'reduced-motion' class on root element
 * - Respects user accessibility preferences
 */
export function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize reduced motion from localStorage and system preference
  useEffect(() => {
    const initializeReducedMotion = () => {
      // Get stored preference or fall back to system
      const stored = localStorage.getItem(REDUCED_MOTION_KEY)
      const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // If user has explicitly set a preference, use that; otherwise use system preference
      const preference = stored !== null ? stored === 'true' : systemPreference

      setIsReducedMotion(preference)
      applyReducedMotion(preference)
      setIsLoaded(true)
    }

    // Run initialization
    initializeReducedMotion()

    // Listen for system reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      const stored = localStorage.getItem(REDUCED_MOTION_KEY)
      // Only auto-apply if user hasn't set a preference
      if (stored === null) {
        const newValue = mediaQuery.matches
        applyReducedMotion(newValue)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  /**
   * Apply reduced motion mode to DOM
   */
  const applyReducedMotion = (enabled: boolean) => {
    const html = document.documentElement

    if (enabled) {
      html.classList.add(REDUCED_MOTION_CLASS)
    } else {
      html.classList.remove(REDUCED_MOTION_CLASS)
    }

    setIsReducedMotion(enabled)
  }

  /**
   * Toggle reduced motion mode
   */
  const toggle = useCallback(() => {
    const newValue = !isReducedMotion
    localStorage.setItem(REDUCED_MOTION_KEY, String(newValue))
    applyReducedMotion(newValue)
  }, [isReducedMotion])

  /**
   * Set reduced motion mode explicitly
   */
  const setReducedMotion = useCallback((enabled: boolean) => {
    localStorage.setItem(REDUCED_MOTION_KEY, String(enabled))
    applyReducedMotion(enabled)
  }, [])

  /**
   * Reset to system preference
   */
  const reset = useCallback(() => {
    localStorage.removeItem(REDUCED_MOTION_KEY)
    const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    applyReducedMotion(systemPreference)
  }, [])

  return {
    isReducedMotion,
    isLoaded,
    toggle,
    setReducedMotion,
    reset,
  }
}

/**
 * Initialize reduced motion on page load to prevent flash
 *
 * Call this in a <script> tag in index.html before React loads
 */
export function getReducedMotionScript() {
  return `
    (function() {
      const stored = localStorage.getItem('reduced-motion-preference');
      const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const reducedMotion = stored !== null ? stored === 'true' : systemPreference;
      if (reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      }
    })();
  `
}
