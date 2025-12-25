import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface NavigationState {
  canGoBack: boolean
  canGoForward: boolean
}

export default function BrowserNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [navigationState, setNavigationState] = useState<NavigationState>({
    canGoBack: false,
    canGoForward: false,
  })

  // Update navigation state when location changes
  useEffect(() => {
    // Check if we can go back/forward using the History API
    // Note: There's no direct way to check history length forward,
    // but we can track the navigation state
    const historyLength = window.history.length
    const currentIndex = window.history.state?.idx ?? 0

    setNavigationState({
      canGoBack: currentIndex > 0 || historyLength > 1,
      canGoForward: false, // Will be updated when user goes back
    })
  }, [location])

  // Track forward navigation availability
  useEffect(() => {
    const handlePopState = () => {
      const state = window.history.state
      setNavigationState(prev => ({
        ...prev,
        canGoBack: state?.idx > 0 || window.history.length > 1,
        canGoForward: state?.idx < window.history.length - 1,
      }))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleGoBack = useCallback(() => {
    navigate(-1)
    // After going back, forward should be available
    setNavigationState(prev => ({
      ...prev,
      canGoForward: true,
    }))
  }, [navigate])

  const handleGoForward = useCallback(() => {
    navigate(1)
  }, [navigate])

  // Handle keyboard shortcuts (Alt+Left and Alt+Right)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        if (navigationState.canGoBack) {
          handleGoBack()
        }
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        if (navigationState.canGoForward) {
          handleGoForward()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigationState, handleGoBack, handleGoForward])

  return (
    <div className="flex gap-1" role="navigation" aria-label="Browser history navigation">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleGoBack}
        disabled={!navigationState.canGoBack}
        aria-label="Go back"
        title="Go back (Alt + Left Arrow)"
      >
        <ArrowLeftIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleGoForward}
        disabled={!navigationState.canGoForward}
        aria-label="Go forward"
        title="Go forward (Alt + Right Arrow)"
      >
        <ArrowRightIcon className="size-4" />
      </Button>
    </div>
  )
}
