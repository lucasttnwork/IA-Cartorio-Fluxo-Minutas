import { useEffect, useState, useCallback } from 'react'

const THEME_KEY = 'theme-preference'
const DARK_CLASS = 'dark'

type Theme = 'light' | 'dark' | 'system'

/**
 * Custom hook for managing dark mode theme
 *
 * Features:
 * - localStorage persistence
 * - System preference detection (prefers-color-scheme)
 * - Automatic DOM update with 'dark' class on root element
 * - Prevents flash of unstyled content (FOUC)
 */
export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const initializeTheme = () => {
      // Get stored preference or fall back to system
      const stored = localStorage.getItem(THEME_KEY) as Theme | null
      const preference = stored || 'system'

      setTheme(preference)
      applyTheme(preference)
      setIsLoaded(true)
    }

    // Run initialization
    initializeTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const current = localStorage.getItem(THEME_KEY) as Theme | null
      if (current === 'system' || !current) {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  /**
   * Apply theme to DOM
   */
  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement
    let shouldBeDark = false

    if (newTheme === 'dark') {
      shouldBeDark = true
    } else if (newTheme === 'light') {
      shouldBeDark = false
    } else {
      // 'system' preference
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    if (shouldBeDark) {
      html.classList.add(DARK_CLASS)
    } else {
      html.classList.remove(DARK_CLASS)
    }

    setIsDark(shouldBeDark)
  }

  /**
   * Set theme preference
   */
  const setThemePreference = useCallback((newTheme: Theme) => {
    localStorage.setItem(THEME_KEY, newTheme)
    setTheme(newTheme)
    applyTheme(newTheme)
  }, [])

  /**
   * Toggle between light and dark
   * If system theme is set, switches to explicit light/dark
   */
  const toggle = useCallback(() => {
    if (theme === 'dark' || (theme === 'system' && isDark)) {
      setThemePreference('light')
    } else {
      setThemePreference('dark')
    }
  }, [theme, isDark, setThemePreference])

  /**
   * Reset to system preference
   */
  const reset = useCallback(() => {
    setThemePreference('system')
  }, [setThemePreference])

  return {
    theme,
    isDark,
    isLoaded,
    toggle,
    setTheme: setThemePreference,
    reset,
  }
}

/**
 * Initialize theme on page load to prevent flash
 *
 * Call this in a <script> tag in index.html before React loads
 * to prevent flash of wrong theme
 */
export function getThemeScript() {
  return `
    (function() {
      const theme = localStorage.getItem('theme-preference') || 'system';
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    })();
  `
}
