import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../src/types/database'
import type { Person, Evidence, Address, MaritalStatus, BoundingBox } from '../../../src/types/index'
import type {
  PersonCandidate,
  EntitySource,
} from '../types'

/**
 * Result of building a person record
 */
export interface PersonBuildResult {
  /** The created or updated person record */
  person: Person
  /** Whether the record was newly created or updated */
  isNew: boolean
  /** Evidence records created for traceability */
  evidenceCreated: number
  /** Source documents associated with this person */
  sourceDocuments: string[]
}

/**
 * Result of a batch build operation
 */
export interface BatchBuildResult {
  /** Successfully built persons */
  persons: PersonBuildResult[]
  /** Number of persons that were merged with existing records */
  mergedCount: number
  /** Number of new persons created */
  createdCount: number
  /** Errors encountered during the process */
  errors: Array<{ candidate: PersonCandidate; error: string }>
}

/**
 * Options for looking up existing persons
 */
export interface PersonLookupOptions {
  /** Case ID to search within */
  caseId: string
  /** CPF to match (highest priority) */
  cpf?: string | null
  /** RG to match */
  rg?: string | null
  /** Full name for similarity matching */
  fullName?: string
}

/**
 * Configuration for PersonBuilder
 */
export interface PersonBuilderConfig {
  /** Whether to create evidence records for extracted fields */
  createEvidence: boolean
  /** Whether to update existing persons with new data */
  updateExisting: boolean
  /** Minimum confidence threshold for updating a field */
  minConfidenceForUpdate: number
  /** Whether to merge source_docs arrays when updating */
  mergeSourceDocs: boolean
}

const DEFAULT_CONFIG: PersonBuilderConfig = {
  createEvidence: true,
  updateExisting: true,
  minConfidenceForUpdate: 0.6,
  mergeSourceDocs: true,
}

/**
 * PersonBuilder service for constructing Person records from PersonCandidate entities.
 *
 * This service handles:
 * 1. Building Person records from PersonCandidate objects
 * 2. Persisting to Supabase database
 * 3. Creating Evidence records for traceability
 * 4. Finding existing persons for deduplication
 * 5. Merging new data with existing Person records
 */
export class PersonBuilder {
  private supabase: SupabaseClient<Database>
  private config: PersonBuilderConfig

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string,
    config?: Partial<PersonBuilderConfig>
  ) {
    const url = supabaseUrl || process.env.SUPABASE_URL || ''
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    this.supabase = createClient<Database>(url, key)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Build and persist a Person record from a PersonCandidate
   */
  async buildPerson(
    caseId: string,
    candidate: PersonCandidate
  ): Promise<PersonBuildResult> {
    // Try to find an existing person with matching identifiers
    const existingPerson = await this.findExistingPerson({
      caseId,
      cpf: candidate.cpf,
      rg: candidate.rg,
      fullName: candidate.full_name,
    })

    if (existingPerson && this.config.updateExisting) {
      // Update existing person with new data
      return this.updateExistingPerson(existingPerson, candidate)
    }

    // Create a new person
    return this.createNewPerson(caseId, candidate)
  }

  /**
   * Build and persist multiple Person records from candidates
   */
  async buildPersons(
    caseId: string,
    candidates: PersonCandidate[]
  ): Promise<BatchBuildResult> {
    const results: PersonBuildResult[] = []
    const errors: Array<{ candidate: PersonCandidate; error: string }> = []
    let mergedCount = 0
    let createdCount = 0

    for (const candidate of candidates) {
      try {
        const result = await this.buildPerson(caseId, candidate)
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
      persons: results,
      mergedCount,
      createdCount,
      errors,
    }
  }

  /**
   * Find an existing Person by identifiers
   */
  async findExistingPerson(options: PersonLookupOptions): Promise<Person | null> {
    const { caseId, cpf, rg, fullName } = options

    // Priority 1: Match by CPF (most reliable)
    if (cpf) {
      const normalizedCpf = this.normalizeCpf(cpf)
      const { data: personByCpf } = await this.supabase
        .from('people')
        .select('*')
        .eq('case_id', caseId)
        .ilike('cpf', `%${normalizedCpf.slice(-6)}%`) // Match last 6 digits to handle formatting differences
        .limit(1)
        .single()

      if (personByCpf && this.normalizeCpf(personByCpf.cpf || '') === normalizedCpf) {
        return personByCpf
      }
    }

    // Priority 2: Match by RG
    if (rg) {
      const normalizedRg = this.normalizeRg(rg)
      const { data: personByRg } = await this.supabase
        .from('people')
        .select('*')
        .eq('case_id', caseId)
        .not('rg', 'is', null)
        .limit(10)

      if (personByRg) {
        for (const person of personByRg) {
          if (person.rg && this.normalizeRg(person.rg) === normalizedRg) {
            return person
          }
        }
      }
    }

    // Priority 3: Match by exact name (as a fallback)
    if (fullName) {
      const normalizedName = this.normalizeName(fullName)
      const { data: personsByName } = await this.supabase
        .from('people')
        .select('*')
        .eq('case_id', caseId)
        .limit(20)

      if (personsByName) {
        for (const person of personsByName) {
          if (this.normalizeName(person.full_name) === normalizedName) {
            return person
          }
        }
      }
    }

    return null
  }

  /**
   * Find all existing persons in a case
   */
  async findAllPersonsInCase(caseId: string): Promise<Person[]> {
    const { data, error } = await this.supabase
      .from('people')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch persons: ${error.message}`)
    }

    return data || []
  }

  /**
   * Create a new Person record from a candidate
   */
  private async createNewPerson(
    caseId: string,
    candidate: PersonCandidate
  ): Promise<PersonBuildResult> {
    // Prepare the person data
    const personData: Omit<Person, 'id' | 'created_at' | 'updated_at'> = {
      case_id: caseId,
      full_name: candidate.full_name,
      cpf: candidate.cpf,
      rg: candidate.rg,
      rg_issuer: candidate.rg_issuer,
      birth_date: candidate.birth_date,
      nationality: candidate.nationality,
      marital_status: candidate.marital_status,
      profession: candidate.profession,
      address: candidate.address,
      email: candidate.email,
      phone: candidate.phone,
      father_name: candidate.father_name,
      mother_name: candidate.mother_name,
      confidence: candidate.confidence,
      source_docs: candidate.source_docs,
      metadata: candidate.metadata,
    }

    // Insert the person
    const { data: person, error } = await this.supabase
      .from('people')
      .insert(personData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create person: ${error.message}`)
    }

    if (!person) {
      throw new Error('Person creation returned no data')
    }

    // Create evidence records
    let evidenceCreated = 0
    if (this.config.createEvidence && candidate.source_entities.length > 0) {
      evidenceCreated = await this.createEvidenceRecords(person.id, candidate.source_entities)
    }

    return {
      person,
      isNew: true,
      evidenceCreated,
      sourceDocuments: candidate.source_docs,
    }
  }

  /**
   * Update an existing Person record with new data from a candidate
   */
  private async updateExistingPerson(
    existingPerson: Person,
    candidate: PersonCandidate
  ): Promise<PersonBuildResult> {
    // Prepare update data - only update fields with higher confidence or fill missing fields
    const updateData: Partial<Person> = {}

    // Update fields that are missing in the existing record or have higher confidence in the candidate
    if (!existingPerson.rg && candidate.rg) {
      updateData.rg = candidate.rg
    }
    if (!existingPerson.rg_issuer && candidate.rg_issuer) {
      updateData.rg_issuer = candidate.rg_issuer
    }
    if (!existingPerson.birth_date && candidate.birth_date) {
      updateData.birth_date = candidate.birth_date
    }
    if (!existingPerson.nationality && candidate.nationality) {
      updateData.nationality = candidate.nationality
    }
    if (!existingPerson.marital_status && candidate.marital_status) {
      updateData.marital_status = candidate.marital_status
    }
    if (!existingPerson.profession && candidate.profession) {
      updateData.profession = candidate.profession
    }
    if (!existingPerson.address && candidate.address) {
      updateData.address = candidate.address
    }
    if (!existingPerson.email && candidate.email) {
      updateData.email = candidate.email
    }
    if (!existingPerson.phone && candidate.phone) {
      updateData.phone = candidate.phone
    }
    if (!existingPerson.father_name && candidate.father_name) {
      updateData.father_name = candidate.father_name
    }
    if (!existingPerson.mother_name && candidate.mother_name) {
      updateData.mother_name = candidate.mother_name
    }

    // Merge source documents
    if (this.config.mergeSourceDocs) {
      const mergedSourceDocs = Array.from(
        new Set([...existingPerson.source_docs, ...candidate.source_docs])
      )
      if (mergedSourceDocs.length > existingPerson.source_docs.length) {
        updateData.source_docs = mergedSourceDocs
      }
    }

    // Update confidence if new one is higher
    if (candidate.confidence > existingPerson.confidence) {
      updateData.confidence = candidate.confidence
    }

    // Merge metadata
    if (Object.keys(candidate.metadata).length > 0) {
      updateData.metadata = { ...existingPerson.metadata, ...candidate.metadata }
    }

    // Only update if there are changes
    let updatedPerson = existingPerson
    if (Object.keys(updateData).length > 0) {
      const { data: updated, error } = await this.supabase
        .from('people')
        .update(updateData)
        .eq('id', existingPerson.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update person: ${error.message}`)
      }

      if (updated) {
        updatedPerson = updated
      }
    }

    // Create evidence records for new source entities
    let evidenceCreated = 0
    if (this.config.createEvidence && candidate.source_entities.length > 0) {
      evidenceCreated = await this.createEvidenceRecords(existingPerson.id, candidate.source_entities)
    }

    return {
      person: updatedPerson,
      isNew: false,
      evidenceCreated,
      sourceDocuments: updatedPerson.source_docs,
    }
  }

  /**
   * Create Evidence records for a Person's extracted fields
   */
  private async createEvidenceRecords(
    personId: string,
    sourceEntities: EntitySource[]
  ): Promise<number> {
    if (sourceEntities.length === 0) {
      return 0
    }

    const evidenceRecords: Array<Omit<Evidence, 'id' | 'created_at'>> = []

    for (const source of sourceEntities) {
      const evidenceRecord: Omit<Evidence, 'id' | 'created_at'> = {
        entity_type: 'person',
        entity_id: personId,
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
    entityType: 'person' | 'property',
    entityId: string,
    fieldName: string,
    documentId: string,
    extractedText: string,
    confidence: number,
    pageNumber?: number,
    boundingBox?: BoundingBox | null,
    source: 'ocr' | 'llm' | 'consensus' = 'llm'
  ): Promise<Evidence | null> {
    const evidenceData: Omit<Evidence, 'id' | 'created_at'> = {
      entity_type: entityType,
      entity_id: entityId,
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
   * Get all evidence for a person
   */
  async getEvidenceForPerson(personId: string): Promise<Evidence[]> {
    const { data, error } = await this.supabase
      .from('evidence')
      .select('*')
      .eq('entity_type', 'person')
      .eq('entity_id', personId)
      .order('field_name')

    if (error) {
      throw new Error(`Failed to fetch evidence: ${error.message}`)
    }

    return data || []
  }

  /**
   * Delete a person and all associated evidence
   */
  async deletePerson(personId: string): Promise<boolean> {
    // Delete evidence first (due to foreign key constraints)
    await this.supabase
      .from('evidence')
      .delete()
      .eq('entity_type', 'person')
      .eq('entity_id', personId)

    // Delete the person
    const { error } = await this.supabase
      .from('people')
      .delete()
      .eq('id', personId)

    if (error) {
      console.error(`Failed to delete person: ${error.message}`)
      return false
    }

    return true
  }

  /**
   * Merge two Person records
   * The primary person is kept, secondary is merged into it and deleted
   */
  async mergePersons(
    primaryPersonId: string,
    secondaryPersonId: string
  ): Promise<Person | null> {
    // Get both persons
    const { data: persons, error: fetchError } = await this.supabase
      .from('people')
      .select('*')
      .in('id', [primaryPersonId, secondaryPersonId])

    if (fetchError || !persons || persons.length !== 2) {
      console.error('Failed to fetch persons for merge')
      return null
    }

    const primary = persons.find(p => p.id === primaryPersonId)
    const secondary = persons.find(p => p.id === secondaryPersonId)

    if (!primary || !secondary) {
      console.error('One or both persons not found')
      return null
    }

    // Merge data from secondary into primary
    const updateData: Partial<Person> = {}

    // Fill missing fields from secondary
    if (!primary.cpf && secondary.cpf) updateData.cpf = secondary.cpf
    if (!primary.rg && secondary.rg) updateData.rg = secondary.rg
    if (!primary.rg_issuer && secondary.rg_issuer) updateData.rg_issuer = secondary.rg_issuer
    if (!primary.birth_date && secondary.birth_date) updateData.birth_date = secondary.birth_date
    if (!primary.nationality && secondary.nationality) updateData.nationality = secondary.nationality
    if (!primary.marital_status && secondary.marital_status) updateData.marital_status = secondary.marital_status
    if (!primary.profession && secondary.profession) updateData.profession = secondary.profession
    if (!primary.address && secondary.address) updateData.address = secondary.address
    if (!primary.email && secondary.email) updateData.email = secondary.email
    if (!primary.phone && secondary.phone) updateData.phone = secondary.phone
    if (!primary.father_name && secondary.father_name) updateData.father_name = secondary.father_name
    if (!primary.mother_name && secondary.mother_name) updateData.mother_name = secondary.mother_name

    // Merge source_docs
    updateData.source_docs = Array.from(
      new Set([...primary.source_docs, ...secondary.source_docs])
    )

    // Merge metadata
    updateData.metadata = { ...secondary.metadata, ...primary.metadata }

    // Average confidence
    updateData.confidence = (primary.confidence + secondary.confidence) / 2

    // Update primary person
    const { data: updated, error: updateError } = await this.supabase
      .from('people')
      .update(updateData)
      .eq('id', primaryPersonId)
      .select()
      .single()

    if (updateError) {
      console.error(`Failed to update primary person during merge: ${updateError.message}`)
      return null
    }

    // Reassign evidence from secondary to primary
    await this.supabase
      .from('evidence')
      .update({ entity_id: primaryPersonId })
      .eq('entity_type', 'person')
      .eq('entity_id', secondaryPersonId)

    // Reassign graph edges from secondary to primary
    await this.supabase
      .from('graph_edges')
      .update({ source_id: primaryPersonId })
      .eq('source_type', 'person')
      .eq('source_id', secondaryPersonId)

    await this.supabase
      .from('graph_edges')
      .update({ target_id: primaryPersonId })
      .eq('target_type', 'person')
      .eq('target_id', secondaryPersonId)

    // Delete secondary person
    await this.supabase
      .from('people')
      .delete()
      .eq('id', secondaryPersonId)

    return updated
  }

  /**
   * Check if a CPF is valid using the standard Brazilian validation algorithm
   */
  validateCpf(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '')

    if (cleaned.length !== 11) return false

    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Validate first check digit
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i)
    }
    let digit = (sum * 10) % 11
    if (digit === 10) digit = 0
    if (digit !== parseInt(cleaned[9])) return false

    // Validate second check digit
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i)
    }
    digit = (sum * 10) % 11
    if (digit === 10) digit = 0
    if (digit !== parseInt(cleaned[10])) return false

    return true
  }

  /**
   * Format CPF for display (XXX.XXX.XXX-XX)
   */
  formatCpf(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '').padStart(11, '0')
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`
  }

  // ============ Helper Functions ============

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
   * Update configuration
   */
  updateConfig(config: Partial<PersonBuilderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): PersonBuilderConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const personBuilder = new PersonBuilder()

// Export factory function for custom configurations
export function createPersonBuilder(
  supabaseUrl?: string,
  supabaseKey?: string,
  config?: Partial<PersonBuilderConfig>
): PersonBuilder {
  return new PersonBuilder(supabaseUrl, supabaseKey, config)
}
