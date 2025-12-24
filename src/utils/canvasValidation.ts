import type { Person, Property, GraphEdge, RelationshipType } from '../types'

export interface ValidationWarning {
  id: string
  type: 'error' | 'warning'
  title: string
  description: string
  affectedEntities: {
    type: 'person' | 'property'
    id: string
    name: string
  }[]
}

/**
 * Validates canvas data for business rules compliance
 */
export function validateCanvas(
  people: Person[],
  properties: Property[],
  edges: GraphEdge[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  // Check for missing spouse consent
  warnings.push(...checkSpouseConsent(people, edges))

  return warnings
}

/**
 * Check if married sellers have spouse consent
 * Rule: If seller is married (not separated), spouse must sign or be involved
 */
function checkSpouseConsent(people: Person[], edges: GraphEdge[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  // Find all people who are selling property
  const sellers = edges
    .filter((edge) => edge.relationship === 'sells' && edge.source_type === 'person')
    .map((edge) => edge.source_id)

  // Check each seller
  for (const sellerId of sellers) {
    const seller = people.find((p) => p.id === sellerId)
    if (!seller) continue

    // Check if seller is married or in stable union
    const isMarried =
      seller.marital_status === 'married' || seller.marital_status === 'stable_union'

    if (!isMarried) continue

    // Find spouse relationship
    const spouseEdge = edges.find(
      (edge) =>
        edge.relationship === 'spouse_of' &&
        ((edge.source_type === 'person' && edge.source_id === sellerId) ||
          (edge.target_type === 'person' && edge.target_id === sellerId))
    )

    if (!spouseEdge) {
      // No spouse found in the canvas - warning about missing spouse
      warnings.push({
        id: `spouse-consent-missing-${sellerId}`,
        type: 'error',
        title: 'Consentimento do cônjuge ausente',
        description: `${seller.full_name} está ${
          seller.marital_status === 'married' ? 'casado(a)' : 'em união estável'
        } e vendendo propriedade, mas o cônjuge não foi identificado no canvas. O cônjuge deve assinar a escritura ou fornecer documentos de separação.`,
        affectedEntities: [
          {
            type: 'person',
            id: seller.id,
            name: seller.full_name,
          },
        ],
      })
      continue
    }

    // Spouse exists, check if spouse is also selling the same property
    const spouseId =
      spouseEdge.source_id === sellerId ? spouseEdge.target_id : spouseEdge.source_id

    // Get properties being sold by the seller
    const sellerProperties = edges
      .filter((edge) => edge.relationship === 'sells' && edge.source_id === sellerId)
      .map((edge) => edge.target_id)

    // Get properties being sold by the spouse
    const spouseSellingProperties = edges
      .filter((edge) => edge.relationship === 'sells' && edge.source_id === spouseId)
      .map((edge) => edge.target_id)

    // Find properties where seller is selling but spouse is not
    const propertiesNeedingConsent = sellerProperties.filter(
      (propId) => !spouseSellingProperties.includes(propId)
    )

    if (propertiesNeedingConsent.length > 0) {
      const spouse = people.find((p) => p.id === spouseId)

      warnings.push({
        id: `spouse-consent-${sellerId}-${spouseId}`,
        type: 'error',
        title: 'Consentimento do cônjuge necessário',
        description: `${seller.full_name} está ${
          seller.marital_status === 'married' ? 'casado(a)' : 'em união estável'
        } com ${
          spouse?.full_name || 'cônjuge'
        } e vendendo propriedade(s), mas o cônjuge não está registrado como vendedor nas mesmas propriedades. O cônjuge deve assinar como co-vendedor ou fornecer documentos de separação de bens.`,
        affectedEntities: [
          {
            type: 'person',
            id: seller.id,
            name: seller.full_name,
          },
          {
            type: 'person',
            id: spouseId,
            name: spouse?.full_name || 'Cônjuge',
          },
        ],
      })
    }
  }

  return warnings
}
