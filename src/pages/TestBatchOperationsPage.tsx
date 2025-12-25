/**
 * Test Page for Batch Operations Feature
 *
 * Demonstrates and tests the batch operations functionality:
 * - Selection mode toggle
 * - Multi-select document cards
 * - Batch operations toolbar
 * - Batch delete confirmation modal
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Squares2X2Icon, FunnelIcon, FolderOpenIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DocumentCard,
  BatchOperationsToolbar,
  BatchDeleteConfirmationModal,
} from '../components/documents'
import { useBatchSelection } from '../hooks/useBatchSelection'
import type { Document, DocumentType, DocumentStatus } from '../types'

// Mock documents for testing
const mockDocuments: Document[] = [
  {
    id: '1',
    case_id: 'test-case',
    storage_path: 'test/doc1.pdf',
    original_name: 'Escritura_Imovel_123.pdf',
    mime_type: 'application/pdf',
    file_size: 2500000,
    page_count: 5,
    status: 'processed' as DocumentStatus,
    doc_type: 'deed' as DocumentType,
    doc_type_confidence: 0.95,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    case_id: 'test-case',
    storage_path: 'test/doc2.pdf',
    original_name: 'CNH_Joao_Silva.pdf',
    mime_type: 'application/pdf',
    file_size: 1200000,
    page_count: 2,
    status: 'processed' as DocumentStatus,
    doc_type: 'cnh' as DocumentType,
    doc_type_confidence: 0.88,
    metadata: {},
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    case_id: 'test-case',
    storage_path: 'test/doc3.pdf',
    original_name: 'RG_Maria_Santos.pdf',
    mime_type: 'application/pdf',
    file_size: 800000,
    page_count: 1,
    status: 'needs_review' as DocumentStatus,
    doc_type: 'rg' as DocumentType,
    doc_type_confidence: 0.72,
    metadata: {},
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    case_id: 'test-case',
    storage_path: 'test/doc4.jpg',
    original_name: 'IPTU_2024.jpg',
    mime_type: 'image/jpeg',
    file_size: 500000,
    page_count: 1,
    status: 'uploaded' as DocumentStatus,
    doc_type: 'iptu' as DocumentType,
    doc_type_confidence: 0.65,
    metadata: {},
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '5',
    case_id: 'test-case',
    storage_path: 'test/doc5.pdf',
    original_name: 'Procuracao_Especial.pdf',
    mime_type: 'application/pdf',
    file_size: 1800000,
    page_count: 3,
    status: 'processing' as DocumentStatus,
    doc_type: 'proxy' as DocumentType,
    doc_type_confidence: 0.91,
    metadata: {},
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
  },
]

// Document type labels
const documentTypeLabels: Record<DocumentType, string> = {
  cnh: 'CNH',
  rg: 'RG',
  marriage_cert: 'Certidao de Casamento',
  deed: 'Escritura',
  proxy: 'Procuracao',
  iptu: 'IPTU',
  birth_cert: 'Certidao de Nascimento',
  other: 'Outro',
}

export default function TestBatchOperationsPage() {
  // Document state
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)

  // Document type filter state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')

  // Filter documents by selected type
  const filteredDocs = useMemo(() => {
    if (selectedDocType === 'all') {
      return documents
    }
    return documents.filter((doc) => doc.doc_type === selectedDocType)
  }, [documents, selectedDocType])

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false)

  // Batch selection hook
  const {
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    clearSelection,
  } = useBatchSelection({
    items: filteredDocs,
    getItemId: (doc) => doc.id,
  })

  // Batch delete modal state
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [batchDeleteResults, setBatchDeleteResults] = useState<{ successCount?: number; failureCount?: number }>({})

  // Get selected documents
  const selectedDocuments = useMemo(
    () => filteredDocs.filter((doc) => selectedIds.has(doc.id)),
    [filteredDocs, selectedIds]
  )

  // Toggle selection mode
  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev)
    if (selectionMode) {
      clearSelection()
    }
  }, [selectionMode, clearSelection])

  // Handle batch delete - open confirmation modal
  const handleOpenBatchDeleteModal = useCallback(() => {
    setBatchDeleteResults({})
    setIsBatchDeleteModalOpen(true)
  }, [])

  // Handle batch delete confirmation (simulated)
  const handleConfirmBatchDelete = useCallback(async () => {
    if (selectedDocuments.length === 0) return

    setIsBatchDeleting(true)
    setBatchDeleteResults({})

    // Simulate deletion with delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const successCount = selectedDocuments.length
    setBatchDeleteResults({ successCount, failureCount: 0 })

    // Remove deleted documents from state
    setDocuments((prev) => prev.filter((doc) => !selectedIds.has(doc.id)))
    clearSelection()

    // Close modal after showing results
    setTimeout(() => {
      setIsBatchDeleteModalOpen(false)
      setBatchDeleteResults({})
      setSelectionMode(false)
    }, 1500)

    setIsBatchDeleting(false)
  }, [selectedDocuments, selectedIds, clearSelection])

  // Handle closing batch delete modal
  const handleCloseBatchDeleteModal = useCallback(() => {
    if (!isBatchDeleting) {
      setIsBatchDeleteModalOpen(false)
      setBatchDeleteResults({})
    }
  }, [isBatchDeleting])

  // Handle batch export (placeholder)
  const handleBatchExport = useCallback(() => {
    alert(`Exportar ${selectedCount} documentos (funcionalidade em desenvolvimento)`)
  }, [selectedCount])

  // Handle batch reprocess (placeholder)
  const handleBatchReprocess = useCallback(() => {
    alert(`Reprocessar ${selectedCount} documentos (funcionalidade em desenvolvimento)`)
  }, [selectedCount])

  // Handle view document
  const handleViewDocument = useCallback((doc: Document) => {
    alert(`Visualizar documento: ${doc.original_name}`)
  }, [])

  // Handle delete document (single)
  const handleDeleteDocument = useCallback((docId: string) => {
    if (confirm('Excluir este documento?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    }
  }, [])

  // Reset demo
  const handleReset = useCallback(() => {
    setDocuments(mockDocuments)
    setSelectionMode(false)
    clearSelection()
  }, [clearSelection])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Teste: Operacoes em Lote
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Demonstracao da funcionalidade de selecao multipla e operacoes em lote para documentos.
            </p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            Resetar Demo
          </Button>
        </div>

        {/* Instructions Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Como testar:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Clique no botao "Selecionar" para entrar no modo de selecao</li>
              <li>Clique nos cards de documentos para seleciona-los</li>
              <li>A barra de operacoes aparece na parte inferior quando ha selecao</li>
              <li>Use os botoes para executar operacoes em lote</li>
              <li>Clique em "Cancelar" ou no X para sair do modo de selecao</li>
            </ol>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  {selectedDocType === 'all'
                    ? `${documents.length} documento${documents.length !== 1 ? 's' : ''}`
                    : `${filteredDocs.length} de ${documents.length} documento${documents.length !== 1 ? 's' : ''}`
                  }
                  {selectionMode && hasSelection && ` (${selectedCount} selecionado${selectedCount !== 1 ? 's' : ''})`}
                </CardDescription>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Selection Mode Toggle */}
                {filteredDocs.length > 0 && (
                  <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleSelectionMode}
                    className="gap-1.5"
                    aria-pressed={selectionMode}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                    <span>
                      {selectionMode ? 'Cancelar' : 'Selecionar'}
                    </span>
                  </Button>
                )}

                {/* Document Type Filter */}
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Select
                    value={selectedDocType}
                    onValueChange={(value) => setSelectedDocType(value as DocumentType | 'all')}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(documentTypeLabels).map(([type, label]) => (
                        <SelectItem key={type} value={type}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence mode="popLayout">
            {filteredDocs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <FolderOpenIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Nenhum documento
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={handleReset}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Resetar demo
                  </button>
                  {' '}para restaurar os documentos.
                </p>
              </motion.div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredDocs.map((doc, index) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    animationDelay={index * 0.05}
                    onView={selectionMode ? undefined : handleViewDocument}
                    onDelete={selectionMode ? undefined : handleDeleteDocument}
                    selectionMode={selectionMode}
                    isSelected={isSelected(doc.id)}
                    onSelectionToggle={toggleSelection}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </Card>

        {/* Batch Operations Toolbar */}
        {selectionMode && (
          <BatchOperationsToolbar
            selectedCount={selectedCount}
            isAllSelected={isAllSelected}
            totalCount={filteredDocs.length}
            onSelectAll={selectAll}
            onClearSelection={() => {
              clearSelection()
              setSelectionMode(false)
            }}
            onBatchDelete={handleOpenBatchDeleteModal}
            onBatchExport={handleBatchExport}
            onBatchReprocess={handleBatchReprocess}
            isDeleting={isBatchDeleting}
          />
        )}

        {/* Batch Delete Confirmation Modal */}
        <BatchDeleteConfirmationModal
          isOpen={isBatchDeleteModalOpen}
          onClose={handleCloseBatchDeleteModal}
          onConfirm={handleConfirmBatchDelete}
          documents={selectedDocuments}
          isDeleting={isBatchDeleting}
          successCount={batchDeleteResults.successCount}
          failureCount={batchDeleteResults.failureCount}
        />
      </div>
    </div>
  )
}
