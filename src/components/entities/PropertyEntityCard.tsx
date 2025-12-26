/**
 * PropertyEntityCard Component
 *
 * Displays all required fields for a Property entity in a card format.
 * Used in the Canvas view and entity management interfaces.
 *
 * Features:
 * - Displays all property fields with appropriate icons
 * - Shows confidence indicator
 * - Collapsible sections for better organization
 * - Click to view evidence support
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeModernIcon,
  DocumentTextIcon,
  MapPinIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  SquaresPlusIcon,
  ChatBubbleBottomCenterTextIcon,
  HashtagIcon,
  ShieldExclamationIcon,
  BanknotesIcon,
  UserIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { useDocumentNames } from '../../hooks/useDocumentNames'
import { copyToClipboard } from '../../utils/clipboard'
import type { Property, Address, Encumbrance } from '../../types'

export interface PropertyEntityCardProps {
  /** The property entity data */
  property: Property
  /** Whether to show in compact mode (fewer fields visible) */
  compact?: boolean
  /** Whether the card is selected */
  isSelected?: boolean
  /** Callback when the card is clicked */
  onClick?: (property: Property) => void
  /** Callback when a specific field is clicked (for evidence viewing) */
  onFieldClick?: (property: Property, fieldName: string) => void
  /** Additional class names */
  className?: string
}

// Helper to format address
const formatAddress = (address: Address | null): string => {
  if (!address) return '-'
  const parts = [
    address.street,
    address.number,
    address.complement,
    address.neighborhood,
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean)
  return parts.join(', ') || '-'
}

// Helper to format coordinates
const formatCoordinates = (address: Address | null): string | null => {
  if (!address || !address.latitude || !address.longitude) return null
  return `${address.latitude.toFixed(6)}, ${address.longitude.toFixed(6)}`
}

// Helper to get geocode status info
const getGeocodeStatusInfo = (address: Address | null): {
  color: string
  bgColor: string
  label: string
  icon: React.ElementType
} | null => {
  if (!address || !address.geocode_status) return null

  switch (address.geocode_status) {
    case 'success':
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        label: 'Validado',
        icon: CheckCircleIcon,
      }
    case 'partial':
      return {
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'Parcial',
        icon: ExclamationCircleIcon,
      }
    case 'failed':
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        label: 'Falhou',
        icon: ExclamationCircleIcon,
      }
    case 'pending':
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        label: 'Pendente',
        icon: GlobeAltIcon,
      }
    default:
      return null
  }
}

// Helper to format area
const formatArea = (areaSqm: number | null): string => {
  if (areaSqm === null) return '-'
  return `${areaSqm.toLocaleString('pt-BR')} m²`
}

// Helper to format encumbrance value
const formatValue = (value: number | undefined): string => {
  if (value === undefined) return ''
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Helper to get confidence badge class and label
const getConfidenceInfo = (confidence: number): { badgeClass: string; label: string } => {
  if (confidence >= 0.8) {
    return {
      badgeClass: 'confidence-badge-high',
      label: 'Alta',
    }
  }
  if (confidence >= 0.6) {
    return {
      badgeClass: 'confidence-badge-medium',
      label: 'Média',
    }
  }
  return {
    badgeClass: 'confidence-badge-low',
    label: 'Baixa',
  }
}

// Field display component
interface FieldRowProps {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  onClick?: () => void
  highlight?: boolean
}

function FieldRow({ icon: Icon, label, value, onClick, highlight }: FieldRowProps) {
  const [isHovered, setIsHovered] = useState(false)
  const displayValue = value || '-'
  const hasValue = Boolean(value)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value) {
      await copyToClipboard(value, label)
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 py-1.5 px-2 rounded transition-colors text-xs group',
        onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30' : '',
        highlight ? 'bg-amber-50 dark:bg-amber-900/20' : ''
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <Icon
        className={cn(
          'w-4 h-4 flex-shrink-0 mt-0.5',
          hasValue ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
        )}
      />
      <div className="flex-1 min-w-0">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>{' '}
        <span
          className={cn(
            'font-medium',
            hasValue ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'
          )}
        >
          {displayValue}
        </span>
      </div>
      {hasValue && isHovered && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`Copiar ${label}`}
          title={`Copiar ${label}`}
        >
          <ClipboardDocumentIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        </button>
      )}
    </div>
  )
}

// Encumbrance item component
interface EncumbranceItemProps {
  encumbrance: Encumbrance
  onClick?: () => void
}

function EncumbranceItem({ encumbrance, onClick }: EncumbranceItemProps) {
  return (
    <div
      className={`p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 ${
        onClick ? 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start gap-2">
        <ShieldExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900 dark:text-red-100">
            {encumbrance.type}
          </p>
          {encumbrance.description && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {encumbrance.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-red-600 dark:text-red-400">
            {encumbrance.value !== undefined && (
              <span className="flex items-center gap-1">
                <BanknotesIcon className="w-4 h-4" />
                {formatValue(encumbrance.value)}
              </span>
            )}
            {encumbrance.beneficiary && (
              <span className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                {encumbrance.beneficiary}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PropertyEntityCard({
  property,
  compact = false,
  isSelected = false,
  onClick,
  onFieldClick,
  className = '',
}: PropertyEntityCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [showAllDocs, setShowAllDocs] = useState(false)
  const confidenceInfo = getConfidenceInfo(property.confidence)
  const { documents, loading: loadingDocs } = useDocumentNames(property.source_docs)

  // Handle field click
  const handleFieldClick = (fieldName: string) => {
    if (onFieldClick) {
      onFieldClick(property, fieldName)
    }
  }

  // Count filled fields
  const totalFields = 6 // Core property fields: registry_number, registry_office, address, area_sqm, description, iptu_number
  const filledFields = [
    property.registry_number,
    property.registry_office,
    property.address,
    property.area_sqm !== null ? 'area' : null,
    property.description,
    property.iptu_number,
  ].filter(Boolean).length

  return (
    <motion.div
      layout="position"
      className={cn(
        'glass-card overflow-hidden transition-all min-w-[280px] max-w-[400px]',
        isSelected
          ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900 shadow-xl border-green-500'
          : 'border-white/20 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-600',
        onClick ? 'cursor-pointer' : '',
        className
      )}
      onClick={() => onClick?.(property)}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-t-lg">
        <div className="flex items-center gap-3">
          {/* Property Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-white/20 rounded-full">
              <HomeModernIcon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Registry Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {property.registry_number || 'Matrícula não informada'}
            </h3>
            {property.registry_office && (
              <p className="text-xs text-green-100 truncate">
                {property.registry_office}
              </p>
            )}
          </div>

          {/* Confidence Badge and Expand/Collapse */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                property.confidence >= 0.8
                  ? 'bg-white/90 text-green-800'
                  : property.confidence >= 0.6
                  ? 'bg-white/90 text-amber-800'
                  : 'bg-white/90 text-red-800'
              )}
            >
              {property.confidence >= 0.8 ? (
                <CheckCircleIcon className="w-3 h-3" />
              ) : (
                <ExclamationCircleIcon className="w-3 h-3" />
              )}
              {Math.round(property.confidence * 100)}%
            </div>

            {/* Expand/Collapse Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-1 rounded-md hover:bg-white/20 transition-colors"
              aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDownIcon className="w-5 h-5 text-white" />
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* Card Content - Expandable */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {/* Registry Number */}
              {property.registry_number && (
                <FieldRow
                  icon={DocumentTextIcon}
                  label="Matrícula"
                  value={property.registry_number}
                  onClick={() => handleFieldClick('registry_number')}
                />
              )}

              {/* Registry Office */}
              {property.registry_office && (
                <FieldRow
                  icon={BuildingOfficeIcon}
                  label="Cartório"
                  value={property.registry_office}
                  onClick={() => handleFieldClick('registry_office')}
                />
              )}

              {/* Address */}
              {property.address && (
                <FieldRow
                  icon={MapPinIcon}
                  label="Endereço"
                  value={formatAddress(property.address)}
                  onClick={() => handleFieldClick('address')}
                />
              )}

              {/* Coordinates */}
              {formatCoordinates(property.address) && (
                <div className="flex items-start gap-2 py-1.5 px-2 text-xs">
                  <GlobeAltIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500 dark:text-green-400" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Coordenadas:</span>{' '}
                    <span className="text-gray-900 dark:text-white font-medium font-mono text-xs">
                      {formatCoordinates(property.address)}
                    </span>
                    {property.address && getGeocodeStatusInfo(property.address) && (
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const statusInfo = getGeocodeStatusInfo(property.address)
                          if (!statusInfo) return null
                          const StatusIcon = statusInfo.icon
                          return (
                            <div className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs', statusInfo.bgColor, statusInfo.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </div>
                          )
                        })()}
                        {property.address?.geocode_confidence && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(property.address.geocode_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Area */}
              {property.area_sqm && (
                <FieldRow
                  icon={SquaresPlusIcon}
                  label="Área"
                  value={formatArea(property.area_sqm)}
                  onClick={() => handleFieldClick('area_sqm')}
                />
              )}

              {/* IPTU */}
              {property.iptu_number && (
                <FieldRow
                  icon={HashtagIcon}
                  label="IPTU"
                  value={property.iptu_number}
                  onClick={() => handleFieldClick('iptu_number')}
                />
              )}

              {/* Description */}
              {property.description && (
                <div className="flex items-start gap-2 py-1.5 px-2 text-xs">
                  <ChatBubbleBottomCenterTextIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500 dark:text-green-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {property.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Encumbrances Badge */}
              {property.encumbrances && property.encumbrances.length > 0 && (
                <div className="pt-1">
                  <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50 text-xs">
                    {property.encumbrances.length} ônus/gravame(s)
                  </Badge>
                </div>
              )}
            </div>

            {/* Footer with metadata */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Source Documents Chips */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Documentos de Origem ({documents.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(showAllDocs ? documents : documents.slice(0, 3)).map((doc) => (
                      <Badge
                        key={doc.id}
                        variant="outline"
                        className="text-xs font-normal max-w-[180px] truncate cursor-default hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={doc.name}
                      >
                        <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                        {doc.name}
                      </Badge>
                    ))}
                    {documents.length > 3 && !showAllDocs && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAllDocs(true)
                        }}
                        className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                      >
                        +{documents.length - 3} mais
                      </button>
                    )}
                    {documents.length > 3 && showAllDocs && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAllDocs(false)
                        }}
                        className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                      >
                        Mostrar menos
                      </button>
                    )}
                  </div>
                </div>
              )}
              {loadingDocs && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-3.5 h-3.5 animate-pulse" />
                  <span>Carregando documentos...</span>
                </div>
              )}
              {!loadingDocs && documents.length === 0 && property.source_docs && property.source_docs.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-3.5 h-3.5" />
                  <span>{property.source_docs.length} doc(s)</span>
                </div>
              )}

              {/* Field count and creation date */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>
                  {filledFields}/{totalFields} campos
                </span>
                <span className="text-xs" title={new Date(property.created_at).toLocaleString('pt-BR')}>
                  {new Date(property.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Footer (when collapsed) */}
      <AnimatePresence initial={false}>
        {!isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {filledFields}/{totalFields} campos
                {property.encumbrances && property.encumbrances.length > 0 && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    • {property.encumbrances.length} ônus
                  </span>
                )}
              </span>
              <span className="text-green-500 dark:text-green-400 text-xs">
                Clique para expandir
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
