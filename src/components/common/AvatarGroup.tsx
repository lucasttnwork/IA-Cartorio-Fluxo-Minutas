import Avatar, { AvatarProps } from './Avatar'
import { cn } from '@/lib/utils'

interface AvatarItem extends Omit<AvatarProps, 'size'> {
  id: string
}

interface AvatarGroupProps {
  avatars: AvatarItem[]
  max?: number
  size?: AvatarProps['size']
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export default function AvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
  className = ''
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id}
          name={avatar.name}
          src={avatar.src}
          size={size}
          status={avatar.status}
          className={cn('relative', index > 0 && '-ml-2')}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative -ml-2',
            sizeClasses[size],
            'rounded-full flex items-center justify-center',
            'bg-gray-200 dark:bg-gray-700',
            'font-medium text-gray-600 dark:text-gray-300',
            'ring-2 ring-white dark:ring-gray-800'
          )}
          title={`+${remainingCount} mais`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
