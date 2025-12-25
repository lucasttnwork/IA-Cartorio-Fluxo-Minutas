/**
 * PurchaseSaleFlowPage
 *
 * Main wizard page for the purchase/sale transaction flow.
 * Guides users through the complete workflow:
 * 1. Case Creation - Define case title and act type
 * 2. Document Upload - Upload required documents
 * 3. Entity Extraction - Extract and review entities from documents
 * 4. Canvas Review - Review relationships between entities
 * 5. Draft Generation - Generate and review the final draft
 */

import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  HomeIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FlowStepper, FlowStepCard } from '@/components/flow'
import { usePurchaseSaleFlow } from '@/hooks/usePurchaseSaleFlow'
import { useFlowStore, type FlowStep } from '@/stores/flowStore'
import type { ActType } from '@/types'
import { cn } from '@/lib/utils'
import DocumentDropzone from '@/components/upload/DocumentDropzone'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ACT_TYPE_OPTIONS: { value: ActType; label: string; description: string }[] = [
  {
    value: 'purchase_sale',
    label: 'Compra e Venda',
    description: 'Transacao de compra e venda de imovel',
  },
  {
    value: 'donation',
    label: 'Doacao',
    description: 'Doacao de imovel entre partes',
  },
  {
    value: 'exchange',
    label: 'Permuta',
    description: 'Troca de imoveis entre partes',
  },
  {
    value: 'lease',
    label: 'Locacao',
    description: 'Contrato de aluguel de imovel',
  },
]

// -----------------------------------------------------------------------------
// Step Content Components
// -----------------------------------------------------------------------------

interface CaseCreationStepProps {
  title: string
  actType: ActType
  onTitleChange: (title: string) => void
  onActTypeChange: (actType: ActType) => void
  onCreateCase: () => Promise<string | null>
  isLoading: boolean
  caseId?: string
}

function CaseCreationStep({
  title,
  actType,
  onTitleChange,
  onActTypeChange,
  onCreateCase,
  isLoading,
  caseId,
}: CaseCreationStepProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseId) {
      await onCreateCase()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Case Title */}
      <div className="space-y-2">
        <Label htmlFor="case-title">Titulo do Caso *</Label>
        <Input
          id="case-title"
          type="text"
          placeholder="Ex: Venda do Apartamento 101 - Ed. Central"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={isLoading || !!caseId}
          className="text-base"
          minLength={3}
          required
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Escolha um titulo descritivo para identificar este caso
        </p>
      </div>

      {/* Act Type */}
      <div className="space-y-2">
        <Label htmlFor="act-type">Tipo de Ato *</Label>
        <Select
          value={actType}
          onValueChange={(value) => onActTypeChange(value as ActType)}
          disabled={isLoading || !!caseId}
        >
          <SelectTrigger id="act-type" className="text-base">
            <SelectValue placeholder="Selecione o tipo de ato" />
          </SelectTrigger>
          <SelectContent>
            {ACT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          O tipo de ato define o modelo de minuta a ser gerado
        </p>
      </div>

      {/* Case Created Success */}
      {caseId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Caso criado com sucesso!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ID: {caseId}
            </p>
          </div>
        </motion.div>
      )}

      {/* Create Button */}
      {!caseId && (
        <Button
          type="submit"
          disabled={isLoading || !title || title.length < 3}
          className="w-full"
        >
          {isLoading ? 'Criando Caso...' : 'Criar Caso'}
        </Button>
      )}
    </form>
  )
}

interface DocumentUploadStepProps {
  documents: import('@/types').Document[]
  onUploadComplete?: (results: import('@/components/upload/DocumentDropzone').UploadResult[]) => void
  caseId?: string
}

function DocumentUploadStep({
  documents,
  onUploadComplete,
  caseId,
}: DocumentUploadStepProps) {
  if (!caseId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum caso selecionado. Por favor, crie um caso primeiro.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Document Upload Component */}
      <DocumentDropzone
        caseId={caseId}
        onUploadComplete={onUploadComplete}
      />

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Documentos Carregados ({documents.length})
          </h4>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {doc.original_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    doc.status === 'processed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : doc.status === 'processing'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : doc.status === 'failed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  {doc.status === 'processed'
                    ? 'Processado'
                    : doc.status === 'processing'
                      ? 'Processando'
                      : doc.status === 'failed'
                        ? 'Falhou'
                        : 'Carregado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info about document requirements */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Documentos recomendados para Compra e Venda:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
          <li>RG e CPF dos vendedores e compradores</li>
          <li>Certidao de casamento (se aplicavel)</li>
          <li>Matricula atualizada do imovel</li>
          <li>IPTU do imovel</li>
          <li>Procuracao (se houver representante)</li>
        </ul>
      </div>
    </div>
  )
}

interface EntityExtractionStepProps {
  isExtracting: boolean
  extractionProgress: number
  people: import('@/types').Person[]
  properties: import('@/types').Property[]
  onStartExtraction: () => Promise<void>
}

function EntityExtractionStep({
  isExtracting,
  extractionProgress,
  people,
  properties,
  onStartExtraction,
}: EntityExtractionStepProps) {
  const hasEntities = people.length > 0 || properties.length > 0

  return (
    <div className="space-y-6">
      {/* Extraction Status */}
      {isExtracting ? (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
            Extraindo entidades dos documentos...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Progresso: {extractionProgress}%
          </p>
        </div>
      ) : !hasEntities ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Pronto para iniciar a extracao
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            A IA vai analisar os documentos e extrair pessoas, imoveis e
            relacionamentos
          </p>
          <Button onClick={onStartExtraction} className="mt-6">
            Iniciar Extracao
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {people.length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-500">
                  {people.length === 1 ? 'Pessoa' : 'Pessoas'} encontrada(s)
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {properties.length}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-500">
                  {properties.length === 1 ? 'Imovel' : 'Imoveis'} encontrado(s)
                </div>
              </CardContent>
            </Card>
          </div>

          {/* People List */}
          {people.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Pessoas
              </h4>
              <div className="space-y-2">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {person.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {person.cpf || 'CPF nao informado'}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {Math.round(person.confidence * 100)}% confianca
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Properties List */}
          {properties.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Imoveis
              </h4>
              <div className="space-y-2">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {property.registry_number
                          ? `Matricula ${property.registry_number}`
                          : 'Matricula nao identificada'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {property.address?.formatted_address ||
                          property.address?.street ||
                          'Endereco nao informado'}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {Math.round(property.confidence * 100)}% confianca
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CanvasReviewStepProps {
  people: import('@/types').Person[]
  properties: import('@/types').Property[]
  edges: import('@/types').GraphEdge[]
  caseId?: string
}

function CanvasReviewStep({
  people,
  properties,
  edges,
  caseId,
}: CanvasReviewStepProps) {
  const navigate = useNavigate()

  const handleOpenCanvas = () => {
    if (caseId) {
      navigate(`/cases/${caseId}/canvas`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {people.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Pessoas
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {properties.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Imoveis
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {edges.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Relacionamentos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canvas Preview Placeholder */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-gray-50 dark:bg-gray-800/50 min-h-[200px] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Visualizacao do Canvas
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Revise e confirme os relacionamentos entre entidades
          </p>
          <Button
            variant="outline"
            onClick={handleOpenCanvas}
            className="mt-4 gap-2"
          >
            Abrir Canvas Completo
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Relationship Status */}
      {edges.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Status dos Relacionamentos
          </h4>
          <div className="space-y-2">
            {edges.slice(0, 5).map((edge) => (
              <div
                key={edge.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {edge.relationship.replace(/_/g, ' ')}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    edge.confirmed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  )}
                >
                  {edge.confirmed ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            ))}
            {edges.length > 5 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                E mais {edges.length - 5} relacionamentos...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DraftGenerationStepProps {
  isDraftGenerating: boolean
  draft: import('@/types').Draft | null
  onGenerateDraft: () => Promise<void>
  caseId?: string
}

function DraftGenerationStep({
  isDraftGenerating,
  draft,
  onGenerateDraft,
  caseId,
}: DraftGenerationStepProps) {
  const navigate = useNavigate()

  const handleOpenDraft = () => {
    if (caseId) {
      navigate(`/cases/${caseId}/draft`)
    }
  }

  return (
    <div className="space-y-6">
      {isDraftGenerating ? (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
            Gerando minuta do documento...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Isso pode levar alguns segundos
          </p>
        </div>
      ) : !draft ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Pronto para gerar a minuta
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            A minuta sera gerada com base nas entidades e relacionamentos
            confirmados
          </p>
          <Button onClick={onGenerateDraft} className="mt-6">
            Gerar Minuta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Draft Success */}
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                Minuta gerada com sucesso!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Versao {draft.version} - {draft.status}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenDraft}
              className="gap-2"
            >
              Abrir
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Pending Items */}
          {draft.pending_items.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Itens Pendentes ({draft.pending_items.length})
              </h4>
              <div className="space-y-2">
                {draft.pending_items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg',
                      item.severity === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : item.severity === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded font-medium',
                        item.severity === 'error'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                          : item.severity === 'warning'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                      )}
                    >
                      {item.severity === 'error'
                        ? 'Erro'
                        : item.severity === 'warning'
                          ? 'Aviso'
                          : 'Info'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Campo: {item.field_path}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draft Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pre-visualizacao</CardTitle>
              <CardDescription>
                Secoes da minuta gerada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {draft.content.sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {section.type}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Flow Completion Component
// -----------------------------------------------------------------------------

interface FlowCompletionProps {
  caseId?: string
  onNewFlow: () => void
}

function FlowCompletion({ caseId, onNewFlow }: FlowCompletionProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircleIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Fluxo Concluido!
      </h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-8">
        O caso foi processado com sucesso. Voce pode visualizar a minuta gerada
        ou iniciar um novo fluxo.
      </p>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <HomeIcon className="w-4 h-4" />
          Voltar ao Dashboard
        </Button>
        {caseId && (
          <Button
            onClick={() => navigate(`/cases/${caseId}/draft`)}
            className="gap-2"
          >
            Ver Minuta
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Button>
        )}
        <Button variant="outline" onClick={onNewFlow}>
          Novo Fluxo
        </Button>
      </div>
    </motion.div>
  )
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function PurchaseSaleFlowPage() {
  const navigate = useNavigate()
  const flow = usePurchaseSaleFlow()
  const steps = useFlowStore((state) => state.steps)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Start flow if not active
  useEffect(() => {
    if (!flow.isActive) {
      flow.startFlow('purchase_sale')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle step navigation
  const handleStepClick = useCallback(
    (step: FlowStep) => {
      if (flow.canGoToStep(step)) {
        flow.goToStep(step)
      }
    },
    [flow]
  )

  // Handle next step
  const handleNext = useCallback(async () => {
    // Special handling for each step
    switch (flow.currentStep) {
      case 'case_creation':
        if (!flow.caseData?.id) {
          const caseId = await flow.createCase()
          if (caseId) {
            flow.nextStep()
          }
        } else {
          flow.nextStep()
        }
        break
      case 'document_upload':
      case 'entity_extraction':
      case 'canvas_review':
        flow.nextStep()
        break
      case 'draft_generation':
        // Complete the flow
        useFlowStore.getState().completeFlow()
        break
      default:
        flow.nextStep()
    }
  }, [flow])

  // Handle previous step
  const handlePrevious = useCallback(() => {
    flow.previousStep()
  }, [flow])

  // Handle cancel flow
  const handleCancelFlow = useCallback(() => {
    flow.cancelFlow()
    navigate('/dashboard')
  }, [flow, navigate])

  // Handle new flow
  const handleNewFlow = useCallback(() => {
    flow.resetFlow()
    flow.startFlow('purchase_sale')
  }, [flow])

  // Check if flow is completed
  const isFlowCompleted = useFlowStore((state) => !!state.completedAt)

  // Determine next button disabled state
  const isNextDisabled = useCallback(() => {
    switch (flow.currentStep) {
      case 'case_creation':
        return (
          !flow.caseData?.title ||
          flow.caseData.title.length < 3 ||
          flow.isLoading
        )
      case 'document_upload':
        return !flow.hasDocuments
      case 'entity_extraction':
        return flow.isExtracting || !flow.hasEntities
      case 'canvas_review':
        return false // Can always proceed from canvas review
      case 'draft_generation':
        return flow.isDraftGenerating || !flow.hasDraft
      default:
        return true
    }
  }, [flow])

  // Get step-specific labels
  const getNextLabel = useCallback(() => {
    switch (flow.currentStep) {
      case 'case_creation':
        return flow.caseData?.id ? 'Proximo' : 'Criar e Continuar'
      case 'draft_generation':
        return flow.hasDraft ? 'Concluir' : 'Proximo'
      default:
        return 'Proximo'
    }
  }, [flow.currentStep, flow.caseData?.id, flow.hasDraft])

  // Render step content
  const renderStepContent = useCallback(() => {
    switch (flow.currentStep) {
      case 'case_creation':
        return (
          <CaseCreationStep
            title={flow.caseData?.title || ''}
            actType={flow.caseData?.actType || 'purchase_sale'}
            onTitleChange={flow.updateCaseTitle}
            onActTypeChange={flow.updateActType}
            onCreateCase={flow.createCase}
            isLoading={flow.isLoading}
            caseId={flow.caseData?.id}
          />
        )
      case 'document_upload':
        return (
          <DocumentUploadStep
            documents={flow.documents}
            onUploadComplete={(results) => {
              // Mark step as completed when at least one document is uploaded successfully
              const successCount = results.filter(r => r.success).length
              if (successCount > 0) {
                flow.markStepCompleted('document_upload')
              }
            }}
            caseId={flow.caseData?.id}
          />
        )
      case 'entity_extraction':
        return (
          <EntityExtractionStep
            isExtracting={flow.isExtracting}
            extractionProgress={flow.extractionProgress}
            people={flow.people}
            properties={flow.properties}
            onStartExtraction={flow.startExtraction}
          />
        )
      case 'canvas_review':
        return (
          <CanvasReviewStep
            people={flow.people}
            properties={flow.properties}
            edges={flow.edges}
            caseId={flow.caseData?.id}
          />
        )
      case 'draft_generation':
        return (
          <DraftGenerationStep
            isDraftGenerating={flow.isDraftGenerating}
            draft={flow.draft}
            onGenerateDraft={flow.generateDraft}
            caseId={flow.caseData?.id}
          />
        )
      default:
        return null
    }
  }, [flow])

  // Get current step info
  const currentStepInfo = steps.find((s) => s.id === flow.currentStep)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Fluxo de Compra e Venda
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {flow.completedSteps} de {flow.totalSteps} etapas concluidas
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancelar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isFlowCompleted ? (
          <FlowCompletion
            caseId={flow.caseData?.id}
            onNewFlow={handleNewFlow}
          />
        ) : (
          <div className="space-y-8">
            {/* Progress Stepper */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <FlowStepper
                  steps={steps}
                  currentStep={flow.currentStep}
                  onStepClick={handleStepClick}
                  canGoToStep={flow.canGoToStep}
                  progress={flow.progress}
                  showProgress
                />
              </CardContent>
            </Card>

            {/* Current Step Card */}
            <AnimatePresence mode="wait">
              <FlowStepCard
                key={flow.currentStep}
                step={flow.currentStep}
                title={currentStepInfo?.label || ''}
                description={currentStepInfo?.description}
                status={currentStepInfo?.status || 'pending'}
                isActive
                isLoading={flow.isLoading}
                loadingMessage="Processando..."
                error={flow.globalError}
                onRetry={() => flow.clearErrors()}
                onNext={handleNext}
                onPrevious={flow.canGoBack ? handlePrevious : undefined}
                nextDisabled={isNextDisabled()}
                previousDisabled={!flow.canGoBack}
                nextLabel={getNextLabel()}
                showNavigation
              >
                {renderStepContent()}
              </FlowStepCard>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="glass-dialog">
          <DialogHeader>
            <DialogTitle>Cancelar Fluxo?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este fluxo? Todo o progresso sera
              perdido e voce precisara comecar novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continuar Editando
            </Button>
            <Button
              onClick={handleCancelFlow}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Cancelar Fluxo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
