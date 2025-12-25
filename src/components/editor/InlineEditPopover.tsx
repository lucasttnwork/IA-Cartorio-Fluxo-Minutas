/**
 * InlineEditPopover
 *
 * Popover component for editing field values inline in the draft.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

export interface InlineEditPopoverProps {
  fieldPath: string
  fieldType: string
  currentValue: string
  onSave: (newValue: string) => void
  onCancel: () => void
  position: { x: number; y: number }
}

export function InlineEditPopover({
  fieldPath,
  fieldType,
  currentValue,
  onSave,
  onCancel,
  position,
}: InlineEditPopoverProps) {
  const [value, setValue] = useState(currentValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(currentValue)
  }, [currentValue])

  const handleSave = () => {
    // Validate based on field type
    if (!value.trim()) {
      setError('O valor não pode estar vazio')
      return
    }

    // Specific validations
    if (fieldType === 'cpf' && !isValidCPF(value)) {
      setError('CPF inválido')
      return
    }

    if (fieldType === 'number' && isNaN(Number(value))) {
      setError('Valor deve ser numérico')
      return
    }

    if (fieldType === 'currency') {
      const numericValue = parseCurrency(value)
      if (isNaN(numericValue)) {
        setError('Valor monetário inválido')
        return
      }
    }

    setError(null)
    onSave(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const getFieldLabel = (path: string): string => {
    const parts = path.split('.')
    const lastPart = parts[parts.length - 1]

    const labels: Record<string, string> = {
      'full_name': 'Nome Completo',
      'cpf': 'CPF',
      'price': 'Valor',
      'street': 'Rua',
      'number': 'Número',
      'city': 'Cidade',
      'state': 'Estado',
      'zip': 'CEP',
      'profession': 'Profissão',
      'nationality': 'Nacionalidade',
    }

    return labels[lastPart] || lastPart
  }

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <Card className="glass-card p-4 shadow-2xl border-0 w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
              {getFieldLabel(fieldPath)}
            </label>
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o novo valor..."
              className={cn(
                "transition-all",
                error && "border-red-500 dark:border-red-500"
              )}
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Campo: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{fieldPath}</code>
          </p>
        </div>
      </Card>
    </div>
  )
}

// Helper functions
function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false

  // Basic validation (not comprehensive)
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  return true
}

function parseCurrency(value: string): number {
  // Remove currency symbols and parse
  const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.')
  return parseFloat(cleaned)
}
