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
} from '@heroicons/react/24/outline'
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
      label: 'Media',
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
  const displayValue = value || '-'
  const hasValue = Boolean(value)

  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${
        onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
      } ${highlight ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          hasValue ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p
          className={`text-sm mt-0.5 break-words ${
            hasValue ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'
          }`}
        >
          {displayValue}
        </p>
      </div>
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
  const confidenceInfo = getConfidenceInfo(property.confidence)

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
      className={`
        card overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={() => onClick?.(property)}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Property Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <HomeModernIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Registry Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {property.registry_number || 'Matricula nao informada'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {property.registry_office && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {property.registry_office}
              </span>
            )}
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className={confidenceInfo.badgeClass}>
            {property.confidence >= 0.8 ? (
              <CheckCircleIcon className="confidence-badge-icon" />
            ) : (
              <ExclamationCircleIcon className="confidence-badge-icon" />
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
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>
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
            <div className="p-4 space-y-1">
              {/* Registry Section */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Registro
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={DocumentTextIcon}
                    label="Matricula"
                    value={property.registry_number}
                    onClick={() => handleFieldClick('registry_number')}
                  />
                  <FieldRow
                    icon={BuildingOfficeIcon}
                    label="Cartorio de Registro"
                    value={property.registry_office}
                    onClick={() => handleFieldClick('registry_office')}
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Localizacao
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={MapPinIcon}
                    label="Endereco"
                    value={formatAddress(property.address)}
                    onClick={() => handleFieldClick('address')}
                  />
                  {formatCoordinates(property.address) && (
                    <div className="flex items-start gap-3 py-2 px-3 rounded-lg">
                      <GlobeAltIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Coordenadas
                        </p>
                        <p className="text-sm mt-0.5 text-gray-900 dark:text-white font-mono">
                          {formatCoordinates(property.address)}
                        </p>
                        {property.address && getGeocodeStatusInfo(property.address) && (
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const statusInfo = getGeocodeStatusInfo(property.address)
                              if (!statusInfo) return null
                              const StatusIcon = statusInfo.icon
                              return (
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </div>
                              )
                            })()}
                            {property.address?.geocode_confidence && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Precisao: {Math.round(property.address.geocode_confidence * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <FieldRow
                    icon={HashtagIcon}
                    label="IPTU"
                    value={property.iptu_number}
                    onClick={() => handleFieldClick('iptu_number')}
                  />
                </div>
              </div>

              {/* Details Section */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Caracteristicas
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={SquaresPlusIcon}
                    label="Area"
                    value={formatArea(property.area_sqm)}
                    onClick={() => handleFieldClick('area_sqm')}
                  />
                  <FieldRow
                    icon={ChatBubbleBottomCenterTextIcon}
                    label="Descricao"
                    value={property.description}
                    onClick={() => handleFieldClick('description')}
                  />
                </div>
              </div>

              {/* Encumbrances Section */}
              {property.encumbrances && property.encumbrances.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                    Onus ({property.encumbrances.length})
                  </h4>
                  <div className="space-y-2">
                    {property.encumbrances.map((encumbrance, index) => (
                      <EncumbranceItem
                        key={index}
                        encumbrance={encumbrance}
                        onClick={() => handleFieldClick('encumbrances')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with metadata */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    {property.source_docs?.length || 0} documento(s)
                  </span>
                  <span>
                    {filledFields}/{totalFields} campos preenchidos
                  </span>
                  {property.encumbrances && property.encumbrances.length > 0 && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <ShieldExclamationIcon className="w-4 h-4" />
                      {property.encumbrances.length} onus
                    </span>
                  )}
                </div>
                <span title={new Date(property.created_at).toLocaleString('pt-BR')}>
                  Criado em {new Date(property.created_at).toLocaleDateString('pt-BR')}
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
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {filledFields}/{totalFields} campos
                {property.encumbrances && property.encumbrances.length > 0 && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    • {property.encumbrances.length} onus
                  </span>
                )}
              </span>
              <span className="text-blue-500 dark:text-blue-400">
                Clique para expandir
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
