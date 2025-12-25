import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { BoltSlashIcon, BoltIcon } from '@heroicons/react/24/outline'

/**
 * Reduced Motion Toggle Button Component
 *
 * Displays a button that toggles reduced motion preference
 * Shows appropriate icon based on current state
 */
export function ReducedMotionToggle() {
  const { isReducedMotion, isLoaded, toggle } = useReducedMotion()

  if (!isLoaded) {
    return null // Don't render until preference is loaded
  }

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      className="relative rounded-full"
      title={isReducedMotion ? 'Enable animations' : 'Reduce motion'}
      data-testid="reduced-motion-toggle"
      aria-label={isReducedMotion ? 'Enable animations' : 'Reduce motion'}
    >
      {isReducedMotion ? (
        <BoltSlashIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <BoltIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </Button>
  )
}

export default ReducedMotionToggle
