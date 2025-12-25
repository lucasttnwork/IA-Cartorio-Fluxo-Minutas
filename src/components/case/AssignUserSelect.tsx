import { UserIcon } from '@heroicons/react/24/outline'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUsers } from '@/hooks/useUsers'
import { useUpdateCase } from '@/hooks/useCases'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

interface AssignUserSelectProps {
  caseId: string
  currentAssignedTo: string | null
  disabled?: boolean
}

export function AssignUserSelect({
  caseId,
  currentAssignedTo,
  disabled = false,
}: AssignUserSelectProps) {
  const { data: users, isLoading: isLoadingUsers } = useUsers()
  const { mutate: updateCase, isPending: isUpdating } = useUpdateCase()
  const { appUser } = useAuth()

  const handleAssignmentChange = (userId: string) => {
    // If "unassigned" is selected, set to null
    const assignedTo = userId === 'unassigned' ? null : userId

    updateCase({
      id: caseId,
      assigned_to: assignedTo,
    })
  }

  // Check if current user can assign cases (supervisor or admin)
  const canAssign = appUser?.role === 'supervisor' || appUser?.role === 'admin'

  if (isLoadingUsers) {
    return (
      <div className="flex items-center gap-2">
        <UserIcon className="w-4 h-4 text-gray-400" />
        <Skeleton className="h-10 w-48" />
      </div>
    )
  }

  // Find currently assigned user
  const assignedUser = users?.find((u) => u.id === currentAssignedTo)

  return (
    <div className="flex items-center gap-2">
      <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      <Select
        value={currentAssignedTo || 'unassigned'}
        onValueChange={handleAssignmentChange}
        disabled={disabled || isUpdating || !canAssign}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue>
            {assignedUser ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {assignedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="truncate">{assignedUser.full_name}</span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-3 h-3 text-gray-400" />
              </div>
              <span>Unassigned</span>
            </div>
          </SelectItem>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="truncate">{user.full_name}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!canAssign && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          (View only)
        </span>
      )}
    </div>
  )
}
