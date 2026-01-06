import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useCreateCase } from '../../hooks/useCases'
import { formatCurrencyInput, parseCurrency, formatCurrency } from '../../utils'
import type { ActType } from '../../types'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

// Act type options for the form
const actTypeOptions: { value: ActType; label: string; description: string }[] = [
  {
    value: 'purchase_sale',
    label: 'Compra e Venda',
    description: 'Transferência de propriedade por meio de venda'
  },
  {
    value: 'donation',
    label: 'Doação',
    description: 'Transferência gratuita de propriedade'
  },
  {
    value: 'exchange',
    label: 'Permuta',
    description: 'Troca de imóveis entre as partes'
  },
  {
    value: 'lease',
    label: 'Locação',
    description: 'Contrato de aluguel para uso do imóvel'
  },
]

// Step indicator component
function StepIndicator({
  currentStep,
  totalSteps
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === currentStep
              ? 'w-8 bg-blue-500'
              : i < currentStep
              ? 'w-2 bg-blue-500'
              : 'w-2 bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

interface CreateCaseModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  title: string
  act_type: ActType
  description: string
  price: string
  payment_method: 'full' | 'installments' | ''
  installments_count: string
  notes: string
}

const initialFormData: FormData = {
  title: '',
  act_type: 'purchase_sale',
  description: '',
  price: '',
  payment_method: '',
  installments_count: '',
  notes: '',
}

export default function CreateCaseModal({ isOpen, onClose }: CreateCaseModalProps) {
  const createCaseMutation = useCreateCase()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const totalSteps = 3

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    // Format currency input as user types
    if (field === 'price') {
      const formatted = formatCurrencyInput(value)
      setFormData(prev => ({ ...prev, [field]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 0) {
      if (!formData.title.trim()) {
        newErrors.title = 'Por favor, insira um título para o caso'
      }
    }

    if (step === 1 && formData.act_type === 'purchase_sale') {
      if (!formData.price.trim()) {
        newErrors.price = 'Por favor, informe o preço de venda'
      } else {
        const parsedPrice = parseCurrency(formData.price)
        if (parsedPrice === null || parsedPrice <= 0) {
          newErrors.price = 'Por favor, informe um preço válido'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
    }
  }, [currentStep, validateStep])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const handleCreate = async () => {
    if (!validateStep(currentStep)) return

    try {
      // Parse price to number using currency utility
      const priceValue = formData.price ? parseCurrency(formData.price) : undefined

      await createCaseMutation.mutateAsync({
        title: formData.title.trim(),
        act_type: formData.act_type,
        description: formData.description.trim() || undefined,
        deal_details: priceValue ? {
          price: priceValue,
          payment_method: formData.payment_method || undefined,
          installments_count: formData.installments_count
            ? parseInt(formData.installments_count)
            : undefined,
        } : undefined,
        notes: formData.notes.trim() || undefined,
      })

      // Reset form and close modal on success
      handleClose()
    } catch (err) {
      console.error('Error creating case:', err)
      setErrors({ title: 'Falha ao criar caso. Por favor, tente novamente.' })
    }
  }

  const handleClose = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(0)
    setErrors({})
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (currentStep < totalSteps - 1) {
        handleNext()
      } else {
        handleCreate()
      }
    }
  }, [currentStep, handleNext])

  // Step content components
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <DocumentTextIcon className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Informações Básicas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Comece informando o título e tipo do caso
              </p>
            </div>

            {/* Case Title */}
            <div className="space-y-2">
              <Label
                htmlFor="case-title"
                className="text-gray-700 dark:text-gray-300"
              >
                Título do Caso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="case-title"
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Venda de Imóvel - Rua Principal, 123"
                className={cn(
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
                  errors.title && "border-red-500 focus-visible:ring-red-500"
                )}
                autoFocus
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <div id="title-error" className="form-error-message animate-form-error-slide-in">
                  <ExclamationCircleIcon className="form-error-icon" />
                  <span>{errors.title}</span>
                </div>
              )}
            </div>

            {/* Act Type Selection */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                Tipo de Ato <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {actTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData('act_type', option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.act_type === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="case-description"
                className="text-gray-700 dark:text-gray-300"
              >
                Descrição <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="case-description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Breve descrição deste caso..."
                rows={3}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Detalhes do Negócio
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.act_type === 'purchase_sale'
                  ? 'Informe o preço de venda e condições de pagamento'
                  : formData.act_type === 'lease'
                  ? 'Informe os termos da locação'
                  : 'Informe os detalhes financeiros'}
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label
                htmlFor="case-price"
                className="text-gray-700 dark:text-gray-300"
              >
                {formData.act_type === 'lease' ? 'Aluguel Mensal' : 'Preço'}{' '}
                {formData.act_type === 'purchase_sale' && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  R$
                </span>
                <Input
                  id="case-price"
                  type="text"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0,00"
                  className={cn(
                    "dark:bg-gray-800 dark:border-gray-600 dark:text-white pl-10",
                    errors.price && "border-red-500 focus-visible:ring-red-500"
                  )}
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? "price-error" : undefined}
                />
              </div>
              {errors.price && (
                <div id="price-error" className="form-error-message animate-form-error-slide-in">
                  <ExclamationCircleIcon className="form-error-icon" />
                  <span>{errors.price}</span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {formData.act_type === 'purchase_sale' && (
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">
                  Forma de Pagamento
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateFormData('payment_method', 'full')}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                      formData.payment_method === 'full'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      Pagamento à Vista
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Pagamento único
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData('payment_method', 'installments')}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                      formData.payment_method === 'installments'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      Parcelado
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Múltiplos pagamentos
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Installments Count */}
            {formData.payment_method === 'installments' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="installments-count"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Número de Parcelas
                </Label>
                <Input
                  id="installments-count"
                  type="number"
                  min="2"
                  max="360"
                  value={formData.installments_count}
                  onChange={(e) => updateFormData('installments_count', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: 12"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </motion.div>
            )}
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <UserGroupIcon className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Observações
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Adicione notas ou observações relevantes
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                Resumo do Caso
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Título:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formData.title || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                  <span className="text-gray-900 dark:text-white">
                    {actTypeOptions.find(o => o.value === formData.act_type)?.label}
                  </span>
                </div>
                {formData.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Preço:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(parseCurrency(formData.price) || 0)}
                    </span>
                  </div>
                )}
                {formData.payment_method && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Pagamento:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.payment_method === 'full'
                        ? 'Pagamento à Vista'
                        : `${formData.installments_count || '?'}x Parcelas`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label
                htmlFor="case-notes"
                className="text-gray-700 dark:text-gray-300"
              >
                Notas <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="case-notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Informações adicionais ou condições especiais..."
                rows={4}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 glass-overlay"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-dialog relative p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Criar Novo Caso
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-between gap-3">
              <div>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={createCaseMutation.isPending}
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={createCaseMutation.isPending}
                >
                  Cancelar
                </Button>
                {currentStep < totalSteps - 1 ? (
                  <Button
                    variant="default"
                    onClick={handleNext}
                  >
                    Próximo
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleCreate}
                    disabled={createCaseMutation.isPending}
                  >
                    {createCaseMutation.isPending ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Criar Caso
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
