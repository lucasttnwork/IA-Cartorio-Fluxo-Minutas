import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import Breadcrumb from '../components/common/Breadcrumb'
import BrowserNavigation from '../components/common/BrowserNavigation'
import Avatar from '../components/common/Avatar'
import ThemeToggle from '../components/common/ThemeToggle'

export default function TestHeaderLayoutPage() {
  const [isDark, setIsDark] = useState(false)

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Header Layout and Styling Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This page demonstrates the enhanced header component with improved visual design.
            </p>
            <button
              onClick={() => setIsDark(!isDark)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Toggle Dark Mode
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Header Preview
            </h2>

            {/* Mock header */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
              <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-850/80 border-b border-gray-200/80 dark:border-gray-700/80 shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-800/95">
                <div className="flex items-center flex-1 gap-3">
                  <button
                    className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200"
                    aria-label="Open sidebar"
                  >
                    <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                  {/* Browser back/forward navigation */}
                  <div className="hidden sm:flex ml-0">
                    <BrowserNavigation />
                  </div>
                  <div className="flex-1 ml-0 sm:ml-2">
                    <Breadcrumb caseName="Sample Case" />
                  </div>
                </div>
                {/* Theme toggle and avatar */}
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  {/* Header avatar - visible on mobile */}
                  <div className="lg:hidden">
                    <Avatar
                      name="Test User"
                      size="sm"
                      status="online"
                    />
                  </div>
                </div>
              </header>

              {/* Mock content below header */}
              <div className="p-6 bg-white dark:bg-gray-800 h-96">
                <p className="text-gray-600 dark:text-gray-400">
                  Page content goes here...
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Features Implemented
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Enhanced visual styling with gradient background (white to gray-50 in light mode)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Improved shadow (shadow-md) for better depth perception</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Backdrop blur effect for modern glassmorphism look</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Improved spacing with gap-3 between elements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Enhanced button styling with rounded-lg and better hover states</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Improved accessibility with aria-label on menu button</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Consistent dark mode styling with proper color tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Responsive padding (px-4 sm:px-6) for better mobile experience</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
