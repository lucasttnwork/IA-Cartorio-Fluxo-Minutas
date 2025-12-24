/**
 * Test page for PersonEntityCard component
 *
 * Displays the PersonEntityCard with various states and configurations
 * for visual testing during development.
 */

import { useState } from 'react'
import { PersonEntityCard } from '../components/entities'
import type { Person } from '../types'

// Mock person data for testing
const mockPersonComplete: Person = {
  id: 'person-1',
  case_id: 'case-1',
  full_name: 'Maria da Silva Santos',
  cpf: '123.456.789-00',
  rg: '12.345.678-9',
  rg_issuer: 'SSP/SP',
  birth_date: '1985-03-15',
  nationality: 'Brasileira',
  marital_status: 'married',
  profession: 'Engenheira Civil',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Jardim das Rosas',
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01234-567',
  },
  email: 'maria.silva@email.com',
  phone: '(11) 98765-4321',
  father_name: 'Jose da Silva',
  mother_name: 'Ana Santos da Silva',
  confidence: 0.92,
  source_docs: ['doc-1', 'doc-2', 'doc-3'],
  metadata: {},
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
}

const mockPersonPartial: Person = {
  id: 'person-2',
  case_id: 'case-1',
  full_name: 'Joao Pereira Lima',
  cpf: '987.654.321-00',
  rg: null,
  rg_issuer: null,
  birth_date: '1990-08-22',
  nationality: null,
  marital_status: 'single',
  profession: null,
  address: null,
  email: 'joao.lima@email.com',
  phone: null,
  father_name: null,
  mother_name: 'Rosa Pereira Lima',
  confidence: 0.68,
  source_docs: ['doc-2'],
  metadata: {},
  created_at: '2024-01-16T14:20:00Z',
  updated_at: '2024-01-16T14:20:00Z',
}

const mockPersonLowConfidence: Person = {
  id: 'person-3',
  case_id: 'case-1',
  full_name: 'Carlos Eduardo Nascimento',
  cpf: null,
  rg: '98.765.432-1',
  rg_issuer: 'SSP/RJ',
  birth_date: null,
  nationality: 'Brasileira',
  marital_status: null,
  profession: 'Advogado',
  address: {
    street: 'Av. Atlantica',
    number: '456',
    complement: null,
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '22041-080',
  },
  email: null,
  phone: '(21) 99876-5432',
  father_name: 'Pedro Nascimento',
  mother_name: null,
  confidence: 0.45,
  source_docs: ['doc-3'],
  metadata: {},
  created_at: '2024-01-17T09:15:00Z',
  updated_at: '2024-01-17T09:15:00Z',
}

export default function TestPersonEntityCardPage() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [lastFieldClicked, setLastFieldClicked] = useState<string | null>(null)

  const handlePersonClick = (person: Person) => {
    setSelectedPersonId(person.id === selectedPersonId ? null : person.id)
    console.log('Person clicked:', person)
  }

  const handleFieldClick = (person: Person, fieldName: string) => {
    setLastFieldClicked(`${person.full_name} - ${fieldName}`)
    console.log('Field clicked:', { person: person.full_name, field: fieldName })
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test: Person Entity Card
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This page demonstrates the PersonEntityCard component with different data states.
          </p>
          {lastFieldClicked && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              Last field clicked: <strong>{lastFieldClicked}</strong>
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="space-y-6">
          {/* Complete Person */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Complete Person (High Confidence - 92%)
            </h2>
            <PersonEntityCard
              person={mockPersonComplete}
              isSelected={selectedPersonId === mockPersonComplete.id}
              onClick={handlePersonClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Partial Person */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Partial Person (Medium Confidence - 68%)
            </h2>
            <PersonEntityCard
              person={mockPersonPartial}
              isSelected={selectedPersonId === mockPersonPartial.id}
              onClick={handlePersonClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Low Confidence Person */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Low Confidence Person (45%)
            </h2>
            <PersonEntityCard
              person={mockPersonLowConfidence}
              isSelected={selectedPersonId === mockPersonLowConfidence.id}
              onClick={handlePersonClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Compact Mode */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Compact Mode (Initially Collapsed)
            </h2>
            <PersonEntityCard
              person={mockPersonComplete}
              compact
              onClick={handlePersonClick}
              onFieldClick={handleFieldClick}
            />
          </div>

          {/* Side by Side */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Side by Side (Grid Layout)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PersonEntityCard
                person={mockPersonComplete}
                compact
                onClick={handlePersonClick}
                onFieldClick={handleFieldClick}
              />
              <PersonEntityCard
                person={mockPersonPartial}
                compact
                onClick={handlePersonClick}
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
              All required person fields displayed with appropriate icons
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
