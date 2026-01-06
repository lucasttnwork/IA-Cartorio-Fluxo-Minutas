/**
 * Test page for DocumentCard component
 *
 * Displays the DocumentCard with various states and configurations
 * for visual testing during development.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DocumentCard } from '../components/documents'
import type { Document } from '../types'

// Mock document data for testing
const mockDocumentPDF: Document = {
  id: 'doc-1',
  case_id: 'case-1',
  original_name: 'certidao_casamento_maria_joao.pdf',
  storage_path: 'cases/case-1/certidao_casamento_maria_joao.pdf',
  mime_type: 'application/pdf',
  file_size: 2458624, // ~2.4 MB
  page_count: 3,
  status: 'processed',
  doc_type: 'marriage_cert',
  doc_type_confidence: 0.95,
  processing_error: null,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:35:00Z',
}

const mockDocumentProcessing: Document = {
  id: 'doc-2',
  case_id: 'case-1',
  original_name: 'escritura_imovel_centro.pdf',
  storage_path: 'cases/case-1/escritura_imovel_centro.pdf',
  mime_type: 'application/pdf',
  file_size: 5242880, // 5 MB
  page_count: 12,
  status: 'processing',
  doc_type: null,
  doc_type_confidence: null,
  processing_error: null,
  created_at: '2024-01-16T14:20:00Z',
  updated_at: '2024-01-16T14:20:00Z',
}

const mockDocumentImage: Document = {
  id: 'doc-3',
  case_id: 'case-1',
  original_name: 'foto_rg_frente.jpg',
  storage_path: 'cases/case-1/foto_rg_frente.jpg',
  mime_type: 'image/jpeg',
  file_size: 524288, // 512 KB
  page_count: 1,
  status: 'processed',
  doc_type: 'rg',
  doc_type_confidence: 0.78,
  processing_error: null,
  created_at: '2024-01-17T09:15:00Z',
  updated_at: '2024-01-17T09:20:00Z',
}

const mockDocumentLowConfidence: Document = {
  id: 'doc-4',
  case_id: 'case-1',
  original_name: 'documento_escaneado.pdf',
  storage_path: 'cases/case-1/documento_escaneado.pdf',
  mime_type: 'application/pdf',
  file_size: 1048576, // 1 MB
  page_count: 2,
  status: 'processed',
  doc_type: 'other',
  doc_type_confidence: 0.35,
  processing_error: null,
  created_at: '2024-01-18T16:45:00Z',
  updated_at: '2024-01-18T16:50:00Z',
}

const mockDocumentFailed: Document = {
  id: 'doc-5',
  case_id: 'case-1',
  original_name: 'arquivo_corrompido.pdf',
  storage_path: 'cases/case-1/arquivo_corrompido.pdf',
  mime_type: 'application/pdf',
  file_size: 102400, // 100 KB
  page_count: null,
  status: 'failed',
  doc_type: null,
  doc_type_confidence: null,
  processing_error: 'Could not parse PDF file',
  created_at: '2024-01-19T11:00:00Z',
  updated_at: '2024-01-19T11:05:00Z',
}

const mockDocumentUploaded: Document = {
  id: 'doc-6',
  case_id: 'case-1',
  original_name: 'procuracao_publica.pdf',
  storage_path: 'cases/case-1/procuracao_publica.pdf',
  mime_type: 'application/pdf',
  file_size: 3145728, // 3 MB
  page_count: 5,
  status: 'uploaded',
  doc_type: null,
  doc_type_confidence: null,
  processing_error: null,
  created_at: '2024-01-20T08:30:00Z',
  updated_at: '2024-01-20T08:30:00Z',
}

const mockDocumentNeedsReview: Document = {
  id: 'doc-7',
  case_id: 'case-1',
  original_name: 'certidao_nascimento_joao.pdf',
  storage_path: 'cases/case-1/certidao_nascimento_joao.pdf',
  mime_type: 'application/pdf',
  file_size: 1572864, // 1.5 MB
  page_count: 1,
  status: 'needs_review',
  doc_type: 'birth_cert',
  doc_type_confidence: 0.62,
  processing_error: null,
  created_at: '2024-01-21T13:15:00Z',
  updated_at: '2024-01-21T13:20:00Z',
}

const mockDocumentApproved: Document = {
  id: 'doc-8',
  case_id: 'case-1',
  original_name: 'cnh_maria.pdf',
  storage_path: 'cases/case-1/cnh_maria.pdf',
  mime_type: 'application/pdf',
  file_size: 819200, // 800 KB
  page_count: 1,
  status: 'approved',
  doc_type: 'cnh',
  doc_type_confidence: 0.98,
  processing_error: null,
  created_at: '2024-01-22T10:00:00Z',
  updated_at: '2024-01-22T10:10:00Z',
}

export default function TestDocumentCardPage() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [reprocessingDocIds, setReprocessingDocIds] = useState<Set<string>>(new Set())

  const handleDocumentClick = (document: Document) => {
    setSelectedDocId(document.id === selectedDocId ? null : document.id)
    setLastAction(`Clicked: ${document.original_name}`)
    console.log('Document clicked:', document)
  }

  const handleViewDocument = (document: Document) => {
    setLastAction(`View: ${document.original_name}`)
    console.log('View document:', document)
  }

  const handleDeleteDocument = (documentId: string) => {
    setLastAction(`Delete: ${documentId}`)
    console.log('Delete document:', documentId)
  }

  const handleReprocessDocument = (documentId: string) => {
    setLastAction(`Reprocess: ${documentId}`)
    console.log('Reprocess document:', documentId)
    // Simulate reprocessing state
    setReprocessingDocIds((prev) => new Set(prev).add(documentId))
    // Clear after 2 seconds
    setTimeout(() => {
      setReprocessingDocIds((prev) => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test: Document Card
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This page demonstrates the DocumentCard component with different document states and types.
          </p>
          {lastAction && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              Last action: <strong>{lastAction}</strong>
            </div>
          )}
        </div>

        {/* Document Cards by Status */}
        <div className="space-y-8">
          {/* Processed Documents */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Processed Documents (With Reprocess Button)
            </h2>
            <div className="space-y-3">
              <DocumentCard
                document={mockDocumentPDF}
                isSelected={selectedDocId === mockDocumentPDF.id}
                onClick={handleDocumentClick}
                onView={handleViewDocument}
                onDelete={handleDeleteDocument}
                onReprocess={handleReprocessDocument}
                isReprocessing={reprocessingDocIds.has(mockDocumentPDF.id)}
              />
              <DocumentCard
                document={mockDocumentApproved}
                isSelected={selectedDocId === mockDocumentApproved.id}
                onClick={handleDocumentClick}
                onView={handleViewDocument}
                onDelete={handleDeleteDocument}
                onReprocess={handleReprocessDocument}
                isReprocessing={reprocessingDocIds.has(mockDocumentApproved.id)}
              />
            </div>
          </div>

          {/* Medium Confidence */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Medium Confidence Documents
            </h2>
            <div className="space-y-3">
              <DocumentCard
                document={mockDocumentImage}
                isSelected={selectedDocId === mockDocumentImage.id}
                onClick={handleDocumentClick}
                onView={handleViewDocument}
                onDelete={handleDeleteDocument}
              />
              <DocumentCard
                document={mockDocumentNeedsReview}
                isSelected={selectedDocId === mockDocumentNeedsReview.id}
                onClick={handleDocumentClick}
                onView={handleViewDocument}
                onDelete={handleDeleteDocument}
              />
            </div>
          </div>

          {/* Low Confidence */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Low Confidence Documents
            </h2>
            <DocumentCard
              document={mockDocumentLowConfidence}
              isSelected={selectedDocId === mockDocumentLowConfidence.id}
              onClick={handleDocumentClick}
              onView={handleViewDocument}
              onDelete={handleDeleteDocument}
            />
          </div>

          {/* Processing State */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Processing State (Animated)
            </h2>
            <DocumentCard
              document={mockDocumentProcessing}
              isSelected={selectedDocId === mockDocumentProcessing.id}
              onClick={handleDocumentClick}
              onView={handleViewDocument}
              onDelete={handleDeleteDocument}
            />
          </div>

          {/* Uploaded State */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Uploaded State (Pending Processing)
            </h2>
            <DocumentCard
              document={mockDocumentUploaded}
              isSelected={selectedDocId === mockDocumentUploaded.id}
              onClick={handleDocumentClick}
              onView={handleViewDocument}
              onDelete={handleDeleteDocument}
            />
          </div>

          {/* Failed State */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Failed State (With Reprocess Button)
            </h2>
            <DocumentCard
              document={mockDocumentFailed}
              isSelected={selectedDocId === mockDocumentFailed.id}
              onClick={handleDocumentClick}
              onView={handleViewDocument}
              onDelete={handleDeleteDocument}
              onReprocess={handleReprocessDocument}
              isReprocessing={reprocessingDocIds.has(mockDocumentFailed.id)}
            />
          </div>

          {/* Without Click Handler */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Without Click Handler (Non-clickable)
            </h2>
            <DocumentCard
              document={mockDocumentPDF}
              onView={handleViewDocument}
              onDelete={handleDeleteDocument}
            />
          </div>

          {/* Staggered Animation */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Staggered Animation (Multiple Cards)
            </h2>
            <div className="space-y-3">
              {[mockDocumentPDF, mockDocumentImage, mockDocumentLowConfidence].map((doc, index) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  animationDelay={index * 0.1}
                  onView={handleViewDocument}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature Summary */}
        <Card className="mt-8 glass-card">
          <CardHeader>
            <CardTitle>Features Demonstrated</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Glassmorphism card design with backdrop blur
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Document type icons (PDF, Image, Generic)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Status badges with icons (Uploaded, Processing, Processed, etc.)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Document type detection with confidence percentage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Confidence-based color coding (green/yellow/red)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                File metadata display (size, pages, date)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Hover effects with action buttons
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Selection state with ring highlight
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Animated processing indicator
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Reprocess button with spinning animation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Bottom accent line on hover
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Dark mode support
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Framer Motion animations
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
