import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronUpDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import Avatar from './Avatar'
import type { User } from '../../types'

interface UserProfileDropdownProps {
  user: User | null
  onSignOut: () => void
  collapsed?: boolean
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  clerk: 'Clerk',
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheckIcon className="w-3 h-3" />,
  supervisor: <ShieldCheckIcon className="w-3 h-3" />,
  clerk: null,
}

export default function UserProfileDropdown({
  user,
  onSignOut,
  collapsed = false
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const menuItems = [
    {
      label: 'View Profile',
      icon: UserCircleIcon,
      onClick: () => {
        // TODO: Navigate to profile page
        setIsOpen(false)
      },
    },
    {
      label: 'Settings',
      icon: Cog6ToothIcon,
      onClick: () => {
        // TODO: Navigate to settings
        setIsOpen(false)
      },
    },
    {
      label: 'Sign Out',
      icon: ArrowRightOnRectangleIcon,
      onClick: () => {
        onSignOut()
        setIsOpen(false)
      },
      danger: true,
    },
  ]

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3
          p-2 rounded-lg
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          ${collapsed ? 'justify-center' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar
          name={user?.full_name || 'User'}
          size="sm"
          status="online"
        />

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.full_name || 'User'}
              </p>
              <div className="flex items-center gap-1">
                {user?.role && roleIcons[user.role]}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {roleLabels[user?.role || 'clerk'] || 'Clerk'}
                </p>
              </div>
            </div>
            <ChevronUpDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
              absolute z-50 w-56
              ${collapsed ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2 left-0 right-0'}
              bg-white dark:bg-gray-800
              rounded-lg shadow-lg
              border border-gray-200 dark:border-gray-700
              overflow-hidden
            `}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <Avatar
                  name={user?.full_name || 'User'}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {roleLabels[user?.role || 'clerk'] || 'Clerk'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5
                    text-sm text-left
                    transition-colors duration-150
                    ${item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
