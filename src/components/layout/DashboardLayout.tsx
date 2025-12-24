import { Outlet, NavLink, useParams } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import Breadcrumb from '../common/Breadcrumb'
import BrowserNavigation from '../common/BrowserNavigation'
import Avatar from '../common/Avatar'
import UserProfileDropdown from '../common/UserProfileDropdown'
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, caseRequired: false },
]

const caseNavigation = [
  { name: 'Overview', href: '', icon: HomeIcon },
  { name: 'Upload', href: '/upload', icon: DocumentArrowUpIcon },
  { name: 'Entities', href: '/entities', icon: UserGroupIcon },
  { name: 'Canvas', href: '/canvas', icon: Square3Stack3DIcon },
  { name: 'Draft', href: '/draft', icon: DocumentTextIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { appUser, signOut } = useAuth()
  const { caseId } = useParams()

  const navItems = caseId
    ? caseNavigation.map((item) => ({
        ...item,
        href: `/case/${caseId}${item.href}`,
      }))
    : navigation

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === `/case/${caseId}`}
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
            {/* Mobile user profile */}
            <div className="p-3 border-t dark:border-gray-700">
              <UserProfileDropdown user={appUser} onSignOut={signOut} />
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
                end={item.href === `/case/${caseId}`}
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
          <div className="p-3 border-t dark:border-gray-700">
            <UserProfileDropdown user={appUser} onSignOut={signOut} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            {/* Browser back/forward navigation */}
            <div className="hidden sm:flex ml-2 lg:ml-0">
              <BrowserNavigation />
            </div>
            <div className="flex-1 ml-2 sm:ml-4">
              <Breadcrumb />
            </div>
          </div>
          {/* Header avatar - visible on mobile */}
          <div className="lg:hidden">
            <Avatar
              name={appUser?.full_name || 'User'}
              size="sm"
              status="online"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
