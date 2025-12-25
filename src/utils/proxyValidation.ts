import type { Document } from '../types'

/**
 * Validation result for a proxy document
 */
export interface ProxyValidationResult {
  isValid: boolean
  errors: ProxyValidationError[]
  warnings: ProxyValidationWarning[]
}

export interface ProxyValidationError {
  code: 'EXPIRED' | 'MISSING_POWERS' | 'MISSING_SIGNATORIES' | 'MISSING_GRANTOR' | 'MISSING_GRANTEE'
  message: string
}

export interface ProxyValidationWarning {
  code: 'EXPIRING_SOON' | 'LOW_CONFIDENCE' | 'MISSING_NOTARY' | 'PRIVATE_PROXY'
  message: string
}

/**
 * Required powers for real estate transactions
 */
const REQUIRED_REAL_ESTATE_POWERS = [
  'vender',
  'comprar',
  'alienar',
  'transacionar',
  'negociar',
]

/**
 * Validates a proxy document for use in a real estate transaction
 */
export function validateProxyDocument(document: Document): ProxyValidationResult {
  const errors: ProxyValidationError[] = []
  const warnings: ProxyValidationWarning[] = []

  // Only validate proxy documents
  if (document.doc_type !== 'proxy') {
    return { isValid: true, errors: [], warnings: [] }
  }

  const metadata = document.metadata

  // Check expiration date
  if (metadata.proxy_expiration_date) {
    const expirationDate = new Date(metadata.proxy_expiration_date)
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    if (expirationDate < now) {
      errors.push({
        code: 'EXPIRED',
        message: `Procuração expirada em ${expirationDate.toLocaleDateString('pt-BR')}`,
      })
    } else if (expirationDate < thirtyDaysFromNow) {
      warnings.push({
        code: 'EXPIRING_SOON',
        message: `Procuração expira em ${expirationDate.toLocaleDateString('pt-BR')} (menos de 30 dias)`,
      })
    }
  }

  // Check for required powers
  if (metadata.proxy_powers && Array.isArray(metadata.proxy_powers)) {
    const hasRequiredPower = REQUIRED_REAL_ESTATE_POWERS.some((requiredPower) =>
      metadata.proxy_powers!.some((power) =>
        typeof power === 'string' && power.toLowerCase().includes(requiredPower)
      )
    )

    if (!hasRequiredPower) {
      errors.push({
        code: 'MISSING_POWERS',
        message: 'Procuração não contém poderes específicos para transações imobiliárias (vender, comprar, alienar, etc.)',
      })
    }
  } else {
    warnings.push({
      code: 'LOW_CONFIDENCE',
      message: 'Poderes da procuração não foram extraídos - verificação manual necessária',
    })
  }

  // Check for signatories
  if (!metadata.proxy_signatories || !Array.isArray(metadata.proxy_signatories) || metadata.proxy_signatories.length === 0) {
    errors.push({
      code: 'MISSING_SIGNATORIES',
      message: 'Procuração não possui assinaturas identificadas',
    })
  }

  // Check for grantor (outorgante)
  if (!metadata.proxy_grantor || typeof metadata.proxy_grantor !== 'string' || metadata.proxy_grantor.trim() === '') {
    errors.push({
      code: 'MISSING_GRANTOR',
      message: 'Outorgante (quem concede os poderes) não identificado',
    })
  }

  // Check for grantee (outorgado)
  if (!metadata.proxy_grantee || typeof metadata.proxy_grantee !== 'string' || metadata.proxy_grantee.trim() === '') {
    errors.push({
      code: 'MISSING_GRANTEE',
      message: 'Outorgado (quem recebe os poderes) não identificado',
    })
  }

  // Warning for private proxy (less formal)
  if (metadata.proxy_type === 'private') {
    warnings.push({
      code: 'PRIVATE_PROXY',
      message: 'Procuração particular (menos formal que procuração pública)',
    })
  }

  // Warning if no notary info
  if (!metadata.proxy_notary_info) {
    warnings.push({
      code: 'MISSING_NOTARY',
      message: 'Informações do cartório não identificadas',
    })
  }

  // Warning if document has low confidence
  if (document.doc_type_confidence && document.doc_type_confidence < 0.7) {
    warnings.push({
      code: 'LOW_CONFIDENCE',
      message: `Baixa confiança na classificação do documento (${Math.round(document.doc_type_confidence * 100)}%)`,
    })
  }

  const isValid = errors.length === 0

  return { isValid, errors, warnings }
}

/**
 * Gets a human-readable summary of validation issues
 */
export function getProxyValidationSummary(result: ProxyValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'Procuração válida'
  }

  const parts: string[] = []

  if (!result.isValid) {
    parts.push(`${result.errors.length} erro(s)`)
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} aviso(s)`)
  }

  return parts.join(', ')
}
