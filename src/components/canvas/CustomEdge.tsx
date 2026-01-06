import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react'
import { motion } from 'framer-motion'
import { DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export interface CustomEdgeData {
  label?: string
  confirmed?: boolean
  confidence?: number
  animated?: boolean
  strokeColor?: string
  strokeWidth?: number
  hasProxy?: boolean
  relationship?: string
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<CustomEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const confirmed = data?.confirmed ?? false
  const animated = data?.animated ?? !confirmed
  const strokeColor = data?.strokeColor ?? (confirmed ? '#10b981' : '#f59e0b')
  const strokeWidth = data?.strokeWidth ?? 2
  const label = data?.label
  const confidence = data?.confidence
  const hasProxy = data?.hasProxy ?? false
  const relationship = data?.relationship ?? ''
  const isRepresentsRelationship = relationship === 'represents'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: animated ? '5,5' : undefined,
          animation: animated ? 'dash 1s linear infinite' : undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </div>
                {isRepresentsRelationship && (
                  hasProxy ? (
                    <DocumentTextIcon
                      className="w-3.5 h-3.5 text-purple-500"
                      title="Procuracao anexada"
                    />
                  ) : (
                    <ExclamationTriangleIcon
                      className="w-3.5 h-3.5 text-amber-500"
                      title="Procuracao nao anexada"
                    />
                  )
                )}
              </div>
              {confidence !== undefined && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {Math.round(confidence * 100)}% confiança
                </div>
              )}
            </motion.div>
          </div>
        </EdgeLabelRenderer>
      )}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </>
  )
}
