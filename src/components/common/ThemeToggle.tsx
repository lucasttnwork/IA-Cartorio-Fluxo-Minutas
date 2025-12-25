import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useDarkMode } from '@/hooks/useDarkMode'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

/**
 * Theme Toggle Switch Component
 *
 * Displays a toggle switch that controls light and dark modes
 * Shows appropriate icon based on current theme
 */
export function ThemeToggle() {
  const { isDark, isLoaded, toggle } = useDarkMode()

  if (!isLoaded) {
    return null // Don't render until theme is loaded
  }

  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="theme-toggle"
        className="sr-only"
      >
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </Label>
      <div className="flex items-center gap-2">
        <SunIcon
          className={`w-4 h-4 transition-colors ${
            isDark ? 'text-gray-400' : 'text-yellow-500'
          }`}
          aria-hidden="true"
        />
        <Switch
          id="theme-toggle"
          checked={isDark}
          onCheckedChange={toggle}
          data-testid="theme-toggle"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        />
        <MoonIcon
          className={`w-4 h-4 transition-colors ${
            isDark ? 'text-blue-400' : 'text-gray-400'
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default ThemeToggle
