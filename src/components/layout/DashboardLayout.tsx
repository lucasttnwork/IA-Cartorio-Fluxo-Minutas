import { Outlet, NavLink, useParams } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import Breadcrumb from '../common/Breadcrumb'
import BrowserNavigation from '../common/BrowserNavigation'
import Avatar from '../common/Avatar'
import UserProfileDropdown from '../common/UserProfileDropdown'
import ThemeToggle from '../common/ThemeToggle'
import HighContrastToggle from '../common/HighContrastToggle'
import OfflineBanner from '../common/OfflineBanner'
import {
  HomeIcon,
  DocumentArrowUpIcon,
  UserGroupIcon,
  Square3Stack3DIcon,
  DocumentTextIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, caseRequired: false },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon, caseRequired: false },
]

const caseNavigation = [
  { name: 'Visão Geral', href: '', icon: HomeIcon },
  { name: 'Upload', href: '/upload', icon: DocumentArrowUpIcon },
  { name: 'Entidades', href: '/entities', icon: UserGroupIcon },
  { name: 'Canvas', href: '/canvas', icon: Square3Stack3DIcon },
  { name: 'Minuta', href: '/draft', icon: DocumentTextIcon },
  { name: 'Histórico', href: '/history', icon: ClockIcon },
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
      {/* Offline banner */}
      <OfflineBanner position="top" />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
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
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Minuta Canvas
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fechar menu de navegação"
              >
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <nav
              id="sidebar-navigation"
              className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin"
              aria-label="Navegação principal"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === `/case/${caseId}`}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                    }`
                  }
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                >
                  <item.icon
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
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
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col"
        aria-label="Barra lateral"
      >
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
          <div className="flex items-center h-16 px-4 border-b dark:border-gray-700">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Minuta Canvas
            </span>
          </div>
          <nav
            id="sidebar-navigation"
            className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin"
            aria-label="Navegação principal"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === `/case/${caseId}`}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                  }`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <item.icon
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t dark:border-gray-700">
            <UserProfileDropdown user={appUser} onSignOut={signOut} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-850/80 border-b border-gray-200/80 dark:border-gray-700/80 shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-800/95">
          <div className="flex items-center flex-1 gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200"
              aria-label="Abrir menu de navegação"
            >
              <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
            </button>
            {/* Browser back/forward navigation */}
            <div className="hidden sm:flex ml-0">
              <BrowserNavigation />
            </div>
            <div className="flex-1 ml-0 sm:ml-2">
              <Breadcrumb />
            </div>
          </div>
          {/* Theme toggle, high contrast toggle, and avatar */}
          <div className="flex items-center gap-2">
            <HighContrastToggle />
            <ThemeToggle />
            {/* Header avatar - visible on mobile */}
            <div className="lg:hidden">
              <Avatar
                name={appUser?.full_name || 'User'}
                size="sm"
                status="online"
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 lg:p-6" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
