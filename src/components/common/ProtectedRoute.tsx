import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700 dark:border-blue-400"
          aria-label="Loading authentication status"
        ></div>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
