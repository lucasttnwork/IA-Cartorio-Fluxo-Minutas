import type {
  ConsensusResult,
  ConsensusField,
  ConflictField,
  ConflictFieldStatus,
  ConflictReason,
  ExtractionResult,
  OcrResult,
} from '../types'
import {
  type ConsensusConfig,
  type FieldConfig,
  DEFAULT_CONSENSUS_CONFIG,
  getFieldConfig,
  evaluateAutoResolutionRules,
  createConsensusConfig,
} from '../config/consensusConfig'
import { FieldComparator, type ComparisonResult } from './FieldComparator'

/**
 * Input data for consensus processing
 */
export interface ConsensusInput {
  /** OCR extraction result */
  ocrResult: OcrResult | null
  /** LLM extraction result */
  llmResult: ExtractionResult | null
  /** Optional OCR confidence for the document */
  ocrConfidence?: number
  /** Optional LLM confidence for the document */
  llmConfidence?: number
  /** Document ID for audit trail */
  documentId: string
}

/**
 * Result of processing a single field
 */
interface ProcessedField {
  fieldPath: string
  consensusField: ConsensusField
  conflictField: ConflictField
}

/**
 * ConsensusEngine orchestrates field-by-field comparison between OCR and LLM results
 *
 * It uses the FieldComparator for value comparison and applies auto-resolution rules
 * to determine which values to accept and which require human review.
 */
export class ConsensusEngine {
  private fieldComparator: FieldComparator
  private config: ConsensusConfig

  constructor(config?: Partial<ConsensusConfig>) {
    this.fieldComparator = new FieldComparator()
    this.config = config ? createConsensusConfig(config) : DEFAULT_CONSENSUS_CONFIG
  }

  /**
   * Process OCR and LLM results to generate consensus
   */
  process(input: ConsensusInput): ConsensusResult {
    const { ocrResult, llmResult, ocrConfidence, llmConfidence, documentId } = input

    // Extract data from both sources
    const ocrData = this.extractDataFromOcr(ocrResult)
    const llmData = this.extractDataFromLlm(llmResult)

    // Get all unique field paths from both sources
    const allFieldPaths = this.getAllFieldPaths(ocrData, llmData)

    // Process each field
    const processedFields: ProcessedField[] = []
    const conflicts: ConflictField[] = []
    const fields: Record<string, ConsensusField> = {}

    for (const fieldPath of allFieldPaths) {
      const ocrValue = this.getValueByPath(ocrData, fieldPath)
      const llmValue = this.getValueByPath(llmData, fieldPath)

      const processed = this.processField(
        fieldPath,
        ocrValue,
        llmValue,
        ocrConfidence ?? ocrResult?.confidence,
        llmConfidence ?? llmResult?.confidence
      )

      processedFields.push(processed)
      fields[fieldPath] = processed.consensusField

      if (processed.conflictField.status === 'pending') {
        conflicts.push(processed.conflictField)
      }
    }

    // Calculate statistics
    const totalFields = processedFields.length
    const confirmedFields = processedFields.filter(
      p => p.conflictField.status === 'confirmed' || p.conflictField.status === 'resolved'
    ).length
    const pendingFields = processedFields.filter(
      p => p.conflictField.status === 'pending'
    ).length

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(processedFields)

    return {
      fields,
      overall_confidence: overallConfidence,
      conflicts,
      total_fields: totalFields,
      confirmed_fields: confirmedFields,
      pending_fields: pendingFields,
    }
  }

  /**
   * Process a single field for consensus
   */
  private processField(
    fieldPath: string,
    ocrValue: unknown,
    llmValue: unknown,
    ocrConfidence?: number,
    llmConfidence?: number
  ): ProcessedField {
    const fieldConfig = getFieldConfig(fieldPath)
    const now = new Date().toISOString()

    // Compare the values
    const comparison = this.fieldComparator.compare(fieldPath, ocrValue, llmValue)

    // Evaluate auto-resolution rules
    const action = evaluateAutoResolutionRules(
      comparison.similarityScore,
      ocrValue,
      llmValue,
      ocrConfidence,
      llmConfidence,
      comparison.fieldType,
      comparison.isExactMatch,
      this.config.autoResolutionRules
    )

    // Determine status and final value based on action
    let status: ConflictFieldStatus
    let finalValue: unknown
    let autoResolved = false
    let conflictReason: ConflictReason | null = comparison.conflictReason

    switch (action.type) {
      case 'confirm':
        status = 'confirmed'
        // For confirmed values, prefer the normalized value or LLM value
        finalValue = comparison.isExactMatch
          ? llmValue ?? ocrValue
          : this.pickBestValue(ocrValue, llmValue, comparison, fieldConfig, ocrConfidence, llmConfidence)
        autoResolved = !comparison.isExactMatch
        conflictReason = null
        break

      case 'prefer_ocr':
        status = 'confirmed'
        finalValue = ocrValue
        autoResolved = true
        conflictReason = action.reason ?? null
        break

      case 'prefer_llm':
        status = 'confirmed'
        finalValue = llmValue
        autoResolved = true
        conflictReason = action.reason ?? null
        break

      case 'prefer_higher_confidence':
        status = 'confirmed'
        finalValue = this.pickByConfidence(ocrValue, llmValue, ocrConfidence, llmConfidence)
        autoResolved = true
        conflictReason = action.reason ?? null
        break

      case 'mark_pending':
      default:
        status = 'pending'
        finalValue = undefined
        conflictReason = action.reason ?? comparison.conflictReason ?? 'low_similarity'
        break
    }

    // Check if field can be auto-resolved according to config
    if (status === 'confirmed' && autoResolved && !fieldConfig.allowAutoResolve) {
      // Override: mark as pending if auto-resolution is not allowed for this field
      status = 'pending'
      finalValue = undefined
      autoResolved = false
      conflictReason = comparison.conflictReason ?? 'low_similarity'
    }

    // Build consensus field
    const consensusField: ConsensusField = {
      value: finalValue,
      ocr_value: ocrValue,
      llm_value: llmValue,
      confidence: this.determineConfidence(comparison, status),
      source: this.determineSource(status, action.type, ocrValue, llmValue, ocrConfidence, llmConfidence),
      is_pending: status === 'pending',
    }

    // Build conflict field
    const conflictField: ConflictField = {
      fieldName: this.getFieldName(fieldPath),
      fieldPath,
      status,
      ocrValue,
      llmValue,
      finalValue: status !== 'pending' ? finalValue : undefined,
      similarityScore: comparison.similarityScore,
      ocrConfidence,
      llmConfidence,
      conflictReason,
      autoResolved: autoResolved && status !== 'pending',
      createdAt: now,
    }

    return { fieldPath, consensusField, conflictField }
  }

  /**
   * Extract structured data from OCR result
   * OCR result may contain text and confidence, but for field extraction
   * we look at any structured data that might have been extracted
   */
  private extractDataFromOcr(ocrResult: OcrResult | null): Record<string, unknown> {
    if (!ocrResult) return {}

    // OCR results typically don't have structured field extraction,
    // but if they do, they might be stored in a 'fields' or 'data' property
    // For now, return an empty object as OCR usually provides raw text
    // The actual field extraction is done by the LLM

    // If OCR has some structured extraction (from newer OCR services),
    // it might be available. Check common patterns:
    const result = ocrResult as unknown as Record<string, unknown>

    if (result.extracted_data && typeof result.extracted_data === 'object') {
      return this.flattenObject(result.extracted_data as Record<string, unknown>)
    }

    if (result.fields && typeof result.fields === 'object') {
      return this.flattenObject(result.fields as Record<string, unknown>)
    }

    // Return empty - will rely on LLM extraction primarily
    return {}
  }

  /**
   * Extract structured data from LLM result
   */
  private extractDataFromLlm(llmResult: ExtractionResult | null): Record<string, unknown> {
    if (!llmResult) return {}

    const data = llmResult.extracted_data
    if (!data || typeof data !== 'object') return {}

    return this.flattenObject(data as Record<string, unknown>)
  }

  /**
   * Flatten a nested object into dot-notation paths
   */
  private flattenObject(
    obj: Record<string, unknown>,
    prefix = ''
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(result, this.flattenObject(value as Record<string, unknown>, path))
      } else {
        result[path] = value
      }
    }

    return result
  }

  /**
   * Get all unique field paths from both data sources
   */
  private getAllFieldPaths(
    ocrData: Record<string, unknown>,
    llmData: Record<string, unknown>
  ): string[] {
    const paths = new Set<string>()

    for (const path of Object.keys(ocrData)) {
      paths.add(path)
    }

    for (const path of Object.keys(llmData)) {
      paths.add(path)
    }

    return Array.from(paths).sort()
  }

  /**
   * Get value from object by dot-notation path
   */
  private getValueByPath(data: Record<string, unknown>, path: string): unknown {
    if (path in data) {
      return data[path]
    }

    // Try to navigate nested structure
    const parts = path.split('.')
    let current: unknown = data

    for (const part of parts) {
      if (current === null || current === undefined) return undefined
      if (typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }

  /**
   * Get the field name from a path (last segment)
   */
  private getFieldName(fieldPath: string): string {
    const parts = fieldPath.split('.')
    return parts[parts.length - 1]
  }

  /**
   * Pick the best value when both sources have values but they're similar
   */
  private pickBestValue(
    ocrValue: unknown,
    llmValue: unknown,
    comparison: ComparisonResult,
    fieldConfig: FieldConfig,
    ocrConfidence?: number,
    llmConfidence?: number
  ): unknown {
    // Use config preference if set
    if (fieldConfig.autoResolvePreference) {
      switch (fieldConfig.autoResolvePreference) {
        case 'ocr':
          return ocrValue
        case 'llm':
          return llmValue
        case 'higher_confidence':
          return this.pickByConfidence(ocrValue, llmValue, ocrConfidence, llmConfidence)
      }
    }

    // Default: prefer LLM for text-heavy fields, OCR for document numbers
    switch (comparison.fieldType) {
      case 'cpf':
      case 'cnpj':
      case 'rg':
      case 'registry':
        // Prefer OCR for document numbers (more accurate for structured data)
        return ocrValue ?? llmValue
      default:
        // Prefer LLM for interpretive content
        return llmValue ?? ocrValue
    }
  }

  /**
   * Pick value based on confidence scores
   */
  private pickByConfidence(
    ocrValue: unknown,
    llmValue: unknown,
    ocrConfidence?: number,
    llmConfidence?: number
  ): unknown {
    const ocrConf = ocrConfidence ?? 0.5
    const llmConf = llmConfidence ?? 0.5

    if (ocrConf > llmConf) {
      return ocrValue ?? llmValue
    } else if (llmConf > ocrConf) {
      return llmValue ?? ocrValue
    } else {
      // Equal confidence: prefer LLM
      return llmValue ?? ocrValue
    }
  }

  /**
   * Determine confidence level based on comparison and status
   */
  private determineConfidence(
    comparison: ComparisonResult,
    status: ConflictFieldStatus
  ): 'high' | 'medium' | 'low' {
    if (status === 'pending') {
      return 'low'
    }

    if (comparison.isExactMatch) {
      return 'high'
    }

    if (comparison.similarityScore >= 0.9) {
      return 'high'
    }

    if (comparison.similarityScore >= 0.7) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Determine the source of the final value
   */
  private determineSource(
    status: ConflictFieldStatus,
    actionType: string,
    ocrValue: unknown,
    llmValue: unknown,
    ocrConfidence?: number,
    llmConfidence?: number
  ): 'ocr' | 'llm' | 'consensus' {
    if (status === 'pending') {
      return 'consensus' // Pending means no decision yet
    }

    switch (actionType) {
      case 'prefer_ocr':
        return 'ocr'
      case 'prefer_llm':
        return 'llm'
      case 'prefer_higher_confidence':
        const ocrConf = ocrConfidence ?? 0.5
        const llmConf = llmConfidence ?? 0.5
        return ocrConf > llmConf ? 'ocr' : 'llm'
      case 'confirm':
        // Exact match - treat as consensus
        return 'consensus'
      default:
        return 'consensus'
    }
  }

  /**
   * Calculate overall confidence based on all processed fields
   */
  private calculateOverallConfidence(processedFields: ProcessedField[]): number {
    if (processedFields.length === 0) return 0

    let totalWeight = 0
    let weightedScore = 0

    for (const { fieldPath, conflictField, consensusField } of processedFields) {
      const config = getFieldConfig(fieldPath)
      const weight = config.confidenceWeight ?? 1.0

      let fieldScore: number
      if (conflictField.status === 'pending') {
        fieldScore = 0.3 // Pending fields contribute low confidence
      } else if (consensusField.confidence === 'high') {
        fieldScore = 1.0
      } else if (consensusField.confidence === 'medium') {
        fieldScore = 0.7
      } else {
        fieldScore = 0.4
      }

      // Also factor in similarity score
      const similarityBonus = conflictField.similarityScore * 0.2
      fieldScore = Math.min(fieldScore + similarityBonus, 1.0)

      weightedScore += fieldScore * weight
      totalWeight += weight
    }

    if (totalWeight === 0) return 0

    return Math.round((weightedScore / totalWeight) * 100) / 100
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConsensusConfig>): void {
    this.config = createConsensusConfig({
      ...this.config,
      ...config,
    })
  }

  /**
   * Get current configuration
   */
  getConfig(): ConsensusConfig {
    return { ...this.config }
  }

  /**
   * Check if there are too many pending fields
   */
  hasTooManyPendingFields(result: ConsensusResult): boolean {
    return result.pending_fields > this.config.maxPendingFields
  }

  /**
   * Get list of required fields that are still pending
   */
  getRequiredPendingFields(result: ConsensusResult): string[] {
    const requiredPending: string[] = []

    for (const conflict of result.conflicts) {
      const config = getFieldConfig(conflict.fieldPath)
      if (config.required) {
        requiredPending.push(conflict.fieldPath)
      }
    }

    return requiredPending
  }

  /**
   * Reprocess a single field with new values (for conflict resolution)
   */
  reprocessField(
    fieldPath: string,
    ocrValue: unknown,
    llmValue: unknown,
    ocrConfidence?: number,
    llmConfidence?: number
  ): ProcessedField {
    return this.processField(fieldPath, ocrValue, llmValue, ocrConfidence, llmConfidence)
  }

  /**
   * Merge two consensus results (useful for incremental processing)
   */
  mergeResults(existing: ConsensusResult, updates: Partial<ConsensusResult>): ConsensusResult {
    const mergedFields = { ...existing.fields }
    const mergedConflicts = [...existing.conflicts]

    if (updates.fields) {
      Object.assign(mergedFields, updates.fields)
    }

    if (updates.conflicts) {
      // Replace conflicts for fields that have been updated
      const updatedPaths = new Set(updates.conflicts.map(c => c.fieldPath))
      const filteredExisting = mergedConflicts.filter(c => !updatedPaths.has(c.fieldPath))
      filteredExisting.push(...updates.conflicts)
      mergedConflicts.length = 0
      mergedConflicts.push(...filteredExisting)
    }

    // Recalculate statistics
    const pendingCount = mergedConflicts.filter(c => c.status === 'pending').length
    const totalFields = Object.keys(mergedFields).length

    return {
      fields: mergedFields,
      overall_confidence: updates.overall_confidence ?? existing.overall_confidence,
      conflicts: mergedConflicts.filter(c => c.status === 'pending'),
      total_fields: totalFields,
      confirmed_fields: totalFields - pendingCount,
      pending_fields: pendingCount,
    }
  }
}

// Export singleton instance
export const consensusEngine = new ConsensusEngine()

// Export factory function for custom configurations
export function createConsensusEngine(config?: Partial<ConsensusConfig>): ConsensusEngine {
  return new ConsensusEngine(config)
}
