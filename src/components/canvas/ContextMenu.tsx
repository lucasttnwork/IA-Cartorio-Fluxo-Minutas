import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  items: ContextMenuItem[]
  onClose: () => void
}

export default function ContextMenu({ isOpen, position, items, onClose }: ContextMenuProps) {
  // Close menu on escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Close menu on click outside
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, handleKeyDown])

  // Adjust position to keep menu within viewport
  const adjustedPosition = useCallback(() => {
    const menuWidth = 220
    const menuHeight = items.length * 48 + 16 // approximate height

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    return { x, y }
  }, [position, items.length])

  const finalPosition = adjustedPosition()

  return (
    <>
      {/* Backdrop to close menu on click outside */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            onContextMenu={(e) => {
              e.preventDefault()
              onClose()
            }}
          />
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 glass-popover py-2 min-w-[220px]"
            style={{
              left: `${finalPosition.x}px`,
              top: `${finalPosition.y}px`,
            }}
          >
            {items.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick()
                      onClose()
                    }
                  }}
                  disabled={item.disabled}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-auto px-4 py-2.5 text-sm',
                    item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 mr-3" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
