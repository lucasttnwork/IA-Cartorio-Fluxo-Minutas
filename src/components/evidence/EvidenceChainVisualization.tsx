import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  EyeIcon,
  CpuChipIcon,
  CheckCircleIcon,
  UserIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  EvidenceChainVisualizationProps,
  EvidenceChainNode,
  ChainNodeProps,
  EvidenceChainNodeType,
} from '@/types/evidence'
import { getConfidenceLevel } from '@/types/evidence'

// Node icon mapping
const nodeIcons: Record<EvidenceChainNodeType, React.ComponentType<{ className?: string }>> = {
  document: DocumentTextIcon,
  ocr: EyeIcon,
  llm: CpuChipIcon,
  consensus: CheckCircleIcon,
  entity: UserIcon,
}

// Node color mapping based on type
const nodeColors: Record<EvidenceChainNodeType, { bg: string; border: string; text: string }> = {
  document: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-300',
  },
  ocr: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
  },
  llm: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
  },
  consensus: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
  },
  entity: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    border: 'border-indigo-300 dark:border-indigo-700',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
}

/**
 * Individual chain node component
 */
function ChainNode({ node, isSelected, onClick, className }: ChainNodeProps) {
  const Icon = nodeIcons[node.type]
  const colors = nodeColors[node.type]
  const confidenceLevel = getConfidenceLevel(node.confidence)
  const [expanded, setExpanded] = useState(false)

  // Override icon for property entities
  const FinalIcon = node.type === 'entity' && node.metadata?.entityType === 'property' ? HomeIcon : Icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn('relative', className)}
    >
      <Card
        className={cn(
          'p-4 cursor-pointer transition-all hover:shadow-md border-2',
          colors.bg,
          colors.border,
          isSelected && 'ring-2 ring-offset-2 ring-indigo-500'
        )}
        onClick={() => {
          onClick?.()
          setExpanded(!expanded)
        }}
      >
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', colors.bg, colors.border, 'border')}>
            <FinalIcon className={cn('w-5 h-5', colors.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className={cn('text-sm font-semibold truncate', colors.text)}>
                {node.label}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
              >
                {expanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </Button>
            </div>

            {node.value && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {node.value}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={confidenceLevel === 'high' ? 'default' : confidenceLevel === 'medium' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {Math.round(node.confidence * 100)}% confiança
              </Badge>

              {node.metadata?.isPending && (
                <Badge variant="outline" className="text-xs gap-1">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  Pendente
                </Badge>
              )}

              {node.pageNumber && (
                <Badge variant="outline" className="text-xs">
                  Pág. {node.pageNumber}
                </Badge>
              )}
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                >
                  <dl className="space-y-2 text-xs">
                    {node.type && (
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Tipo:</dt>
                        <dd className="text-gray-700 dark:text-gray-300 capitalize">{node.type}</dd>
                      </div>
                    )}
                    {node.timestamp && (
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Data:</dt>
                        <dd className="text-gray-700 dark:text-gray-300">
                          {new Date(node.timestamp).toLocaleString('pt-BR')}
                        </dd>
                      </div>
                    )}
                    {node.metadata?.source && (
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Origem:</dt>
                        <dd className="text-gray-700 dark:text-gray-300 uppercase">
                          {String(node.metadata.source)}
                        </dd>
                      </div>
                    )}
                    {node.boundingBox && (
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Coordenadas:</dt>
                        <dd className="text-gray-700 dark:text-gray-300 font-mono">
                          ({node.boundingBox.x}, {node.boundingBox.y})
                        </dd>
                      </div>
                    )}
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/**
 * Arrow connector between nodes
 */
function ChainArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center gap-2">
        <div className="h-px w-8 bg-gray-300 dark:bg-gray-600" />
        <ArrowRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <div className="h-px w-8 bg-gray-300 dark:bg-gray-600" />
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Main Evidence Chain Visualization Component
 */
export function EvidenceChainVisualization({
  chain,
  compact = false,
  onNodeClick,
  onViewDocument,
  className,
}: EvidenceChainVisualizationProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const handleNodeClick = (node: EvidenceChainNode) => {
    setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
    onNodeClick?.(node)

    // If it's a document node and we have a callback, trigger it
    if (node.type === 'document' && node.documentId && onViewDocument) {
      onViewDocument(node.documentId, node.pageNumber)
    }
  }

  // Sort nodes by timestamp to show chronological flow
  const sortedNodes = [...chain.nodes].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cadeia de Evidências: {chain.fieldName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rastreabilidade do dado desde o documento até a entidade final
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={getConfidenceLevel(chain.confidence) === 'high' ? 'default' : 'secondary'}
            className="gap-1"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {Math.round(chain.confidence * 100)}% confiança
          </Badge>

          {chain.hasConflicts && (
            <Badge variant="destructive" className="gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Conflitos Detectados
            </Badge>
          )}

          {chain.isPending && (
            <Badge variant="outline" className="gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Revisão Pendente
            </Badge>
          )}
        </div>
      </div>

      {/* Chain Flow */}
      <Card className="p-6 glass-card">
        <div className={cn('space-y-2', compact ? 'max-w-2xl' : 'max-w-4xl', 'mx-auto')}>
          {sortedNodes.map((node, index) => (
            <div key={node.id}>
              <ChainNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => handleNodeClick(node)}
              />

              {index < sortedNodes.length - 1 && (
                <ChainArrow
                  label={chain.links.find(l => l.source === node.id)?.label}
                />
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {chain.nodes.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Etapas no Pipeline
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {chain.nodes.filter(n => n.type === 'document').length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Documentos de Origem
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {chain.hasConflicts ? 'Sim' : 'Não'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Conflitos
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {chain.currentValue ? 'Sim' : 'Não'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Valor Final
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Value Display */}
      {chain.currentValue && (
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                Valor Final Consolidado
              </h4>
              <p className="text-base text-indigo-700 dark:text-indigo-300 font-medium">
                {chain.currentValue}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EvidenceChainVisualization
