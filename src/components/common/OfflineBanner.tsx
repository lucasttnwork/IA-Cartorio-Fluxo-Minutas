import { motion, AnimatePresence } from 'framer-motion'
import { WifiIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useNetworkStatus, formatOfflineDuration } from '@/hooks/useNetworkStatus'

interface OfflineBannerProps {
  /** Position of the banner */
  position?: 'top' | 'bottom'
  /** Additional CSS classes */
  className?: string
}

/**
 * OfflineBanner - Displays a notification banner when the user is offline
 *
 * Features:
 * - Shows a warning when the network connection is lost
 * - Shows a success message when back online with duration info
 * - Animated entrance/exit
 * - Accessible with proper ARIA attributes
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <OfflineBanner position="top" />
 * ```
 */
export function OfflineBanner({ position = 'top', className = '' }: OfflineBannerProps) {
  const { isOnline, wasOffline, offlineDuration, clearWasOffline } = useNetworkStatus()

  const showBanner = !isOnline || wasOffline

  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0'

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed left-0 right-0 z-50 ${positionClasses} ${className}`}
          role="alert"
          aria-live="assertive"
          data-testid="offline-banner"
        >
          {!isOnline ? (
            // Offline banner
            <div className="bg-amber-500 dark:bg-amber-600 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base" data-testid="offline-message">
                        Sem conexão com a internet
                      </p>
                      <p className="text-xs sm:text-sm text-amber-100 dark:text-amber-200 mt-0.5">
                        Algumas funcionalidades podem estar indisponíveis. Suas alterações serão salvas quando a conexão for restaurada.
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <WifiIcon className="h-6 w-6 text-amber-200 animate-pulse" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          ) : wasOffline ? (
            // Back online banner
            <div className="bg-green-500 dark:bg-green-600 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base" data-testid="online-message">
                        Conexão restaurada
                      </p>
                      {offlineDuration && (
                        <p className="text-xs sm:text-sm text-green-100 dark:text-green-200 mt-0.5">
                          Você ficou offline por {formatOfflineDuration(offlineDuration)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={clearWasOffline}
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-500"
                    aria-label="Fechar notificação"
                    data-testid="dismiss-online-banner"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner
