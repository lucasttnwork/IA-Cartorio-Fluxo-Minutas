import { ChevronUpDownIcon } from '@heroicons/react/24/outline'

export type SortField = 'updated_at' | 'created_at' | 'title' | 'status' | 'act_type'
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  field: SortField
  order: SortOrder
}

interface SortControlsProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

const sortOptions: Array<{ value: string; label: string; field: SortField; order: SortOrder }> = [
  { value: 'updated_at_desc', label: 'Last Updated (Newest)', field: 'updated_at', order: 'desc' },
  { value: 'updated_at_asc', label: 'Last Updated (Oldest)', field: 'updated_at', order: 'asc' },
  { value: 'created_at_desc', label: 'Date Created (Newest)', field: 'created_at', order: 'desc' },
  { value: 'created_at_asc', label: 'Date Created (Oldest)', field: 'created_at', order: 'asc' },
  { value: 'title_asc', label: 'Title (A-Z)', field: 'title', order: 'asc' },
  { value: 'title_desc', label: 'Title (Z-A)', field: 'title', order: 'desc' },
  { value: 'status_asc', label: 'Status (A-Z)', field: 'status', order: 'asc' },
  { value: 'status_desc', label: 'Status (Z-A)', field: 'status', order: 'desc' },
  { value: 'act_type_asc', label: 'Act Type (A-Z)', field: 'act_type', order: 'asc' },
  { value: 'act_type_desc', label: 'Act Type (Z-A)', field: 'act_type', order: 'desc' },
]

export default function SortControls({ currentSort, onSortChange }: SortControlsProps) {
  const currentValue = `${currentSort.field}_${currentSort.order}`

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = sortOptions.find(opt => opt.value === e.target.value)
    if (selectedOption) {
      onSortChange({
        field: selectedOption.field,
        order: selectedOption.order,
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
      >
        Sort by:
      </label>
      <div className="relative">
        <select
          id="sort-select"
          value={currentValue}
          onChange={handleChange}
          className="appearance-none block pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
    </div>
  )
}
