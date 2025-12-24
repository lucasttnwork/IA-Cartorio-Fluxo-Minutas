import type {
  ExtractedEntity,
  EntityType,
  PropertyCandidate,
  EntitySource,
  Address,
  Encumbrance,
} from '../types'
import type { DocumentEntityGroup } from './EntityMatcher'
import { geocodingService } from './geocodingService'

/**
 * Result of matching entities to build a property candidate
 */
export interface PropertyMatchResult {
  /** The primary property registry entity (if found) */
  registryEntity: ExtractedEntity | null
  /** All associated entities (ADDRESS, MONEY, etc.) */
  associatedEntities: ExtractedEntity[]
  /** Built property candidate */
  candidate: PropertyCandidate
  /** Match confidence */
  confidence: number
}

/**
 * Configuration for property extraction thresholds
 */
export interface PropertyExtractorConfig {
  /** Minimum confidence for registry entities to be considered */
  minRegistryConfidence: number
  /** Minimum confidence for address entities to be considered */
  minAddressConfidence: number
  /** Maximum distance (in entity order) to associate entities */
  maxAssociationDistance: number
  /** Whether to create property candidates without registry number */
  allowPropertiesWithoutRegistry: boolean
}

const DEFAULT_CONFIG: PropertyExtractorConfig = {
  minRegistryConfidence: 0.6,
  minAddressConfidence: 0.5,
  maxAssociationDistance: 15,
  allowPropertiesWithoutRegistry: true,
}

/**
 * Keywords that indicate a deed document (escritura)
 */
const DEED_DOCUMENT_KEYWORDS = [
  'escritura',
  'escritura pública',
  'compra e venda',
  'doação',
  'permuta',
  'cessão',
  'inventário',
  'partilha',
  'formal de partilha',
  'carta de arrematação',
  'carta de adjudicação',
]

/**
 * Keywords that indicate encumbrance types
 */
const ENCUMBRANCE_KEYWORDS: Record<string, string> = {
  'hipoteca': 'hipoteca',
  'hipotecado': 'hipoteca',
  'hipotecária': 'hipoteca',
  'usufruto': 'usufruto',
  'usufrutuário': 'usufruto',
  'usufrutuária': 'usufruto',
  'penhora': 'penhora',
  'penhorado': 'penhora',
  'alienação fiduciária': 'alienacao_fiduciaria',
  'fiduciária': 'alienacao_fiduciaria',
  'servidão': 'servidao',
  'servidões': 'servidao',
  'indisponibilidade': 'indisponibilidade',
  'indisponível': 'indisponibilidade',
  'cláusula': 'clausula_restritiva',
  'inalienabilidade': 'inalienabilidade',
  'impenhorabilidade': 'impenhorabilidade',
  'incomunicabilidade': 'incomunicabilidade',
  'aforamento': 'aforamento',
  'enfiteuse': 'enfiteuse',
  'reserva de domínio': 'reserva_dominio',
}

/**
 * PropertyExtractor service for extracting property data from entities.
 *
 * This service is used by the entity resolution job to:
 * 1. Detect if a document is a deed (escritura)
 * 2. Extract property-related entities (PROPERTY_REGISTRY, ADDRESS, etc.)
 * 3. Build PropertyCandidate records from grouped entities
 */
export class PropertyExtractor {
  private config: PropertyExtractorConfig

  constructor(config?: Partial<PropertyExtractorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if a document is likely a deed based on its type or extracted text
   */
  isDeedDocument(documentType: string | null, ocrText?: string): boolean {
    // Check document type first
    if (documentType) {
      const lowerType = documentType.toLowerCase()
      if (DEED_DOCUMENT_KEYWORDS.some(keyword => lowerType.includes(keyword))) {
        return true
      }
      // Common document type values
      if (['deed', 'escritura', 'titulo'].some(t => lowerType.includes(t))) {
        return true
      }
    }

    // Check OCR text for deed-related content
    if (ocrText) {
      const lowerText = ocrText.toLowerCase()
      // Count how many deed keywords appear in the text
      const matchCount = DEED_DOCUMENT_KEYWORDS.filter(keyword =>
        lowerText.includes(keyword)
      ).length

      // If at least 2 keywords match, it's likely a deed
      return matchCount >= 2
    }

    return false
  }

  /**
   * Extract property candidates from a document's entities
   */
  async extractProperties(documentGroup: DocumentEntityGroup): Promise<PropertyMatchResult[]> {
    const results: PropertyMatchResult[] = []

    // Get property registry entities
    const registryEntities = documentGroup.entitiesByType.get('PROPERTY_REGISTRY') || []
    const validRegistries = registryEntities.filter(
      r => r.confidence >= this.config.minRegistryConfidence
    )

    // If we have registry entities, create a property for each
    if (validRegistries.length > 0) {
      for (const registryEntity of validRegistries) {
        const associated = this.findAssociatedEntities(
          registryEntity,
          documentGroup.entities
        )

        const candidate = this.buildPropertyCandidate(
          registryEntity,
          associated,
          documentGroup.documentId
        )

        // Geocode the address if present
        if (candidate.address) {
          candidate.address = await this.geocodePropertyAddress(candidate.address)
        }

        const confidence = this.calculateMatchConfidence(registryEntity, associated)

        results.push({
          registryEntity,
          associatedEntities: associated,
          candidate,
          confidence,
        })
      }
    } else if (this.config.allowPropertiesWithoutRegistry) {
      // No registry found, but try to build property from address
      const addressEntities = documentGroup.entitiesByType.get('ADDRESS') || []
      const validAddresses = addressEntities.filter(
        a => a.confidence >= this.config.minAddressConfidence
      )

      if (validAddresses.length > 0) {
        // Use the first high-confidence address as the primary property indicator
        const primaryAddress = validAddresses[0]
        const associated = this.findAssociatedEntitiesForAddress(
          primaryAddress,
          documentGroup.entities
        )

        const candidate = this.buildPropertyCandidateFromAddress(
          primaryAddress,
          associated,
          documentGroup.documentId
        )

        // Geocode the address if present
        if (candidate.address) {
          candidate.address = await this.geocodePropertyAddress(candidate.address)
        }

        // Lower confidence since we don't have registry number
        const confidence = this.calculateMatchConfidence(null, [primaryAddress, ...associated]) * 0.7

        results.push({
          registryEntity: null,
          associatedEntities: [primaryAddress, ...associated],
          candidate,
          confidence,
        })
      }
    }

    return results
  }

  /**
   * Geocode a property address
   */
  private async geocodePropertyAddress(address: Address): Promise<Address> {
    try {
      console.log('[PropertyExtractor] Geocoding address:', address)
      const result = await geocodingService.geocodeAddress(address)

      if (result.success) {
        console.log('[PropertyExtractor] Geocoding successful')
        return result.address
      } else {
        console.warn('[PropertyExtractor] Geocoding failed:', result.error)
        return address
      }
    } catch (error) {
      console.error('[PropertyExtractor] Geocoding error:', error)
      return address
    }
  }

  /**
   * Find entities that are likely associated with a property registry entity
   */
  private findAssociatedEntities(
    registryEntity: ExtractedEntity,
    allEntities: ExtractedEntity[]
  ): ExtractedEntity[] {
    const associated: ExtractedEntity[] = []
    const registryIndex = allEntities.findIndex(e => e.id === registryEntity.id)

    // Entity types that can be associated with a property
    const propertyRelatedTypes: EntityType[] = [
      'ADDRESS',
      'MONEY',
      'LOCATION',
      'ORGANIZATION', // For registry office (cartório)
    ]

    // Look for entities near the registry entity
    const startIndex = Math.max(0, registryIndex - this.config.maxAssociationDistance)
    const endIndex = Math.min(
      allEntities.length - 1,
      registryIndex + this.config.maxAssociationDistance
    )

    // Track which entity types we've already found
    const foundTypes = new Set<EntityType>()

    // First pass: look forward from registry entity
    for (let i = registryIndex + 1; i <= endIndex; i++) {
      const entity = allEntities[i]

      if (!propertyRelatedTypes.includes(entity.type)) continue

      // Skip if we already found this type (except for LOCATION which can have multiple)
      if (foundTypes.has(entity.type) && entity.type !== 'LOCATION') continue

      // Stop if we hit another PROPERTY_REGISTRY entity
      if (entity.type === 'PROPERTY_REGISTRY' && entity.id !== registryEntity.id) {
        break
      }

      associated.push(entity)
      foundTypes.add(entity.type)
    }

    // Second pass: look backward from registry entity
    for (let i = registryIndex - 1; i >= startIndex; i--) {
      const entity = allEntities[i]

      if (!propertyRelatedTypes.includes(entity.type)) continue

      // Skip if we already found this type
      if (foundTypes.has(entity.type) && entity.type !== 'LOCATION') continue

      // Stop if we hit another PROPERTY_REGISTRY entity
      if (entity.type === 'PROPERTY_REGISTRY' && entity.id !== registryEntity.id) {
        break
      }

      associated.push(entity)
      foundTypes.add(entity.type)
    }

    return associated
  }

  /**
   * Find entities associated with an address (when no registry is found)
   */
  private findAssociatedEntitiesForAddress(
    addressEntity: ExtractedEntity,
    allEntities: ExtractedEntity[]
  ): ExtractedEntity[] {
    const associated: ExtractedEntity[] = []
    const addressIndex = allEntities.findIndex(e => e.id === addressEntity.id)

    const propertyRelatedTypes: EntityType[] = [
      'MONEY',
      'LOCATION',
      'ORGANIZATION',
    ]

    const startIndex = Math.max(0, addressIndex - this.config.maxAssociationDistance)
    const endIndex = Math.min(
      allEntities.length - 1,
      addressIndex + this.config.maxAssociationDistance
    )

    const foundTypes = new Set<EntityType>()

    for (let i = startIndex; i <= endIndex; i++) {
      if (i === addressIndex) continue
      const entity = allEntities[i]

      if (!propertyRelatedTypes.includes(entity.type)) continue
      if (foundTypes.has(entity.type) && entity.type !== 'LOCATION') continue

      // Stop if we hit another ADDRESS entity
      if (entity.type === 'ADDRESS' && entity.id !== addressEntity.id) {
        continue
      }

      associated.push(entity)
      foundTypes.add(entity.type)
    }

    return associated
  }

  /**
   * Build a PropertyCandidate from a registry entity and its associated entities
   */
  private buildPropertyCandidate(
    registryEntity: ExtractedEntity,
    associatedEntities: ExtractedEntity[],
    documentId: string
  ): PropertyCandidate {
    const sourceEntities: EntitySource[] = []

    // Add the registry entity as a source
    sourceEntities.push({
      field_name: 'registry_number',
      entity_id: registryEntity.id || '',
      document_id: documentId,
      entity_type: registryEntity.type,
      value: registryEntity.value,
      confidence: registryEntity.confidence,
      position: registryEntity.position,
    })

    // Initialize the candidate with the registry number
    const candidate: PropertyCandidate = {
      registry_number: this.normalizeRegistryNumber(registryEntity.normalized_value || registryEntity.value),
      registry_office: null,
      address: null,
      area_sqm: null,
      description: null,
      iptu_number: null,
      encumbrances: null,
      source_docs: [documentId],
      source_entities: sourceEntities,
      confidence: registryEntity.confidence,
      metadata: {},
    }

    // Try to extract registry office from context
    if (registryEntity.context) {
      candidate.registry_office = this.extractRegistryOffice(registryEntity.context)
    }

    // Map associated entities to candidate fields
    this.mapAssociatedEntitiesToCandidate(candidate, associatedEntities, documentId, sourceEntities)

    // Try to extract area from registry context or description
    if (registryEntity.context) {
      const area = this.extractArea(registryEntity.context)
      if (area !== null) {
        candidate.area_sqm = area
      }
    }

    // Extract encumbrances from context
    if (registryEntity.context) {
      const encumbrances = this.extractEncumbrances(registryEntity.context)
      if (encumbrances.length > 0) {
        candidate.encumbrances = encumbrances
      }
    }

    return candidate
  }

  /**
   * Build a PropertyCandidate from an address (when no registry is found)
   */
  private buildPropertyCandidateFromAddress(
    addressEntity: ExtractedEntity,
    associatedEntities: ExtractedEntity[],
    documentId: string
  ): PropertyCandidate {
    const sourceEntities: EntitySource[] = []

    // Add the address entity as a source
    sourceEntities.push({
      field_name: 'address',
      entity_id: addressEntity.id || '',
      document_id: documentId,
      entity_type: addressEntity.type,
      value: addressEntity.value,
      confidence: addressEntity.confidence,
      position: addressEntity.position,
    })

    // Initialize the candidate without registry number
    const candidate: PropertyCandidate = {
      registry_number: null, // No registry found
      registry_office: null,
      address: this.parseAddress(addressEntity.value),
      area_sqm: null,
      description: addressEntity.context || null,
      iptu_number: null,
      encumbrances: null,
      source_docs: [documentId],
      source_entities: sourceEntities,
      confidence: addressEntity.confidence * 0.7, // Lower confidence without registry
      metadata: {
        needs_review: true,
        missing_registry: true,
      },
    }

    // Map associated entities
    this.mapAssociatedEntitiesToCandidate(candidate, associatedEntities, documentId, sourceEntities)

    // Try to extract area from address context
    if (addressEntity.context) {
      const area = this.extractArea(addressEntity.context)
      if (area !== null) {
        candidate.area_sqm = area
      }
    }

    return candidate
  }

  /**
   * Map associated entities to property candidate fields
   */
  private mapAssociatedEntitiesToCandidate(
    candidate: PropertyCandidate,
    associatedEntities: ExtractedEntity[],
    documentId: string,
    sourceEntities: EntitySource[]
  ): void {
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
        case 'ADDRESS':
          if (!candidate.address) {
            candidate.address = this.parseAddress(entity.value)
            sourceEntry.field_name = 'address'
            sourceEntities.push(sourceEntry)
          }
          break

        case 'MONEY':
          // Could be property value - store in metadata
          if (!candidate.metadata.property_value) {
            candidate.metadata.property_value = this.parseMoney(entity.value)
            sourceEntry.field_name = 'property_value'
            sourceEntities.push(sourceEntry)
          }
          break

        case 'ORGANIZATION':
          // Could be the registry office
          if (!candidate.registry_office && this.isRegistryOffice(entity.value)) {
            candidate.registry_office = entity.value
            sourceEntry.field_name = 'registry_office'
            sourceEntities.push(sourceEntry)
          }
          break

        case 'LOCATION':
          // Add to address if address is incomplete
          if (candidate.address) {
            this.enrichAddressWithLocation(candidate.address, entity.value)
          }
          break
      }
    }
  }

  /**
   * Map entity type to PropertyCandidate field name
   */
  private mapEntityTypeToField(type: EntityType): string {
    const mapping: Partial<Record<EntityType, string>> = {
      ADDRESS: 'address',
      PROPERTY_REGISTRY: 'registry_number',
      MONEY: 'property_value',
      ORGANIZATION: 'registry_office',
      LOCATION: 'location',
    }
    return mapping[type] || type.toLowerCase()
  }

  /**
   * Calculate overall match confidence
   */
  private calculateMatchConfidence(
    registryEntity: ExtractedEntity | null,
    associatedEntities: ExtractedEntity[]
  ): number {
    if (!registryEntity && associatedEntities.length === 0) {
      return 0
    }

    // Weight by entity type importance
    const weights: Partial<Record<EntityType, number>> = {
      PROPERTY_REGISTRY: 2.0,
      ADDRESS: 1.5,
      MONEY: 0.8,
      ORGANIZATION: 0.7,
      LOCATION: 0.5,
    }

    let totalWeight = 0
    let weightedSum = 0

    if (registryEntity) {
      const weight = weights[registryEntity.type] || 1.0
      totalWeight += weight
      weightedSum += registryEntity.confidence * weight
    }

    for (const entity of associatedEntities) {
      const weight = weights[entity.type] || 0.5
      totalWeight += weight
      weightedSum += entity.confidence * weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  // ============ Helper Functions ============

  /**
   * Normalize registry number (matrícula)
   * Removes formatting and normalizes to a consistent format
   */
  normalizeRegistryNumber(value: string): string {
    // Remove common prefixes and clean up
    let normalized = value.trim()

    // Remove prefix like "Matrícula nº", "Mat.", etc.
    normalized = normalized.replace(/^(matr[íi]cula|mat\.?)\s*(n[º°]?\.?)?\s*/i, '')

    // Remove dots and spaces but keep hyphens and numbers
    normalized = normalized.replace(/\s+/g, '').replace(/\.+/g, '')

    return normalized
  }

  /**
   * Extract registry office name from context
   */
  private extractRegistryOffice(context: string): string | null {
    const patterns = [
      /cart[óo]rio\s+(?:de\s+)?(?:registro\s+(?:de\s+)?)?im[óo]veis\s+(?:da\s+)?(?:comarca\s+de\s+)?([^,.\n]+)/i,
      /(\d+[ºª°]?\s*(?:of[íi]cio|cart[óo]rio)\s+(?:de\s+)?(?:registro\s+(?:de\s+)?)?im[óo]veis)/i,
      /cart[óo]rio\s+([^,.\n]+?)(?:\s+de\s+im[óo]veis)?/i,
      /of[íi]cio\s+de\s+registro\s+de\s+im[óo]veis\s+(?:de\s+)?([^,.\n]+)/i,
    ]

    for (const pattern of patterns) {
      const match = context.match(pattern)
      if (match) {
        return match[1]?.trim() || match[0]?.trim()
      }
    }

    return null
  }

  /**
   * Extract area from text (in square meters)
   */
  extractArea(text: string): number | null {
    // Match various area formats
    const patterns = [
      // "100,50 m²" or "100.50 m2" or "100,50m²"
      /(\d{1,}[.,]?\d*)\s*m[²2]/i,
      // "área de 100,50 metros quadrados"
      /[áa]rea\s+(?:de\s+)?(\d{1,}[.,]?\d*)\s*(?:metros?\s*quadrados?|m[²2])/i,
      // "100,50 ha" or "100.50 hectares"
      /(\d{1,}[.,]?\d*)\s*(?:ha|hectares?)/i,
      // "área: 100,50" or "área = 100,50"
      /[áa]rea[:\s=]+(\d{1,}[.,]?\d*)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        let value = parseFloat(match[1].replace(',', '.'))

        // Convert hectares to square meters if needed
        if (pattern.source.includes('hectare') || pattern.source.includes('ha')) {
          value *= 10000
        }

        return value
      }
    }

    return null
  }

  /**
   * Extract encumbrances from text
   */
  private extractEncumbrances(text: string): Encumbrance[] {
    const encumbrances: Encumbrance[] = []
    const lowerText = text.toLowerCase()

    for (const [keyword, type] of Object.entries(ENCUMBRANCE_KEYWORDS)) {
      if (lowerText.includes(keyword)) {
        // Try to extract more context around the encumbrance
        const index = lowerText.indexOf(keyword)
        const start = Math.max(0, index - 50)
        const end = Math.min(lowerText.length, index + keyword.length + 100)
        const context = text.substring(start, end)

        // Try to extract value if present
        const valueMatch = context.match(/R\$\s*([\d.,]+)/i)
        const value = valueMatch ? this.parseMoney(valueMatch[0]) : undefined

        // Try to extract beneficiary
        const beneficiaryMatch = context.match(/(?:em favor de|benefici[áa]rio|credor)[:\s]+([^,.\n]+)/i)
        const beneficiary = beneficiaryMatch ? beneficiaryMatch[1].trim() : undefined

        // Avoid duplicates
        const existingType = encumbrances.find(e => e.type === type)
        if (!existingType) {
          encumbrances.push({
            type,
            description: context.trim(),
            value,
            beneficiary,
          })
        }
      }
    }

    return encumbrances
  }

  /**
   * Parse address string into Address object
   */
  parseAddress(addressStr: string): Address {
    const parts = addressStr.split(',').map(p => p.trim())

    return {
      street: parts[0] || '',
      number: this.extractStreetNumber(parts[0] || '') || '',
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
  private extractStreetNumber(str: string): string {
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
   * Parse money value from string
   */
  private parseMoney(value: string): number | undefined {
    // Remove currency symbol and clean up
    const cleaned = value.replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? undefined : parsed
  }

  /**
   * Check if an organization name is likely a registry office
   */
  private isRegistryOffice(value: string): boolean {
    const lowerValue = value.toLowerCase()
    return (
      lowerValue.includes('cartório') ||
      lowerValue.includes('cartorio') ||
      lowerValue.includes('ofício') ||
      lowerValue.includes('oficio') ||
      lowerValue.includes('registro de imóveis') ||
      lowerValue.includes('registro de imoveis') ||
      lowerValue.includes('ri ') ||
      /\d+[ºª°]?\s*ri\b/i.test(value)
    )
  }

  /**
   * Enrich address with location entity data
   */
  private enrichAddressWithLocation(address: Address, location: string): void {
    const lowerLocation = location.toLowerCase()

    // Try to identify city/state patterns
    const stateMatch = location.match(/\b([A-Z]{2})\b/)
    if (stateMatch && !address.state) {
      address.state = stateMatch[1]
    }

    // If city is missing, use location as city
    if (!address.city && location.length > 2) {
      // Clean up location
      const cleanedLocation = location.replace(/\b([A-Z]{2})\b/, '').trim()
      if (cleanedLocation) {
        address.city = cleanedLocation
      }
    }

    // If neighborhood is missing, might be a neighborhood
    if (!address.neighborhood && !lowerLocation.includes('brasil')) {
      address.neighborhood = location
    }
  }

  /**
   * Extract IPTU number from text
   */
  extractIptuNumber(text: string): string | null {
    const patterns = [
      /IPTU\s*(?:n[º°]?\.?\s*)?([0-9.\-\/]+)/i,
      /cadastro\s+(?:imobili[áa]rio|municipal)\s*(?:n[º°]?\.?\s*)?([0-9.\-\/]+)/i,
      /inscri[çc][ãa]o\s+(?:imobili[áa]ria|municipal)\s*(?:n[º°]?\.?\s*)?([0-9.\-\/]+)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PropertyExtractorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): PropertyExtractorConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const propertyExtractor = new PropertyExtractor()

// Export factory function for custom configurations
export function createPropertyExtractor(config?: Partial<PropertyExtractorConfig>): PropertyExtractor {
  return new PropertyExtractor(config)
}
