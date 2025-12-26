# Draft Generation Flow Diagram

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DOCUMENT PROCESSING PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────┘

  1. OCR              2. Extraction        3. Consensus      4. Entity Res.
┌─────────┐        ┌──────────────┐    ┌────────────┐    ┌──────────────┐
│         │   →    │              │ →  │            │ →  │              │
│  Document    Google Doc AI    Gemini Flash  Compare    Deduplicate
│  Images      (text + blocks)   (structured)   Results   People/Props
│         │        │              │    │            │    │              │
└─────────┘        └──────────────┘    └────────────┘    └──────────────┘
                            ↓                ↓                    ↓
                        OcrResult      ConsensusResult      Person, Property
                                                               GraphEdge


  5. Entity Extraction        6. DRAFT GENERATION ← YOU ARE HERE
┌─────────────────────┐    ┌─────────────────────────────┐
│                     │ →  │                             │
│  Create merged      │    │  Canonical Data Model       │
│  Person/Property    │    │  + Validation               │
│  records            │    │  + Gemini 3 Pro             │
│                     │    │  + Section Generation       │
└─────────────────────┘    │  + HTML Rendering           │
        ↓                  │                             │
    Evidence              │  Draft Record (versioned)   │
    records               │  + Pending Items            │
    (traceability)        │  + HTML Content             │
                          └─────────────────────────────┘
                                    ↓
                          7. Frontend Display
                          ┌──────────────────────┐
                          │  TiptapEditor        │
                          │  ChatPanel           │
                          │  DraftVersionHistory │
                          │  Export/Print        │
                          └──────────────────────┘
```

---

## Draft Generation Job Internals

```
runDraftJob(supabase, job)
│
├─ 1. FETCH CASE & CANONICAL DATA
│  │
│  ├─ Query: cases table where id = job.case_id
│  └─ Extract: canonical_data JSONB
│      {
│        people: Person[],
│        properties: Property[],
│        edges: GraphEdge[],
│        deal: DealDetails
│      }
│
├─ 2. VALIDATION
│  │
│  ├─ validatePurchaseSaleData(canonicalData)
│  │  │
│  │  ├─ Check: At least 1 property ✓
│  │  ├─ Check: At least 1 person ✓
│  │  ├─ Check: At least 1 seller (buys edge) ✓
│  │  ├─ Check: At least 1 buyer (sells edge) ✓
│  │  ├─ Check: Married sellers have spouse info → Warning
│  │  ├─ Check: CPF/RG/Address completeness → Warning
│  │  └─ Check: Property registry numbers → Warning
│  │
│  └─ Return: ValidationResult {
│      isValid: boolean,
│      pendingItems: PendingItem[],
│      warnings: string[]
│    }
│
├─ 3. PROMPT GENERATION
│  │
│  ├─ generateDraftPrompt(canonicalData)
│  │  │
│  │  ├─ Format people:
│  │  │   Person 1: [NAME, CPF/[PENDING], RG/[PENDING], ADDRESS/[PENDING]]
│  │  │
│  │  ├─ Format properties:
│  │  │   Property 1: [REGISTRY, ADDRESS, AREA, TYPE/[PENDING]]
│  │  │
│  │  ├─ Format edges:
│  │  │   "João Silva sells Property 1 to Maria Santos"
│  │  │   "Maria Silva spouse_of João Silva"
│  │  │
│  │  └─ Format deal:
│  │       Transaction Type: purchase_sale
│  │       Price: R$ 450.000,00
│  │       Payment: R$ 45.000,00 (10%), R$ 405.000,00 (90%)
│  │
│  └─ Return: Prompt string (with model instructions)
│
├─ 4. GEMINI GENERATION
│  │
│  ├─ Get Gemini 3 Pro Preview model
│  ├─ Call: model.generateContent(prompt)
│  └─ Return: Response text (JSON)
│
├─ 5. PARSE RESPONSE
│  │
│  ├─ parseSectionsFromResponse(responseText)
│  │  │
│  │  ├─ Strip markdown code blocks (```json ... ```)
│  │  ├─ JSON.parse()
│  │  ├─ Validate: sections array exists
│  │  ├─ Map: sections → DraftSection[]
│  │  │   {
│  │  │     id: "header" | "parties" | "object" | ...
│  │  │     title: "Cabeçalho" | "Partes" | ...
│  │  │     type: "header" | "parties" | "object" | "price" | ...
│  │  │     content: "[Generated legal text]",
│  │  │     order: 1 | 2 | 3 | ...
│  │  │   }
│  │  │
│  │  └─ Handle errors: Log + throw
│  │
│  └─ Return: DraftSection[]
│
├─ 6. HTML RENDERING
│  │
│  ├─ generateHtmlFromSections(sections)
│  │  │
│  │  ├─ Sort by section.order
│  │  ├─ Generate HTML:
│  │  │   <!DOCTYPE html>
│  │  │   <html lang="pt-BR">
│  │  │   <head>
│  │  │     <style>
│  │  │       font-family: 'Times New Roman'
│  │  │       text-align: justify
│  │  │       text-indent: 40px
│  │  │     </style>
│  │  │   </head>
│  │  │   <body>
│  │  │     <section data-section-id="parties">
│  │  │       <h2>Partes</h2>
│  │  │       <div>[Content with <br> for newlines]</div>
│  │  │     </section>
│  │  │     ...
│  │  │   </body>
│  │  │   </html>
│  │  │
│  │  └─ Return: HTML string
│  │
│  └─ Purpose: Display in browser, print, export to PDF
│
├─ 7. DATABASE PERSISTENCE
│  │
│  ├─ Query existing drafts: ORDER BY version DESC LIMIT 1
│  ├─ Calculate: nextVersion = max(version) + 1
│  │
│  ├─ Insert draft record:
│  │  {
│  │    case_id: job.case_id,
│  │    version: nextVersion,           ← Auto-incrementing
│  │    content: { sections },          ← Structured JSON
│  │    html_content: htmlContent,      ← Rendered HTML
│  │    pending_items: validation.pendingItems,
│  │    status: isValid ? 'generated' : 'reviewing'  ← Conditional
│  │  }
│  │
│  └─ Return: newDraft (with id)
│
└─ 8. RETURN RESULT
   {
     status: "completed",
     draft_id: uuid,
     version: 1,
     sections_count: 7,
     pending_items: [...],
     is_valid: false|true
   }
```

---

## Validation Rules

```
ERRORS (Block Draft Generation if found)
├─ No properties in case
├─ No people in case
├─ No sellers identified (no "sells" edges)
└─ No buyers identified (no "buys" edges)

WARNINGS (Allow Generation, mark "reviewing")
├─ Married seller without spouse information
│   └─ Rule: If person.marital_status ∈ [married, stable_union]
│      AND person in sellers (edge.source_id with "sells" relationship)
│      AND no spouse_of edge found
│      → Add warning
│
├─ Missing CPF for any person
├─ Missing RG for any person
├─ Missing address for any person
├─ Missing property registry number (matrícula)
├─ Missing property address
└─ Missing or zero transaction price
```

---

## Prompt Template Structure

```
[PREAMBLE]
You are a legal document generator specialized in Brazilian real estate law.
Generate a professional purchase and sale deed...

[CANONICAL DATA]
PARTIES:
Person 1:
  - Name: [full_name]
  - CPF: [cpf || '[PENDING]']
  - RG: [rg || '[PENDING]']
  - Address: [full address || '[PENDING]']
  - Marital Status: [marital_status || '[PENDING]']
  - Profession: [profession || '[PENDING]']
  ...

RELATIONSHIPS:
  - [source] [relationship] [target]
  - João Silva sells Property 1
  - Maria Silva spouse_of João Silva
  ...

PROPERTY:
Property 1:
  - Registry Number: [registry_number || '[PENDING]']
  - Address: [full address || '[PENDING]']
  - Area: [area] [area_unit || 'm²']
  - Type: [property_type || '[PENDING]']
  ...

TRANSACTION DETAILS:
  Transaction Type: [deal.type]
  Price: R$ [formatted] || '[PENDING]'
  Payment Schedule:
    - Entry 1: [amount] ([percentage]%) on [due_date]
    - Entry 2: [amount] ([percentage]%) on [due_date]
  Special Conditions: [conditions.join('; ') || 'None']

[INSTRUCTIONS]
1. Generate in formal Brazilian Portuguese (pt-BR)
2. Use '[PENDING]' for missing info - DO NOT invent data
3. Structure in sections with JSON output
4. Follow Brazilian notarial conventions
5. Identify all parties with their roles
6. Include spouse info if married
7. Describe property comprehensively
8. State price and payment terms clearly
9. Include standard legal clauses
10. Keep professional, formal tone

[OUTPUT FORMAT]
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
      "content": "[Generated parties section]",
      "order": 2
    },
    ...
  ]
}

Generate the draft now:
```

---

## Section Types & Brazilian Conventions

```
┌─────────────────────────────────────────────────────────┐
│              ESCRITURA PÚBLICA (DEED)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CABEÇALHO (header)                                    │
│  ────────────────────                                  │
│  Cartório details, document type, notary name          │
│                                                         │
│  PARTES (parties)                                      │
│  ────────────────────                                  │
│  Identification & qualification of buyers/sellers      │
│  "[Name], CPF/RG [numbers], [profession], [address]"   │
│                                                         │
│  OBJETO (object/subject matter)                        │
│  ────────────────────                                  │
│  Property description, registry number, dimensions     │
│  "Imóvel situado à [address], com [area] m², matrícula│
│   nº [registry_number]..."                             │
│                                                         │
│  PREÇO E FORMA DE PAGAMENTO (price & payment)         │
│  ────────────────────                                  │
│  Transaction price, payment terms, conditions          │
│  "Preço total: R$ [price]"                             │
│  "Forma de pagamento: [entry 1], [entry 2]..."        │
│                                                         │
│  CONDIÇÕES ESPECIAIS (special conditions)              │
│  ────────────────────                                  │
│  Non-standard clauses, liens, encumbrances             │
│                                                         │
│  CLÁUSULAS GERAIS (general clauses)                    │
│  ────────────────────                                  │
│  Standard legal language for property transfers        │
│  Rights, warranties, tax obligations                   │
│                                                         │
│  ENCERRAMENTO (closing)                                │
│  ────────────────────                                  │
│  Signature block, notary certification                 │
│  Witness names, notary stamp                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Paths

```
runDraftJob()
│
├─ ERROR: Case not found
│  └─ Throw: "Failed to fetch case: [reason]"
│
├─ ERROR: No canonical_data
│  └─ Throw: "No canonical data found. Please ensure entities have been extracted..."
│
├─ VALIDATION: Has errors
│  └─ Continue with generation BUT mark status as 'reviewing'
│
├─ ERROR: Gemini API failure
│  ├─ Throw: "Failed to initialize Gemini client: [error]"
│  └─ Worker: Will retry with exponential backoff
│
├─ ERROR: Gemini returns empty response
│  └─ Throw: "Gemini returned empty response"
│
├─ ERROR: JSON parsing fails
│  ├─ Log: Response preview (first 500 chars)
│  └─ Throw: "Failed to parse draft sections from AI response..."
│
├─ ERROR: No sections parsed
│  └─ Throw: "Failed to parse draft sections from AI response..."
│
├─ ERROR: Database insert fails
│  ├─ Log: Error details
│  └─ Throw: "Failed to save draft to database: [error]"
│
└─ SUCCESS
   └─ Return: {status: 'completed', draft_id, version, ...}
```

---

## Database Schema

```sql
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,

  -- Structured content
  content JSONB NOT NULL DEFAULT '{"sections": []}',
  -- {
  --   "sections": [
  --     {
  --       "id": "header",
  --       "title": "Cabeçalho",
  --       "type": "header",
  --       "content": "...",
  --       "order": 1
  --     },
  --     ...
  --   ]
  -- }

  -- Rendered HTML for display/print
  html_content TEXT NOT NULL DEFAULT '',

  -- Items marked [PENDING]
  pending_items JSONB NOT NULL DEFAULT '[]',
  -- [
  --   {
  --     "id": "pending_...",
  --     "section_id": "parties",
  --     "field_path": "people.0.cpf",
  --     "reason": "CPF missing for João Silva",
  --     "severity": "warning"
  --   },
  --   ...
  -- ]

  -- Draft status
  status TEXT NOT NULL DEFAULT 'generated',
  -- 'generated' | 'reviewing' | 'approved'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(case_id, version)
);

CREATE INDEX idx_drafts_case_id ON drafts(case_id);
CREATE INDEX idx_drafts_status ON drafts(status);
```

---

## Integration Points

### With Frontend (`src/pages/DraftPage.tsx`)

1. **Initial Load**
   ```typescript
   const { data: drafts } = await supabase
     .from('drafts')
     .select('id, html_content')
     .eq('case_id', caseId)
     .order('version', { ascending: false })
     .limit(1)
   ```

2. **Display Content**
   ```typescript
   <TiptapEditor content={drafts[0].html_content} />
   ```

3. **Show Pending Items**
   ```typescript
   {drafts[0].pending_items.map(item =>
     <Alert>{item.reason}</Alert>
   )}
   ```

4. **Version Management**
   ```typescript
   const versions = await supabase
     .from('drafts')
     .select('*')
     .eq('case_id', caseId)
     .order('version', { ascending: false })

   <DraftVersionHistory versions={versions} />
   ```

### With Chat System

After draft generation, users can:

1. **Request Regeneration** (chat function)
   ```typescript
   // Chat message: "regenerate the price section with new payment terms"
   // → Creates new job: regenerate_section with target_path: "price"
   // → Calls Gemini with updated prompt
   ```

2. **Edit Fields** (chat function)
   ```typescript
   // Chat message: "update João Silva's CPF to 123.456.789-00"
   // → Creates ChatOperation: update_field
   // → Updates draft + logs to operations_log
   ```

3. **Track Changes** (audit trail)
   ```typescript
   // All edits logged to operations_log table
   // Includes: user_id, operation_type, target_path, old/new values
   ```

---

## Performance Considerations

### Token Usage
- Prompt: ~500-1000 tokens (varies with data size)
- Response: ~2000-4000 tokens (7 sections × ~300-500 tokens each)
- Total: ~2500-5000 tokens per draft generation
- Cost: ~$0.01-0.02 per draft (Gemini 3 Pro pricing)

### Latency
- Gemini generation: 2-5 seconds
- Database operations: <100ms
- Total job time: 2-6 seconds
- Worker can process 10+ drafts per minute

### Data Size
- Canonical data: 1-5 KB (typical case)
- HTML content: 10-30 KB (7 sections, formatted)
- Draft record: ~50 KB total
- Versioning: Linear space growth with each version

---

## Testing Scenarios

### 1. Complete Data (Happy Path)
- All people have CPF/RG/address
- All properties have registry numbers
- Deal terms fully specified
- Expected: Draft with status='generated', no pending items

### 2. Missing CPF/RG
- One person missing CPF
- Expected: Draft with status='reviewing', warning pending items

### 3. Missing Property Details
- Property without registry number
- Property without address
- Expected: Draft with warnings, status='reviewing'

### 4. Married Seller Without Spouse
- Seller is married but no spouse edge exists
- Expected: Warning, status='reviewing'

### 5. Invalid Relationships
- No "buys" or "sells" edges
- Expected: Error, draft fails validation

### 6. Gemini API Failure
- API error during generation
- Expected: Job fails, worker retries

### 7. Parsing Error
- Gemini returns malformed JSON
- Expected: Error logged, job fails

### 8. Version Numbering
- Create draft (v1), then regenerate
- Expected: New draft with version=2
