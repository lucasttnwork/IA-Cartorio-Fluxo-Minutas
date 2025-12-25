import { motion } from 'framer-motion'
import type { CanvasPresence } from '../../types'

interface UserCursorProps {
  presence: CanvasPresence
}

export function UserCursor({ presence }: UserCursorProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: presence.cursor_x,
        y: presence.cursor_y,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 300,
      }}
      style={{
        left: 0,
        top: 0,
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
        }}
      >
        <path
          d="M5.65376 12.3673L10.6689 16.2238C11.2714 16.6906 12.1298 16.5104 12.4788 15.8472L15.4437 10.5431C15.7629 9.93539 15.4796 9.18851 14.8268 8.92179L7.10268 5.68524C6.43992 5.41438 5.69531 5.78293 5.53329 6.48835L3.88487 13.6669C3.72715 14.3562 4.23259 14.9982 4.94296 14.9982H8.27659V20.0003C8.27659 20.5526 8.72431 21.0003 9.27659 21.0003H10.2766C10.8289 21.0003 11.2766 20.5526 11.2766 20.0003V14.9982H14.9429"
          fill={presence.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label */}
      <motion.div
        className="absolute top-6 left-4 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: presence.color,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {presence.user_name}
      </motion.div>
    </motion.div>
  )
}
