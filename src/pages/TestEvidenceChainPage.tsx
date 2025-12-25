import { useState } from 'react'
import { EvidenceChainVisualization } from '@/components/evidence'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { EvidenceChain, EvidenceChainNode } from '@/types/evidence'

/**
 * Test page for the Evidence Chain Visualization component
 */
export default function TestEvidenceChainPage() {
  const [selectedScenario, setSelectedScenario] = useState<'simple' | 'complex' | 'conflict'>('simple')

  // Mock data - Simple scenario
  const simpleChain: EvidenceChain = {
    fieldName: 'cpf',
    entityType: 'person',
    entityId: 'person-1',
    currentValue: '123.456.789-00',
    confidence: 0.95,
    hasConflicts: false,
    isPending: false,
    nodes: [
      {
        id: 'doc-1',
        type: 'document',
        label: 'CNH - João Silva.pdf',
        value: null,
        confidence: 1,
        timestamp: '2024-01-15T10:00:00Z',
        documentId: 'doc-1',
        pageNumber: 1,
        metadata: {
          docType: 'cnh',
          mimeType: 'application/pdf',
        },
      },
      {
        id: 'ocr-1',
        type: 'ocr',
        label: 'OCR Extraction',
        value: '123.456.789-00',
        confidence: 0.92,
        timestamp: '2024-01-15T10:01:30Z',
        documentId: 'doc-1',
        pageNumber: 1,
        boundingBox: {
          x: 120,
          y: 450,
          width: 200,
          height: 30,
        },
      },
      {
        id: 'llm-1',
        type: 'llm',
        label: 'LLM Extraction',
        value: '123.456.789-00',
        confidence: 0.98,
        timestamp: '2024-01-15T10:02:00Z',
        documentId: 'doc-1',
        pageNumber: 1,
      },
      {
        id: 'consensus-1',
        type: 'consensus',
        label: 'Consensus',
        value: '123.456.789-00',
        confidence: 0.95,
        timestamp: '2024-01-15T10:02:30Z',
        metadata: {
          isPending: false,
          source: 'consensus',
        },
      },
      {
        id: 'entity-1',
        type: 'entity',
        label: 'Pessoa - cpf',
        value: '123.456.789-00',
        confidence: 0.95,
        timestamp: '2024-01-15T10:03:00Z',
        metadata: {
          entityType: 'person',
          entityId: 'person-1',
          fieldName: 'cpf',
        },
      },
    ],
    links: [
      { source: 'doc-1', target: 'ocr-1', type: 'extraction', label: 'OCR' },
      { source: 'doc-1', target: 'llm-1', type: 'extraction', label: 'LLM' },
      { source: 'ocr-1', target: 'consensus-1', type: 'consensus' },
      { source: 'llm-1', target: 'consensus-1', type: 'consensus' },
      { source: 'consensus-1', target: 'entity-1', type: 'resolution' },
    ],
  }

  // Mock data - Complex scenario with multiple documents
  const complexChain: EvidenceChain = {
    fieldName: 'nome',
    entityType: 'person',
    entityId: 'person-2',
    currentValue: 'Maria Santos da Silva',
    confidence: 0.88,
    hasConflicts: false,
    isPending: false,
    nodes: [
      {
        id: 'doc-1',
        type: 'document',
        label: 'CNH - Maria.pdf',
        value: null,
        confidence: 1,
        timestamp: '2024-01-15T10:00:00Z',
        documentId: 'doc-1',
        pageNumber: 1,
      },
      {
        id: 'doc-2',
        type: 'document',
        label: 'Certidão de Casamento.pdf',
        value: null,
        confidence: 1,
        timestamp: '2024-01-15T10:00:05Z',
        documentId: 'doc-2',
        pageNumber: 1,
      },
      {
        id: 'ocr-1',
        type: 'ocr',
        label: 'OCR Extraction (CNH)',
        value: 'Maria Santos Silva',
        confidence: 0.85,
        timestamp: '2024-01-15T10:01:00Z',
        documentId: 'doc-1',
        pageNumber: 1,
      },
      {
        id: 'llm-1',
        type: 'llm',
        label: 'LLM Extraction (CNH)',
        value: 'Maria Santos da Silva',
        confidence: 0.92,
        timestamp: '2024-01-15T10:01:30Z',
        documentId: 'doc-1',
        pageNumber: 1,
      },
      {
        id: 'ocr-2',
        type: 'ocr',
        label: 'OCR Extraction (Certidão)',
        value: 'Maria Santos da Silva',
        confidence: 0.88,
        timestamp: '2024-01-15T10:01:45Z',
        documentId: 'doc-2',
        pageNumber: 1,
      },
      {
        id: 'llm-2',
        type: 'llm',
        label: 'LLM Extraction (Certidão)',
        value: 'Maria Santos da Silva',
        confidence: 0.95,
        timestamp: '2024-01-15T10:02:15Z',
        documentId: 'doc-2',
        pageNumber: 1,
      },
      {
        id: 'consensus-1',
        type: 'consensus',
        label: 'Consensus Final',
        value: 'Maria Santos da Silva',
        confidence: 0.88,
        timestamp: '2024-01-15T10:03:00Z',
        metadata: {
          isPending: false,
          source: 'consensus',
        },
      },
      {
        id: 'entity-2',
        type: 'entity',
        label: 'Pessoa - nome',
        value: 'Maria Santos da Silva',
        confidence: 0.88,
        timestamp: '2024-01-15T10:03:30Z',
        metadata: {
          entityType: 'person',
          entityId: 'person-2',
          fieldName: 'nome',
        },
      },
    ],
    links: [
      { source: 'doc-1', target: 'ocr-1', type: 'extraction', label: 'OCR' },
      { source: 'doc-1', target: 'llm-1', type: 'extraction', label: 'LLM' },
      { source: 'doc-2', target: 'ocr-2', type: 'extraction', label: 'OCR' },
      { source: 'doc-2', target: 'llm-2', type: 'extraction', label: 'LLM' },
      { source: 'ocr-1', target: 'consensus-1', type: 'consensus' },
      { source: 'llm-1', target: 'consensus-1', type: 'consensus' },
      { source: 'ocr-2', target: 'consensus-1', type: 'consensus' },
      { source: 'llm-2', target: 'consensus-1', type: 'consensus' },
      { source: 'consensus-1', target: 'entity-2', type: 'resolution' },
    ],
  }

  // Mock data - Conflict scenario
  const conflictChain: EvidenceChain = {
    fieldName: 'matricula',
    entityType: 'property',
    entityId: 'property-1',
    currentValue: '12345',
    confidence: 0.65,
    hasConflicts: true,
    isPending: true,
    nodes: [
      {
        id: 'doc-1',
        type: 'document',
        label: 'Matrícula do Imóvel.pdf',
        value: null,
        confidence: 1,
        timestamp: '2024-01-15T10:00:00Z',
        documentId: 'doc-1',
        pageNumber: 1,
      },
      {
        id: 'ocr-1',
        type: 'ocr',
        label: 'OCR Extraction',
        value: '12345',
        confidence: 0.62,
        timestamp: '2024-01-15T10:01:00Z',
        documentId: 'doc-1',
        pageNumber: 1,
        boundingBox: {
          x: 150,
          y: 200,
          width: 100,
          height: 25,
        },
      },
      {
        id: 'llm-1',
        type: 'llm',
        label: 'LLM Extraction',
        value: '12346',
        confidence: 0.68,
        timestamp: '2024-01-15T10:01:30Z',
        documentId: 'doc-1',
        pageNumber: 1,
      },
      {
        id: 'consensus-1',
        type: 'consensus',
        label: 'Consensus',
        value: '12345',
        confidence: 0.65,
        timestamp: '2024-01-15T10:02:00Z',
        metadata: {
          isPending: true,
          source: 'ocr',
        },
      },
      {
        id: 'entity-1',
        type: 'entity',
        label: 'Propriedade - matricula',
        value: '12345',
        confidence: 0.65,
        timestamp: '2024-01-15T10:02:30Z',
        metadata: {
          entityType: 'property',
          entityId: 'property-1',
          fieldName: 'matricula',
        },
      },
    ],
    links: [
      { source: 'doc-1', target: 'ocr-1', type: 'extraction', label: 'OCR' },
      { source: 'doc-1', target: 'llm-1', type: 'extraction', label: 'LLM' },
      { source: 'ocr-1', target: 'consensus-1', type: 'consensus' },
      { source: 'llm-1', target: 'consensus-1', type: 'consensus' },
      { source: 'consensus-1', target: 'entity-1', type: 'resolution' },
    ],
  }

  const scenarios = {
    simple: simpleChain,
    complex: complexChain,
    conflict: conflictChain,
  }

  const currentChain = scenarios[selectedScenario]

  const handleNodeClick = (node: EvidenceChainNode) => {
    console.log('Node clicked:', node)
    alert(`Clicked on: ${node.label}\nValue: ${node.value || 'N/A'}`)
  }

  const handleViewDocument = (documentId: string, pageNumber?: number) => {
    console.log('View document:', documentId, 'Page:', pageNumber)
    alert(`Opening document: ${documentId}${pageNumber ? ` (Page ${pageNumber})` : ''}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Evidence Chain Visualization
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test page for visualizing the evidence chain showing data provenance from document to entity
          </p>
        </div>

        {/* Scenario Selector */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Test Scenario
          </h2>
          <div className="flex gap-3">
            <Button
              variant={selectedScenario === 'simple' ? 'default' : 'outline'}
              onClick={() => setSelectedScenario('simple')}
            >
              Simple Flow
              <Badge variant="secondary" className="ml-2">
                5 steps
              </Badge>
            </Button>
            <Button
              variant={selectedScenario === 'complex' ? 'default' : 'outline'}
              onClick={() => setSelectedScenario('complex')}
            >
              Complex (Multi-Doc)
              <Badge variant="secondary" className="ml-2">
                8 steps
              </Badge>
            </Button>
            <Button
              variant={selectedScenario === 'conflict' ? 'default' : 'outline'}
              onClick={() => setSelectedScenario('conflict')}
            >
              With Conflicts
              <Badge variant="destructive" className="ml-2">
                Pending
              </Badge>
            </Button>
          </div>
        </Card>

        {/* Visualization */}
        <EvidenceChainVisualization
          chain={currentChain}
          onNodeClick={handleNodeClick}
          onViewDocument={handleViewDocument}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Scenario Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Type:</dt>
                <dd className="font-medium text-gray-900 dark:text-white capitalize">
                  {selectedScenario}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Field:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {currentChain.fieldName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Entity:</dt>
                <dd className="font-medium text-gray-900 dark:text-white capitalize">
                  {currentChain.entityType}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Chain Statistics
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Total Nodes:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {currentChain.nodes.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Total Links:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {currentChain.links.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Documents:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {currentChain.nodes.filter(n => n.type === 'document').length}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quality Indicators
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Confidence:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {Math.round(currentChain.confidence * 100)}%
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Conflicts:</dt>
                <dd className={`font-medium ${currentChain.hasConflicts ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {currentChain.hasConflicts ? 'Yes' : 'No'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Status:</dt>
                <dd className={`font-medium ${currentChain.isPending ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {currentChain.isPending ? 'Pending' : 'Approved'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 How to Use
          </h3>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li>• Click on any node to expand and see detailed information</li>
            <li>• Document nodes can be clicked to view the original document</li>
            <li>• The chain shows the complete flow from document to final entity value</li>
            <li>• Conflicts are highlighted with warning badges when OCR and LLM disagree</li>
            <li>• Pending items require human review before finalization</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
