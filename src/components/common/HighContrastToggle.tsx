import { Button } from '@/components/ui/button'
import { useHighContrastMode } from '@/hooks/useHighContrastMode'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

/**
 * High Contrast Toggle Button Component
 *
 * Displays a button that toggles high contrast mode for better accessibility
 * Provides enhanced color contrast ratios for users with visual impairments
 */
export function HighContrastToggle() {
  const { isHighContrast, isLoaded, toggle } = useHighContrastMode()

  if (!isLoaded) {
    return null // Don't render until state is loaded
  }

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      className="relative rounded-full"
      title={isHighContrast ? 'Desativar modo alto contraste' : 'Ativar modo alto contraste'}
      data-testid="high-contrast-toggle"
      aria-label={isHighContrast ? 'Desativar modo alto contraste' : 'Ativar modo alto contraste'}
      aria-pressed={isHighContrast}
    >
      <AdjustmentsHorizontalIcon
        className={`w-5 h-5 transition-all ${
          isHighContrast
            ? 'text-blue-600 dark:text-blue-400 scale-110'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      />
      {isHighContrast && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full" />
      )}
    </Button>
  )
}

export default HighContrastToggle
