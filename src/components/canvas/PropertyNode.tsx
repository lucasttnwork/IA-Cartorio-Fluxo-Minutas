import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { HomeIcon, MapPinIcon, DocumentTextIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import type { Property } from '../../types'

export interface PropertyNodeData {
  property: Property
}

function PropertyNode({ data, selected }: NodeProps<PropertyNodeData>) {
  const { property } = data

  // Format address for display
  const formatAddress = () => {
    if (!property.address) return null
    const addr = property.address
    return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''} - ${addr.neighborhood}, ${addr.city}/${addr.state}`
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all ${
        selected
          ? 'border-green-500 shadow-xl'
          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
      }`}
      style={{ minWidth: '280px', maxWidth: '320px' }}
    >
      {/* Handle for incoming connections (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500" />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full">
            <HomeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {property.registry_number || 'Imóvel'}
            </p>
            <p className="text-xs text-green-100">Propriedade</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Registry Number */}
        {property.registry_number && (
          <div className="flex items-center gap-2 text-xs">
            <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">Matrícula:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {property.registry_number}
            </span>
          </div>
        )}

        {/* Registry Office */}
        {property.registry_office && (
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">Cartório:</span>{' '}
            <span className="text-gray-900 dark:text-white font-medium">
              {property.registry_office}
            </span>
          </div>
        )}

        {/* Address */}
        {property.address && (
          <div className="flex items-start gap-2 text-xs">
            <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-900 dark:text-white font-medium line-clamp-2">
              {formatAddress()}
            </span>
          </div>
        )}

        {/* Area */}
        {property.area_sqm && (
          <div className="text-xs">
            <span className="text-gray-600 dark:text-gray-400">Área:</span>{' '}
            <span className="text-gray-900 dark:text-white font-medium">
              {property.area_sqm.toLocaleString('pt-BR')} m²
            </span>
          </div>
        )}

        {/* IPTU */}
        {property.iptu_number && (
          <div className="flex items-center gap-2 text-xs">
            <BanknotesIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">IPTU:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {property.iptu_number}
            </span>
          </div>
        )}

        {/* Description (truncated) */}
        {property.description && (
          <div className="text-xs">
            <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
              {property.description}
            </p>
          </div>
        )}

        {/* Encumbrances Badge */}
        {property.encumbrances && property.encumbrances.length > 0 && (
          <div className="pt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              {property.encumbrances.length} ônus/gravame(s)
            </span>
          </div>
        )}

        {/* Confidence Badge */}
        <div className="flex justify-end pt-1">
          <span
            className={
              property.confidence >= 0.8
                ? 'confidence-badge-high'
                : property.confidence >= 0.6
                ? 'confidence-badge-medium'
                : 'confidence-badge-low'
            }
          >
            {Math.round(property.confidence * 100)}% confiança
          </span>
        </div>
      </div>

      {/* Handle for outgoing connections (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500" />
    </div>
  )
}

export default memo(PropertyNode)
