import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline'
import DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'
import { useCaseStore } from '../stores/caseStore'
import { useDocumentStatusSubscription } from '../hooks/useDocumentStatusSubscription'
import { supabase } from '../lib/supabase'
import type { Document, DocumentStatus, DocumentType } from '../types'

// Status badge styling
const statusConfig: Record<DocumentStatus, { label: string; className: string; icon: typeof CheckCircleIcon }> = {
  uploaded: {
    label: 'Uploaded',
    className: 'badge-info',
    icon: ClockIcon,
  },
  processing: {
    label: 'Processing',
    className: 'badge-warning',
    icon: ArrowPathIcon,
  },
  processed: {
    label: 'Processed',
    className: 'badge-success',
    icon: CheckCircleIcon,
  },
  needs_review: {
    label: 'Needs Review',
    className: 'badge-warning',
    icon: ExclamationCircleIcon,
  },
  approved: {
    label: 'Approved',
    className: 'badge-success',
    icon: CheckCircleIcon,
  },
  failed: {
    label: 'Failed',
    className: 'badge-error',
    icon: ExclamationCircleIcon,
  },
}

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

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format confidence percentage
const formatConfidence = (confidence: number | null): string => {
  if (confidence === null || confidence === undefined) return ''
  return `${Math.round(confidence * 100)}%`
}

// Get confidence badge color based on confidence level
const getConfidenceColor = (confidence: number | null): string => {
  if (confidence === null || confidence === undefined) return 'text-gray-500'
  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
  if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

// Get document type badge styling
const getDocTypeBadgeClass = (confidence: number | null): string => {
  if (confidence === null || confidence === undefined) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

export default function UploadPage() {
  const { caseId } = useParams()
  const { documents, addDocument, updateDocument, removeDocument } = useCaseStore()
  const [uploadedDocs, setUploadedDocs] = useState<Document[]>(documents)
  const [isLoading, setIsLoading] = useState(true)

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

  // Remove document from database and storage
  const handleRemoveDocument = useCallback(async (docId: string) => {
    const doc = uploadedDocs.find((d) => d.id === docId)
    if (!doc) return

    try {
      // Delete from storage first
      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path])
      }

      // Delete from database
      const { error } = await supabase.from('documents').delete().eq('id', docId)

      if (error) {
        console.error('Error deleting document:', error)
        return
      }

      // Update local state
      setUploadedDocs((prev) => prev.filter((d) => d.id !== docId))
      removeDocument(docId)
    } catch (error) {
      console.error('Error removing document:', error)
    }
  }, [uploadedDocs, removeDocument])

  // Get document icon based on mime type
  const getDocumentIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <DocumentIcon className="w-5 h-5 text-red-500" />
        </div>
      )
    }
    if (mimeType.startsWith('image/')) {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <DocumentIcon className="w-5 h-5 text-blue-500" />
        </div>
      )
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <DocumentIcon className="w-5 h-5 text-gray-500" />
      </div>
    )
  }

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
          <Link
            to={`/case/${caseId}/entities`}
            className="btn-primary"
          >
            Continuar para Entidades
          </Link>
        )}
      </div>

      {/* Upload Area */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Enviar Documentos
        </h2>
        <DocumentDropzone
          caseId={caseId || ''}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Uploaded Documents List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Documentos Enviados
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {uploadedDocs.length} documento{uploadedDocs.length !== 1 ? 's' : ''} neste caso
          </p>
        </div>

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
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {uploadedDocs.map((doc, index) => {
                const statusInfo = statusConfig[doc.status]
                const StatusIcon = statusInfo.icon

                return (
                  <motion.li
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Document Icon */}
                      {getDocumentIcon(doc.mime_type)}

                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.original_name}
                          </p>
                          <span className={`badge ${statusInfo.className}`}>
                            <StatusIcon
                              className={`w-3 h-3 mr-1 ${
                                doc.status === 'processing' ? 'animate-spin' : ''
                              }`}
                            />
                            {statusInfo.label}
                          </span>
                          {/* Document Type Badge with Confidence */}
                          {doc.doc_type && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getDocTypeBadgeClass(doc.doc_type_confidence)}`}>
                              {documentTypeLabels[doc.doc_type]}
                              {doc.doc_type_confidence !== null && (
                                <span className={`font-semibold ${getConfidenceColor(doc.doc_type_confidence)}`}>
                                  ({formatConfidence(doc.doc_type_confidence)})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(doc.file_size)}
                          </span>
                          {doc.page_count && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.page_count} pagina{doc.page_count !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Ver documento"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remover documento"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </AnimatePresence>
      </div>

      {/* Help Section - Document Types */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Tipos de Documento Suportados (Deteccao Automatica)
        </h3>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
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
      </div>
    </div>
  )
}
