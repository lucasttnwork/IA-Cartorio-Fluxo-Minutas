/**
 * CacheMetrics Component
 *
 * Displays cache performance metrics for chat context caching.
 * Shows cache hits, misses, size, and last update time.
 *
 * Features:
 * - Real-time metrics display
 * - Cache efficiency percentage
 * - Manual cache refresh
 * - Cache clear functionality
 */

import { useState, useEffect } from 'react'
import { chatCache } from '../../services/chatCache'
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CacheMetricsProps {
  draftId: string
  className?: string
}

// -----------------------------------------------------------------------------
// CacheMetrics Component
// -----------------------------------------------------------------------------

export function CacheMetrics({ draftId, className }: CacheMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load metrics
  const loadMetrics = () => {
    const m = chatCache.getCacheMetrics(draftId)
    setMetrics(m)
  }

  // Load on mount and set up interval
  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [draftId])

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    loadMetrics()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Handle clear cache
  const handleClear = () => {
    if (confirm('Limpar o cache do chat? Isso pode aumentar os custos da próxima mensagem.')) {
      chatCache.invalidateCache(draftId)
      loadMetrics()
    }
  }

  if (!metrics) {
    return null
  }

  const efficiency = metrics.hits + metrics.misses > 0
    ? Math.round((metrics.hits / (metrics.hits + metrics.misses)) * 100)
    : 0

  return (
    <Card className={cn("glass-subtle p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Cache do Chat
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6"
            title="Atualizar métricas"
          >
            <ArrowPathIcon className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6"
            title="Limpar cache"
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Cache Hits */}
        <div className="glass-card p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400 mb-0.5">Hits</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {metrics.hits}
          </div>
        </div>

        {/* Cache Misses */}
        <div className="glass-card p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400 mb-0.5">Misses</div>
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {metrics.misses}
          </div>
        </div>

        {/* Efficiency */}
        <div className="glass-card p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400 mb-0.5">Eficiência</div>
          <div className={cn(
            "text-lg font-bold",
            efficiency >= 80 ? "text-green-600 dark:text-green-400" :
            efficiency >= 50 ? "text-yellow-600 dark:text-yellow-400" :
            "text-red-600 dark:text-red-400"
          )}>
            {efficiency}%
          </div>
        </div>

        {/* Cache Size */}
        <div className="glass-card p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400 mb-0.5">Tamanho</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {metrics.size.toFixed(2)} MB
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-[10px] text-gray-500 dark:text-gray-400">
          Última atualização: {new Date(metrics.lastUpdated).toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </Card>
  )
}

export default CacheMetrics
