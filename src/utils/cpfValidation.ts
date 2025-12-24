// ============================================================================
// CPF Validation Utility
// ============================================================================
// CPF (Cadastro de Pessoas Físicas) is the Brazilian individual taxpayer ID.
// It consists of 11 digits with 2 check digits at the end.

/**
 * Removes all non-numeric characters from a CPF string
 */
export function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Formats a CPF string to the standard format: XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleaned = sanitizeCPF(cpf)
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Validates a CPF number using the checksum algorithm
 *
 * The CPF validation algorithm:
 * 1. First 9 digits are the base number
 * 2. 10th digit is first check digit (calculated from first 9 digits)
 * 3. 11th digit is second check digit (calculated from first 10 digits)
 *
 * @param cpf - CPF string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleaned = sanitizeCPF(cpf)

  // Must have exactly 11 digits
  if (cleaned.length !== 11) {
    return false
  }

  // Check for known invalid patterns (all same digits)
  const invalidPatterns = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ]

  if (invalidPatterns.includes(cleaned)) {
    return false
  }

  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }
  if (remainder !== parseInt(cleaned.charAt(9))) {
    return false
  }

  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }
  if (remainder !== parseInt(cleaned.charAt(10))) {
    return false
  }

  return true
}

/**
 * Result of CPF validation with detailed error information
 */
export interface CPFValidationResult {
  isValid: boolean
  error?: string
  formattedCPF?: string
}

/**
 * Validates a CPF and returns detailed validation result
 *
 * @param cpf - CPF string to validate
 * @returns Validation result with error message if invalid
 */
export function validateCPF(cpf: string): CPFValidationResult {
  // Empty CPF is valid (field is optional)
  if (!cpf || cpf.trim() === '') {
    return { isValid: true }
  }

  const cleaned = sanitizeCPF(cpf)

  // Check length
  if (cleaned.length < 11) {
    return {
      isValid: false,
      error: 'CPF deve conter 11 dígitos',
    }
  }

  if (cleaned.length > 11) {
    return {
      isValid: false,
      error: 'CPF deve conter apenas 11 dígitos',
    }
  }

  // Check for invalid patterns
  const allSameDigits = /^(\d)\1{10}$/.test(cleaned)
  if (allSameDigits) {
    return {
      isValid: false,
      error: 'CPF inválido',
    }
  }

  // Validate checksum
  if (!isValidCPF(cleaned)) {
    return {
      isValid: false,
      error: 'CPF inválido',
    }
  }

  return {
    isValid: true,
    formattedCPF: formatCPF(cleaned),
  }
}
