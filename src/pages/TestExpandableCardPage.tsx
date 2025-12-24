/**
 * Test page for ExpandableCard component
 *
 * Demonstrates various configurations and use cases:
 * - Basic expand/collapse
 * - With icons and badges
 * - Controlled state
 * - Disabled state
 * - Grouped cards with layout animation
 */

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ExpandableCard, ExpandableCardGroup } from '../components/common/ExpandableCard'
import {
  UserIcon,
  HomeModernIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function TestExpandableCardPage() {
  // Controlled state for demo
  const [controlledExpanded, setControlledExpanded] = useState(false)
  const [multipleExpanded, setMultipleExpanded] = useState<Record<string, boolean>>({
    notifications: true,
    security: false,
    preferences: false,
  })
  const [sessionTimeout, setSessionTimeout] = useState('15')
  const [language, setLanguage] = useState('pt')
  const [theme, setTheme] = useState('system')

  const toggleSection = (section: string) => {
    setMultipleExpanded(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Expandable Card Component
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Interactive cards with smooth expand/collapse animations
        </p>
      </div>

      {/* Basic Examples */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Basic Usage
        </h2>

        <ExpandableCard
          header={
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Simple Expandable Card
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click to expand and see the content
              </p>
            </div>
          }
        >
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-300">
              This is the expandable content. It can contain any React components,
              forms, lists, or other elements. The animation smoothly reveals this
              content when the header is clicked.
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nested content with different background
              </p>
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard
          header={
            <h3 className="font-medium text-gray-900 dark:text-white">
              Starts Expanded
            </h3>
          }
          defaultExpanded={true}
        >
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-300">
              This card is expanded by default using the <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">defaultExpanded</code> prop.
            </p>
          </div>
        </ExpandableCard>
      </section>

      {/* With Icons and Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          With Icons and Badges
        </h2>

        <ExpandableCard
          icon={<UserIcon className="w-5 h-5" />}
          header={
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Person Details
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                John Doe - Buyer
              </p>
            </div>
          }
          badge={<span className="badge badge-success">Verified</span>}
        >
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Full Name</span>
              <span className="text-gray-900 dark:text-white">John Doe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">CPF</span>
              <span className="text-gray-900 dark:text-white">123.456.789-00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Role</span>
              <span className="text-gray-900 dark:text-white">Buyer</span>
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard
          icon={<HomeModernIcon className="w-5 h-5" />}
          header={
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Property Information
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Apartment #1234 - Downtown
              </p>
            </div>
          }
          badge={<span className="badge badge-info">Residential</span>}
        >
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Address</span>
              <span className="text-gray-900 dark:text-white">123 Main Street, Apt 1234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Registration</span>
              <span className="text-gray-900 dark:text-white">12345</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Area</span>
              <span className="text-gray-900 dark:text-white">85 m&sup2;</span>
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard
          icon={<DocumentTextIcon className="w-5 h-5" />}
          header={
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Document Processing
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                3 documents uploaded
              </p>
            </div>
          }
          badge={<span className="badge badge-warning">Processing</span>}
        >
          <div className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">purchase_contract.pdf</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">id_document.pdf</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">property_deed.pdf</span>
              </div>
            </div>
          </div>
        </ExpandableCard>
      </section>

      {/* Controlled State */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Controlled State
        </h2>

        <div className="flex items-center gap-4 mb-2">
          <Button
            onClick={() => setControlledExpanded(!controlledExpanded)}
            size="sm"
          >
            {controlledExpanded ? 'Collapse' : 'Expand'} Card
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            State: {controlledExpanded ? 'Expanded' : 'Collapsed'}
          </span>
        </div>

        <ExpandableCard
          icon={<CogIcon className="w-5 h-5" />}
          header={
            <h3 className="font-medium text-gray-900 dark:text-white">
              Controlled Card
            </h3>
          }
          isExpanded={controlledExpanded}
          onExpandedChange={setControlledExpanded}
        >
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-300">
              This card's expand state is controlled externally. You can toggle it
              using the button above or by clicking the header.
            </p>
          </div>
        </ExpandableCard>
      </section>

      {/* Grouped Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Settings Panel (Grouped Cards)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Multiple expandable cards with smooth layout animations
        </p>

        <ExpandableCardGroup>
          <ExpandableCard
            icon={<BellIcon className="w-5 h-5" />}
            header={
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
            }
            isExpanded={multipleExpanded.notifications}
            onExpandedChange={() => toggleSection('notifications')}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates</p>
                </div>
                <button className="w-10 h-6 bg-blue-500 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</p>
                </div>
                <button className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard
            icon={<ShieldCheckIcon className="w-5 h-5" />}
            header={
              <h3 className="font-medium text-gray-900 dark:text-white">
                Security
              </h3>
            }
            isExpanded={multipleExpanded.security}
            onExpandedChange={() => toggleSection('security')}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-factor authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add extra security</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Session timeout</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Auto logout after inactivity</p>
                </div>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard
            icon={<InformationCircleIcon className="w-5 h-5" />}
            header={
              <h3 className="font-medium text-gray-900 dark:text-white">
                Preferences
              </h3>
            }
            isExpanded={multipleExpanded.preferences}
            onExpandedChange={() => toggleSection('preferences')}
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Language
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Theme
                </label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ExpandableCard>
        </ExpandableCardGroup>
      </section>

      {/* Disabled State */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Disabled State
        </h2>

        <ExpandableCard
          icon={<CogIcon className="w-5 h-5" />}
          header={
            <h3 className="font-medium text-gray-900 dark:text-white">
              Disabled Card
            </h3>
          }
          disabled={true}
        >
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-300">
              This content is hidden because the card is disabled.
            </p>
          </div>
        </ExpandableCard>
      </section>

      {/* Custom Animation Duration */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Custom Animation Duration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExpandableCard
            header={
              <h3 className="font-medium text-gray-900 dark:text-white">
                Fast Animation (0.15s)
              </h3>
            }
            animationDuration={0.15}
          >
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300">
                Quick animation for snappy interactions.
              </p>
            </div>
          </ExpandableCard>

          <ExpandableCard
            header={
              <h3 className="font-medium text-gray-900 dark:text-white">
                Slow Animation (0.5s)
              </h3>
            }
            animationDuration={0.5}
          >
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300">
                Slower, more dramatic animation effect.
              </p>
            </div>
          </ExpandableCard>
        </div>
      </section>

      {/* Without Chevron */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Without Chevron
        </h2>

        <ExpandableCard
          header={
            <h3 className="font-medium text-gray-900 dark:text-white">
              No Chevron Indicator
            </h3>
          }
          showChevron={false}
        >
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-300">
              This card hides the chevron for a cleaner look.
              Still clickable to expand/collapse.
            </p>
          </div>
        </ExpandableCard>
      </section>
    </div>
  )
}
