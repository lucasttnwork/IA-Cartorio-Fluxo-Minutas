import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { MoonIcon, SunIcon, BellIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

/**
 * Test page for Switch component
 * Demonstrates various switch states and use cases
 */
export function TestSwitchPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [privateMode, setPrivateMode] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Toggle Switch Component
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing switch component with various configurations
          </p>
        </div>

        {/* Basic Switches */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Basic Switches
          </h2>
          <div className="space-y-6">
            {/* Simple Switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="simple-switch" className="text-base font-medium">
                Simple Switch
              </Label>
              <Switch id="simple-switch" />
            </div>

            {/* Controlled Switch with State */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notifications ? (
                  <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <BellIcon className="w-5 h-5 text-gray-400" />
                )}
                <Label htmlFor="notifications" className="text-base font-medium">
                  Notifications
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="notifications-switch"
              />
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Label htmlFor="email" className="text-base font-medium">
                  Email Notifications
                </Label>
              </div>
              <Switch
                id="email"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? (
                  <MoonIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                )}
                <Label htmlFor="dark-mode" className="text-base font-medium">
                  Dark Mode
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
                data-testid="dark-mode-switch"
              />
            </div>
          </div>
        </Card>

        {/* Switch States */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Switch States
          </h2>
          <div className="space-y-6">
            {/* Default Unchecked */}
            <div className="flex items-center justify-between">
              <Label htmlFor="unchecked" className="text-base font-medium">
                Default (Unchecked)
              </Label>
              <Switch id="unchecked" defaultChecked={false} />
            </div>

            {/* Default Checked */}
            <div className="flex items-center justify-between">
              <Label htmlFor="checked" className="text-base font-medium">
                Default (Checked)
              </Label>
              <Switch id="checked" defaultChecked={true} />
            </div>

            {/* Disabled Unchecked */}
            <div className="flex items-center justify-between opacity-60">
              <Label htmlFor="disabled-unchecked" className="text-base font-medium">
                Disabled (Unchecked)
              </Label>
              <Switch id="disabled-unchecked" disabled defaultChecked={false} />
            </div>

            {/* Disabled Checked */}
            <div className="flex items-center justify-between opacity-60">
              <Label htmlFor="disabled-checked" className="text-base font-medium">
                Disabled (Checked)
              </Label>
              <Switch id="disabled-checked" disabled defaultChecked={true} />
            </div>
          </div>
        </Card>

        {/* Settings Panel Example */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Settings Panel
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Example of switches in a settings context
          </p>
          <div className="space-y-6">
            {/* Auto Save */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save" className="text-base font-medium">
                  Auto Save
                </Label>
                <Switch
                  id="auto-save"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically save your work every 5 minutes
              </p>
            </div>

            {/* Private Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="private" className="text-base font-medium">
                  Private Mode
                </Label>
                <Switch
                  id="private"
                  checked={privateMode}
                  onCheckedChange={setPrivateMode}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don't save your browsing history
              </p>
            </div>
          </div>
        </Card>

        {/* Current State Display */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current State
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dark Mode:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {darkMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Notifications:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {notifications ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email Notifications:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {emailNotifications ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Auto Save:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {autoSave ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Private Mode:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {privateMode ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </Card>

        {/* Accessibility Notes */}
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accessibility Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Keyboard navigation (Tab to focus, Space to toggle)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Focus-visible ring for keyboard users</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>ARIA attributes (role=&quot;switch&quot;, aria-checked)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Associated labels for screen readers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Proper disabled state styling</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default TestSwitchPage
