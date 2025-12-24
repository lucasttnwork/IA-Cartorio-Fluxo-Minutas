/**
 * TestPendingItemsPage Component
 *
 * Test page to demonstrate the pending items highlighting feature
 * in the Tiptap editor.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { TiptapEditor } from '../components/editor'
import type { PendingItem } from '../types'

export default function TestPendingItemsPage() {
  const [content, setContent] = useState(`
    <h1>Escritura Pública de Compra e Venda</h1>

    <h2>Partes</h2>
    <p>
      <strong>VENDEDOR:</strong> <span data-pending-id="pending-1" data-pending-reason="CPF não confirmado" data-pending-severity="warning" class="pending-item-highlight">JOÃO DA SILVA</span>,
      brasileiro, casado, engenheiro, portador do CPF
      <span data-pending-id="pending-2" data-pending-reason="CPF não confirmado" data-pending-severity="error" class="pending-item-highlight">000.000.000-00</span>,
      residente e domiciliado na Rua das Flores, 123, São Paulo/SP.
    </p>

    <p>
      <strong>COMPRADOR:</strong> MARIA SANTOS, brasileira, solteira, advogada, portadora do CPF 111.222.333-44,
      residente e domiciliada na
      <span data-pending-id="pending-3" data-pending-reason="Endereço incompleto" data-pending-severity="info" class="pending-item-highlight">Avenida Principal</span>,
      São Paulo/SP.
    </p>

    <h2>Objeto</h2>
    <p>
      Um imóvel localizado na Rua das Palmeiras, 456, bairro Jardins, São Paulo/SP,
      com área de <span data-pending-id="pending-4" data-pending-reason="Área não confirmada" data-pending-severity="warning" class="pending-item-highlight">150m²</span>,
      inscrito na matrícula nº 12345 do 1º Cartório de Registro de Imóveis.
    </p>

    <h2>Preço</h2>
    <p>
      O preço total do imóvel é de
      <span data-pending-id="pending-5" data-pending-reason="Valor a ser confirmado pelas partes" data-pending-severity="error" class="pending-item-highlight">R$ 500.000,00</span>
      (quinhentos mil reais).
    </p>
  `)

  const pendingItems: PendingItem[] = [
    {
      id: 'pending-1',
      section_id: 'parties',
      field_path: 'seller.name',
      reason: 'CPF não confirmado',
      severity: 'warning',
    },
    {
      id: 'pending-2',
      section_id: 'parties',
      field_path: 'seller.cpf',
      reason: 'CPF não confirmado',
      severity: 'error',
    },
    {
      id: 'pending-3',
      section_id: 'parties',
      field_path: 'buyer.address',
      reason: 'Endereço incompleto',
      severity: 'info',
    },
    {
      id: 'pending-4',
      section_id: 'object',
      field_path: 'property.area',
      reason: 'Área não confirmada',
      severity: 'warning',
    },
    {
      id: 'pending-5',
      section_id: 'price',
      field_path: 'deal.price',
      reason: 'Valor a ser confirmado pelas partes',
      severity: 'error',
    },
  ]

  const handleContentChange = (html: string) => {
    setContent(html)
    console.log('Content updated:', html)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teste: Pending Items com Highlight Amarelo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esta página demonstra os itens pendentes destacados em amarelo no editor de minutas.
          </p>
        </div>

        {/* Pending Items Legend */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Legenda de Itens Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="pending-item-highlight inline-block px-2 py-1">
                  Aviso (Amarelo)
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Itens que precisam de revisão
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="pending-item-highlight inline-block px-2 py-1" data-pending-severity="error">
                  Erro (Vermelho)
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Itens críticos faltando
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="pending-item-highlight inline-block px-2 py-1" data-pending-severity="info">
                  Info (Azul)
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Informações complementares
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Items List */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Lista de Itens Pendentes ({pendingItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pendingItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50"
                >
                  <span
                    className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                      ${
                        item.severity === 'error'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : item.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }
                    `}
                  >
                    {item.severity === 'error' ? '!' : item.severity === 'warning' ? '⚠' : 'i'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.field_path}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.reason}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Editor de Minuta</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Comece a escrever a minuta..."
              pendingItems={pendingItems}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <h3 className="text-sm font-semibold mb-2">
              💡 Instruções
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Passe o mouse sobre os textos destacados para ver o efeito hover</li>
              <li>• Os textos sublinhados em ondulado indicam itens pendentes</li>
              <li>• Cores diferentes indicam níveis de severidade (amarelo = aviso, vermelho = erro, azul = info)</li>
              <li>• Você pode editar o texto normalmente no editor</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
