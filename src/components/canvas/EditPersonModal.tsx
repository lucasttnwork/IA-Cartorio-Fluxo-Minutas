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
    },
    []
  )

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
      const { data: updatedPerson, error: updateError } = await supabase
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
            className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
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
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                aria-label="Fechar modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleFieldChange('full_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => handleFieldChange('cpf', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        RG
                      </label>
                      <input
                        type="text"
                        value={formData.rg}
                        onChange={(e) => handleFieldChange('rg', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Órgão Emissor RG
                      </label>
                      <input
                        type="text"
                        value={formData.rg_issuer}
                        onChange={(e) => handleFieldChange('rg_issuer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleFieldChange('birth_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nacionalidade
                      </label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => handleFieldChange('nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado Civil
                      </label>
                      <select
                        value={formData.marital_status}
                        onChange={(e) =>
                          handleFieldChange('marital_status', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {MARITAL_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profissão
                      </label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => handleFieldChange('profession', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome do Pai
                      </label>
                      <input
                        type="text"
                        value={formData.father_name}
                        onChange={(e) => handleFieldChange('father_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Mãe
                      </label>
                      <input
                        type="text"
                        value={formData.mother_name}
                        onChange={(e) => handleFieldChange('mother_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rua
                      </label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.address.number}
                        onChange={(e) => handleAddressChange('number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={formData.address.complement}
                        onChange={(e) => handleAddressChange('complement', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.address.neighborhood}
                        onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={formData.address.zip}
                        onChange={(e) => handleAddressChange('zip', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !formData.full_name.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalRoot
  )
}

export default EditPersonModal
