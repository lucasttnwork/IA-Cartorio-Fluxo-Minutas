import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { TabGroup, TabList, TabTrigger, TabPanels, TabPanel } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import {
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

export default function TestTabsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tabs Component Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of tab component variations for content organization and navigation.
          </p>
        </div>

        {/* Basic Tabs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Basic Tabs</CardTitle>
            <CardDescription>
              Simple tabs with text labels for organizing content into sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabGroup>
              <TabList>
                <TabTrigger>Account</TabTrigger>
                <TabTrigger>Settings</TabTrigger>
                <TabTrigger>Notifications</TabTrigger>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="py-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Account Settings
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage your account details, password, and security preferences.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">user@example.com</p>
                      </div>
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Role</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Administrator</p>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      General Settings
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Configure application preferences and display options.
                    </p>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-900 dark:text-white">Dark Mode</span>
                        <Badge>Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-900 dark:text-white">Language</span>
                        <Badge variant="outline">Português</Badge>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notification Preferences
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Control how and when you receive notifications.
                    </p>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-900 dark:text-white">Email Notifications</span>
                        <Badge>On</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-900 dark:text-white">Push Notifications</span>
                        <Badge variant="outline">Off</Badge>
                      </div>
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </CardContent>
        </Card>

        {/* Tabs with Icons */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tabs with Icons</CardTitle>
            <CardDescription>
              Enhanced tabs with icon labels for better visual recognition.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabGroup>
              <TabList>
                <TabTrigger>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </TabTrigger>
                <TabTrigger>
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Settings
                </TabTrigger>
                <TabTrigger>
                  <BellIcon className="w-4 h-4 mr-2" />
                  Alerts
                </TabTrigger>
                <TabTrigger>
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Security
                </TabTrigger>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="py-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Profile Information
                    </h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        Your profile is 80% complete. Add a profile picture to reach 100%.
                      </p>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Application Settings
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Configure system-wide settings and preferences.
                    </p>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Alert Center
                    </h3>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        You have 3 unread alerts from the past week.
                      </p>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Security Settings
                    </h3>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-sm text-green-900 dark:text-green-100">
                        Your account is secured with two-factor authentication.
                      </p>
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </CardContent>
        </Card>

        {/* Dashboard Style Tabs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Dashboard Style Tabs</CardTitle>
            <CardDescription>
              Tabs for dashboard views with metrics and data visualization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabGroup>
              <TabList>
                <TabTrigger>
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Overview
                </TabTrigger>
                <TabTrigger>
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Analytics
                </TabTrigger>
                <TabTrigger>
                  Documents
                </TabTrigger>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="py-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      System Overview
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                        <p className="text-sm opacity-90">Total Cases</p>
                        <p className="text-3xl font-bold mt-2">247</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
                        <p className="text-sm opacity-90">Active Users</p>
                        <p className="text-3xl font-bold mt-2">42</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
                        <p className="text-sm opacity-90">Documents</p>
                        <p className="text-3xl font-bold mt-2">1,834</p>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Analytics Dashboard
                    </h3>
                    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Documents
                    </h3>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Document {i}.pdf
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Updated 2 hours ago
                              </p>
                            </div>
                          </div>
                          <Badge>New</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </CardContent>
        </Card>

        {/* Accessibility Note */}
        <Card className="glass-card border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Accessibility Features
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              Keyboard navigation with arrow keys and Tab key
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              Focus indicators with visible ring outline
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              Screen reader compatible with ARIA labels
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              Support for dark mode with proper color contrast
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
