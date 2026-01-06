/**
 * TestUserRolePermissionsPage
 *
 * Test page to demonstrate user role permissions for case approval.
 * Shows how clerks cannot approve cases, but supervisors and admins can.
 */

import { Card } from '@/components/ui/card'
import type { CaseStatus } from '../types'

export default function TestUserRolePermissionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="glass-card p-6 border-0 shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Role Permissions Feature
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This feature implements role-based permissions to prevent clerks from approving cases.
          </p>
        </Card>

        {/* Feature Overview */}
        <Card className="glass-card p-6 border-0 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Feature Overview
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              The <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">CaseStatusBadge</code> component
              now checks the current user's role before allowing status transitions.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Clerks</strong> can change case status to: Processing, Draft, or Archived
              </li>
              <li>
                <strong>Clerks cannot</strong> approve cases (transition to "Approved" status)
              </li>
              <li>
                <strong>Supervisors and Admins</strong> can perform all status transitions, including approval
              </li>
            </ul>
          </div>
        </Card>

        {/* Implementation Details */}
        <Card className="glass-card p-6 border-0 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Implementation Details
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                1. Role-Based Permission Check
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`// Helper function in CaseStatusBadge.tsx
const canUserTransitionToStatus = (
  userRole: 'clerk' | 'supervisor' | 'admin' | undefined,
  targetStatus: CaseStatus
): boolean => {
  if (!userRole) return false

  // Clerks cannot transition to 'approved' status
  if (userRole === 'clerk' && targetStatus === 'approved') {
    return false
  }

  // Supervisors and admins can perform all transitions
  return true
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                2. Filtered Transitions
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Available transitions are filtered based on the user's role:
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`// Filter transitions based on user role permissions
const allTransitions = validTransitions[currentStatus] || []
const availableTransitions = allTransitions.filter(status =>
  canUserTransitionToStatus(appUser?.role, status)
)`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                3. Visual Feedback
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                When a clerk opens the status dropdown, they see a warning message indicating that approval
                requires supervisor or admin role.
              </p>
            </div>
          </div>
        </Card>

        {/* User Experience */}
        <Card className="glass-card p-6 border-0 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            User Experience
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
                As a Clerk
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>You can see the case status badge</li>
                <li>You can click the badge to open a dropdown menu</li>
                <li>The dropdown shows: Processing, Draft, or Archived options (if valid from current status)</li>
                <li>The "Approved" option is NOT available</li>
                <li>A warning message appears: "Approval requires supervisor or admin role"</li>
                <li>If you somehow try to approve, you'll get an alert: "You do not have permission to approve cases"</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-medium text-green-900 dark:text-green-300 mb-2">
                As a Supervisor or Admin
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-200">
                <li>You see all the same options as a clerk</li>
                <li>Plus, you can see and select the "Approved" option</li>
                <li>No warning message appears</li>
                <li>You can approve cases without restrictions</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Testing Instructions */}
        <Card className="glass-card p-6 border-0 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How to Test
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p className="font-medium">To test this feature in the actual application:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Log in as a user with the "clerk" role</li>
              <li>Navigate to the Dashboard page</li>
              <li>Find a case with status "review"</li>
              <li>Click on the case status badge</li>
              <li>Observe that the "Approved" option is not in the dropdown</li>
              <li>See the warning message at the bottom of the dropdown</li>
              <li>Log out and log in as a supervisor or admin</li>
              <li>Repeat steps 2-4</li>
              <li>Observe that the "Approved" option is now available</li>
            </ol>
          </div>
        </Card>

        {/* Files Modified */}
        <Card className="glass-card p-6 border-0 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Files Modified
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                src/components/status/CaseStatusBadge.tsx
              </code>
              <span className="text-sm">- Added role-based permission logic</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                src/types/index.ts
              </code>
              <span className="text-sm">- User roles already defined (clerk, supervisor, admin)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
