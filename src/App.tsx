import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useReducedMotion } from './hooks/useReducedMotion'
import { NotificationProvider } from './contexts/NotificationContext'
import { RouteAnnouncer } from './components/common/RouteAnnouncer'
import { SkipNavigation } from './components/common/SkipNavigation'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import CaseOverviewPage from './pages/CaseOverviewPage'
import UploadPage from './pages/UploadPage'
import EntitiesPage from './pages/EntitiesPage'
import MergePersonsPage from './pages/MergePersonsPage'
import SplitPersonsPage from './pages/SplitPersonsPage'
import CanvasPage from './pages/CanvasPage'
import DraftPage from './pages/DraftPage'
import HistoryPage from './pages/HistoryPage'
import PurchaseSaleFlowPage from './pages/PurchaseSaleFlowPage'
import ConflictReviewPage from './pages/ConflictReviewPage'
import OrganizationSettingsPage from './pages/OrganizationSettingsPage'
import UserProfilePage from './pages/UserProfilePage'
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
import TestSourceDocumentChipsPage from './pages/TestSourceDocumentChipsPage'
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
import TestDatePickerPage from './pages/TestDatePickerPage'
import TestDisabledStatePage from './pages/TestDisabledStatePage'
import TestSwitchPage from './pages/TestSwitchPage'
import TestDocumentCardPage from './pages/TestDocumentCardPage'
import TestDocumentPreviewPage from './pages/TestDocumentPreviewPage'
import TestDocumentTypeBadgePage from './pages/TestDocumentTypeBadgePage'
import TestDraftSectionNavPage from './pages/TestDraftSectionNavPage'
import TestInlineEditPage from './pages/TestInlineEditPage'
import TestDraftTemplateSelectorPage from './pages/TestDraftTemplateSelectorPage'
import TestDraftVersionHistoryPage from './pages/TestDraftVersionHistoryPage'
import TestDropdownMenuPage from './pages/TestDropdownMenuPage'
import TestEmptyStatesPage from './pages/TestEmptyStatesPage'
import TestFormErrorMessagePage from './pages/TestFormErrorMessagePage'
import TestAuditTrailPage from './pages/TestAuditTrailPage'
import TestAuditExportPage from './pages/TestAuditExportPage'
import TestHistoryPage from './pages/TestHistoryPage'
import TestEvidenceChainPage from './pages/TestEvidenceChainPage'
import TestHeaderLayoutPage from './pages/TestHeaderLayoutPage'
import TestHighContrastModePage from './pages/TestHighContrastModePage'
import TestKeyboardNavigationPage from './pages/TestKeyboardNavigationPage'
import TestToastNotificationPage from './pages/TestToastNotificationPage'
import TestOrganizationSettingsPage from './pages/TestOrganizationSettingsPage'
import TestPrintDraftPage from './pages/TestPrintDraftPage'
import TestProgressPage from './pages/TestProgressPage'
import TestReducedMotionPage from './pages/TestReducedMotionPage'
import TestRealtimeNotificationsPage from './pages/TestRealtimeNotificationsPage'
import TestResponsiveSidebarPage from './pages/TestResponsiveSidebarPage'
import TestSessionTimeoutPage from './pages/TestSessionTimeoutPage'
import TestSkeletonPage from './pages/TestSkeletonPage'
import TestTabsPage from './pages/TestTabsPage'
import TestUserRolePermissionsPage from './pages/TestUserRolePermissionsPage'
import TestDeepLinkPage from './pages/TestDeepLinkPage'
import TestBatchOperationsPage from './pages/TestBatchOperationsPage'
import TestOfflineHandlingPage from './pages/TestOfflineHandlingPage'
import TestBulkUploadPage from './pages/TestBulkUploadPage'
import ProtectedRoute from './components/common/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Wrapper component to extract caseId from route params
function AppRoutes() {
  const location = useLocation()
  const params = useParams()

  // Extract caseId from route params if available
  const caseId = params.caseId || undefined

  return (
    <NotificationProvider caseId={caseId}>
      <SkipNavigation />
      <RouteAnnouncer />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
              <Route path="/test-source-document-chips" element={<TestSourceDocumentChipsPage />} />
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
              <Route path="/test-date-picker" element={<TestDatePickerPage />} />
              <Route path="/test-disabled-state" element={<TestDisabledStatePage />} />
              <Route path="/test-switch" element={<TestSwitchPage />} />
              <Route path="/test-document-card" element={<TestDocumentCardPage />} />
              <Route path="/test-document-preview" element={<TestDocumentPreviewPage />} />
              <Route path="/test-document-type-badge" element={<TestDocumentTypeBadgePage />} />
              <Route path="/test-draft-section-nav" element={<TestDraftSectionNavPage />} />
              <Route path="/test-inline-edit" element={<TestInlineEditPage />} />
              <Route path="/test-draft-template-selector" element={<TestDraftTemplateSelectorPage />} />
              <Route path="/test-draft-version-history" element={<TestDraftVersionHistoryPage />} />
              <Route path="/test-dropdown-menu" element={<TestDropdownMenuPage />} />
              <Route path="/test-empty-states" element={<TestEmptyStatesPage />} />
              <Route path="/test-form-error-message" element={<TestFormErrorMessagePage />} />
              <Route path="/test-audit-trail" element={<TestAuditTrailPage />} />
              <Route path="/test-audit-export" element={<TestAuditExportPage />} />
              <Route path="/test-history" element={<TestHistoryPage />} />
              <Route path="/test-evidence-chain" element={<TestEvidenceChainPage />} />
              <Route path="/test-header-layout" element={<TestHeaderLayoutPage />} />
              <Route path="/test-high-contrast-mode" element={<TestHighContrastModePage />} />
              <Route path="/test-keyboard-navigation" element={<TestKeyboardNavigationPage />} />
              <Route path="/test-toast-notification" element={<TestToastNotificationPage />} />
              <Route path="/test-organization-settings" element={<TestOrganizationSettingsPage />} />
              <Route path="/test-print-draft" element={<TestPrintDraftPage />} />
              <Route path="/test-progress" element={<TestProgressPage />} />
              <Route path="/test-reduced-motion" element={<TestReducedMotionPage />} />
              <Route path="/test-realtime-notifications" element={<TestRealtimeNotificationsPage />} />
              <Route path="/test-responsive-sidebar" element={<TestResponsiveSidebarPage />} />
              <Route path="/test-session-timeout" element={<TestSessionTimeoutPage />} />
              <Route path="/test-skeleton" element={<TestSkeletonPage />} />
              <Route path="/test-tabs" element={<TestTabsPage />} />
              <Route path="/test-user-role-permissions" element={<TestUserRolePermissionsPage />} />
              <Route path="/test-deep-link" element={<TestDeepLinkPage />} />
              <Route path="/test-batch-operations" element={<TestBatchOperationsPage />} />
              <Route path="/test-offline-handling" element={<TestOfflineHandlingPage />} />
              <Route path="/test-bulk-upload" element={<TestBulkUploadPage />} />
            </>
          )}

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<OrganizationSettingsPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/purchase-sale-flow" element={<PurchaseSaleFlowPage />} />
              <Route path="/case/:caseId" element={<CaseOverviewPage />} />
              <Route path="/case/:caseId/upload" element={<UploadPage />} />
              <Route path="/case/:caseId/entities" element={<EntitiesPage />} />
              <Route path="/case/:caseId/merge-persons" element={<MergePersonsPage />} />
              <Route path="/case/:caseId/split-persons" element={<SplitPersonsPage />} />
              <Route path="/case/:caseId/canvas" element={<CanvasPage />} />
              <Route path="/case/:caseId/draft" element={<DraftPage />} />
              <Route path="/case/:caseId/history" element={<HistoryPage />} />
              <Route path="/case/:caseId/conflicts" element={<ConflictReviewPage />} />
            </Route>
          </Route>
        </Routes>
      </AnimatePresence>
    </NotificationProvider>
  )
}

function App() {
  // Initialize reduced motion preference globally
  useReducedMotion()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
