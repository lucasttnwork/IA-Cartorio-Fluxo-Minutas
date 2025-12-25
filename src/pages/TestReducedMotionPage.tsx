import { useState } from 'react'
import { ReducedMotionToggle } from '@/components/common/ReducedMotionToggle'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

/**
 * Test page for Reduced Motion preference
 *
 * This page demonstrates:
 * - Reduced motion toggle component
 * - Animation behavior with reduced motion enabled/disabled
 * - Various animated elements to test the preference
 */
export default function TestReducedMotionPage() {
  const { isReducedMotion, isLoaded, reset } = useReducedMotion()
  const [showSuccess, setShowSuccess] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reduced Motion Preference
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Test page for reduced motion accessibility feature
            </p>
          </div>
          <ReducedMotionToggle />
        </div>

        {/* Status Card */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Preference Loaded:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {isLoaded ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Reduced Motion:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {isReducedMotion ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">System Preference:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'Reduce'
                  : 'No preference'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Root Class:</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {document.documentElement.classList.contains('reduced-motion')
                  ? '.reduced-motion'
                  : 'none'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={reset} variant="outline" size="sm">
              Reset to System Preference
            </Button>
          </div>
        </div>

        {/* Animation Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Animation Examples
          </h2>

          {/* Fade In Animation */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fade In Animation
            </h3>
            <div className="animate-fade-in p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <p className="text-blue-900 dark:text-blue-200">
                This element uses <code className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">animate-fade-in</code>
              </p>
            </div>
          </div>

          {/* Pulse Animation */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pulse Animation
            </h3>
            <div className="flex items-center gap-4">
              <div className="animate-pulse-subtle p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <p className="text-purple-900 dark:text-purple-200">
                  Subtle pulse animation
                </p>
              </div>
            </div>
          </div>

          {/* Success Message Animation */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Success Message with Slide Animation
            </h3>
            <Button
              onClick={() => {
                setShowSuccess(false)
                setTimeout(() => setShowSuccess(true), 10)
              }}
            >
              Show Success Message
            </Button>
            {showSuccess && (
              <div className="mt-4 animate-form-error-slide-in flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200">
                  Success! This message slides in.
                </span>
              </div>
            )}
          </div>

          {/* Hover Animations */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hover Scale Animation
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="card-hover p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Hover me</p>
              </div>
              <div className="card-hover p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Hover me</p>
              </div>
              <div className="card-hover p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-pink-400 to-red-500 rounded-full" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Hover me</p>
              </div>
            </div>
          </div>

          {/* Button Animations */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Button Transitions
            </h3>
            <div className="flex gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-card p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-4">
            Testing Instructions
          </h2>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300">
            <li>
              <strong>1.</strong> Click the reduced motion toggle button in the top right corner
            </li>
            <li>
              <strong>2.</strong> Observe how animations change when reduced motion is enabled
            </li>
            <li>
              <strong>3.</strong> With reduced motion enabled:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Fade in animations should be instant</li>
                <li>• Pulse animations should be disabled</li>
                <li>• Hover scale effects should be disabled</li>
                <li>• All transitions should be near-instant</li>
              </ul>
            </li>
            <li>
              <strong>4.</strong> The preference is saved to localStorage and persists across sessions
            </li>
            <li>
              <strong>5.</strong> System preference is automatically detected on first visit
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
