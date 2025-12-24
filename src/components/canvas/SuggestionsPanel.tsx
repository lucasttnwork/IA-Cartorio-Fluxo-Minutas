import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserPlusIcon,
  HomeIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import type {
  CanvasSuggestions,
  EntitySuggestion,
  RelationshipSuggestion,
  DataQualitySuggestion,
} from '../../services/canvasSuggestions'

interface SuggestionsPanelProps {
  suggestions: CanvasSuggestions
  isLoading: boolean
  onApplyEntitySuggestion: (suggestion: EntitySuggestion) => void
  onApplyRelationshipSuggestion: (suggestion: RelationshipSuggestion) => void
  onDismissSuggestion: (suggestionId: string, type: 'entity' | 'relationship' | 'quality') => void
  onRefresh: () => void
}

export default function SuggestionsPanel({
  suggestions,
  isLoading,
  onApplyEntitySuggestion,
  onApplyRelationshipSuggestion,
  onDismissSuggestion,
  onRefresh,
}: SuggestionsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<{
    entities: boolean
    relationships: boolean
    quality: boolean
  }>({
    entities: true,
    relationships: true,
    quality: false,
  })

  const toggleSection = (section: 'entities' | 'relationships' | 'quality') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const hasAnySuggestions = suggestions.summary.totalSuggestions > 0

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-24 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg z-50 transition-colors"
        title="Mostrar Sugestões"
      >
        <SparklesIcon className="w-6 h-6" />
        {hasAnySuggestions && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {suggestions.summary.totalSuggestions}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className="fixed right-4 top-24 bottom-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-white" />
          <h3 className="text-lg font-semibold text-white">Sugestões IA</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold text-red-500">{suggestions.summary.highPriority}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Alta</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">{suggestions.summary.mediumPriority}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Média</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">{suggestions.summary.lowPriority}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Baixa</div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="mt-3 w-full btn-secondary text-sm py-2"
        >
          {isLoading ? 'Analisando...' : 'Atualizar Sugestões'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasAnySuggestions && !isLoading && (
          <div className="p-8 text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Tudo em ordem!
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Não há sugestões no momento. O canvas está completo baseado nos documentos analisados.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-8 text-center">
            <SparklesIcon className="w-10 h-10 text-purple-500 animate-pulse mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Analisando documentos...</p>
          </div>
        )}

        {/* Entity Suggestions */}
        {suggestions.entities.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('entities')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Entidades ({suggestions.entities.length})
                </span>
              </div>
              {expandedSections.entities ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.entities && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {suggestions.entities.map(suggestion => (
                    <EntitySuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={() => onApplyEntitySuggestion(suggestion)}
                      onDismiss={() => onDismissSuggestion(suggestion.id, 'entity')}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Relationship Suggestions */}
        {suggestions.relationships.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('relationships')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Relacionamentos ({suggestions.relationships.length})
                </span>
              </div>
              {expandedSections.relationships ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.relationships && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {suggestions.relationships.map(suggestion => (
                    <RelationshipSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={() => onApplyRelationshipSuggestion(suggestion)}
                      onDismiss={() => onDismissSuggestion(suggestion.id, 'relationship')}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Data Quality Suggestions */}
        {suggestions.dataQuality.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('quality')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Qualidade de Dados ({suggestions.dataQuality.length})
                </span>
              </div>
              {expandedSections.quality ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.quality && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {suggestions.dataQuality.map(suggestion => (
                    <DataQualitySuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onDismiss={() => onDismissSuggestion(suggestion.id, 'quality')}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function EntitySuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: EntitySuggestion
  onApply: () => void
  onDismiss: () => void
}) {
  const Icon = suggestion.type === 'person' ? UserPlusIcon : HomeIcon

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          suggestion.type === 'person'
            ? 'bg-blue-100 dark:bg-blue-900/30'
            : 'bg-green-100 dark:bg-green-900/30'
        }`}>
          <Icon className={`w-5 h-5 ${
            suggestion.type === 'person' ? 'text-blue-600' : 'text-green-600'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {suggestion.type === 'person'
                ? (suggestion.entity as any).full_name
                : (suggestion.entity as any).address
              }
            </h4>
            <ConfidenceBadge confidence={suggestion.confidence} />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {suggestion.reason}
          </p>

          <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
            📄 {suggestion.source.documentName}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onApply}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Adicionar
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RelationshipSuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: RelationshipSuggestion
  onApply: () => void
  onDismiss: () => void
}) {
  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <LinkIcon className="w-5 h-5 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {suggestion.relationship}
            </h4>
            <ConfidenceBadge confidence={suggestion.confidence} />
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium">{suggestion.sourceName}</span>
            {' → '}
            <span className="font-medium">{suggestion.targetName}</span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {suggestion.reason}
          </p>

          <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
            📄 {suggestion.source.documentName}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onApply}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Adicionar
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataQualitySuggestionCard({
  suggestion,
  onDismiss,
}: {
  suggestion: DataQualitySuggestion
  onDismiss: () => void
}) {
  const severityColors = {
    high: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    low: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  }

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${severityColors[suggestion.severity]}`}>
          <ExclamationTriangleIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {suggestion.entityName}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[suggestion.severity]}`}>
              {suggestion.severity === 'high' ? 'Alta' : suggestion.severity === 'medium' ? 'Média' : 'Baixa'}
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {suggestion.reason}
          </p>

          {suggestion.field && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
              Campo: <span className="font-mono">{suggestion.field}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100)
  const badgeClass =
    confidence >= 0.8
      ? 'confidence-badge-high'
      : confidence >= 0.5
      ? 'confidence-badge-medium'
      : 'confidence-badge-low'

  return (
    <span className={badgeClass}>
      {percentage}%
    </span>
  )
}
