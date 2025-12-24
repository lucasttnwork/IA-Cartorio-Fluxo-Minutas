// ============================================================================
// Currency Formatting Utilities for BRL (Brazilian Real)
// ============================================================================

/**
 * Format options for different currency display contexts
 */
export const CURRENCY_FORMATS = {
  /** Standard format - e.g., "R$ 1.234,56" */
  standard: {
    style: 'currency' as const,
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  /** Compact format - e.g., "R$ 1,2 mil" */
  compact: {
    style: 'currency' as const,
    currency: 'BRL',
    notation: 'compact' as const,
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  },
  /** No symbol format - e.g., "1.234,56" */
  noSymbol: {
    style: 'decimal' as const,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  /** Integer format (no decimals) - e.g., "R$ 1.235" */
  integer: {
    style: 'currency' as const,
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
} as const

export type CurrencyFormatType = keyof typeof CURRENCY_FORMATS

/**
 * Formats a number to Brazilian Real (BRL) currency format
 *
 * @param value - Numeric value to format
 * @param formatType - Format type from CURRENCY_FORMATS (default: 'standard')
 * @returns Formatted currency string or empty string if invalid
 *
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(1234.56, 'compact') // "R$ 1,2 mil"
 * formatCurrency(1234.56, 'noSymbol') // "1.234,56"
 * formatCurrency(1234.56, 'integer') // "R$ 1.235"
 */
export function formatCurrency(
  value: number | null | undefined,
  formatType: CurrencyFormatType = 'standard'
): string {
  if (value === null || value === undefined || isNaN(value)) return ''

  const formatter = new Intl.NumberFormat('pt-BR', CURRENCY_FORMATS[formatType])
  return formatter.format(value)
}

/**
 * Parses a Brazilian currency string to a number
 *
 * @param value - Currency string (e.g., "R$ 1.234,56" or "1.234,56")
 * @returns Parsed number or null if invalid
 *
 * @example
 * parseCurrency('R$ 1.234,56') // 1234.56
 * parseCurrency('1.234,56') // 1234.56
 * parseCurrency('1234,56') // 1234.56
 * parseCurrency('invalid') // null
 */
export function parseCurrency(value: string | null | undefined): number | null {
  if (!value) return null

  // Remove currency symbol, spaces, and thousand separators (.)
  // Then replace comma with dot for decimal separator
  const cleanValue = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? null : parsed
}

/**
 * Formats a currency input as user types (for form inputs)
 *
 * @param value - Current input value
 * @param previousValue - Previous input value (for cursor positioning)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrencyInput('1234') // "1.234"
 * formatCurrencyInput('123456') // "1.234,56"
 * formatCurrencyInput('12345678') // "123.456,78"
 */
export function formatCurrencyInput(value: string): string {
  if (!value) return ''

  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '')

  if (!numericValue) return ''

  // Convert to number (cents)
  const cents = parseInt(numericValue, 10)

  // Convert cents to decimal
  const decimal = cents / 100

  // Format using standard format but without currency symbol
  return formatCurrency(decimal, 'noSymbol')
}

/**
 * Validates if a string represents a valid currency value
 *
 * @param value - String to validate
 * @returns true if valid currency format
 *
 * @example
 * isValidCurrency('R$ 1.234,56') // true
 * isValidCurrency('1.234,56') // true
 * isValidCurrency('1234,56') // true
 * isValidCurrency('abc') // false
 */
export function isValidCurrency(value: string | null | undefined): boolean {
  if (!value) return false
  return parseCurrency(value) !== null
}

/**
 * Formats a currency value for display in tables or compact spaces
 *
 * @param value - Numeric value to format
 * @param showSymbol - Whether to show the R$ symbol (default: true)
 * @returns Formatted compact currency string
 *
 * @example
 * formatCurrencyCompact(1234) // "R$ 1,2 mil"
 * formatCurrencyCompact(1234567) // "R$ 1,2 mi"
 * formatCurrencyCompact(1234567890) // "R$ 1,2 bi"
 * formatCurrencyCompact(1234, false) // "1,2 mil"
 */
export function formatCurrencyCompact(
  value: number | null | undefined,
  showSymbol: boolean = true
): string {
  if (value === null || value === undefined || isNaN(value)) return ''

  if (showSymbol) {
    return formatCurrency(value, 'compact')
  }

  const formatter = new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
  return formatter.format(value)
}

/**
 * Formats a range of currency values
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param formatType - Format type (default: 'standard')
 * @returns Formatted range string
 *
 * @example
 * formatCurrencyRange(1000, 5000) // "R$ 1.000,00 - R$ 5.000,00"
 * formatCurrencyRange(1000, 5000, 'compact') // "R$ 1 mil - R$ 5 mil"
 */
export function formatCurrencyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  formatType: CurrencyFormatType = 'standard'
): string {
  if (min === null || min === undefined || max === null || max === undefined) {
    return ''
  }

  const formattedMin = formatCurrency(min, formatType)
  const formattedMax = formatCurrency(max, formatType)

  return `${formattedMin} - ${formattedMax}`
}
