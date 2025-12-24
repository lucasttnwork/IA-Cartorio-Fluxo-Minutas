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
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import type { ExtractedEntity, EntityType } from '../../types'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { cn } from '@/lib/utils'

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

// Confidence level configuration
type ConfidenceLevel = 'high' | 'medium' | 'low'

const confidenceLevelConfig: Record<ConfidenceLevel, {
  label: string
  labelPt: string
  color: string
  bgColor: string
  borderColor: string
  min: number
  max: number
}> = {
  high: {
    label: 'High',
    labelPt: 'Alta',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    min: 0.8,
    max: 1,
  },
  medium: {
    label: 'Medium',
    labelPt: 'Media',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    min: 0.6,
    max: 0.8,
  },
  low: {
    label: 'Low',
    labelPt: 'Baixa',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    min: 0,
    max: 0.6,
  },
}

// Helper function to get confidence level from score
const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

export default function EntityTable({
  entities,
  onEntityClick,
  isLoading = false,
}: EntityTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([])
  const [selectedConfidenceLevels, setSelectedConfidenceLevels] = useState<ConfidenceLevel[]>([])
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

  // Get confidence badge styling
  const getConfidenceBadgeClass = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
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
      <div className="glass-subtle text-center py-12 rounded-lg">
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
          className="glass-card border-blue-200 dark:border-blue-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedEntities.size} entidade{selectedEntities.size !== 1 ? 's' : ''} selecionada{selectedEntities.size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSelectedEntities(new Set())}
                variant="outline"
                size="sm"
              >
                Limpar Seleção
              </Button>
              <Button
                onClick={handleBatchConfirm}
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Confirmar em Lote
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar entidades..."
            className="w-full pl-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={selectedTypes.length > 0 ? "default" : "outline"}
          className={cn(
            "flex items-center gap-2",
            selectedTypes.length > 0 && "bg-blue-500 hover:bg-blue-600"
          )}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filtros</span>
          {selectedTypes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
              {selectedTypes.length}
            </span>
          )}
        </Button>
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
            <div className="flex flex-wrap gap-2 p-4 glass-subtle rounded-lg">
              {availableTypes.map((type) => {
                const config = entityTypeConfig[type]
                const isSelected = selectedTypes.includes(type)
                const Icon = config.icon

                return (
                  <Button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-1.5",
                      isSelected && `${config.bgColor} ${config.color} hover:opacity-90`
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                    <span className="ml-1 text-xs opacity-70">
                      ({entities.filter(e => e.type === type).length})
                    </span>
                  </Button>
                )
              })}

              {selectedTypes.length > 0 && (
                <Button
                  onClick={() => setSelectedTypes([])}
                  variant="ghost"
                  size="sm"
                >
                  Limpar filtros
                </Button>
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
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEntities.size === filteredEntities.length && filteredEntities.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all entities"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('type')}
              >
                Tipo <SortIcon field="type" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('value')}
              >
                Valor <SortIcon field="value" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('confidence')}
              >
                Confianca <SortIcon field="confidence" />
              </TableHead>
              <TableHead>Contexto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredEntities.map((entity, index) => {
                const config = entityTypeConfig[entity.type]
                const Icon = config.icon

                return (
                  <TableRow
                    key={entity.id || index}
                    className={cn(
                      selectedEntities.has(entity.id) && "bg-blue-50 dark:bg-blue-900/20",
                      onEntityClick && "cursor-pointer"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedEntities.has(entity.id)}
                        onCheckedChange={() => toggleEntitySelection(entity.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        aria-label={`Select ${entity.value}`}
                      />
                    </TableCell>
                    <TableCell onClick={() => onEntityClick?.(entity)}>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        config.bgColor,
                        config.color
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => onEntityClick?.(entity)}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {entity.value}
                      </div>
                      {entity.normalized_value && entity.normalized_value !== entity.value && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Normalizado: {entity.normalized_value}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={() => onEntityClick?.(entity)}>
                      <Badge className={cn('font-medium', getConfidenceBadgeClass(entity.confidence))}>
                        {Math.round(entity.confidence * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell
                      onClick={() => onEntityClick?.(entity)}
                      className="max-w-xs truncate"
                    >
                      {entity.context || '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </AnimatePresence>
          </TableBody>
        </Table>

        {filteredEntities.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhuma entidade encontrada com os filtros aplicados.
          </div>
        )}
      </div>

      {/* Batch Confirmation Modal */}
      <Dialog open={showBatchConfirmModal} onOpenChange={setShowBatchConfirmModal}>
        <DialogContent className="glass-dialog max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Confirmar Entidades em Lote</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Você está prestes a confirmar {selectedEntities.size} entidade{selectedEntities.size !== 1 ? 's' : ''}.
              Esta ação marcará todas as entidades selecionadas como confirmadas.
            </p>

            {/* Selected Entities Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Entidades Selecionadas:
              </h4>
              <div className="glass-subtle rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
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
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          config.bgColor,
                          config.color
                        )}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {entity.value}
                        </span>
                      </div>
                      <Badge className={cn('font-medium', getConfidenceBadgeClass(entity.confidence))}>
                        {Math.round(entity.confidence * 100)}%
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowBatchConfirmModal(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmBatchOperation}
              className="flex items-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              Confirmar {selectedEntities.size} Entidade{selectedEntities.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
