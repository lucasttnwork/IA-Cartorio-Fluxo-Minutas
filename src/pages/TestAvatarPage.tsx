import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Avatar from '../components/common/Avatar'
import AvatarGroup from '../components/common/AvatarGroup'
import UserProfileDropdown from '../components/common/UserProfileDropdown'
import type { User } from '../types'

const mockUser: User = {
  id: '1',
  organization_id: 'org-1',
  role: 'admin',
  full_name: 'Maria Silva Santos',
  created_at: new Date().toISOString(),
}

const mockUsers = [
  { id: '1', name: 'Maria Silva', status: 'online' as const },
  { id: '2', name: 'Joao Oliveira', status: 'busy' as const },
  { id: '3', name: 'Ana Costa', status: 'away' as const },
  { id: '4', name: 'Pedro Lima' },
  { id: '5', name: 'Carla Souza' },
  { id: '6', name: 'Lucas Ferreira' },
]

export default function TestAvatarPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Avatar & User Profile Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of the new avatar components and user profile styling.
          </p>
        </div>

        {/* Avatar Sizes */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Avatar Sizes</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="flex items-end gap-6">
            <div className="text-center">
              <Avatar name="Maria Silva" size="xs" />
              <p className="text-xs text-gray-500 mt-2">XS</p>
            </div>
            <div className="text-center">
              <Avatar name="Joao Oliveira" size="sm" />
              <p className="text-xs text-gray-500 mt-2">SM</p>
            </div>
            <div className="text-center">
              <Avatar name="Ana Costa" size="md" />
              <p className="text-xs text-gray-500 mt-2">MD</p>
            </div>
            <div className="text-center">
              <Avatar name="Pedro Lima" size="lg" />
              <p className="text-xs text-gray-500 mt-2">LG</p>
            </div>
            <div className="text-center">
              <Avatar name="Carla Souza" size="xl" />
              <p className="text-xs text-gray-500 mt-2">XL</p>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Avatar with Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Avatar with Status Indicator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
            <div className="text-center">
              <Avatar name="Online User" size="lg" status="online" />
              <p className="text-xs text-gray-500 mt-2">Online</p>
            </div>
            <div className="text-center">
              <Avatar name="Busy User" size="lg" status="busy" />
              <p className="text-xs text-gray-500 mt-2">Busy</p>
            </div>
            <div className="text-center">
              <Avatar name="Away User" size="lg" status="away" />
              <p className="text-xs text-gray-500 mt-2">Away</p>
            </div>
            <div className="text-center">
              <Avatar name="Offline User" size="lg" status="offline" />
              <p className="text-xs text-gray-500 mt-2">Offline</p>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Colors */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Avatar Colors (Based on Name)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Each avatar gets a consistent color based on the user's name.
            </p>
            <div className="flex flex-wrap gap-4">
            {['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Helena', 'Ivan', 'Julia'].map((name) => (
              <div key={name} className="text-center">
                <Avatar name={name} size="md" />
                <p className="text-xs text-gray-500 mt-1">{name}</p>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>

        {/* Avatar Group */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Avatar Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Small (max 4)
              </p>
              <AvatarGroup avatars={mockUsers} max={4} size="sm" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Medium (max 3)
              </p>
              <AvatarGroup avatars={mockUsers} max={3} size="md" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Large (max 5)
              </p>
              <AvatarGroup avatars={mockUsers} max={5} size="lg" />
            </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile Dropdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>User Profile Dropdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Click on the profile to see the dropdown menu.
            </p>
            <div className="flex gap-8">
            <div className="w-64 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Admin User</p>
              <UserProfileDropdown
                user={mockUser}
                onSignOut={() => alert('Sign out clicked!')}
              />
            </div>
            <div className="w-64 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Supervisor</p>
              <UserProfileDropdown
                user={{...mockUser, role: 'supervisor', full_name: 'Joao Oliveira'}}
                onSignOut={() => alert('Sign out clicked!')}
              />
            </div>
            <div className="w-64 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Clerk</p>
              <UserProfileDropdown
                user={{...mockUser, role: 'clerk', full_name: 'Ana Costa'}}
                onSignOut={() => alert('Sign out clicked!')}
              />
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Badges */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Role Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
            <span className="role-badge-admin">Administrator</span>
            <span className="role-badge-supervisor">Supervisor</span>
            <span className="role-badge-clerk">Clerk</span>
            </div>
          </CardContent>
        </Card>

        {/* Simulated Sidebar */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Sidebar User Profile (as it appears in the app)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Minuta Canvas
              </span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                <span className="w-5 h-5 mr-3">Home</span>
                Dashboard
              </div>
              <div className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-md">
                <span className="w-5 h-5 mr-3">Upload</span>
                Upload
              </div>
            </div>
            <div className="p-3 border-t dark:border-gray-700">
              <UserProfileDropdown
                user={mockUser}
                onSignOut={() => alert('Sign out clicked!')}
              />
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
