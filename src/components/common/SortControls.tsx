import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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

  const handleValueChange = (value: string) => {
    const selectedOption = sortOptions.find(opt => opt.value === value)
    if (selectedOption) {
      onSortChange({
        field: selectedOption.field,
        order: selectedOption.order,
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort-select" className="whitespace-nowrap">
        Sort by:
      </Label>
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger id="sort-select" className="w-[200px]">
          <SelectValue placeholder="Select sorting..." />
        </SelectTrigger>
        <SelectContent className="glass-popover">
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
