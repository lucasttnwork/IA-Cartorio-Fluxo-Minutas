import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useDarkMode } from '@/hooks/useDarkMode'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'

/**
 * Theme Toggle Switch Component
 *
 * Displays a toggle switch that controls light and dark modes
 * Shows appropriate icon based on current theme with enhanced visibility
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
        {isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      </Label>
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
        <SunIcon
          className={`w-5 h-5 transition-all duration-300 ${
            isDark
              ? 'text-gray-500 dark:text-gray-400 scale-90'
              : 'text-amber-500 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
          }`}
          aria-hidden="true"
        />
        <Switch
          id="theme-toggle"
          checked={isDark}
          onCheckedChange={toggle}
          data-testid="theme-toggle"
          aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-amber-400"
        />
        <MoonIcon
          className={`w-5 h-5 transition-all duration-300 ${
            isDark
              ? 'text-indigo-400 scale-110 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]'
              : 'text-gray-400 scale-90'
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default ThemeToggle
