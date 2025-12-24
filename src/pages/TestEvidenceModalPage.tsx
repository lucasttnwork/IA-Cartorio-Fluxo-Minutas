/**
 * Test page for Evidence Modal component
 *
 * Demonstrates various configurations and use cases:
 * - Opening modal with sample evidence data
 * - Displaying bounding boxes with different confidence levels
 * - Testing keyboard navigation (arrows, ESC)
 * - Testing pan/zoom functionality
 * - Testing responsive behavior
 * - Testing hover tooltips on bounding boxes
 *
 * @see src/components/evidence/EvidenceModal.tsx
 * @see src/types/evidence.ts
 */

import { useState } from 'react'
import {
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { EvidenceModal } from '../components/evidence'
import type { EvidenceItem, EvidenceBoundingBox } from '../types/evidence'

// -----------------------------------------------------------------------------
// Sample Data
// -----------------------------------------------------------------------------

/**
 * Sample bounding boxes with varying confidence levels and positions
 */
const sampleBoundingBoxes: EvidenceBoundingBox[] = [
  {
    id: 'box-1',
    page: 1,
    label: 'Nome Completo',
    confidence: 0.95,
    x: 100,
    y: 150,
    width: 300,
    height: 40,
    fieldName: 'fullName',
    extractedText: 'João da Silva Santos',
  },
  {
    id: 'box-2',
    page: 1,
    label: 'CPF',
    confidence: 0.88,
    x: 100,
    y: 210,
    width: 200,
    height: 35,
    fieldName: 'cpf',
    extractedText: '123.456.789-00',
  },
  {
    id: 'box-3',
    page: 1,
    label: 'Data de Nascimento',
    confidence: 0.72,
    x: 350,
    y: 210,
    width: 150,
    height: 35,
    fieldName: 'birthDate',
    extractedText: '15/03/1985',
  },
  {
    id: 'box-4',
    page: 1,
    label: 'RG',
    confidence: 0.45,
    x: 100,
    y: 270,
    width: 180,
    height: 35,
    fieldName: 'rg',
    extractedText: '12.345.678-9',
    color: '#ef4444', // Red for low confidence
  },
  {
    id: 'box-5',
    page: 1,
    label: 'Endereço',
    confidence: 0.91,
    x: 100,
    y: 340,
    width: 450,
    height: 50,
    fieldName: 'address',
    extractedText: 'Rua das Flores, 123 - Centro - São Paulo/SP',
  },
]

/**
 * Sample evidence item for RG document
 */
const sampleEvidenceRG: EvidenceItem = {
  id: 'evidence-rg-1',
  documentId: 'doc-rg-001',
  imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=1100&fit=crop',
  documentType: 'rg',
  documentName: 'Documento de Identidade - João da Silva',
  pageNumber: 1,
  totalPages: 1,
  boundingBoxes: sampleBoundingBoxes,
  entityType: 'person',
  entityId: 'person-001',
  fieldName: 'identification',
  extractedValue: 'João da Silva Santos',
}

/**
 * Sample evidence item for property document with multiple pages
 */
const sampleEvidenceProperty: EvidenceItem = {
  id: 'evidence-property-1',
  documentId: 'doc-property-001',
  imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=1100&fit=crop',
  documentType: 'deed',
  documentName: 'Escritura do Imóvel - Matrícula 12345',
  pageNumber: 1,
  totalPages: 3,
  boundingBoxes: [
    {
      id: 'prop-box-1',
      page: 1,
      label: 'Número da Matrícula',
      confidence: 0.98,
      x: 150,
      y: 100,
      width: 200,
      height: 40,
      fieldName: 'registrationNumber',
      extractedText: '12.345',
    },
    {
      id: 'prop-box-2',
      page: 1,
      label: 'Endereço do Imóvel',
      confidence: 0.85,
      x: 100,
      y: 200,
      width: 400,
      height: 60,
      fieldName: 'propertyAddress',
      extractedText: 'Av. Paulista, 1000, Apto 101 - Bela Vista - São Paulo/SP',
    },
    {
      id: 'prop-box-3',
      page: 1,
      label: 'Área Total',
      confidence: 0.92,
      x: 100,
      y: 300,
      width: 150,
      height: 35,
      fieldName: 'totalArea',
      extractedText: '85,00 m²',
    },
  ],
  entityType: 'property',
  entityId: 'property-001',
  fieldName: 'deed',
}

/**
 * Sample evidence with single box (edge case)
 */
const sampleEvidenceSingleBox: EvidenceItem = {
  id: 'evidence-single-1',
  documentId: 'doc-single-001',
  imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=1100&fit=crop',
  documentType: 'proxy',
  documentName: 'Procuração Simples',
  pageNumber: 1,
  totalPages: 1,
  boundingBoxes: [
    {
      id: 'single-box-1',
      page: 1,
      label: 'Assinatura do Outorgante',
      confidence: 0.78,
      x: 200,
      y: 400,
      width: 250,
      height: 80,
      fieldName: 'signature',
      extractedText: '[Assinatura]',
    },
  ],
  entityType: 'person',
  entityId: 'person-002',
  fieldName: 'powerOfAttorney',
}

/**
 * Sample evidence with no boxes (edge case)
 */
const sampleEvidenceNoBoxes: EvidenceItem = {
  id: 'evidence-no-boxes-1',
  documentId: 'doc-no-boxes-001',
  imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=1100&fit=crop',
  documentType: 'other',
  documentName: 'Documento sem Evidências Destacadas',
  pageNumber: 1,
  totalPages: 1,
  boundingBoxes: [],
}

// -----------------------------------------------------------------------------
// Test Page Component
// -----------------------------------------------------------------------------

export default function TestEvidenceModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceItem | null>(null)

  const openModal = (evidence: EvidenceItem) => {
    setCurrentEvidence(evidence)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentEvidence(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Evidence Modal Component
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Modal para visualização de documentos com destaque de evidências extraídas via bounding boxes
        </p>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
          ⌨️ Atalhos de Teclado (quando o modal está aberto)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">ESC</kbd>
            <span className="text-gray-600 dark:text-gray-400">Fechar</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">← / ↑</kbd>
            <span className="text-gray-600 dark:text-gray-400">Box anterior</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">→ / ↓</kbd>
            <span className="text-gray-600 dark:text-gray-400">Próximo box</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">Home</kbd>
            <span className="text-gray-600 dark:text-gray-400">Primeiro box</span>
          </div>
        </div>
      </section>

      {/* Test Cases */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Casos de Teste
        </h2>

        <div className="grid gap-4">
          {/* Multiple Bounding Boxes */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Múltiplos Bounding Boxes
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Documento RG com 5 campos destacados e diferentes níveis de confiança
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-success">Alta: 2</span>
                    <span className="badge badge-warning">Média: 2</span>
                    <span className="badge badge-error">Baixa: 1</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openModal(sampleEvidenceRG)}
                className="btn-primary flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Visualizar
              </button>
            </div>
          </div>

          {/* Property Document */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <PhotoIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Documento de Imóvel
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Escritura com 3 campos destacados, documento multi-página
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Página 1 de 3
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openModal(sampleEvidenceProperty)}
                className="btn-primary flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Visualizar
              </button>
            </div>
          </div>

          {/* Single Bounding Box */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Box Único
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Procuração com apenas 1 campo destacado (navegação desabilitada)
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-warning">Confiança: 78%</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openModal(sampleEvidenceSingleBox)}
                className="btn-secondary flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Visualizar
              </button>
            </div>
          </div>

          {/* No Bounding Boxes */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Sem Bounding Boxes
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Documento sem evidências destacadas (caso de borda)
                  </p>
                </div>
              </div>
              <button
                onClick={() => openModal(sampleEvidenceNoBoxes)}
                className="btn-secondary flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Visualizar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Checklist */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Funcionalidades para Verificar
        </h2>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Bounding boxes renderizam corretamente</strong> - Cores por nível de confiança (verde/amarelo/vermelho)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Pan/Zoom funciona</strong> - Scroll do mouse para zoom, arrastar para pan
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Navegação por teclado</strong> - ESC fecha, setas navegam entre boxes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Clique no box seleciona</strong> - Click em um box o seleciona
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Tooltips no hover</strong> - Passar o mouse sobre box mostra label e confiança
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Responsivo</strong> - Redimensionar a janela mantém a precisão dos boxes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Focus trap</strong> - Tab mantém foco dentro do modal
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Backdrop fecha modal</strong> - Clicar fora do conteúdo fecha o modal
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Ações Rápidas
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openModal(sampleEvidenceRG)}
            className="btn-primary flex items-center gap-2"
          >
            <EyeIcon className="w-4 h-4" />
            Abrir Modal Padrão
          </button>

          <button
            onClick={() => {
              // Cycle through all evidences
              const evidences = [
                sampleEvidenceRG,
                sampleEvidenceProperty,
                sampleEvidenceSingleBox,
                sampleEvidenceNoBoxes,
              ]
              const currentIndex = currentEvidence
                ? evidences.findIndex(e => e.id === currentEvidence.id)
                : -1
              const nextIndex = (currentIndex + 1) % evidences.length
              openModal(evidences[nextIndex])
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Ciclar Evidências
          </button>
        </div>
      </section>

      {/* Notes */}
      <section className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-500 dark:text-gray-400">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
          📝 Notas de Implementação
        </h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            As imagens usadas são placeholders do Unsplash para demonstração
          </li>
          <li>
            Em produção, as coordenadas dos bounding boxes virão da API de OCR/LLM
          </li>
          <li>
            O modal usa portal para renderizar fora da hierarquia DOM normal
          </li>
          <li>
            Animações são gerenciadas pelo Framer Motion para suavidade
          </li>
          <li>
            O debounce de resize é configurado para 150ms por padrão
          </li>
        </ul>
      </section>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={isModalOpen}
        evidence={currentEvidence}
        onClose={closeModal}
        config={{
          showZoomControls: true,
          enableKeyboardNavigation: true,
          showBoxNavigation: true,
          showPageNavigation: true,
          enableAnimations: true,
        }}
      />
    </div>
  )
}
