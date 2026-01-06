import { useEffect, useState, useCallback } from 'react'

const HIGH_CONTRAST_KEY = 'high-contrast-preference'
const HIGH_CONTRAST_CLASS = 'high-contrast'

/**
 * Custom hook for managing high contrast mode
 *
 * Features:
 * - localStorage persistence
 * - System preference detection (prefers-contrast: high)
 * - Automatic DOM update with 'high-contrast' class on root element
 * - Works alongside dark mode
 */
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize high contrast mode from localStorage and system preference
  useEffect(() => {
    const initializeHighContrast = () => {
      // Get stored preference or fall back to system
      const stored = localStorage.getItem(HIGH_CONTRAST_KEY)
      const preference = stored !== null ? stored === 'true' : false

      setIsHighContrast(preference)
      applyHighContrast(preference)
      setIsLoaded(true)
    }

    // Run initialization
    initializeHighContrast()

    // Listen for system high contrast preference changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handleChange = () => {
      const stored = localStorage.getItem(HIGH_CONTRAST_KEY)
      // Only auto-apply if user hasn't set a preference
      if (stored === null && mediaQuery.matches) {
        applyHighContrast(true)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  /**
   * Apply high contrast mode to DOM
   */
  const applyHighContrast = (enabled: boolean) => {
    const html = document.documentElement

    if (enabled) {
      html.classList.add(HIGH_CONTRAST_CLASS)
    } else {
      html.classList.remove(HIGH_CONTRAST_CLASS)
    }

    setIsHighContrast(enabled)
  }

  /**
   * Toggle high contrast mode
   */
  const toggle = useCallback(() => {
    const newValue = !isHighContrast
    localStorage.setItem(HIGH_CONTRAST_KEY, String(newValue))
    applyHighContrast(newValue)
  }, [isHighContrast])

  /**
   * Set high contrast mode explicitly
   */
  const setHighContrast = useCallback((enabled: boolean) => {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled))
    applyHighContrast(enabled)
  }, [])

  return {
    isHighContrast,
    isLoaded,
    toggle,
    setHighContrast,
  }
}

/**
 * Initialize high contrast mode on page load to prevent flash
 *
 * Call this in a <script> tag in index.html before React loads
 */
export function getHighContrastScript() {
  return `
    (function() {
      const highContrast = localStorage.getItem('high-contrast-preference') === 'true';
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
    })();
  `
}
