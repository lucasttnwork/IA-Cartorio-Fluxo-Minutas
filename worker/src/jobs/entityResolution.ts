import { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type {
  ProcessingJob,
  ExtractedEntity,
  PersonCandidate,
  PropertyCandidate,
  MergeSuggestionReason,
  MergeSuggestionStatus,
  EntityExtractionResult,
  EntitySource,
  Address,
  Encumbrance,
} from '../types'
import {
  EntityMatcher,
  createEntityMatcher,
  CandidateComparisonResult,
  DocumentEntityGroup,
} from '../services/EntityMatcher'
import {
  createPersonBuilder,
} from '../services/PersonBuilder'
import {
  createPropertyExtractor,
  PropertyMatchResult,
} from '../services/propertyExtractor'
import {
  createPropertyMatcher,
} from '../services/propertyMatcher'

/**
 * Relationship type for graph edges (mirrors frontend RelationshipType)
 */
export type RelationshipType =
  | 'spouse_of'
  | 'represents'
  | 'owns'
  | 'sells'
  | 'buys'
  | 'guarantor_of'
  | 'witness_for'

/**
 * Graph edge insert data
 */
export interface GraphEdgeInsert {
  case_id: string
  source_type: 'person' | 'property'
  source_id: string
  target_type: 'person' | 'property'
  target_id: string
  relationship: RelationshipType
  confidence: number
  confirmed: boolean
  metadata: Record<string, unknown>
}

/**
 * Result of the entity resolution job
 */
export interface EntityResolutionResult {
  status: 'completed' | 'failed'
  people_created: number
  people_updated: number
  properties_created: number
  properties_updated: number
  merges_applied: number
  merge_suggestions_created: number
  evidence_created: number
  graph_edges_created: number
  documents_processed: number
  deed_documents_processed: number
  processing_time_ms: number
  errors: string[]
}

/**
 * Internal tracking for merge operations
 */
interface MergeCandidate {
  candidateA: PersonCandidate
  candidateB: PersonCandidate
  comparison: CandidateComparisonResult
}

/**
 * Run the entity resolution job
 *
 * This job:
 * 1. Fetches all extracted entities for documents in the case
 * 2. Groups entities by document and matches related entities (name + CPF, etc.)
 * 3. Builds PersonCandidate records from grouped entities
 * 4. Applies deduplication logic:
 *    - CPF match = auto-merge
 *    - RG match = suggest merge
 *    - Name + birth date = suggest merge
 *    - Similar names = suggest merge
 * 5. Prepares candidates for evidence creation:
 *    - Ensures all source entities have valid UUIDs
 *    - Creates synthetic source entities for fields without explicit sources
 * 6. Creates/updates Person records in the database
 * 7. Creates evidence links for traceability (links each extracted field to its source document)
 * 8. Logs evidence creation summary for debugging and auditing
 * 9. Creates merge suggestions for manual review
 * 10. Detects deed documents (escrituras) and extracts property data
 * 11. Creates/updates Property records with deduplication by registry number
 */
export async function runEntityResolutionJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  const startTime = Date.now()
  console.log(`Running entity resolution job for case ${job.case_id}`)

  const result: EntityResolutionResult = {
    status: 'completed',
    people_created: 0,
    people_updated: 0,
    properties_created: 0,
    properties_updated: 0,
    merges_applied: 0,
    merge_suggestions_created: 0,
    evidence_created: 0,
    graph_edges_created: 0,
    documents_processed: 0,
    deed_documents_processed: 0,
    processing_time_ms: 0,
    errors: [],
  }

  try {
    // Initialize services
    const entityMatcher = createEntityMatcher()
    const personBuilder = createPersonBuilder()
    const propertyExtractor = createPropertyExtractor()
    const propertyMatcher = createPropertyMatcher()

    // Step 1: Get all documents in the case
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, doc_type, status')
      .eq('case_id', job.case_id)
      .in('status', ['processed', 'needs_review', 'approved'])

    if (docsError) {
      throw new Error(`Failed to fetch documents: ${docsError.message}`)
    }

    if (!documents || documents.length === 0) {
      console.log('No processed documents found for entity resolution')
      result.processing_time_ms = Date.now() - startTime
      return result
    }

    console.log(`Found ${documents.length} documents for entity resolution`)

    // Step 2: Get all extraction results for these documents
    const documentIds = documents.map(d => d.id)
    const { data: extractions, error: extractError } = await supabase
      .from('extractions')
      .select('*')
      .in('document_id', documentIds)

    if (extractError) {
      throw new Error(`Failed to fetch extractions: ${extractError.message}`)
    }

    if (!extractions || extractions.length === 0) {
      console.log('No extractions found for documents')
      result.processing_time_ms = Date.now() - startTime
      return result
    }

    // Step 3: Collect all extracted entities from all documents
    const allEntities: ExtractedEntity[] = []

    for (const extraction of extractions) {
      const llmResult = extraction.llm_result as Record<string, unknown> | null
      if (!llmResult) continue

      const entityExtraction = llmResult.entity_extraction as EntityExtractionResult | null
      if (!entityExtraction || !entityExtraction.entities) continue

      // Add document_id to each entity if not present
      const entities = entityExtraction.entities.map(entity => ({
        ...entity,
        document_id: entity.document_id || extraction.document_id,
      }))

      allEntities.push(...entities)
      result.documents_processed++
    }

    console.log(`Collected ${allEntities.length} entities from ${result.documents_processed} documents`)

    if (allEntities.length === 0) {
      console.log('No entities found for resolution')
      result.processing_time_ms = Date.now() - startTime
      return result
    }

    // Step 4: Group entities by document
    const documentGroups = entityMatcher.groupByDocument(allEntities)

    // Step 5: Build PersonCandidate records from each document
    const allCandidates: PersonCandidate[] = []

    for (const [documentId, group] of documentGroups) {
      try {
        const matchResults = entityMatcher.matchPersonEntities(group)

        for (const matchResult of matchResults) {
          allCandidates.push(matchResult.candidate)
        }

        console.log(`Built ${matchResults.length} person candidates from document ${documentId}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Error processing document ${documentId}: ${errorMessage}`)
        result.errors.push(`Document ${documentId}: ${errorMessage}`)
      }
    }

    console.log(`Total person candidates: ${allCandidates.length}`)

    if (allCandidates.length === 0) {
      console.log('No person candidates found')
      result.processing_time_ms = Date.now() - startTime
      return result
    }

    // Step 6: Find duplicates and apply deduplication logic
    const { mergedCandidates, mergeSuggestions } = await processDeduplication(
      entityMatcher,
      allCandidates,
      job.case_id
    )

    console.log(`After deduplication: ${mergedCandidates.length} unique candidates, ${mergeSuggestions.length} merge suggestions`)

    // Step 7: Prepare candidates for evidence creation
    // Ensure all source entities have valid IDs for evidence traceability
    const preparedCandidates = prepareCandidatesForEvidence(mergedCandidates)

    console.log(`Prepared ${preparedCandidates.length} candidates for evidence creation`)

    // Step 8: Build and persist Person records with evidence
    const buildResult = await personBuilder.buildPersons(job.case_id, preparedCandidates)

    result.people_created = buildResult.createdCount
    result.people_updated = buildResult.mergedCount
    result.evidence_created = buildResult.persons.reduce((sum, p) => sum + p.evidenceCreated, 0)

    // Log evidence creation summary for debugging
    logEvidenceSummary(preparedCandidates, result.evidence_created)

    // Log any errors from building
    for (const error of buildResult.errors) {
      result.errors.push(`Failed to create person "${error.candidate.full_name}": ${error.error}`)
    }

    // Step 9: Create merge suggestions in the database
    if (mergeSuggestions.length > 0) {
      const suggestionsCreated = await createMergeSuggestions(
        supabase,
        job.case_id,
        mergeSuggestions,
        buildResult.persons.map(p => p.person)
      )
      result.merge_suggestions_created = suggestionsCreated
    }

    // Step 10: Extract properties from deed documents
    // Build a map of document types for quick lookup
    const documentTypeMap = new Map<string, string>()
    for (const doc of documents) {
      documentTypeMap.set(doc.id, doc.doc_type || '')
    }

    // Extract property candidates from each document
    const allPropertyCandidates: PropertyCandidate[] = []

    for (const [documentId, group] of documentGroups) {
      try {
        const docType = documentTypeMap.get(documentId) || ''

        // Check if this document is a deed
        const isDeed = propertyExtractor.isDeedDocument(docType)

        // Also check if the document has PROPERTY_REGISTRY entities
        const hasPropertyRegistry = group.entitiesByType.get('PROPERTY_REGISTRY')?.length ?? 0 > 0

        if (isDeed || hasPropertyRegistry) {
          console.log(`Processing deed document ${documentId} for property extraction`)
          result.deed_documents_processed++

          // Extract property candidates from this document
          const propertyResults = propertyExtractor.extractProperties(group)

          for (const propResult of propertyResults) {
            allPropertyCandidates.push(propResult.candidate)
          }

          console.log(`Extracted ${propertyResults.length} property candidates from document ${documentId}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Error extracting properties from document ${documentId}: ${errorMessage}`)
        result.errors.push(`Property extraction for document ${documentId}: ${errorMessage}`)
      }
    }

    console.log(`Total property candidates extracted: ${allPropertyCandidates.length}`)

    // Step 11: Deduplicate and persist Property records
    if (allPropertyCandidates.length > 0) {
      try {
        // Process property deduplication and persistence
        const { buildResult: propertyBuildResult, preparedCandidates: preparedPropertyCandidates } =
          await processPropertyDeduplication(
            propertyMatcher,
            allPropertyCandidates,
            job.case_id
          )

        result.properties_created = propertyBuildResult.createdCount
        result.properties_updated = propertyBuildResult.mergedCount
        result.evidence_created += propertyBuildResult.properties.reduce(
          (sum, p) => sum + p.evidenceCreated,
          0
        )

        // Log property creation summary
        console.log(`Property resolution completed:`, {
          properties_created: result.properties_created,
          properties_updated: result.properties_updated,
        })

        // Log property evidence creation summary for debugging
        logPropertyEvidenceSummary(preparedPropertyCandidates, propertyBuildResult.properties.reduce(
          (sum, p) => sum + p.evidenceCreated,
          0
        ))

        // Log any errors from property building
        for (const error of propertyBuildResult.errors) {
          const registryNum = error.candidate.registry_number || 'unknown'
          result.errors.push(`Failed to create property "${registryNum}": ${error.error}`)
        }

        // Step 12: Create graph edges for property-person relationships
        // Link properties to people found in the same documents
        if (propertyBuildResult.properties.length > 0 && buildResult.persons.length > 0) {
          try {
            const edgesCreated = await createPropertyPersonEdges(
              supabase,
              job.case_id,
              propertyBuildResult.properties,
              buildResult.persons,
              documentGroups,
              documentTypeMap
            )
            result.graph_edges_created = edgesCreated

            console.log(`Created ${edgesCreated} graph edges for property-person relationships`)
          } catch (edgeError) {
            const edgeErrorMessage = edgeError instanceof Error ? edgeError.message : String(edgeError)
            console.error('Graph edge creation failed:', edgeErrorMessage)
            result.errors.push(`Graph edge creation: ${edgeErrorMessage}`)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Property resolution failed:', errorMessage)
        result.errors.push(`Property resolution: ${errorMessage}`)
      }
    }

    result.processing_time_ms = Date.now() - startTime
    console.log(`Entity resolution completed in ${result.processing_time_ms}ms:`, {
      people_created: result.people_created,
      people_updated: result.people_updated,
      properties_created: result.properties_created,
      properties_updated: result.properties_updated,
      merge_suggestions: result.merge_suggestions_created,
      evidence_created: result.evidence_created,
      graph_edges_created: result.graph_edges_created,
      deed_documents_processed: result.deed_documents_processed,
    })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Entity resolution job failed:', errorMessage)

    result.status = 'failed'
    result.errors.push(errorMessage)
    result.processing_time_ms = Date.now() - startTime

    return result
  }
}

/**
 * Process deduplication logic
 *
 * Returns:
 * - mergedCandidates: Deduplicated list of candidates (with auto-merges applied)
 * - mergeSuggestions: List of potential merges that need user review
 */
async function processDeduplication(
  entityMatcher: EntityMatcher,
  candidates: PersonCandidate[],
  caseId: string
): Promise<{
  mergedCandidates: PersonCandidate[]
  mergeSuggestions: Array<{
    candidateA: PersonCandidate
    candidateB: PersonCandidate
    comparison: CandidateComparisonResult
  }>
}> {
  // Build CPF index for quick deduplication
  const cpfIndex = new Map<string, PersonCandidate[]>()
  const candidatesWithoutCpf: PersonCandidate[] = []

  for (const candidate of candidates) {
    if (candidate.cpf) {
      const normalizedCpf = normalizeCpf(candidate.cpf)
      if (!cpfIndex.has(normalizedCpf)) {
        cpfIndex.set(normalizedCpf, [])
      }
      cpfIndex.get(normalizedCpf)!.push(candidate)
    } else {
      candidatesWithoutCpf.push(candidate)
    }
  }

  const mergedCandidates: PersonCandidate[] = []
  const mergeSuggestions: MergeCandidate[] = []
  const processedCandidates = new Set<PersonCandidate>()

  // Process candidates with CPF - auto-merge duplicates
  for (const [cpf, candidatesWithCpf] of cpfIndex) {
    if (candidatesWithCpf.length === 1) {
      mergedCandidates.push(candidatesWithCpf[0])
      processedCandidates.add(candidatesWithCpf[0])
    } else {
      // Multiple candidates with same CPF - merge them
      let merged = candidatesWithCpf[0]
      for (let i = 1; i < candidatesWithCpf.length; i++) {
        merged = entityMatcher.mergeCandidates(merged, candidatesWithCpf[i])
        processedCandidates.add(candidatesWithCpf[i])
      }
      mergedCandidates.push(merged)
      processedCandidates.add(candidatesWithCpf[0])

      console.log(`Auto-merged ${candidatesWithCpf.length} candidates with CPF ${cpf}`)
    }
  }

  // Process candidates without CPF - check for potential duplicates
  for (let i = 0; i < candidatesWithoutCpf.length; i++) {
    const candidateA = candidatesWithoutCpf[i]

    if (processedCandidates.has(candidateA)) continue

    let wasMerged = false

    // Check against existing merged candidates
    for (let j = 0; j < mergedCandidates.length; j++) {
      const candidateB = mergedCandidates[j]
      const comparison = entityMatcher.compareCandidates(candidateA, candidateB)

      if (comparison.shouldAutoMerge) {
        // Auto-merge
        mergedCandidates[j] = entityMatcher.mergeCandidates(candidateB, candidateA)
        processedCandidates.add(candidateA)
        wasMerged = true
        console.log(`Auto-merged candidate "${candidateA.full_name}" with existing "${candidateB.full_name}"`)
        break
      } else if (comparison.shouldSuggestMerge && comparison.reason) {
        // Create merge suggestion
        mergeSuggestions.push({
          candidateA,
          candidateB,
          comparison,
        })
      }
    }

    if (!wasMerged) {
      // Check against other candidates without CPF
      for (let j = i + 1; j < candidatesWithoutCpf.length; j++) {
        const candidateB = candidatesWithoutCpf[j]

        if (processedCandidates.has(candidateB)) continue

        const comparison = entityMatcher.compareCandidates(candidateA, candidateB)

        if (comparison.shouldAutoMerge) {
          // Merge these two
          const merged = entityMatcher.mergeCandidates(candidateA, candidateB)
          mergedCandidates.push(merged)
          processedCandidates.add(candidateA)
          processedCandidates.add(candidateB)
          wasMerged = true
          console.log(`Auto-merged candidates "${candidateA.full_name}" and "${candidateB.full_name}"`)
          break
        } else if (comparison.shouldSuggestMerge && comparison.reason) {
          // Create merge suggestion (will be processed after both are created)
          mergeSuggestions.push({
            candidateA,
            candidateB,
            comparison,
          })
        }
      }
    }

    if (!wasMerged && !processedCandidates.has(candidateA)) {
      mergedCandidates.push(candidateA)
      processedCandidates.add(candidateA)
    }
  }

  return { mergedCandidates, mergeSuggestions }
}

/**
 * Create merge suggestions in the database
 *
 * Note: We need to match candidates to their created Person IDs
 * Since candidates are matched to Persons by CPF or name, we need to look them up
 */
async function createMergeSuggestions(
  supabase: SupabaseClient,
  caseId: string,
  suggestions: MergeCandidate[],
  createdPersons: Array<{ id: string; full_name: string; cpf: string | null }>
): Promise<number> {
  if (suggestions.length === 0 || createdPersons.length === 0) {
    return 0
  }

  // Build lookup index by name and CPF
  const personByName = new Map<string, string>()
  const personByCpf = new Map<string, string>()

  for (const person of createdPersons) {
    personByName.set(normalizeName(person.full_name), person.id)
    if (person.cpf) {
      personByCpf.set(normalizeCpf(person.cpf), person.id)
    }
  }

  const findPersonId = (candidate: PersonCandidate): string | null => {
    // Try CPF first
    if (candidate.cpf) {
      const id = personByCpf.get(normalizeCpf(candidate.cpf))
      if (id) return id
    }
    // Try name
    return personByName.get(normalizeName(candidate.full_name)) || null
  }

  let created = 0
  const insertedPairs = new Set<string>()

  for (const suggestion of suggestions) {
    try {
      const personAId = findPersonId(suggestion.candidateA)
      const personBId = findPersonId(suggestion.candidateB)

      if (!personAId || !personBId) {
        console.warn(`Could not find person IDs for merge suggestion`)
        continue
      }

      // Skip if both IDs are the same (already merged)
      if (personAId === personBId) {
        continue
      }

      // Ensure person_a_id < person_b_id for the constraint
      const [orderedA, orderedB] = personAId < personBId
        ? [personAId, personBId]
        : [personBId, personAId]

      // Check for duplicate pairs
      const pairKey = `${orderedA}:${orderedB}`
      if (insertedPairs.has(pairKey)) {
        continue
      }
      insertedPairs.add(pairKey)

      const suggestionData = {
        case_id: caseId,
        person_a_id: orderedA,
        person_b_id: orderedB,
        reason: suggestion.comparison.reason as MergeSuggestionReason,
        confidence: suggestion.comparison.confidence,
        similarity_score: suggestion.comparison.similarityScore,
        status: 'pending' as MergeSuggestionStatus,
        matching_fields: suggestion.comparison.matchingFields,
        conflicting_fields: suggestion.comparison.conflictingFields,
        notes: null,
      }

      const { error } = await supabase
        .from('merge_suggestions')
        .insert(suggestionData)

      if (error) {
        // Ignore duplicate constraint violations
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          console.error(`Failed to create merge suggestion: ${error.message}`)
        }
      } else {
        created++
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error creating merge suggestion: ${errorMessage}`)
    }
  }

  return created
}

// Helper functions

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '').padStart(11, '0')
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Ensure all EntitySource entries have valid entity IDs.
 * Generates UUIDs for entries with missing or empty entity_id.
 * This is critical for creating valid evidence records.
 */
function ensureEntitySourceIds(candidate: PersonCandidate): PersonCandidate {
  const updatedSourceEntities = candidate.source_entities.map(source => {
    if (!source.entity_id || source.entity_id.trim() === '') {
      return {
        ...source,
        entity_id: randomUUID(),
      }
    }
    return source
  })

  return {
    ...candidate,
    source_entities: updatedSourceEntities,
  }
}

/**
 * Validate and prepare candidates for evidence creation.
 * Ensures each candidate has:
 * 1. Valid entity IDs for all source entities
 * 2. At least one source entity for the full_name field
 * 3. Proper document IDs for traceability
 */
function prepareCandidatesForEvidence(
  candidates: PersonCandidate[]
): PersonCandidate[] {
  return candidates.map(candidate => {
    // Ensure all source entities have valid IDs
    let prepared = ensureEntitySourceIds(candidate)

    // Ensure there's at least a source entity for the full_name
    const hasNameSource = prepared.source_entities.some(
      s => s.field_name === 'full_name'
    )

    if (!hasNameSource && prepared.source_docs.length > 0) {
      // Create a synthetic source entity for the name
      const nameSource: EntitySource = {
        field_name: 'full_name',
        entity_id: randomUUID(),
        document_id: prepared.source_docs[0],
        entity_type: 'PERSON',
        value: prepared.full_name,
        confidence: prepared.confidence,
      }
      prepared = {
        ...prepared,
        source_entities: [nameSource, ...prepared.source_entities],
      }
    }

    return prepared
  })
}

/**
 * Log evidence creation summary for debugging and auditing
 */
function logEvidenceSummary(
  candidates: PersonCandidate[],
  evidenceCreated: number
): void {
  const totalSourceEntities = candidates.reduce(
    (sum, c) => sum + c.source_entities.length,
    0
  )

  const fieldCounts: Record<string, number> = {}
  for (const candidate of candidates) {
    for (const source of candidate.source_entities) {
      fieldCounts[source.field_name] = (fieldCounts[source.field_name] || 0) + 1
    }
  }

  console.log('Evidence creation summary:', {
    totalCandidates: candidates.length,
    totalSourceEntities,
    evidenceRecordsCreated: evidenceCreated,
    fieldBreakdown: fieldCounts,
  })
}

/**
 * Process property deduplication and persistence
 *
 * This function:
 * 1. Finds duplicates among property candidates (by registry number)
 * 2. Merges candidates with the same registry number
 * 3. Persists properties to the database with deduplication
 * 4. Creates evidence records for traceability
 *
 * Returns both the build result and the prepared candidates for logging.
 */
async function processPropertyDeduplication(
  propertyMatcher: import('../services/propertyMatcher').PropertyMatcher,
  candidates: PropertyCandidate[],
  caseId: string
): Promise<{
  buildResult: import('../services/propertyMatcher').BatchPropertyBuildResult
  preparedCandidates: PropertyCandidate[]
}> {
  console.log(`Processing ${candidates.length} property candidates for deduplication`)

  // Step 1: Find duplicates among candidates (by registry number)
  const duplicates = propertyMatcher.findDuplicates(candidates)

  // Step 2: Build a set of candidates that should be merged
  const processedCandidates = new Set<PropertyCandidate>()
  const mergedCandidates: PropertyCandidate[] = []

  // Group candidates by registry number for auto-merge
  const registryIndex = new Map<string, PropertyCandidate[]>()
  const candidatesWithoutRegistry: PropertyCandidate[] = []

  for (const candidate of candidates) {
    if (candidate.registry_number) {
      const normalizedRegistry = normalizeRegistryNumber(candidate.registry_number)
      if (!registryIndex.has(normalizedRegistry)) {
        registryIndex.set(normalizedRegistry, [])
      }
      registryIndex.get(normalizedRegistry)!.push(candidate)
    } else {
      candidatesWithoutRegistry.push(candidate)
    }
  }

  // Auto-merge candidates with the same registry number
  for (const [registry, candidatesWithRegistry] of registryIndex) {
    if (candidatesWithRegistry.length === 1) {
      mergedCandidates.push(candidatesWithRegistry[0])
      processedCandidates.add(candidatesWithRegistry[0])
    } else {
      // Multiple candidates with same registry - merge them
      let merged = candidatesWithRegistry[0]
      for (let i = 1; i < candidatesWithRegistry.length; i++) {
        merged = propertyMatcher.mergeCandidates(merged, candidatesWithRegistry[i])
        processedCandidates.add(candidatesWithRegistry[i])
      }
      mergedCandidates.push(merged)
      processedCandidates.add(candidatesWithRegistry[0])

      console.log(`Auto-merged ${candidatesWithRegistry.length} property candidates with registry ${registry}`)
    }
  }

  // Add candidates without registry number (they can't be deduplicated by registry)
  for (const candidate of candidatesWithoutRegistry) {
    if (!processedCandidates.has(candidate)) {
      mergedCandidates.push(candidate)
      processedCandidates.add(candidate)
    }
  }

  console.log(`After property deduplication: ${mergedCandidates.length} unique candidates`)

  // Step 3: Prepare property candidates for evidence creation
  const preparedCandidates = preparePropertyCandidatesForEvidence(mergedCandidates)

  // Step 4: Build and persist Property records with evidence
  const buildResult = await propertyMatcher.buildProperties(caseId, preparedCandidates)

  return { buildResult, preparedCandidates }
}

/**
 * Normalize registry number for comparison
 */
function normalizeRegistryNumber(value: string): string {
  let normalized = value.trim()

  // Remove prefix like "Matrícula nº", "Mat.", etc.
  normalized = normalized.replace(/^(matr[íi]cula|mat\.?)\s*(n[º°]?\.?)?\s*/i, '')

  // Remove dots, spaces, and other formatting but keep hyphens and numbers
  normalized = normalized.replace(/\s+/g, '').replace(/\.+/g, '')

  return normalized.toLowerCase()
}

/**
 * Ensure all PropertyCandidate EntitySource entries have valid entity IDs.
 * Generates UUIDs for entries with missing or empty entity_id.
 */
function ensurePropertyEntitySourceIds(candidate: PropertyCandidate): PropertyCandidate {
  const updatedSourceEntities = candidate.source_entities.map(source => {
    if (!source.entity_id || source.entity_id.trim() === '') {
      return {
        ...source,
        entity_id: randomUUID(),
      }
    }
    return source
  })

  return {
    ...candidate,
    source_entities: updatedSourceEntities,
  }
}

/**
 * Validate and prepare property candidates for evidence creation.
 * Ensures each candidate has:
 * 1. Valid entity IDs for all source entities
 * 2. At least one source entity for the registry_number field (if available)
 * 3. Source entities for address field (if available)
 * 4. Source entities for other key fields
 * 5. Proper document IDs for traceability
 */
function preparePropertyCandidatesForEvidence(
  candidates: PropertyCandidate[]
): PropertyCandidate[] {
  return candidates.map(candidate => {
    // Ensure all source entities have valid IDs
    let prepared = ensurePropertyEntitySourceIds(candidate)

    // Ensure there's at least a source entity for the registry_number (if present)
    if (prepared.registry_number) {
      const hasRegistrySource = prepared.source_entities.some(
        s => s.field_name === 'registry_number'
      )

      if (!hasRegistrySource && prepared.source_docs.length > 0) {
        // Create a synthetic source entity for the registry number
        const registrySource: EntitySource = {
          field_name: 'registry_number',
          entity_id: randomUUID(),
          document_id: prepared.source_docs[0],
          entity_type: 'PROPERTY_REGISTRY',
          value: prepared.registry_number,
          confidence: prepared.confidence,
        }
        prepared = {
          ...prepared,
          source_entities: [registrySource, ...prepared.source_entities],
        }
      }
    }

    // Ensure there's a source entity for address (if present)
    if (prepared.address) {
      const hasAddressSource = prepared.source_entities.some(
        s => s.field_name === 'address'
      )

      if (!hasAddressSource && prepared.source_docs.length > 0) {
        const addressValue = formatAddressForEvidence(prepared.address)
        const addressSource: EntitySource = {
          field_name: 'address',
          entity_id: randomUUID(),
          document_id: prepared.source_docs[0],
          entity_type: 'ADDRESS',
          value: addressValue,
          confidence: prepared.confidence,
        }
        prepared = {
          ...prepared,
          source_entities: [...prepared.source_entities, addressSource],
        }
      }
    }

    // Ensure there's a source entity for registry_office (if present)
    if (prepared.registry_office) {
      const hasRegistryOfficeSource = prepared.source_entities.some(
        s => s.field_name === 'registry_office'
      )

      if (!hasRegistryOfficeSource && prepared.source_docs.length > 0) {
        const registryOfficeSource: EntitySource = {
          field_name: 'registry_office',
          entity_id: randomUUID(),
          document_id: prepared.source_docs[0],
          entity_type: 'ORGANIZATION',
          value: prepared.registry_office,
          confidence: prepared.confidence,
        }
        prepared = {
          ...prepared,
          source_entities: [...prepared.source_entities, registryOfficeSource],
        }
      }
    }

    // Ensure there's a source entity for area_sqm (if present)
    if (prepared.area_sqm !== null) {
      const hasAreaSource = prepared.source_entities.some(
        s => s.field_name === 'area_sqm'
      )

      if (!hasAreaSource && prepared.source_docs.length > 0) {
        const areaSource: EntitySource = {
          field_name: 'area_sqm',
          entity_id: randomUUID(),
          document_id: prepared.source_docs[0],
          entity_type: 'OTHER',
          value: `${prepared.area_sqm} m²`,
          confidence: prepared.confidence,
        }
        prepared = {
          ...prepared,
          source_entities: [...prepared.source_entities, areaSource],
        }
      }
    }

    // Ensure there's a source entity for iptu_number (if present)
    if (prepared.iptu_number) {
      const hasIptuSource = prepared.source_entities.some(
        s => s.field_name === 'iptu_number'
      )

      if (!hasIptuSource && prepared.source_docs.length > 0) {
        const iptuSource: EntitySource = {
          field_name: 'iptu_number',
          entity_id: randomUUID(),
          document_id: prepared.source_docs[0],
          entity_type: 'DOCUMENT_NUMBER',
          value: prepared.iptu_number,
          confidence: prepared.confidence,
        }
        prepared = {
          ...prepared,
          source_entities: [...prepared.source_entities, iptuSource],
        }
      }
    }

    // Ensure there's a source entity for description (if present)
    if (prepared.description) {
      const hasDescriptionSource = prepared.source_entities.some(
        s => s.field_name === 'description'
      )

      if (!hasDescriptionSource && prepared.source_docs.length > 0) {
        const descriptionSource: EntitySource = {
          field_name: 'description',
          entity_id: randomUUID(),
          document_id: prepared.source_docs[0],
          entity_type: 'OTHER',
          value: prepared.description.substring(0, 500), // Limit description length
          confidence: prepared.confidence,
        }
        prepared = {
          ...prepared,
          source_entities: [...prepared.source_entities, descriptionSource],
        }
      }
    }

    // Ensure there's a source entity for each encumbrance (if present)
    if (prepared.encumbrances && prepared.encumbrances.length > 0) {
      for (let i = 0; i < prepared.encumbrances.length; i++) {
        const encumbrance = prepared.encumbrances[i]
        const fieldName = `encumbrance_${i + 1}`

        const hasEncumbranceSource = prepared.source_entities.some(
          s => s.field_name === fieldName
        )

        if (!hasEncumbranceSource && prepared.source_docs.length > 0) {
          const encumbranceValue = formatEncumbranceForEvidence(encumbrance)
          const encumbranceSource: EntitySource = {
            field_name: fieldName,
            entity_id: randomUUID(),
            document_id: prepared.source_docs[0],
            entity_type: 'OTHER',
            value: encumbranceValue,
            confidence: prepared.confidence,
          }
          prepared = {
            ...prepared,
            source_entities: [...prepared.source_entities, encumbranceSource],
          }
        }
      }
    }

    return prepared
  })
}

/**
 * Format address for evidence record
 */
function formatAddressForEvidence(address: Address): string {
  const parts: string[] = []

  if (address.street) parts.push(address.street)
  if (address.number) parts.push(address.number)
  if (address.complement) parts.push(address.complement)
  if (address.neighborhood) parts.push(address.neighborhood)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zip) parts.push(address.zip)

  return parts.join(', ')
}

/**
 * Format encumbrance for evidence record
 */
function formatEncumbranceForEvidence(encumbrance: Encumbrance): string {
  const parts: string[] = []

  parts.push(`Tipo: ${encumbrance.type}`)

  if (encumbrance.description) {
    // Limit description length for evidence
    const shortDesc = encumbrance.description.substring(0, 200)
    parts.push(`Descrição: ${shortDesc}`)
  }

  if (encumbrance.value !== undefined) {
    parts.push(`Valor: R$ ${encumbrance.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  }

  if (encumbrance.beneficiary) {
    parts.push(`Beneficiário: ${encumbrance.beneficiary}`)
  }

  return parts.join(' | ')
}

/**
 * Log property evidence creation summary for debugging and auditing
 */
function logPropertyEvidenceSummary(
  candidates: PropertyCandidate[],
  evidenceCreated: number
): void {
  const totalSourceEntities = candidates.reduce(
    (sum, c) => sum + c.source_entities.length,
    0
  )

  const fieldCounts: Record<string, number> = {}
  for (const candidate of candidates) {
    for (const source of candidate.source_entities) {
      fieldCounts[source.field_name] = (fieldCounts[source.field_name] || 0) + 1
    }
  }

  console.log('Property evidence creation summary:', {
    totalPropertyCandidates: candidates.length,
    totalSourceEntities,
    evidenceRecordsCreated: evidenceCreated,
    fieldBreakdown: fieldCounts,
  })
}

/**
 * Create graph edges linking properties to people found in the same documents.
 *
 * This function analyzes deed documents to determine relationships between
 * properties and people (e.g., ownership, buyer, seller) based on:
 * 1. Shared source documents between property and person
 * 2. Document type (deed/escritura) context
 * 3. Relationship entities extracted from the document
 *
 * Relationships created:
 * - 'owns': Person owns the property (default for deed documents)
 * - 'sells': Person is selling the property
 * - 'buys': Person is buying the property
 */
async function createPropertyPersonEdges(
  supabase: SupabaseClient,
  caseId: string,
  propertyResults: Array<{ property: { id: string; source_docs: string[] }; sourceDocuments: string[] }>,
  personResults: Array<{ person: { id: string; full_name: string; source_docs: string[] } }>,
  documentGroups: Map<string, DocumentEntityGroup>,
  documentTypeMap: Map<string, string>
): Promise<number> {
  if (propertyResults.length === 0 || personResults.length === 0) {
    return 0
  }

  const edgesToCreate: GraphEdgeInsert[] = []
  const existingEdges = new Set<string>()

  // For each property, find related people via shared documents
  for (const { property, sourceDocuments } of propertyResults) {
    const propertyDocs = new Set(sourceDocuments)

    for (const { person } of personResults) {
      // Find shared documents between property and person
      const sharedDocs = person.source_docs.filter(docId => propertyDocs.has(docId))

      if (sharedDocs.length === 0) continue

      // Analyze each shared document to determine relationship type
      for (const docId of sharedDocs) {
        const docType = documentTypeMap.get(docId) || ''
        const docGroup = documentGroups.get(docId)

        // Determine relationship type based on document analysis
        const relationship = determinePropertyRelationship(
          docType,
          docGroup,
          person.full_name
        )

        // Create unique edge key to avoid duplicates
        const edgeKey = `${property.id}:${person.id}:${relationship}`
        if (existingEdges.has(edgeKey)) continue
        existingEdges.add(edgeKey)

        // Calculate confidence based on document type and entity matching
        const confidence = calculateEdgeConfidence(docType, docGroup, person.full_name)

        edgesToCreate.push({
          case_id: caseId,
          source_type: 'property',
          source_id: property.id,
          target_type: 'person',
          target_id: person.id,
          relationship,
          confidence,
          confirmed: false, // Needs user confirmation
          metadata: {
            source_document: docId,
            document_type: docType,
            auto_created: true,
            created_by: 'entity_resolution',
          },
        })
      }
    }
  }

  if (edgesToCreate.length === 0) {
    return 0
  }

  // Insert edges in batches
  const batchSize = 50
  let createdCount = 0

  for (let i = 0; i < edgesToCreate.length; i += batchSize) {
    const batch = edgesToCreate.slice(i, i + batchSize)

    const { data, error } = await supabase
      .from('graph_edges')
      .upsert(batch, {
        onConflict: 'case_id,source_type,source_id,target_type,target_id,relationship',
        ignoreDuplicates: true,
      })
      .select()

    if (error) {
      // Log but continue - some edges might already exist
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.error(`Failed to create graph edges batch: ${error.message}`)
      }
    } else {
      createdCount += data?.length ?? 0
    }
  }

  return createdCount
}

/**
 * Determine the relationship type between a property and person
 * based on document type and extracted entities.
 */
function determinePropertyRelationship(
  docType: string,
  docGroup: DocumentEntityGroup | undefined,
  personName: string
): RelationshipType {
  const lowerDocType = docType.toLowerCase()

  // Check for sale-related keywords in document type
  const isSaleDocument = lowerDocType.includes('compra') ||
    lowerDocType.includes('venda') ||
    lowerDocType.includes('sale')

  const isDonationDocument = lowerDocType.includes('doação') ||
    lowerDocType.includes('donation')

  // If we have the document entity group, analyze RELATIONSHIP entities
  if (docGroup) {
    const relationshipEntities = docGroup.entitiesByType.get('RELATIONSHIP') || []

    for (const entity of relationshipEntities) {
      const lowerValue = entity.value.toLowerCase()
      const lowerContext = (entity.context || '').toLowerCase()

      // Check if this relationship entity mentions the person's name
      const nameMatches = lowerContext.includes(personName.toLowerCase()) ||
        lowerValue.includes(personName.toLowerCase())

      if (!nameMatches) continue

      // Determine relationship from entity value or context
      if (lowerValue.includes('vendedor') ||
          lowerValue.includes('outorgante') ||
          lowerValue.includes('transmitente') ||
          lowerContext.includes('vende') ||
          lowerContext.includes('cede')) {
        return 'sells'
      }

      if (lowerValue.includes('comprador') ||
          lowerValue.includes('outorgado') ||
          lowerValue.includes('adquirente') ||
          lowerContext.includes('compra') ||
          lowerContext.includes('adquire')) {
        return 'buys'
      }

      if (lowerValue.includes('proprietário') ||
          lowerValue.includes('proprietária') ||
          lowerValue.includes('dono') ||
          lowerValue.includes('titular')) {
        return 'owns'
      }

      if (lowerValue.includes('fiador') ||
          lowerValue.includes('avalista') ||
          lowerValue.includes('garantidor')) {
        return 'guarantor_of'
      }

      if (lowerValue.includes('testemunha') ||
          lowerValue.includes('witness')) {
        return 'witness_for'
      }

      if (lowerValue.includes('procurador') ||
          lowerValue.includes('representante') ||
          lowerValue.includes('mandatário')) {
        return 'represents'
      }
    }
  }

  // Default based on document type
  if (isSaleDocument) {
    // For sale documents without specific relationship info,
    // default to 'owns' as the person is likely related to the property
    return 'owns'
  }

  if (isDonationDocument) {
    return 'owns'
  }

  // Default relationship for deed documents
  return 'owns'
}

/**
 * Calculate confidence score for a property-person edge
 * based on document type and entity analysis.
 */
function calculateEdgeConfidence(
  docType: string,
  docGroup: DocumentEntityGroup | undefined,
  personName: string
): number {
  let confidence = 0.5 // Base confidence

  const lowerDocType = docType.toLowerCase()

  // Boost confidence for deed documents
  if (lowerDocType.includes('deed') ||
      lowerDocType.includes('escritura') ||
      lowerDocType.includes('compra') ||
      lowerDocType.includes('venda')) {
    confidence += 0.2
  }

  // Analyze entity context for name mentions
  if (docGroup) {
    // Check for direct person entity matching
    const personEntities = docGroup.entitiesByType.get('PERSON') || []
    const nameMatch = personEntities.some(e =>
      normalizeName(e.value) === normalizeName(personName)
    )

    if (nameMatch) {
      confidence += 0.15
    }

    // Check for relationship entities mentioning the person
    const relationshipEntities = docGroup.entitiesByType.get('RELATIONSHIP') || []
    const relationshipMention = relationshipEntities.some(e =>
      (e.context || '').toLowerCase().includes(personName.toLowerCase())
    )

    if (relationshipMention) {
      confidence += 0.1
    }

    // Boost if registry entity exists (strong property identification)
    const registryEntities = docGroup.entitiesByType.get('PROPERTY_REGISTRY') || []
    if (registryEntities.length > 0) {
      confidence += 0.05
    }
  }

  // Cap at 0.95 - never auto-confirm
  return Math.min(confidence, 0.95)
}
