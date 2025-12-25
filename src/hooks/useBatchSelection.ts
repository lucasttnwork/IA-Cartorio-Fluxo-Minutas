/**
 * useBatchSelection Hook
 *
 * A hook for managing batch selection state for documents or other items.
 * Provides selection state management, select all/none functionality,
 * and utilities for batch operations.
 */

import { useState, useCallback, useMemo } from 'react'

export interface UseBatchSelectionOptions<T> {
  /** The list of all items that can be selected */
  items: T[]
  /** Function to extract a unique ID from each item */
  getItemId: (item: T) => string
  /** Initial selected item IDs */
  initialSelectedIds?: string[]
}

export interface UseBatchSelectionReturn {
  /** Set of currently selected item IDs */
  selectedIds: Set<string>
  /** Number of selected items */
  selectedCount: number
  /** Whether any items are selected */
  hasSelection: boolean
  /** Whether all items are selected */
  isAllSelected: boolean
  /** Whether some (but not all) items are selected */
  isIndeterminate: boolean
  /** Check if a specific item is selected */
  isSelected: (id: string) => boolean
  /** Toggle selection of a specific item */
  toggleSelection: (id: string) => void
  /** Select a specific item */
  selectItem: (id: string) => void
  /** Deselect a specific item */
  deselectItem: (id: string) => void
  /** Select all items */
  selectAll: () => void
  /** Deselect all items */
  deselectAll: () => void
  /** Toggle select all/none */
  toggleSelectAll: () => void
  /** Select multiple items at once */
  selectItems: (ids: string[]) => void
  /** Deselect multiple items at once */
  deselectItems: (ids: string[]) => void
  /** Clear selection (alias for deselectAll) */
  clearSelection: () => void
}

export function useBatchSelection<T>({
  items,
  getItemId,
  initialSelectedIds = [],
}: UseBatchSelectionOptions<T>): UseBatchSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )

  // Memoize the list of all item IDs
  const allItemIds = useMemo(
    () => items.map(getItemId),
    [items, getItemId]
  )

  // Derived state
  const selectedCount = selectedIds.size
  const hasSelection = selectedCount > 0
  const isAllSelected = selectedCount > 0 && selectedCount === allItemIds.length
  const isIndeterminate = selectedCount > 0 && selectedCount < allItemIds.length

  // Check if a specific item is selected
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  // Toggle selection of a specific item
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Select a specific item
  const selectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  // Deselect a specific item
  const deselectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allItemIds))
  }, [allItemIds])

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Toggle select all/none
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [isAllSelected, selectAll, deselectAll])

  // Select multiple items at once
  const selectItems = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  // Deselect multiple items at once
  const deselectItems = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }, [])

  // Clear selection (alias for deselectAll)
  const clearSelection = deselectAll

  return {
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggleSelection,
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    toggleSelectAll,
    selectItems,
    deselectItems,
    clearSelection,
  }
}

export default useBatchSelection
