/**
 * ExpandableCard Component
 *
 * A reusable card component with smooth expand/collapse animation.
 * Uses framer-motion for fluid animations.
 *
 * Features:
 * - Smooth height animation for content
 * - Rotating chevron indicator
 * - Optional controlled/uncontrolled expand state
 * - Customizable header and content
 * - Supports header actions/badges
 */

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ExpandableCardProps {
  /** Header content - always visible */
  header: ReactNode
  /** Main content - shown when expanded */
  children: ReactNode
  /** Optional icon to show in header */
  icon?: ReactNode
  /** Optional badge or status indicator */
  badge?: ReactNode
  /** Optional action buttons in header */
  headerActions?: ReactNode
  /** Whether the card is expanded (controlled mode) */
  isExpanded?: boolean
  /** Callback when expand state changes */
  onExpandedChange?: (expanded: boolean) => void
  /** Whether the card starts expanded (uncontrolled mode) */
  defaultExpanded?: boolean
  /** Whether to show the expand/collapse chevron */
  showChevron?: boolean
  /** Additional class names for the card container */
  className?: string
  /** Additional class names for the header */
  headerClassName?: string
  /** Additional class names for the content */
  contentClassName?: string
  /** Animation duration in seconds */
  animationDuration?: number
  /** Whether the card is disabled (non-interactive) */
  disabled?: boolean
}

export function ExpandableCard({
  header,
  children,
  icon,
  badge,
  headerActions,
  isExpanded: controlledExpanded,
  onExpandedChange,
  defaultExpanded = false,
  showChevron = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  animationDuration = 0.25,
  disabled = false,
}: ExpandableCardProps) {
  // Handle controlled vs uncontrolled state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isControlled = controlledExpanded !== undefined
  const expanded = isControlled ? controlledExpanded : internalExpanded

  const handleToggle = () => {
    if (disabled) return

    if (isControlled) {
      onExpandedChange?.(!expanded)
    } else {
      setInternalExpanded(!expanded)
      onExpandedChange?.(!expanded)
    }
  }

  // Animation variants for content
  const contentVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: animationDuration, ease: 'easeInOut' },
        opacity: { duration: animationDuration * 0.6, ease: 'easeOut' },
      },
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: animationDuration, ease: 'easeInOut' },
        opacity: { duration: animationDuration * 0.6, delay: animationDuration * 0.2, ease: 'easeIn' },
      },
    },
  }

  // Animation variants for chevron
  const chevronVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 180 },
  }

  return (
    <Card className={cn('glass-card overflow-hidden', className)}>
      {/* Header - Always visible, clickable to toggle */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        className={cn(
          'w-full text-left p-4 flex items-center gap-3',
          'transition-colors duration-150',
          !disabled && 'cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50',
          disabled && 'cursor-default opacity-60',
          headerClassName
        )}
        aria-expanded={expanded}
        role="button"
        tabIndex={0}
      >
        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}

        {/* Header content */}
        <div className="flex-1 min-w-0">
          {header}
        </div>

        {/* Badge */}
        {badge && (
          <div className="flex-shrink-0">
            {badge}
          </div>
        )}

        {/* Header actions */}
        {headerActions && (
          <div
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}

        {/* Chevron indicator */}
        {showChevron && (
          <motion.div
            variants={chevronVariants}
            initial={false}
            animate={expanded ? 'expanded' : 'collapsed'}
            transition={{ duration: animationDuration, ease: 'easeInOut' }}
            className="flex-shrink-0 text-gray-400 dark:text-gray-500"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </motion.div>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={contentVariants}
            className="overflow-hidden"
          >
            <CardContent className={cn(
              'border-t border-white/20 dark:border-gray-700/50',
              contentClassName
            )}>
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/**
 * ExpandableCardGroup Component
 *
 * A wrapper for multiple ExpandableCards that ensures
 * smooth layout animations when cards expand/collapse.
 */
export interface ExpandableCardGroupProps {
  children: ReactNode
  /** Additional class names */
  className?: string
  /** Gap between cards (Tailwind gap class) */
  gap?: string
}

export function ExpandableCardGroup({
  children,
  className = '',
  gap = 'gap-4',
}: ExpandableCardGroupProps) {
  return (
    <motion.div
      layout
      className={cn('flex flex-col', gap, className)}
    >
      {children}
    </motion.div>
  )
}

export default ExpandableCard
