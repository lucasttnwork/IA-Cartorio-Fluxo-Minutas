/**
 * OcrResultsPanel Component
 *
 * Displays OCR extraction results from Google Document AI with quality metrics.
 * Features:
 * - Full OCR text display with copy functionality
 * - Confidence score visualization with color coding
 * - Language detection display
 * - Word and page count statistics
 * - Low confidence block highlighting
 * - Block-by-block view with bounding box info
 * - Collapsible sections for better organization
 * - Dark mode support
 * - Responsive design
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LanguageIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import type { OcrResultsWithQuality } from '@/services/documentProcessingService'
import type { OcrBlock } from '@/types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface OcrResultsPanelProps {
  /** OCR results with quality metrics */
  ocrResults: OcrResultsWithQuality | null
  /** Whether the data is loading */
  isLoading?: boolean
  /** Whether to show in compact mode */
  compact?: boolean
  /** Maximum height for the panel (useful in scrollable containers) */
  maxHeight?: string
  /** Callback when a block is selected (for highlighting in document viewer) */
  onBlockSelect?: (block: OcrBlock) => void
  /** Currently selected block ID (page-index) */
  selectedBlockId?: string
  /** Additional class names */
  className?: string
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const LOW_CONFIDENCE_THRESHOLD = 0.7
const MEDIUM_CONFIDENCE_THRESHOLD = 0.85

// Language labels in Portuguese
const languageLabels: Record<string, string> = {
  pt: 'Portugues',
  'pt-BR': 'Portugues (Brasil)',
  'pt-PT': 'Portugues (Portugal)',
  en: 'Ingles',
  'en-US': 'Ingles (EUA)',
  'en-GB': 'Ingles (Reino Unido)',
  es: 'Espanhol',
  fr: 'Frances',
  de: 'Alemao',
  it: 'Italiano',
  unknown: 'Desconhecido',
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get language display name
 */
function getLanguageLabel(languageCode: string): string {
  return languageLabels[languageCode] || languageLabels[languageCode.split('-')[0]] || languageCode
}

/**
 * Get confidence level styling
 */
function getConfidenceLevel(confidence: number): {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: 'success' | 'warning' | 'error'
} {
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) {
    return {
      label: 'Alta',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: 'success',
    }
  }
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) {
    return {
      label: 'Media',
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: 'warning',
    }
  }
  return {
    label: 'Baixa',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: 'error',
  }
}

/**
 * Format block type label
 */
function getBlockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    paragraph: 'Paragrafo',
    line: 'Linha',
    word: 'Palavra',
  }
  return labels[type] || type
}

/**
 * Generate unique block ID
 */
function getBlockId(block: OcrBlock, index: number): string {
  return `page-${block.page}-block-${index}`
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

/**
 * Confidence indicator with visual bar
 */
function ConfidenceIndicator({
  confidence,
  showLabel = true,
  size = 'md',
}: {
  confidence: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const level = getConfidenceLevel(confidence)
  const percentage = Math.round(confidence * 100)

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden', sizeClasses[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            confidence >= MEDIUM_CONFIDENCE_THRESHOLD && 'bg-green-500',
            confidence >= LOW_CONFIDENCE_THRESHOLD && confidence < MEDIUM_CONFIDENCE_THRESHOLD && 'bg-yellow-500',
            confidence < LOW_CONFIDENCE_THRESHOLD && 'bg-red-500'
          )}
        />
      </div>
      {showLabel && (
        <span className={cn('text-sm font-medium tabular-nums', level.color)}>
          {percentage}%
        </span>
      )}
    </div>
  )
}

/**
 * Statistics card for OCR metrics
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}) {
  const variantStyles = {
    default: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  }

  const iconStyles = {
    default: 'text-gray-500 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className={cn('p-3 rounded-lg border', variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', iconStyles[variant])} />
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
      {subValue && (
        <div className="text-xs text-gray-500 dark:text-gray-500">{subValue}</div>
      )}
    </div>
  )
}

/**
 * Block item component for displaying individual OCR blocks
 */
function BlockItem({
  block,
  index,
  isSelected,
  onSelect,
}: {
  block: OcrBlock
  index: number
  isSelected: boolean
  onSelect?: () => void
}) {
  const level = getConfidenceLevel(block.confidence)
  const blockId = getBlockId(block, index)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onSelect}
      className={cn(
        'p-3 rounded-lg border transition-all duration-200 cursor-pointer',
        'hover:shadow-sm',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 bg-blue-50 dark:bg-blue-900/20'
          : cn(level.bgColor, level.borderColor)
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      aria-selected={isSelected}
      aria-label={`Bloco ${index + 1}: ${block.text.substring(0, 50)}...`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getBlockTypeLabel(block.type)}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Pagina {block.page}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn('text-xs', level.color, level.bgColor, level.borderColor)}
        >
          {Math.round(block.confidence * 100)}%
        </Badge>
      </div>

      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
        {block.text}
      </p>

      {block.bounding_box && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <span>
            Posicao: ({Math.round(block.bounding_box.x)}, {Math.round(block.bounding_box.y)})
          </span>
          <span>|</span>
          <span>
            Tamanho: {Math.round(block.bounding_box.width)} x {Math.round(block.bounding_box.height)}
          </span>
        </div>
      )}
    </motion.div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <DocumentTextIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  )
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>

      {/* Text area skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Blocks skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function OcrResultsPanel({
  ocrResults,
  isLoading = false,
  compact = false,
  maxHeight,
  onBlockSelect,
  selectedBlockId,
  className,
}: OcrResultsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['text', 'stats'])

  // Filter blocks based on settings
  const filteredBlocks = useMemo(() => {
    if (!ocrResults?.result?.blocks) return []

    let blocks = ocrResults.result.blocks

    // Filter by confidence if enabled
    if (showLowConfidenceOnly) {
      blocks = blocks.filter(b => b.confidence < LOW_CONFIDENCE_THRESHOLD)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      blocks = blocks.filter(b => b.text.toLowerCase().includes(query))
    }

    return blocks
  }, [ocrResults, showLowConfidenceOnly, searchQuery])

  // Group blocks by page
  const blocksByPage = useMemo(() => {
    const grouped = new Map<number, OcrBlock[]>()
    filteredBlocks.forEach((block) => {
      const pageBlocks = grouped.get(block.page) || []
      pageBlocks.push(block)
      grouped.set(block.page, pageBlocks)
    })
    return grouped
  }, [filteredBlocks])

  // Copy text to clipboard
  const handleCopyText = async () => {
    if (!ocrResults?.result?.text) return

    try {
      await navigator.clipboard.writeText(ocrResults.result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  // Handle block selection
  const handleBlockSelect = (block: OcrBlock, index: number) => {
    onBlockSelect?.(block)
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
            Resultados do OCR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!ocrResults || !ocrResults.result) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
            Resultados do OCR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Nenhum resultado de OCR disponivel. O documento ainda nao foi processado ou ocorreu um erro." />
        </CardContent>
      </Card>
    )
  }

  const { result, hasLowConfidence, averageConfidence, lowConfidenceBlocks, pageCount, wordCount, language } =
    ocrResults
  const confidenceLevel = getConfidenceLevel(averageConfidence)

  return (
    <Card className={cn('w-full overflow-hidden', className)}>
      <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
            Resultados do OCR
          </CardTitle>

          {/* Quality indicator badge */}
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 px-3 py-1',
              confidenceLevel.color,
              confidenceLevel.bgColor,
              confidenceLevel.borderColor
            )}
          >
            {confidenceLevel.icon === 'success' && <CheckIcon className="w-3.5 h-3.5" />}
            {confidenceLevel.icon === 'warning' && <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
            {confidenceLevel.icon === 'error' && <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
            Qualidade {confidenceLevel.label}
          </Badge>
        </div>

        {/* Low confidence warning */}
        {hasLowConfidence && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Atencao: Qualidade de OCR baixa detectada
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {lowConfidenceBlocks.length} bloco(s) com confianca abaixo de{' '}
                {Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%. Revise os resultados manualmente.
              </p>
            </div>
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className={cn('w-full', maxHeight && `max-h-[${maxHeight}]`)}>
          <div className="p-4 space-y-6">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={DocumentDuplicateIcon}
                label="Paginas"
                value={pageCount}
                variant="default"
              />
              <StatCard
                icon={DocumentTextIcon}
                label="Palavras"
                value={wordCount.toLocaleString('pt-BR')}
                variant="default"
              />
              <StatCard
                icon={LanguageIcon}
                label="Idioma"
                value={getLanguageLabel(language)}
                variant="default"
              />
              <StatCard
                icon={
                  confidenceLevel.icon === 'success'
                    ? CheckIcon
                    : confidenceLevel.icon === 'warning'
                    ? ExclamationTriangleIcon
                    : ExclamationTriangleIcon
                }
                label="Confianca"
                value={`${Math.round(averageConfidence * 100)}%`}
                subValue={confidenceLevel.label}
                variant={
                  confidenceLevel.icon === 'success'
                    ? 'success'
                    : confidenceLevel.icon === 'warning'
                    ? 'warning'
                    : 'error'
                }
              />
            </div>

            {/* Confidence Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Confianca Geral</span>
                <span className={cn('font-medium', confidenceLevel.color)}>
                  {Math.round(averageConfidence * 100)}%
                </span>
              </div>
              <ConfidenceIndicator confidence={averageConfidence} showLabel={false} size="lg" />
            </div>

            {/* Full Text Section */}
            <Accordion
              type="multiple"
              value={expandedSections}
              onValueChange={setExpandedSections}
              className="space-y-2"
            >
              <AccordionItem value="text" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Texto Extraido</span>
                    <Badge variant="secondary" className="ml-2">
                      {wordCount} palavras
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="relative">
                    {/* Copy button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyText}
                      className="absolute top-2 right-2 gap-1.5 z-10"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="w-4 h-4 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>

                    {/* Text content */}
                    <div
                      className={cn(
                        'p-4 pt-12 rounded-lg border',
                        'bg-gray-50 dark:bg-gray-900/50',
                        'border-gray-200 dark:border-gray-700',
                        'max-h-96 overflow-y-auto'
                      )}
                    >
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {result.text || 'Nenhum texto extraido.'}
                      </pre>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Blocks Section */}
              <AccordionItem value="blocks" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <DocumentDuplicateIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Blocos de Texto</span>
                    <Badge variant="secondary" className="ml-2">
                      {result.blocks?.length || 0} blocos
                    </Badge>
                    {lowConfidenceBlocks.length > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {lowConfidenceBlocks.length} baixa confianca
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {/* Search input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar nos blocos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          'w-full pl-9 pr-4 py-2 text-sm rounded-lg border',
                          'bg-white dark:bg-gray-800',
                          'border-gray-200 dark:border-gray-700',
                          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          'placeholder:text-gray-400 dark:placeholder:text-gray-500'
                        )}
                      />
                    </div>

                    {/* Low confidence filter toggle */}
                    <Button
                      variant={showLowConfidenceOnly ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
                      className="gap-1.5"
                    >
                      {showLowConfidenceOnly ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                      Apenas baixa confianca
                      {showLowConfidenceOnly && (
                        <Badge variant="secondary" className="ml-1">
                          {lowConfidenceBlocks.length}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* Blocks list by page */}
                  {filteredBlocks.length > 0 ? (
                    <div className="space-y-4">
                      {Array.from(blocksByPage.entries()).map(([page, blocks]) => (
                        <div key={page}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Pagina {page}</Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {blocks.length} bloco(s)
                            </span>
                          </div>
                          <div className="space-y-2">
                            {blocks.map((block, index) => {
                              const globalIndex = result.blocks?.indexOf(block) ?? index
                              const blockId = getBlockId(block, globalIndex)
                              return (
                                <BlockItem
                                  key={blockId}
                                  block={block}
                                  index={globalIndex}
                                  isSelected={selectedBlockId === blockId}
                                  onSelect={() => handleBlockSelect(block, globalIndex)}
                                />
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <InformationCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchQuery
                          ? 'Nenhum bloco encontrado com os filtros aplicados.'
                          : showLowConfidenceOnly
                          ? 'Nenhum bloco com baixa confianca encontrado.'
                          : 'Nenhum bloco de texto disponivel.'}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Additional info */}
            {result.confidence !== undefined && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400">
                <InformationCircleIcon className="w-4 h-4" />
                <span>
                  Confianca original do documento: {Math.round(result.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
