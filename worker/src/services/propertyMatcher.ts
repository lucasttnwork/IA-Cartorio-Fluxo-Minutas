import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../src/types/database'
import type { Property, Evidence, Address, BoundingBox } from '../../../src/types/index'
import type {
  PropertyCandidate,
  EntitySource,
  PropertyMergeSuggestionReason,
  MergeSuggestionStatus,
} from '../types'

/**
 * Result of building a property record
 */
export interface PropertyBuildResult {
  /** The created or updated property record */
  property: Property
  /** Whether the record was newly created or updated */
  isNew: boolean
  /** Evidence records created for traceability */
  evidenceCreated: number
  /** Source documents associated with this property */
  sourceDocuments: string[]
}

/**
 * Result of a batch build operation
 */
export interface BatchPropertyBuildResult {
  /** Successfully built properties */
  properties: PropertyBuildResult[]
  /** Number of properties that were merged with existing records */
  mergedCount: number
  /** Number of new properties created */
  createdCount: number
  /** Errors encountered during the process */
  errors: Array<{ candidate: PropertyCandidate; error: string }>
}

/**
 * Options for looking up existing properties
 */
export interface PropertyLookupOptions {
  /** Case ID to search within */
  caseId: string
  /** Registry number to match (highest priority) */
  registryNumber?: string | null
  /** IPTU number to match */
  iptuNumber?: string | null
  /** Address for similarity matching */
  address?: Address | null
}

/**
 * Result of comparing two property candidates for potential merge
 */
export interface PropertyComparisonResult {
  /** Whether the candidates should be auto-merged */
  shouldAutoMerge: boolean
  /** Whether a merge suggestion should be created */
  shouldSuggestMerge: boolean
  /** Reason for the merge suggestion */
  reason: PropertyMergeSuggestionReason | null
  /** Fields that match between candidates */
  matchingFields: string[]
  /** Fields that conflict between candidates */
  conflictingFields: string[]
  /** Overall similarity score (0-1) */
  similarityScore: number
  /** Confidence that these are the same property (0-1) */
  confidence: number
}

/**
 * Configuration for PropertyMatcher
 */
export interface PropertyMatcherConfig {
  /** Whether to create evidence records for extracted fields */
  createEvidence: boolean
  /** Whether to update existing properties with new data */
  updateExisting: boolean
  /** Minimum confidence threshold for updating a field */
  minConfidenceForUpdate: number
  /** Whether to merge source_docs arrays when updating */
  mergeSourceDocs: boolean
  /** Whether to auto-merge on registry number match */
  autoMergeOnRegistryMatch: boolean
  /** Whether to auto-merge on IPTU number match */
  autoMergeOnIptuMatch: boolean
  /** Threshold for address similarity to suggest merge (0-1) */
  addressSimilarityThreshold: number
}

const DEFAULT_CONFIG: PropertyMatcherConfig = {
  createEvidence: true,
  updateExisting: true,
  minConfidenceForUpdate: 0.6,
  mergeSourceDocs: true,
  autoMergeOnRegistryMatch: true,
  autoMergeOnIptuMatch: false,
  addressSimilarityThreshold: 0.85,
}

/**
 * PropertyMatcher service for matching, deduplicating, and persisting Property records.
 *
 * This service handles:
 * 1. Building Property records from PropertyCandidate objects
 * 2. Persisting to Supabase database
 * 3. Creating Evidence records for traceability
 * 4. Finding existing properties for deduplication (by registry number, IPTU, or address)
 * 5. Comparing candidates for potential merges
 * 6. Merging new data with existing Property records
 */
export class PropertyMatcher {
  private supabase: SupabaseClient<Database>
  private config: PropertyMatcherConfig

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string,
    config?: Partial<PropertyMatcherConfig>
  ) {
    const url = supabaseUrl || process.env.SUPABASE_URL || ''
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    this.supabase = createClient<Database>(url, key)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Build and persist a Property record from a PropertyCandidate
   */
  async buildProperty(
    caseId: string,
    candidate: PropertyCandidate
  ): Promise<PropertyBuildResult> {
    // Try to find an existing property with matching identifiers
    const existingProperty = await this.findExistingProperty({
      caseId,
      registryNumber: candidate.registry_number,
      iptuNumber: candidate.iptu_number,
      address: candidate.address,
    })

    if (existingProperty && this.config.updateExisting) {
      // Update existing property with new data
      return this.updateExistingProperty(existingProperty, candidate)
    }

    // Create a new property
    return this.createNewProperty(caseId, candidate)
  }

  /**
   * Build and persist multiple Property records from candidates
   */
  async buildProperties(
    caseId: string,
    candidates: PropertyCandidate[]
  ): Promise<BatchPropertyBuildResult> {
    const results: PropertyBuildResult[] = []
    const errors: Array<{ candidate: PropertyCandidate; error: string }> = []
    let mergedCount = 0
    let createdCount = 0

    for (const candidate of candidates) {
      try {
        const result = await this.buildProperty(caseId, candidate)
        results.push(result)

        if (result.isNew) {
          createdCount++
        } else {
          mergedCount++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push({ candidate, error: errorMessage })
      }
    }

    return {
      properties: results,
      mergedCount,
      createdCount,
      errors,
    }
  }

  /**
   * Find an existing Property by identifiers
   */
  async findExistingProperty(options: PropertyLookupOptions): Promise<Property | null> {
    const { caseId, registryNumber, iptuNumber, address } = options

    // Priority 1: Match by registry number (most reliable)
    if (registryNumber) {
      const normalizedRegistry = this.normalizeRegistryNumber(registryNumber)
      const { data: propertiesByRegistry } = await this.supabase
        .from('properties')
        .select('*')
        .eq('case_id', caseId)
        .not('registry_number', 'is', null)
        .limit(20)

      if (propertiesByRegistry) {
        for (const property of propertiesByRegistry) {
          if (property.registry_number &&
              this.normalizeRegistryNumber(property.registry_number) === normalizedRegistry) {
            return property
          }
        }
      }
    }

    // Priority 2: Match by IPTU number
    if (iptuNumber) {
      const normalizedIptu = this.normalizeIptuNumber(iptuNumber)
      const { data: propertiesByIptu } = await this.supabase
        .from('properties')
        .select('*')
        .eq('case_id', caseId)
        .not('iptu_number', 'is', null)
        .limit(20)

      if (propertiesByIptu) {
        for (const property of propertiesByIptu) {
          if (property.iptu_number &&
              this.normalizeIptuNumber(property.iptu_number) === normalizedIptu) {
            return property
          }
        }
      }
    }

    // Priority 3: Match by address similarity (fallback)
    if (address && address.street) {
      const { data: propertiesByAddress } = await this.supabase
        .from('properties')
        .select('*')
        .eq('case_id', caseId)
        .not('address', 'is', null)
        .limit(30)

      if (propertiesByAddress) {
        for (const property of propertiesByAddress) {
          if (property.address) {
            const similarity = this.calculateAddressSimilarity(address, property.address as Address)
            if (similarity >= this.config.addressSimilarityThreshold) {
              return property
            }
          }
        }
      }
    }

    return null
  }

  /**
   * Find all existing properties in a case
   */
  async findAllPropertiesInCase(caseId: string): Promise<Property[]> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch properties: ${error.message}`)
    }

    return data || []
  }

  /**
   * Compare two PropertyCandidates to determine if they should be merged
   */
  compareCandidates(
    candidateA: PropertyCandidate,
    candidateB: PropertyCandidate
  ): PropertyComparisonResult {
    const matchingFields: string[] = []
    const conflictingFields: string[] = []
    let shouldAutoMerge = false
    let shouldSuggestMerge = false
    let reason: PropertyMergeSuggestionReason | null = null
    let confidence = 0

    // Check registry number match (highest priority)
    if (candidateA.registry_number && candidateB.registry_number) {
      const regA = this.normalizeRegistryNumber(candidateA.registry_number)
      const regB = this.normalizeRegistryNumber(candidateB.registry_number)

      if (regA === regB) {
        matchingFields.push('registry_number')
        shouldAutoMerge = this.config.autoMergeOnRegistryMatch
        reason = 'same_registry'
        confidence = 0.99
      } else {
        conflictingFields.push('registry_number')
      }
    }

    // Check IPTU number match
    if (candidateA.iptu_number && candidateB.iptu_number) {
      const iptuA = this.normalizeIptuNumber(candidateA.iptu_number)
      const iptuB = this.normalizeIptuNumber(candidateB.iptu_number)

      if (iptuA === iptuB) {
        matchingFields.push('iptu_number')
        if (!shouldAutoMerge) {
          shouldAutoMerge = this.config.autoMergeOnIptuMatch
          reason = 'same_iptu'
          confidence = Math.max(confidence, 0.95)
        }
      } else {
        conflictingFields.push('iptu_number')
      }
    }

    // Check address similarity
    if (candidateA.address && candidateB.address) {
      const addressSimilarity = this.calculateAddressSimilarity(
        candidateA.address,
        candidateB.address
      )

      if (addressSimilarity >= this.config.addressSimilarityThreshold) {
        matchingFields.push('address')
        confidence = Math.max(confidence, addressSimilarity * 0.8)

        // Address + registry is a strong match
        if (matchingFields.includes('registry_number') && !shouldAutoMerge) {
          shouldAutoMerge = true
          reason = 'registry_and_address'
        } else if (!shouldAutoMerge && !shouldSuggestMerge) {
          shouldSuggestMerge = true
          reason = 'similar_address'
        }
      } else if (addressSimilarity < 0.5) {
        conflictingFields.push('address')
      }
    }

    // Check registry office match
    if (candidateA.registry_office && candidateB.registry_office) {
      const officeA = this.normalizeRegistryOffice(candidateA.registry_office)
      const officeB = this.normalizeRegistryOffice(candidateB.registry_office)

      if (officeA === officeB) {
        matchingFields.push('registry_office')
        confidence = Math.max(confidence, 0.6)
      } else {
        // Different registry offices might indicate different properties
        conflictingFields.push('registry_office')
      }
    }

    // Calculate overall similarity score
    const totalFields = matchingFields.length + conflictingFields.length
    const similarityScore = totalFields > 0
      ? matchingFields.length / totalFields
      : this.calculateAddressSimilarity(
          candidateA.address || { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' },
          candidateB.address || { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }
        )

    return {
      shouldAutoMerge,
      shouldSuggestMerge,
      reason,
      matchingFields,
      conflictingFields,
      similarityScore,
      confidence,
    }
  }

  /**
   * Find all potential duplicates among a list of candidates
   */
  findDuplicates(
    candidates: PropertyCandidate[]
  ): Array<{
    candidateA: PropertyCandidate
    candidateB: PropertyCandidate
    comparison: PropertyComparisonResult
  }> {
    const duplicates: Array<{
      candidateA: PropertyCandidate
      candidateB: PropertyCandidate
      comparison: PropertyComparisonResult
    }> = []

    // Build a registry number index for quick lookup
    const registryIndex = new Map<string, PropertyCandidate[]>()
    for (const candidate of candidates) {
      if (candidate.registry_number) {
        const normalizedRegistry = this.normalizeRegistryNumber(candidate.registry_number)
        if (!registryIndex.has(normalizedRegistry)) {
          registryIndex.set(normalizedRegistry, [])
        }
        registryIndex.get(normalizedRegistry)!.push(candidate)
      }
    }

    // Find duplicates by registry number
    registryIndex.forEach((candidatesWithRegistry, registry) => {
      if (candidatesWithRegistry.length > 1) {
        for (let i = 0; i < candidatesWithRegistry.length; i++) {
          for (let j = i + 1; j < candidatesWithRegistry.length; j++) {
            const comparison = this.compareCandidates(
              candidatesWithRegistry[i],
              candidatesWithRegistry[j]
            )
            duplicates.push({
              candidateA: candidatesWithRegistry[i],
              candidateB: candidatesWithRegistry[j],
              comparison,
            })
          }
        }
      }
    })

    // Find duplicates by address similarity (for candidates without registry)
    const candidatesWithoutRegistry = candidates.filter(c => !c.registry_number)
    for (let i = 0; i < candidatesWithoutRegistry.length; i++) {
      for (let j = i + 1; j < candidatesWithoutRegistry.length; j++) {
        const comparison = this.compareCandidates(
          candidatesWithoutRegistry[i],
          candidatesWithoutRegistry[j]
        )
        if (comparison.shouldAutoMerge || comparison.shouldSuggestMerge) {
          duplicates.push({
            candidateA: candidatesWithoutRegistry[i],
            candidateB: candidatesWithoutRegistry[j],
            comparison,
          })
        }
      }
    }

    return duplicates
  }

  /**
   * Merge two property candidates into one
   */
  mergeCandidates(primary: PropertyCandidate, secondary: PropertyCandidate): PropertyCandidate {
    // Start with primary as base
    const merged: PropertyCandidate = { ...primary }

    // Merge source_docs (deduplicated)
    merged.source_docs = Array.from(
      new Set([...primary.source_docs, ...secondary.source_docs])
    )

    // Merge source_entities
    merged.source_entities = [...primary.source_entities, ...secondary.source_entities]

    // Fill in missing fields from secondary
    if (!merged.registry_number && secondary.registry_number) {
      merged.registry_number = secondary.registry_number
    }
    if (!merged.registry_office && secondary.registry_office) {
      merged.registry_office = secondary.registry_office
    }
    if (!merged.address && secondary.address) {
      merged.address = secondary.address
    }
    if (!merged.area_sqm && secondary.area_sqm) {
      merged.area_sqm = secondary.area_sqm
    }
    if (!merged.description && secondary.description) {
      merged.description = secondary.description
    }
    if (!merged.iptu_number && secondary.iptu_number) {
      merged.iptu_number = secondary.iptu_number
    }

    // Merge encumbrances (combine unique ones)
    if (secondary.encumbrances && secondary.encumbrances.length > 0) {
      if (!merged.encumbrances) {
        merged.encumbrances = []
      }
      for (const enc of secondary.encumbrances) {
        // Avoid duplicates by type
        if (!merged.encumbrances.some(e => e.type === enc.type)) {
          merged.encumbrances.push(enc)
        }
      }
    }

    // Merge metadata
    merged.metadata = { ...secondary.metadata, ...primary.metadata }

    // Average confidence
    merged.confidence = (primary.confidence + secondary.confidence) / 2

    return merged
  }

  /**
   * Create a new Property record from a candidate
   */
  private async createNewProperty(
    caseId: string,
    candidate: PropertyCandidate
  ): Promise<PropertyBuildResult> {
    // Prepare the property data
    const propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'> = {
      case_id: caseId,
      registry_number: candidate.registry_number,
      registry_office: candidate.registry_office,
      address: candidate.address,
      area_sqm: candidate.area_sqm,
      description: candidate.description,
      iptu_number: candidate.iptu_number,
      encumbrances: candidate.encumbrances,
      confidence: candidate.confidence,
      source_docs: candidate.source_docs,
      metadata: candidate.metadata,
    }

    // Insert the property
    const { data: property, error } = await this.supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create property: ${error.message}`)
    }

    if (!property) {
      throw new Error('Property creation returned no data')
    }

    // Create evidence records
    let evidenceCreated = 0
    if (this.config.createEvidence && candidate.source_entities.length > 0) {
      evidenceCreated = await this.createEvidenceRecords(property.id, candidate.source_entities)
    }

    return {
      property,
      isNew: true,
      evidenceCreated,
      sourceDocuments: candidate.source_docs,
    }
  }

  /**
   * Update an existing Property record with new data from a candidate
   */
  private async updateExistingProperty(
    existingProperty: Property,
    candidate: PropertyCandidate
  ): Promise<PropertyBuildResult> {
    // Prepare update data - only update fields with higher confidence or fill missing fields
    const updateData: Partial<Property> = {}

    // Update fields that are missing in the existing record
    if (!existingProperty.registry_office && candidate.registry_office) {
      updateData.registry_office = candidate.registry_office
    }
    if (!existingProperty.address && candidate.address) {
      updateData.address = candidate.address
    }
    if (!existingProperty.area_sqm && candidate.area_sqm) {
      updateData.area_sqm = candidate.area_sqm
    }
    if (!existingProperty.description && candidate.description) {
      updateData.description = candidate.description
    }
    if (!existingProperty.iptu_number && candidate.iptu_number) {
      updateData.iptu_number = candidate.iptu_number
    }

    // Merge encumbrances
    if (candidate.encumbrances && candidate.encumbrances.length > 0) {
      const existingEncumbrances = existingProperty.encumbrances || []
      const newEncumbrances = [...existingEncumbrances]

      for (const enc of candidate.encumbrances) {
        if (!newEncumbrances.some(e => e.type === enc.type)) {
          newEncumbrances.push(enc)
        }
      }

      if (newEncumbrances.length > existingEncumbrances.length) {
        updateData.encumbrances = newEncumbrances
      }
    }

    // Merge source documents
    if (this.config.mergeSourceDocs) {
      const mergedSourceDocs = Array.from(
        new Set([...existingProperty.source_docs, ...candidate.source_docs])
      )
      if (mergedSourceDocs.length > existingProperty.source_docs.length) {
        updateData.source_docs = mergedSourceDocs
      }
    }

    // Update confidence if new one is higher
    if (candidate.confidence > existingProperty.confidence) {
      updateData.confidence = candidate.confidence
    }

    // Merge metadata
    if (Object.keys(candidate.metadata).length > 0) {
      updateData.metadata = { ...existingProperty.metadata, ...candidate.metadata }
    }

    // Only update if there are changes
    let updatedProperty = existingProperty
    if (Object.keys(updateData).length > 0) {
      const { data: updated, error } = await this.supabase
        .from('properties')
        .update(updateData)
        .eq('id', existingProperty.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update property: ${error.message}`)
      }

      if (updated) {
        updatedProperty = updated
      }
    }

    // Create evidence records for new source entities
    let evidenceCreated = 0
    if (this.config.createEvidence && candidate.source_entities.length > 0) {
      evidenceCreated = await this.createEvidenceRecords(existingProperty.id, candidate.source_entities)
    }

    return {
      property: updatedProperty,
      isNew: false,
      evidenceCreated,
      sourceDocuments: updatedProperty.source_docs,
    }
  }

  /**
   * Create Evidence records for a Property's extracted fields
   */
  private async createEvidenceRecords(
    propertyId: string,
    sourceEntities: EntitySource[]
  ): Promise<number> {
    if (sourceEntities.length === 0) {
      return 0
    }

    const evidenceRecords: Array<Omit<Evidence, 'id' | 'created_at'>> = []

    for (const source of sourceEntities) {
      const evidenceRecord: Omit<Evidence, 'id' | 'created_at'> = {
        entity_type: 'property',
        entity_id: propertyId,
        field_name: source.field_name,
        document_id: source.document_id,
        page_number: source.position?.page ?? 1,
        bounding_box: source.position?.bounding_box ?? null,
        extracted_text: source.value,
        confidence: source.confidence,
        source: 'llm', // Entity extraction uses LLM
      }

      evidenceRecords.push(evidenceRecord)
    }

    // Insert evidence records in batches
    const batchSize = 50
    let createdCount = 0

    for (let i = 0; i < evidenceRecords.length; i += batchSize) {
      const batch = evidenceRecords.slice(i, i + batchSize)
      const { data, error } = await this.supabase
        .from('evidence')
        .insert(batch)
        .select()

      if (error) {
        console.error(`Failed to create evidence batch: ${error.message}`)
      } else {
        createdCount += data?.length ?? 0
      }
    }

    return createdCount
  }

  /**
   * Create a single Evidence record
   */
  async createEvidence(
    propertyId: string,
    fieldName: string,
    documentId: string,
    extractedText: string,
    confidence: number,
    pageNumber?: number,
    boundingBox?: BoundingBox | null,
    source: 'ocr' | 'llm' | 'consensus' = 'llm'
  ): Promise<Evidence | null> {
    const evidenceData: Omit<Evidence, 'id' | 'created_at'> = {
      entity_type: 'property',
      entity_id: propertyId,
      field_name: fieldName,
      document_id: documentId,
      page_number: pageNumber ?? 1,
      bounding_box: boundingBox ?? null,
      extracted_text: extractedText,
      confidence,
      source,
    }

    const { data, error } = await this.supabase
      .from('evidence')
      .insert(evidenceData)
      .select()
      .single()

    if (error) {
      console.error(`Failed to create evidence: ${error.message}`)
      return null
    }

    return data
  }

  /**
   * Get all evidence for a property
   */
  async getEvidenceForProperty(propertyId: string): Promise<Evidence[]> {
    const { data, error } = await this.supabase
      .from('evidence')
      .select('*')
      .eq('entity_type', 'property')
      .eq('entity_id', propertyId)
      .order('field_name')

    if (error) {
      throw new Error(`Failed to fetch evidence: ${error.message}`)
    }

    return data || []
  }

  /**
   * Delete a property and all associated evidence
   */
  async deleteProperty(propertyId: string): Promise<boolean> {
    // Delete evidence first (due to foreign key constraints)
    await this.supabase
      .from('evidence')
      .delete()
      .eq('entity_type', 'property')
      .eq('entity_id', propertyId)

    // Delete the property
    const { error } = await this.supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)

    if (error) {
      console.error(`Failed to delete property: ${error.message}`)
      return false
    }

    return true
  }

  /**
   * Merge two Property records
   * The primary property is kept, secondary is merged into it and deleted
   */
  async mergeProperties(
    primaryPropertyId: string,
    secondaryPropertyId: string
  ): Promise<Property | null> {
    // Get both properties
    const { data: properties, error: fetchError } = await this.supabase
      .from('properties')
      .select('*')
      .in('id', [primaryPropertyId, secondaryPropertyId])

    if (fetchError || !properties || properties.length !== 2) {
      console.error('Failed to fetch properties for merge')
      return null
    }

    const primary = properties.find(p => p.id === primaryPropertyId)
    const secondary = properties.find(p => p.id === secondaryPropertyId)

    if (!primary || !secondary) {
      console.error('One or both properties not found')
      return null
    }

    // Merge data from secondary into primary
    const updateData: Partial<Property> = {}

    // Fill missing fields from secondary
    if (!primary.registry_number && secondary.registry_number) {
      updateData.registry_number = secondary.registry_number
    }
    if (!primary.registry_office && secondary.registry_office) {
      updateData.registry_office = secondary.registry_office
    }
    if (!primary.address && secondary.address) {
      updateData.address = secondary.address
    }
    if (!primary.area_sqm && secondary.area_sqm) {
      updateData.area_sqm = secondary.area_sqm
    }
    if (!primary.description && secondary.description) {
      updateData.description = secondary.description
    }
    if (!primary.iptu_number && secondary.iptu_number) {
      updateData.iptu_number = secondary.iptu_number
    }

    // Merge encumbrances
    const primaryEncumbrances = primary.encumbrances || []
    const secondaryEncumbrances = secondary.encumbrances || []
    if (secondaryEncumbrances.length > 0) {
      const mergedEncumbrances = [...primaryEncumbrances]
      for (const enc of secondaryEncumbrances) {
        if (!mergedEncumbrances.some(e => e.type === enc.type)) {
          mergedEncumbrances.push(enc)
        }
      }
      if (mergedEncumbrances.length > primaryEncumbrances.length) {
        updateData.encumbrances = mergedEncumbrances
      }
    }

    // Merge source_docs
    updateData.source_docs = Array.from(
      new Set([...primary.source_docs, ...secondary.source_docs])
    )

    // Merge metadata
    updateData.metadata = { ...secondary.metadata, ...primary.metadata }

    // Average confidence
    updateData.confidence = (primary.confidence + secondary.confidence) / 2

    // Update primary property
    const { data: updated, error: updateError } = await this.supabase
      .from('properties')
      .update(updateData)
      .eq('id', primaryPropertyId)
      .select()
      .single()

    if (updateError) {
      console.error(`Failed to update primary property during merge: ${updateError.message}`)
      return null
    }

    // Reassign evidence from secondary to primary
    await this.supabase
      .from('evidence')
      .update({ entity_id: primaryPropertyId })
      .eq('entity_type', 'property')
      .eq('entity_id', secondaryPropertyId)

    // Reassign graph edges from secondary to primary
    await this.supabase
      .from('graph_edges')
      .update({ source_id: primaryPropertyId })
      .eq('source_type', 'property')
      .eq('source_id', secondaryPropertyId)

    await this.supabase
      .from('graph_edges')
      .update({ target_id: primaryPropertyId })
      .eq('target_type', 'property')
      .eq('target_id', secondaryPropertyId)

    // Delete secondary property
    await this.supabase
      .from('properties')
      .delete()
      .eq('id', secondaryPropertyId)

    return updated
  }

  // ============ Normalization Helper Functions ============

  /**
   * Normalize registry number: remove formatting and prefixes
   */
  normalizeRegistryNumber(value: string): string {
    let normalized = value.trim()

    // Remove prefix like "Matrícula nº", "Mat.", etc.
    normalized = normalized.replace(/^(matr[íi]cula|mat\.?)\s*(n[º°]?\.?)?\s*/i, '')

    // Remove dots, spaces, and other formatting but keep hyphens and numbers
    normalized = normalized.replace(/\s+/g, '').replace(/\.+/g, '')

    return normalized.toLowerCase()
  }

  /**
   * Normalize IPTU number: remove formatting
   */
  normalizeIptuNumber(value: string): string {
    // Remove dots, dashes, slashes, and spaces
    return value.replace(/[\.\-\/\s]/g, '').toLowerCase()
  }

  /**
   * Normalize registry office name
   */
  normalizeRegistryOffice(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/cartorio/g, 'cartório')
      .replace(/oficio/g, 'ofício')
      .trim()
  }

  /**
   * Calculate address similarity between two addresses
   */
  calculateAddressSimilarity(addr1: Address, addr2: Address): number {
    let matchScore = 0
    let totalFields = 0

    const compareField = (a: string | undefined, b: string | undefined): number => {
      if (!a && !b) return 1
      if (!a || !b) return 0
      const normA = this.normalizeString(a)
      const normB = this.normalizeString(b)
      return normA === normB ? 1 : this.levenshteinSimilarity(normA, normB)
    }

    // Compare each address field with weights
    const fieldWeights: Array<{ key: keyof Address; weight: number }> = [
      { key: 'street', weight: 2.0 },
      { key: 'number', weight: 2.0 },
      { key: 'city', weight: 1.5 },
      { key: 'state', weight: 1.0 },
      { key: 'neighborhood', weight: 1.0 },
      { key: 'zip', weight: 1.5 },
    ]

    for (const { key, weight } of fieldWeights) {
      const similarity = compareField(addr1[key], addr2[key])
      matchScore += similarity * weight
      totalFields += weight
    }

    return totalFields > 0 ? matchScore / totalFields : 0
  }

  /**
   * Normalize string: remove accents, extra spaces, lowercase
   */
  private normalizeString(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Calculate Levenshtein similarity between two strings
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0

    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)

    return 1 - distance / maxLength
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length

    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],
            dp[i][j - 1],
            dp[i - 1][j - 1]
          )
        }
      }
    }

    return dp[m][n]
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PropertyMatcherConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): PropertyMatcherConfig {
    return { ...this.config }
  }
}

// Lazy singleton instance (only created when accessed)
let _propertyMatcherInstance: PropertyMatcher | null = null

export function getPropertyMatcher(): PropertyMatcher {
  if (!_propertyMatcherInstance) {
    _propertyMatcherInstance = new PropertyMatcher()
  }
  return _propertyMatcherInstance
}

// Export factory function for custom configurations
export function createPropertyMatcher(
  supabaseUrl?: string,
  supabaseKey?: string,
  config?: Partial<PropertyMatcherConfig>
): PropertyMatcher {
  return new PropertyMatcher(supabaseUrl, supabaseKey, config)
}
