import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

/**
 * Theme Toggle Button Component
 *
 * Displays a button that toggles between light and dark modes
 * Shows appropriate icon based on current theme
 */
export function ThemeToggle() {
  const { isDark, isLoaded } = useDarkMode()
  const { toggle } = useDarkMode()

  if (!isLoaded) {
    return null // Don't render until theme is loaded
  }

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      className="relative rounded-full"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 text-yellow-400 transition-transform" />
      ) : (
        <MoonIcon className="w-5 h-5 text-slate-400 transition-transform" />
      )}
    </Button>
  )
}

export default ThemeToggle
