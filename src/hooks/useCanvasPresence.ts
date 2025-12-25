import { useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { CanvasPresence, PresenceState } from '../types'

// Predefined colors for user cursors
const CURSOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

// Get a consistent color for a user ID
function getUserColor(userId: string): string {
  // Simple hash function to consistently assign colors
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length
  return CURSOR_COLORS[index]
}

interface UseCanvasPresenceOptions {
  caseId: string | undefined
  throttleMs?: number // How often to broadcast presence updates
}

export function useCanvasPresence({ caseId, throttleMs = 100 }: UseCanvasPresenceOptions) {
  const { user, appUser } = useAuth()
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastBroadcastRef = useRef<number>(0)
  const pendingPresenceRef = useRef<CanvasPresence | null>(null)

  // Broadcast cursor position (throttled)
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!user || !appUser || !caseId) return

      const now = Date.now()
      const presence: CanvasPresence = {
        user_id: user.id,
        user_name: appUser.full_name,
        cursor_x: x,
        cursor_y: y,
        color: getUserColor(user.id),
        last_updated: now,
      }

      // Throttle broadcasts
      if (now - lastBroadcastRef.current >= throttleMs) {
        channelRef.current?.track(presence)
        lastBroadcastRef.current = now
        pendingPresenceRef.current = null
      } else {
        // Store pending update
        pendingPresenceRef.current = presence
      }
    },
    [user, appUser, caseId, throttleMs]
  )

  // Set up presence channel
  useEffect(() => {
    if (!caseId || !user || !appUser) return

    const channelName = `canvas-presence:${caseId}`
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    // Subscribe to presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<CanvasPresence>()
        const newPresenceState: PresenceState = {}

        // Convert presence state to our format
        Object.entries(state).forEach(([userId, presences]) => {
          // Each user can have multiple presence instances, take the most recent
          if (presences && presences.length > 0) {
            const mostRecent = presences.reduce((latest, current) =>
              current.last_updated > latest.last_updated ? current : latest
            )
            // Don't include the current user
            if (userId !== user.id) {
              newPresenceState[userId] = mostRecent
            }
          }
        })

        setPresenceState(newPresenceState)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined canvas:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left canvas:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Set initial presence
          const initialPresence: CanvasPresence = {
            user_id: user.id,
            user_name: appUser.full_name,
            cursor_x: 0,
            cursor_y: 0,
            color: getUserColor(user.id),
            last_updated: Date.now(),
          }
          await channel.track(initialPresence)
        }
      })

    channelRef.current = channel

    // Flush any pending presence updates periodically
    const flushInterval = setInterval(() => {
      if (pendingPresenceRef.current) {
        channelRef.current?.track(pendingPresenceRef.current)
        lastBroadcastRef.current = Date.now()
        pendingPresenceRef.current = null
      }
    }, throttleMs)

    // Cleanup
    return () => {
      clearInterval(flushInterval)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [caseId, user, appUser, throttleMs])

  return {
    presenceState,
    broadcastCursor,
    myColor: user ? getUserColor(user.id) : null,
  }
}
