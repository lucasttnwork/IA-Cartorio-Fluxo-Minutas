import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { UserIcon, IdentificationIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import type { Person } from '../../types'

export interface PersonNodeData {
  person: Person
}

function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const { person } = data

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all ${
        selected
          ? 'border-blue-500 shadow-xl'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
      }`}
      style={{ minWidth: '280px', maxWidth: '320px' }}
    >
      {/* Handle for incoming connections (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {person.full_name}
            </p>
            <p className="text-xs text-blue-100">Pessoa</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* CPF */}
        {person.cpf && (
          <div className="flex items-center gap-2 text-xs">
            <IdentificationIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">CPF:</span>
            <span className="text-gray-900 dark:text-white font-medium">{person.cpf}</span>
          </div>
        )}

        {/* RG */}
        {person.rg && (
          <div className="flex items-center gap-2 text-xs">
            <IdentificationIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">RG:</span>
            <span className="text-gray-900 dark:text-white font-medium">{person.rg}</span>
          </div>
        )}

        {/* Email */}
        {person.email && (
          <div className="flex items-center gap-2 text-xs">
            <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-white font-medium truncate">{person.email}</span>
          </div>
        )}

        {/* Phone */}
        {person.phone && (
          <div className="flex items-center gap-2 text-xs">
            <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-white font-medium">{person.phone}</span>
          </div>
        )}

        {/* Marital Status */}
        {person.marital_status && (
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">Estado Civil:</span>{' '}
            <span className="text-gray-900 dark:text-white font-medium">
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

        {/* Confidence Badge */}
        <div className="flex justify-end pt-1">
          <span
            className={
              person.confidence >= 0.8
                ? 'confidence-badge-high'
                : person.confidence >= 0.6
                ? 'confidence-badge-medium'
                : 'confidence-badge-low'
            }
          >
            {Math.round(person.confidence * 100)}% confiança
          </span>
        </div>
      </div>

      {/* Handle for outgoing connections (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
    </div>
  )
}

export default memo(PersonNode)
