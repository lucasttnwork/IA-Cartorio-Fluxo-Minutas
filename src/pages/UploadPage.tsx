import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowPathIcon,
  FolderOpenIcon,
  FunnelIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'
import { DocumentCard, DocumentPreviewModal, BatchOperationsToolbar, BatchDeleteConfirmationModal } from '../components/documents'
import { useCaseStore } from '../stores/caseStore'
import { useDocumentStatusSubscription } from '../hooks/useDocumentStatusSubscription'
import { useImageThumbnails } from '../hooks/useImagePreview'
import { useDocumentPreviewModal } from '../hooks/useDocumentPreview'
import { useBatchSelection } from '../hooks/useBatchSelection'
import { supabase } from '../lib/supabase'
import { deleteDocument, deleteDocuments, reprocessDocument } from '../services/documentService'
import type { Document, DocumentType } from '../types'

// Document type labels for help section
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

export default function UploadPage() {
  const { caseId } = useParams()
  const { documents, addDocument, updateDocument, removeDocument } = useCaseStore()
  const [uploadedDocs, setUploadedDocs] = useState<Document[]>(documents)
  const [isLoading, setIsLoading] = useState(true)

  // Reprocessing state - track which documents are being reprocessed
  const [reprocessingDocIds, setReprocessingDocIds] = useState<Set<string>>(new Set())

  // Document type filter state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all')

  // Filter documents by selected type
  const filteredDocs = useMemo(() => {
    if (selectedDocType === 'all') {
      return uploadedDocs
    }
    return uploadedDocs.filter((doc) => doc.doc_type === selectedDocType)
  }, [uploadedDocs, selectedDocType])

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

  // Load image thumbnails for document cards
  const { thumbnails } = useImageThumbnails(uploadedDocs)

  // Document preview modal state (supports all document types)
  const {
    previewDocument,
    isPreviewOpen,
    documentUrl: previewDocumentUrl,
    isLoading: isPreviewLoading,
    error: previewError,
    openPreview,
    closePreview,
    retryLoad: retryPreviewLoad,
  } = useDocumentPreviewModal()

  // Load existing documents from database on mount
  useEffect(() => {
    async function loadDocuments() {
      if (!caseId) return

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading documents:', error)
          return
        }

        if (data) {
          setUploadedDocs(data as Document[])
        }
      } catch (error) {
        console.error('Error loading documents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [caseId])

  // Subscribe to real-time document status updates
  useDocumentStatusSubscription({
    caseId: caseId || '',
    enabled: !!caseId,
    onDocumentInsert: (document) => {
      console.log('[UploadPage] Document inserted:', document.original_name)
      setUploadedDocs((prev) => {
        // Avoid duplicates
        if (prev.some((d) => d.id === document.id)) {
          return prev
        }
        return [document, ...prev]
      })
      addDocument(document)
    },
    onDocumentUpdate: (update) => {
      console.log('[UploadPage] Document updated:', update.documentId, update.newStatus)
      setUploadedDocs((prev) =>
        prev.map((doc) =>
          doc.id === update.documentId
            ? { ...doc, ...update.document, status: update.newStatus }
            : doc
        )
      )
      updateDocument(update.documentId, update.document as Partial<Document>)
    },
    onDocumentDelete: (documentId) => {
      console.log('[UploadPage] Document deleted:', documentId)
      setUploadedDocs((prev) => prev.filter((d) => d.id !== documentId))
      removeDocument(documentId)
    },
    onStatusChange: (update) => {
      console.log('[UploadPage] Status changed:', update.documentId, update.previousStatus, '->', update.newStatus)
    },
  })

  // Handle upload completion - document is already in the database, just refresh if needed
  const handleUploadComplete = useCallback((results: UploadResult[]) => {
    const successfulUploads = results.filter((r) => r.success)
    console.log(`[UploadPage] Upload complete: ${successfulUploads.length}/${results.length} files successful`)

    // The real-time subscription will add new documents to the list
    // But we can also manually fetch the document for immediate feedback
    successfulUploads.forEach(async (result) => {
      if (result.document_id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from('documents')
            .select('*')
            .eq('id', result.document_id)
            .single() as { data: Document | null }

          if (data) {
            setUploadedDocs((prev) => {
              if (prev.some((d) => d.id === data.id)) {
                return prev
              }
              return [data as Document, ...prev]
            })
            addDocument(data as Document)
          }
        } catch (error) {
          console.error('Error fetching uploaded document:', error)
        }
      }
    })
  }, [addDocument])

  // Remove document from database, storage, and all associated data
  // Uses the documentService which handles cascade deletion of:
  // - Storage file
  // - Extractions, evidence, processing_jobs (via DB cascade)
  // - References in people.source_docs and properties.source_docs arrays
  const handleRemoveDocument = useCallback(async (docId: string) => {
    const doc = uploadedDocs.find((d) => d.id === docId)
    if (!doc) return

    try {
      const result = await deleteDocument(docId, doc.storage_path)

      if (!result.success) {
        console.error('Error deleting document:', result.error)
        return
      }

      console.log('[UploadPage] Document deleted with associated data:', {
        documentId: docId,
        cleanedPeopleCount: result.cleanedPeopleCount,
        cleanedPropertiesCount: result.cleanedPropertiesCount,
      })

      // Update local state
      setUploadedDocs((prev) => prev.filter((d) => d.id !== docId))
      removeDocument(docId)
    } catch (error) {
      console.error('Error removing document:', error)
    }
  }, [uploadedDocs, removeDocument])

  // Handle view document - opens preview modal for all document types
  const handleViewDocument = useCallback((document: Document) => {
    openPreview(document)
  }, [openPreview])

  // Handle reprocessing a document
  const handleReprocessDocument = useCallback(async (docId: string) => {
    // Add to reprocessing set
    setReprocessingDocIds((prev) => new Set(prev).add(docId))

    try {
      const result = await reprocessDocument(docId)

      if (!result.success) {
        console.error('Error reprocessing document:', result.error)
        // Remove from reprocessing set on error
        setReprocessingDocIds((prev) => {
          const next = new Set(prev)
          next.delete(docId)
          return next
        })
        return
      }

      console.log('[UploadPage] Document queued for reprocessing:', {
        documentId: docId,
        jobId: result.jobId,
      })

      // The real-time subscription will update the document status
      // Remove from reprocessing set after a short delay (UI feedback)
      setTimeout(() => {
        setReprocessingDocIds((prev) => {
          const next = new Set(prev)
          next.delete(docId)
          return next
        })
      }, 1000)
    } catch (error) {
      console.error('Error reprocessing document:', error)
      // Remove from reprocessing set on error
      setReprocessingDocIds((prev) => {
        const next = new Set(prev)
        next.delete(docId)
        return next
      })
    }
  }, [])

  // Toggle selection mode
  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev)
    if (selectionMode) {
      // Exiting selection mode, clear selection
      clearSelection()
    }
  }, [selectionMode, clearSelection])

  // Handle batch delete - open confirmation modal
  const handleOpenBatchDeleteModal = useCallback(() => {
    setBatchDeleteResults({})
    setIsBatchDeleteModalOpen(true)
  }, [])

  // Handle batch delete confirmation
  const handleConfirmBatchDelete = useCallback(async () => {
    if (selectedDocuments.length === 0) return

    setIsBatchDeleting(true)
    setBatchDeleteResults({})

    try {
      const documentIds = selectedDocuments.map((doc) => doc.id)
      const result = await deleteDocuments(documentIds)

      setBatchDeleteResults({
        successCount: result.successCount,
        failureCount: result.failureCount,
      })

      // Update local state for successfully deleted documents
      result.results.forEach((deleteResult) => {
        if (deleteResult.success && deleteResult.deletedDocumentId) {
          setUploadedDocs((prev) => prev.filter((d) => d.id !== deleteResult.deletedDocumentId))
          removeDocument(deleteResult.deletedDocumentId)
        }
      })

      console.log('[UploadPage] Batch delete complete:', {
        successCount: result.successCount,
        failureCount: result.failureCount,
      })

      // Clear selection after successful deletion
      if (result.successCount > 0) {
        clearSelection()
      }

      // Close modal after a delay to show results
      setTimeout(() => {
        setIsBatchDeleteModalOpen(false)
        setBatchDeleteResults({})
        // Exit selection mode if all documents were deleted
        if (result.failureCount === 0) {
          setSelectionMode(false)
        }
      }, 1500)
    } catch (error) {
      console.error('Error during batch delete:', error)
      setBatchDeleteResults({
        failureCount: selectedDocuments.length,
      })
    } finally {
      setIsBatchDeleting(false)
    }
  }, [selectedDocuments, clearSelection, removeDocument])

  // Handle closing batch delete modal
  const handleCloseBatchDeleteModal = useCallback(() => {
    if (!isBatchDeleting) {
      setIsBatchDeleteModalOpen(false)
      setBatchDeleteResults({})
    }
  }, [isBatchDeleting])

  // Handle batch export (placeholder for future implementation)
  const handleBatchExport = useCallback(() => {
    // TODO: Implement batch export functionality
    console.log('[UploadPage] Batch export requested for:', Array.from(selectedIds))
    alert(`Exportar ${selectedCount} documentos (funcionalidade em desenvolvimento)`)
  }, [selectedIds, selectedCount])

  // Handle batch reprocess
  const handleBatchReprocess = useCallback(async () => {
    if (selectedDocuments.length === 0) return

    // Add all to reprocessing set
    selectedDocuments.forEach((doc) => {
      setReprocessingDocIds((prev) => new Set(prev).add(doc.id))
    })

    // Process each document
    for (const doc of selectedDocuments) {
      try {
        await reprocessDocument(doc.id)
      } catch (error) {
        console.error(`Error reprocessing document ${doc.id}:`, error)
      }
    }

    // Clear reprocessing state after delay
    setTimeout(() => {
      selectedDocuments.forEach((doc) => {
        setReprocessingDocIds((prev) => {
          const next = new Set(prev)
          next.delete(doc.id)
          return next
        })
      })
    }, 1000)

    // Clear selection
    clearSelection()
    setSelectionMode(false)
  }, [selectedDocuments, clearSelection])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Upload de Documentos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Faca upload dos documentos para analise. Arraste e solte multiplos arquivos de uma vez.
          </p>
        </div>
        {uploadedDocs.length > 0 && (
          <Button asChild>
            <Link to={`/case/${caseId}/entities`}>
              Continuar para Entidades
            </Link>
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Enviar Documentos
          </h2>
          <DocumentDropzone
            caseId={caseId || ''}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Documentos Enviados</CardTitle>
              <CardDescription>
                {selectedDocType === 'all'
                  ? `${uploadedDocs.length} documento${uploadedDocs.length !== 1 ? 's' : ''} neste caso`
                  : `${filteredDocs.length} de ${uploadedDocs.length} documento${uploadedDocs.length !== 1 ? 's' : ''} (filtrado por ${documentTypeLabels[selectedDocType]})`
                }
              </CardDescription>
            </div>

            {/* Actions: Filter and Selection Mode Toggle */}
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
                  <span className="hidden sm:inline">
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
                  <SelectTrigger className="w-[180px]" aria-label="Filtrar por tipo de documento">
                    <SelectValue placeholder="Filtrar por tipo" />
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
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <ArrowPathIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Carregando documentos...
              </h3>
            </motion.div>
          ) : uploadedDocs.length === 0 ? (
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
                Nenhum documento enviado ainda
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Comece arrastando e soltando documentos na area de upload acima, ou clique para selecionar arquivos.
              </p>
            </motion.div>
          ) : filteredDocs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <FunnelIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Nenhum documento encontrado
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Nenhum documento do tipo "{documentTypeLabels[selectedDocType as DocumentType]}" foi encontrado.
                <button
                  onClick={() => setSelectedDocType('all')}
                  className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Limpar filtro
                </button>
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
                  onDelete={selectionMode ? undefined : handleRemoveDocument}
                  onReprocess={selectionMode ? undefined : handleReprocessDocument}
                  isReprocessing={reprocessingDocIds.has(doc.id)}
                  thumbnailUrl={thumbnails.get(doc.id)}
                  selectionMode={selectionMode}
                  isSelected={isSelected(doc.id)}
                  onSelectionToggle={toggleSelection}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </Card>

      {/* Help Section - Document Types */}
      <Card className="glass-card border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
            Tipos de Documento Suportados (Deteccao Automatica)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(documentTypeLabels).map(([type, label]) => (
              <div
                key={type}
                className="text-xs text-blue-700 dark:text-blue-300"
              >
                - {label}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
            Os arquivos sao processados automaticamente usando OCR e IA para identificar o tipo de documento e extrair informacoes relevantes. A porcentagem indica o nivel de confianca da deteccao.
          </p>
        </CardContent>
      </Card>

      {/* Document Preview Modal - supports images, PDFs, and other document types */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        document={previewDocument}
        documentUrl={previewDocumentUrl}
        isLoading={isPreviewLoading}
        error={previewError}
        onRetry={retryPreviewLoad}
      />

      {/* Batch Operations Toolbar - floating bar at bottom of screen */}
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
  )
}
