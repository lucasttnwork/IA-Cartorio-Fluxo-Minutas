/**
 * Test page for PropertyEntityCard component
 *
 * Displays the PropertyEntityCard with various states and configurations
 * for visual testing during development.
 */

import { useState } from 'react'
import { PropertyEntityCard } from '../components/entities'
import type { Property } from '../types'

// Mock property data for testing
const mockPropertyComplete: Property = {
  id: 'property-1',
  case_id: 'case-1',
  registry_number: '12345',
  registry_office: '1º Registro de Imoveis de Sao Paulo',
  address: {
    street: 'Rua Augusta',
    number: '1234',
    complement: 'Apto 501',
    neighborhood: 'Consolacao',
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01305-100',
    // Geocoding fields - successfully geocoded
    latitude: -23.5558,
    longitude: -46.6600,
    formatted_address: 'Rua Augusta, 1234 - Consolacao, Sao Paulo - SP, 01305-100, Brasil',
    geocoded_at: '2024-12-24T00:00:00Z',
    geocode_confidence: 0.95,
    geocode_status: 'success',
  },
  area_sqm: 85.5,
  description: 'Apartamento residencial com 2 quartos, 1 suite, sala, cozinha, area de servico e 1 vaga de garagem',
  iptu_number: '123.456.789-0',
  encumbrances: [
    {
      type: 'Hipoteca',
      description: 'Hipoteca em favor do Banco XYZ S.A.',
      value: 250000.00,
      beneficiary: 'Banco XYZ S.A.',
    },
    {
      type: 'Usufruto',
      description: 'Usufruto vitalicio em favor de Maria da Silva',
      beneficiary: 'Maria da Silva',
    },
  ],
  confidence: 0.95,
  source_docs: ['doc-1', 'doc-2', 'doc-3'],
  metadata: {},
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
}

const mockPropertyPartial: Property = {
  id: 'property-2',
  case_id: 'case-1',
  registry_number: '67890',
  registry_office: '2º Registro de Imoveis de Campinas',
  address: {
    street: 'Av. Paulista',
    number: '5678',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01311-300',
    // Geocoding fields - partial match
    latitude: -23.5617,
    longitude: -46.6562,
    formatted_address: 'Av. Paulista - Bela Vista, Sao Paulo - SP, Brasil',
    geocoded_at: '2024-12-24T00:00:00Z',
    geocode_confidence: 0.65,
    geocode_status: 'partial',
  },
  area_sqm: null,
  description: null,
  iptu_number: '987.654.321-0',
  encumbrances: null,
  confidence: 0.72,
  source_docs: ['doc-2'],
  metadata: {},
  created_at: '2024-01-16T14:20:00Z',
  updated_at: '2024-01-16T14:20:00Z',
}

const mockPropertyWithEncumbrances: Property = {
  id: 'property-3',
  case_id: 'case-1',
  registry_number: '54321',
  registry_office: '3º Registro de Imoveis do Rio de Janeiro',
  address: null,
  area_sqm: 120.0,
  description: 'Casa terrea com 3 quartos',
  iptu_number: null,
  encumbrances: [
    {
      type: 'Penhora',
      description: 'Penhora determinada pelo Processo nº 1234567-89.2023.8.19.0001',
      value: 500000.00,
    },
    {
      type: 'Servido',
      description: 'Servido de passagem',
    },
    {
      type: 'Arresto',
      description: 'Arresto judicial',
      value: 150000.00,
      beneficiary: 'Joao Silva',
    },
  ],
  confidence: 0.48,
  source_docs: ['doc-3'],
  metadata: {},
  created_at: '2024-01-17T09:15:00Z',
  updated_at: '2024-01-17T09:15:00Z',
}

const mockPropertyMinimal: Property = {
  id: 'property-4',
  case_id: 'case-1',
  registry_number: null,
  registry_office: 'Cartorio de Registro de Imoveis de Santos',
  address: {
    street: 'Rua das Flores',
    number: '100',
    complement: null,
    neighborhood: 'Centro',
    city: 'Santos',
    state: 'SP',
    zip: '11010-000',
  },
  area_sqm: null,
  description: null,
  iptu_number: null,
  encumbrances: null,
  confidence: 0.65,
  source_docs: ['doc-4'],
  metadata: {},
  created_at: '2024-01-18T11:00:00Z',
  updated_at: '2024-01-18T11:00:00Z',
}

export default function TestPropertyEntityCardPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [lastFieldClicked, setLastFieldClicked] = useState<string | null>(null)

  const handlePropertyClick = (property: Property) => {
    setSelectedPropertyId(property.id === selectedPropertyId ? null : property.id)
    console.log('Property clicked:', property)
  }

  const handleFieldClick = (property: Property, fieldName: string) => {
    setLastFieldClicked(`${property.registry_number || property.registry_office} - ${fieldName}`)
    console.log('Field clicked:', { property: property.registry_number, field: fieldName })
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test: Property Entity Card
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This page demonstrates the PropertyEntityCard component with different data states.
          </p>
          {lastFieldClicked && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              Last field clicked: <strong>{lastFieldClicked}</strong>
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="space-y-6">
          {/* Complete Property */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Complete Property with Encumbrances (High Confidence - 95%)
            </h2>
            <PropertyEntityCard
              property={mockPropertyComplete}
              isSelected={selectedPropertyId === mockPropertyComplete.id}
              onClick={handlePropertyClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Partial Property */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Partial Property (Medium Confidence - 72%)
            </h2>
            <PropertyEntityCard
              property={mockPropertyPartial}
              isSelected={selectedPropertyId === mockPropertyPartial.id}
              onClick={handlePropertyClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Property with Multiple Encumbrances */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Property with Multiple Encumbrances (Low Confidence - 48%)
            </h2>
            <PropertyEntityCard
              property={mockPropertyWithEncumbrances}
              isSelected={selectedPropertyId === mockPropertyWithEncumbrances.id}
              onClick={handlePropertyClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Minimal Property */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Minimal Property Data (65%)
            </h2>
            <PropertyEntityCard
              property={mockPropertyMinimal}
              isSelected={selectedPropertyId === mockPropertyMinimal.id}
              onClick={handlePropertyClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Compact Mode */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Compact Mode (Initially Collapsed)
            </h2>
            <PropertyEntityCard
              property={mockPropertyComplete}
              compact
              onClick={handlePropertyClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Side by Side */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Side by Side (Grid Layout)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PropertyEntityCard
                property={mockPropertyComplete}
                compact
                onClick={handlePropertyClick}
                onFieldClick={handleFieldClick}
              />
              <PropertyEntityCard
                property={mockPropertyPartial}
                compact
                onClick={handlePropertyClick}
                onFieldClick={handleFieldClick}
              />
            </div>
          </div>
        </div>

        {/* Feature Summary */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Features Demonstrated
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              All required property fields displayed with appropriate icons
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Registry information (matricula and cartorio)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Location details (address and IPTU)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Property characteristics (area and description)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Encumbrances display with detailed information
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Confidence indicator with color coding (high/medium/low)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Expand/collapse animation for better organization
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Click handlers for card and individual fields
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Selection state with visual feedback
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Compact mode for space-efficient display
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Responsive design for different screen sizes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Dark mode support
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
