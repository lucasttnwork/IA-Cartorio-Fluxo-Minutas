import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  DocumentArrowUpIcon,
  UserGroupIcon,
  Square3Stack3DIcon,
  DocumentTextIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Upload', href: '/upload', icon: DocumentArrowUpIcon },
  { name: 'Entities', href: '/entities', icon: UserGroupIcon },
  { name: 'Canvas', href: '/canvas', icon: Square3Stack3DIcon },
  { name: 'Draft', href: '/draft', icon: DocumentTextIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
]

export default function TestResponsiveSidebarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Responsive Sidebar Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This page demonstrates the responsive sidebar implementation. Resize your browser window to see the sidebar collapse on mobile (&lt; 1024px) and expand on desktop (≥ 1024px).
        </p>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Minuta Canvas
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mobile Sidebar (visible on screens &lt; 1024px)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
          <div className="flex items-center h-16 px-4 border-b dark:border-gray-700">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Minuta Canvas
            </span>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Desktop Sidebar (visible on screens ≥ 1024px)
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header with hamburger menu */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Responsive Sidebar Demo
            </h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current width: <span className="font-mono font-bold" id="viewport-width">-</span>px
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-4xl space-y-6">
            {/* Feature List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Responsive Sidebar Features
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Mobile-First Design:</strong>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Sidebar is hidden by default on mobile devices (screens &lt; 1024px) and can be opened via hamburger menu
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Desktop Layout:</strong>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Sidebar is permanently visible on desktop screens (≥ 1024px) with fixed positioning
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Smooth Animations:</strong>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Mobile sidebar slides in/out with spring animation using Framer Motion
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Overlay Backdrop:</strong>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Dark overlay appears when mobile sidebar is open, dismisses sidebar when clicked
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Accessibility:</strong>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Proper ARIA labels, keyboard navigation support, and focus management
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Dark Mode Support:</strong>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Full dark mode styling with proper color tokens for both sidebar states
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Testing Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
                Testing Instructions
              </h3>
              <ol className="space-y-2 text-blue-800 dark:text-blue-300">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Resize your browser window to below 1024px width (or use mobile device/emulator)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Verify the hamburger menu button appears in the top-left corner</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Click the hamburger menu to open the sidebar</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Verify the sidebar slides in from the left with a dark overlay</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  <span>Click outside the sidebar (on the overlay) or the X button to close it</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">6.</span>
                  <span>Resize the window to 1024px or wider</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">7.</span>
                  <span>Verify the sidebar is permanently visible and hamburger menu is hidden</span>
                </li>
              </ol>
            </div>

            {/* Breakpoint Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Breakpoint Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Mobile View</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">&lt; 1024px (Tailwind: below 'lg')</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Desktop View</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">≥ 1024px (Tailwind: 'lg' and above)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Viewport width tracker */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function updateViewportWidth() {
            const el = document.getElementById('viewport-width');
            if (el) {
              el.textContent = window.innerWidth;
            }
          }
          updateViewportWidth();
          window.addEventListener('resize', updateViewportWidth);
        `
      }} />
    </div>
  )
}
