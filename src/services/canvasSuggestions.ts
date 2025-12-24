/**
 * Canvas Suggestions Service
 *
 * Analyzes extracted document data to generate intelligent suggestions for:
 * - Missing entities (people/properties)
 * - Missing relationships between entities
 * - Data quality improvements
 * - Potential conflicts or inconsistencies
 */

import { supabase } from '../lib/supabase'
import type {
  Person,
  Property,
  GraphEdge,
  ExtractedEntity,
  RelationshipType,
  Document
} from '../types'

export interface EntitySuggestion {
  id: string
  type: 'person' | 'property'
  action: 'add' | 'update' | 'verify'
  entity: Partial<Person> | Partial<Property>
  confidence: number
  source: {
    documentId: string
    documentName: string
    extractedData: {
      id: string
      value: string
      confidence: number
    }
  }
  reason: string
}

export interface RelationshipSuggestion {
  id: string
  action: 'add' | 'verify'
  sourceType: 'person' | 'property'
  sourceId: string
  sourceName: string
  targetType: 'person' | 'property'
  targetId: string
  targetName: string
  relationship: RelationshipType
  confidence: number
  source: {
    documentId: string
    documentName: string
    context: string
  }
  reason: string
}

export interface DataQualitySuggestion {
  id: string
  type: 'missing_field' | 'inconsistent_data' | 'low_confidence' | 'duplicate_entity'
  entityType: 'person' | 'property' | 'relationship'
  entityId: string
  entityName: string
  severity: 'high' | 'medium' | 'low'
  field?: string
  currentValue?: unknown
  suggestedValue?: unknown
  reason: string
  confidence: number
}

export interface CanvasSuggestions {
  entities: EntitySuggestion[]
  relationships: RelationshipSuggestion[]
  dataQuality: DataQualitySuggestion[]
  summary: {
    totalSuggestions: number
    highPriority: number
    mediumPriority: number
    lowPriority: number
  }
}

/**
 * Analyzes documents and generates suggestions for the canvas
 */
export async function analyzeDocumentsForSuggestions(
  caseId: string,
  existingPeople: Person[],
  existingProperties: Property[],
  existingEdges: GraphEdge[]
): Promise<CanvasSuggestions> {
  const suggestions: CanvasSuggestions = {
    entities: [],
    relationships: [],
    dataQuality: [],
    summary: {
      totalSuggestions: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    },
  }

  try {
    // Fetch all documents for the case
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('Error fetching documents:', docsError)
      return suggestions
    }

    if (!documents || documents.length === 0) {
      return suggestions
    }

    // Fetch extractions for all documents
    const docIds = documents.map(d => d.id)
    const { data: extractions, error: extractionsError } = await supabase
      .from('extractions')
      .select('*')
      .in('document_id', docIds)

    if (extractionsError) {
      console.error('Error fetching extractions:', extractionsError)
      return suggestions
    }

    if (!extractions || extractions.length === 0) {
      return suggestions
    }

    // Analyze each extraction for entity suggestions
    for (const extraction of extractions) {
      const document = documents.find(d => d.id === extraction.document_id)
      if (!document) continue

      const llmResult = extraction.llm_result as any

      // Check for entity extraction results
      if (llmResult?.entity_extraction?.entities) {
        const entities = llmResult.entity_extraction.entities as ExtractedEntity[]

        for (const entity of entities) {
          // Suggest adding missing entities
          const entitySuggestion = analyzeEntityForSuggestion(
            entity,
            document,
            existingPeople,
            existingProperties
          )

          if (entitySuggestion) {
            suggestions.entities.push(entitySuggestion)
          }
        }
      }

      // Check for relationship mentions in extracted data
      if (llmResult?.entity_extraction?.relationships) {
        const relationships = llmResult.entity_extraction.relationships as any[]

        for (const rel of relationships) {
          const relSuggestion = analyzeRelationshipForSuggestion(
            rel,
            document,
            existingPeople,
            existingProperties,
            existingEdges
          )

          if (relSuggestion) {
            suggestions.relationships.push(relSuggestion)
          }
        }
      }

      // Check extracted data for property/person information
      if (llmResult?.extracted_data) {
        const extractedSuggestions = analyzeExtractedDataForSuggestions(
          llmResult.extracted_data,
          document,
          existingPeople,
          existingProperties
        )

        suggestions.entities.push(...extractedSuggestions.entities)
        suggestions.relationships.push(...extractedSuggestions.relationships)
      }
    }

    // Generate data quality suggestions
    suggestions.dataQuality = generateDataQualitySuggestions(
      existingPeople,
      existingProperties,
      existingEdges,
      suggestions.entities
    )

    // Calculate summary
    const allSuggestions = [
      ...suggestions.entities.map(s => ({ ...s, priority: s.confidence > 0.8 ? 'high' : s.confidence > 0.5 ? 'medium' : 'low' })),
      ...suggestions.relationships.map(s => ({ ...s, priority: s.confidence > 0.8 ? 'high' : s.confidence > 0.5 ? 'medium' : 'low' })),
      ...suggestions.dataQuality.map(s => ({ ...s, priority: s.severity })),
    ]

    suggestions.summary = {
      totalSuggestions: allSuggestions.length,
      highPriority: allSuggestions.filter(s => s.priority === 'high').length,
      mediumPriority: allSuggestions.filter(s => s.priority === 'medium').length,
      lowPriority: allSuggestions.filter(s => s.priority === 'low').length,
    }

  } catch (error) {
    console.error('Error analyzing documents for suggestions:', error)
  }

  return suggestions
}

function analyzeEntityForSuggestion(
  entity: ExtractedEntity,
  document: Document,
  existingPeople: Person[],
  existingProperties: Property[]
): EntitySuggestion | null {
  const entityType = entity.type === 'PERSON' ? 'person' : entity.type === 'LOCATION' ? 'property' : null

  if (!entityType) return null

  // Check if entity already exists
  const exists = entityType === 'person'
    ? existingPeople.some(p =>
        p.full_name.toLowerCase().includes(entity.value.toLowerCase()) ||
        entity.value.toLowerCase().includes(p.full_name.toLowerCase())
      )
    : existingProperties.some(p =>
        (p.address && typeof p.address !== 'string' && p.address.formatted_address?.toLowerCase().includes(entity.value.toLowerCase())) ||
        entity.value.toLowerCase().includes(p.address && typeof p.address !== 'string' ? p.address.formatted_address?.toLowerCase() || '' : '')
      )

  if (exists) return null

  // Create suggestion to add new entity
  const suggestion: EntitySuggestion = {
    id: `entity-suggestion-${entity.id || Math.random().toString(36).substr(2, 9)}`,
    type: entityType,
    action: 'add',
    entity: entityType === 'person'
      ? {
          full_name: entity.value,
          cpf: entity.metadata?.cpf as string || null,
        }
      : {
          address: null,  // We'll need to parse the address string
          iptu_number: entity.metadata?.iptu as string || null,
          registry_number: entity.metadata?.registry as string || null,
        },
    confidence: entity.confidence || 0.7,
    source: {
      documentId: document.id,
      documentName: document.original_name,
      extractedData: {
        id: entity.id,
        value: entity.value,
        confidence: entity.confidence,
      },
    },
    reason: `Entidade "${entity.value}" encontrada no documento "${document.original_name}" mas não existe no canvas`,
  }

  return suggestion
}

function analyzeRelationshipForSuggestion(
  relationship: any,
  document: Document,
  existingPeople: Person[],
  existingProperties: Property[],
  existingEdges: GraphEdge[]
): RelationshipSuggestion | null {
  // Find matching entities
  const source = findMatchingEntity(relationship.source, existingPeople, existingProperties)
  const target = findMatchingEntity(relationship.target, existingPeople, existingProperties)

  if (!source || !target) return null

  // Check if relationship already exists
  const exists = existingEdges.some(e =>
    (e.source_id === source.id && e.target_id === target.id) ||
    (e.source_id === target.id && e.target_id === source.id)
  )

  if (exists) return null

  const suggestion: RelationshipSuggestion = {
    id: `rel-suggestion-${Math.random().toString(36).substr(2, 9)}`,
    action: 'add',
    sourceType: source.type,
    sourceId: source.id,
    sourceName: source.name,
    targetType: target.type,
    targetId: target.id,
    targetName: target.name,
    relationship: mapRelationshipType(relationship.type),
    confidence: relationship.confidence || 0.7,
    source: {
      documentId: document.id,
      documentName: document.original_name,
      context: relationship.context || '',
    },
    reason: `Relacionamento "${relationship.type}" entre "${source.name}" e "${target.name}" detectado no documento`,
  }

  return suggestion
}

function analyzeExtractedDataForSuggestions(
  extractedData: any,
  document: Document,
  existingPeople: Person[],
  existingProperties: Property[]
): { entities: EntitySuggestion[], relationships: RelationshipSuggestion[] } {
  const result = {
    entities: [] as EntitySuggestion[],
    relationships: [] as RelationshipSuggestion[],
  }

  // Look for buyer/seller information
  if (extractedData.buyer) {
    const buyerName = typeof extractedData.buyer === 'string'
      ? extractedData.buyer
      : extractedData.buyer.name

    const exists = existingPeople.some(p =>
      p.full_name.toLowerCase().includes(buyerName.toLowerCase())
    )

    if (!exists && buyerName) {
      result.entities.push({
        id: `buyer-suggestion-${Math.random().toString(36).substr(2, 9)}`,
        type: 'person',
        action: 'add',
        entity: {
          full_name: buyerName,
          cpf: extractedData.buyer?.cpf || null,
        },
        confidence: 0.85,
        source: {
          documentId: document.id,
          documentName: document.original_name,
          extractedData: {
            id: '',
            value: buyerName,
            confidence: 0.85
          },
        },
        reason: `Comprador "${buyerName}" identificado no documento mas não existe no canvas`,
      })
    }
  }

  if (extractedData.seller) {
    const sellerName = typeof extractedData.seller === 'string'
      ? extractedData.seller
      : extractedData.seller.name

    const exists = existingPeople.some(p =>
      p.full_name.toLowerCase().includes(sellerName.toLowerCase())
    )

    if (!exists && sellerName) {
      result.entities.push({
        id: `seller-suggestion-${Math.random().toString(36).substr(2, 9)}`,
        type: 'person',
        action: 'add',
        entity: {
          full_name: sellerName,
          cpf: extractedData.seller?.cpf || null,
        },
        confidence: 0.85,
        source: {
          documentId: document.id,
          documentName: document.original_name,
          extractedData: {
            id: '',
            value: sellerName,
            confidence: 0.85
          },
        },
        reason: `Vendedor "${sellerName}" identificado no documento mas não existe no canvas`,
      })
    }
  }

  // Look for property information
  if (extractedData.property_address) {
    const address = extractedData.property_address
    const exists = existingProperties.some(p =>
      p.address && typeof p.address !== 'string' && p.address.formatted_address?.toLowerCase().includes(address.toLowerCase())
    )

    if (!exists && address) {
      result.entities.push({
        id: `property-suggestion-${Math.random().toString(36).substr(2, 9)}`,
        type: 'property',
        action: 'add',
        entity: {
          address: null,  // We'll need to parse the address string
          iptu_number: extractedData.iptu_number || null,
          registry_number: extractedData.registry_number || null,
        },
        confidence: 0.8,
        source: {
          documentId: document.id,
          documentName: document.original_name,
          extractedData: {
            id: '',
            value: address,
            confidence: 0.8
          },
        },
        reason: `Propriedade no endereço "${address}" identificada no documento mas não existe no canvas`,
      })
    }
  }

  return result
}

function generateDataQualitySuggestions(
  people: Person[],
  properties: Property[],
  edges: GraphEdge[]
): DataQualitySuggestion[] {
  const suggestions: DataQualitySuggestion[] = []

  // Check for people with missing critical fields
  for (const person of people) {
    if (!person.cpf) {
      suggestions.push({
        id: `quality-person-cpf-${person.id}`,
        type: 'missing_field',
        entityType: 'person',
        entityId: person.id,
        entityName: person.full_name,
        severity: 'high',
        field: 'cpf',
        reason: `CPF faltando para "${person.full_name}"`,
        confidence: 1.0,
      })
    }
  }

  // Check for properties with missing critical fields
  for (const property of properties) {
    const addressStr = property.address && typeof property.address !== 'string'
      ? property.address.formatted_address || 'Propriedade sem endereço'
      : 'Propriedade sem endereço'

    if (!property.iptu_number && !property.registry_number) {
      suggestions.push({
        id: `quality-property-docs-${property.id}`,
        type: 'missing_field',
        entityType: 'property',
        entityId: property.id,
        entityName: addressStr,
        severity: 'high',
        field: 'iptu_number / registry_number',
        reason: `Propriedade sem IPTU ou Matrícula`,
        confidence: 1.0,
      })
    }
  }

  // Check for unconfirmed relationships
  const unconfirmedEdges = edges.filter(e => !e.confirmed)
  for (const edge of unconfirmedEdges) {
    suggestions.push({
      id: `quality-edge-unconfirmed-${edge.id}`,
      type: 'low_confidence',
      entityType: 'relationship',
      entityId: edge.id,
      entityName: `${edge.relationship}`,
      severity: edge.confidence < 0.5 ? 'high' : 'medium',
      reason: `Relacionamento "${edge.relationship}" ainda não confirmado`,
      confidence: edge.confidence,
    })
  }

  return suggestions
}

function findMatchingEntity(
  name: string,
  people: Person[],
  properties: Property[]
): { id: string; type: 'person' | 'property'; name: string } | null {
  // Try to find matching person
  const person = people.find(p =>
    p.full_name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(p.full_name.toLowerCase())
  )

  if (person) {
    return { id: person.id, type: 'person', name: person.full_name }
  }

  // Try to find matching property
  const property = properties.find(p => {
    if (!p.address || typeof p.address === 'string') return false
    const addressStr = p.address.formatted_address || ''
    return addressStr.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(addressStr.toLowerCase())
  })

  if (property) {
    const addressStr = property.address && typeof property.address !== 'string'
      ? property.address.formatted_address || ''
      : ''
    return { id: property.id, type: 'property', name: addressStr }
  }

  return null
}

function mapRelationshipType(type: string): RelationshipType {
  const typeMap: Record<string, RelationshipType> = {
    'spouse': 'spouse_of',
    'represents': 'represents',
    'owns': 'owns',
    'sells': 'sells',
    'buys': 'buys',
    'guarantor': 'guarantor_of',
    'witness': 'witness_for',
  }

  return typeMap[type.toLowerCase()] || 'represents'
}
