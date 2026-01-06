import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FolderIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function TestDropdownMenuPage() {
  const [showNotifications, setShowNotifications] = useState(true)
  const [showEmails, setShowEmails] = useState(false)
  const [position, setPosition] = useState('bottom')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dropdown Menu Styling Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing enhanced dropdown menu styles with glassmorphism
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Dropdown */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Basic Dropdown Menu
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Open Menu
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-popover w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircleIcon className="w-4 h-4 mr-2" />
                  Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Sign Out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* File Actions Dropdown */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              File Actions
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  File Actions
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-popover w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    New Document
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FolderIcon className="w-4 h-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                  Upload
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Checkbox Items */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Checkbox Items
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Preferences
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-popover w-56">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showNotifications}
                  onCheckedChange={setShowNotifications}
                >
                  Show Notifications
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showEmails}
                  onCheckedChange={setShowEmails}
                >
                  Email Alerts
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  More Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Radio Items */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Radio Items
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Position: {position}
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-popover w-56">
                <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                  <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="left">Left</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Display */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Current State
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Show Notifications:</strong> {showNotifications ? 'Yes' : 'No'}</p>
            <p><strong>Email Alerts:</strong> {showEmails ? 'Yes' : 'No'}</p>
            <p><strong>Panel Position:</strong> {position}</p>
          </div>
        </div>

        {/* Dark Mode Toggle for Testing */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Theme Toggle
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              document.documentElement.classList.toggle('dark')
            }}
          >
            Toggle Dark Mode
          </Button>
        </div>
      </div>
    </div>
  )
}
