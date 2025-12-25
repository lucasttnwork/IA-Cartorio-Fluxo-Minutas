/**
 * TestDraftSectionNavPage
 *
 * Test page for the DraftSectionNav component with sample content
 */

import { useState } from 'react'
import { TiptapEditor, DraftSectionNav } from '../components/editor'
import { Card } from '@/components/ui/card'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

const SAMPLE_CONTENT = `
<h1>Escritura de Compra e Venda</h1>
<p>Pelo presente instrumento particular de compra e venda...</p>

<h2>Das Partes</h2>
<p>VENDEDOR: João da Silva, brasileiro, casado, empresário...</p>
<p>COMPRADOR: Maria Santos, brasileira, solteira, advogada...</p>

<h2>Do Objeto</h2>
<p>O presente contrato tem por objeto a compra e venda do imóvel...</p>

<h3>Descrição do Imóvel</h3>
<p>Imóvel situado na Rua das Flores, número 123...</p>

<h3>Matrícula</h3>
<p>Matrícula nº 12.345 do 1º Registro de Imóveis...</p>

<h2>Do Preço</h2>
<p>O valor total da transação é de R$ 500.000,00...</p>

<h3>Forma de Pagamento</h3>
<p>O pagamento será realizado em 3 parcelas...</p>

<h2>Das Obrigações</h2>
<p>O vendedor se obriga a entregar o imóvel livre e desembaraçado...</p>

<h2>Das Disposições Finais</h2>
<p>As partes elegem o foro da comarca de São Paulo...</p>
`

export default function TestDraftSectionNavPage() {
  const [content, setContent] = useState(SAMPLE_CONTENT)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 p-8">
      {/* Header */}
      <Card className="glass-card p-6 mb-6 shadow-xl border-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg">
            <DocumentTextIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Draft Section Navigation - Test Page
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Testing the section navigation component with sample draft content
            </p>
          </div>
        </div>
      </Card>

      {/* Two-Panel Layout */}
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Left Panel - Section Navigation */}
        <div className="w-80 flex-shrink-0">
          <DraftSectionNav editorContent={content} className="h-full" />
        </div>

        {/* Right Panel - Editor */}
        <div className="flex-1">
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Comece a escrever a minuta..."
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
