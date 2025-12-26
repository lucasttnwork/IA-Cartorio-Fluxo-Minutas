/**
 * PersonEntityCard Component
 *
 * Displays all required fields for a Person entity in a card format.
 * Used in the Canvas view and entity management interfaces.
 *
 * Features:
 * - Displays all person fields with appropriate icons
 * - Shows confidence indicator
 * - Collapsible sections for better organization
 * - Click to view evidence support
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserIcon,
  IdentificationIcon,
  CalendarIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  HeartIcon,
  HomeIcon,
  UserGroupIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '../ui/badge'
import { useDocumentNames } from '../../hooks/useDocumentNames'
import { copyToClipboard } from '../../utils/clipboard'
import type { Person, Address, MaritalStatus } from '../../types'

export interface PersonEntityCardProps {
  /** The person entity data */
  person: Person
  /** Whether to show in compact mode (fewer fields visible) */
  compact?: boolean
  /** Whether the card is selected */
  isSelected?: boolean
  /** Callback when the card is clicked */
  onClick?: (person: Person) => void
  /** Callback when a specific field is clicked (for evidence viewing) */
  onFieldClick?: (person: Person, fieldName: string) => void
  /** Additional class names */
  className?: string
}

// Map marital status to Portuguese labels
const maritalStatusLabels: Record<MaritalStatus, string> = {
  single: 'Solteiro(a)',
  married: 'Casado(a)',
  divorced: 'Divorciado(a)',
  widowed: 'Viuvo(a)',
  separated: 'Separado(a)',
  stable_union: 'União Estável',
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
      className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors group ${
        onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
      } ${highlight ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      {hasValue && isHovered && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`Copiar ${label}`}
          title={`Copiar ${label}`}
        >
          <ClipboardDocumentIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      )}
    </div>
  )
}

export default function PersonEntityCard({
  person,
  compact = false,
  isSelected = false,
  onClick,
  onFieldClick,
  className = '',
}: PersonEntityCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [showAllDocs, setShowAllDocs] = useState(false)
  const confidenceInfo = getConfidenceInfo(person.confidence)
  const { documents, loading: loadingDocs } = useDocumentNames(person.source_docs)

  // Handle field click
  const handleFieldClick = (fieldName: string) => {
    if (onFieldClick) {
      onFieldClick(person, fieldName)
    }
  }

  // Count filled fields
  const totalFields = 14 // Total number of person fields
  const filledFields = [
    person.full_name,
    person.cpf,
    person.rg,
    person.rg_issuer,
    person.birth_date,
    person.nationality,
    person.marital_status,
    person.profession,
    person.address,
    person.email,
    person.phone,
    person.father_name,
    person.mother_name,
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
      onClick={() => onClick?.(person)}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Person Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Name and Basic Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {person.full_name || 'Nome não informado'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {person.cpf && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                CPF: {person.cpf}
              </span>
            )}
            {person.cpf && person.rg && (
              <span className="text-gray-300 dark:text-gray-600">|</span>
            )}
            {person.rg && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                RG: {person.rg}
              </span>
            )}
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className={confidenceInfo.badgeClass}>
            {person.confidence >= 0.8 ? (
              <CheckCircleIcon className="confidence-badge-icon" />
            ) : (
              <ExclamationCircleIcon className="confidence-badge-icon" />
            )}
            {Math.round(person.confidence * 100)}%
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
              {/* Identity Section */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Identificação
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={UserIcon}
                    label="Nome Completo"
                    value={person.full_name}
                    onClick={() => handleFieldClick('full_name')}
                  />
                  <FieldRow
                    icon={IdentificationIcon}
                    label="CPF"
                    value={person.cpf}
                    onClick={() => handleFieldClick('cpf')}
                  />
                  <FieldRow
                    icon={IdentificationIcon}
                    label="RG"
                    value={person.rg ? `${person.rg}${person.rg_issuer ? ` - ${person.rg_issuer}` : ''}` : null}
                    onClick={() => handleFieldClick('rg')}
                  />
                  <FieldRow
                    icon={CalendarIcon}
                    label="Data de Nascimento"
                    value={person.birth_date}
                    onClick={() => handleFieldClick('birth_date')}
                  />
                  <FieldRow
                    icon={MapPinIcon}
                    label="Nacionalidade"
                    value={person.nationality}
                    onClick={() => handleFieldClick('nationality')}
                  />
                </div>
              </div>

              {/* Personal Info Section */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Informações Pessoais
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={HeartIcon}
                    label="Estado Civil"
                    value={person.marital_status ? maritalStatusLabels[person.marital_status] : null}
                    onClick={() => handleFieldClick('marital_status')}
                  />
                  <FieldRow
                    icon={BriefcaseIcon}
                    label="Profissao"
                    value={person.profession}
                    onClick={() => handleFieldClick('profession')}
                  />
                </div>
              </div>

              {/* Contact Section */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Contato
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={HomeIcon}
                    label="Endereço"
                    value={formatAddress(person.address)}
                    onClick={() => handleFieldClick('address')}
                  />
                  <FieldRow
                    icon={EnvelopeIcon}
                    label="E-mail"
                    value={person.email}
                    onClick={() => handleFieldClick('email')}
                  />
                  <FieldRow
                    icon={PhoneIcon}
                    label="Telefone"
                    value={person.phone}
                    onClick={() => handleFieldClick('phone')}
                  />
                </div>
              </div>

              {/* Family Section */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Filiação
                </h4>
                <div className="space-y-0.5">
                  <FieldRow
                    icon={UserGroupIcon}
                    label="Nome do Pai"
                    value={person.father_name}
                    onClick={() => handleFieldClick('father_name')}
                  />
                  <FieldRow
                    icon={UserGroupIcon}
                    label="Nome da Mãe"
                    value={person.mother_name}
                    onClick={() => handleFieldClick('mother_name')}
                  />
                </div>
              </div>
            </div>

            {/* Footer with metadata */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Source Documents Chips */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Documentos de Origem ({documents.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showAllDocs ? documents : documents.slice(0, 3)).map((doc) => (
                      <Badge
                        key={doc.id}
                        variant="outline"
                        className="text-xs font-normal max-w-[200px] truncate cursor-default hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Mostrar menos
                      </button>
                    )}
                  </div>
                </div>
              )}
              {loadingDocs && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-4 h-4 animate-pulse" />
                  <span>Carregando documentos...</span>
                </div>
              )}
              {!loadingDocs && documents.length === 0 && person.source_docs && person.source_docs.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{person.source_docs.length} documento(s)</span>
                </div>
              )}

              {/* Field count and creation date */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>
                  {filledFields}/{totalFields} campos preenchidos
                </span>
                <span title={new Date(person.created_at).toLocaleString('pt-BR')}>
                  Criado em {new Date(person.created_at).toLocaleDateString('pt-BR')}
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
