import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { EntityTable } from '../components/entities'
import type { ExtractedEntity } from '../types'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

// Mock entity data for testing
const mockEntities: ExtractedEntity[] = [
  {
    id: 'entity-1',
    document_id: 'doc-1',
    type: 'PERSON',
    value: 'João Silva',
    confidence: 0.95,
    context: 'Nome completo do vendedor',
    normalized_value: 'JOÃO SILVA',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-2',
    document_id: 'doc-1',
    type: 'CPF',
    value: '123.456.789-00',
    confidence: 0.92,
    context: 'CPF do vendedor',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-3',
    document_id: 'doc-2',
    type: 'PERSON',
    value: 'Maria Santos',
    confidence: 0.88,
    context: 'Nome completo do comprador',
    normalized_value: 'MARIA SANTOS',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-4',
    document_id: 'doc-2',
    type: 'CPF',
    value: '987.654.321-00',
    confidence: 0.90,
    context: 'CPF do comprador',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-5',
    document_id: 'doc-3',
    type: 'ADDRESS',
    value: 'Rua das Flores, 123',
    confidence: 0.75,
    context: 'Endereço do imóvel',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-6',
    document_id: 'doc-3',
    type: 'PROPERTY_REGISTRY',
    value: 'MAT-12345',
    confidence: 0.98,
    context: 'Matrícula do imóvel',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-7',
    document_id: 'doc-4',
    type: 'MONEY',
    value: 'R$ 500.000,00',
    confidence: 0.93,
    context: 'Valor da transação',
    normalized_value: '500000.00',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-8',
    document_id: 'doc-4',
    type: 'DATE',
    value: '15/01/2025',
    confidence: 0.91,
    context: 'Data da escritura',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-9',
    document_id: 'doc-5',
    type: 'EMAIL',
    value: 'joao.silva@email.com',
    confidence: 0.87,
    context: 'Email do vendedor',
    created_at: new Date().toISOString(),
  },
  {
    id: 'entity-10',
    document_id: 'doc-5',
    type: 'PHONE',
    value: '(11) 98765-4321',
    confidence: 0.89,
    context: 'Telefone do vendedor',
    created_at: new Date().toISOString(),
  },
]

export default function TestBatchConfirmationPage() {
  const [entities] = useState<ExtractedEntity[]>(mockEntities)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teste: Confirmação em Lote de Entidades
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esta página demonstra a funcionalidade de confirmação em lote de entidades extraídas.
            Selecione múltiplas entidades usando os checkboxes e clique em "Confirmar em Lote".
          </p>
        </div>

        {/* Instructions */}
        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong className="block text-blue-900 dark:text-blue-100 mb-2">Como testar:</strong>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use o checkbox no cabeçalho da tabela para selecionar todas as entidades</li>
              <li>Ou clique nos checkboxes individuais para selecionar entidades específicas</li>
              <li>Quando entidades estiverem selecionadas, aparecerá uma barra de ações no topo</li>
              <li>Clique em "Confirmar em Lote" para abrir o modal de confirmação</li>
              <li>Revise as entidades selecionadas no modal</li>
              <li>Confirme ou cancele a operação</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Entity Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tabela de Entidades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <EntityTable
              entities={entities}
              isLoading={false}
              onEntityClick={(entity) => {
                console.log('Entity clicked:', entity)
              }}
            />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>Total de entidades de teste: {entities.length}</p>
          <p>
            Esta é uma página de demonstração com dados mockados para testar a funcionalidade.
          </p>
        </div>
      </div>
    </div>
  )
}
