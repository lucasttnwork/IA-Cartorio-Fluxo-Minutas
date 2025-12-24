// ============================================================================
// Date Formatting Utilities for pt-BR Locale
// ============================================================================

import { format, formatRelative, formatDistance, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Format options for different date display contexts
 */
export const DATE_FORMATS = {
  /** Full date with day, month, year - e.g., "23 de dezembro de 2025" */
  full: "d 'de' MMMM 'de' yyyy",
  /** Short date - e.g., "23/12/2025" */
  short: 'dd/MM/yyyy',
  /** Medium date with abbreviated month - e.g., "23 de dez. de 2025" */
  medium: "d 'de' MMM 'de' yyyy",
  /** Date with time - e.g., "23/12/2025 14:30" */
  dateTime: 'dd/MM/yyyy HH:mm',
  /** Full date with time - e.g., "23 de dezembro de 2025 às 14:30" */
  fullDateTime: "d 'de' MMMM 'de' yyyy 'às' HH:mm",
  /** Time only - e.g., "14:30" */
  time: 'HH:mm',
  /** Month and year - e.g., "dezembro de 2025" */
  monthYear: "MMMM 'de' yyyy",
  /** Day and month - e.g., "23 de dezembro" */
  dayMonth: "d 'de' MMMM",
} as const

export type DateFormatType = keyof typeof DATE_FORMATS

/**
 * Formats a date string or Date object to pt-BR locale format
 *
 * @param date - ISO date string or Date object
 * @param formatType - Format type from DATE_FORMATS (default: 'medium')
 * @returns Formatted date string or empty string if invalid
 *
 * @example
 * formatDate('2025-12-23T14:30:00Z') // "23 de dez. de 2025"
 * formatDate('2025-12-23', 'full') // "23 de dezembro de 2025"
 * formatDate('2025-12-23', 'short') // "23/12/2025"
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatType: DateFormatType = 'medium'
): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return ''

  return format(dateObj, DATE_FORMATS[formatType], { locale: ptBR })
}

/**
 * Formats a date as a relative time string in pt-BR
 *
 * @param date - ISO date string or Date object
 * @param baseDate - Base date to compare against (default: now)
 * @returns Relative time string (e.g., "ontem às 14:30", "amanhã")
 *
 * @example
 * formatDateRelative('2025-12-22T14:30:00Z') // "ontem às 14:30"
 */
export function formatDateRelative(
  date: string | Date | null | undefined,
  baseDate: Date = new Date()
): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return ''

  return formatRelative(dateObj, baseDate, { locale: ptBR })
}

/**
 * Formats the distance between two dates in pt-BR
 *
 * @param date - ISO date string or Date object
 * @param baseDate - Base date to compare against (default: now)
 * @param options - Options for formatting
 * @returns Distance string (e.g., "há 3 dias", "em 2 horas")
 *
 * @example
 * formatDateDistance('2025-12-20T14:30:00Z') // "há 3 dias"
 * formatDateDistance('2025-12-20T14:30:00Z', new Date(), { addSuffix: false }) // "3 dias"
 */
export function formatDateDistance(
  date: string | Date | null | undefined,
  baseDate: Date = new Date(),
  options: { addSuffix?: boolean } = { addSuffix: true }
): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return ''

  return formatDistance(dateObj, baseDate, {
    locale: ptBR,
    addSuffix: options.addSuffix
  })
}

/**
 * Parses an ISO date string to a Date object
 *
 * @param dateString - ISO date string
 * @returns Date object or null if invalid
 */
export function parseDateString(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  const date = parseISO(dateString)
  return isValid(date) ? date : null
}

/**
 * Checks if a date string or Date object is valid
 *
 * @param date - ISO date string or Date object
 * @returns true if valid date
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false

  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isValid(dateObj)
}
