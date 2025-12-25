/**
 * Test page for realtime notifications
 * Demonstrates the notification system working with mock events
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { showToast } from '@/lib/toast'
import { useNotifications } from '@/hooks/useNotifications'
import {
  BellIcon,
  BellSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function TestRealtimeNotificationsPage() {
  const { enabled, enable, disable, isMutedForCurrentPage, muteCurrentPage, unmuteCurrentPage } =
    useNotifications()
  const [eventCount, setEventCount] = useState(0)

  const triggerDocumentUpload = () => {
    setEventCount((c) => c + 1)
    showToast.info('Documento enviado', 'CNH_João_Silva.pdf foi enviado com sucesso')
  }

  const triggerDocumentProcessing = () => {
    setEventCount((c) => c + 1)
    showToast.info('Processando documento', 'RG_Maria_Santos.pdf está sendo processado')
  }

  const triggerDocumentProcessed = () => {
    setEventCount((c) => c + 1)
    showToast.success('Documento processado', 'Escritura_Imovel.pdf foi processado com sucesso')
  }

  const triggerDocumentFailed = () => {
    setEventCount((c) => c + 1)
    showToast.error('Erro no processamento', 'Falha ao processar IPTU_2024.pdf')
  }

  const triggerJobComplete = () => {
    setEventCount((c) => c + 1)
    showToast.success('Processamento concluído', 'OCR finalizado com sucesso')
  }

  const triggerJobFailed = () => {
    setEventCount((c) => c + 1)
    showToast.error('Erro no processamento', 'Extração de entidades falhou: Timeout na API')
  }

  const triggerAllJobsComplete = () => {
    setEventCount((c) => c + 1)
    showToast.success(
      'Processamento finalizado',
      'Todos os documentos foram processados com sucesso'
    )
  }

  const triggerWarning = () => {
    setEventCount((c) => c + 1)
    showToast.warning('Atenção', 'Documento com baixa confiança de detecção (45%)')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Realtime Notifications Test
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test the realtime notification system with various event types
          </p>
        </div>

        {/* Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Controls</CardTitle>
            <CardDescription>
              Manage notification settings and test notification events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {enabled ? (
                <>
                  <BellIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Notifications Enabled
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You will receive realtime notifications
                    </p>
                  </div>
                  <Button onClick={disable} variant="outline" size="sm">
                    Disable
                  </Button>
                </>
              ) : (
                <>
                  <BellSlashIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Notifications Disabled
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You will not receive notifications
                    </p>
                  </div>
                  <Button onClick={enable} size="sm">
                    Enable
                  </Button>
                </>
              )}
            </div>

            {/* Page Mute */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {isMutedForCurrentPage ? (
                <>
                  <BellSlashIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Page Notifications Muted
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notifications are muted for this page only
                    </p>
                  </div>
                  <Button onClick={unmuteCurrentPage} variant="outline" size="sm">
                    Unmute Page
                  </Button>
                </>
              ) : (
                <>
                  <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Page Notifications Active
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You will receive notifications on this page
                    </p>
                  </div>
                  <Button onClick={muteCurrentPage} variant="outline" size="sm">
                    Mute Page
                  </Button>
                </>
              )}
            </div>

            {/* Event Counter */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Events Triggered
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {eventCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Events Card */}
        <Card>
          <CardHeader>
            <CardTitle>Test Notification Events</CardTitle>
            <CardDescription>Trigger various notification types to test the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Success Notifications */}
              <Button onClick={triggerDocumentProcessed} className="h-auto py-4 justify-start">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Document Processed</div>
                  <div className="text-xs opacity-80">Success notification</div>
                </div>
              </Button>

              <Button onClick={triggerJobComplete} className="h-auto py-4 justify-start">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Job Complete</div>
                  <div className="text-xs opacity-80">Success notification</div>
                </div>
              </Button>

              <Button onClick={triggerAllJobsComplete} className="h-auto py-4 justify-start">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">All Jobs Complete</div>
                  <div className="text-xs opacity-80">Success notification</div>
                </div>
              </Button>

              {/* Info Notifications */}
              <Button
                onClick={triggerDocumentUpload}
                variant="secondary"
                className="h-auto py-4 justify-start"
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Document Uploaded</div>
                  <div className="text-xs opacity-80">Info notification</div>
                </div>
              </Button>

              <Button
                onClick={triggerDocumentProcessing}
                variant="secondary"
                className="h-auto py-4 justify-start"
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Processing Started</div>
                  <div className="text-xs opacity-80">Info notification</div>
                </div>
              </Button>

              {/* Warning Notifications */}
              <Button
                onClick={triggerWarning}
                variant="outline"
                className="h-auto py-4 justify-start border-amber-300 dark:border-amber-700"
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-amber-600" />
                <div className="text-left">
                  <div className="font-medium">Low Confidence</div>
                  <div className="text-xs opacity-80">Warning notification</div>
                </div>
              </Button>

              {/* Error Notifications */}
              <Button
                onClick={triggerDocumentFailed}
                variant="destructive"
                className="h-auto py-4 justify-start"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Document Failed</div>
                  <div className="text-xs opacity-80">Error notification</div>
                </div>
              </Button>

              <Button
                onClick={triggerJobFailed}
                variant="destructive"
                className="h-auto py-4 justify-start"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Job Failed</div>
                  <div className="text-xs opacity-80">Error notification</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li>
                • <strong>Realtime Subscriptions:</strong> The app subscribes to Supabase realtime
                channels for document and job updates
              </li>
              <li>
                • <strong>Global Notifications:</strong> NotificationProvider wraps the app and
                listens for events
              </li>
              <li>
                • <strong>Debouncing:</strong> Notifications are debounced (2s) to prevent spam
              </li>
              <li>
                • <strong>Page Muting:</strong> Users can mute notifications for specific pages
              </li>
              <li>
                • <strong>Toast Library:</strong> Uses Sonner for beautiful, accessible toast
                notifications
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
