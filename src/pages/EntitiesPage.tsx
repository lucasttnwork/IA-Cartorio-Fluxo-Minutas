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
  UserIcon,
  HomeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { EntityTable, CreatePersonModal, CreatePropertyModal } from '../components/entities'
import type { PersonFormData, PropertyFormData } from '../components/entities'
import { supabase } from '../lib/supabase'
import type { ExtractedEntity, Document, EntityExtractionResult, Person, Property, Address } from '../types'

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

  // Modal states
  const [showCreatePersonModal, setShowCreatePersonModal] = useState(false)
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false)
  const [isCreatingEntity, setIsCreatingEntity] = useState(false)

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
        throw new Error(`Falha ao buscar documentos: ${docsError.message}`)
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
        console.error('Erro ao buscar extrações:', extractionsError)
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
      console.error('Erro ao carregar dados:', err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [caseId, selectedDocumentId])

  // Effect that re-executes loadData whenever its dependencies change.
  // loadData depends on both caseId and selectedDocumentId - when either changes,
  // loadData is recreated, which triggers this effect. This is intentional:
  // it ensures entities are refetched and filtered by the newly selected document.
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
        throw new Error(`Falha ao criar job de extração: ${error.message}`)
      }

      // Refresh data after a short delay
      setTimeout(() => {
        loadData()
        setIsExtracting(false)
      }, 2000)
    } catch (err) {
      console.error('Erro ao disparar extração:', err)
      setError(err instanceof Error ? err.message : 'Falha ao disparar extração')
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
      console.error('Erro ao disparar extrações:', err)
      setError(err instanceof Error ? err.message : 'Falha ao disparar extrações')
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

  // Handle person creation
  const handleCreatePerson = async (personData: PersonFormData) => {
    if (!caseId) return

    setIsCreatingEntity(true)
    try {
      // Build address object if any address fields are filled
      const hasAddress = personData.address_street || personData.address_city
      const address: Address | null = hasAddress ? {
        street: personData.address_street || null,
        number: personData.address_number || null,
        complement: personData.address_complement || null,
        neighborhood: personData.address_neighborhood || null,
        city: personData.address_city || null,
        state: personData.address_state || null,
        zip: personData.address_zip || null,
        country: personData.address_country || null,
      } : null

      // Create person record
      const { error } = await supabase
        .from('people')
        .insert({
          case_id: caseId,
          full_name: personData.full_name,
          cpf: personData.cpf || null,
          rg: personData.rg || null,
          rg_issuer: personData.rg_issuer || null,
          birth_date: personData.birth_date || null,
          nationality: personData.nationality || null,
          marital_status: personData.marital_status || null,
          profession: personData.profession || null,
          email: personData.email || null,
          phone: personData.phone || null,
          father_name: personData.father_name || null,
          mother_name: personData.mother_name || null,
          address,
          confidence: 1.0, // Manual entry = full confidence
          source_docs: [],
          metadata: { manual_entry: true },
        })

      if (error) {
        throw new Error(`Falha ao criar pessoa: ${error.message}`)
      }

      // Close modal and refresh
      setShowCreatePersonModal(false)
      loadData()
    } catch (err) {
      console.error('Erro ao criar pessoa:', err)
      setError(err instanceof Error ? err.message : 'Falha ao criar pessoa')
    } finally {
      setIsCreatingEntity(false)
    }
  }

  // Handle property creation
  const handleCreateProperty = async (propertyData: PropertyFormData) => {
    if (!caseId) return

    setIsCreatingEntity(true)
    try {
      // Build address object if any address fields are filled
      const hasAddress = propertyData.address_street || propertyData.address_city
      const address: Address | null = hasAddress ? {
        street: propertyData.address_street || null,
        number: propertyData.address_number || null,
        complement: propertyData.address_complement || null,
        neighborhood: propertyData.address_neighborhood || null,
        city: propertyData.address_city || null,
        state: propertyData.address_state || null,
        zip: propertyData.address_zip || null,
        country: propertyData.address_country || null,
      } : null

      // Create property record
      const { error } = await supabase
        .from('properties')
        .insert({
          case_id: caseId,
          registry_number: propertyData.registry_number || null,
          registry_office: propertyData.registry_office || null,
          area_sqm: propertyData.area_sqm ? parseFloat(propertyData.area_sqm) : null,
          description: propertyData.description || null,
          iptu_number: propertyData.iptu_number || null,
          address,
          confidence: 1.0, // Manual entry = full confidence
          source_docs: [],
          metadata: { manual_entry: true },
        })

      if (error) {
        throw new Error(`Falha ao criar imóvel: ${error.message}`)
      }

      // Close modal and refresh
      setShowCreatePropertyModal(false)
      loadData()
    } catch (err) {
      console.error('Erro ao criar imóvel:', err)
      setError(err instanceof Error ? err.message : 'Falha ao criar imóvel')
    } finally {
      setIsCreatingEntity(false)
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

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={isLoading}
            className="gap-2"
          >
            <ArrowPathIcon className={cn("w-5 h-5", isLoading && "animate-spin")} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowCreatePersonModal(true)}
            className="gap-2"
          >
            <UserIcon className="w-5 h-5" />
            Criar Pessoa
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowCreatePropertyModal(true)}
            className="gap-2"
          >
            <HomeIcon className="w-5 h-5" />
            Criar Imóvel
          </Button>

          {documents.filter((d) => d.status === 'processed').length > 0 && (
            <Button
              onClick={triggerAllExtractions}
              disabled={isExtracting}
              className="gap-2"
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
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 h-6 px-2"
              >
                Fechar
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Document Filter Section */}
      {documents.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filtrar por Documento
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDocumentId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDocumentId(null)}
                className="rounded-full"
              >
                Todos ({entities.length})
              </Button>

              {documents.map((doc) => {
                const statusInfo = getDocumentStatusInfo(doc)
                const StatusIcon = statusInfo.icon
                const docEntities = entities.filter((e) => e.document_id === doc.id)

                return (
                  <Button
                    key={doc.id}
                    variant={selectedDocumentId === doc.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDocumentId(doc.id)}
                    className="gap-2 rounded-full max-w-[220px]"
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span className="truncate">{doc.original_name}</span>
                    {docEntities.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                        {docEntities.length}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Document Filter Skeleton */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex flex-wrap gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-32 rounded-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Entity Table Skeleton */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-4 w-48" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                      <Skeleton className="h-6 flex-1" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : documents.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum documento encontrado
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Faca upload de documentos primeiro para extrair entidades.
          </p>
          <Button asChild className="mt-4">
            <Link to={`/case/${caseId}/upload`} className="inline-flex items-center gap-2">
              Ir para Upload
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-6">
            <EntityTable
              entities={entities}
              isLoading={isLoading}
              onEntityClick={(entity) => {
                console.log('Entity clicked:', entity)
                // Future: Show entity detail modal or highlight in document viewer
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Individual Document Extraction Section */}
      {documents.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Documentos Disponiveis</CardTitle>
            <CardDescription>
              Clique em um documento para extrair entidades individualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
                            <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {statusInfo.label}
                            </span>
                            {doc.doc_type && (
                              <Badge variant="secondary" className="text-xs">
                                {doc.doc_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {docEntities.length > 0 && (
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {docEntities.length} entidades
                          </Badge>
                        )}

                        {doc.status === 'processed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerExtraction(doc.id)}
                            disabled={isExtracting}
                          >
                            {docEntities.length > 0 ? 'Re-extrair' : 'Extrair'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Create Person Modal */}
      <CreatePersonModal
        isOpen={showCreatePersonModal}
        onClose={() => setShowCreatePersonModal(false)}
        onCreate={handleCreatePerson}
        isCreating={isCreatingEntity}
      />

      {/* Create Property Modal */}
      <CreatePropertyModal
        isOpen={showCreatePropertyModal}
        onClose={() => setShowCreatePropertyModal(false)}
        onCreate={handleCreateProperty}
        isCreating={isCreatingEntity}
      />
    </div>
  )
}
