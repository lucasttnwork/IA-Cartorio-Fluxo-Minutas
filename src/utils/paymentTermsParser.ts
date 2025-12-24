/**
 * Payment Terms Parser
 *
 * Utility to parse natural language payment term requests into structured data.
 * Handles various payment schedule formats including percentages, amounts, and dates.
 */

import type { PaymentEntry, PaymentSchedule } from '../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ParsedPaymentTerms {
  success: boolean
  paymentSchedule?: PaymentSchedule
  error?: string
  matchedPatterns: string[]
}

// -----------------------------------------------------------------------------
// Parser Functions
// -----------------------------------------------------------------------------

/**
 * Parse natural language payment terms into structured PaymentSchedule
 *
 * Examples:
 * - "30% à vista e 70% em 60 dias"
 * - "50% agora e 50% em 30 dias"
 * - "100% à vista"
 * - "3 parcelas iguais"
 * - "R$ 50000 à vista e R$ 150000 em 90 dias"
 */
export function parsePaymentTerms(text: string): ParsedPaymentTerms {
  const normalizedText = text.toLowerCase().trim()
  const matchedPatterns: string[] = []
  const entries: PaymentEntry[] = []

  try {
    // Pattern 1: Percentage-based split (e.g., "30% à vista e 70% em 60 dias")
    const percentagePattern = /(\d+)%\s*(?:à vista|agora|hoje|imediato|entrada)(?:\s*e\s*)?(?:(\d+)%\s*em\s*(\d+)\s*dias?)?/gi
    let match = percentagePattern.exec(normalizedText)

    if (match) {
      matchedPatterns.push('percentage_split')

      const firstPercentage = parseInt(match[1])
      entries.push({
        description: 'Pagamento à vista',
        percentage: firstPercentage,
      })

      if (match[2] && match[3]) {
        const secondPercentage = parseInt(match[2])
        const days = parseInt(match[3])
        entries.push({
          description: `Pagamento em ${days} dias`,
          percentage: secondPercentage,
          due_date: calculateDueDate(days),
        })
      }
    }

    // Pattern 2: Two-part percentage with "e" (e.g., "40% à vista e 60% parcelado")
    if (entries.length === 0) {
      const twoPartPattern = /(\d+)%\s*(?:à vista|agora|entrada)(?:\s*e\s*)(\d+)%\s*(?:em\s*(\d+)\s*dias?|parcelado|restante)/gi
      match = twoPartPattern.exec(normalizedText)

      if (match) {
        matchedPatterns.push('two_part_percentage')

        const firstPercentage = parseInt(match[1])
        const secondPercentage = parseInt(match[2])
        const days = match[3] ? parseInt(match[3]) : 30

        entries.push({
          description: 'Pagamento à vista',
          percentage: firstPercentage,
        })

        entries.push({
          description: `Pagamento em ${days} dias`,
          percentage: secondPercentage,
          due_date: calculateDueDate(days),
        })
      }
    }

    // Pattern 3: Amount-based (e.g., "R$ 50000 à vista e R$ 150000 em 90 dias")
    if (entries.length === 0) {
      const amountPattern = /R\$\s*([\d.,]+)\s*(?:à vista|agora)(?:\s*e\s*R\$\s*([\d.,]+)\s*em\s*(\d+)\s*dias?)?/gi
      match = amountPattern.exec(normalizedText)

      if (match) {
        matchedPatterns.push('amount_based')

        const firstAmount = parseAmount(match[1])
        entries.push({
          description: 'Pagamento à vista',
          amount: firstAmount,
        })

        if (match[2] && match[3]) {
          const secondAmount = parseAmount(match[2])
          const days = parseInt(match[3])
          entries.push({
            description: `Pagamento em ${days} dias`,
            amount: secondAmount,
            due_date: calculateDueDate(days),
          })
        }
      }
    }

    // Pattern 4: Simple percentage at sight (e.g., "100% à vista")
    if (entries.length === 0) {
      const simpleSightPattern = /(\d+)%\s*(?:à vista|agora|hoje)/i
      match = simpleSightPattern.exec(normalizedText)

      if (match) {
        matchedPatterns.push('simple_sight')

        const percentage = parseInt(match[1])
        entries.push({
          description: 'Pagamento à vista',
          percentage: percentage,
        })
      }
    }

    // Pattern 5: Equal installments (e.g., "3 parcelas iguais")
    if (entries.length === 0) {
      const installmentsPattern = /(\d+)\s*(?:parcelas?|vezes)\s*(?:iguais)?/i
      match = installmentsPattern.exec(normalizedText)

      if (match) {
        matchedPatterns.push('equal_installments')

        const installments = parseInt(match[1])
        const basePercentage = Math.floor((100 / installments) * 100) / 100
        const remainder = 100 - (basePercentage * installments)

        for (let i = 1; i <= installments; i++) {
          // Add remainder to the last installment to ensure 100% total
          const percentage = i === installments ? basePercentage + remainder : basePercentage

          entries.push({
            description: `Parcela ${i} de ${installments}`,
            percentage: Math.round(percentage * 100) / 100,
            due_date: calculateDueDate(i * 30), // 30 days between installments
          })
        }
      }
    }

    // Pattern 6: Flexible "alterar" pattern - extract any payment terms
    if (entries.length === 0) {
      const alterPattern = /(?:alterar|mudar|trocar|modificar)\s+(?:o\s+)?(?:pagamento|prazo|condições?)\s+para\s+(.+)/i
      match = alterPattern.exec(normalizedText)

      if (match) {
        // Recursively parse the extracted payment terms
        const extracted = match[1]
        return parsePaymentTerms(extracted)
      }
    }

    // Validation
    if (entries.length === 0) {
      return {
        success: false,
        error: 'Não foi possível identificar os termos de pagamento. Use formatos como: "30% à vista e 70% em 60 dias" ou "100% à vista"',
        matchedPatterns,
      }
    }

    // Validate total percentage if using percentages
    const hasPercentages = entries.some(e => e.percentage !== undefined)
    if (hasPercentages) {
      const totalPercentage = entries.reduce((sum, e) => sum + (e.percentage || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return {
          success: false,
          error: `As porcentagens não somam 100% (total: ${totalPercentage}%)`,
          matchedPatterns,
        }
      }
    }

    return {
      success: true,
      paymentSchedule: { entries },
      matchedPatterns,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao processar termos de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      matchedPatterns,
    }
  }
}

/**
 * Parse amount string to number (handles Brazilian format)
 * Examples: "50.000,00" or "50000" or "50.000"
 */
function parseAmount(amountStr: string): number {
  // Remove currency symbols and whitespace
  let cleaned = amountStr.replace(/[R$\s]/g, '')

  // Handle Brazilian format: 1.000.000,00 -> 1000000.00
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    // Only comma: 1000,00 -> 1000.00
    cleaned = cleaned.replace(',', '.')
  }
  // If only dots, assume thousands separator: 1.000 -> 1000
  else if (cleaned.split('.').length > 2) {
    cleaned = cleaned.replace(/\./g, '')
  }

  return parseFloat(cleaned)
}

/**
 * Calculate due date from days offset
 */
function calculateDueDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

/**
 * Format payment schedule to human-readable text
 */
export function formatPaymentSchedule(schedule: PaymentSchedule): string {
  if (!schedule.entries || schedule.entries.length === 0) {
    return 'Sem condições de pagamento definidas'
  }

  return schedule.entries
    .map((entry) => {
      let text = entry.description

      if (entry.percentage !== undefined) {
        text += `: ${entry.percentage}%`
      }

      if (entry.amount !== undefined) {
        text += `: R$ ${entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }

      if (entry.due_date) {
        const date = new Date(entry.due_date)
        text += ` (vencimento: ${date.toLocaleDateString('pt-BR')})`
      }

      return text
    })
    .join('\n')
}

/**
 * Validate if text might contain payment terms
 */
export function containsPaymentTerms(text: string): boolean {
  const normalizedText = text.toLowerCase()

  const keywords = [
    'pagamento',
    'à vista',
    'parcela',
    'prazo',
    '%',
    'dias',
    'condições',
    'valor',
  ]

  return keywords.some(keyword => normalizedText.includes(keyword))
}
