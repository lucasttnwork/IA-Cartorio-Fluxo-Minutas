import { Link } from 'react-router-dom'
import BrowserNavigation from '../components/common/BrowserNavigation'

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

      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Browser Navigation - UI Test Page
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This page demonstrates the browser back/forward navigation feature.
          Use the arrow buttons in the header to navigate through your browser history.
        </p>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click on the links below to navigate to different test pages</li>
            <li>Use the back arrow button (←) to go back in history</li>
            <li>Use the forward arrow button (→) to go forward after going back</li>
            <li>Try the keyboard shortcuts: <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">Alt + Left Arrow</kbd> and <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">Alt + Right Arrow</kbd></li>
          </ol>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Navigation Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/test-breadcrumb" className="btn-primary">
              Go to Breadcrumb Test
            </Link>
            <Link to="/test-avatar" className="btn-secondary">
              Go to Avatar Test
            </Link>
            <Link to="/test-upload" className="btn-secondary">
              Go to Upload Test
            </Link>
            <Link to="/login" className="btn-secondary">
              Go to Login
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Feature Checklist</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Back button with left arrow icon
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Forward button with right arrow icon
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Disabled state when navigation not available
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Keyboard shortcuts (Alt + Arrow keys)
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Hover and focus states with proper styling
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Tooltips with keyboard shortcut hints
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Proper accessibility with aria-labels
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Dark mode support
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
