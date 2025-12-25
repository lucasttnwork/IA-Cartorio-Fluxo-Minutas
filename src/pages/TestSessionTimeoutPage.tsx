import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Activity } from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '../hooks/useAuth'
import { SESSION_CONFIG, formatTimeRemaining } from '../config/sessionConfig'

export default function TestSessionTimeoutPage() {
  const { user, signIn, signOut } = useAuth()
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [timeRemaining, setTimeRemaining] = useState(SESSION_CONFIG.TIMEOUT_DURATION)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity
      const remaining = Math.max(0, SESSION_CONFIG.TIMEOUT_DURATION - elapsed)
      setTimeRemaining(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastActivity])

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now())

    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    return () => {
      SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [])

  async function handleLogin() {
    // Test login with demo credentials
    await signIn('test@example.com', 'password')
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Session Timeout Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Testing automatic session timeout after {SESSION_CONFIG.TIMEOUT_DURATION / 60000} minutes of inactivity
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Activity className="h-5 w-5" />
                    <span className="font-semibold">Logged In</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      User: {user.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-mono">
                        Time until timeout: {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                  </div>
                  <Button onClick={signOut} variant="outline">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Not logged in. Click below to log in and test the session timeout feature.
                  </p>
                  <Button onClick={handleLogin}>
                    Sign In (Demo)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600 dark:text-gray-400">Timeout Duration:</span>
                <span className="font-mono">{SESSION_CONFIG.TIMEOUT_DURATION / 60000} minutes</span>

                <span className="text-gray-600 dark:text-gray-400">Warning Duration:</span>
                <span className="font-mono">{SESSION_CONFIG.WARNING_DURATION / 60000} minutes</span>

                <span className="text-gray-600 dark:text-gray-400">Check Interval:</span>
                <span className="font-mono">{SESSION_CONFIG.CHECK_INTERVAL / 1000} seconds</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <ol className="list-decimal list-inside space-y-2">
                <li>Click "Sign In" to authenticate (if not already logged in)</li>
                <li>Stop interacting with the page (no mouse, keyboard, or scroll events)</li>
                <li>After {SESSION_CONFIG.TIMEOUT_DURATION / 60000 - SESSION_CONFIG.WARNING_DURATION / 60000} minutes, a warning modal will appear</li>
                <li>The warning will show a countdown timer</li>
                <li>You can click "Stay Logged In" to extend the session</li>
                <li>Or wait for the countdown to reach zero to be automatically logged out</li>
              </ol>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                Note: Any user activity (mouse movement, keyboard input, scrolling) will reset the timeout timer.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Activity Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                key={lastActivity}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 text-blue-700 dark:text-blue-300"
              >
                <Activity className="h-4 w-4" />
                <span className="text-sm">
                  Last activity detected: {new Date(lastActivity).toLocaleTimeString()}
                </span>
              </motion.div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Activity events: mousedown, keydown, scroll, touchstart
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
