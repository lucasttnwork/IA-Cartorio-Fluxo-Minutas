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
  { value: 'updated_at_desc', label: 'Última Atualização (Mais Recente)', field: 'updated_at', order: 'desc' },
  { value: 'updated_at_asc', label: 'Última Atualização (Mais Antiga)', field: 'updated_at', order: 'asc' },
  { value: 'created_at_desc', label: 'Data de Criação (Mais Recente)', field: 'created_at', order: 'desc' },
  { value: 'created_at_asc', label: 'Data de Criação (Mais Antiga)', field: 'created_at', order: 'asc' },
  { value: 'title_asc', label: 'Título (A-Z)', field: 'title', order: 'asc' },
  { value: 'title_desc', label: 'Título (Z-A)', field: 'title', order: 'desc' },
  { value: 'status_asc', label: 'Status (A-Z)', field: 'status', order: 'asc' },
  { value: 'status_desc', label: 'Status (Z-A)', field: 'status', order: 'desc' },
  { value: 'act_type_asc', label: 'Tipo de Ato (A-Z)', field: 'act_type', order: 'asc' },
  { value: 'act_type_desc', label: 'Tipo de Ato (Z-A)', field: 'act_type', order: 'desc' },
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
        Ordenar por:
      </Label>
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger id="sort-select" className="w-[200px]">
          <SelectValue placeholder="Selecionar ordenação..." />
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
