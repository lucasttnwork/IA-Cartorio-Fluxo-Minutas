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
import { ConflictCard } from '../components/consensus'
import {
  getCaseConflicts,
  resolveConflict,
  subscribeToConsensusUpdates,
  triggerConsensusJob,
} from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { ConflictField, ConflictsSummary, ConflictFieldStatus } from '../types'

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
// Helper Functions
// ============================================================================

function getStatusColor(status: ConflictFieldStatus): string {
  switch (status) {
    case 'pending':
      return 'text-amber-600 dark:text-amber-400'
    case 'resolved':
      return 'text-blue-600 dark:text-blue-400'
    case 'confirmed':
      return 'text-green-600 dark:text-green-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

function getStatusBgColor(status: ConflictFieldStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 dark:bg-amber-900/30'
    case 'resolved':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'confirmed':
      return 'bg-green-100 dark:bg-green-900/30'
    default:
      return 'bg-gray-100 dark:bg-gray-900/30'
  }
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

    const unsubscribe = subscribeToConsensusUpdates(caseId, (payload) => {
      console.log('Consensus update received:', payload)
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
          <button
            onClick={() => loadConflicts()}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleTriggerConsensus}
            disabled={isTriggering || documentGroups.length === 0}
            className="btn-primary flex items-center gap-2"
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
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
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
        </motion.div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                Fechar
              </button>
            </div>
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
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Section */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FunnelIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Filtrar por status:</span>
          </div>

          <div className="flex gap-2">
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
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filterStatus === status
                      ? 'bg-primary-500 text-white'
                      : `${status !== 'all' ? getStatusBgColor(status as ConflictFieldStatus) : 'bg-gray-100 dark:bg-gray-700'} ${status !== 'all' ? getStatusColor(status as ConflictFieldStatus) : 'text-gray-700 dark:text-gray-300'} hover:opacity-80`
                  }`}
                >
                  {labels[status]}
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      filterStatus === status
                        ? 'bg-white/20'
                        : 'bg-black/10 dark:bg-white/10'
                    }`}
                  >
                    {counts[status]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

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
        <div className="card p-8 text-center">
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
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            Ir para Upload
          </Link>
        </div>
      ) : stats.pending === 0 && filterStatus === 'pending' ? (
        <div className="card p-8 text-center">
          <CheckBadgeIcon className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Todos os conflitos foram resolvidos!
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Nao ha conflitos pendentes para revisar.
          </p>
          <button
            onClick={() => setFilterStatus('all')}
            className="btn-secondary mt-4"
          >
            Ver todos os conflitos
          </button>
        </div>
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
                className="card overflow-hidden"
              >
                {/* Document Header */}
                <button
                  type="button"
                  onClick={() => toggleDocumentExpansion(group.documentId)}
                  className="w-full px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                    <div className="text-left">
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
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {group.pendingCount} pendente{group.pendingCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {group.resolvedCount > 0 && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {group.resolvedCount} resolvido{group.resolvedCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {group.confirmedCount > 0 && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full flex items-center gap-1">
                          <CheckBadgeIcon className="w-3.5 h-3.5" />
                          {group.confirmedCount} confirmado{group.confirmedCount !== 1 ? 's' : ''}
                        </span>
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
                      <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Como funciona a revisao de conflitos?
        </h3>
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
      </div>
    </div>
  )
}
