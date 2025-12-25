/**
 * Draft Templates
 *
 * Predefined document templates for different act types
 */

import type { DraftTemplate, ActType } from '../types'

export const draftTemplates: DraftTemplate[] = [
  // Purchase & Sale Template
  {
    id: 'purchase-sale-template',
    name: 'Compra e Venda',
    description: 'Contrato de compra e venda de imóvel com cláusulas padrão',
    actType: 'purchase_sale' as ActType,
    icon: '🏠',
    sections: [
      {
        id: 'header',
        title: 'Cabeçalho',
        type: 'header',
        content: '<h1 style="text-align: center; font-weight: bold; font-size: 1.25rem; margin-bottom: 1rem;">CONTRATO DE COMPRA E VENDA DE IMÓVEL</h1>',
        order: 0,
      },
      {
        id: 'parties',
        title: 'Qualificação das Partes',
        type: 'parties',
        content: '<h3>Qualificação das Partes</h3>\n<p>As partes a seguir qualificadas celebram o presente contrato:</p>\n<p><strong>VENDEDOR:</strong> [Nome completo], [qualificação]</p>\n<p><strong>COMPRADOR:</strong> [Nome completo], [qualificação]</p>',
        order: 1,
      },
      {
        id: 'object',
        title: 'Do Objeto',
        type: 'object',
        content: '<h3>Do Objeto</h3>\n<p>O objeto do presente contrato é o imóvel localizado em [endereço completo], registrado sob matrícula nº [número] no [cartório].</p>',
        order: 2,
      },
      {
        id: 'price',
        title: 'Preço e Forma de Pagamento',
        type: 'price',
        content: '<h3>Preço e Forma de Pagamento</h3>\n<p><strong>Valor Total:</strong> R$ [valor]</p>\n<p><strong>Forma de Pagamento:</strong> [condições de pagamento]</p>',
        order: 3,
      },
      {
        id: 'conditions',
        title: 'Condições Gerais',
        type: 'conditions',
        content: '<h3>Condições Gerais</h3>\n<p>O VENDEDOR declara que o imóvel encontra-se livre e desembaraçado de quaisquer ônus, não havendo débitos de IPTU, condomínio ou outras obrigações.</p>\n<p>O COMPRADOR declara ter examinado o imóvel e suas condições, aceitando-o no estado em que se encontra.</p>',
        order: 4,
      },
      {
        id: 'clauses',
        title: 'Cláusulas Especiais',
        type: 'clauses',
        content: '<h3>Cláusulas Especiais</h3>\n<p>Não há cláusulas especiais neste momento.</p>',
        order: 5,
      },
      {
        id: 'closing',
        title: 'Encerramento',
        type: 'closing',
        content: '<h3>Encerramento</h3>\n<p>E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma.</p>',
        order: 6,
      },
    ],
  },

  // Lease Template
  {
    id: 'lease-template',
    name: 'Locação',
    description: 'Contrato de locação de imóvel residencial ou comercial',
    actType: 'lease' as ActType,
    icon: '🔑',
    sections: [
      {
        id: 'header',
        title: 'Cabeçalho',
        type: 'header',
        content: '<h1 style="text-align: center; font-weight: bold; font-size: 1.25rem; margin-bottom: 1rem;">CONTRATO DE LOCAÇÃO DE IMÓVEL</h1>',
        order: 0,
      },
      {
        id: 'parties',
        title: 'Qualificação das Partes',
        type: 'parties',
        content: '<h3>Qualificação das Partes</h3>\n<p>As partes a seguir qualificadas celebram o presente contrato:</p>\n<p><strong>LOCADOR:</strong> [Nome completo], [qualificação]</p>\n<p><strong>LOCATÁRIO:</strong> [Nome completo], [qualificação]</p>',
        order: 1,
      },
      {
        id: 'object',
        title: 'Do Objeto',
        type: 'object',
        content: '<h3>Do Objeto</h3>\n<p>O LOCADOR cede ao LOCATÁRIO, em locação, o imóvel localizado em [endereço completo], para fins [residenciais/comerciais].</p>',
        order: 2,
      },
      {
        id: 'price',
        title: 'Do Aluguel e Encargos',
        type: 'price',
        content: '<h3>Do Aluguel e Encargos</h3>\n<p><strong>Valor do Aluguel:</strong> R$ [valor] mensais</p>\n<p><strong>Vencimento:</strong> Todo dia [dia] de cada mês</p>\n<p><strong>Encargos:</strong> IPTU, condomínio, água, luz e outros serviços serão de responsabilidade do LOCATÁRIO.</p>',
        order: 3,
      },
      {
        id: 'conditions',
        title: 'Condições Gerais',
        type: 'conditions',
        content: '<h3>Condições Gerais</h3>\n<p><strong>Prazo:</strong> O presente contrato vigorará pelo prazo de [período], com início em [data] e término em [data].</p>\n<p><strong>Reajuste:</strong> O aluguel será reajustado anualmente pelo índice [IGP-M/IPCA].</p>\n<p><strong>Benfeitorias:</strong> Quaisquer benfeitorias realizadas no imóvel dependerão de autorização prévia do LOCADOR.</p>',
        order: 4,
      },
      {
        id: 'clauses',
        title: 'Cláusulas Especiais',
        type: 'clauses',
        content: '<h3>Cláusulas Especiais</h3>\n<p>Não há cláusulas especiais neste momento.</p>',
        order: 5,
      },
      {
        id: 'closing',
        title: 'Encerramento',
        type: 'closing',
        content: '<h3>Encerramento</h3>\n<p>E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma.</p>',
        order: 6,
      },
    ],
  },

  // Donation Template
  {
    id: 'donation-template',
    name: 'Doação',
    description: 'Contrato de doação de imóvel ou bens',
    actType: 'donation' as ActType,
    icon: '🎁',
    sections: [
      {
        id: 'header',
        title: 'Cabeçalho',
        type: 'header',
        content: '<h1 style="text-align: center; font-weight: bold; font-size: 1.25rem; margin-bottom: 1rem;">CONTRATO DE DOAÇÃO</h1>',
        order: 0,
      },
      {
        id: 'parties',
        title: 'Qualificação das Partes',
        type: 'parties',
        content: '<h3>Qualificação das Partes</h3>\n<p>As partes a seguir qualificadas celebram o presente contrato:</p>\n<p><strong>DOADOR:</strong> [Nome completo], [qualificação]</p>\n<p><strong>DONATÁRIO:</strong> [Nome completo], [qualificação]</p>',
        order: 1,
      },
      {
        id: 'object',
        title: 'Do Objeto',
        type: 'object',
        content: '<h3>Do Objeto</h3>\n<p>O DOADOR, por mera liberalidade, doa ao DONATÁRIO o imóvel localizado em [endereço completo], registrado sob matrícula nº [número] no [cartório].</p>',
        order: 2,
      },
      {
        id: 'price',
        title: 'Do Valor e Condições',
        type: 'price',
        content: '<h3>Do Valor e Condições</h3>\n<p><strong>Valor estimado:</strong> R$ [valor] (para fins de registro)</p>\n<p><strong>Modalidade:</strong> Doação pura e simples / com encargo / com reserva de usufruto</p>',
        order: 3,
      },
      {
        id: 'conditions',
        title: 'Condições Gerais',
        type: 'conditions',
        content: '<h3>Condições Gerais</h3>\n<p>A presente doação é realizada de forma [pura e simples/com encargo/com reserva de usufruto].</p>\n<p>O DONATÁRIO aceita a presente doação e declara estar ciente de todas as suas condições.</p>',
        order: 4,
      },
      {
        id: 'clauses',
        title: 'Cláusulas Especiais',
        type: 'clauses',
        content: '<h3>Cláusulas Especiais</h3>\n<p>Não há cláusulas especiais neste momento.</p>',
        order: 5,
      },
      {
        id: 'closing',
        title: 'Encerramento',
        type: 'closing',
        content: '<h3>Encerramento</h3>\n<p>E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma.</p>',
        order: 6,
      },
    ],
  },

  // Exchange Template
  {
    id: 'exchange-template',
    name: 'Permuta',
    description: 'Contrato de permuta de imóveis ou bens',
    actType: 'exchange' as ActType,
    icon: '🔄',
    sections: [
      {
        id: 'header',
        title: 'Cabeçalho',
        type: 'header',
        content: '<h1 style="text-align: center; font-weight: bold; font-size: 1.25rem; margin-bottom: 1rem;">CONTRATO DE PERMUTA</h1>',
        order: 0,
      },
      {
        id: 'parties',
        title: 'Qualificação das Partes',
        type: 'parties',
        content: '<h3>Qualificação das Partes</h3>\n<p>As partes a seguir qualificadas celebram o presente contrato:</p>\n<p><strong>PERMUTANTE 1:</strong> [Nome completo], [qualificação]</p>\n<p><strong>PERMUTANTE 2:</strong> [Nome completo], [qualificação]</p>',
        order: 1,
      },
      {
        id: 'object',
        title: 'Do Objeto',
        type: 'object',
        content: '<h3>Do Objeto</h3>\n<p>As partes acordam permutar entre si os seguintes bens:</p>\n<p><strong>PERMUTANTE 1</strong> transfere: [descrição do bem/imóvel]</p>\n<p><strong>PERMUTANTE 2</strong> transfere: [descrição do bem/imóvel]</p>',
        order: 2,
      },
      {
        id: 'price',
        title: 'Das Condições',
        type: 'price',
        content: '<h3>Das Condições</h3>\n<p><strong>Valor estimado Bem 1:</strong> R$ [valor]</p>\n<p><strong>Valor estimado Bem 2:</strong> R$ [valor]</p>\n<p><strong>Torna:</strong> [Caso haja diferença de valores, especificar pagamento de torna]</p>',
        order: 3,
      },
      {
        id: 'conditions',
        title: 'Condições Gerais',
        type: 'conditions',
        content: '<h3>Condições Gerais</h3>\n<p>As partes declaram que os bens encontram-se livres e desembaraçados de quaisquer ônus.</p>\n<p>Cada parte responsabiliza-se pelos débitos anteriores à data da permuta relativos ao bem que está transferindo.</p>',
        order: 4,
      },
      {
        id: 'clauses',
        title: 'Cláusulas Especiais',
        type: 'clauses',
        content: '<h3>Cláusulas Especiais</h3>\n<p>Não há cláusulas especiais neste momento.</p>',
        order: 5,
      },
      {
        id: 'closing',
        title: 'Encerramento',
        type: 'closing',
        content: '<h3>Encerramento</h3>\n<p>E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma.</p>',
        order: 6,
      },
    ],
  },
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DraftTemplate | undefined {
  return draftTemplates.find(t => t.id === id)
}

/**
 * Get templates by act type
 */
export function getTemplatesByActType(actType: ActType): DraftTemplate[] {
  return draftTemplates.filter(t => t.actType === actType)
}
