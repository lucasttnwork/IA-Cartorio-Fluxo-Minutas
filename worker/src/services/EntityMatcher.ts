import type {
  ExtractedEntity,
  EntityType,
  PersonCandidate,
  EntitySource,
  MergeSuggestionReason,
  Address,
  MaritalStatus,
} from '../types'

/**
 * Result of grouping entities from a document
 */
export interface DocumentEntityGroup {
  documentId: string
  entities: ExtractedEntity[]
  entitiesByType: Map<EntityType, ExtractedEntity[]>
}

/**
 * Result of matching entities to build a person candidate
 */
export interface EntityMatchResult {
  /** The primary person name entity */
  nameEntity: ExtractedEntity
  /** All associated entities (CPF, RG, dates, etc.) */
  associatedEntities: ExtractedEntity[]
  /** Built person candidate */
  candidate: PersonCandidate
  /** Match confidence */
  confidence: number
}

/**
 * Result of comparing two person candidates for potential merge
 */
export interface CandidateComparisonResult {
  /** Whether the candidates should be auto-merged */
  shouldAutoMerge: boolean
  /** Whether a merge suggestion should be created */
  shouldSuggestMerge: boolean
  /** Reason for the merge suggestion */
  reason: MergeSuggestionReason | null
  /** Fields that match between candidates */
  matchingFields: string[]
  /** Fields that conflict between candidates */
  conflictingFields: string[]
  /** Overall similarity score (0-1) */
  similarityScore: number
  /** Confidence that these are the same person (0-1) */
  confidence: number
}

/**
 * Configuration for entity matching thresholds
 */
export interface EntityMatcherConfig {
  /** Minimum confidence for name entities to be considered */
  minNameConfidence: number
  /** Minimum confidence for CPF/RG entities to be considered */
  minIdConfidence: number
  /** Threshold for name similarity to suggest merge (0-1) */
  nameSimilarityThreshold: number
  /** Maximum distance (in entity order) to associate entities with a name */
  maxAssociationDistance: number
  /** Whether to auto-merge on CPF match */
  autoMergeOnCpfMatch: boolean
  /** Whether to auto-merge on RG match */
  autoMergeOnRgMatch: boolean
}

const DEFAULT_CONFIG: EntityMatcherConfig = {
  minNameConfidence: 0.6,
  minIdConfidence: 0.7,
  nameSimilarityThreshold: 0.85,
  maxAssociationDistance: 10,
  autoMergeOnCpfMatch: true,
  autoMergeOnRgMatch: false,
}

/**
 * EntityMatcher service for grouping entities by document and type,
 * and matching related entities to build PersonCandidate records.
 *
 * This service is used by the entity resolution job to:
 * 1. Group extracted entities by document and type
 * 2. Associate related entities (e.g., CPF with name)
 * 3. Build PersonCandidate records from grouped entities
 * 4. Compare candidates for potential merges/duplicates
 */
export class EntityMatcher {
  private config: EntityMatcherConfig

  constructor(config?: Partial<EntityMatcherConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Group entities by document ID
   */
  groupByDocument(entities: ExtractedEntity[]): Map<string, DocumentEntityGroup> {
    const groups = new Map<string, DocumentEntityGroup>()

    for (const entity of entities) {
      const docId = entity.document_id || 'unknown'

      if (!groups.has(docId)) {
        groups.set(docId, {
          documentId: docId,
          entities: [],
          entitiesByType: new Map(),
        })
      }

      const group = groups.get(docId)!
      group.entities.push(entity)

      // Add to type group
      if (!group.entitiesByType.has(entity.type)) {
        group.entitiesByType.set(entity.type, [])
      }
      group.entitiesByType.get(entity.type)!.push(entity)
    }

    return groups
  }

  /**
   * Group entities by type across all documents
   */
  groupByType(entities: ExtractedEntity[]): Map<EntityType, ExtractedEntity[]> {
    const groups = new Map<EntityType, ExtractedEntity[]>()

    for (const entity of entities) {
      if (!groups.has(entity.type)) {
        groups.set(entity.type, [])
      }
      groups.get(entity.type)!.push(entity)
    }

    return groups
  }

  /**
   * Find person-related entities and build PersonCandidate records
   * Groups PERSON entities with their associated CPF, RG, DATE, ADDRESS, etc.
   */
  matchPersonEntities(documentGroup: DocumentEntityGroup): EntityMatchResult[] {
    const results: EntityMatchResult[] = []
    const personEntities = documentGroup.entitiesByType.get('PERSON') || []

    // Filter persons by confidence
    const validPersons = personEntities.filter(
      p => p.confidence >= this.config.minNameConfidence
    )

    for (const personEntity of validPersons) {
      // Find associated entities for this person
      const associated = this.findAssociatedEntities(
        personEntity,
        documentGroup.entities
      )

      // Build the person candidate
      const candidate = this.buildPersonCandidate(
        personEntity,
        associated,
        documentGroup.documentId
      )

      // Calculate overall confidence
      const confidence = this.calculateMatchConfidence(personEntity, associated)

      results.push({
        nameEntity: personEntity,
        associatedEntities: associated,
        candidate,
        confidence,
      })
    }

    return results
  }

  /**
   * Find entities that are likely associated with a person entity
   * Uses proximity (position in document) and context clues
   */
  private findAssociatedEntities(
    personEntity: ExtractedEntity,
    allEntities: ExtractedEntity[]
  ): ExtractedEntity[] {
    const associated: ExtractedEntity[] = []
    const personIndex = allEntities.findIndex(e => e.id === personEntity.id)

    // Entity types that can be associated with a person
    const personRelatedTypes: EntityType[] = [
      'CPF',
      'RG',
      'DATE',
      'EMAIL',
      'PHONE',
      'ADDRESS',
      'RELATIONSHIP',
    ]

    // Look for entities near the person entity
    const startIndex = Math.max(0, personIndex - this.config.maxAssociationDistance)
    const endIndex = Math.min(
      allEntities.length - 1,
      personIndex + this.config.maxAssociationDistance
    )

    // Track which entity types we've already found (prefer closest)
    const foundTypes = new Set<EntityType>()

    // First pass: look forward from person entity
    for (let i = personIndex + 1; i <= endIndex; i++) {
      const entity = allEntities[i]

      if (!personRelatedTypes.includes(entity.type)) continue

      // Skip if we already found this type (except for RELATIONSHIP which can have multiple)
      if (foundTypes.has(entity.type) && entity.type !== 'RELATIONSHIP') continue

      // Check confidence threshold for ID documents
      if (['CPF', 'RG'].includes(entity.type) && entity.confidence < this.config.minIdConfidence) {
        continue
      }

      // Stop if we hit another PERSON entity (we've gone too far)
      if (entity.type === 'PERSON' && entity.id !== personEntity.id) {
        break
      }

      associated.push(entity)
      foundTypes.add(entity.type)
    }

    // Second pass: look backward from person entity (for missed entities)
    for (let i = personIndex - 1; i >= startIndex; i--) {
      const entity = allEntities[i]

      if (!personRelatedTypes.includes(entity.type)) continue

      // Skip if we already found this type
      if (foundTypes.has(entity.type) && entity.type !== 'RELATIONSHIP') continue

      // Check confidence threshold for ID documents
      if (['CPF', 'RG'].includes(entity.type) && entity.confidence < this.config.minIdConfidence) {
        continue
      }

      // Stop if we hit another PERSON entity
      if (entity.type === 'PERSON' && entity.id !== personEntity.id) {
        break
      }

      associated.push(entity)
      foundTypes.add(entity.type)
    }

    return associated
  }

  /**
   * Build a PersonCandidate from a person entity and its associated entities
   */
  private buildPersonCandidate(
    personEntity: ExtractedEntity,
    associatedEntities: ExtractedEntity[],
    documentId: string
  ): PersonCandidate {
    const sourceEntities: EntitySource[] = []

    // Add the name entity as a source
    sourceEntities.push({
      field_name: 'full_name',
      entity_id: personEntity.id || '',
      document_id: documentId,
      entity_type: personEntity.type,
      value: personEntity.value,
      confidence: personEntity.confidence,
      position: personEntity.position,
    })

    // Initialize the candidate with the name
    const candidate: PersonCandidate = {
      full_name: personEntity.normalized_value || personEntity.value,
      cpf: null,
      rg: null,
      rg_issuer: null,
      birth_date: null,
      nationality: null,
      marital_status: null,
      profession: null,
      email: null,
      phone: null,
      address: null,
      father_name: null,
      mother_name: null,
      source_docs: [documentId],
      source_entities: sourceEntities,
      confidence: personEntity.confidence,
      metadata: {},
    }

    // Map associated entities to candidate fields
    for (const entity of associatedEntities) {
      const sourceEntry: EntitySource = {
        field_name: this.mapEntityTypeToField(entity.type),
        entity_id: entity.id || '',
        document_id: documentId,
        entity_type: entity.type,
        value: entity.value,
        confidence: entity.confidence,
        position: entity.position,
      }

      switch (entity.type) {
        case 'CPF':
          candidate.cpf = this.normalizeCpf(entity.normalized_value || entity.value)
          sourceEntry.field_name = 'cpf'
          sourceEntities.push(sourceEntry)
          break

        case 'RG':
          candidate.rg = entity.normalized_value || entity.value
          sourceEntry.field_name = 'rg'
          sourceEntities.push(sourceEntry)
          // Try to extract issuer from context
          if (entity.context) {
            const issuerMatch = entity.context.match(/SSP[\-\/]?([A-Z]{2})/i)
            if (issuerMatch) {
              candidate.rg_issuer = `SSP/${issuerMatch[1].toUpperCase()}`
            }
          }
          break

        case 'DATE':
          // Try to determine if this is a birth date from context
          if (this.isBirthDateContext(entity.context)) {
            candidate.birth_date = this.normalizeDate(entity.normalized_value || entity.value)
            sourceEntry.field_name = 'birth_date'
            sourceEntities.push(sourceEntry)
          }
          break

        case 'EMAIL':
          candidate.email = (entity.normalized_value || entity.value).toLowerCase()
          sourceEntry.field_name = 'email'
          sourceEntities.push(sourceEntry)
          break

        case 'PHONE':
          candidate.phone = entity.normalized_value || entity.value
          sourceEntry.field_name = 'phone'
          sourceEntities.push(sourceEntry)
          break

        case 'ADDRESS':
          candidate.address = this.parseAddress(entity.value)
          sourceEntry.field_name = 'address'
          sourceEntities.push(sourceEntry)
          break

        case 'RELATIONSHIP':
          // Check if this is a parent relationship
          const relationship = entity.value.toLowerCase()
          if (relationship.includes('pai') || relationship.includes('father')) {
            candidate.father_name = this.extractNameFromRelationship(entity.value)
            sourceEntry.field_name = 'father_name'
            sourceEntities.push(sourceEntry)
          } else if (relationship.includes('mãe') || relationship.includes('mae') || relationship.includes('mother')) {
            candidate.mother_name = this.extractNameFromRelationship(entity.value)
            sourceEntry.field_name = 'mother_name'
            sourceEntities.push(sourceEntry)
          }
          break
      }
    }

    return candidate
  }

  /**
   * Map entity type to PersonCandidate field name
   */
  private mapEntityTypeToField(type: EntityType): string {
    const mapping: Partial<Record<EntityType, string>> = {
      CPF: 'cpf',
      RG: 'rg',
      DATE: 'birth_date',
      EMAIL: 'email',
      PHONE: 'phone',
      ADDRESS: 'address',
      RELATIONSHIP: 'relationship',
    }
    return mapping[type] || type.toLowerCase()
  }

  /**
   * Check if a date context suggests it's a birth date
   */
  private isBirthDateContext(context?: string): boolean {
    if (!context) return false
    const lower = context.toLowerCase()
    return (
      lower.includes('nascimento') ||
      lower.includes('nascido') ||
      lower.includes('nascida') ||
      lower.includes('data de nascimento') ||
      lower.includes('birth') ||
      lower.includes('born') ||
      lower.includes('nasc')
    )
  }

  /**
   * Compare two PersonCandidates to determine if they should be merged
   */
  compareCandidates(
    candidateA: PersonCandidate,
    candidateB: PersonCandidate
  ): CandidateComparisonResult {
    const matchingFields: string[] = []
    const conflictingFields: string[] = []
    let shouldAutoMerge = false
    let shouldSuggestMerge = false
    let reason: MergeSuggestionReason | null = null
    let confidence = 0

    // Check CPF match (highest priority)
    if (candidateA.cpf && candidateB.cpf) {
      const cpfA = this.normalizeCpf(candidateA.cpf)
      const cpfB = this.normalizeCpf(candidateB.cpf)

      if (cpfA === cpfB) {
        matchingFields.push('cpf')
        shouldAutoMerge = this.config.autoMergeOnCpfMatch
        reason = 'same_cpf'
        confidence = 0.99
      } else {
        conflictingFields.push('cpf')
      }
    }

    // Check RG match
    if (candidateA.rg && candidateB.rg) {
      const rgA = this.normalizeRg(candidateA.rg)
      const rgB = this.normalizeRg(candidateB.rg)

      if (rgA === rgB) {
        matchingFields.push('rg')
        if (!shouldAutoMerge) {
          shouldAutoMerge = this.config.autoMergeOnRgMatch
          reason = 'same_rg'
          confidence = Math.max(confidence, 0.95)
        }
      } else {
        conflictingFields.push('rg')
      }
    }

    // Check name similarity
    const nameSimilarity = this.calculateNameSimilarity(
      candidateA.full_name,
      candidateB.full_name
    )

    if (nameSimilarity >= this.config.nameSimilarityThreshold) {
      matchingFields.push('full_name')
      confidence = Math.max(confidence, nameSimilarity * 0.7)
    } else if (nameSimilarity < 0.5) {
      conflictingFields.push('full_name')
    }

    // Check birth date match
    if (candidateA.birth_date && candidateB.birth_date) {
      if (candidateA.birth_date === candidateB.birth_date) {
        matchingFields.push('birth_date')
        confidence = Math.max(confidence, 0.8)

        // Name + birth date is a strong match
        if (nameSimilarity >= 0.7 && !shouldAutoMerge) {
          shouldSuggestMerge = true
          reason = 'name_and_birth_date'
        }
      } else {
        conflictingFields.push('birth_date')
      }
    }

    // Check address similarity
    if (candidateA.address && candidateB.address) {
      const addressSimilarity = this.calculateAddressSimilarity(
        candidateA.address,
        candidateB.address
      )

      if (addressSimilarity >= 0.8) {
        matchingFields.push('address')
        confidence = Math.max(confidence, 0.7)

        // Name + address is a moderate match
        if (nameSimilarity >= 0.8 && !shouldAutoMerge && !shouldSuggestMerge) {
          shouldSuggestMerge = true
          reason = 'name_and_address'
        }
      } else if (addressSimilarity < 0.5) {
        conflictingFields.push('address')
      }
    }

    // If no strong match, check for similar names only
    if (!shouldAutoMerge && !shouldSuggestMerge && nameSimilarity >= 0.9) {
      shouldSuggestMerge = true
      reason = 'similar_name'
    }

    // Calculate overall similarity score
    const totalFields = matchingFields.length + conflictingFields.length
    const similarityScore = totalFields > 0
      ? matchingFields.length / totalFields
      : nameSimilarity

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
    candidates: PersonCandidate[]
  ): Array<{ candidateA: PersonCandidate; candidateB: PersonCandidate; comparison: CandidateComparisonResult }> {
    const duplicates: Array<{
      candidateA: PersonCandidate
      candidateB: PersonCandidate
      comparison: CandidateComparisonResult
    }> = []

    // Build a CPF index for quick lookup
    const cpfIndex = new Map<string, PersonCandidate[]>()
    for (const candidate of candidates) {
      if (candidate.cpf) {
        const normalizedCpf = this.normalizeCpf(candidate.cpf)
        if (!cpfIndex.has(normalizedCpf)) {
          cpfIndex.set(normalizedCpf, [])
        }
        cpfIndex.get(normalizedCpf)!.push(candidate)
      }
    }

    // Find duplicates by CPF
    cpfIndex.forEach((candidatesWithCpf, cpf) => {
      if (candidatesWithCpf.length > 1) {
        for (let i = 0; i < candidatesWithCpf.length; i++) {
          for (let j = i + 1; j < candidatesWithCpf.length; j++) {
            const comparison = this.compareCandidates(
              candidatesWithCpf[i],
              candidatesWithCpf[j]
            )
            duplicates.push({
              candidateA: candidatesWithCpf[i],
              candidateB: candidatesWithCpf[j],
              comparison,
            })
          }
        }
      }
    })

    // Find duplicates by name similarity (for candidates without CPF)
    const candidatesWithoutCpf = candidates.filter(c => !c.cpf)
    for (let i = 0; i < candidatesWithoutCpf.length; i++) {
      for (let j = i + 1; j < candidatesWithoutCpf.length; j++) {
        const comparison = this.compareCandidates(
          candidatesWithoutCpf[i],
          candidatesWithoutCpf[j]
        )
        if (comparison.shouldAutoMerge || comparison.shouldSuggestMerge) {
          duplicates.push({
            candidateA: candidatesWithoutCpf[i],
            candidateB: candidatesWithoutCpf[j],
            comparison,
          })
        }
      }
    }

    return duplicates
  }

  /**
   * Merge two person candidates into one
   */
  mergeCandidates(primary: PersonCandidate, secondary: PersonCandidate): PersonCandidate {
    // Start with primary as base
    const merged: PersonCandidate = { ...primary }

    // Merge source_docs (deduplicated)
    merged.source_docs = Array.from(
      new Set([...primary.source_docs, ...secondary.source_docs])
    )

    // Merge source_entities
    merged.source_entities = [...primary.source_entities, ...secondary.source_entities]

    // Fill in missing fields from secondary
    if (!merged.cpf && secondary.cpf) {
      merged.cpf = secondary.cpf
    }
    if (!merged.rg && secondary.rg) {
      merged.rg = secondary.rg
    }
    if (!merged.rg_issuer && secondary.rg_issuer) {
      merged.rg_issuer = secondary.rg_issuer
    }
    if (!merged.birth_date && secondary.birth_date) {
      merged.birth_date = secondary.birth_date
    }
    if (!merged.nationality && secondary.nationality) {
      merged.nationality = secondary.nationality
    }
    if (!merged.marital_status && secondary.marital_status) {
      merged.marital_status = secondary.marital_status
    }
    if (!merged.profession && secondary.profession) {
      merged.profession = secondary.profession
    }
    if (!merged.email && secondary.email) {
      merged.email = secondary.email
    }
    if (!merged.phone && secondary.phone) {
      merged.phone = secondary.phone
    }
    if (!merged.address && secondary.address) {
      merged.address = secondary.address
    }
    if (!merged.father_name && secondary.father_name) {
      merged.father_name = secondary.father_name
    }
    if (!merged.mother_name && secondary.mother_name) {
      merged.mother_name = secondary.mother_name
    }

    // Merge metadata
    merged.metadata = { ...secondary.metadata, ...primary.metadata }

    // Average confidence
    merged.confidence = (primary.confidence + secondary.confidence) / 2

    return merged
  }

  // ============ Helper Functions ============

  /**
   * Calculate overall match confidence
   */
  private calculateMatchConfidence(
    personEntity: ExtractedEntity,
    associatedEntities: ExtractedEntity[]
  ): number {
    if (associatedEntities.length === 0) {
      return personEntity.confidence * 0.5 // Lower confidence without associated data
    }

    // Weight by entity type importance
    const weights: Partial<Record<EntityType, number>> = {
      CPF: 1.5,
      RG: 1.3,
      DATE: 1.0,
      EMAIL: 0.8,
      PHONE: 0.8,
      ADDRESS: 0.7,
      RELATIONSHIP: 0.6,
    }

    let totalWeight = 1.0 // For the person entity
    let weightedSum = personEntity.confidence

    for (const entity of associatedEntities) {
      const weight = weights[entity.type] || 0.5
      totalWeight += weight
      weightedSum += entity.confidence * weight
    }

    return weightedSum / totalWeight
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = this.normalizeName(name1)
    const normalized2 = this.normalizeName(name2)

    if (normalized1 === normalized2) return 1

    // Check if one is contained in the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2
      const longer = normalized1.length < normalized2.length ? normalized2 : normalized1
      return shorter.length / longer.length
    }

    // Calculate Levenshtein similarity
    return this.levenshteinSimilarity(normalized1, normalized2)
  }

  /**
   * Calculate address similarity
   */
  private calculateAddressSimilarity(addr1: Address, addr2: Address): number {
    let matchScore = 0
    let totalFields = 0

    const compareField = (a: string | undefined, b: string | undefined): number => {
      if (!a && !b) return 1
      if (!a || !b) return 0
      const normA = a.toLowerCase().trim()
      const normB = b.toLowerCase().trim()
      return normA === normB ? 1 : this.levenshteinSimilarity(normA, normB)
    }

    // Compare each address field
    const fields: (keyof Address)[] = ['street', 'number', 'neighborhood', 'city', 'state', 'zip']
    for (const field of fields) {
      const similarity = compareField(addr1[field] as string, addr2[field] as string)
      matchScore += similarity
      totalFields++
    }

    return totalFields > 0 ? matchScore / totalFields : 0
  }

  /**
   * Normalize CPF: remove formatting, keep only digits
   */
  private normalizeCpf(value: string): string {
    return value.replace(/\D/g, '').padStart(11, '0')
  }

  /**
   * Normalize RG: remove formatting
   */
  private normalizeRg(value: string): string {
    return value.replace(/[.\-\s]/g, '').toUpperCase()
  }

  /**
   * Normalize name: remove accents, extra spaces, lowercase
   */
  private normalizeName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Normalize date to ISO format
   */
  private normalizeDate(value: string): string {
    const cleaned = value.trim()

    // Try DD/MM/YYYY or DD-MM-YYYY (Brazilian format)
    const brMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (brMatch) {
      const day = brMatch[1].padStart(2, '0')
      const month = brMatch[2].padStart(2, '0')
      const year = brMatch[3]
      return `${year}-${month}-${day}`
    }

    // Try ISO format
    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    }

    return cleaned
  }

  /**
   * Parse address string into Address object
   */
  private parseAddress(addressStr: string): Address {
    // Basic address parsing - can be enhanced with more sophisticated parsing
    const parts = addressStr.split(',').map(p => p.trim())

    return {
      street: parts[0] || '',
      number: this.extractNumber(parts[0] || '') || '',
      complement: parts.length > 3 ? parts[1] : undefined,
      neighborhood: parts.length > 2 ? parts[parts.length - 3] : '',
      city: parts.length > 1 ? parts[parts.length - 2] : '',
      state: this.extractState(parts[parts.length - 1] || '') || '',
      zip: this.extractZip(addressStr) || '',
    }
  }

  /**
   * Extract street number from address string
   */
  private extractNumber(str: string): string {
    const match = str.match(/,?\s*(?:n[º°\.ú]?\s*)?(\d+)/i)
    return match ? match[1] : ''
  }

  /**
   * Extract state abbreviation from address string
   */
  private extractState(str: string): string {
    const match = str.match(/\b([A-Z]{2})\b/)
    return match ? match[1] : ''
  }

  /**
   * Extract ZIP code (CEP) from address string
   */
  private extractZip(str: string): string {
    const match = str.match(/\d{5}-?\d{3}/)
    return match ? match[0].replace('-', '') : ''
  }

  /**
   * Extract name from relationship context
   * e.g., "filho de JOÃO DA SILVA" -> "JOÃO DA SILVA"
   */
  private extractNameFromRelationship(value: string): string {
    // Remove relationship words
    const cleaned = value
      .replace(/filho|filha|de|da|do|das|dos|pai|mãe|mae|father|mother|child|of/gi, '')
      .trim()

    return cleaned
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
  updateConfig(config: Partial<EntityMatcherConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): EntityMatcherConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const entityMatcher = new EntityMatcher()

// Export factory function for custom configurations
export function createEntityMatcher(config?: Partial<EntityMatcherConfig>): EntityMatcher {
  return new EntityMatcher(config)
}
