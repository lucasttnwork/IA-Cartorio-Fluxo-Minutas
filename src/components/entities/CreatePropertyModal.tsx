/**
 * CreatePropertyModal Component
 *
 * Modal dialog for manually creating a new Property entity.
 * Provides a form with all required property fields.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

export interface CreatePropertyModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when property is created with the form data */
  onCreate: (propertyData: PropertyFormData) => void
  /** Whether the creation is in progress */
  isCreating?: boolean
}

export interface PropertyFormData {
  registry_number: string
  registry_office: string
  area_sqm: string
  description: string
  iptu_number: string
  // Address fields
  address_street: string
  address_number: string
  address_complement: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip: string
  address_country: string
}

export default function CreatePropertyModal({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}: CreatePropertyModalProps) {
  const [formData, setFormData] = useState<PropertyFormData>({
    registry_number: '',
    registry_office: '',
    area_sqm: '',
    description: '',
    iptu_number: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'Brasil',
  })

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
  }

  const handleClose = () => {
    if (!isCreating) {
      onClose()
      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          registry_number: '',
          registry_office: '',
          area_sqm: '',
          description: '',
          iptu_number: '',
          address_street: '',
          address_number: '',
          address_complement: '',
          address_neighborhood: '',
          address_city: '',
          address_state: '',
          address_zip: '',
          address_country: 'Brasil',
        })
      }, 300)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HomeIcon className="w-6 h-6 text-green-500" />
            Criar Novo Imóvel
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
              Informações do Imóvel
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registry_number">Matrícula</Label>
                <Input
                  id="registry_number"
                  value={formData.registry_number}
                  onChange={(e) => handleInputChange('registry_number', e.target.value)}
                  placeholder="Ex: 12345"
                />
              </div>

              <div>
                <Label htmlFor="registry_office">Cartório de Registro</Label>
                <Input
                  id="registry_office"
                  value={formData.registry_office}
                  onChange={(e) => handleInputChange('registry_office', e.target.value)}
                  placeholder="Ex: 1º Registro de Imóveis"
                />
              </div>

              <div>
                <Label htmlFor="area_sqm">Área (m²)</Label>
                <Input
                  id="area_sqm"
                  type="number"
                  step="0.01"
                  value={formData.area_sqm}
                  onChange={(e) => handleInputChange('area_sqm', e.target.value)}
                  placeholder="Ex: 250.50"
                />
              </div>

              <div>
                <Label htmlFor="iptu_number">Número IPTU</Label>
                <Input
                  id="iptu_number"
                  value={formData.iptu_number}
                  onChange={(e) => handleInputChange('iptu_number', e.target.value)}
                  placeholder="Ex: 000.000.0000-0"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição detalhada do imóvel..."
                  rows={3}
                />
              </div>
            </div>
          </motion.div>

          {/* Address Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
              Localização
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address_street">Logradouro</Label>
                <Input
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => handleInputChange('address_street', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => handleInputChange('address_number', e.target.value)}
                  placeholder="123"
                />
              </div>

              <div>
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={formData.address_complement}
                  onChange={(e) => handleInputChange('address_complement', e.target.value)}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div>
                <Label htmlFor="address_neighborhood">Bairro</Label>
                <Input
                  id="address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={(e) => handleInputChange('address_neighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>

              <div>
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => handleInputChange('address_city', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>

              <div>
                <Label htmlFor="address_state">Estado</Label>
                <Input
                  id="address_state"
                  value={formData.address_state}
                  onChange={(e) => handleInputChange('address_state', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="address_zip">CEP</Label>
                <Input
                  id="address_zip"
                  value={formData.address_zip}
                  onChange={(e) => handleInputChange('address_zip', e.target.value)}
                  placeholder="00000-000"
                />
              </div>

              <div>
                <Label htmlFor="address_country">País</Label>
                <Input
                  id="address_country"
                  value={formData.address_country}
                  onChange={(e) => handleInputChange('address_country', e.target.value)}
                  placeholder="Brasil"
                />
              </div>
            </div>
          </motion.div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </motion.div>
                  Criando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Criar Imóvel
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
