import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import BrowserNavigation from '../components/common/BrowserNavigation'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function TestBrowserNavigationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simulated header with browser navigation */}
      <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <BrowserNavigation />
          <span className="text-gray-600 dark:text-gray-300">Browser Navigation Test</span>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Browser Navigation - UI Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page demonstrates the browser back/forward navigation feature.
            Use the arrow buttons in the header to navigate through your browser history.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Click on the links below to navigate to different test pages</li>
              <li>Use the back arrow button (←) to go back in history</li>
              <li>Use the forward arrow button (→) to go forward after going back</li>
              <li>
                Try the keyboard shortcuts:{' '}
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  Alt + Left Arrow
                </kbd>
                {' '}and{' '}
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  Alt + Right Arrow
                </kbd>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Navigation Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/test-breadcrumb">Go to Breadcrumb Test</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/test-avatar">Go to Avatar Test</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/test-upload">Go to Upload Test</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Feature Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Back button with left arrow icon
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Forward button with right arrow icon
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Disabled state when navigation not available
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Keyboard shortcuts (Alt + Arrow keys)
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Hover and focus states with proper styling
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Tooltips with keyboard shortcut hints
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Proper accessibility with aria-labels
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                Dark mode support
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
