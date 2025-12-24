import type { ConflictReason } from '../types'
import { type FieldType, getFieldConfig, DEFAULT_THRESHOLDS } from '../config/consensusConfig'

/**
 * Result of comparing two field values
 */
export interface ComparisonResult {
  /** Normalized similarity score between 0 and 1 */
  similarityScore: number
  /** Whether the values are considered a match based on threshold */
  isMatch: boolean
  /** Normalized OCR value used for comparison */
  normalizedOcrValue: string
  /** Normalized LLM value used for comparison */
  normalizedLlmValue: string
  /** Reason for conflict if values don't match */
  conflictReason: ConflictReason | null
  /** Whether values are exact match after normalization */
  isExactMatch: boolean
  /** Field type used for comparison */
  fieldType: FieldType
}

/**
 * FieldComparator service for comparing OCR and LLM extraction values
 * Uses Levenshtein distance and field-type-specific normalization
 */
export class FieldComparator {
  /**
   * Compare two values for a given field
   */
  compare(
    fieldPath: string,
    ocrValue: unknown,
    llmValue: unknown
  ): ComparisonResult {
    const config = getFieldConfig(fieldPath)
    const fieldType = config.type
    const threshold = config.similarityThreshold

    // Handle null/undefined/empty values
    const ocrEmpty = this.isEmpty(ocrValue)
    const llmEmpty = this.isEmpty(llmValue)

    if (ocrEmpty && llmEmpty) {
      return {
        similarityScore: 1,
        isMatch: true,
        normalizedOcrValue: '',
        normalizedLlmValue: '',
        conflictReason: null,
        isExactMatch: true,
        fieldType
      }
    }

    if (ocrEmpty || llmEmpty) {
      return {
        similarityScore: 0,
        isMatch: false,
        normalizedOcrValue: ocrEmpty ? '' : this.normalize(ocrValue, fieldType),
        normalizedLlmValue: llmEmpty ? '' : this.normalize(llmValue, fieldType),
        conflictReason: 'missing_value',
        isExactMatch: false,
        fieldType
      }
    }

    // Normalize values based on field type
    const normalizedOcr = this.normalize(ocrValue, fieldType)
    const normalizedLlm = this.normalize(llmValue, fieldType)

    // Check for exact match first
    if (normalizedOcr === normalizedLlm) {
      return {
        similarityScore: 1,
        isMatch: true,
        normalizedOcrValue: normalizedOcr,
        normalizedLlmValue: normalizedLlm,
        conflictReason: null,
        isExactMatch: true,
        fieldType
      }
    }

    // Calculate similarity using appropriate method for field type
    const similarityScore = this.calculateSimilarity(normalizedOcr, normalizedLlm, fieldType)
    const isMatch = similarityScore >= threshold

    // Determine conflict reason
    let conflictReason: ConflictReason | null = null
    if (!isMatch) {
      conflictReason = this.determineConflictReason(
        ocrValue,
        llmValue,
        normalizedOcr,
        normalizedLlm,
        similarityScore,
        fieldType
      )
    }

    return {
      similarityScore,
      isMatch,
      normalizedOcrValue: normalizedOcr,
      normalizedLlmValue: normalizedLlm,
      conflictReason,
      isExactMatch: false,
      fieldType
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Uses dynamic programming approach for efficiency
   */
  levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length

    // Create matrix
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    // Initialize first row and column
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          )
        }
      }
    }

    return dp[m][n]
  }

  /**
   * Calculate normalized similarity score (0 to 1) from Levenshtein distance
   */
  levenshteinSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0

    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)

    return 1 - distance / maxLength
  }

  /**
   * Calculate similarity based on field type
   */
  private calculateSimilarity(normalizedOcr: string, normalizedLlm: string, fieldType: FieldType): number {
    switch (fieldType) {
      case 'cpf':
      case 'cnpj':
      case 'email':
      case 'boolean':
        // These types require exact match - binary similarity
        return normalizedOcr === normalizedLlm ? 1 : 0

      case 'money':
      case 'number':
      case 'percentage':
        // For numeric types, compare numeric values
        return this.numericSimilarity(normalizedOcr, normalizedLlm)

      case 'date':
        // For dates, compare parsed date values
        return this.dateSimilarity(normalizedOcr, normalizedLlm)

      case 'phone':
        // Phone numbers - compare digits only
        return this.phoneSimilarity(normalizedOcr, normalizedLlm)

      case 'name':
        // Names - use enhanced string matching
        return this.nameSimilarity(normalizedOcr, normalizedLlm)

      case 'address':
        // Addresses - more lenient matching
        return this.addressSimilarity(normalizedOcr, normalizedLlm)

      case 'rg':
      case 'registry':
        // Registry numbers - compare alphanumeric only
        return this.registrySimilarity(normalizedOcr, normalizedLlm)

      case 'text':
      default:
        // Default to Levenshtein similarity
        return this.levenshteinSimilarity(normalizedOcr, normalizedLlm)
    }
  }

  /**
   * Normalize value based on field type
   */
  private normalize(value: unknown, fieldType: FieldType): string {
    const strValue = this.toString(value)

    switch (fieldType) {
      case 'cpf':
        return this.normalizeCpf(strValue)
      case 'cnpj':
        return this.normalizeCnpj(strValue)
      case 'money':
        return this.normalizeMoney(strValue)
      case 'date':
        return this.normalizeDate(strValue)
      case 'phone':
        return this.normalizePhone(strValue)
      case 'email':
        return this.normalizeEmail(strValue)
      case 'name':
        return this.normalizeName(strValue)
      case 'address':
        return this.normalizeAddress(strValue)
      case 'number':
        return this.normalizeNumber(strValue)
      case 'percentage':
        return this.normalizePercentage(strValue)
      case 'rg':
        return this.normalizeRg(strValue)
      case 'registry':
        return this.normalizeRegistry(strValue)
      case 'boolean':
        return this.normalizeBoolean(strValue)
      case 'text':
      default:
        return this.normalizeText(strValue)
    }
  }

  /**
   * Check if value is empty/null/undefined
   */
  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    if (typeof value === 'object' && Object.keys(value as object).length === 0) return true
    return false
  }

  /**
   * Convert any value to string
   */
  private toString(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value.toString()
    if (value instanceof Date) return value.toISOString()
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // ============ Normalization Functions ============

  /**
   * Normalize CPF: remove formatting, keep only digits
   * Input: "123.456.789-00" -> Output: "12345678900"
   */
  private normalizeCpf(value: string): string {
    return value.replace(/\D/g, '').padStart(11, '0')
  }

  /**
   * Normalize CNPJ: remove formatting, keep only digits
   * Input: "12.345.678/0001-90" -> Output: "12345678000190"
   */
  private normalizeCnpj(value: string): string {
    return value.replace(/\D/g, '').padStart(14, '0')
  }

  /**
   * Normalize money: extract numeric value
   * Input: "R$ 1.000,50" -> Output: "1000.50"
   * Input: "1000.50" -> Output: "1000.50"
   * Input: "1.000,50" -> Output: "1000.50"
   */
  private normalizeMoney(value: string): string {
    // Remove currency symbols and whitespace
    let cleaned = value.replace(/[R$\s]/gi, '').trim()

    // Handle Brazilian format (1.000,50) vs US format (1,000.50)
    // Check if the value has comma as decimal separator (Brazilian format)
    const hasCommaDecimal = /\d+,\d{1,2}$/.test(cleaned)
    const hasDotDecimal = /\d+\.\d{1,2}$/.test(cleaned)

    if (hasCommaDecimal && !hasDotDecimal) {
      // Brazilian format: remove dots (thousand separators), replace comma with dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (!hasCommaDecimal && hasDotDecimal) {
      // US format: remove commas (thousand separators)
      cleaned = cleaned.replace(/,/g, '')
    } else {
      // Ambiguous or no decimal - just keep digits and one decimal separator
      cleaned = cleaned.replace(/[^\d.,]/g, '')
      // Assume last separator is decimal
      const lastComma = cleaned.lastIndexOf(',')
      const lastDot = cleaned.lastIndexOf('.')
      if (lastComma > lastDot) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        cleaned = cleaned.replace(/,/g, '')
      }
    }

    // Parse as number and format consistently
    const num = parseFloat(cleaned)
    if (isNaN(num)) return '0'
    return num.toFixed(2)
  }

  /**
   * Normalize date: convert to ISO format YYYY-MM-DD
   * Handles various formats:
   * - "25/12/2024" (DD/MM/YYYY - Brazilian)
   * - "2024-12-25" (ISO)
   * - "25 de dezembro de 2024"
   * - "December 25, 2024"
   */
  private normalizeDate(value: string): string {
    const cleaned = value.trim()

    // Try ISO format first (YYYY-MM-DD)
    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    }

    // Try DD/MM/YYYY or DD-MM-YYYY (Brazilian format)
    const brMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (brMatch) {
      const day = brMatch[1].padStart(2, '0')
      const month = brMatch[2].padStart(2, '0')
      const year = brMatch[3]
      return `${year}-${month}-${day}`
    }

    // Try MM/DD/YYYY (US format)
    const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (usMatch) {
      // This is ambiguous with BR format - assume BR format
      const day = usMatch[1].padStart(2, '0')
      const month = usMatch[2].padStart(2, '0')
      const year = usMatch[3]
      return `${year}-${month}-${day}`
    }

    // Try written dates in Portuguese
    const monthsPt: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
      'abril': '04', 'maio': '05', 'junho': '06',
      'julho': '07', 'agosto': '08', 'setembro': '09',
      'outubro': '10', 'novembro': '11', 'dezembro': '12'
    }

    const ptMatch = cleaned.toLowerCase().match(/(\d{1,2})\s*de\s*(\w+)\s*de\s*(\d{4})/)
    if (ptMatch) {
      const day = ptMatch[1].padStart(2, '0')
      const monthName = ptMatch[2].toLowerCase()
      const month = monthsPt[monthName] || '01'
      const year = ptMatch[3]
      return `${year}-${month}-${day}`
    }

    // Try written dates in English
    const monthsEn: Record<string, string> = {
      'january': '01', 'february': '02', 'march': '03',
      'april': '04', 'may': '05', 'june': '06',
      'july': '07', 'august': '08', 'september': '09',
      'october': '10', 'november': '11', 'december': '12'
    }

    const enMatch = cleaned.toLowerCase().match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/)
    if (enMatch) {
      const monthName = enMatch[1].toLowerCase()
      const month = monthsEn[monthName] || '01'
      const day = enMatch[2].padStart(2, '0')
      const year = enMatch[3]
      return `${year}-${month}-${day}`
    }

    // Fallback: try to extract any date-like pattern
    const numbersOnly = cleaned.replace(/\D/g, '')
    if (numbersOnly.length === 8) {
      // Assume DDMMYYYY
      const day = numbersOnly.substring(0, 2)
      const month = numbersOnly.substring(2, 4)
      const year = numbersOnly.substring(4, 8)
      return `${year}-${month}-${day}`
    }

    // Return original if no pattern matched
    return cleaned.toLowerCase()
  }

  /**
   * Normalize phone: keep only digits
   * Input: "(11) 99999-9999" -> Output: "11999999999"
   */
  private normalizePhone(value: string): string {
    let digits = value.replace(/\D/g, '')

    // Remove country code if present (55 for Brazil)
    if (digits.length > 11 && digits.startsWith('55')) {
      digits = digits.substring(2)
    }

    // Remove leading zeros
    digits = digits.replace(/^0+/, '')

    return digits
  }

  /**
   * Normalize email: lowercase and trim
   */
  private normalizeEmail(value: string): string {
    return value.toLowerCase().trim()
  }

  /**
   * Normalize name: remove accents, extra spaces, lowercase
   */
  private normalizeName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .toLowerCase()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()
  }

  /**
   * Normalize address: remove accents, standardize abbreviations, lowercase
   */
  private normalizeAddress(value: string): string {
    let normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()

    // Standardize common address abbreviations
    const abbreviations: Record<string, string> = {
      'r\\.': 'rua',
      'av\\.': 'avenida',
      'avda\\.': 'avenida',
      'pça\\.': 'praca',
      'praça': 'praca',
      'trav\\.': 'travessa',
      'al\\.': 'alameda',
      'rod\\.': 'rodovia',
      'estr\\.': 'estrada',
      'n\\.': 'numero',
      'nº': 'numero',
      'n°': 'numero',
      'apto\\.': 'apartamento',
      'apt\\.': 'apartamento',
      'ap\\.': 'apartamento',
      'bl\\.': 'bloco',
      'cj\\.': 'conjunto',
      'ed\\.': 'edificio',
      'sl\\.': 'sala',
    }

    for (const [abbr, full] of Object.entries(abbreviations)) {
      normalized = normalized.replace(new RegExp(abbr, 'gi'), full)
    }

    return normalized
  }

  /**
   * Normalize number: extract numeric value
   */
  private normalizeNumber(value: string): string {
    // Remove everything except digits, dots, commas, and minus sign
    let cleaned = value.replace(/[^\d.,\-]/g, '')

    // Handle Brazilian format
    const hasCommaDecimal = /,\d{1,2}$/.test(cleaned)
    if (hasCommaDecimal) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }

    const num = parseFloat(cleaned)
    if (isNaN(num)) return '0'
    return num.toString()
  }

  /**
   * Normalize percentage: extract numeric value
   */
  private normalizePercentage(value: string): string {
    const cleaned = value.replace(/[%\s]/g, '')
    return this.normalizeNumber(cleaned)
  }

  /**
   * Normalize RG: remove formatting, uppercase
   */
  private normalizeRg(value: string): string {
    return value.replace(/[.\-\s]/g, '').toUpperCase()
  }

  /**
   * Normalize registry number: remove formatting, uppercase
   */
  private normalizeRegistry(value: string): string {
    return value.replace(/[.\-\s\/]/g, '').toUpperCase()
  }

  /**
   * Normalize boolean: convert to 'true' or 'false'
   */
  private normalizeBoolean(value: string): string {
    const normalized = value.toLowerCase().trim()
    const trueValues = ['true', 'sim', 'yes', 's', 'y', '1', 'verdadeiro', 'v']
    const falseValues = ['false', 'não', 'nao', 'no', 'n', '0', 'falso', 'f']

    if (trueValues.includes(normalized)) return 'true'
    if (falseValues.includes(normalized)) return 'false'
    return normalized
  }

  /**
   * Normalize text: basic cleanup
   */
  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  // ============ Specialized Similarity Functions ============

  /**
   * Compare numeric values
   */
  private numericSimilarity(value1: string, value2: string): number {
    const num1 = parseFloat(value1)
    const num2 = parseFloat(value2)

    if (isNaN(num1) || isNaN(num2)) {
      return this.levenshteinSimilarity(value1, value2)
    }

    if (num1 === num2) return 1

    // Calculate relative difference
    const max = Math.max(Math.abs(num1), Math.abs(num2))
    if (max === 0) return 1

    const diff = Math.abs(num1 - num2)
    const relativeDiff = diff / max

    // Convert to similarity (0-1)
    return Math.max(0, 1 - relativeDiff)
  }

  /**
   * Compare date values
   */
  private dateSimilarity(date1: string, date2: string): number {
    // If both are in ISO format, compare directly
    if (date1 === date2) return 1

    // Try to parse as dates
    const d1 = new Date(date1)
    const d2 = new Date(date2)

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return this.levenshteinSimilarity(date1, date2)
    }

    // If dates match, return 1
    if (d1.getTime() === d2.getTime()) return 1

    // Calculate difference in days
    const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)

    // Small differences (1-2 days) might be formatting issues
    if (diffDays <= 1) return 0.95
    if (diffDays <= 7) return 0.8
    if (diffDays <= 30) return 0.5

    return 0
  }

  /**
   * Compare phone numbers
   */
  private phoneSimilarity(phone1: string, phone2: string): number {
    // Compare digits only
    const digits1 = phone1.replace(/\D/g, '')
    const digits2 = phone2.replace(/\D/g, '')

    if (digits1 === digits2) return 1

    // Check if one is a subset of the other (area code differences)
    if (digits1.endsWith(digits2) || digits2.endsWith(digits1)) {
      return 0.9
    }

    return this.levenshteinSimilarity(digits1, digits2)
  }

  /**
   * Compare names with enhanced matching
   */
  private nameSimilarity(name1: string, name2: string): number {
    if (name1 === name2) return 1

    // Check if one name is contained in the other (abbreviated names)
    if (name1.includes(name2) || name2.includes(name1)) {
      const shorter = name1.length < name2.length ? name1 : name2
      const longer = name1.length < name2.length ? name2 : name1
      return shorter.length / longer.length
    }

    // Split into parts and compare
    const parts1 = name1.split(' ').filter(p => p.length > 0)
    const parts2 = name2.split(' ').filter(p => p.length > 0)

    // Count matching parts
    let matchCount = 0
    for (const part1 of parts1) {
      for (const part2 of parts2) {
        if (part1 === part2) {
          matchCount++
          break
        }
        // Check for initial abbreviation (e.g., "J." matches "João")
        if ((part1.length === 1 && part2.startsWith(part1)) ||
            (part2.length === 1 && part1.startsWith(part2))) {
          matchCount += 0.5
          break
        }
      }
    }

    const maxParts = Math.max(parts1.length, parts2.length)
    const partsScore = matchCount / maxParts

    // Combine with Levenshtein for overall score
    const levenScore = this.levenshteinSimilarity(name1, name2)

    return Math.max(partsScore, levenScore)
  }

  /**
   * Compare addresses with lenient matching
   */
  private addressSimilarity(addr1: string, addr2: string): number {
    if (addr1 === addr2) return 1

    // Compare tokens
    const tokens1 = addr1.split(/[\s,]+/).filter(t => t.length > 1)
    const tokens2 = addr2.split(/[\s,]+/).filter(t => t.length > 1)

    let matchCount = 0
    const matched = new Set<number>()

    for (const token1 of tokens1) {
      for (let i = 0; i < tokens2.length; i++) {
        if (matched.has(i)) continue
        const token2 = tokens2[i]

        if (token1 === token2) {
          matchCount++
          matched.add(i)
          break
        }
        // Fuzzy match for similar tokens
        if (this.levenshteinSimilarity(token1, token2) > 0.8) {
          matchCount += 0.8
          matched.add(i)
          break
        }
      }
    }

    const maxTokens = Math.max(tokens1.length, tokens2.length)
    if (maxTokens === 0) return 1

    return matchCount / maxTokens
  }

  /**
   * Compare registry numbers
   */
  private registrySimilarity(reg1: string, reg2: string): number {
    // Remove all non-alphanumeric characters
    const clean1 = reg1.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const clean2 = reg2.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

    if (clean1 === clean2) return 1

    return this.levenshteinSimilarity(clean1, clean2)
  }

  /**
   * Determine the reason for conflict
   */
  private determineConflictReason(
    ocrValue: unknown,
    llmValue: unknown,
    normalizedOcr: string,
    normalizedLlm: string,
    similarityScore: number,
    fieldType: FieldType
  ): ConflictReason {
    // Check for type mismatch
    if (typeof ocrValue !== typeof llmValue) {
      return 'type_mismatch'
    }

    // Check if one contains the other (partial match)
    if (normalizedOcr.includes(normalizedLlm) || normalizedLlm.includes(normalizedOcr)) {
      return 'partial_match'
    }

    // Check for format differences (high similarity but not exact)
    if (similarityScore >= 0.7 && similarityScore < DEFAULT_THRESHOLDS[fieldType]) {
      return 'format_difference'
    }

    // Default to low similarity
    if (similarityScore < 0.5) {
      return 'semantic_difference'
    }

    return 'low_similarity'
  }

  /**
   * Batch compare multiple fields
   */
  compareFields(
    fields: Array<{
      fieldPath: string
      ocrValue: unknown
      llmValue: unknown
    }>
  ): Map<string, ComparisonResult> {
    const results = new Map<string, ComparisonResult>()

    for (const field of fields) {
      results.set(
        field.fieldPath,
        this.compare(field.fieldPath, field.ocrValue, field.llmValue)
      )
    }

    return results
  }

  /**
   * Get similarity threshold for a field
   */
  getThreshold(fieldPath: string): number {
    const config = getFieldConfig(fieldPath)
    return config.similarityThreshold
  }

  /**
   * Get field type for a field
   */
  getFieldType(fieldPath: string): FieldType {
    const config = getFieldConfig(fieldPath)
    return config.type
  }
}

// Export singleton instance
export const fieldComparator = new FieldComparator()
