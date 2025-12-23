import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CaseOverviewPage from './pages/CaseOverviewPage'
import UploadPage from './pages/UploadPage'
import EntitiesPage from './pages/EntitiesPage'
import CanvasPage from './pages/CanvasPage'
import DraftPage from './pages/DraftPage'
import HistoryPage from './pages/HistoryPage'
import ProtectedRoute from './components/common/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/case/:caseId" element={<CaseOverviewPage />} />
              <Route path="/case/:caseId/upload" element={<UploadPage />} />
              <Route path="/case/:caseId/entities" element={<EntitiesPage />} />
              <Route path="/case/:caseId/canvas" element={<CanvasPage />} />
              <Route path="/case/:caseId/draft" element={<DraftPage />} />
              <Route path="/case/:caseId/history" element={<HistoryPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
