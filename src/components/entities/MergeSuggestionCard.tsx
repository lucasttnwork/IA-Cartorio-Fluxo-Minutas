/**
 * MergeSuggestionCard Component
 *
 * Displays a side-by-side comparison of two person records that may be duplicates.
 * Shows matching and conflicting fields to help users decide whether to merge.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Person, MergeSuggestion } from '@/types'
import { cn } from '@/lib/utils'

export interface MergeSuggestionCardProps {
  /** The merge suggestion data */
  suggestion: MergeSuggestion
  /** Person A record */
  personA: Person
  /** Person B record */
  personB: Person
  /** Callback when merge is accepted */
  onAccept: (suggestionId: string, personAId: string, personBId: string) => void
  /** Callback when merge is rejected */
  onReject: (suggestionId: string) => void
  /** Whether an action is in progress */
  isProcessing?: boolean
}

// Map reason codes to human-readable labels
const reasonLabels: Record<string, string> = {
  same_cpf: 'CPF idêntico',
  similar_name: 'Nome similar',
  same_rg: 'RG idêntico',
  name_and_birth_date: 'Nome + Data de Nascimento',
  name_and_address: 'Nome + Endereço',
}

// Get badge variant for confidence level
const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 0.8) return { variant: 'default' as const, label: 'Alta', class: 'bg-green-500' }
  if (confidence >= 0.6) return { variant: 'secondary' as const, label: 'Média', class: 'bg-yellow-500' }
  return { variant: 'outline' as const, label: 'Baixa', class: 'bg-red-500' }
}

// Format address for display
const formatAddress = (person: Person): string => {
  if (!person.address) return '-'
  const addr = person.address
  const parts = [addr.street, addr.number, addr.neighborhood, addr.city, addr.state]
  return parts.filter(Boolean).join(', ') || '-'
}

interface FieldComparisonProps {
  label: string
  valueA: string | null | undefined
  valueB: string | null | undefined
  isMatching: boolean
}

function FieldComparison({ label, valueA, valueB, isMatching }: FieldComparisonProps) {
  const displayA = valueA || '-'
  const displayB = valueB || '-'

  return (
    <div className={cn(
      "grid grid-cols-3 gap-3 p-3 rounded-lg transition-colors",
      isMatching ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"
    )}>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {isMatching ? (
          <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />
        ) : (
          <InformationCircleIcon className="w-4 h-4 mr-1 text-amber-500" />
        )}
        {label}
      </div>
      <div className="text-sm text-gray-900 dark:text-white break-words">
        {displayA}
      </div>
      <div className="text-sm text-gray-900 dark:text-white break-words">
        {displayB}
      </div>
    </div>
  )
}

export default function MergeSuggestionCard({
  suggestion,
  personA,
  personB,
  onAccept,
  onReject,
  isProcessing = false,
}: MergeSuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const confidenceBadge = getConfidenceBadge(suggestion.confidence)

  // Determine which fields match
  const matchingFields = new Set(suggestion.matching_fields)
  const conflictingFields = new Set(suggestion.conflicting_fields)

  // Field comparison list
  const fields = [
    { key: 'full_name', label: 'Nome Completo', valueA: personA.full_name, valueB: personB.full_name },
    { key: 'cpf', label: 'CPF', valueA: personA.cpf, valueB: personB.cpf },
    { key: 'rg', label: 'RG', valueA: personA.rg, valueB: personB.rg },
    { key: 'birth_date', label: 'Data de Nascimento', valueA: personA.birth_date, valueB: personB.birth_date },
    { key: 'nationality', label: 'Nacionalidade', valueA: personA.nationality, valueB: personB.nationality },
    { key: 'marital_status', label: 'Estado Civil', valueA: personA.marital_status, valueB: personB.marital_status },
    { key: 'profession', label: 'Profissão', valueA: personA.profession, valueB: personB.profession },
    { key: 'email', label: 'E-mail', valueA: personA.email, valueB: personB.email },
    { key: 'phone', label: 'Telefone', valueA: personA.phone, valueB: personB.phone },
    { key: 'address', label: 'Endereço', valueA: formatAddress(personA), valueB: formatAddress(personB) },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Possível Duplicata
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {reasonLabels[suggestion.reason] || suggestion.reason}
                  </Badge>
                  <Badge className={cn("text-xs", confidenceBadge.class)}>
                    Confiança: {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(suggestion.id)}
                disabled={isProcessing}
                className="gap-1"
              >
                <XCircleIcon className="w-4 h-4" />
                Rejeitar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onAccept(suggestion.id, personA.id, personB.id)}
                disabled={isProcessing}
                className="gap-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {isProcessing ? 'Mesclando...' : 'Mesclar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Person Comparison */}
        <CardContent className="p-6">
          {/* Headers */}
          <div className="grid grid-cols-3 gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Campo
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-500" />
              Pessoa A
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-purple-500" />
              Pessoa B
            </div>
          </div>

          {/* Field Comparisons */}
          <div className="space-y-2">
            {/* Always show key fields */}
            {fields.slice(0, 4).map((field) => (
              <FieldComparison
                key={field.key}
                label={field.label}
                valueA={field.valueA}
                valueB={field.valueB}
                isMatching={matchingFields.has(field.key)}
              />
            ))}

            {/* Expandable section for additional fields */}
            {isExpanded && fields.slice(4).map((field) => (
              <FieldComparison
                key={field.key}
                label={field.label}
                valueA={field.valueA}
                valueB={field.valueB}
                isMatching={matchingFields.has(field.key)}
              />
            ))}
          </div>

          {/* Expand/Collapse Button */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Ver Menos' : 'Ver Todos os Campos'}
            </Button>
          </div>

          {/* Statistics */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {suggestion.matching_fields.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Campos Coincidentes
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {suggestion.conflicting_fields.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Campos Conflitantes
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(suggestion.similarity_score * 100)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Similaridade
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {suggestion.notes && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Observação:</span> {suggestion.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
