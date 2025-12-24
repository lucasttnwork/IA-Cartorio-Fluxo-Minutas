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
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { cn } from '@/lib/utils'

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedProperty, error: updateError } = await (supabase as any)
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
                  id="edit-property-modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Editar Propriedade
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {property.registry_number || 'Matrícula não informada'}
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
                {/* Registry Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Informações de Registro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registry_number">Número da Matrícula</Label>
                      <Input
                        id="registry_number"
                        type="text"
                        value={formData.registry_number}
                        onChange={(e) => handleFieldChange('registry_number', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registry_office">Cartório de Registro</Label>
                      <Input
                        id="registry_office"
                        type="text"
                        value={formData.registry_office}
                        onChange={(e) => handleFieldChange('registry_office', e.target.value)}
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
                    <div className="space-y-2">
                      <Label htmlFor="area_sqm">Área (m²)</Label>
                      <Input
                        id="area_sqm"
                        type="number"
                        step="0.01"
                        value={formData.area_sqm}
                        onChange={(e) => handleFieldChange('area_sqm', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iptu_number">Número IPTU</Label>
                      <Input
                        id="iptu_number"
                        type="text"
                        value={formData.iptu_number}
                        onChange={(e) => handleFieldChange('iptu_number', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="glass-subtle p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Localização
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

                {/* Encumbrances Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Ônus e Gravames
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={handleAddEncumbrance}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
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
                          className="glass-subtle p-4 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Ônus #{index + 1}
                            </h4>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveEncumbrance(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              aria-label="Remover ônus"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`encumbrance_type_${index}`} className="text-xs">
                                Tipo
                              </Label>
                              <Input
                                id={`encumbrance_type_${index}`}
                                type="text"
                                value={encumbrance.type}
                                onChange={(e) =>
                                  handleEncumbranceChange(index, 'type', e.target.value)
                                }
                                placeholder="Ex: Hipoteca, Penhora"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`encumbrance_beneficiary_${index}`} className="text-xs">
                                Beneficiário
                              </Label>
                              <Input
                                id={`encumbrance_beneficiary_${index}`}
                                type="text"
                                value={encumbrance.beneficiary || ''}
                                onChange={(e) =>
                                  handleEncumbranceChange(index, 'beneficiary', e.target.value)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor={`encumbrance_description_${index}`} className="text-xs">
                                Descrição
                              </Label>
                              <Textarea
                                id={`encumbrance_description_${index}`}
                                value={encumbrance.description}
                                onChange={(e) =>
                                  handleEncumbranceChange(index, 'description', e.target.value)
                                }
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`encumbrance_value_${index}`} className="text-xs">
                                Valor (R$)
                              </Label>
                              <Input
                                id={`encumbrance_value_${index}`}
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
                                className="h-8 text-sm"
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
                disabled={isSaving}
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

export default EditPropertyModal
