import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronUpDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  const menuItems = [
    {
      label: 'View Profile',
      icon: UserCircleIcon,
      onClick: () => {
        // TODO: Navigate to profile page
      },
    },
    {
      label: 'Settings',
      icon: Cog6ToothIcon,
      onClick: () => {
        // TODO: Navigate to settings
      },
    },
    {
      label: 'Sign Out',
      icon: ArrowRightOnRectangleIcon,
      onClick: onSignOut,
      danger: true,
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full gap-3 h-auto',
            collapsed ? 'justify-center' : 'justify-start'
          )}
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
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={collapsed ? 'start' : 'end'}
        side={collapsed ? 'right' : 'top'}
        className="glass-popover w-56"
      >
        {/* User Info Header */}
        <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.full_name || 'User'}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.full_name || 'User'}
              </p>
              <div className="flex items-center gap-1">
                {user?.role && roleIcons[user.role]}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {roleLabels[user?.role || 'clerk'] || 'Clerk'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <div key={item.label}>
            {item.danger && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={cn(
                'gap-3 cursor-pointer',
                item.danger && 'text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600 dark:focus:text-red-400'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
