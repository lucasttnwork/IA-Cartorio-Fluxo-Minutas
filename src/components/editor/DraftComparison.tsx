/**
 * DraftComparison Component
 *
 * Displays two draft versions side-by-side for comparison
 * Features:
 * - Split-pane layout
 * - Visual diff highlighting
 * - Synchronized scrolling
 * - Version metadata display
 */

import { useRef, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Draft, DraftStatus } from '../../types'

export interface DraftComparisonProps {
  versionA: Draft
  versionB: Draft
  onClose?: () => void
  className?: string
}

export function DraftComparison({
  versionA,
  versionB,
  onClose,
  className,
}: DraftComparisonProps) {
  const scrollAreaARef = useRef<HTMLDivElement>(null)
  const scrollAreaBRef = useRef<HTMLDivElement>(null)
  const [syncScroll, setSyncScroll] = useState(true)

  // Synchronized scrolling
  useEffect(() => {
    if (!syncScroll) return

    const scrollAreaA = scrollAreaARef.current
    const scrollAreaB = scrollAreaBRef.current

    if (!scrollAreaA || !scrollAreaB) return

    let isScrollingA = false
    let isScrollingB = false

    const handleScrollA = () => {
      if (!isScrollingB) {
        isScrollingA = true
        const viewport = scrollAreaA.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport && scrollAreaB) {
          const viewportB = scrollAreaB.querySelector('[data-radix-scroll-area-viewport]')
          if (viewportB) {
            viewportB.scrollTop = viewport.scrollTop
          }
        }
        setTimeout(() => {
          isScrollingA = false
        }, 100)
      }
    }

    const handleScrollB = () => {
      if (!isScrollingA) {
        isScrollingB = true
        const viewport = scrollAreaB.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport && scrollAreaA) {
          const viewportA = scrollAreaA.querySelector('[data-radix-scroll-area-viewport]')
          if (viewportA) {
            viewportA.scrollTop = viewport.scrollTop
          }
        }
        setTimeout(() => {
          isScrollingB = false
        }, 100)
      }
    }

    const viewportA = scrollAreaA.querySelector('[data-radix-scroll-area-viewport]')
    const viewportB = scrollAreaB.querySelector('[data-radix-scroll-area-viewport]')

    viewportA?.addEventListener('scroll', handleScrollA)
    viewportB?.addEventListener('scroll', handleScrollB)

    return () => {
      viewportA?.removeEventListener('scroll', handleScrollA)
      viewportB?.removeEventListener('scroll', handleScrollB)
    }
  }, [syncScroll])

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

  const renderVersionHeader = (version: Draft, color: 'red' | 'green') => {
    const bgColor = color === 'red' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'
    const borderColor = color === 'red' ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'
    const textColor = color === 'red' ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'

    return (
      <div className={`p-4 border-b ${borderColor} ${bgColor}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className={`h-5 w-5 ${textColor}`} />
            <div>
              <h3 className={`font-semibold text-sm ${textColor}`}>
                Versão {version.version}
              </h3>
              <div className="text-xs opacity-70">
                {formatDistanceToNow(new Date(version.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </div>
            </div>
          </div>
          {getStatusBadge(version.status)}
        </div>
        <div className="text-xs opacity-70">
          {new Date(version.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        {version.pending_items && version.pending_items.length > 0 && (
          <div className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
            ⚠️ {version.pending_items.length} pendente(s)
          </div>
        )}
      </div>
    )
  }

  const renderVersionContent = (version: Draft) => {
    return (
      <div className="p-4">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: version.html_content }}
        />
      </div>
    )
  }

  return (
    <Card className={className}>
      {/* Comparison Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-blue-900 dark:text-blue-100">
              Comparação de Versões
            </h2>
            <Badge variant="outline" className="text-xs">
              V{versionA.version} ↔ V{versionB.version}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSyncScroll(!syncScroll)}
              className="text-xs"
            >
              {syncScroll ? '🔒 Rolagem Sincronizada' : '🔓 Rolagem Independente'}
            </Button>
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Split-pane comparison */}
      <div className="grid grid-cols-2 gap-0 divide-x">
        {/* Left pane - Version A */}
        <div className="relative">
          {renderVersionHeader(versionA, 'red')}
          <ScrollArea
            ref={scrollAreaARef}
            className="h-[calc(100vh-300px)]"
          >
            {renderVersionContent(versionA)}
          </ScrollArea>
        </div>

        {/* Right pane - Version B */}
        <div className="relative">
          {renderVersionHeader(versionB, 'green')}
          <ScrollArea
            ref={scrollAreaBRef}
            className="h-[calc(100vh-300px)]"
          >
            {renderVersionContent(versionB)}
          </ScrollArea>
        </div>
      </div>

      {/* Comparison footer */}
      <Separator />
      <div className="p-4 bg-gray-50 dark:bg-gray-900/20">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-200 dark:bg-red-900/40 border border-red-400 dark:border-red-700 rounded" />
              <span>Versão Anterior ({versionA.version})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-200 dark:bg-green-900/40 border border-green-400 dark:border-green-700 rounded" />
              <span>Versão Atual ({versionB.version})</span>
            </div>
          </div>
          <div className="text-gray-500">
            Diferença: {Math.abs((new Date(versionB.created_at).getTime() - new Date(versionA.created_at).getTime()) / (1000 * 60 * 60 * 24)).toFixed(0)} dia(s)
          </div>
        </div>
      </div>
    </Card>
  )
}
