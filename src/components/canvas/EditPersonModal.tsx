/**
 * EditPersonModal Component
 *
 * Modal for editing person entity directly from the canvas.
 * Features portal rendering, focus trap, keyboard navigation, and form validation.
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Person, MaritalStatus, Address } from '../../types'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '@/lib/utils'
import { validateCPF } from '../../utils/cpfValidation'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PORTAL_ROOT_ID = 'edit-person-modal-root'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'single', label: 'Solteiro(a)' },
  { value: 'married', label: 'Casado(a)' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed', label: 'Viúvo(a)' },
  { value: 'separated', label: 'Separado(a)' },
  { value: 'stable_union', label: 'União Estável' },
]

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getPortalRoot(): HTMLElement {
  let root = document.getElementById(PORTAL_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = PORTAL_ROOT_ID
    document.body.appendChild(root)
  }
  return root
}

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

export interface EditPersonModalProps {
  isOpen: boolean
  person: Person
  onClose: () => void
  onSave?: (updatedPerson: Person) => void
}

// -----------------------------------------------------------------------------
// Form Data Interface
// -----------------------------------------------------------------------------

interface PersonFormData {
  full_name: string
  cpf: string
  rg: string
  rg_issuer: string
  birth_date: string
  nationality: string
  marital_status: MaritalStatus | ''
  profession: string
  email: string
  phone: string
  father_name: string
  mother_name: string
  address: {
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
}

// -----------------------------------------------------------------------------
// EditPersonModal Component
// -----------------------------------------------------------------------------

export function EditPersonModal({
  isOpen,
  person,
  onClose,
  onSave,
}: EditPersonModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const [formData, setFormData] = useState<PersonFormData>({
    full_name: person.full_name || '',
    cpf: person.cpf || '',
    rg: person.rg || '',
    rg_issuer: person.rg_issuer || '',
    birth_date: person.birth_date || '',
    nationality: person.nationality || '',
    marital_status: person.marital_status || '',
    profession: person.profession || '',
    email: person.email || '',
    phone: person.phone || '',
    father_name: person.father_name || '',
    mother_name: person.mother_name || '',
    address: {
      street: person.address?.street || '',
      number: person.address?.number || '',
      complement: person.address?.complement || '',
      neighborhood: person.address?.neighborhood || '',
      city: person.address?.city || '',
      state: person.address?.state || '',
      zip: person.address?.zip || '',
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cpfError, setCpfError] = useState<string | null>(null)

  // Reset form when person changes
  useEffect(() => {
    if (person) {
      setFormData({
        full_name: person.full_name || '',
        cpf: person.cpf || '',
        rg: person.rg || '',
        rg_issuer: person.rg_issuer || '',
        birth_date: person.birth_date || '',
        nationality: person.nationality || '',
        marital_status: person.marital_status || '',
        profession: person.profession || '',
        email: person.email || '',
        phone: person.phone || '',
        father_name: person.father_name || '',
        mother_name: person.mother_name || '',
        address: {
          street: person.address?.street || '',
          number: person.address?.number || '',
          complement: person.address?.complement || '',
          neighborhood: person.address?.neighborhood || '',
          city: person.address?.city || '',
          state: person.address?.state || '',
          zip: person.address?.zip || '',
        },
      })
      setError(null)
      setCpfError(null)
    }
  }, [person])

  // -----------------------------------------------------------------------------
  // Focus Management
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current
    modal.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // -----------------------------------------------------------------------------
  // Keyboard Navigation
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSaving, onClose])

  // -----------------------------------------------------------------------------
  // Event Handlers
  // -----------------------------------------------------------------------------

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isSaving) {
        onClose()
      }
    },
    [onClose, isSaving]
  )

  const handleFieldChange = useCallback(
    (field: keyof PersonFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear CPF error when user starts typing
      if (field === 'cpf') {
        setCpfError(null)
      }
    },
    []
  )

  const handleCPFBlur = useCallback(() => {
    const validation = validateCPF(formData.cpf)
    if (!validation.isValid) {
      setCpfError(validation.error || 'CPF inválido')
    } else if (validation.formattedCPF) {
      // Auto-format CPF on blur if valid
      setFormData((prev) => ({ ...prev, cpf: validation.formattedCPF! }))
      setCpfError(null)
    }
  }, [formData.cpf])

  const handleAddressChange = useCallback(
    (field: keyof PersonFormData['address'], value: string) => {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    // Validate CPF before saving
    const cpfValidation = validateCPF(formData.cpf)
    if (!cpfValidation.isValid) {
      setCpfError(cpfValidation.error || 'CPF inválido')
      setIsSaving(false)
      return
    }

    try {
      // Build address object (only include if at least street is provided)
      const hasAddress = formData.address.street.trim() !== ''
      const address: Address | null = hasAddress
        ? {
            street: formData.address.street,
            number: formData.address.number,
            complement: formData.address.complement || undefined,
            neighborhood: formData.address.neighborhood,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip,
            // Preserve geocoding fields if they exist
            latitude: person.address?.latitude,
            longitude: person.address?.longitude,
            formatted_address: person.address?.formatted_address,
            geocoded_at: person.address?.geocoded_at,
            geocode_confidence: person.address?.geocode_confidence,
            geocode_status: person.address?.geocode_status,
          }
        : null

      // Build update object
      const updateData = {
        full_name: formData.full_name.trim(),
        cpf: formData.cpf.trim() || null,
        rg: formData.rg.trim() || null,
        rg_issuer: formData.rg_issuer.trim() || null,
        birth_date: formData.birth_date.trim() || null,
        nationality: formData.nationality.trim() || null,
        marital_status: formData.marital_status || null,
        profession: formData.profession.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        father_name: formData.father_name.trim() || null,
        mother_name: formData.mother_name.trim() || null,
        address,
        updated_at: new Date().toISOString(),
      }

      // Update in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedPerson, error: updateError } = await (supabase as any)
        .from('people')
        .update(updateData)
        .eq('id', person.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating person:', updateError)
        setError('Erro ao atualizar pessoa: ' + updateError.message)
        return
      }

      // Call onSave callback if provided
      if (onSave && updatedPerson) {
        onSave(updatedPerson as Person)
      }

      // Close modal
      onClose()
    } catch (err) {
      console.error('Error saving person:', err)
      setError('Erro ao salvar alterações')
    } finally {
      setIsSaving(false)
    }
  }, [formData, person, onClose, onSave])

  // -----------------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------------

  const portalRoot = getPortalRoot()

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-person-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className={cn(
              "absolute inset-4 sm:inset-8 md:inset-12 lg:inset-20",
              "glass-dialog",
              "rounded-xl shadow-2xl overflow-hidden flex flex-col"
            )}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2
                  id="edit-person-modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Editar Pessoa
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {person.full_name}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isSaving}
                aria-label="Fechar modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Identity Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="full_name">
                        Nome Completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleFieldChange('full_name', e.target.value)}
                        required
                        aria-required="true"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => handleFieldChange('cpf', e.target.value)}
                        onBlur={handleCPFBlur}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={cn(cpfError && 'border-red-500 focus:ring-red-500')}
                        aria-invalid={!!cpfError}
                        aria-describedby={cpfError ? 'cpf-error' : undefined}
                      />
                      {cpfError && (
                        <p id="cpf-error" className="text-sm text-red-500">
                          {cpfError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        type="text"
                        value={formData.rg}
                        onChange={(e) => handleFieldChange('rg', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="rg_issuer">Órgão Emissor RG</Label>
                      <Input
                        id="rg_issuer"
                        type="text"
                        value={formData.rg_issuer}
                        onChange={(e) => handleFieldChange('rg_issuer', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Info Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleFieldChange('birth_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nacionalidade</Label>
                      <Input
                        id="nationality"
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => handleFieldChange('nationality', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marital_status">Estado Civil</Label>
                      <Select
                        value={formData.marital_status}
                        onValueChange={(value) => handleFieldChange('marital_status', value)}
                      >
                        <SelectTrigger id="marital_status">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {MARITAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profissão</Label>
                      <Input
                        id="profession"
                        type="text"
                        value={formData.profession}
                        onChange={(e) => handleFieldChange('profession', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Family Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Filiação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="father_name">Nome do Pai</Label>
                      <Input
                        id="father_name"
                        type="text"
                        value={formData.father_name}
                        onChange={(e) => handleFieldChange('father_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother_name">Nome da Mãe</Label>
                      <Input
                        id="mother_name"
                        type="text"
                        value={formData.mother_name}
                        onChange={(e) => handleFieldChange('mother_name', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="glass-subtle p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        type="text"
                        value={formData.address.number}
                        onChange={(e) => handleAddressChange('number', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        type="text"
                        value={formData.address.complement}
                        onChange={(e) => handleAddressChange('complement', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        type="text"
                        value={formData.address.neighborhood}
                        onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">CEP</Label>
                      <Input
                        id="zip"
                        type="text"
                        value={formData.address.zip}
                        onChange={(e) => handleAddressChange('zip', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !formData.full_name.trim() || !!cpfError}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalRoot
  )
}

export default EditPersonModal
