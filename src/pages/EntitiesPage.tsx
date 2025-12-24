import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  DocumentTextIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { EntityTable } from '../components/entities'
import { supabase } from '../lib/supabase'
import type { ExtractedEntity, Document, EntityExtractionResult } from '../types'

interface ExtractionData {
  llm_result?: {
    entity_extraction?: EntityExtractionResult
  }
}

export default function EntitiesPage() {
  const { caseId } = useParams()
  const [entities, setEntities] = useState<ExtractedEntity[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load documents and their extracted entities
  const loadData = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch documents for the case
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })

      if (docsError) {
        throw new Error(`Failed to fetch documents: ${docsError.message}`)
      }

      setDocuments(docsData as Document[])

      // Fetch extractions with entities for all documents
      const docIds = (docsData as Document[])?.map((d) => d.id) || []
      if (docIds.length === 0) {
        setEntities([])
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: extractionsData, error: extractionsError } = await (supabase as any)
        .from('extractions')
        .select('*')
        .in('document_id', docIds)

      if (extractionsError) {
        console.error('Error fetching extractions:', extractionsError)
      }

      // Collect all entities from extractions
      const allEntities: ExtractedEntity[] = []

      if (extractionsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const extraction of extractionsData as any[]) {
          const llmResult = (extraction as ExtractionData).llm_result
          if (llmResult?.entity_extraction?.entities) {
            // Filter by selected document if any
            const extractedEntities = llmResult.entity_extraction.entities as ExtractedEntity[]
            allEntities.push(
              ...extractedEntities.map((e: ExtractedEntity) => ({
                ...e,
                document_id: extraction.document_id as string,
              }))
            )
          }
        }
      }

      // Filter by selected document if any
      if (selectedDocumentId) {
        setEntities(allEntities.filter(e => e.document_id === selectedDocumentId))
      } else {
        setEntities(allEntities)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [caseId, selectedDocumentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Trigger entity extraction for a document
  const triggerExtraction = async (documentId: string) => {
    if (!caseId) return

    setIsExtracting(true)
    try {
      // Create entity_extraction job
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('processing_jobs')
        .insert({
          case_id: caseId,
          document_id: documentId,
          job_type: 'entity_extraction',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        })

      if (error) {
        throw new Error(`Failed to create extraction job: ${error.message}`)
      }

      // Refresh data after a short delay
      setTimeout(() => {
        loadData()
        setIsExtracting(false)
      }, 2000)
    } catch (err) {
      console.error('Error triggering extraction:', err)
      setError(err instanceof Error ? err.message : 'Failed to trigger extraction')
      setIsExtracting(false)
    }
  }

  // Trigger extraction for all documents
  const triggerAllExtractions = async () => {
    if (!caseId || documents.length === 0) return

    setIsExtracting(true)
    try {
      // Create jobs for all documents that don't have extractions yet
      const jobPromises = documents
        .filter((doc) => doc.status === 'processed')
        .map((doc) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('processing_jobs')
            .insert({
              case_id: caseId,
              document_id: doc.id,
              job_type: 'entity_extraction',
              status: 'pending',
              attempts: 0,
              max_attempts: 3,
            })
        )

      await Promise.all(jobPromises)

      // Refresh data after a delay
      setTimeout(() => {
        loadData()
        setIsExtracting(false)
      }, 3000)
    } catch (err) {
      console.error('Error triggering extractions:', err)
      setError(err instanceof Error ? err.message : 'Failed to trigger extractions')
      setIsExtracting(false)
    }
  }

  // Get document status info
  const getDocumentStatusInfo = (doc: Document) => {
    const hasEntities = entities.some((e) => e.document_id === doc.id)
    const entityCount = entities.filter((e) => e.document_id === doc.id).length

    if (hasEntities) {
      return {
        icon: CheckCircleIcon,
        color: 'text-green-500',
        label: `${entityCount} entidades`,
      }
    }

    if (doc.status === 'processing') {
      return {
        icon: ArrowPathIcon,
        color: 'text-blue-500 animate-spin',
        label: 'Processando...',
      }
    }

    if (doc.status === 'processed') {
      return {
        icon: ClockIcon,
        color: 'text-yellow-500',
        label: 'Aguardando extracao',
      }
    }

    return {
      icon: ExclamationTriangleIcon,
      color: 'text-gray-400',
      label: doc.status,
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-purple-500" />
            Entidades Extraidas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualize e gerencie as entidades extraidas dos documentos usando IA.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          {documents.filter((d) => d.status === 'processed').length > 0 && (
            <button
              onClick={triggerAllExtractions}
              disabled={isExtracting}
              className="btn-primary flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Extrair Entidades
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      )}

      {/* Document Filter Section */}
      {documents.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filtrar por Documento
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDocumentId(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDocumentId === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos ({entities.length})
            </button>

            {documents.map((doc) => {
              const statusInfo = getDocumentStatusInfo(doc)
              const StatusIcon = statusInfo.icon
              const docEntities = entities.filter((e) => e.document_id === doc.id)

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedDocumentId === doc.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <StatusIcon className={`w-4 h-4 ${selectedDocumentId === doc.id ? 'text-white' : statusInfo.color}`} />
                  <span className="truncate max-w-[150px]">{doc.original_name}</span>
                  {docEntities.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      selectedDocumentId === doc.id
                        ? 'bg-white/20'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {docEntities.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando entidades...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="card p-8 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum documento encontrado
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Faca upload de documentos primeiro para extrair entidades.
          </p>
          <Link
            to={`/case/${caseId}/upload`}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            Ir para Upload
          </Link>
        </div>
      ) : (
        <div className="card p-6">
          <EntityTable
            entities={entities}
            isLoading={isLoading}
            onEntityClick={(entity) => {
              console.log('Entity clicked:', entity)
              // Future: Show entity detail modal or highlight in document viewer
            }}
          />
        </div>
      )}

      {/* Individual Document Extraction Section */}
      {documents.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Documentos Disponiveis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Clique em um documento para extrair entidades individualmente.
            </p>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => {
              const statusInfo = getDocumentStatusInfo(doc)
              const StatusIcon = statusInfo.icon
              const docEntities = entities.filter((e) => e.document_id === doc.id)

              return (
                <li
                  key={doc.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.original_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {statusInfo.label}
                          </span>
                          {doc.doc_type && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                              {doc.doc_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {docEntities.length > 0 && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                          {docEntities.length} entidades
                        </span>
                      )}

                      {doc.status === 'processed' && (
                        <button
                          onClick={() => triggerExtraction(doc.id)}
                          disabled={isExtracting}
                          className="btn-secondary text-sm py-1.5"
                        >
                          {docEntities.length > 0 ? 'Re-extrair' : 'Extrair'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
