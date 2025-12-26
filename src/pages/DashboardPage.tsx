import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { usePaginatedCases, useDeleteCase, useDuplicateCase, type SortField, type SortOrder } from '../hooks/useCases'
import { useFlowStore } from '../stores/flowStore'
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal'
import { Pagination } from '../components/common/Pagination'
import SortControls, { type SortOption } from '../components/common/SortControls'
import EmptyStateIllustration from '../components/common/EmptyStateIllustration'
import PageTransition from '../components/common/PageTransition'
import type { Case, CaseStatus } from '../types'
import { formatDate } from '../utils/dateFormat'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// Status badge variants mapping
const statusBadgeVariant: Record<CaseStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  processing: 'secondary',
  review: 'secondary',
  approved: 'default',
  archived: 'outline',
}

// Status display labels
const statusLabels: Record<CaseStatus, string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  review: 'Revisão',
  approved: 'Aprovado',
  archived: 'Arquivado',
}

// Act type display labels
const actTypeLabels: Record<string, string> = {
  purchase_sale: 'Compra e Venda',
  donation: 'Doação',
  exchange: 'Troca',
  lease: 'Aluguel',
}

// Loading skeleton component
function CaseCardSkeleton() {
  return (
    <Card className="glass-card h-full flex flex-col">
      <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-16" />
        </div>
        {/* Content */}
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
        {/* Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <Skeleton className="h-8 flex-1 basis-[calc(50%-0.25rem)] min-w-[120px]" />
          <Skeleton className="h-8 flex-1 basis-[calc(50%-0.25rem)] min-w-[140px]" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'updated_at',
    order: 'desc'
  })

  const handleNewCase = () => {
    // Reset any previous flow state to ensure a fresh start
    useFlowStore.getState().resetFlow()
    // Navigate to start a new flow
    navigate('/purchase-sale-flow')
  }

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      // Reset to first page when search changes
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: paginatedData, isLoading, isError, error, refetch } = usePaginatedCases({
    page: currentPage,
    pageSize,
    searchQuery: debouncedSearchQuery,
    sortField: sortOption.field,
    sortOrder: sortOption.order,
    statusFilter
  })
  const { mutate: deleteCase, isPending: isDeleting } = useDeleteCase()
  const { mutate: duplicateCase, isPending: isDuplicating } = useDuplicateCase()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const cases = paginatedData?.data ?? []
  const totalCases = paginatedData?.total ?? 0
  const totalPages = Math.ceil(totalCases / pageSize)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setOpenMenuId(null)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
    setOpenMenuId(null)
  }

  const handleDeleteClick = (caseItem: Case, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCaseToDelete(caseItem)
    setShowDeleteModal(true)
    setOpenMenuId(null)
  }

  const handleConfirmDelete = () => {
    if (caseToDelete) {
      deleteCase(caseToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false)
          setCaseToDelete(null)
        },
        onError: (error) => {
          console.error('Falha ao deletar caso:', error)
          alert('Falha ao deletar caso. Por favor, tente novamente.')
        }
      })
    }
  }

  const handleDuplicateClick = (caseItem: Case, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)

    duplicateCase(caseItem.id, {
      onSuccess: (newCase) => {
        // Navigate to the new duplicated case
        navigate(`/case/${newCase.id}`)
      },
      onError: (error) => {
        console.error('Falha ao duplicar caso:', error)
        alert('Falha ao duplicar caso. Por favor, tente novamente.')
      }
    })
  }

  const toggleMenu = (caseId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(openMenuId === caseId ? null : caseId)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort)
    setCurrentPage(1) // Reset to first page when sort changes
  }

  const handleStatusFilterChange = (newStatus: CaseStatus | 'all') => {
    setStatusFilter(newStatus)
    setCurrentPage(1) // Reset to first page when status filter changes
  }

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Casos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie seus casos de documentos e minutas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleNewCase}
            className="bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 text-white"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Novo Caso
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Search Bar, Status Filter, and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="Buscar casos por título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Limpar busca"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as CaseStatus | 'all')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="all">Todos os Status</option>
          <option value="draft">Rascunho</option>
          <option value="processing">Processando</option>
          <option value="review">Revisão</option>
          <option value="approved">Aprovado</option>
          <option value="archived">Arquivado</option>
        </select>
        <SortControls currentSort={sortOption} onSortChange={handleSortChange} />
      </div>

      {/* Content Section */}
      {isLoading ? (
        /* Loading State - Skeleton cards */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[...Array(pageSize)].map((_, index) => (
            <CaseCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Erro ao carregar casos
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {error instanceof Error ? error.message : 'Um erro inesperado ocorreu'}
                </p>
                <div className="mt-6">
                  <Button onClick={() => refetch()} variant="outline">
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : cases.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <EmptyStateIllustration
                  type={debouncedSearchQuery ? 'search' : 'folder'}
                  className="w-40 h-40 mb-2"
                />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {debouncedSearchQuery ? 'Nenhum caso encontrado' : 'Nenhum caso ainda'}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {debouncedSearchQuery
                    ? `Nenhum caso corresponde a "${debouncedSearchQuery}". Tente um termo de busca diferente.`
                    : 'Comece criando um novo caso para gerenciar seus documentos notariais e minutas.'}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  {debouncedSearchQuery ? (
                    <Button onClick={clearSearch} variant="outline">
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Limpar Busca
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNewCase}
                      className="bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 text-white"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Novo Caso
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Cases Grid - Responsive: 1 col mobile, 2 cols sm, 3 cols lg, 4 cols 2xl */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {cases.map((caseItem: Case, index: number) => {
              // Determine if the workflow is complete based on case status
              const isWorkflowComplete = ['review', 'approved', 'archived'].includes(caseItem.status)
              const actionUrl = isWorkflowComplete
                ? `/case/${caseItem.id}/draft`
                : `/purchase-sale-flow?caseId=${caseItem.id}`
              const actionLabel = isWorkflowComplete ? 'Ver minuta' : 'Continuar fluxo'

              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative h-full"
                >
                  <Card className="glass-card hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                      {/* Header with title, badge and menu */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 flex-1 min-w-0">
                          {caseItem.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant={statusBadgeVariant[caseItem.status]} className="whitespace-nowrap">
                            {statusLabels[caseItem.status]}
                          </Badge>
                          <div className="relative">
                            <Button
                              onClick={(e) => toggleMenu(caseItem.id, e)}
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1"
                              aria-label="Mais opções"
                            >
                              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </Button>
                            {openMenuId === caseItem.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <Card className="glass-popover absolute right-0 top-full mt-1 w-48 py-1 z-20">
                                  <Button
                                    onClick={(e) => handleDuplicateClick(caseItem, e)}
                                    variant="ghost"
                                    className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-800"
                                    disabled={isDuplicating}
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                    Duplicar Caso
                                  </Button>
                                  <Button
                                    onClick={(e) => handleDeleteClick(caseItem, e)}
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <TrashIcon className="w-4 h-4 mr-2" />
                                    Deletar Caso
                                  </Button>
                                </Card>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card content grows to fill space */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {actTypeLabels[caseItem.act_type] || caseItem.act_type.replace('_', ' ')}
                        </p>
                        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                          Criado {formatDate(caseItem.created_at, 'medium')}
                        </p>
                      </div>

                      {/* Action buttons - wrap to vertical when space is tight */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                        <Button
                          onClick={() => navigate(`/case/${caseItem.id}`)}
                          variant="outline"
                          className="flex-1 basis-[calc(50%-0.25rem)] min-w-[120px]"
                          size="sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                          Ver mais
                        </Button>
                        <Button
                          onClick={() => navigate(actionUrl)}
                          variant="default"
                          className="flex-1 basis-[calc(50%-0.25rem)] min-w-[140px] bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-500 hover:to-blue-500 text-white"
                          size="sm"
                        >
                          {actionLabel}
                          <ArrowRightIcon className="w-4 h-4 ml-1.5 flex-shrink-0" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCases}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[6, 12, 24, 48]}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setCaseToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Deletar Caso"
        message={`Tem certeza de que deseja deletar "${caseToDelete?.title}"? Esta ação não pode ser desfeita e removerá todos os documentos e dados associados.`}
        confirmLabel="Deletar Caso"
        isDeleting={isDeleting}
      />
    </div>
    </PageTransition>
  )
}
