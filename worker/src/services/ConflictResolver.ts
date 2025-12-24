import type {
  ConflictField,
  ConflictFieldStatus,
  ConsensusResult,
  ConsensusField,
} from '../types'
import { getFieldConfig } from '../config/consensusConfig'

/**
 * Resolution choice for resolving a conflict
 */
export type ResolutionChoice = 'ocr' | 'llm' | 'custom'

/**
 * Input for resolving a single field conflict
 */
export interface ResolveFieldInput {
  /** Path of the field to resolve */
  fieldPath: string
  /** Which value to use (ocr, llm, or custom) */
  choice: ResolutionChoice
  /** Custom value if choice is 'custom' */
  customValue?: unknown
  /** User ID who is resolving the conflict */
  userId: string
  /** Optional note explaining the resolution */
  note?: string
}

/**
 * Result of resolving a field conflict
 */
export interface ResolveFieldResult {
  /** Whether the resolution was successful */
  success: boolean
  /** The resolved field (updated with status 'resolved') */
  resolvedField?: ConflictField
  /** The updated consensus field */
  updatedConsensusField?: ConsensusField
  /** Error message if resolution failed */
  error?: string
}

/**
 * Input for bulk resolution of multiple fields
 */
export interface BulkResolveInput {
  /** List of field resolutions */
  resolutions: ResolveFieldInput[]
  /** User ID who is resolving the conflicts */
  userId: string
}

/**
 * Result of bulk resolution
 */
export interface BulkResolveResult {
  /** Total number of fields processed */
  total: number
  /** Number of successfully resolved fields */
  resolved: number
  /** Number of failed resolutions */
  failed: number
  /** Individual results for each field */
  results: Map<string, ResolveFieldResult>
  /** List of field paths that failed */
  failedFields: string[]
}

/**
 * Validation result for a resolution
 */
export interface ValidationResult {
  /** Whether the resolution is valid */
  isValid: boolean
  /** List of validation errors */
  errors: string[]
  /** List of validation warnings */
  warnings: string[]
}

/**
 * Resolution audit entry
 */
export interface ResolutionAuditEntry {
  /** Field path that was resolved */
  fieldPath: string
  /** Original OCR value */
  ocrValue: unknown
  /** Original LLM value */
  llmValue: unknown
  /** Final resolved value */
  resolvedValue: unknown
  /** Resolution choice made */
  choice: ResolutionChoice
  /** User ID who made the resolution */
  userId: string
  /** Timestamp of the resolution */
  timestamp: string
  /** Optional note */
  note?: string
  /** Previous status before resolution */
  previousStatus: ConflictFieldStatus
}

/**
 * ConflictResolver service handles manual resolution of field conflicts
 * between OCR and LLM extraction results.
 *
 * This service provides:
 * - Single field resolution with validation
 * - Bulk resolution for multiple fields
 * - Audit trail tracking for all resolutions
 * - Integration with ConsensusResult updates
 */
export class ConflictResolver {
  /** Audit log of all resolutions */
  private auditLog: ResolutionAuditEntry[] = []

  /**
   * Resolve a single field conflict
   */
  resolveField(
    conflict: ConflictField,
    input: ResolveFieldInput
  ): ResolveFieldResult {
    // Validate the resolution
    const validation = this.validateResolution(conflict, input)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join('; '),
      }
    }

    // Determine the final value based on choice
    let finalValue: unknown
    switch (input.choice) {
      case 'ocr':
        finalValue = conflict.ocrValue
        break
      case 'llm':
        finalValue = conflict.llmValue
        break
      case 'custom':
        finalValue = input.customValue
        break
      default:
        return {
          success: false,
          error: `Invalid resolution choice: ${input.choice}`,
        }
    }

    const now = new Date().toISOString()

    // Create audit entry
    const auditEntry: ResolutionAuditEntry = {
      fieldPath: conflict.fieldPath,
      ocrValue: conflict.ocrValue,
      llmValue: conflict.llmValue,
      resolvedValue: finalValue,
      choice: input.choice,
      userId: input.userId,
      timestamp: now,
      note: input.note,
      previousStatus: conflict.status,
    }
    this.auditLog.push(auditEntry)

    // Create resolved conflict field
    const resolvedField: ConflictField = {
      ...conflict,
      status: 'resolved',
      finalValue,
      reviewedBy: input.userId,
      reviewedAt: now,
      resolutionNote: input.note,
      autoResolved: false,
    }

    // Create updated consensus field
    const updatedConsensusField: ConsensusField = {
      value: finalValue,
      ocr_value: conflict.ocrValue,
      llm_value: conflict.llmValue,
      confidence: 'high', // Manually resolved fields have high confidence
      source: this.determineSource(input.choice),
      is_pending: false,
    }

    return {
      success: true,
      resolvedField,
      updatedConsensusField,
    }
  }

  /**
   * Resolve multiple field conflicts at once
   */
  bulkResolve(
    conflicts: ConflictField[],
    input: BulkResolveInput
  ): BulkResolveResult {
    const results = new Map<string, ResolveFieldResult>()
    const failedFields: string[] = []
    let resolved = 0
    let failed = 0

    // Create a map for quick conflict lookup
    const conflictMap = new Map<string, ConflictField>()
    for (const conflict of conflicts) {
      conflictMap.set(conflict.fieldPath, conflict)
    }

    // Process each resolution
    for (const resolution of input.resolutions) {
      const conflict = conflictMap.get(resolution.fieldPath)

      if (!conflict) {
        const result: ResolveFieldResult = {
          success: false,
          error: `Conflict not found for field: ${resolution.fieldPath}`,
        }
        results.set(resolution.fieldPath, result)
        failedFields.push(resolution.fieldPath)
        failed++
        continue
      }

      // Skip if already resolved
      if (conflict.status === 'resolved' || conflict.status === 'confirmed') {
        const result: ResolveFieldResult = {
          success: false,
          error: `Field already resolved: ${resolution.fieldPath}`,
        }
        results.set(resolution.fieldPath, result)
        failedFields.push(resolution.fieldPath)
        failed++
        continue
      }

      // Resolve the field
      const result = this.resolveField(conflict, resolution)
      results.set(resolution.fieldPath, result)

      if (result.success) {
        resolved++
      } else {
        failedFields.push(resolution.fieldPath)
        failed++
      }
    }

    return {
      total: input.resolutions.length,
      resolved,
      failed,
      results,
      failedFields,
    }
  }

  /**
   * Apply resolutions to a ConsensusResult, returning an updated result
   */
  applyResolutionsToConsensusResult(
    consensusResult: ConsensusResult,
    resolvedFields: Map<string, ResolveFieldResult>
  ): ConsensusResult {
    const updatedFields = { ...consensusResult.fields }
    const updatedConflicts = [...consensusResult.conflicts]

    for (const [fieldPath, result] of Array.from(resolvedFields.entries())) {
      if (!result.success || !result.updatedConsensusField || !result.resolvedField) {
        continue
      }

      // Update the consensus field
      updatedFields[fieldPath] = result.updatedConsensusField

      // Update the conflict in the list
      const conflictIndex = updatedConflicts.findIndex(c => c.fieldPath === fieldPath)
      if (conflictIndex >= 0) {
        updatedConflicts[conflictIndex] = result.resolvedField
      }
    }

    // Recalculate pending count
    const pendingConflicts = updatedConflicts.filter(c => c.status === 'pending')
    const pendingCount = pendingConflicts.length
    const totalFields = Object.keys(updatedFields).length

    return {
      fields: updatedFields,
      overall_confidence: this.recalculateConfidence(updatedFields, pendingCount, totalFields),
      conflicts: pendingConflicts, // Only return pending conflicts
      total_fields: totalFields,
      confirmed_fields: totalFields - pendingCount,
      pending_fields: pendingCount,
    }
  }

  /**
   * Validate a resolution before applying it
   */
  validateResolution(
    conflict: ConflictField,
    input: ResolveFieldInput
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if conflict exists
    if (!conflict) {
      errors.push('Conflict is required')
      return { isValid: false, errors, warnings }
    }

    // Check if field path matches
    if (conflict.fieldPath !== input.fieldPath) {
      errors.push(`Field path mismatch: expected ${conflict.fieldPath}, got ${input.fieldPath}`)
    }

    // Check if already resolved
    if (conflict.status === 'resolved') {
      errors.push('Field has already been resolved')
    }

    if (conflict.status === 'confirmed') {
      errors.push('Field is already confirmed and does not need resolution')
    }

    // Validate user ID
    if (!input.userId || input.userId.trim() === '') {
      errors.push('User ID is required for resolution')
    }

    // Validate choice
    const validChoices: ResolutionChoice[] = ['ocr', 'llm', 'custom']
    if (!validChoices.includes(input.choice)) {
      errors.push(`Invalid choice: ${input.choice}. Must be one of: ${validChoices.join(', ')}`)
    }

    // Validate custom value if choice is custom
    if (input.choice === 'custom') {
      if (input.customValue === undefined || input.customValue === null) {
        errors.push('Custom value is required when choice is "custom"')
      } else {
        // Validate custom value type matches field expectations
        const fieldConfig = getFieldConfig(conflict.fieldPath)
        const customValueValidation = this.validateCustomValue(input.customValue, fieldConfig.type)
        if (!customValueValidation.isValid) {
          warnings.push(...customValueValidation.warnings)
        }
      }
    }

    // Check for OCR value availability
    if (input.choice === 'ocr' && this.isEmpty(conflict.ocrValue)) {
      warnings.push('OCR value is empty or missing')
    }

    // Check for LLM value availability
    if (input.choice === 'llm' && this.isEmpty(conflict.llmValue)) {
      warnings.push('LLM value is empty or missing')
    }

    // Check required fields
    const fieldConfig = getFieldConfig(conflict.fieldPath)
    if (fieldConfig.required && input.choice !== 'custom') {
      const chosenValue = input.choice === 'ocr' ? conflict.ocrValue : conflict.llmValue
      if (this.isEmpty(chosenValue)) {
        warnings.push(`This is a required field, but the chosen ${input.choice.toUpperCase()} value is empty`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate a custom value against field type
   */
  private validateCustomValue(
    value: unknown,
    fieldType: string
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = []

    if (value === null || value === undefined) {
      warnings.push('Custom value is null or undefined')
      return { isValid: false, warnings }
    }

    const strValue = String(value)

    switch (fieldType) {
      case 'cpf':
        if (!/^\d{11}$/.test(strValue.replace(/\D/g, ''))) {
          warnings.push('CPF should have exactly 11 digits')
        }
        break
      case 'cnpj':
        if (!/^\d{14}$/.test(strValue.replace(/\D/g, ''))) {
          warnings.push('CNPJ should have exactly 14 digits')
        }
        break
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
          warnings.push('Email format appears invalid')
        }
        break
      case 'date':
        // Try to parse as date
        const date = new Date(strValue)
        if (isNaN(date.getTime())) {
          warnings.push('Date format may be invalid')
        }
        break
      case 'phone':
        if (strValue.replace(/\D/g, '').length < 10) {
          warnings.push('Phone number appears too short')
        }
        break
      case 'money':
      case 'number':
      case 'percentage':
        const numValue = parseFloat(strValue.replace(/[^\d.,\-]/g, '').replace(',', '.'))
        if (isNaN(numValue)) {
          warnings.push('Numeric value appears invalid')
        }
        break
    }

    return { isValid: true, warnings }
  }

  /**
   * Get audit log for a specific field
   */
  getFieldAuditLog(fieldPath: string): ResolutionAuditEntry[] {
    return this.auditLog.filter(entry => entry.fieldPath === fieldPath)
  }

  /**
   * Get full audit log
   */
  getAuditLog(): ResolutionAuditEntry[] {
    return [...this.auditLog]
  }

  /**
   * Get audit entries by user
   */
  getAuditLogByUser(userId: string): ResolutionAuditEntry[] {
    return this.auditLog.filter(entry => entry.userId === userId)
  }

  /**
   * Get audit entries within a date range
   */
  getAuditLogByDateRange(startDate: Date, endDate: Date): ResolutionAuditEntry[] {
    return this.auditLog.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate >= startDate && entryDate <= endDate
    })
  }

  /**
   * Clear audit log (for testing or cleanup)
   */
  clearAuditLog(): void {
    this.auditLog = []
  }

  /**
   * Get pending conflicts from a ConsensusResult
   */
  getPendingConflicts(consensusResult: ConsensusResult): ConflictField[] {
    return consensusResult.conflicts.filter(c => c.status === 'pending')
  }

  /**
   * Get required pending fields (fields marked as required that are still pending)
   */
  getRequiredPendingFields(consensusResult: ConsensusResult): ConflictField[] {
    return consensusResult.conflicts.filter(c => {
      if (c.status !== 'pending') return false
      const config = getFieldConfig(c.fieldPath)
      return config.required === true
    })
  }

  /**
   * Check if all required fields are resolved
   */
  areAllRequiredFieldsResolved(consensusResult: ConsensusResult): boolean {
    return this.getRequiredPendingFields(consensusResult).length === 0
  }

  /**
   * Get summary of conflict status
   */
  getConflictSummary(consensusResult: ConsensusResult): {
    total: number
    pending: number
    resolved: number
    confirmed: number
    requiredPending: number
  } {
    let pending = 0
    let resolved = 0
    let confirmed = 0

    for (const field of Object.values(consensusResult.fields)) {
      if (field.is_pending) {
        pending++
      } else {
        // Not pending means either resolved or confirmed
        confirmed++
      }
    }

    // Count resolved from conflicts array
    for (const conflict of consensusResult.conflicts) {
      if (conflict.status === 'resolved') {
        resolved++
      }
    }

    const requiredPending = this.getRequiredPendingFields(consensusResult).length

    return {
      total: consensusResult.total_fields,
      pending,
      resolved,
      confirmed: consensusResult.confirmed_fields,
      requiredPending,
    }
  }

  /**
   * Suggest resolution based on field configuration and values
   */
  suggestResolution(conflict: ConflictField): {
    suggestion: ResolutionChoice
    reason: string
    confidence: 'high' | 'medium' | 'low'
  } {
    const config = getFieldConfig(conflict.fieldPath)

    // If one value is missing, suggest the other
    if (this.isEmpty(conflict.ocrValue) && !this.isEmpty(conflict.llmValue)) {
      return {
        suggestion: 'llm',
        reason: 'OCR value is missing, LLM value is available',
        confidence: 'medium',
      }
    }

    if (!this.isEmpty(conflict.ocrValue) && this.isEmpty(conflict.llmValue)) {
      return {
        suggestion: 'ocr',
        reason: 'LLM value is missing, OCR value is available',
        confidence: 'medium',
      }
    }

    // Check field configuration preference
    if (config.autoResolvePreference) {
      switch (config.autoResolvePreference) {
        case 'ocr':
          return {
            suggestion: 'ocr',
            reason: `Field configuration prefers OCR for ${config.type} fields`,
            confidence: 'medium',
          }
        case 'llm':
          return {
            suggestion: 'llm',
            reason: `Field configuration prefers LLM for ${config.type} fields`,
            confidence: 'medium',
          }
        case 'higher_confidence':
          // Compare confidence scores
          const ocrConf = conflict.ocrConfidence ?? 0
          const llmConf = conflict.llmConfidence ?? 0
          if (ocrConf > llmConf) {
            return {
              suggestion: 'ocr',
              reason: `OCR has higher confidence (${(ocrConf * 100).toFixed(0)}% vs ${(llmConf * 100).toFixed(0)}%)`,
              confidence: ocrConf > 0.8 ? 'high' : 'medium',
            }
          } else {
            return {
              suggestion: 'llm',
              reason: `LLM has higher confidence (${(llmConf * 100).toFixed(0)}% vs ${(ocrConf * 100).toFixed(0)}%)`,
              confidence: llmConf > 0.8 ? 'high' : 'medium',
            }
          }
      }
    }

    // Default suggestions based on field type
    switch (config.type) {
      case 'cpf':
      case 'cnpj':
      case 'rg':
      case 'registry':
        // Document numbers: prefer OCR (better at reading structured data)
        return {
          suggestion: 'ocr',
          reason: `Document numbers are typically more accurate from OCR`,
          confidence: 'medium',
        }

      case 'name':
      case 'address':
      case 'text':
        // Interpretive content: prefer LLM
        return {
          suggestion: 'llm',
          reason: `Text interpretation is typically more accurate from LLM`,
          confidence: 'medium',
        }

      case 'date':
      case 'money':
      case 'number':
        // For dates and numbers, suggest based on similarity
        if (conflict.similarityScore > 0.8) {
          return {
            suggestion: 'llm',
            reason: `Values are similar (${(conflict.similarityScore * 100).toFixed(0)}%), LLM formatting preferred`,
            confidence: 'medium',
          }
        }
        break
    }

    // Default: no clear suggestion
    return {
      suggestion: 'custom',
      reason: 'Manual review recommended - no clear preference between values',
      confidence: 'low',
    }
  }

  /**
   * Create resolution input from suggestion
   */
  createResolutionFromSuggestion(
    conflict: ConflictField,
    userId: string,
    acceptSuggestion: boolean = true
  ): ResolveFieldInput | null {
    const suggestion = this.suggestResolution(conflict)

    if (!acceptSuggestion || suggestion.suggestion === 'custom') {
      return null
    }

    return {
      fieldPath: conflict.fieldPath,
      choice: suggestion.suggestion,
      userId,
      note: `Auto-suggested: ${suggestion.reason}`,
    }
  }

  /**
   * Determine source label from resolution choice
   */
  private determineSource(choice: ResolutionChoice): 'ocr' | 'llm' | 'consensus' {
    switch (choice) {
      case 'ocr':
        return 'ocr'
      case 'llm':
        return 'llm'
      case 'custom':
        return 'consensus' // Custom values are considered consensus
      default:
        return 'consensus'
    }
  }

  /**
   * Check if a value is empty/null/undefined
   */
  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    if (typeof value === 'object' && Object.keys(value as object).length === 0) return true
    return false
  }

  /**
   * Recalculate overall confidence after resolutions
   */
  private recalculateConfidence(
    fields: Record<string, ConsensusField>,
    pendingCount: number,
    totalFields: number
  ): number {
    if (totalFields === 0) return 0

    let totalWeight = 0
    let weightedScore = 0

    for (const [fieldPath, field] of Object.entries(fields)) {
      const config = getFieldConfig(fieldPath)
      const weight = config.confidenceWeight ?? 1.0

      let fieldScore: number
      if (field.is_pending) {
        fieldScore = 0.3
      } else if (field.confidence === 'high') {
        fieldScore = 1.0
      } else if (field.confidence === 'medium') {
        fieldScore = 0.7
      } else {
        fieldScore = 0.4
      }

      weightedScore += fieldScore * weight
      totalWeight += weight
    }

    if (totalWeight === 0) return 0

    return Math.round((weightedScore / totalWeight) * 100) / 100
  }
}

// Export singleton instance
export const conflictResolver = new ConflictResolver()

// Export factory function
export function createConflictResolver(): ConflictResolver {
  return new ConflictResolver()
}
