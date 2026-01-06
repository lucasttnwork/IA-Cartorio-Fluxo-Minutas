/**
 * CreatePersonModal Component
 *
 * Modal dialog for manually creating a new Person entity.
 * Provides a form with all required person fields.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import type { MaritalStatus } from '../../types'

export interface CreatePersonModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when person is created with the form data */
  onCreate: (personData: PersonFormData) => void
  /** Whether the creation is in progress */
  isCreating?: boolean
}

export interface PersonFormData {
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

const maritalStatusOptions: { value: MaritalStatus; label: string }[] = [
  { value: 'single', label: 'Solteiro(a)' },
  { value: 'married', label: 'Casado(a)' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed', label: 'Viúvo(a)' },
  { value: 'separated', label: 'Separado(a)' },
  { value: 'stable_union', label: 'União Estável' },
]

export default function CreatePersonModal({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}: CreatePersonModalProps) {
  const [formData, setFormData] = useState<PersonFormData>({
    full_name: '',
    cpf: '',
    rg: '',
    rg_issuer: '',
    birth_date: '',
    nationality: 'Brasileiro(a)',
    marital_status: '',
    profession: '',
    email: '',
    phone: '',
    father_name: '',
    mother_name: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'Brasil',
  })

  const handleInputChange = (field: keyof PersonFormData, value: string) => {
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
          full_name: '',
          cpf: '',
          rg: '',
          rg_issuer: '',
          birth_date: '',
          nationality: 'Brasileiro(a)',
          marital_status: '',
          profession: '',
          email: '',
          phone: '',
          father_name: '',
          mother_name: '',
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
            <UserIcon className="w-6 h-6 text-blue-500" />
            Criar Nova Pessoa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => handleInputChange('rg', e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>

              <div>
                <Label htmlFor="rg_issuer">Órgão Emissor RG</Label>
                <Input
                  id="rg_issuer"
                  value={formData.rg_issuer}
                  onChange={(e) => handleInputChange('rg_issuer', e.target.value)}
                  placeholder="SSP/SP"
                />
              </div>

              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Brasileiro(a)"
                />
              </div>

              <div>
                <Label htmlFor="marital_status">Estado Civil</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(value) => handleInputChange('marital_status', value)}
                >
                  <SelectTrigger id="marital_status">
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    {maritalStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="profession">Profissão</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  placeholder="Ex: Advogado(a)"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label htmlFor="father_name">Nome do Pai</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                  placeholder="Nome completo do pai"
                />
              </div>

              <div>
                <Label htmlFor="mother_name">Nome da Mãe</Label>
                <Input
                  id="mother_name"
                  value={formData.mother_name}
                  onChange={(e) => handleInputChange('mother_name', e.target.value)}
                  placeholder="Nome completo da mãe"
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
              Endereço
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
              disabled={isCreating || !formData.full_name}
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
                  Criar Pessoa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
