import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/lib/toast'
import Avatar from '../components/common/Avatar'

export default function UserProfilePage() {
  const { appUser, user, changePassword, updateProfile } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState('')

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [fullName, setFullName] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password')
      return
    }

    setIsChanging(true)

    try {
      const { error } = await changePassword(newPassword)

      if (error) {
        setError(error.message)
      } else {
        // Clear form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')

        toast.success('Password changed', {
          description: 'Your password has been updated successfully.',
        })
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsChanging(false)
    }
  }

  const handleEditProfile = () => {
    setFullName(appUser?.full_name || '')
    setProfileError('')
    setIsEditingProfile(true)
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setFullName('')
    setProfileError('')
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')

    // Validation
    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty')
      return
    }

    if (fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters long')
      return
    }

    if (fullName === appUser?.full_name) {
      setProfileError('No changes detected')
      return
    }

    setIsUpdatingProfile(true)

    try {
      const { error } = await updateProfile(fullName.trim())

      if (error) {
        setProfileError(error.message)
      } else {
        setIsEditingProfile(false)
        setFullName('')

        toast.success('Profile updated', {
          description: 'Your profile information has been updated successfully.',
        })
      }
    } catch (err) {
      setProfileError('An unexpected error occurred')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    supervisor: 'Supervisor',
    clerk: 'Clerk',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            User Profile
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Profile Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your account details
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={appUser?.full_name || 'User'}
                    size="lg"
                  />
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {appUser?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {roleLabels[appUser?.role || 'clerk'] || 'Clerk'}
                    </p>
                  </div>
                </div>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProfile}
                    className="gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Profile Edit Form */}
              {isEditingProfile && (
                <form onSubmit={handleProfileUpdate} className="space-y-4 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                  {profileError && (
                    <Alert variant="destructive">
                      <ExclamationCircleIcon className="h-4 w-4" />
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isUpdatingProfile}
                      className="mt-1"
                      placeholder="Enter your full name"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This name will be displayed throughout the application
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile || !fullName.trim()}
                      className="flex-1"
                    >
                      {isUpdatingProfile ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isUpdatingProfile}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your email address cannot be changed
                </p>
              </div>

              {/* User ID */}
              <div>
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  type="text"
                  value={appUser?.id || ''}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
              </div>

              {/* Created At */}
              <div>
                <Label htmlFor="created-at">Member Since</Label>
                <Input
                  id="created-at"
                  type="text"
                  value={appUser?.created_at ? new Date(appUser.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : ''}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <KeyIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your password to keep your account secure
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isChanging}
                  className="mt-1"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isChanging}
                  className="mt-1"
                  placeholder="Enter new password (min. 8 characters)"
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isChanging}
                  className="mt-1"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full sm:w-auto"
                >
                  {isChanging ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Changing Password...
                    </span>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
