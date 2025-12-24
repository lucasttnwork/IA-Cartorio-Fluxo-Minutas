/**
 * EditPropertyModal Component
 *
 * Modal for editing property entity directly from the canvas.
 * Features portal rendering, focus trap, keyboard navigation, and form validation.
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Property, Address, Encumbrance } from '../../types'
import { supabase } from '../../lib/supabase'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PORTAL_ROOT_ID = 'edit-property-modal-root'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

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

export interface EditPropertyModalProps {
  isOpen: boolean
  property: Property
  onClose: () => void
  onSave?: (updatedProperty: Property) => void
}

// -----------------------------------------------------------------------------
// Form Data Interface
// -----------------------------------------------------------------------------

interface PropertyFormData {
  registry_number: string
  registry_office: string
  area_sqm: string
  description: string
  iptu_number: string
  address: {
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
  encumbrances: Encumbrance[]
}

// -----------------------------------------------------------------------------
// EditPropertyModal Component
// -----------------------------------------------------------------------------

export function EditPropertyModal({
  isOpen,
  property,
  onClose,
  onSave,
}: EditPropertyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const [formData, setFormData] = useState<PropertyFormData>({
    registry_number: property.registry_number || '',
    registry_office: property.registry_office || '',
    area_sqm: property.area_sqm?.toString() || '',
    description: property.description || '',
    iptu_number: property.iptu_number || '',
    address: {
      street: property.address?.street || '',
      number: property.address?.number || '',
      complement: property.address?.complement || '',
      neighborhood: property.address?.neighborhood || '',
      city: property.address?.city || '',
      state: property.address?.state || '',
      zip: property.address?.zip || '',
    },
    encumbrances: property.encumbrances || [],
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        registry_number: property.registry_number || '',
        registry_office: property.registry_office || '',
        area_sqm: property.area_sqm?.toString() || '',
        description: property.description || '',
        iptu_number: property.iptu_number || '',
        address: {
          street: property.address?.street || '',
          number: property.address?.number || '',
          complement: property.address?.complement || '',
          neighborhood: property.address?.neighborhood || '',
          city: property.address?.city || '',
          state: property.address?.state || '',
          zip: property.address?.zip || '',
        },
        encumbrances: property.encumbrances || [],
      })
      setError(null)
    }
  }, [property])

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
    (field: keyof PropertyFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleAddressChange = useCallback(
    (field: keyof PropertyFormData['address'], value: string) => {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }))
    },
    []
  )

  const handleAddEncumbrance = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      encumbrances: [
        ...prev.encumbrances,
        { type: '', description: '', value: undefined, beneficiary: undefined },
      ],
    }))
  }, [])

  const handleRemoveEncumbrance = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      encumbrances: prev.encumbrances.filter((_, i) => i !== index),
    }))
  }, [])

  const handleEncumbranceChange = useCallback(
    (index: number, field: keyof Encumbrance, value: string | number | undefined) => {
      setFormData((prev) => ({
        ...prev,
        encumbrances: prev.encumbrances.map((enc, i) =>
          i === index ? { ...enc, [field]: value } : enc
        ),
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
            latitude: property.address?.latitude,
            longitude: property.address?.longitude,
            formatted_address: property.address?.formatted_address,
            geocoded_at: property.address?.geocoded_at,
            geocode_confidence: property.address?.geocode_confidence,
            geocode_status: property.address?.geocode_status,
          }
        : null

      // Parse area_sqm
      const areaSqm = formData.area_sqm.trim()
        ? parseFloat(formData.area_sqm.trim())
        : null

      // Filter out empty encumbrances
      const encumbrances = formData.encumbrances.filter(
        (enc) => enc.type.trim() !== '' || enc.description.trim() !== ''
      )

      // Build update object
      const updateData = {
        registry_number: formData.registry_number.trim() || null,
        registry_office: formData.registry_office.trim() || null,
        area_sqm: areaSqm,
        description: formData.description.trim() || null,
        iptu_number: formData.iptu_number.trim() || null,
        address,
        encumbrances: encumbrances.length > 0 ? encumbrances : null,
        updated_at: new Date().toISOString(),
      }

      // Update in database
      const { data: updatedProperty, error: updateError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating property:', updateError)
        setError('Erro ao atualizar propriedade: ' + updateError.message)
        return
      }

      // Call onSave callback if provided
      if (onSave && updatedProperty) {
        onSave(updatedProperty as Property)
      }

      // Close modal
      onClose()
    } catch (err) {
      console.error('Error saving property:', err)
      setError('Erro ao salvar alterações')
    } finally {
      setIsSaving(false)
    }
  }, [formData, property, onClose, onSave])

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
          aria-labelledby="edit-property-modal-title"
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
                  id="edit-property-modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Editar Propriedade
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {property.registry_number || 'Matrícula não informada'}
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
                {/* Registry Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Informações de Registro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número da Matrícula
                      </label>
                      <input
                        type="text"
                        value={formData.registry_number}
                        onChange={(e) => handleFieldChange('registry_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cartório de Registro
                      </label>
                      <input
                        type="text"
                        value={formData.registry_office}
                        onChange={(e) => handleFieldChange('registry_office', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Property Details Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Detalhes do Imóvel
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Área (m²)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.area_sqm}
                        onChange={(e) => handleFieldChange('area_sqm', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número IPTU
                      </label>
                      <input
                        type="text"
                        value={formData.iptu_number}
                        onChange={(e) => handleFieldChange('iptu_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Localização
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

                {/* Encumbrances Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Ônus e Gravames
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddEncumbrance}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                  {formData.encumbrances.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Nenhum ônus ou gravame cadastrado
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.encumbrances.map((encumbrance, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Ônus #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveEncumbrance(index)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              aria-label="Remover ônus"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Tipo
                              </label>
                              <input
                                type="text"
                                value={encumbrance.type}
                                onChange={(e) =>
                                  handleEncumbranceChange(index, 'type', e.target.value)
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Hipoteca, Penhora"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Beneficiário
                              </label>
                              <input
                                type="text"
                                value={encumbrance.beneficiary || ''}
                                onChange={(e) =>
                                  handleEncumbranceChange(index, 'beneficiary', e.target.value)
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Descrição
                              </label>
                              <textarea
                                value={encumbrance.description}
                                onChange={(e) =>
                                  handleEncumbranceChange(index, 'description', e.target.value)
                                }
                                rows={2}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Valor (R$)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={encumbrance.value || ''}
                                onChange={(e) =>
                                  handleEncumbranceChange(
                                    index,
                                    'value',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                disabled={isSaving}
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

export default EditPropertyModal
