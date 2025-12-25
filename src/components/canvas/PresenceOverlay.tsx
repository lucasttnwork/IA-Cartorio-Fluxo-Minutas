import { AnimatePresence } from 'framer-motion'
import { UserCursor } from './UserCursor'
import type { PresenceState } from '../../types'

interface PresenceOverlayProps {
  presenceState: PresenceState
}

export function PresenceOverlay({ presenceState }: PresenceOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {Object.values(presenceState).map((presence) => (
          <UserCursor key={presence.user_id} presence={presence} />
        ))}
      </AnimatePresence>
    </div>
  )
}
