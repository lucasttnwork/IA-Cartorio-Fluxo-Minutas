import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BuildingOfficeIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useOrganization } from '../hooks/useOrganization'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'

export default function OrganizationSettingsPage() {
  const { organization, isLoading, error, updateOrganization, isUpdating } = useOrganization()
  const { appUser } = useAuth()
  const [organizationName, setOrganizationName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Update local state when organization data loads
  useEffect(() => {
    if (organization) {
      setOrganizationName(organization.name)
    }
  }, [organization])

  const isAdmin = appUser?.role === 'admin'

  const handleNameChange = (value: string) => {
    setOrganizationName(value)
    setHasChanges(value !== organization?.name)
  }

  const handleSave = () => {
    if (!hasChanges || !organization) return

    updateOrganization(
      { name: organizationName },
      {
        onSuccess: () => {
          setHasChanges(false)
          toast.success('Settings updated', {
            description: 'Organization settings have been saved successfully.',
          })
        },
        onError: (error) => {
          console.error('Failed to update organization:', error)
          toast.error('Update failed', {
            description: 'Failed to save organization settings. Please try again.',
          })
        },
      }
    )
  }

  const handleReset = () => {
    if (organization) {
      setOrganizationName(organization.name)
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Organization Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </p>
          </div>
        </div>
        <Card className="glass-card animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Organization Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Failed to load organization
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Failed to load organization settings
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your organization configuration and preferences
          </p>
        </div>
      </div>

      {/* Admin notice */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-900/50">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Read-only mode
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Only administrators can modify organization settings. Contact your admin to make changes.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Basic Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Organization identity and basic details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  type="text"
                  value={organizationName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={!isAdmin || isUpdating}
                  className="mt-1"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <Label htmlFor="org-id">Organization ID</Label>
                <Input
                  id="org-id"
                  type="text"
                  value={organization.id}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This ID is used for API integrations and cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="org-created">Created At</Label>
                <Input
                  id="org-created"
                  type="text"
                  value={new Date(organization.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <Cog6ToothIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Settings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure system-wide preferences
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Additional system settings will be available in future updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Actions */}
      {isAdmin && hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-6 z-20"
        >
          <Card className="glass-card border-blue-200 dark:border-blue-800 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
                  <span>You have unsaved changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={isUpdating}
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
