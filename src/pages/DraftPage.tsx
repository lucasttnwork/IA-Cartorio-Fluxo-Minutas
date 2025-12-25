/**
 * DraftPage Component
 *
 * Draft editor with integrated chat interface for conversational editing.
 * Features a two-panel layout with the Tiptap editor on the left and
 * the chat panel on the right.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TiptapEditor, DraftSectionNav, DraftTemplateSelector, DraftVersionHistory, DraftComparison } from '../components/editor'
import { ChatPanel } from '../components/chat'
import { chatService } from '../services/chat'
import { draftOperationsService } from '../services/draftOperations'
import { useDraftAutoSave } from '../hooks/useDraftAutoSave'
import { exportDraftAsHTML, exportDraftAsPDF, printDraft } from '../utils/exportDraft'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExclamationTriangleIcon, DocumentTextIcon, ClockIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'
import type { ChatMessage, ChatSession, PendingItem, ChatOperation, DraftTemplate, Draft } from '../types'

export default function DraftPage() {
  const { caseId } = useParams()
  const [content, setContent] = useState('')
  const [pendingItems, _setPendingItems] = useState<PendingItem[]>([])
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operationHistory, setOperationHistory] = useState<Array<{
    messageId: string
    operation: ChatOperation
    previousContent?: string
    timestamp: string
  }>>([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [draftVersions, setDraftVersions] = useState<Draft[]>([])
  const [currentVersion, setCurrentVersion] = useState<Draft | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonVersions, setComparisonVersions] = useState<{ versionA: Draft | null; versionB: Draft | null }>({
    versionA: null,
    versionB: null,
  })

  // Auto-save hook
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useDraftAutoSave({
    draftId: draftId || undefined,
    content,
    enabled: !!draftId,
    debounceMs: 2000,
  })

  // Update error state if auto-save fails
  useEffect(() => {
    if (autoSaveError) {
      setError(autoSaveError)
    }
  }, [autoSaveError])

  // Check if draft exists
  useEffect(() => {
    if (!caseId) return

    const checkDraft = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { supabase } = await import('../lib/supabase')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: drafts, error } = await (supabase as any)
          .from('drafts')
          .select('id, html_content')
          .eq('case_id', caseId)
          .order('version', { ascending: false })
          .limit(1)

        if (error) {
          console.error('Error checking for drafts:', error)
          setShowTemplateSelector(true)
          return
        }

        if (drafts && drafts.length > 0) {
          // Draft exists - load it
          setDraftId(drafts[0].id)
          setContent(drafts[0].html_content || '')
          setHasDraft(true)
          setShowTemplateSelector(false)
        } else {
          // No draft exists - show template selector
          setShowTemplateSelector(true)
          setHasDraft(false)
        }
      } catch (err) {
        console.error('Error in checkDraft:', err)
        setError('Erro ao verificar minuta existente')
      }
    }

    checkDraft()
  }, [caseId])

  // Load all draft versions when draft is loaded
  useEffect(() => {
    if (!caseId || !hasDraft) return

    const loadVersions = async () => {
      try {
        const result = await draftOperationsService.getDraftVersions({ caseId })

        if (result.success && result.versions) {
          setDraftVersions(result.versions)

          // Set current version
          const current = result.versions.find(v => v.id === draftId)
          if (current) {
            setCurrentVersion(current)
          }
        } else {
          console.error('Failed to load versions:', result.error)
        }
      } catch (err) {
        console.error('Error loading versions:', err)
      }
    }

    loadVersions()
  }, [caseId, draftId, hasDraft])

  // Initialize chat session
  useEffect(() => {
    if (!caseId || !draftId) return

    const initChatSession = async () => {
      try {
        const { data, error } = await chatService.getOrCreateChatSession(
          caseId,
          draftId
        )

        if (error) {
          console.error('Error initializing chat session:', error)
          setError('Não foi possível inicializar a sessão de chat')
          return
        }

        if (data) {
          setChatSession(data)

          // Load existing messages
          const { data: existingMessages, error: messagesError } =
            await chatService.getMessages({ sessionId: data.id })

          if (messagesError) {
            console.error('Error loading messages:', messagesError)
          } else if (existingMessages) {
            setMessages(existingMessages)
          }

          // Warm cache with current draft content
          if (draftId && content) {
            await chatService.warmChatCache(draftId, null, content)
          }
        }
      } catch (err) {
        console.error('Error in chat session initialization:', err)
        setError('Erro ao inicializar chat')
      }
    }

    initChatSession()
  }, [caseId, draftId, content])

  // Subscribe to new messages
  useEffect(() => {
    if (!chatSession) return

    const unsubscribe = chatService.subscribeToChatMessages(
      chatSession.id,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage])
      }
    )

    return () => {
      unsubscribe()
    }
  }, [chatSession])

  const handleContentChange = (html: string) => {
    setContent(html)
    // Here you can save the content to the backend
    console.log('Content updated:', html)
  }

  const handleInlineEdit = async (fieldPath: string, newValue: string) => {
    if (!caseId) return

    console.log('Inline edit:', fieldPath, newValue)

    try {
      // Create an update_field operation
      const operation: ChatOperation = {
        type: 'update_field',
        target_path: fieldPath,
        new_value: newValue,
        status: 'approved', // Auto-approve inline edits
      }

      // Apply operation to draft
      const result = await draftOperationsService.applyOperation({
        caseId,
        draftId,
        operation,
      })

      if (result.success && result.updatedDraft) {
        console.log('Inline edit applied successfully:', result)

        // Update draft content in the editor
        if (result.updatedDraft.html_content) {
          setContent(result.updatedDraft.html_content)
        }

        // Show success notification in chat
        if (chatSession) {
          setMessages((prev) => [
            ...prev,
            {
              id: `system-${Date.now()}`,
              session_id: chatSession.id,
              role: 'system',
              content: `✏️ Campo "${fieldPath}" editado com sucesso: ${newValue}`,
              operation: null,
              created_at: new Date().toISOString(),
            },
          ])
        }
      } else {
        console.error('Failed to apply inline edit:', result.error)
        setError(`Erro ao aplicar edição: ${result.error}`)
      }
    } catch (err) {
      console.error('Error applying inline edit:', err)
      setError('Erro ao salvar edição inline')
    }
  }

  const handleApproveOperation = async (messageId: string, operation: ChatOperation) => {
    if (!chatSession) return

    try {
      // Save current content to operation history before applying
      const previousContent = content

      // Update operation status to approved
      const updatedOperation = { ...operation, status: 'approved' as const }

      // Update message in database
      await chatService.updateMessageOperation(messageId, updatedOperation)

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, operation: updatedOperation } : msg
        )
      )

      // Apply operation to draft
      const result = await draftOperationsService.applyOperation({
        caseId: caseId!,
        draftId: draftId,
        operation: updatedOperation,
      })

      if (result.success && result.updatedDraft) {
        console.log('Operation applied successfully:', result)

        // Update draft content in the editor
        if (result.updatedDraft.html_content) {
          setContent(result.updatedDraft.html_content)
        }

        // Add to operation history for undo
        setOperationHistory((prev) => [
          ...prev,
          {
            messageId,
            operation: updatedOperation,
            previousContent,
            timestamp: new Date().toISOString(),
          },
        ])

        // Show success notification
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: '✅ Alterações aprovadas e aplicadas com sucesso à minuta.',
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        console.error('Failed to apply operation:', result.error)

        // Show error notification
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: `❌ Erro ao aplicar alterações: ${result.error}`,
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.error('Error approving operation:', err)
      setError('Erro ao aprovar operação')
    }
  }

  const handleRejectOperation = async (messageId: string, operation: ChatOperation) => {
    if (!chatSession) return

    try {
      // Update operation status to rejected
      const updatedOperation = { ...operation, status: 'rejected' as const }

      // Update message in database
      await chatService.updateMessageOperation(messageId, updatedOperation)

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, operation: updatedOperation } : msg
        )
      )

      // Show notification
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          session_id: chatSession.id,
          role: 'system',
          content: '❌ Operação rejeitada. A minuta não foi alterada.',
          operation: null,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.error('Error rejecting operation:', err)
      setError('Erro ao rejeitar operação')
    }
  }

  const handleUndo = async () => {
    if (!chatSession || operationHistory.length === 0) return

    try {
      // Get the last operation from history
      const lastEntry = operationHistory[operationHistory.length - 1]

      // Restore previous content
      if (lastEntry.previousContent !== undefined) {
        setContent(lastEntry.previousContent)
      }

      // Remove the operation from history
      setOperationHistory((prev) => prev.slice(0, -1))

      // Update the message operation status to 'rejected' to indicate it was undone
      await chatService.updateMessageOperation(lastEntry.messageId, {
        ...lastEntry.operation,
        status: 'rejected',
      })

      // Update local messages state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === lastEntry.messageId
            ? { ...msg, operation: { ...lastEntry.operation, status: 'rejected' as const } }
            : msg
        )
      )

      // Show undo notification
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          session_id: chatSession.id,
          role: 'system',
          content: '↩️ Última operação desfeita com sucesso.',
          operation: null,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.error('Error undoing operation:', err)
      setError('Erro ao desfazer operação')
    }
  }

  const handleSelectTemplate = async (template: DraftTemplate) => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)

    try {
      // Create draft from template
      const result = await draftOperationsService.createDraftFromTemplate({
        caseId,
        template,
      })

      if (result.success && result.draft) {
        console.log('Draft created successfully from template:', result.draft)

        // Set the draft ID and content
        setDraftId(result.draft.id)
        setContent(result.draft.html_content || '')
        setHasDraft(true)
        setShowTemplateSelector(false)

        // Show success notification
        setMessages([
          {
            id: `system-${Date.now()}`,
            session_id: 'temp',
            role: 'system',
            content: `✅ Minuta criada com sucesso a partir do modelo "${template.name}"!`,
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        console.error('Failed to create draft from template:', result.error)
        setError(`Erro ao criar minuta: ${result.error}`)
      }
    } catch (err) {
      console.error('Error creating draft from template:', err)
      setError('Erro ao criar minuta do modelo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (messageContent: string) => {
    if (!chatSession) {
      console.error('No chat session available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Send user message
      const { data: userMessage, error: sendError } =
        await chatService.sendMessage({
          sessionId: chatSession.id,
          content: messageContent,
          role: 'user',
        })

      if (sendError) {
        throw new Error('Failed to send message')
      }

      if (userMessage) {
        setMessages((prev) => [...prev, userMessage])
      }

      // Process message and get AI response
      const { data: assistantMessage, error: processError } =
        await chatService.processMessage(chatSession.id, messageContent)

      if (processError) {
        throw new Error('Failed to process message')
      }

      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage])

        // Operations are now pending approval - user must approve them
        // No automatic application
      }
    } catch (err) {
      console.error('Error handling message:', err)
      setError('Erro ao processar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVersionSelect = async (versionId: string) => {
    if (!caseId) return

    try {
      const result = await draftOperationsService.getDraftVersion({ draftId: versionId })

      if (result.success && result.draft) {
        // Update current draft
        setDraftId(result.draft.id)
        setContent(result.draft.html_content || '')
        setCurrentVersion(result.draft)

        // Show notification
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession?.id || 'temp',
            role: 'system',
            content: `📋 Versão ${result.draft.version} carregada`,
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        setError(`Erro ao carregar versão: ${result.error}`)
      }
    } catch (err) {
      console.error('Error loading version:', err)
      setError('Erro ao carregar versão')
    }
  }

  const handleCreateNewVersion = async () => {
    if (!caseId || !draftId) return

    setIsLoading(true)

    try {
      const result = await draftOperationsService.createNewVersion({
        caseId,
        baseDraftId: draftId,
      })

      if (result.success && result.draft) {
        // Update draft versions list
        setDraftVersions((prev) => [result.draft!, ...prev])

        // Switch to new version
        setDraftId(result.draft.id)
        setContent(result.draft.html_content || '')
        setCurrentVersion(result.draft)

        // Show notification
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession?.id || 'temp',
            role: 'system',
            content: `✅ Nova versão ${result.draft.version} criada com sucesso!`,
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        setError(`Erro ao criar nova versão: ${result.error}`)
      }
    } catch (err) {
      console.error('Error creating new version:', err)
      setError('Erro ao criar nova versão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompareVersions = async (versionAId: string, versionBId: string) => {
    try {
      // Find the versions in the list
      const versionA = draftVersions.find(v => v.id === versionAId)
      const versionB = draftVersions.find(v => v.id === versionBId)

      if (!versionA || !versionB) {
        setError('Versões não encontradas')
        return
      }

      // Set comparison versions and show comparison view
      setComparisonVersions({ versionA, versionB })
      setShowComparison(true)

      // Show notification
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          session_id: chatSession?.id || 'temp',
          role: 'system',
          content: `🔍 Comparando Versão ${versionA.version} com Versão ${versionB.version}`,
          operation: null,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.error('Error comparing versions:', err)
      setError('Erro ao comparar versões')
    }
  }

  const handleCloseComparison = () => {
    setShowComparison(false)
    setComparisonVersions({ versionA: null, versionB: null })
  }

  const handleExportHTML = () => {
    if (!content) {
      setError('Não há conteúdo para exportar')
      return
    }

    try {
      // Generate a title for the export
      const title = currentVersion
        ? `Minuta_Caso_${caseId}_v${currentVersion.version}`
        : `Minuta_Caso_${caseId}`

      // Export the draft as HTML
      exportDraftAsHTML({
        title,
        content,
        metadata: {
          caseId,
          version: currentVersion?.version,
          createdAt: currentVersion?.created_at,
          updatedAt: currentVersion?.updated_at,
        },
      })

      // Show success notification
      if (chatSession) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: '✅ Minuta exportada com sucesso como HTML!',
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.error('Error exporting HTML:', err)
      setError('Erro ao exportar minuta como HTML')
    }
  }

  const handleExportPDF = () => {
    if (!content) {
      setError('Não há conteúdo para exportar')
      return
    }

    try {
      // Generate a title for the export
      const title = currentVersion
        ? `Minuta_Caso_${caseId}_v${currentVersion.version}`
        : `Minuta_Caso_${caseId}`

      // Export the draft as PDF
      exportDraftAsPDF({
        title,
        content,
        metadata: {
          caseId,
          version: currentVersion?.version,
          createdAt: currentVersion?.created_at,
          updatedAt: currentVersion?.updated_at,
        },
      })

      // Show success notification
      if (chatSession) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: '✅ Minuta exportada com sucesso como PDF!',
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.error('Error exporting PDF:', err)
      setError('Erro ao exportar minuta como PDF')
    }
  }

  const handlePrint = () => {
    if (!content) {
      setError('Não há conteúdo para imprimir')
      return
    }

    try {
      // Generate a title for the print
      const title = currentVersion
        ? `Minuta_Caso_${caseId}_v${currentVersion.version}`
        : `Minuta_Caso_${caseId}`

      // Print the draft
      printDraft({
        title,
        content,
        metadata: {
          caseId,
          version: currentVersion?.version,
          createdAt: currentVersion?.created_at,
          updatedAt: currentVersion?.updated_at,
        },
      })

      // Show success notification
      if (chatSession) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            session_id: chatSession.id,
            role: 'system',
            content: '🖨️ Janela de impressão aberta!',
            operation: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.error('Error printing:', err)
      setError('Erro ao imprimir minuta')
    }
  }

  // Show template selector if no draft exists
  if (showTemplateSelector) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 p-6">
        {/* Header Card */}
        <Card className="glass-card p-6 flex-shrink-0 shadow-xl border-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Criar Nova Minuta
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                  Caso: <span className="font-semibold text-gray-800 dark:text-gray-200">{caseId || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 shadow-md">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Erro
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          </Alert>
        )}

        {/* Template Selector */}
        <Card className="glass-card p-8 flex-1 overflow-auto">
          <DraftTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            className="max-w-5xl mx-auto"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 p-6">
      {/* Header Card */}
      <Card className="glass-card p-6 flex-shrink-0 shadow-xl border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg">
              <DocumentTextIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Editor de Minuta
                {currentVersion && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-3">
                    Versão {currentVersion.version}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                Caso: <span className="font-semibold text-gray-800 dark:text-gray-200">{caseId || 'N/A'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!content || isLoading}
              className="flex items-center gap-2"
              title="Imprimir minuta"
            >
              <PrinterIcon className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={!content || isLoading}
              className="flex items-center gap-2"
              title="Exportar como PDF"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHTML}
              disabled={!content || isLoading}
              className="flex items-center gap-2"
              title="Exportar como HTML"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-2"
            >
              <ClockIcon className="h-4 w-4" />
              {showVersionHistory ? 'Ocultar Versões' : 'Ver Versões'}
              {draftVersions.length > 1 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  {draftVersions.length}
                </span>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateNewVersion}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Nova Versão
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 shadow-md">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Erro
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        </Alert>
      )}

      {/* Three-Panel or Four-Panel Layout */}
      <div className={cn("flex-1 flex gap-6 overflow-hidden", error && "pt-0")}>
        {/* Left Panel - Section Navigation */}
        <div className="w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
          <DraftSectionNav
            editorContent={content}
            className="h-full"
          />
        </div>

        {/* Version History Panel - Conditional */}
        {showVersionHistory && !showComparison && (
          <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
            <DraftVersionHistory
              versions={draftVersions}
              currentVersionId={draftId}
              onVersionSelect={handleVersionSelect}
              onCompareVersions={handleCompareVersions}
              className="h-full"
            />
          </div>
        )}

        {/* Comparison Panel - Conditional */}
        {showComparison && comparisonVersions.versionA && comparisonVersions.versionB && (
          <div className="flex-1 rounded-xl overflow-hidden shadow-2xl">
            <DraftComparison
              versionA={comparisonVersions.versionA}
              versionB={comparisonVersions.versionB}
              onClose={handleCloseComparison}
              className="h-full"
            />
          </div>
        )}

        {/* Middle Panel - Editor (hidden when comparison is shown) */}
        {!showComparison && (
          <div className="flex-1 overflow-hidden rounded-xl shadow-2xl">
            <TiptapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Comece a escrever a minuta..."
              className="h-full"
              pendingItems={pendingItems}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              onForceSave={forceSave}
              onInlineEdit={handleInlineEdit}
            />
          </div>
        )}

        {/* Right Panel - Chat (hidden when comparison is shown) */}
        {!showComparison && (
          <div className="w-96 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
            <ChatPanel
              sessionId={chatSession?.id}
              messages={messages}
              onSendMessage={handleSendMessage}
              onApproveOperation={handleApproveOperation}
              onRejectOperation={handleRejectOperation}
              onUndo={handleUndo}
              canUndo={operationHistory.length > 0}
              isLoading={isLoading}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
