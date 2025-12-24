/**
 * ConflictReviewPage
 *
 * Page for reviewing and resolving conflicts between OCR and LLM extraction results.
 * Displays all pending conflicts for a case and allows users to resolve them manually.
 *
 * Features:
 * - View all conflicts for a case organized by document
 * - Filter conflicts by status (pending, resolved, all)
 * - Resolve individual conflicts by selecting OCR, LLM, or custom value
 * - Bulk actions for common operations
 * - Real-time updates when conflicts are resolved
 * - Audit trail for resolved conflicts
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { ConflictCard } from '../components/consensus'
import {
  getCaseConflicts,
  resolveConflict,
  subscribeToConsensusUpdates,
  triggerConsensusJob,
} from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ConflictField, ConflictsSummary } from '../types'

// ============================================================================
// Types
// ============================================================================

type FilterStatus = 'all' | 'pending' | 'resolved' | 'confirmed'

interface DocumentConflictsGroup {
  documentId: string
  documentName: string
  extractionId: string
  conflicts: ConflictField[]
  pendingCount: number
  resolvedCount: number
  confirmedCount: number
  isExpanded: boolean
}

// ============================================================================
// Main Component
// ============================================================================

export default function ConflictReviewPage() {
  const { caseId } = useParams()
  const { user } = useAuth()

  // State
  const [conflictsSummaries, setConflictsSummaries] = useState<ConflictsSummary[]>([])
  const [documentGroups, setDocumentGroups] = useState<DocumentConflictsGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResolving, setIsResolving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [isTriggering, setIsTriggering] = useState(false)

  // Derived state
  const stats = useMemo(() => {
    const allConflicts = conflictsSummaries.flatMap(s => s.conflicts)
    return {
      total: allConflicts.length,
      pending: allConflicts.filter(c => c.status === 'pending').length,
      resolved: allConflicts.filter(c => c.status === 'resolved').length,
      confirmed: allConflicts.filter(c => c.status === 'confirmed').length,
    }
  }, [conflictsSummaries])

  // Load conflicts data
  const loadConflicts = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getCaseConflicts(caseId)

      if (fetchError) {
        throw new Error(`Failed to fetch conflicts: ${fetchError.message}`)
      }

      setConflictsSummaries(data || [])

      // Group conflicts by document
      const groups: DocumentConflictsGroup[] = (data || []).map((summary) => ({
        documentId: summary.documentId,
        documentName: `Document ${summary.documentId.slice(0, 8)}...`,
        extractionId: summary.extractionId,
        conflicts: summary.conflicts,
        pendingCount: summary.pendingConflicts,
        resolvedCount: summary.resolvedConflicts,
        confirmedCount: summary.confirmedFields,
        isExpanded: summary.pendingConflicts > 0, // Auto-expand documents with pending conflicts
      }))

      setDocumentGroups(groups)
    } catch (err) {
      console.error('Error loading conflicts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conflicts')
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  // Initial load
  useEffect(() => {
    loadConflicts()
  }, [loadConflicts])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!caseId) return

    const unsubscribe = subscribeToConsensusUpdates(caseId, (_payload) => {
      console.log('Consensus update received:', _payload)
      // Reload data when updates come in
      loadConflicts()
    })

    return () => {
      unsubscribe()
    }
  }, [caseId, loadConflicts])

  // Handle conflict resolution
  const handleResolve = useCallback(
    async (extractionId: string, fieldPath: string, resolvedValue: unknown, note?: string) => {
      if (!user?.id) {
        setError('You must be logged in to resolve conflicts')
        return
      }

      setIsResolving(fieldPath)
      setError(null)

      try {
        const result = await resolveConflict(
          extractionId,
          {
            fieldPath,
            resolvedValue,
            resolutionNote: note,
          },
          user.id
        )

        if (!result.success) {
          throw new Error(result.message || 'Failed to resolve conflict')
        }

        setSuccessMessage(`Conflict for "${fieldPath}" resolved successfully`)

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)

        // Reload conflicts to get updated data
        await loadConflicts()
      } catch (err) {
        console.error('Error resolving conflict:', err)
        setError(err instanceof Error ? err.message : 'Failed to resolve conflict')
      } finally {
        setIsResolving(null)
      }
    },
    [user?.id, loadConflicts]
  )

  // Trigger consensus job for all documents
  const handleTriggerConsensus = useCallback(async () => {
    if (!caseId) return

    setIsTriggering(true)
    setError(null)

    try {
      // Get document IDs from the groups
      const documentIds = documentGroups.map((g) => g.documentId)

      if (documentIds.length === 0) {
        setError('No documents available for consensus processing')
        return
      }

      // Trigger consensus for each document
      for (const documentId of documentIds) {
        await triggerConsensusJob(caseId, documentId)
      }

      setSuccessMessage(`Consensus jobs triggered for ${documentIds.length} document(s)`)
      setTimeout(() => setSuccessMessage(null), 3000)

      // Reload after a delay to allow jobs to process
      setTimeout(() => loadConflicts(), 2000)
    } catch (err) {
      console.error('Error triggering consensus:', err)
      setError(err instanceof Error ? err.message : 'Failed to trigger consensus')
    } finally {
      setIsTriggering(false)
    }
  }, [caseId, documentGroups, loadConflicts])

  // Toggle document expansion
  const toggleDocumentExpansion = useCallback((documentId: string) => {
    setDocumentGroups((prev) =>
      prev.map((group) =>
        group.documentId === documentId
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }, [])

  // Filter conflicts based on selected status
  const getFilteredConflicts = useCallback(
    (conflicts: ConflictField[]): ConflictField[] => {
      if (filterStatus === 'all') return conflicts
      return conflicts.filter((c) => c.status === filterStatus)
    },
    [filterStatus]
  )

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowsRightLeftIcon className="w-7 h-7 text-amber-500" />
            Revisao de Conflitos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Revise e resolva conflitos entre os resultados de OCR e LLM.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => loadConflicts()}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            Atualizar
          </Button>

          <Button
            onClick={handleTriggerConsensus}
            disabled={isTriggering || documentGroups.length === 0}
            className="flex items-center gap-2"
          >
            {isTriggering ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Executar Consenso
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.pending}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.resolved}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.confirmed}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Confirmados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-200 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
                >
                  ✕
                </button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-200">
                {successMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Section */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FunnelIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Filtrar por status:</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'resolved', 'confirmed'] as FilterStatus[]).map((status) => {
                const labels: Record<FilterStatus, string> = {
                  all: 'Todos',
                  pending: 'Pendentes',
                  resolved: 'Resolvidos',
                  confirmed: 'Confirmados',
                }
                const counts: Record<FilterStatus, number> = {
                  all: stats.total,
                  pending: stats.pending,
                  resolved: stats.resolved,
                  confirmed: stats.confirmed,
                }

                return (
                  <Button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    className="text-sm"
                  >
                    {labels[status]}
                    <Badge
                      variant="secondary"
                      className="ml-2"
                    >
                      {counts[status]}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Carregando conflitos...
            </p>
          </div>
        </div>
      ) : documentGroups.length === 0 ? (
        <Card className="glass-card text-center">
          <CardContent className="pt-12 pb-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhum conflito encontrado
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Nao ha conflitos para revisar neste caso. Execute o consenso nos documentos para
              detectar divergencias entre OCR e LLM.
            </p>
            <Link
              to={`/case/${caseId}/upload`}
              className="inline-block mt-4"
            >
              <Button>
                Ir para Upload
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : stats.pending === 0 && filterStatus === 'pending' ? (
        <Card className="glass-card text-center">
          <CardContent className="pt-12 pb-12">
            <CheckBadgeIcon className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Todos os conflitos foram resolvidos!
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Nao ha conflitos pendentes para revisar.
            </p>
            <Button
              onClick={() => setFilterStatus('all')}
              variant="outline"
              className="mt-4"
            >
              Ver todos os conflitos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documentGroups.map((group) => {
            const filteredConflicts = getFilteredConflicts(group.conflicts)
            if (filteredConflicts.length === 0 && filterStatus !== 'all') return null

            return (
              <motion.div
                key={group.documentId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-card overflow-hidden">
                  {/* Document Header */}
                  <button
                    type="button"
                    onClick={() => toggleDocumentExpansion(group.documentId)}
                    className="w-full px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {group.documentName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          ID: {group.documentId.slice(0, 12)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status Badges */}
                      <div className="flex gap-2">
                        {group.pendingCount > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            <ClockIcon className="w-3.5 h-3.5 mr-1" />
                            {group.pendingCount} pendente{group.pendingCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {group.resolvedCount > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                            {group.resolvedCount} resolvido{group.resolvedCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {group.confirmedCount > 0 && (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />
                            {group.confirmedCount} confirmado{group.confirmedCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Expand/Collapse Icon */}
                      {group.isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Conflicts List */}
                  <AnimatePresence>
                    {group.isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-4 pb-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                          {filteredConflicts.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                              Nenhum conflito encontrado com o filtro atual.
                            </p>
                          ) : (
                            filteredConflicts.map((conflict) => (
                              <ConflictCard
                                key={`${group.documentId}-${conflict.fieldPath}`}
                                conflict={conflict}
                                onResolve={(fieldPath, resolvedValue, note) =>
                                  handleResolve(group.extractionId, fieldPath, resolvedValue, note)
                                }
                                isLoading={isResolving === conflict.fieldPath}
                                disabled={isResolving !== null && isResolving !== conflict.fieldPath}
                                size="md"
                                showDetails
                              />
                            ))
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Help Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Como funciona a revisao de conflitos?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg h-fit">
                <ClockIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Pendentes</p>
                <p className="text-gray-500 dark:text-gray-400">
                  Campos onde OCR e LLM divergem significativamente. Requerem revisao manual.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                <CheckCircleIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Resolvidos</p>
                <p className="text-gray-500 dark:text-gray-400">
                  Conflitos resolvidos manualmente por um revisor, com valor final definido.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg h-fit">
                <CheckBadgeIcon className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Confirmados</p>
                <p className="text-gray-500 dark:text-gray-400">
                  Campos onde OCR e LLM concordam automaticamente. Nao requerem revisao.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
