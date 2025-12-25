/**
 * Test page for DocumentTypeBadge component
 *
 * Demonstrates all document type badge variations with different:
 * - Document types (CNH, RG, Marriage Cert, etc.)
 * - Confidence levels (high, medium, low)
 * - Sizes (sm, md, lg)
 * - Icon visibility options
 * - Interactive states
 */

import { useState } from 'react'
import { DocumentTypeBadge } from '@/components/status/DocumentTypeBadge'
import type { DocumentType } from '@/types'

const allDocumentTypes: DocumentType[] = [
  'cnh',
  'rg',
  'marriage_cert',
  'birth_cert',
  'deed',
  'proxy',
  'iptu',
  'other',
]

const confidenceLevels = [
  { label: 'High (95%)', value: 0.95 },
  { label: 'Medium (70%)', value: 0.70 },
  { label: 'Low (35%)', value: 0.35 },
  { label: 'None', value: null },
]

export default function TestDocumentTypeBadgePage() {
  const [showConfidence, setShowConfidence] = useState(true)
  const [showIcon, setShowIcon] = useState(true)
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Document Type Badge Component
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visual showcase of document type badges with various configurations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Display Options
          </h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Show Confidence</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showIcon}
                onChange={(e) => setShowIcon(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Show Icon</span>
            </label>
          </div>
        </div>

        {/* All Document Types Grid */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            All Document Types
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {allDocumentTypes.map((type) => (
              <div
                key={type}
                className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                <DocumentTypeBadge
                  type={type}
                  confidence={0.85}
                  showConfidence={showConfidence}
                  showIcon={showIcon}
                  size="md"
                  onClick={() => setSelectedType(type)}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {type}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Size Variants */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Size Variants
          </h2>
          <div className="space-y-6">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <div key={size} className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {size}
                </span>
                <div className="flex flex-wrap gap-3">
                  {allDocumentTypes.slice(0, 4).map((type) => (
                    <DocumentTypeBadge
                      key={`${size}-${type}`}
                      type={type}
                      confidence={0.92}
                      showConfidence={showConfidence}
                      showIcon={showIcon}
                      size={size}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Confidence Levels */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Confidence Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {confidenceLevels.map((conf) => (
              <div key={conf.label} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {conf.label}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allDocumentTypes.map((type) => (
                    <DocumentTypeBadge
                      key={`${conf.label}-${type}`}
                      type={type}
                      confidence={conf.value}
                      showConfidence={true}
                      showIcon={true}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Interactive Badges
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click on any badge to select it. Selected type: {' '}
            <strong className="text-gray-900 dark:text-white">
              {selectedType || 'None'}
            </strong>
          </p>
          <div className="flex flex-wrap gap-3">
            {allDocumentTypes.map((type) => (
              <DocumentTypeBadge
                key={type}
                type={type}
                confidence={0.88}
                showConfidence={showConfidence}
                showIcon={showIcon}
                size="md"
                onClick={() => setSelectedType(type)}
                className={selectedType === type ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''}
              />
            ))}
          </div>
        </section>

        {/* Without Icons */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Without Icons
          </h2>
          <div className="flex flex-wrap gap-3">
            {allDocumentTypes.map((type) => (
              <DocumentTypeBadge
                key={type}
                type={type}
                confidence={0.78}
                showConfidence={true}
                showIcon={false}
                size="md"
              />
            ))}
          </div>
        </section>

        {/* Without Confidence */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Without Confidence
          </h2>
          <div className="flex flex-wrap gap-3">
            {allDocumentTypes.map((type) => (
              <DocumentTypeBadge
                key={type}
                type={type}
                showConfidence={false}
                showIcon={true}
                size="md"
              />
            ))}
          </div>
        </section>

        {/* In Context - Document Card Simulation */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            In Context - Document Card Simulation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'documento_cnh_joao.pdf', type: 'cnh' as DocumentType, confidence: 0.98 },
              { name: 'rg_maria_silva.jpg', type: 'rg' as DocumentType, confidence: 0.95 },
              { name: 'certidao_casamento.pdf', type: 'marriage_cert' as DocumentType, confidence: 0.87 },
              { name: 'escritura_imovel.pdf', type: 'deed' as DocumentType, confidence: 0.72 },
              { name: 'procuracao_representacao.pdf', type: 'proxy' as DocumentType, confidence: 0.45 },
              { name: 'boleto_iptu_2024.pdf', type: 'iptu' as DocumentType, confidence: 0.91 },
            ].map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.name}
                  </p>
                  <div className="mt-1">
                    <DocumentTypeBadge
                      type={doc.type}
                      confidence={doc.confidence}
                      showConfidence={true}
                      showIcon={true}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dark Mode Toggle Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Toggle dark mode in your system preferences to see dark mode styles</p>
        </div>
      </div>
    </div>
  )
}
