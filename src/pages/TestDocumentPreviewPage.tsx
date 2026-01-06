/**
 * Test page for DocumentPreviewModal component
 *
 * Demonstrates the document preview functionality for different document types:
 * - Images (with zoom/pan controls)
 * - PDFs (with embedded viewer)
 * - Unsupported files (with download fallback)
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { DocumentCard, DocumentPreviewModal } from '../components/documents'
import { EyeIcon } from '@heroicons/react/24/outline'
import type { Document } from '../types'

// Mock document data for testing different file types
const mockDocuments: Document[] = [
  {
    id: 'doc-image-1',
    case_id: 'case-1',
    original_name: 'foto_rg_frente.jpg',
    storage_path: 'cases/case-1/foto_rg_frente.jpg',
    mime_type: 'image/jpeg',
    file_size: 524288,
    page_count: 1,
    status: 'processed',
    doc_type: 'rg',
    doc_type_confidence: 0.92,
    metadata: {},
    created_at: '2024-01-17T09:15:00Z',
    updated_at: '2024-01-17T09:20:00Z',
  },
  {
    id: 'doc-image-2',
    case_id: 'case-1',
    original_name: 'documento_digitalizado.png',
    storage_path: 'cases/case-1/documento_digitalizado.png',
    mime_type: 'image/png',
    file_size: 1048576,
    page_count: 1,
    status: 'processed',
    doc_type: 'other',
    doc_type_confidence: 0.65,
    metadata: {},
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:05:00Z',
  },
  {
    id: 'doc-pdf-1',
    case_id: 'case-1',
    original_name: 'certidao_casamento.pdf',
    storage_path: 'cases/case-1/certidao_casamento.pdf',
    mime_type: 'application/pdf',
    file_size: 2458624,
    page_count: 3,
    status: 'processed',
    doc_type: 'marriage_cert',
    doc_type_confidence: 0.95,
    metadata: {},
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:35:00Z',
  },
  {
    id: 'doc-pdf-2',
    case_id: 'case-1',
    original_name: 'escritura_imovel.pdf',
    storage_path: 'cases/case-1/escritura_imovel.pdf',
    mime_type: 'application/pdf',
    file_size: 5242880,
    page_count: 12,
    status: 'processed',
    doc_type: 'deed',
    doc_type_confidence: 0.88,
    metadata: {},
    created_at: '2024-01-16T14:20:00Z',
    updated_at: '2024-01-16T14:25:00Z',
  },
  {
    id: 'doc-text-1',
    case_id: 'case-1',
    original_name: 'notas.txt',
    storage_path: 'cases/case-1/notas.txt',
    mime_type: 'text/plain',
    file_size: 4096,
    page_count: null,
    status: 'uploaded',
    doc_type: null,
    doc_type_confidence: null,
    metadata: {},
    created_at: '2024-01-19T08:00:00Z',
    updated_at: '2024-01-19T08:00:00Z',
  },
  {
    id: 'doc-word-1',
    case_id: 'case-1',
    original_name: 'contrato.docx',
    storage_path: 'cases/case-1/contrato.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    file_size: 102400,
    page_count: 5,
    status: 'processed',
    doc_type: 'other',
    doc_type_confidence: 0.45,
    metadata: {},
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-01-20T11:05:00Z',
  },
]

// Sample image URL for testing (placeholder)
const SAMPLE_IMAGE_URL = 'https://images.unsplash.com/photo-1568057373614-53834f3f52c5?w=800&h=600&fit=crop'
const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

export default function TestDocumentPreviewPage() {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')

  // Get mock URL based on document type
  const getMockUrl = (doc: Document | null): string | null => {
    if (!doc) return null
    if (doc.mime_type.startsWith('image/')) return SAMPLE_IMAGE_URL
    if (doc.mime_type === 'application/pdf') return SAMPLE_PDF_URL
    return null
  }

  const handleOpenPreview = (doc: Document) => {
    setPreviewDocument(doc)
    setIsPreviewOpen(true)
    setLastAction(`Opening preview for: ${doc.original_name}`)
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setTimeout(() => setPreviewDocument(null), 300)
    setLastAction('Preview closed')
  }

  const handleDownload = (doc: Document) => {
    setLastAction(`Download requested for: ${doc.original_name}`)
    console.log('Download document:', doc)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test: Document Preview Modal
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This page demonstrates the DocumentPreviewModal component with different document types.
            Click the eye icon or "Preview" button to open the preview modal.
          </p>
          {lastAction && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              Last action: <strong>{lastAction}</strong>
            </div>
          )}
        </div>

        {/* Quick Preview Buttons */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Quick Preview Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {mockDocuments.map((doc) => (
                <Button
                  key={doc.id}
                  variant="outline"
                  onClick={() => handleOpenPreview(doc)}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="w-4 h-4" />
                  {doc.mime_type.split('/')[0].toUpperCase()}: {doc.original_name.split('.').pop()?.toUpperCase()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Cards with Preview */}
        <div className="space-y-6">
          {/* Image Documents */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Image Documents (Pan/Zoom Enabled)
            </h2>
            <div className="space-y-3">
              {mockDocuments
                .filter((doc) => doc.mime_type.startsWith('image/'))
                .map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onView={handleOpenPreview}
                  />
                ))}
            </div>
          </div>

          {/* PDF Documents */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              PDF Documents (Embedded Viewer)
            </h2>
            <div className="space-y-3">
              {mockDocuments
                .filter((doc) => doc.mime_type === 'application/pdf')
                .map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onView={handleOpenPreview}
                  />
                ))}
            </div>
          </div>

          {/* Other Documents */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Other Documents (Download Fallback)
            </h2>
            <div className="space-y-3">
              {mockDocuments
                .filter((doc) => !doc.mime_type.startsWith('image/') && doc.mime_type !== 'application/pdf')
                .map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onView={handleOpenPreview}
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
                Image preview with zoom in/out, fit to screen, and reset
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Image pan/drag functionality for zoomed images
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Mouse wheel zoom centered on cursor position
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                PDF embedded viewer with toolbar
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Fallback view for unsupported file types with download option
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Document metadata display (size, pages, dimensions)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Keyboard shortcuts (Escape, +/-, 0, arrow keys)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Touch support for mobile devices
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Loading and error states with retry functionality
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Download button for all file types
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Dark mode support
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        document={previewDocument}
        documentUrl={getMockUrl(previewDocument)}
        onDownload={handleDownload}
      />
    </div>
  )
}
