/**
 * TestPrintDraftPage - Test page for print draft functionality
 *
 * This page tests the printDraft function with sample content
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { printDraft } from '../utils/exportDraft'
import { PrinterIcon } from '@heroicons/react/24/outline'

export default function TestPrintDraftPage() {
  const [content] = useState(`
    <h1>Minuta de Compra e Venda</h1>

    <h2>QUALIFICAÇÃO DAS PARTES</h2>

    <p>De um lado, como <strong>VENDEDOR</strong>, o(a) Senhor(a) <span data-field-path="seller.name" data-field-type="text">JOÃO DA SILVA</span>, brasileiro(a), casado(a), empresário(a), portador(a) do CPF nº <span data-field-path="seller.cpf" data-field-type="cpf">123.456.789-00</span>, residente e domiciliado(a) na <span data-field-path="seller.address" data-field-type="text">Rua das Flores, nº 100, Bairro Centro, São Paulo/SP, CEP 01000-000</span>.</p>

    <p>De outro lado, como <strong>COMPRADOR</strong>, o(a) Senhor(a) <span data-field-path="buyer.name" data-field-type="text">MARIA DOS SANTOS</span>, brasileiro(a), solteiro(a), advogado(a), portador(a) do CPF nº <span data-field-path="buyer.cpf" data-field-type="cpf">987.654.321-00</span>, residente e domiciliado(a) na <span data-field-path="buyer.address" data-field-type="text">Avenida Paulista, nº 1500, Bairro Bela Vista, São Paulo/SP, CEP 01310-100</span>.</p>

    <h2>DO OBJETO</h2>

    <p>O presente instrumento tem por objeto a compra e venda do imóvel localizado na <span data-field-path="property.address" data-field-type="text">Rua dos Ipês, nº 250, Bairro Jardins, São Paulo/SP</span>, com área total de <span data-field-path="property.area" data-field-type="number">150,00 m²</span>, registrado sob matrícula nº <span data-field-path="property.registration" data-field-type="text">12345</span> no Cartório de Registro de Imóveis competente.</p>

    <h2>DO PREÇO E FORMA DE PAGAMENTO</h2>

    <p>O valor total da presente transação é de R$ <span data-field-path="transaction.price" data-field-type="currency">450.000,00</span> (quatrocentos e cinquenta mil reais), que será pago da seguinte forma:</p>

    <ul>
      <li>Sinal de R$ <span data-field-path="transaction.down_payment" data-field-type="currency">45.000,00</span> na assinatura deste instrumento;</li>
      <li>Saldo de R$ <span data-field-path="transaction.balance" data-field-type="currency">405.000,00</span> na data da escritura pública.</li>
    </ul>

    <h2>DAS CONDIÇÕES GERAIS</h2>

    <p>As partes declaram que o imóvel encontra-se livre e desembaraçado de quaisquer ônus, dívidas ou gravames, sendo certo que o VENDEDOR se responsabiliza por quaisquer débitos anteriores à presente transação.</p>

    <p>As partes elegem o foro da Comarca de <span data-field-path="transaction.jurisdiction" data-field-type="text">São Paulo/SP</span> para dirimir quaisquer questões oriundas do presente instrumento.</p>

    <p>E, por estarem assim justos e contratados, assinam o presente instrumento em 02 (duas) vias de igual teor e forma.</p>

    <p style="margin-top: 3em; text-align: center;">
      São Paulo, <span data-field-path="transaction.date" data-field-type="date">15 de dezembro de 2024</span>.
    </p>
  `)

  const handlePrint = () => {
    try {
      printDraft({
        title: 'Minuta de Compra e Venda - Teste',
        content,
        metadata: {
          caseId: 'CASE-2024-001',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Error printing:', error)
      alert('Erro ao imprimir: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <Card className="glass-card p-8 shadow-xl border-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                Test Print Draft
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test page for print draft functionality
              </p>
            </div>
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
              size="lg"
            >
              <PrinterIcon className="h-5 w-5" />
              Print Draft
            </Button>
          </div>
        </Card>

        {/* Preview */}
        <Card className="glass-card p-8 shadow-xl border-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Preview
          </h2>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Card>
      </div>
    </div>
  )
}
