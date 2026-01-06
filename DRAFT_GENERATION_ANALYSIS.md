# Draft Generation Job Analysis

## Overview

The draft generation job (`worker/src/jobs/draft.ts`) is the final stage in the Minuta Canvas document processing pipeline. It transforms the **canonical data model** (people, properties, and relationships) into a professional Brazilian legal deed document using **Google Gemini 3 Pro Preview**.

**Core principle**: "No evidence = no auto-fill" - Every piece of information in the draft must be traceable to source documents. Missing data is explicitly marked as `[PENDING]` rather than inferred.

---

## Architecture & Data Flow

### Pipeline Position

```
OCR → Extraction → Consensus → Entity Resolution → Entity Extraction → [DRAFT]
```

The draft job is triggered when:
1. All upstream jobs (OCR through entity extraction) are completed
2. A `processing_jobs` record with `job_type = 'draft'` reaches status `pending`
3. The worker processor picks it up and calls `runDraftJob()`

### Input: Canonical Data Model

The job retrieves the case's `canonical_data` JSONB field from the `cases` table:

```typescript
interface CanonicalData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  deal: DealDetails | null
}
```

**Key structure:**

| Field | Type | Purpose |
|-------|------|---------|
| `people[]` | Person[] | Parties to the transaction (buyers, sellers, spouses) |
| `properties[]` | Property[] | Real estate being transferred |
| `edges[]` | GraphEdge[] | Relationships between people and properties |
| `deal` | DealDetails | Transaction terms (price, payment schedule, conditions) |

#### Person Entity

```typescript
interface Person {
  id: string
  full_name: string
  cpf: string | null                    // Individual taxpayer ID
  rg: string | null                     // National ID
  rg_issuer: string | null
  birth_date: string | null
  nationality: string | null
  marital_status: MaritalStatus | null  // married | single | divorced | widowed | etc.
  profession: string | null
  address: Address | null
  email: string | null
  phone: string | null
  father_name: string | null
  mother_name: string | null
}
```

#### Property Entity

```typescript
interface Property {
  id: string
  registry_number: string | null        // Matrícula (property deed registry number)
  registry_office: string | null        // Which cartório holds the deed
  address: Address | null
  area: number | null
  area_unit: string | null              // Usually "m²"
  iptu_number: string | null            // Property tax ID
  property_type: string | null          // "residential", "commercial", etc.
  description: string | null
}
```

#### GraphEdge (Relationships)

```typescript
interface GraphEdge {
  source_type: string                   // "person" | "property"
  source_id: string                     // ID of seller/owner
  target_type: string                   // "person" | "property"
  target_id: string                     // ID of buyer/property
  relationship: string                  // "sells", "buys", "spouse_of", "owns", etc.
  confidence: number                    // 0-1 confidence score
  confirmed: boolean                    // User-verified?
}
```

#### Deal Details

```typescript
interface DealDetails {
  type: ActType                         // "purchase_sale", "donation", "exchange", "lease"
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
```

---

## Core Processing Steps

### Step 1: Fetch Case & Canonical Data

```typescript
const { data: caseData } = await supabase
  .from('cases')
  .select('*')
  .eq('id', job.case_id)
  .single()

const canonicalData = caseData.canonical_data as CanonicalData | null
```

**Error handling**: Throws if case not found or canonical_data is missing.

### Step 2: Validation

The `validatePurchaseSaleData()` function checks for completeness:

#### Required Fields (Errors)
- At least 1 property exists
- At least 1 person exists
- At least 1 seller (edge with `relationship === 'sells'`)
- At least 1 buyer (edge with `relationship === 'buys'`)

#### Conditional Warnings
- Married sellers must have spouse information (for spouse consent)
- Property registry numbers are strongly recommended
- CPF/RG/Address data for all parties

#### Output: ValidationResult

```typescript
{
  isValid: boolean                      // true if no error-level pending items
  pendingItems: PendingItem[]           // Items marked [PENDING] in draft
  warnings: string[]                    // Non-blocking issues
}
```

**Pending item example:**
```typescript
{
  id: "pending_1703500800_1",
  section_id: "parties",
  field_path: "people.0.cpf",
  reason: "CPF missing for João Silva",
  severity: "warning"
}
```

### Step 3: Generate Prompt

`generateDraftPrompt()` formats canonical data into a structured text prompt:

```text
You are a legal document generator specialized in Brazilian real estate law...

CANONICAL DATA:

PARTIES:
Person 1:
- Name: João Silva
- CPF: 123.456.789-00
- RG: 12345678 - SSP-SP
- Address: Rua das Flores, 100, Apto 42, Centro, São Paulo-SP, CEP 01311-100
- Marital Status: married
...

RELATIONSHIPS:
- João Silva sells Property 1
- Maria Silva spouse_of João Silva
...

PROPERTY:
Property 1:
- Registry Number: 12345-0
- Registry Office: Cartório do Primeiro Ofício
- Type: residential
- Area: 85.5 m²
- Address: Rua das Flores, 100, Apto 42, Centro, São Paulo-SP, CEP 01311-100
...

TRANSACTION DETAILS:
Transaction Type: purchase_sale
Price: R$ 450.000,00
Payment Schedule:
  - Entry: R$ 45.000,00 (10%) on contract
  - Balance: R$ 405.000,00 (90%) on closing
```

**Key features:**
- Formats numbers with Brazilian locale (`R$ 450.000,00`)
- Marks missing data with `[PENDING]`
- Uses readable relationship descriptions
- Includes relationship types to identify parties' roles

### Step 4: Gemini Generation

Calls **Gemini 3 Pro Preview** for draft generation:

```typescript
const { model } = getGeminiClient()
const result = await model.generateContent(prompt)
const responseText = response.text()
```

**Model choice:** `gemini-3-pro-preview`
- Supports structured output (JSON schema)
- Optimized for complex legal document generation
- Preferred over Flash for document generation tasks

**Prompt instructs model to output JSON:**

```json
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
```

**Section types:**
- `header` - Document title and notary information
- `parties` - Identification and qualification of buyers/sellers
- `object` - Property description and registry information
- `price` - Transaction price and payment terms
- `conditions` - Special clauses or conditions
- `clauses` - Standard legal clauses for purchase and sale
- `closing` - Signature block and notary certification

### Step 5: Parse Response

`parseSectionsFromResponse()` handles:

```typescript
// Remove markdown code blocks if present
let cleanedResponse = responseText.trim()
if (codeBlockPattern.test(cleanedResponse)) {
  cleanedResponse = cleanedResponse
    .replace(codeBlockPattern, '')
    .replace(codeBlockEndPattern, '')
}

// Parse JSON
const parsed = JSON.parse(cleanedResponse)
if (!parsed.sections || !Array.isArray(parsed.sections)) {
  throw new Error('Invalid response format')
}

// Map to typed sections
return parsed.sections.map((section: any) => ({
  id: section.id || `section_${Date.now()}_...`,
  title: section.title || 'Untitled Section',
  type: section.type || 'other',
  content: section.content || '',
  order: section.order || 0,
}))
```

**Error resilience:**
- Strips markdown formatting
- Provides defaults for missing fields
- Generates IDs for unnamed sections
- Logs failures with response preview

### Step 6: Generate HTML

`generateHtmlFromSections()` creates a styled HTML document:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Minuta de Escritura Pública</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #333;
    }
    .section-content {
      text-align: justify;
      text-indent: 40px;
    }
  </style>
</head>
<body>
  <section class="draft-section" data-section-id="parties" data-section-type="parties">
    <h2 class="section-title">Partes</h2>
    <div class="section-content">
      Compareceram perante mim [...]
    </div>
  </section>
  ...
</body>
</html>
```

**Features:**
- Times New Roman (formal legal document standard)
- Justified text with first-line indentation
- Section metadata in data attributes
- Newlines preserved as `<br>` tags

### Step 7: Save to Database

Creates a new draft record:

```typescript
const nextVersion = existingDrafts.length > 0
  ? existingDrafts[0].version + 1
  : 1

const { data: newDraft } = await supabase
  .from('drafts')
  .insert({
    case_id: job.case_id,
    version: nextVersion,
    content: { sections },              // Structured JSON
    html_content: htmlContent,          // Rendered HTML
    pending_items: validation.pendingItems,
    status: validation.isValid ? 'generated' : 'reviewing'
  })
  .select()
  .single()
```

**Draft table schema:**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `case_id` | uuid | Links to case |
| `version` | integer | Draft version number (auto-incrementing) |
| `content` | jsonb | `{ sections: DraftSection[] }` |
| `html_content` | text | Rendered HTML for display |
| `pending_items` | jsonb | Items marked `[PENDING]` |
| `status` | text | `'generated'` or `'reviewing'` |
| `created_at` | timestamp | Creation time |

---

## Output: Draft Structure

### In Frontend Store (`src/stores/caseStore.ts`)

```typescript
interface CaseState {
  currentDraft: Draft | null
  // ...
}

// Usage:
useCaseStore.getState().currentDraft // Access current draft
useCaseStore.setState({ currentDraft: draft }) // Update draft
```

### In Database (`drafts` table)

```typescript
interface Draft {
  id: string
  case_id: string
  version: number
  content: DraftContent              // { sections: DraftSection[] }
  html_content: string
  pending_items: PendingItem[]
  status: DraftStatus                // 'generated' | 'reviewing' | 'approved'
  created_at: string
}

interface DraftContent {
  sections: DraftSection[]
}

interface DraftSection {
  id: string
  title: string
  type: SectionType
  content: string                    // Markdown/formatted text
  order: number                      // Display order
}

type SectionType = 'header' | 'parties' | 'object' | 'price' | 'conditions' | 'clauses' | 'closing'
```

### In Frontend Display (`src/pages/DraftPage.tsx`)

```typescript
export default function DraftPage() {
  const [content, setContent] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftVersions, setDraftVersions] = useState<Draft[]>([])

  // Loads draft on page init:
  // 1. Fetches latest draft by case_id
  // 2. Renders html_content in TiptapEditor
  // 3. Shows DraftSectionNav for navigation
  // 4. Displays ChatPanel for conversational editing

  return (
    <div className="draft-page">
      <TiptapEditor content={content} onChange={setContent} />
      <ChatPanel draftId={draftId} />
      <DraftVersionHistory versions={draftVersions} />
      {/* ... */}
    </div>
  )
}
```

---

## Validation & Pending Items

### Validation Logic

Runs before Gemini generation to flag missing critical data:

```typescript
function validatePurchaseSaleData(data: CanonicalData): ValidationResult {
  const pendingItems: PendingItem[] = []
  const warnings: string[] = []

  // Check for required entities
  if (!data.properties?.length) {
    pendingItems.push({
      severity: 'error',
      reason: 'No property found in the transaction'
    })
  }

  if (!data.people?.length) {
    pendingItems.push({
      severity: 'error',
      reason: 'No parties found in the transaction'
    })
  }

  // Check relationships
  const buyers = data.edges?.filter(e => e.relationship === 'buys') || []
  const sellers = data.edges?.filter(e => e.relationship === 'sells') || []

  if (!buyers.length) {
    pendingItems.push({
      severity: 'error',
      reason: 'No buyers identified in the transaction'
    })
  }

  // Check married sellers have spouse consent
  const marriedSellers = data.people.filter(
    p => sellerIds.includes(p.id) &&
    ['married', 'stable_union'].includes(p.marital_status)
  )

  for (const seller of marriedSellers) {
    const hasSpouse = data.edges.some(
      e => e.relationship === 'spouse_of' &&
      (e.source_id === seller.id || e.target_id === seller.id)
    )

    if (!hasSpouse) {
      warnings.push(`Spouse consent required for married seller ${seller.full_name}`)
      pendingItems.push({
        severity: 'warning',
        reason: `Spouse consent required for married seller ${seller.full_name}`
      })
    }
  }

  // Check property details
  data.properties.forEach((prop, idx) => {
    if (!prop.registry_number) {
      pendingItems.push({
        severity: 'warning',
        field_path: `properties.${idx}.registry_number`,
        reason: 'Property registry number (matrícula) is missing'
      })
    }
    if (!prop.address) {
      pendingItems.push({
        severity: 'warning',
        field_path: `properties.${idx}.address`,
        reason: 'Property address is missing'
      })
    }
  })

  // Check person details
  data.people.forEach((person, idx) => {
    if (!person.cpf) {
      pendingItems.push({
        severity: 'warning',
        reason: `CPF missing for ${person.full_name}`
      })
    }
    if (!person.rg) {
      pendingItems.push({
        severity: 'warning',
        reason: `RG missing for ${person.full_name}`
      })
    }
  })

  return {
    isValid: pendingItems.filter(p => p.severity === 'error').length === 0,
    pendingItems,
    warnings
  }
}
```

### Marking Missing Data

In the prompt, missing fields are explicitly marked:

```typescript
- CPF: ${p.cpf || '[PENDING]'}
- Address: ${p.address ? `${p.address.street}...` : '[PENDING]'}
```

Gemini respects this convention and includes `[PENDING]` in generated text:

```
As partes acima qualificadas...
- CPF/RG: [PENDING] - A ser preenchido pelo tabelião
```

### Frontend Handling

The DraftPage and related components display pending items:

```typescript
export default function DraftPage() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])

  // Display warning banner for pending items
  return (
    <>
      {pendingItems.length > 0 && (
        <Alert variant="warning">
          <ExclamationTriangleIcon />
          {pendingItems.length} items require review
        </Alert>
      )}
      {/* ... draft content ... */}
    </>
  )
}
```

---

## Integration with Other Jobs

### Upstream Dependencies

1. **Entity Extraction Job** (latest upstream)
   - Creates/merges `people` and `properties` records
   - Populates `canonical_data.people` and `canonical_data.properties`
   - Creates graph edges for relationships

2. **Entity Resolution Job**
   - Deduplicates people (by CPF, name similarity, RG)
   - Creates initial `edges` entries
   - Finalizes person/property records

3. **Consensus Job**
   - Compares OCR vs LLM extraction results
   - Marks conflicts as pending
   - Confirms high-confidence fields

4. **Extraction Job**
   - Runs Gemini Flash to extract structured JSON from document images
   - Produces initial LLM results for consensus

5. **OCR Job**
   - Google Document AI extracts text + layout blocks
   - Produces initial OCR results

### Downstream: Chat & Edits

After draft generation, users can:

1. **View & Edit** (Tiptap editor on `DraftPage`)
   - Manually edit sections
   - Conversational chat interface for edits

2. **Request Regeneration** (chat)
   - Chat function: `regenerate_section`
   - Regenerates specific section with updated prompts

3. **Mark Fields** (audit trail)
   - Mark fields as pending via chat
   - Creates entries in `operations_log` table

4. **Export** (utility functions in `src/utils/exportDraft.ts`)
   - Export as HTML
   - Export as PDF
   - Print directly

---

## Error Handling

### Validation Failures

If validation has error-level pending items:

```typescript
return {
  status: 'completed',
  sections_count: sections.length,
  pending_items: validation.pendingItems,
  is_valid: false  // Draft status will be 'reviewing'
}
```

Draft is saved with `status: 'reviewing'` so users must review before approval.

### Gemini Failures

```typescript
try {
  const result = await model.generateContent(prompt)
  const response = await result.response
  responseText = response.text()
} catch (geminiError) {
  const errorMessage = `Failed to generate draft with Gemini: ${geminiError.message}`
  throw new Error(errorMessage)
}
```

Worker retries with exponential backoff (configured in job processing).

### Parsing Failures

```typescript
try {
  const parsed = JSON.parse(cleanedResponse)
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid response format: sections array not found')
  }
} catch (error) {
  console.error('Failed to parse sections from response:', error)
  throw new Error('Failed to parse draft sections from AI response...')
}
```

### Database Failures

```typescript
const { data: newDraft, error: insertError } = await supabase
  .from('drafts')
  .insert({ /* ... */ })
  .select()
  .single()

if (insertError || !newDraft) {
  throw new Error(`Failed to save draft to database: ${insertError?.message}`)
}
```

---

## Return Value

```typescript
Promise<Record<string, unknown>> = {
  status: 'completed',              // or 'failed'
  draft_id: string,                 // UUID of saved draft
  version: number,                  // Version number (1, 2, 3, etc.)
  sections_count: number,           // Number of sections generated
  pending_items: PendingItem[],      // Items marked [PENDING]
  is_valid: boolean                 // Whether validation passed
}
```

Example:
```json
{
  "status": "completed",
  "draft_id": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "sections_count": 7,
  "pending_items": [
    {
      "id": "pending_1703500800_1",
      "section_id": "parties",
      "field_path": "people.0.cpf",
      "reason": "CPF missing for João Silva",
      "severity": "warning"
    }
  ],
  "is_valid": false
}
```

---

## Prompt Engineering Details

### Language & Tone

The prompt directs Gemini to:

1. **Use formal Brazilian Portuguese (pt-BR)**
   - Appropriate for notarial documents
   - Follows legal conventions of Brazilian cartórios

2. **Follow Brazilian notarial conventions**
   - Proper party identification and qualification
   - Standard clauses for purchase and sale

3. **Use correct legal terminology**
   - "Escritura Pública de Compra e Venda"
   - Proper property descriptions

### Key Instructions to Model

```
1. Generate the draft in formal Brazilian Portuguese (pt-BR)...
2. Use "[PENDING]" placeholder for any missing information - DO NOT invent data
3. Structure the document in clear sections as specified in the JSON schema below
4. Follow Brazilian notarial conventions and legal terminology
5. Ensure all parties are properly identified with their roles (seller/buyer)
6. Include spouse information if parties are married
7. Describe the property comprehensively with all available details
8. State the price and payment terms clearly
9. Include standard legal clauses for purchase and sale
10. Keep professional, formal tone throughout
```

### Ensuring Traceability

The prompt includes explicit data sources:

- Parties identified from `people[]` with all fields
- Relationships from `edges[]` showing who buys from whom
- Property details from `properties[]` including registry numbers
- Deal terms from `deal` with price and payment schedule

This maintains the "No evidence = no auto-fill" principle.

---

## Environment & Configuration

### Required Environment Variables

```bash
GEMINI_API_KEY              # Google Generative AI API key
SUPABASE_SERVICE_ROLE_KEY   # Supabase service role (bypasses RLS)
```

### Model Selection

```typescript
const GEMINI_MODEL = 'gemini-3-pro-preview'  // For complex document generation
```

- **Flash** (gemini-3-flash-preview) used for extraction jobs
- **Pro** (gemini-3-pro-preview) used for draft generation
- **Choice rationale**: Pro has better reasoning for complex document generation

### Configuration

```typescript
const MAX_DRAFT_SECTIONS = 7  // Standard structure
const TEMPLATE_STRUCTURE = {
  'header',
  'parties',
  'object',
  'price',
  'conditions',
  'clauses',
  'closing'
}
```

---

## Key Insights & Patterns

### 1. Explicit Placeholders for Missing Data

Rather than inferring or leaving blank, all missing data is marked `[PENDING]` so:
- Users see exactly what's missing
- Notary can easily identify gaps
- Audit trail shows what was auto-filled vs. pending review

### 2. Confidence-Aware Validation

The validation system distinguishes:
- **Errors** (blocks draft generation): No parties, no property, no relationships
- **Warnings** (allows generation but marks as reviewing): Missing CPF, RG, registry numbers, spouse consent

This allows drafts to be generated even with incomplete data, but flags them for review.

### 3. Versioning

Each draft is versioned automatically:
```typescript
nextVersion = existingDrafts.length > 0
  ? existingDrafts[0].version + 1
  : 1
```

Users can view all versions and compare them (DraftVersionHistory component).

### 4. Section-Based Structure

Rather than free-form text, drafts are structured as ordered sections:
- Each section has an ID, type, title, and content
- Enables targeted chat edits ("update the price section")
- Allows partial regeneration of individual sections

### 5. Separation of Concerns

```
Canonical Data (graph: people, properties, edges, deal)
    ↓
Validation (identify missing fields)
    ↓
Prompt Generation (format data for LLM)
    ↓
Gemini Generation (AI produces JSON)
    ↓
Parsing (extract sections)
    ↓
HTML Rendering (style for display)
    ↓
Database Persistence
```

Each step is independent and can be tested/debugged separately.

---

## File Structure

```
worker/src/jobs/draft.ts
├── Types (interfaces)
│   ├── CanonicalData
│   ├── Person, Property, GraphEdge, DealDetails
│   ├── DraftSection, PendingItem
│   └── ValidationResult
├── Functions
│   ├── getGeminiClient()
│   ├── validatePurchaseSaleData()
│   ├── generateDraftPrompt()
│   ├── parseSectionsFromResponse()
│   ├── generateHtmlFromSections()
│   └── runDraftJob() [MAIN EXPORT]
└── Error Handling
    ├── Validation failures
    ├── Gemini API failures
    ├── Parsing failures
    └── Database failures
```

---

## Summary

The draft generation job is the **semantic endpoint** of the Minuta Canvas pipeline. It:

1. **Consumes** the canonical data model (people, properties, relationships, deal terms)
2. **Validates** completeness and marks gaps as `[PENDING]`
3. **Prompts** Gemini 3 Pro to generate professional Brazilian legal text
4. **Structures** output as ordered sections (header, parties, object, price, conditions, clauses, closing)
5. **Persists** as a versioned draft record with HTML rendering
6. **Enables** downstream chat-based editing and approval workflow

The design prioritizes **traceability** (everything links to source documents), **clarity** (missing data explicitly marked), and **editability** (section-based structure for targeted modifications).
