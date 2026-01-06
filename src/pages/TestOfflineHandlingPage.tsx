import { useState } from 'react'
import { useNetworkStatus, formatOfflineDuration } from '@/hooks/useNetworkStatus'
import { OfflineBanner } from '@/components/common/OfflineBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

/**
 * Test page for the network offline handling feature
 *
 * This page demonstrates:
 * - Real-time network status detection
 * - Offline banner display
 * - Back online notification with duration
 * - Manual simulation controls (for testing via DevTools)
 */
export default function TestOfflineHandlingPage() {
  const { isOnline, wasOffline, offlineSince, offlineDuration, clearWasOffline } = useNetworkStatus()
  const [showStandaloneBanner, setShowStandaloneBanner] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Standalone banner for demonstration */}
      {showStandaloneBanner && <OfflineBanner position="top" />}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Network Offline Handling Test
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test page to verify network status detection and offline banner functionality.
          </p>
        </div>

        {/* Current Status Card */}
        <Card data-testid="status-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiIcon className="h-5 w-5" />
              Current Network Status
            </CardTitle>
            <CardDescription>
              Real-time detection of your network connection state
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main status indicator */}
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
                }`}
                aria-hidden="true"
              />
              <div>
                <Badge
                  variant={isOnline ? 'default' : 'destructive'}
                  className="text-base px-4 py-1"
                  data-testid="status-badge"
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>

            {/* Status details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {isOnline ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                  )}
                  navigator.onLine
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white" data-testid="navigator-online">
                  {String(isOnline)}
                </p>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  Was Recently Offline
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white" data-testid="was-offline">
                  {String(wasOffline)}
                </p>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  Offline Since
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white" data-testid="offline-since">
                  {offlineSince ? offlineSince.toLocaleTimeString() : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  Last Offline Duration
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white" data-testid="offline-duration">
                  {offlineDuration ? formatOfflineDuration(offlineDuration) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
            <CardDescription>
              Follow these steps to test the offline handling feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Open DevTools</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Press F12 or right-click and select "Inspect"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Go to Network Tab</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click on the "Network" tab in DevTools
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Toggle Offline Mode</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Check/uncheck the "Offline" checkbox or select "Offline" from the throttling dropdown
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Observe the Banner</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    An amber banner should appear at the top when offline, and a green banner when back online
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Tip:</strong> You can also disconnect your Wi-Fi or unplug your ethernet cable to test real network disconnection. The browser will fire the appropriate events.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Banner Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Preview</CardTitle>
            <CardDescription>
              Preview of the offline and back-online banners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Offline Banner Preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Offline Banner (Amber)
              </h4>
              <div className="rounded-lg overflow-hidden shadow-md">
                <div className="bg-amber-500 dark:bg-amber-600 text-white">
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            Sem conexão com a internet
                          </p>
                          <p className="text-xs sm:text-sm text-amber-100 dark:text-amber-200 mt-0.5">
                            Algumas funcionalidades podem estar indisponíveis. Suas alterações serão salvas quando a conexão for restaurada.
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <WifiIcon className="h-6 w-6 text-amber-200 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Online Banner Preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Back Online Banner (Green)
              </h4>
              <div className="rounded-lg overflow-hidden shadow-md">
                <div className="bg-green-500 dark:bg-green-600 text-white">
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            Conexão restaurada
                          </p>
                          <p className="text-xs sm:text-sm text-green-100 dark:text-green-200 mt-0.5">
                            Você ficou offline por 2 minutos
                          </p>
                        </div>
                      </div>
                      <button
                        className="flex-shrink-0 p-1.5 rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
                        aria-label="Fechar notificação"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => setShowStandaloneBanner(!showStandaloneBanner)}
            variant="outline"
          >
            {showStandaloneBanner ? 'Hide' : 'Show'} Standalone Banner
          </Button>

          {wasOffline && (
            <Button onClick={clearWasOffline} variant="outline">
              Clear "Was Offline" Flag
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
