import Avatar, { AvatarProps } from './Avatar'

interface AvatarItem extends Omit<AvatarProps, 'size'> {
  id: string
}

interface AvatarGroupProps {
  avatars: AvatarItem[]
  max?: number
  size?: AvatarProps['size']
  className?: string
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
    <div className={`avatar-group ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id}
          name={avatar.name}
          src={avatar.src}
          size={size}
          status={avatar.status}
          className={`relative ${index > 0 ? '-ml-2' : ''}`}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            relative -ml-2
            ${size === 'xs' ? 'w-6 h-6 text-xs' : ''}
            ${size === 'sm' ? 'w-8 h-8 text-sm' : ''}
            ${size === 'md' ? 'w-10 h-10 text-sm' : ''}
            ${size === 'lg' ? 'w-12 h-12 text-base' : ''}
            ${size === 'xl' ? 'w-16 h-16 text-lg' : ''}
            rounded-full
            bg-gray-200 dark:bg-gray-700
            flex items-center justify-center
            font-medium text-gray-600 dark:text-gray-300
            ring-2 ring-white dark:ring-gray-800
          `}
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
