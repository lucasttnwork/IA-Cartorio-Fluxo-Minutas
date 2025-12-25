/**
 * SplitPersonCard Component
 *
 * Displays a merged person record that can be split back into two separate persons.
 * Shows the merged data and reconstructed original data for both persons.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SplitCandidate, Person } from '@/types'
import { cn } from '@/lib/utils'

export interface SplitPersonCardProps {
  /** The split candidate data */
  candidate: SplitCandidate
  /** Callback when split is confirmed */
  onSplit: (candidateId: string) => void
  /** Callback when split is cancelled */
  onCancel: (candidateId: string) => void
  /** Whether an action is in progress */
  isProcessing?: boolean
}

// Get badge variant for split confidence level
const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 0.8) return { variant: 'default' as const, label: 'Alta', class: 'bg-green-500' }
  if (confidence >= 0.6) return { variant: 'secondary' as const, label: 'Média', class: 'bg-yellow-500' }
  return { variant: 'outline' as const, label: 'Baixa', class: 'bg-red-500' }
}

// Format address for display
const formatAddress = (address: Person['address'] | null | undefined): string => {
  if (!address) return '-'
  const parts = [address.street, address.number, address.neighborhood, address.city, address.state]
  return parts.filter(Boolean).join(', ') || '-'
}

// Format date for display
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

interface PersonColumnProps {
  label: string
  person: Partial<Person> | undefined
  iconColor: string
}

function PersonColumn({ label, person, iconColor }: PersonColumnProps) {
  if (!person) {
    return (
      <div className="flex flex-col gap-2">
        <div className={cn("flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700")}>
          <UserIcon className={cn("w-4 h-4", iconColor)} />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </span>
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-500 italic">
          Dados não disponíveis
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700")}>
        <UserIcon className={cn("w-4 h-4", iconColor)} />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Nome:</span>
          <div className="font-medium text-gray-900 dark:text-white">{person.full_name || '-'}</div>
        </div>

        {person.cpf && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">CPF:</span>
            <div className="text-gray-900 dark:text-white">{person.cpf}</div>
          </div>
        )}

        {person.rg && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">RG:</span>
            <div className="text-gray-900 dark:text-white">{person.rg}</div>
          </div>
        )}

        {person.birth_date && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Nascimento:</span>
            <div className="text-gray-900 dark:text-white">{formatDate(person.birth_date)}</div>
          </div>
        )}

        {person.email && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">E-mail:</span>
            <div className="text-gray-900 dark:text-white">{person.email}</div>
          </div>
        )}

        {person.phone && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Telefone:</span>
            <div className="text-gray-900 dark:text-white">{person.phone}</div>
          </div>
        )}

        {person.address && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Endereço:</span>
            <div className="text-gray-900 dark:text-white">{formatAddress(person.address)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SplitPersonCard({
  candidate,
  onSplit,
  onCancel,
  isProcessing = false,
}: SplitPersonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const confidenceBadge = getConfidenceBadge(candidate.split_confidence)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Pessoa Mesclada
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Mesclado em {formatDate(candidate.merged_at)}
                  </Badge>
                  <Badge className={cn("text-xs", confidenceBadge.class)}>
                    Confiança: {Math.round(candidate.split_confidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(candidate.id)}
                disabled={isProcessing}
                className="gap-1"
              >
                <ArrowsPointingInIcon className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onSplit(candidate.id)}
                disabled={isProcessing || !candidate.can_split}
                className="gap-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
                {isProcessing ? 'Separando...' : 'Separar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Person Comparison */}
        <CardContent className="p-6">
          {/* Warning if split confidence is low */}
          {candidate.split_confidence < 0.6 && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Atenção:</strong> A confiança da separação é baixa. Alguns dados originais podem não estar disponíveis.
                  Revise cuidadosamente antes de confirmar.
                </div>
              </div>
            </div>
          )}

          {/* Current Merged Person */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Registro Atual (Mesclado)</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Nome:</span>
                <div className="font-medium text-gray-900 dark:text-white">{candidate.merged_person.full_name}</div>
              </div>
              {candidate.merged_person.cpf && (
                <div className="inline-block mr-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">CPF: </span>
                  <span className="text-gray-900 dark:text-white">{candidate.merged_person.cpf}</span>
                </div>
              )}
              {candidate.merged_person.rg && (
                <div className="inline-block mr-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">RG: </span>
                  <span className="text-gray-900 dark:text-white">{candidate.merged_person.rg}</span>
                </div>
              )}
              {candidate.merged_person.email && (
                <div className="inline-block mr-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">E-mail: </span>
                  <span className="text-gray-900 dark:text-white">{candidate.merged_person.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Split Preview: Two Persons Side by Side */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ArrowsPointingOutIcon className="w-5 h-5 text-orange-500" />
              Após a Separação
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <PersonColumn
                label="Pessoa A (Original)"
                person={candidate.original_person_a}
                iconColor="text-blue-500"
              />
              <PersonColumn
                label="Pessoa B (Original)"
                person={candidate.original_person_b}
                iconColor="text-purple-500"
              />
            </div>
          </div>

          {/* Additional Info - Expandable */}
          {candidate.merge_metadata.merge_reason && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <span className="font-medium">Informações da Mesclagem</span>
                <span>{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Motivo da Mesclagem:</span> {candidate.merge_metadata.merge_reason}
                  </div>
                  {candidate.merge_metadata.merged_from && candidate.merge_metadata.merged_from.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium">IDs Originais:</span>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {candidate.merge_metadata.merged_from.map((id, idx) => (
                          <li key={idx} className="font-mono text-xs">{id}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cannot Split Warning */}
          {!candidate.can_split && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 dark:text-red-200">
                  <strong>Não é possível separar:</strong> Dados originais insuficientes.
                  Esta mesclagem não armazenou os dados originais completos.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
