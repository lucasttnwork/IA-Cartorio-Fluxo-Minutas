/**
 * DraftVersionHistory Component
 *
 * Displays a list of all draft versions for a case and allows users to:
 * - View different versions
 * - Compare versions
 * - See version metadata (timestamp, status, version number)
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Draft, DraftStatus } from '../../types'

export interface DraftVersionHistoryProps {
  versions: Draft[]
  currentVersionId: string | null
  onVersionSelect: (versionId: string) => void
  onCompareVersions?: (versionAId: string, versionBId: string) => void
  className?: string
}

export function DraftVersionHistory({
  versions,
  currentVersionId,
  onVersionSelect,
  onCompareVersions,
  className,
}: DraftVersionHistoryProps) {
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null)

  // Sort versions by version number descending (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version)

  const handleVersionClick = (versionId: string) => {
    if (onCompareVersions && selectedForCompare) {
      // If we already have one version selected for comparison, compare them
      onCompareVersions(selectedForCompare, versionId)
      setSelectedForCompare(null)
    } else {
      // Otherwise, just select this version
      onVersionSelect(versionId)
    }
  }

  const handleCompareSelect = (versionId: string) => {
    if (selectedForCompare === versionId) {
      setSelectedForCompare(null)
    } else {
      setSelectedForCompare(versionId)
    }
  }

  const getStatusBadge = (status: DraftStatus) => {
    const statusConfig = {
      generated: { label: 'Gerado', variant: 'secondary' as const },
      reviewing: { label: 'Em Revisão', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
    }

    const config = statusConfig[status] || statusConfig.generated

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-sm">Histórico de Versões</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {versions.length} {versions.length === 1 ? 'versão' : 'versões'}
          </Badge>
        </div>
        {onCompareVersions && selectedForCompare && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            Selecione outra versão para comparar
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-2">
          {sortedVersions.map((version, index) => {
            const isCurrentVersion = version.id === currentVersionId
            const isSelectedForCompare = version.id === selectedForCompare

            return (
              <div key={version.id}>
                <div
                  className={`
                    relative p-3 rounded-lg border transition-all cursor-pointer
                    ${isCurrentVersion
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${isSelectedForCompare
                      ? 'ring-2 ring-blue-400'
                      : ''
                    }
                  `}
                  onClick={() => handleVersionClick(version.id)}
                >
                  {/* Version header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-semibold text-sm">
                          Versão {version.version}
                          {index === 0 && (
                            <span className="ml-2 text-xs text-gray-500">(Atual)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(version.status)}
                  </div>

                  {/* Version metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {new Date(version.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {version.pending_items && version.pending_items.length > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        {version.pending_items.length} pendente(s)
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onVersionSelect(version.id)
                      }}
                      className="flex items-center gap-1 text-xs h-7"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      Visualizar
                    </Button>

                    {onCompareVersions && versions.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompareSelect(version.id)
                        }}
                        className={`flex items-center gap-1 text-xs h-7 ${
                          isSelectedForCompare ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        {isSelectedForCompare ? 'Selecionado' : 'Comparar'}
                      </Button>
                    )}
                  </div>

                  {isCurrentVersion && (
                    <div className="absolute top-2 right-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>

                {index < sortedVersions.length - 1 && <Separator className="my-2" />}
              </div>
            )
          })}

          {versions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma versão encontrada</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}

// Missing import
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
