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
import ConflictReviewPage from './pages/ConflictReviewPage'
import TestCaseCreationPage from './pages/TestCaseCreationPage'
import TestUploadPage from './pages/TestUploadPage'
import TestDocumentStatusPage from './pages/TestDocumentStatusPage'
import TestBreadcrumbPage from './pages/TestBreadcrumbPage'
import TestAvatarPage from './pages/TestAvatarPage'
import TestBrowserNavigationPage from './pages/TestBrowserNavigationPage'
import TestButtonDangerPage from './pages/TestButtonDangerPage'
import TestButtonSecondaryPage from './pages/TestButtonSecondaryPage'
import TestButtonPrimaryPage from './pages/TestButtonPrimaryPage'
import TestEvidenceModalPage from './pages/TestEvidenceModalPage'
import TestPersonEntityCardPage from './pages/TestPersonEntityCardPage'
import TestPropertyEntityCardPage from './pages/TestPropertyEntityCardPage'
import TestExpandableCardPage from './pages/TestExpandableCardPage'
import TestCurrencyPage from './pages/TestCurrencyPage'
import TestCanvasConnectionsPage from './pages/TestCanvasConnectionsPage'
import TestBatchConfirmationPage from './pages/TestBatchConfirmationPage'
import TestTiptapEditorPage from './pages/TestTiptapEditorPage'
import TestChatInterfacePage from './pages/TestChatInterfacePage'
import TestPendingItemsPage from './pages/TestPendingItemsPage'
import TestCaseDeletionPage from './pages/TestCaseDeletionPage'
import TestCaseSearchPage from './pages/TestCaseSearchPage'
import TestCheckboxRadioPage from './pages/TestCheckboxRadioPage'
import TestColorContrastPage from './pages/TestColorContrastPage'
import TestConfidenceBadgePage from './pages/TestConfidenceBadgePage'
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

          {/* Development test routes - bypasses auth for UI testing */}
          {import.meta.env.DEV && (
            <>
              <Route path="/test-case-creation" element={<TestCaseCreationPage />} />
              <Route path="/test-upload" element={<TestUploadPage />} />
              <Route path="/test-document-status" element={<TestDocumentStatusPage />} />
              <Route path="/test-breadcrumb" element={<TestBreadcrumbPage />} />
              <Route path="/test-avatar" element={<TestAvatarPage />} />
              <Route path="/test-browser-navigation" element={<TestBrowserNavigationPage />} />
              <Route path="/test-button-danger" element={<TestButtonDangerPage />} />
              <Route path="/test-button-secondary" element={<TestButtonSecondaryPage />} />
              <Route path="/test-button-primary" element={<TestButtonPrimaryPage />} />
              <Route path="/test-evidence-modal" element={<TestEvidenceModalPage />} />
              <Route path="/test-person-entity-card" element={<TestPersonEntityCardPage />} />
              <Route path="/test-property-entity-card" element={<TestPropertyEntityCardPage />} />
              <Route path="/test-expandable-card" element={<TestExpandableCardPage />} />
              <Route path="/test-currency" element={<TestCurrencyPage />} />
              <Route path="/test-canvas-connections" element={<TestCanvasConnectionsPage />} />
              <Route path="/test-batch-confirmation" element={<TestBatchConfirmationPage />} />
              <Route path="/test-tiptap-editor" element={<TestTiptapEditorPage />} />
              <Route path="/test-chat-interface" element={<TestChatInterfacePage />} />
              <Route path="/test-pending-items" element={<TestPendingItemsPage />} />
              <Route path="/test-case-deletion" element={<TestCaseDeletionPage />} />
              <Route path="/test-case-search" element={<TestCaseSearchPage />} />
              <Route path="/test-checkbox-radio" element={<TestCheckboxRadioPage />} />
              <Route path="/test-color-contrast" element={<TestColorContrastPage />} />
              <Route path="/test-confidence-badge" element={<TestConfidenceBadgePage />} />
            </>
          )}

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
              <Route path="/case/:caseId/conflicts" element={<ConflictReviewPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
