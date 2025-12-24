import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import type { ExtractedEntity, EntityType } from '../../types'

// Entity type configuration with icons and colors
const entityTypeConfig: Record<EntityType, { label: string; icon: typeof UserIcon; color: string; bgColor: string }> = {
  PERSON: { label: 'Pessoa', icon: UserIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  ORGANIZATION: { label: 'Organizacao', icon: BuildingOfficeIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  LOCATION: { label: 'Local', icon: MapPinIcon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  DATE: { label: 'Data', icon: CalendarIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  MONEY: { label: 'Valor', icon: CurrencyDollarIcon, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  CPF: { label: 'CPF', icon: IdentificationIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  RG: { label: 'RG', icon: IdentificationIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  CNPJ: { label: 'CNPJ', icon: BuildingOfficeIcon, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
  EMAIL: { label: 'Email', icon: EnvelopeIcon, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  PHONE: { label: 'Telefone', icon: PhoneIcon, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  ADDRESS: { label: 'Endereco', icon: HomeIcon, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  PROPERTY_REGISTRY: { label: 'Matricula', icon: DocumentDuplicateIcon, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
  RELATIONSHIP: { label: 'Relacao', icon: LinkIcon, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  DOCUMENT_NUMBER: { label: 'Numero Doc', icon: DocumentTextIcon, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
  OTHER: { label: 'Outro', icon: QuestionMarkCircleIcon, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
}

interface EntityTableProps {
  entities: ExtractedEntity[]
  onEntityClick?: (entity: ExtractedEntity) => void
  isLoading?: boolean
}

type SortField = 'type' | 'value' | 'confidence'
type SortDirection = 'asc' | 'desc'

export default function EntityTable({
  entities,
  onEntityClick,
  isLoading = false,
}: EntityTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([])
  const [sortField, setSortField] = useState<SortField>('confidence')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())
  const [showBatchConfirmModal, setShowBatchConfirmModal] = useState(false)

  // Get unique entity types present in data
  const availableTypes = useMemo(() => {
    const types = new Set(entities.map(e => e.type))
    return Array.from(types)
  }, [entities])

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    let result = [...entities]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(entity =>
        entity.value.toLowerCase().includes(query) ||
        (entity.normalized_value && entity.normalized_value.toLowerCase().includes(query)) ||
        (entity.context && entity.context.toLowerCase().includes(query))
      )
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      result = result.filter(entity => selectedTypes.includes(entity.type))
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'value':
          comparison = a.value.localeCompare(b.value)
          break
        case 'confidence':
          comparison = a.confidence - b.confidence
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [entities, searchQuery, selectedTypes, sortField, sortDirection])

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Toggle type filter
  const toggleTypeFilter = (type: EntityType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // Handle entity selection
  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entityId)) {
        newSet.delete(entityId)
      } else {
        newSet.add(entityId)
      }
      return newSet
    })
  }

  // Select all filtered entities
  const toggleSelectAll = () => {
    if (selectedEntities.size === filteredEntities.length) {
      setSelectedEntities(new Set())
    } else {
      setSelectedEntities(new Set(filteredEntities.map(e => e.id)))
    }
  }

  // Handle batch confirmation
  const handleBatchConfirm = () => {
    setShowBatchConfirmModal(true)
  }

  const confirmBatchOperation = () => {
    // TODO: Implement actual batch confirmation logic
    console.log('Confirming entities:', Array.from(selectedEntities))
    setShowBatchConfirmModal(false)
    setSelectedEntities(new Set())
  }

  // Get confidence badge class
  const getConfidenceBadgeClass = (confidence: number): string => {
    if (confidence >= 0.8) return 'confidence-badge-high'
    if (confidence >= 0.6) return 'confidence-badge-medium'
    return 'confidence-badge-low'
  }

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Nenhuma entidade extraida
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Faca upload de documentos e aguarde o processamento para ver entidades extraidas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Batch Actions Toolbar */}
      {selectedEntities.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedEntities.size} entidade{selectedEntities.size !== 1 ? 's' : ''} selecionada{selectedEntities.size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedEntities(new Set())}
                className="btn-secondary text-sm py-1.5"
              >
                Limpar Seleção
              </button>
              <button
                onClick={handleBatchConfirm}
                className="btn-primary text-sm py-1.5 flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Confirmar em Lote
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar entidades..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            selectedTypes.length > 0
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filtros</span>
          {selectedTypes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {selectedTypes.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {availableTypes.map((type) => {
                const config = entityTypeConfig[type]
                const isSelected = selectedTypes.includes(type)
                const Icon = config.icon

                return (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? `${config.bgColor} ${config.color}`
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                    <span className="ml-1 text-xs opacity-70">
                      ({entities.filter(e => e.type === type).length})
                    </span>
                  </button>
                )
              })}

              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setSelectedTypes([])}
                  className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Mostrando {filteredEntities.length} de {entities.length} entidades
      </div>

      {/* Entity Table */}
      <div className="overflow-hidden bg-white dark:bg-gray-800 shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedEntities.size === filteredEntities.length && filteredEntities.length > 0}
                    onChange={toggleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('type')}
                >
                  Tipo <SortIcon field="type" />
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('value')}
                >
                  Valor <SortIcon field="value" />
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('confidence')}
                >
                  Confianca <SortIcon field="confidence" />
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Contexto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {filteredEntities.map((entity, index) => {
                  const config = entityTypeConfig[entity.type]
                  const Icon = config.icon

                  return (
                    <motion.tr
                      key={entity.id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`${
                        selectedEntities.has(entity.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${onEntityClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedEntities.has(entity.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleEntitySelection(entity.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="checkbox"
                        />
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap cursor-pointer"
                        onClick={() => onEntityClick?.(entity)}
                      >
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => onEntityClick?.(entity)}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {entity.value}
                        </div>
                        {entity.normalized_value && entity.normalized_value !== entity.value && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Normalizado: {entity.normalized_value}
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap cursor-pointer"
                        onClick={() => onEntityClick?.(entity)}
                      >
                        <span className={getConfidenceBadgeClass(entity.confidence)}>
                          {Math.round(entity.confidence * 100)}%
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate cursor-pointer"
                        onClick={() => onEntityClick?.(entity)}
                      >
                        {entity.context || '-'}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredEntities.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhuma entidade encontrada com os filtros aplicados.
          </div>
        )}
      </div>

      {/* Batch Confirmation Modal */}
      <AnimatePresence>
        {showBatchConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirmar Entidades em Lote
                  </h3>
                  <button
                    onClick={() => setShowBatchConfirmModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Você está prestes a confirmar {selectedEntities.size} entidade{selectedEntities.size !== 1 ? 's' : ''}.
                  Esta ação marcará todas as entidades selecionadas como confirmadas.
                </p>

                {/* Selected Entities Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Entidades Selecionadas:
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                    {Array.from(selectedEntities).map((entityId) => {
                      const entity = entities.find(e => e.id === entityId)
                      if (!entity) return null
                      const config = entityTypeConfig[entity.type]
                      const Icon = config.icon

                      return (
                        <div
                          key={entityId}
                          className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {config.label}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {entity.value}
                            </span>
                          </div>
                          <span className={getConfidenceBadgeClass(entity.confidence)}>
                            {Math.round(entity.confidence * 100)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowBatchConfirmModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBatchOperation}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Confirmar {selectedEntities.size} Entidade{selectedEntities.size !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
