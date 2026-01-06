import { SupabaseClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { ProcessingJob } from '../types'

// Gemini configuration from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Initialize Gemini client
let geminiClient: GoogleGenerativeAI | null = null
let geminiModel: GenerativeModel | null = null

function getGeminiClient(): { client: GoogleGenerativeAI; model: GenerativeModel } {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY)
    // Use Gemini 3 Pro Preview para tarefas complexas de geração de documentos
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-3-pro-preview' })
  }

  return { client: geminiClient, model: geminiModel! }
}

interface CanonicalData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  deal: DealDetails | null
}

interface Person {
  id: string
  full_name: string
  cpf: string | null
  rg: string | null
  rg_issuer: string | null
  birth_date: string | null
  nationality: string | null
  marital_status: string | null
  profession: string | null
  address: Address | null
  email: string | null
  phone: string | null
  father_name: string | null
  mother_name: string | null
}

interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip: string
}

interface Property {
  id: string
  registry_number: string | null
  registry_office: string | null
  address: Address | null
  area: number | null
  area_unit: string | null
  iptu_number: string | null
  property_type: string | null
  description: string | null
}

interface GraphEdge {
  source_type: string
  source_id: string
  target_type: string
  target_id: string
  relationship: string
  confidence: number
  confirmed: boolean
}

interface DealDetails {
  type: string
  price?: number
  paymentSchedule?: {
    entries: PaymentEntry[]
  }
  conditions?: string[]
}

interface PaymentEntry {
  description: string
  percentage?: number
  amount?: number
  due_date?: string
}

interface DraftSection {
  id: string
  title: string
  type: string
  content: string
  order: number
}

interface PendingItem {
  id: string
  section_id: string
  field_path: string
  reason: string
  severity: 'error' | 'warning' | 'info'
}

interface ValidationResult {
  isValid: boolean
  pendingItems: PendingItem[]
  warnings: string[]
}

/**
 * Validate canonical data for purchase/sale deed
 */
function validatePurchaseSaleData(data: CanonicalData): ValidationResult {
  const pendingItems: PendingItem[] = []
  const warnings: string[] = []

  // Check if we have at least one property
  if (!data.properties || data.properties.length === 0) {
    pendingItems.push({
      id: `pending_${Date.now()}_1`,
      section_id: 'object',
      field_path: 'properties',
      reason: 'No property found in the transaction',
      severity: 'error',
    })
  }

  // Check if we have people
  if (!data.people || data.people.length === 0) {
    pendingItems.push({
      id: `pending_${Date.now()}_2`,
      section_id: 'parties',
      field_path: 'people',
      reason: 'No parties found in the transaction',
      severity: 'error',
    })
  }

  // Find buyers and sellers from edges
  const buyers = data.edges?.filter(e => e.relationship === 'buys') || []
  const sellers = data.edges?.filter(e => e.relationship === 'sells') || []

  if (buyers.length === 0) {
    pendingItems.push({
      id: `pending_${Date.now()}_3`,
      section_id: 'parties',
      field_path: 'buyers',
      reason: 'No buyers identified in the transaction',
      severity: 'error',
    })
  }

  if (sellers.length === 0) {
    pendingItems.push({
      id: `pending_${Date.now()}_4`,
      section_id: 'parties',
      field_path: 'sellers',
      reason: 'No sellers identified in the transaction',
      severity: 'error',
    })
  }

  // Check for married sellers without spouse consent
  if (data.people && data.edges) {
    const sellerIds = sellers.map(e => e.source_id)
    const marriedSellers = data.people.filter(
      p => sellerIds.includes(p.id) &&
      (p.marital_status === 'married' || p.marital_status === 'stable_union')
    )

    for (const seller of marriedSellers) {
      const hasSpouse = data.edges.some(
        e => e.relationship === 'spouse_of' &&
        (e.source_id === seller.id || e.target_id === seller.id)
      )

      if (!hasSpouse) {
        warnings.push(
          `Seller ${seller.full_name} is married but spouse information is missing`
        )
        pendingItems.push({
          id: `pending_${Date.now()}_spouse_${seller.id}`,
          section_id: 'parties',
          field_path: `sellers.${seller.id}.spouse`,
          reason: `Spouse consent required for married seller ${seller.full_name}`,
          severity: 'warning',
        })
      }
    }
  }

  // Check deal details
  if (!data.deal) {
    pendingItems.push({
      id: `pending_${Date.now()}_5`,
      section_id: 'price',
      field_path: 'deal',
      reason: 'Transaction details (price, payment) are missing',
      severity: 'error',
    })
  } else {
    if (!data.deal.price || data.deal.price === 0) {
      pendingItems.push({
        id: `pending_${Date.now()}_6`,
        section_id: 'price',
        field_path: 'deal.price',
        reason: 'Transaction price is missing or zero',
        severity: 'warning',
      })
    }
  }

  // Validate property details
  if (data.properties) {
    data.properties.forEach((prop, idx) => {
      if (!prop.registry_number) {
        pendingItems.push({
          id: `pending_${Date.now()}_prop_${idx}`,
          section_id: 'object',
          field_path: `properties.${idx}.registry_number`,
          reason: 'Property registry number (matrícula) is missing',
          severity: 'warning',
        })
      }
      if (!prop.address) {
        pendingItems.push({
          id: `pending_${Date.now()}_prop_addr_${idx}`,
          section_id: 'object',
          field_path: `properties.${idx}.address`,
          reason: 'Property address is missing',
          severity: 'warning',
        })
      }
    })
  }

  // Validate people details
  if (data.people) {
    data.people.forEach((person, idx) => {
      if (!person.cpf) {
        pendingItems.push({
          id: `pending_${Date.now()}_person_cpf_${idx}`,
          section_id: 'parties',
          field_path: `people.${idx}.cpf`,
          reason: `CPF missing for ${person.full_name}`,
          severity: 'warning',
        })
      }
      if (!person.rg) {
        pendingItems.push({
          id: `pending_${Date.now()}_person_rg_${idx}`,
          section_id: 'parties',
          field_path: `people.${idx}.rg`,
          reason: `RG missing for ${person.full_name}`,
          severity: 'warning',
        })
      }
      if (!person.address) {
        pendingItems.push({
          id: `pending_${Date.now()}_person_addr_${idx}`,
          section_id: 'parties',
          field_path: `people.${idx}.address`,
          reason: `Address missing for ${person.full_name}`,
          severity: 'warning',
        })
      }
    })
  }

  return {
    isValid: pendingItems.filter(p => p.severity === 'error').length === 0,
    pendingItems,
    warnings,
  }
}

/**
 * Generate draft prompt for Gemini
 */
function generateDraftPrompt(data: CanonicalData): string {
  // Format people data
  const peopleInfo = data.people
    ?.map(
      (p, idx) => `
Person ${idx + 1}:
- Name: ${p.full_name}
- CPF: ${p.cpf || '[PENDING]'}
- RG: ${p.rg || '[PENDING]'}${p.rg_issuer ? ` - ${p.rg_issuer}` : ''}
- Birth Date: ${p.birth_date || '[PENDING]'}
- Nationality: ${p.nationality || '[PENDING]'}
- Marital Status: ${p.marital_status || '[PENDING]'}
- Profession: ${p.profession || '[PENDING]'}
- Address: ${p.address ? `${p.address.street}, ${p.address.number}${p.address.complement ? ` ${p.address.complement}` : ''}, ${p.address.neighborhood}, ${p.address.city}-${p.address.state}, CEP ${p.address.zip}` : '[PENDING]'}
- Email: ${p.email || '[PENDING]'}
- Phone: ${p.phone || '[PENDING]'}
- Father: ${p.father_name || '[PENDING]'}
- Mother: ${p.mother_name || '[PENDING]'}
`
    )
    .join('\n') || 'No people data available'

  // Format properties data
  const propertiesInfo = data.properties
    ?.map(
      (p, idx) => `
Property ${idx + 1}:
- Registry Number: ${p.registry_number || '[PENDING]'}
- Registry Office: ${p.registry_office || '[PENDING]'}
- Type: ${p.property_type || '[PENDING]'}
- Area: ${p.area ? `${p.area} ${p.area_unit || 'm²'}` : '[PENDING]'}
- Address: ${p.address ? `${p.address.street}, ${p.address.number}${p.address.complement ? ` ${p.address.complement}` : ''}, ${p.address.neighborhood}, ${p.address.city}-${p.address.state}, CEP ${p.address.zip}` : '[PENDING]'}
- IPTU: ${p.iptu_number || '[PENDING]'}
- Description: ${p.description || '[PENDING]'}
`
    )
    .join('\n') || 'No property data available'

  // Format relationships
  const relationshipsInfo = data.edges
    ?.map(e => {
      const sourcePerson = data.people?.find(p => p.id === e.source_id)
      const targetPerson = data.people?.find(p => p.id === e.target_id)
      const targetProperty = data.properties?.find(p => p.id === e.target_id)

      const source = sourcePerson?.full_name || e.source_id
      const target = targetPerson?.full_name || targetProperty?.registry_number || e.target_id

      return `- ${source} ${e.relationship} ${target}`
    })
    .join('\n') || 'No relationships defined'

  // Format deal details
  const dealInfo = data.deal
    ? `
Transaction Type: ${data.deal.type}
Price: ${data.deal.price ? `R$ ${data.deal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '[PENDING]'}
Payment Schedule: ${
        data.deal.paymentSchedule?.entries
          ? data.deal.paymentSchedule.entries
              .map(
                entry => `
  - ${entry.description}: ${entry.amount ? `R$ ${entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : entry.percentage ? `${entry.percentage}%` : '[PENDING]'}${entry.due_date ? ` (Due: ${entry.due_date})` : ''}`
              )
              .join('\n')
          : '[PENDING]'
      }
Special Conditions: ${data.deal.conditions?.join('; ') || 'None'}
`
    : 'No deal details available'

  const prompt = `You are a legal document generator specialized in Brazilian real estate law. Generate a professional purchase and sale deed (Escritura Pública de Compra e Venda) based on the following canonical data.

CANONICAL DATA:

PARTIES:
${peopleInfo}

RELATIONSHIPS:
${relationshipsInfo}

PROPERTY:
${propertiesInfo}

TRANSACTION DETAILS:
${dealInfo}

IMPORTANT INSTRUCTIONS:
1. Generate the draft in formal Brazilian Portuguese (pt-BR) appropriate for notarial documents
2. Use "[PENDING]" placeholder for any missing information - DO NOT invent data
3. Structure the document in clear sections as specified in the JSON schema below
4. Follow Brazilian notarial conventions and legal terminology
5. Ensure all parties are properly identified with their roles (seller/buyer)
6. Include spouse information if parties are married
7. Describe the property comprehensively with all available details
8. State the price and payment terms clearly
9. Include standard legal clauses for purchase and sale
10. Keep professional, formal tone throughout

OUTPUT FORMAT:
Return a JSON object with the following structure:

{
  "sections": [
    {
      "id": "header",
      "title": "Cabeçalho",
      "type": "header",
      "content": "[Generated header content]",
      "order": 1
    },
    {
      "id": "parties",
      "title": "Partes",
      "type": "parties",
      "content": "[Generated parties section with qualifications]",
      "order": 2
    },
    {
      "id": "object",
      "title": "Objeto",
      "type": "object",
      "content": "[Generated property description]",
      "order": 3
    },
    {
      "id": "price",
      "title": "Preço e Forma de Pagamento",
      "type": "price",
      "content": "[Generated price and payment section]",
      "order": 4
    },
    {
      "id": "conditions",
      "title": "Condições Especiais",
      "type": "conditions",
      "content": "[Generated special conditions]",
      "order": 5
    },
    {
      "id": "clauses",
      "title": "Cláusulas Gerais",
      "type": "clauses",
      "content": "[Generated legal clauses]",
      "order": 6
    },
    {
      "id": "closing",
      "title": "Encerramento",
      "type": "closing",
      "content": "[Generated closing statements]",
      "order": 7
    }
  ]
}

Generate the draft now:`

  return prompt
}

/**
 * Parse sections from Gemini response
 */
function parseSectionsFromResponse(responseText: string): DraftSection[] {
  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    const codeBlockPattern = /^```(?:json)?\s*/
    const codeBlockEndPattern = /\s*```$/
    if (codeBlockPattern.test(cleanedResponse)) {
      cleanedResponse = cleanedResponse.replace(codeBlockPattern, '').replace(codeBlockEndPattern, '')
    }

    const parsed = JSON.parse(cleanedResponse)

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      console.error('Invalid response format: sections array not found')
      return []
    }

    return parsed.sections.map((section: any) => ({
      id: section.id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: section.title || 'Untitled Section',
      type: section.type || 'other',
      content: section.content || '',
      order: section.order || 0,
    }))
  } catch (error) {
    console.error('Failed to parse sections from response:', error)
    console.error('Response text:', responseText.substring(0, 500))
    return []
  }
}

/**
 * Generate HTML content from sections
 */
function generateHtmlFromSections(sections: DraftSection[]): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  const htmlSections = sortedSections
    .map(
      section => `
    <section class="draft-section" data-section-id="${section.id}" data-section-type="${section.type}">
      <h2 class="section-title">${section.title}</h2>
      <div class="section-content">
        ${section.content.replace(/\n/g, '<br>')}
      </div>
    </section>
  `
    )
    .join('\n')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minuta de Escritura Pública</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    .draft-section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
    }
    .section-content {
      text-align: justify;
      text-indent: 40px;
    }
  </style>
</head>
<body>
  ${htmlSections}
</body>
</html>
  `
}

export async function runDraftJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  console.log(`Running draft generation job for case ${job.case_id}`)

  try {
    // 1. Get case with canonical data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', job.case_id)
      .single()

    if (caseError || !caseData) {
      const errorMessage = `Failed to fetch case: ${caseError?.message || 'Case not found'}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    const canonicalData = caseData.canonical_data as CanonicalData | null

    if (!canonicalData) {
      const errorMessage = 'No canonical data found for this case. Please ensure entities have been extracted from documents.'
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    // 2. Validate canonical data
    const validation = validatePurchaseSaleData(canonicalData)
    console.log(`Validation result: ${validation.isValid ? 'VALID' : 'INVALID'}`)
    console.log(`Pending items: ${validation.pendingItems.length}`)
    console.log(`Warnings: ${validation.warnings.length}`)

    if (validation.warnings.length > 0) {
      console.log('Warnings:', validation.warnings)
    }

    // 3. Generate draft using Gemini Pro
    console.log('Generating draft with Gemini Pro...')
    let model: GenerativeModel
    try {
      const geminiClient = getGeminiClient()
      model = geminiClient.model
    } catch (geminiError) {
      const errorMessage = `Failed to initialize Gemini client: ${geminiError instanceof Error ? geminiError.message : 'Unknown error'}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    const prompt = generateDraftPrompt(canonicalData)

    let responseText: string
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      responseText = response.text()

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Gemini returned empty response')
      }
    } catch (geminiError) {
      const errorMessage = `Failed to generate draft with Gemini: ${geminiError instanceof Error ? geminiError.message : 'AI model error'}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    // 4. Parse sections from response
    const sections = parseSectionsFromResponse(responseText)

    if (sections.length === 0) {
      const errorMessage = 'Failed to parse draft sections from AI response. The response format may be invalid.'
      console.error(errorMessage)
      console.error('Response preview:', responseText.substring(0, 500))
      throw new Error(errorMessage)
    }

    console.log(`Generated ${sections.length} sections`)

    // 5. Generate HTML content
    const htmlContent = generateHtmlFromSections(sections)

    // 6. Get next version number
    const { data: existingDrafts, error: draftsError } = await supabase
      .from('drafts')
      .select('version')
      .eq('case_id', job.case_id)
      .order('version', { ascending: false })
      .limit(1)

    if (draftsError) {
      const errorMessage = `Failed to query existing drafts: ${draftsError.message}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    const nextVersion = existingDrafts && existingDrafts.length > 0 ? existingDrafts[0].version + 1 : 1

    // 7. Save draft to database
    const { data: newDraft, error: insertError } = await supabase
      .from('drafts')
      .insert({
        case_id: job.case_id,
        version: nextVersion,
        content: { sections },
        html_content: htmlContent,
        pending_items: validation.pendingItems,
        status: validation.isValid ? 'generated' : 'reviewing',
      })
      .select()
      .single()

    if (insertError || !newDraft) {
      const errorMessage = `Failed to save draft to database: ${insertError?.message || 'Unknown database error'}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    console.log(`Draft created successfully: ${newDraft.id}, version ${nextVersion}`)

    return {
      status: 'completed',
      draft_id: newDraft.id,
      version: nextVersion,
      sections_count: sections.length,
      pending_items: validation.pendingItems,
      is_valid: validation.isValid,
    }
  } catch (error) {
    // Enhanced error handling with detailed logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during draft generation'
    console.error('Error in draft generation job:', errorMessage)
    console.error('Full error:', error)

    // Re-throw with a user-friendly message while preserving technical details
    const enhancedError = new Error(errorMessage)
    if (error instanceof Error && error.stack) {
      enhancedError.stack = error.stack
    }
    throw enhancedError
  }
}
