/**
 * EmptyStateIllustration Component
 *
 * Provides illustrated empty states for various scenarios.
 * Features SVG illustrations with theme-aware colors and animations.
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type IllustrationType = 'folder' | 'search' | 'chat' | 'upload' | 'entity' | 'document'

interface EmptyStateIllustrationProps {
  type: IllustrationType
  className?: string
  animate?: boolean
}

// Folder/Cases Illustration
function FolderIllustration({ animate = true }: { animate?: boolean }) {
  const MotionComponent = animate ? motion.svg : 'svg'

  return (
    <MotionComponent
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="80" className="fill-purple-100 dark:fill-purple-900/30" />

      {/* Folder Back */}
      <path
        d="M50 70 L50 140 C50 145 52 147 57 147 L143 147 C148 147 150 145 150 140 L150 70 Z"
        className="fill-purple-200 dark:fill-purple-800/50"
      />

      {/* Folder Tab */}
      <path
        d="M50 70 L50 60 C50 55 52 53 57 53 L80 53 L90 63 L143 63 C148 63 150 65 150 70 Z"
        className="fill-purple-300 dark:fill-purple-700"
      />

      {/* Folder Front */}
      <motion.path
        d="M55 75 L55 135 C55 138 56 140 59 140 L141 140 C144 140 145 138 145 135 L145 75 Z"
        className="fill-purple-400 dark:fill-purple-600"
        animate={animate ? {
          y: [0, -3, 0],
        } : undefined}
        transition={animate ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : undefined}
      />

      {/* Document Lines */}
      <motion.g
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 1 } : undefined}
        transition={animate ? { delay: 0.3 } : undefined}
      >
        <line x1="70" y1="95" x2="130" y2="95" className="stroke-white/60 dark:stroke-white/40" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="107" x2="120" y2="107" className="stroke-white/60 dark:stroke-white/40" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="119" x2="125" y2="119" className="stroke-white/60 dark:stroke-white/40" strokeWidth="3" strokeLinecap="round" />
      </motion.g>

      {/* Sparkles */}
      {animate && (
        <>
          <motion.circle
            cx="35"
            cy="60"
            r="2"
            className="fill-purple-400 dark:fill-purple-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          />
          <motion.circle
            cx="165"
            cy="85"
            r="2"
            className="fill-purple-400 dark:fill-purple-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
          />
          <motion.circle
            cx="160"
            cy="135"
            r="2"
            className="fill-purple-400 dark:fill-purple-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
          />
        </>
      )}
    </MotionComponent>
  )
}

// Search Illustration
function SearchIllustration({ animate = true }: { animate?: boolean }) {
  const MotionComponent = animate ? motion.svg : 'svg'

  return (
    <MotionComponent
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="80" className="fill-blue-100 dark:fill-blue-900/30" />

      {/* Search Circle */}
      <motion.circle
        cx="90"
        cy="90"
        r="35"
        className="stroke-blue-500 dark:stroke-blue-400 fill-none"
        strokeWidth="6"
        animate={animate ? {
          scale: [1, 1.05, 1],
        } : undefined}
        transition={animate ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : undefined}
      />

      {/* Search Handle */}
      <motion.line
        x1="117"
        y1="117"
        x2="140"
        y2="140"
        className="stroke-blue-500 dark:stroke-blue-400"
        strokeWidth="6"
        strokeLinecap="round"
        animate={animate ? {
          rotate: [0, 5, 0],
        } : undefined}
        transition={animate ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : undefined}
        style={{ transformOrigin: '117px 117px' }}
      />

      {/* Question Mark */}
      <motion.g
        initial={animate ? { opacity: 0, y: 10 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={animate ? { delay: 0.3 } : undefined}
      >
        <path
          d="M 85 80 Q 90 70 95 80 Q 95 85 90 88 L 90 93"
          className="stroke-blue-300 dark:stroke-blue-600 fill-none"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="90" cy="100" r="2" className="fill-blue-300 dark:fill-blue-600" />
      </motion.g>

      {/* Sparkles */}
      {animate && (
        <>
          <motion.circle
            cx="45"
            cy="65"
            r="2"
            className="fill-blue-400 dark:fill-blue-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          />
          <motion.circle
            cx="155"
            cy="95"
            r="2"
            className="fill-blue-400 dark:fill-blue-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
          />
        </>
      )}
    </MotionComponent>
  )
}

// Chat Illustration
function ChatIllustration({ animate = true }: { animate?: boolean }) {
  const MotionComponent = animate ? motion.svg : 'svg'

  return (
    <MotionComponent
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="80" className="fill-purple-100 dark:fill-purple-900/30" />

      {/* Message Bubble 1 */}
      <motion.g
        initial={animate ? { opacity: 0, x: -20 } : undefined}
        animate={animate ? { opacity: 1, x: 0 } : undefined}
        transition={animate ? { delay: 0.2 } : undefined}
      >
        <rect
          x="50"
          y="70"
          width="90"
          height="30"
          rx="15"
          className="fill-purple-300 dark:fill-purple-700"
        />
        <path
          d="M 60 100 L 55 108 L 68 100 Z"
          className="fill-purple-300 dark:fill-purple-700"
        />
        <line x1="65" y1="82" x2="120" y2="82" className="stroke-white/70 dark:stroke-white/50" strokeWidth="2" strokeLinecap="round" />
        <line x1="65" y1="90" x2="105" y2="90" className="stroke-white/70 dark:stroke-white/50" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Message Bubble 2 */}
      <motion.g
        initial={animate ? { opacity: 0, x: 20 } : undefined}
        animate={animate ? { opacity: 1, x: 0 } : undefined}
        transition={animate ? { delay: 0.4 } : undefined}
      >
        <rect
          x="60"
          y="115"
          width="90"
          height="30"
          rx="15"
          className="fill-purple-400 dark:fill-purple-600"
        />
        <path
          d="M 140 145 L 145 153 L 132 145 Z"
          className="fill-purple-400 dark:fill-purple-600"
        />
        <line x1="75" y1="127" x2="130" y2="127" className="stroke-white/70 dark:stroke-white/50" strokeWidth="2" strokeLinecap="round" />
        <line x1="75" y1="135" x2="115" y2="135" className="stroke-white/70 dark:stroke-white/50" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Sparkles */}
      {animate && (
        <>
          <motion.path
            d="M 100 50 L 102 55 L 107 57 L 102 59 L 100 64 L 98 59 L 93 57 L 98 55 Z"
            className="fill-purple-400 dark:fill-purple-500"
            animate={{ scale: [0, 1, 0.8, 1], rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.circle
            cx="40"
            cy="100"
            r="2"
            className="fill-purple-400 dark:fill-purple-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="160"
            cy="130"
            r="2"
            className="fill-purple-400 dark:fill-purple-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </>
      )}
    </MotionComponent>
  )
}

// Upload/Document Illustration
function UploadIllustration({ animate = true }: { animate?: boolean }) {
  const MotionComponent = animate ? motion.svg : 'svg'

  return (
    <MotionComponent
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="80" className="fill-green-100 dark:fill-green-900/30" />

      {/* Cloud */}
      <motion.g
        animate={animate ? {
          y: [0, -5, 0],
        } : undefined}
        transition={animate ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : undefined}
      >
        <path
          d="M 70 110 Q 65 105 70 100 Q 75 90 85 90 Q 90 82 100 82 Q 110 82 115 90 Q 125 90 130 100 Q 135 105 130 110 Z"
          className="fill-green-300 dark:fill-green-700"
        />
      </motion.g>

      {/* Upload Arrow */}
      <motion.g
        initial={animate ? { opacity: 0, y: 20 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={animate ? { delay: 0.3, duration: 0.5 } : undefined}
      >
        <line
          x1="100"
          y1="130"
          x2="100"
          y2="100"
          className="stroke-green-600 dark:stroke-green-400"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polyline
          points="90,110 100,100 110,110"
          className="stroke-green-600 dark:stroke-green-400 fill-none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Document Base */}
      <motion.rect
        x="85"
        y="135"
        width="30"
        height="8"
        rx="2"
        className="fill-green-400 dark:fill-green-600"
        initial={animate ? { scaleX: 0 } : undefined}
        animate={animate ? { scaleX: 1 } : undefined}
        transition={animate ? { delay: 0.5 } : undefined}
      />

      {/* Sparkles */}
      {animate && (
        <>
          <motion.circle
            cx="55"
            cy="95"
            r="2"
            className="fill-green-400 dark:fill-green-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          />
          <motion.circle
            cx="145"
            cy="115"
            r="2"
            className="fill-green-400 dark:fill-green-500"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
          />
        </>
      )}
    </MotionComponent>
  )
}

// Entity Illustration
function EntityIllustration({ animate = true }: { animate?: boolean }) {
  const MotionComponent = animate ? motion.svg : 'svg'

  return (
    <MotionComponent
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="80" className="fill-indigo-100 dark:fill-indigo-900/30" />

      {/* Person Icon */}
      <motion.g
        initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={animate ? { delay: 0.2 } : undefined}
      >
        <circle cx="100" cy="85" r="15" className="fill-indigo-400 dark:fill-indigo-600" />
        <path
          d="M 75 125 Q 75 105 100 105 Q 125 105 125 125 L 125 135 L 75 135 Z"
          className="fill-indigo-400 dark:fill-indigo-600"
        />
      </motion.g>

      {/* Property Icon */}
      <motion.g
        initial={animate ? { opacity: 0, x: 20 } : undefined}
        animate={animate ? { opacity: 1, x: 0 } : undefined}
        transition={animate ? { delay: 0.4 } : undefined}
      >
        <rect
          x="130"
          y="95"
          width="25"
          height="25"
          className="fill-indigo-300 dark:fill-indigo-700"
        />
        <path
          d="M 128 95 L 142.5 82 L 157 95 Z"
          className="fill-indigo-400 dark:fill-indigo-600"
        />
        <rect x="138" y="105" width="4" height="8" className="fill-indigo-500 dark:fill-indigo-500" />
        <rect x="146" y="105" width="4" height="8" className="fill-indigo-500 dark:fill-indigo-500" />
      </motion.g>

      {/* Connection Line */}
      <motion.line
        x1="115"
        y1="110"
        x2="130"
        y2="107"
        className="stroke-indigo-300 dark:stroke-indigo-700"
        strokeWidth="2"
        strokeDasharray="4 4"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { delay: 0.6, duration: 0.5 } : undefined}
      />
    </MotionComponent>
  )
}

// Document Illustration
function DocumentIllustration({ animate = true }: { animate?: boolean }) {
  const MotionComponent = animate ? motion.svg : 'svg'

  return (
    <MotionComponent
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="80" className="fill-gray-100 dark:fill-gray-800" />

      {/* Document */}
      <motion.g
        initial={animate ? { opacity: 0, y: 10 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={animate ? { delay: 0.2 } : undefined}
      >
        <rect
          x="65"
          y="60"
          width="70"
          height="90"
          rx="4"
          className="fill-white dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
          strokeWidth="2"
        />
        <path
          d="M 115 60 L 115 80 L 135 80 L 135 60 Z"
          className="fill-gray-200 dark:fill-gray-600"
        />
        <line x1="75" y1="90" x2="115" y2="90" className="stroke-gray-300 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
        <line x1="75" y1="100" x2="120" y2="100" className="stroke-gray-300 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
        <line x1="75" y1="110" x2="110" y2="110" className="stroke-gray-300 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
        <line x1="75" y1="120" x2="118" y2="120" className="stroke-gray-300 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
        <line x1="75" y1="130" x2="105" y2="130" className="stroke-gray-300 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </MotionComponent>
  )
}

export function EmptyStateIllustration({
  type,
  className = '',
  animate = true
}: EmptyStateIllustrationProps) {
  const illustrations: Record<IllustrationType, JSX.Element> = {
    folder: <FolderIllustration animate={animate} />,
    search: <SearchIllustration animate={animate} />,
    chat: <ChatIllustration animate={animate} />,
    upload: <UploadIllustration animate={animate} />,
    entity: <EntityIllustration animate={animate} />,
    document: <DocumentIllustration animate={animate} />
  }

  return (
    <div className={cn("w-32 h-32 mx-auto", className)} role="img" aria-label={`${type} illustration`}>
      {illustrations[type]}
    </div>
  )
}

export default EmptyStateIllustration
