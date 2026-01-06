/**
 * DraftTemplateSelector Component
 *
 * Allows users to select a draft template when creating a new draft
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DraftTemplate, ActType } from '../../types'
import { draftTemplates } from '../../data/draftTemplates'

interface DraftTemplateSelectorProps {
  actType?: ActType
  onSelectTemplate: (template: DraftTemplate) => void
  onCancel?: () => void
  className?: string
}

const actTypeLabels: Record<ActType, string> = {
  purchase_sale: 'Compra e Venda',
  donation: 'Doação',
  exchange: 'Permuta',
  lease: 'Locação',
}

export function DraftTemplateSelector({
  actType,
  onSelectTemplate,
  onCancel,
  className,
}: DraftTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)

  // Filter templates by act type if provided
  const availableTemplates = actType
    ? draftTemplates.filter(t => t.actType === actType)
    : draftTemplates

  const handleSelectTemplate = (template: DraftTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg">
          <DocumentTextIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Selecione um Modelo
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Escolha um modelo base para sua minuta
          {actType && ` de ${actTypeLabels[actType]}`}
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableTemplates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card
              className={cn(
                'glass-card cursor-pointer transition-all duration-200 hover:shadow-xl',
                selectedTemplate?.id === template.id
                  ? 'border-2 border-blue-500 dark:border-blue-400 shadow-lg'
                  : 'border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              )}
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="p-6">
                {/* Template Icon & Title */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {template.icon && (
                      <span className="text-3xl" role="img" aria-label={template.name}>
                        {template.icon}
                      </span>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {actTypeLabels[template.actType]}
                      </p>
                    </div>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <CheckCircleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </motion.div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>

                {/* Sections Preview */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Seções incluídas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.sections.slice(0, 5).map((section) => (
                      <span
                        key={section.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {section.title}
                      </span>
                    ))}
                    {template.sections.length > 5 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        +{template.sections.length - 5} mais
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="min-w-[120px]"
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          disabled={!selectedTemplate}
          className={cn(
            'min-w-[120px]',
            selectedTemplate && 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          )}
        >
          {selectedTemplate ? 'Criar Minuta' : 'Selecione um Modelo'}
        </Button>
      </div>

      {/* Empty State */}
      {availableTemplates.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum modelo disponível para este tipo de ato.
          </p>
        </div>
      )}
    </div>
  )
}
