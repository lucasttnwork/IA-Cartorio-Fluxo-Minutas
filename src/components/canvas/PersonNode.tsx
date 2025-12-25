import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { UserIcon, IdentificationIcon, PhoneIcon, EnvelopeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import type { Person } from '../../types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface PersonNodeData extends Record<string, unknown> {
  person: Person
}

interface PersonNodeProps {
  data: PersonNodeData
  selected?: boolean
}

function PersonNode({ data, selected }: PersonNodeProps) {
  const { person } = data

  return (
    <Card
      className={cn(
        'glass-elevated transition-all duration-300 min-w-[300px] max-w-[340px] overflow-hidden',
        'hover:shadow-2xl hover:scale-[1.02]',
        selected
          ? 'border-blue-500 shadow-2xl ring-4 ring-blue-400/50 ring-offset-2 scale-105'
          : 'border-white/30 dark:border-gray-700/60 hover:border-blue-400/60 dark:hover:border-blue-500/60'
      )}
    >
      {/* Handle for incoming connections (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800",
          "transition-all duration-200 hover:scale-150"
        )}
      />

      {/* Header with enhanced gradient */}
      <div className={cn(
        "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-4 relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      )}>
        <div className="flex items-center gap-3 relative z-10">
          <div className={cn(
            "p-2.5 bg-white/25 backdrop-blur-sm rounded-full",
            "shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-12"
          )}>
            <UserIcon className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate drop-shadow-sm">
              {person.full_name || 'Nome não informado'}
            </p>
            <p className="text-xs text-blue-100 font-medium">Pessoa Física</p>
          </div>
        </div>
      </div>

      {/* Content with enhanced spacing */}
      <CardContent className="p-4 space-y-2.5 bg-gradient-to-b from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-800/30">
        {/* CPF */}
        {person.cpf && (
          <div className={cn(
            "flex items-center gap-2.5 text-xs p-2 rounded-md",
            "bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]"
          )}>
            <IdentificationIcon className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">CPF:</span>
            <span className="text-gray-900 dark:text-white font-semibold">{person.cpf}</span>
          </div>
        )}

        {/* RG */}
        {person.rg && (
          <div className={cn(
            "flex items-center gap-2.5 text-xs p-2 rounded-md",
            "bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]"
          )}>
            <IdentificationIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">RG:</span>
            <span className="text-gray-900 dark:text-white font-semibold">{person.rg}</span>
          </div>
        )}

        {/* Email */}
        {person.email && (
          <div className={cn(
            "flex items-center gap-2.5 text-xs p-2 rounded-md",
            "bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]"
          )}>
            <EnvelopeIcon className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-white font-semibold truncate">{person.email}</span>
          </div>
        )}

        {/* Phone */}
        {person.phone && (
          <div className={cn(
            "flex items-center gap-2.5 text-xs p-2 rounded-md",
            "bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]"
          )}>
            <PhoneIcon className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-white font-semibold">{person.phone}</span>
          </div>
        )}

        {/* Marital Status */}
        {person.marital_status && (
          <div className={cn(
            "text-xs p-2 rounded-md",
            "bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80"
          )}>
            <span className="text-gray-600 dark:text-gray-400 font-medium">Estado Civil:</span>{' '}
            <span className="text-gray-900 dark:text-white font-semibold">
              {person.marital_status === 'single'
                ? 'Solteiro(a)'
                : person.marital_status === 'married'
                ? 'Casado(a)'
                : person.marital_status === 'divorced'
                ? 'Divorciado(a)'
                : person.marital_status === 'widowed'
                ? 'Viúvo(a)'
                : person.marital_status === 'stable_union'
                ? 'União Estável'
                : person.marital_status}
            </span>
          </div>
        )}

        {/* Enhanced Confidence Badge */}
        <div className="flex justify-end pt-2">
          <Badge
            className={cn(
              'font-semibold text-xs px-3 py-1.5 shadow-md transition-all duration-300',
              'flex items-center gap-1.5 hover:scale-105',
              person.confidence >= 0.8
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 shadow-green-200 dark:shadow-green-900/50'
                : person.confidence >= 0.6
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-400 shadow-yellow-200 dark:shadow-yellow-900/50'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400 shadow-red-200 dark:shadow-red-900/50'
            )}
          >
            {person.confidence >= 0.8 ? (
              <CheckCircleIcon className="w-3.5 h-3.5" />
            ) : (
              <ExclamationCircleIcon className="w-3.5 h-3.5" />
            )}
            {Math.round(person.confidence * 100)}% confiança
          </Badge>
        </div>
      </CardContent>

      {/* Handle for outgoing connections (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800",
          "transition-all duration-200 hover:scale-150"
        )}
      />
    </Card>
  )
}

export default memo(PersonNode)
