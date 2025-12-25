import React, { useEffect, useState } from 'react'

interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive' | 'off'
  clearDelay?: number
}

/**
 * LiveRegion component announces dynamic content changes to screen readers.
 *
 * @param message - The message to announce
 * @param politeness - How urgently to announce (polite, assertive, or off)
 * @param clearDelay - Time in ms before clearing the message (default: 3000)
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  clearDelay = 3000
}: LiveRegionProps) {
  const [displayMessage, setDisplayMessage] = useState(message)

  useEffect(() => {
    setDisplayMessage(message)

    if (message && clearDelay > 0) {
      const timer = setTimeout(() => {
        setDisplayMessage('')
      }, clearDelay)

      return () => clearTimeout(timer)
    }
  }, [message, clearDelay])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {displayMessage}
    </div>
  )
}

/**
 * Hook to manage live region announcements
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('')

  const announce = (newMessage: string) => {
    setMessage(newMessage)
  }

  return { message, announce }
}
