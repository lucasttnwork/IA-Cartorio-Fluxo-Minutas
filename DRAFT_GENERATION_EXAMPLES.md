# Draft Generation: Practical Examples

## Example 1: Complete Purchase & Sale Deed

### Input: Canonical Data

```json
{
  "people": [
    {
      "id": "person-1",
      "full_name": "João Silva Santos",
      "cpf": "123.456.789-00",
      "rg": "12345678",
      "rg_issuer": "SSP-SP",
      "birth_date": "1975-05-15",
      "nationality": "Brasileira",
      "marital_status": "married",
      "profession": "Advogado",
      "address": {
        "street": "Rua das Flores",
        "number": "100",
        "complement": "Apto 42",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01311-100"
      },
      "email": "joao@example.com",
      "phone": "11-98765-4321",
      "father_name": "José Silva Santos",
      "mother_name": "Ana Maria Santos"
    },
    {
      "id": "person-2",
      "full_name": "Maria Silva Santos",
      "cpf": "987.654.321-00",
      "rg": "87654321",
      "rg_issuer": "SSP-SP",
      "birth_date": "1978-03-20",
      "nationality": "Brasileira",
      "marital_status": "married",
      "profession": "Médica",
      "address": {
        "street": "Rua das Flores",
        "number": "100",
        "complement": "Apto 42",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01311-100"
      },
      "email": "maria@example.com",
      "phone": "11-99876-5432",
      "father_name": "Carlos Silva",
      "mother_name": "Rosa Silva"
    },
    {
      "id": "person-3",
      "full_name": "Pedro Oliveira Costa",
      "cpf": "456.789.123-00",
      "rg": "45678912",
      "rg_issuer": "SSP-SP",
      "birth_date": "1980-07-10",
      "nationality": "Brasileira",
      "marital_status": "single",
      "profession": "Empresário",
      "address": {
        "street": "Avenida Paulista",
        "number": "1000",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01311-100"
      },
      "email": "pedro@example.com",
      "phone": "11-97654-3210",
      "father_name": "Antonio Oliveira",
      "mother_name": "Fernanda Costa"
    }
  ],
  "properties": [
    {
      "id": "property-1",
      "registry_number": "12345-0",
      "registry_office": "Cartório do Primeiro Ofício de Imóveis de São Paulo",
      "address": {
        "street": "Rua das Flores",
        "number": "100",
        "complement": "Apto 42",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01311-100"
      },
      "area": 85.5,
      "area_unit": "m²",
      "iptu_number": "123.456.789-7",
      "property_type": "residential",
      "description": "Apartamento residencial no bairro Centro"
    }
  ],
  "edges": [
    {
      "source_type": "person",
      "source_id": "person-1",
      "target_type": "property",
      "target_id": "property-1",
      "relationship": "sells",
      "confidence": 0.95,
      "confirmed": true
    },
    {
      "source_type": "person",
      "source_id": "person-2",
      "target_type": "property",
      "target_id": "property-1",
      "relationship": "sells",
      "confidence": 0.95,
      "confirmed": true
    },
    {
      "source_type": "person",
      "source_id": "person-3",
      "target_type": "property",
      "target_id": "property-1",
      "relationship": "buys",
      "confidence": 0.98,
      "confirmed": true
    },
    {
      "source_type": "person",
      "source_id": "person-1",
      "target_type": "person",
      "target_id": "person-2",
      "relationship": "spouse_of",
      "confidence": 1.0,
      "confirmed": true
    }
  ],
  "deal": {
    "type": "purchase_sale",
    "price": 450000,
    "paymentSchedule": {
      "entries": [
        {
          "description": "Sinal",
          "percentage": 10,
          "amount": 45000,
          "due_date": "2024-01-15"
        },
        {
          "description": "Saldo",
          "percentage": 90,
          "amount": 405000,
          "due_date": "2024-02-20"
        }
      ]
    },
    "conditions": [
      "Imóvel livre e desembaraçado de ônus reais",
      "Responsabilidade pelas despesas condominiais até a data da assinatura"
    ]
  }
}
```

### Generated Prompt (Condensed)

```
You are a legal document generator specialized in Brazilian real estate law...

CANONICAL DATA:

PARTIES:
Person 1:
- Name: João Silva Santos
- CPF: 123.456.789-00
- RG: 12345678 - SSP-SP
- Birth Date: 1975-05-15
- Nationality: Brasileira
- Marital Status: married
- Profession: Advogado
- Address: Rua das Flores, 100 Apto 42, Centro, São Paulo-SP, CEP 01311-100
- Email: joao@example.com
- Phone: 11-98765-4321
- Father: José Silva Santos
- Mother: Ana Maria Santos

Person 2:
- Name: Maria Silva Santos
- CPF: 987.654.321-00
- RG: 87654321 - SSP-SP
- Birth Date: 1978-03-20
- Nationality: Brasileira
- Marital Status: married
- Profession: Médica
- Address: Rua das Flores, 100 Apto 42, Centro, São Paulo-SP, CEP 01311-100
...

RELATIONSHIPS:
- João Silva Santos sells Property 1
- Maria Silva Santos sells Property 1
- Pedro Oliveira Costa buys Property 1
- João Silva Santos spouse_of Maria Silva Santos

PROPERTY:
Property 1:
- Registry Number: 12345-0
- Registry Office: Cartório do Primeiro Ofício de Imóveis de São Paulo
- Type: residential
- Area: 85.5 m²
- Address: Rua das Flores, 100 Apto 42, Centro, São Paulo-SP, CEP 01311-100
- IPTU: 123.456.789-7
- Description: Apartamento residencial no bairro Centro

TRANSACTION DETAILS:
Transaction Type: purchase_sale
Price: R$ 450.000,00
Payment Schedule:
  - Sinal: R$ 45.000,00 (10%) (Due: 2024-01-15)
  - Saldo: R$ 405.000,00 (90%) (Due: 2024-02-20)
Special Conditions: Imóvel livre e desembaraçado de ônus reais; Responsabilidade pelas despesas condominiais até a data da assinatura
```

### Validation Result

```typescript
{
  isValid: true,
  pendingItems: [],
  warnings: []
}
```

All required fields present, no warnings.

### Generated Draft Sections

```json
{
  "sections": [
    {
      "id": "header",
      "title": "Cabeçalho",
      "type": "header",
      "content": "ESCRITURA PÚBLICA DE COMPRA E VENDA\n\nSaibam quantos este instrumento público virem que, aos vinte e cinco dias do mês de janeiro do ano de dois mil e vinte e quatro, neste Cartório do Primeiro Ofício de Imóveis de São Paulo, compareceram como outorgantes os abaixo qualificados.",
      "order": 1
    },
    {
      "id": "parties",
      "title": "Partes",
      "type": "parties",
      "content": "VENDEDORES:\n1. João Silva Santos, casado com Maria Silva Santos, advogado, portador da Cédula de Identidade nº 12345678, expedida pela SSP-SP, inscrito no Cadastro de Pessoas Físicas sob o nº 123.456.789-00, domiciliado e residente à Rua das Flores, nº 100, apartamento 42, bairro Centro, São Paulo, Estado de São Paulo, CEP 01311-100.\n\n2. Maria Silva Santos, casada com João Silva Santos, médica, portadora da Cédula de Identidade nº 87654321, expedida pela SSP-SP, inscrita no Cadastro de Pessoas Físicas sob o nº 987.654.321-00, domiciliada e residente à Rua das Flores, nº 100, apartamento 42, bairro Centro, São Paulo, Estado de São Paulo, CEP 01311-100.\n\nCOMPRADOR:\nPedro Oliveira Costa, solteiro, empresário, portador da Cédula de Identidade nº 45678912, expedida pela SSP-SP, inscrito no Cadastro de Pessoas Físicas sob o nº 456.789.123-00, domiciliado e residente à Avenida Paulista, nº 1000, bairro Bela Vista, São Paulo, Estado de São Paulo, CEP 01311-100.",
      "order": 2
    },
    {
      "id": "object",
      "title": "Objeto",
      "type": "object",
      "content": "O presente instrumento refere-se à compra e venda de imóvel residencial localizado à Rua das Flores, nº 100, apartamento 42, bairro Centro, São Paulo, Estado de São Paulo, CEP 01311-100, com área de oitenta e cinco vírgula cinco metros quadrados, matriculado sob o nº 12345-0 no Cartório do Primeiro Ofício de Imóveis de São Paulo. O imóvel é constituído de um apartamento residencial, com as acomodações convenientes para habitação. Imóvel livre e desembaraçado de qualquer ônus real.",
      "order": 3
    },
    {
      "id": "price",
      "title": "Preço e Forma de Pagamento",
      "type": "price",
      "content": "O preço total do imóvel objeto deste instrumento é de Quatrocentos e Cinquenta Mil Reais (R$ 450.000,00), que será pago da seguinte forma:\n\n1. Sinal: Quarenta e Cinco Mil Reais (R$ 45.000,00), correspondente a dez por cento (10%) do valor total, pagável em 15 de janeiro de 2024.\n\n2. Saldo: Quatrocentos e Cinco Mil Reais (R$ 405.000,00), correspondente a noventa por cento (90%) do valor total, pagável em 20 de fevereiro de 2024.",
      "order": 4
    },
    {
      "id": "conditions",
      "title": "Condições Especiais",
      "type": "conditions",
      "content": "As partes acordam nas seguintes condições especiais:\n\n1. O imóvel é vendido livre e desembaraçado de ônus reais, hipotecas ou qualquer outro gravame.\n\n2. Os vendedores serão responsáveis pelas despesas condominiais, taxas de IPTU e demais encargos do imóvel até a data da assinatura desta escritura. Após essa data, toda responsabilidade pelos encargos passará para o comprador.\n\n3. O imóvel deverá ser entregue em perfeito estado de conservação e limpeza.",
      "order": 5
    },
    {
      "id": "clauses",
      "title": "Cláusulas Gerais",
      "type": "clauses",
      "content": "Os vendedores declaram que o imóvel está livre de qualquer encargo, hipoteca ou dívida que o onere. Respondem civilmente pela qualidade da propriedade e pela sua posse mansa e pacífica. Os vendedores garantem aos compradores o gozo pleno do imóvel. Em caso de evicção, os vendedores indenizarão o comprador de todas as perdas e danos que venha a sofrer. As partes elegem o foro da Comarca de São Paulo como competente para dirimir qualquer questão que porventura venha a surgir quanto à execução desta escritura.",
      "order": 6
    },
    {
      "id": "closing",
      "title": "Encerramento",
      "type": "closing",
      "content": "E assim, por estarem de acordo com os termos aqui estipulados, as partes assinaram este instrumento em três vias de igual teor e forma, na presença das testemunhas abaixo assinadas.\n\nSão Paulo, 25 de janeiro de 2024.\n\n________________________         ________________________\nJoão Silva Santos              Maria Silva Santos\nCPF 123.456.789-00            CPF 987.654.321-00\n\n________________________\nPedro Oliveira Costa\nCPF 456.789.123-00\n\nTestemunha 1: ___________________\nCPF: ___________________\n\nTestemunha 2: ___________________\nCPF: ___________________\n\n________________________\nTabelião\nCartório do Primeiro Ofício de Imóveis de São Paulo",
      "order": 7
    }
  ]
}
```

### Database Result

```sql
INSERT INTO drafts (case_id, version, content, html_content, pending_items, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  1,
  '{"sections": [...]}',
  '<html lang="pt-BR">...</html>',
  '[]',
  'generated'
)
RETURNING *;

-- Result:
{
  id: 'draft-uuid-1',
  case_id: '550e8400-e29b-41d4-a716-446655440000',
  version: 1,
  content: {...},
  html_content: '<html>...',
  pending_items: [],
  status: 'generated',
  created_at: '2024-01-25T14:30:00Z'
}
```

### Job Return Value

```typescript
{
  status: 'completed',
  draft_id: 'draft-uuid-1',
  version: 1,
  sections_count: 7,
  pending_items: [],
  is_valid: true
}
```

---

## Example 2: Incomplete Data (Warnings)

### Input: Canonical Data (Missing Fields)

```json
{
  "people": [
    {
      "id": "person-1",
      "full_name": "João Silva",
      "cpf": null,                    // ← MISSING
      "rg": "12345678",
      "rg_issuer": "SSP-SP",
      "birth_date": "1975-05-15",
      "nationality": "Brasileira",
      "marital_status": "married",
      "profession": "Advogado",
      "address": null,                // ← MISSING
      "email": null,
      "phone": null,
      "father_name": null,            // ← MISSING
      "mother_name": null             // ← MISSING
    },
    {
      "id": "person-2",
      "full_name": "Maria Silva",
      "cpf": "987.654.321-00",
      "rg": "87654321",
      "rg_issuer": "SSP-SP",
      "birth_date": "1978-03-20",
      "nationality": "Brasileira",
      "marital_status": "married",
      "profession": "Médica",
      "address": {
        "street": "Rua das Flores",
        "number": "100",
        "complement": "Apto 42",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01311-100"
      },
      "email": "maria@example.com",
      "phone": "11-99876-5432",
      "father_name": null,            // ← MISSING
      "mother_name": null             // ← MISSING
    }
  ],
  "properties": [
    {
      "id": "property-1",
      "registry_number": null,        // ← MISSING (WARNING)
      "registry_office": null,        // ← MISSING
      "address": {
        "street": "Rua das Flores",
        "number": "100",
        "complement": "Apto 42",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01311-100"
      },
      "area": 85.5,
      "area_unit": "m²",
      "iptu_number": "123.456.789-7",
      "property_type": "residential",
      "description": "Apartamento"
    }
  ],
  "edges": [
    {
      "source_type": "person",
      "source_id": "person-1",
      "target_type": "property",
      "target_id": "property-1",
      "relationship": "sells",
      "confidence": 0.95,
      "confirmed": true
    },
    {
      "source_type": "person",
      "source_id": "person-2",
      "target_type": "property",
      "target_id": "property-1",
      "relationship": "sells",
      "confidence": 0.95,
      "confirmed": true
    },
    {
      "source_type": "person",
      "source_id": "person-1",
      "target_type": "person",
      "target_id": "person-2",
      "relationship": "spouse_of",
      "confidence": 1.0,
      "confirmed": true
    }
  ],
  "deal": {
    "type": "purchase_sale",
    "price": null,                    // ← MISSING (WARNING)
    "paymentSchedule": null,
    "conditions": null
  }
}
```

### Validation Result

```typescript
{
  isValid: false,  // ← Has error-level items
  pendingItems: [
    {
      id: "pending_1703500800_1",
      section_id: "parties",
      field_path: "people.0.cpf",
      reason: "CPF missing for João Silva",
      severity: "warning"
    },
    {
      id: "pending_1703500800_2",
      section_id: "parties",
      field_path: "people.0.address",
      reason: "Address missing for João Silva",
      severity: "warning"
    },
    {
      id: "pending_1703500800_spouse_person_1",
      section_id: "parties",
      field_path: "sellers.person-1.spouse",
      reason: "Spouse consent required for married seller João Silva",
      severity: "warning"
    },
    {
      id: "pending_1703500800_prop_0",
      section_id: "object",
      field_path: "properties.0.registry_number",
      reason: "Property registry number (matrícula) is missing",
      severity: "warning"
    },
    {
      id: "pending_1703500800_6",
      section_id: "price",
      field_path: "deal.price",
      reason: "Transaction price is missing or zero",
      severity: "warning"
    }
  ],
  warnings: [
    "Seller João Silva is married but spouse information is missing"
  ]
}
```

### Generated Prompt (with Placeholders)

```
PARTIES:
Person 1:
- Name: João Silva
- CPF: [PENDING]
- RG: 12345678 - SSP-SP
- Birth Date: 1975-05-15
- Nationality: Brasileira
- Marital Status: married
- Profession: Advogado
- Address: [PENDING]
- Email: [PENDING]
- Phone: [PENDING]
- Father: [PENDING]
- Mother: [PENDING]

TRANSACTION DETAILS:
Transaction Type: purchase_sale
Price: [PENDING]
Payment Schedule: [PENDING]
Special Conditions: None
```

### Generated Draft with Pending Markers

```
PARTES:
VENDEDOR:
1. João Silva, casado com Maria Silva, advogado, portador da Cédula de Identidade nº 12345678, expedida pela SSP-SP, inscrito no Cadastro de Pessoas Físicas sob o nº [PENDING - CPF não informado], [PENDING - Endereço não informado].

PREÇO E FORMA DE PAGAMENTO:
O preço total do imóvel é de [PENDING - Valor não especificado], que será pago conforme acordado entre as partes.
```

### Database Result

```sql
INSERT INTO drafts (...)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  1,
  '{"sections": [...]}',
  '<html>...</html>',
  '[
    {"id": "pending_...", "field_path": "people.0.cpf", ...},
    {"id": "pending_...", "field_path": "people.0.address", ...},
    ...
  ]',
  'reviewing'  -- ← Status is 'reviewing' because has warnings
)
```

### Job Return Value

```typescript
{
  status: 'completed',
  draft_id: 'draft-uuid-2',
  version: 1,
  sections_count: 7,
  pending_items: [
    {id: "pending_...", field_path: "people.0.cpf", reason: "...", severity: "warning"},
    {id: "pending_...", field_path: "people.0.address", reason: "...", severity: "warning"},
    ...
  ],
  is_valid: false
}
```

---

## Example 3: Critical Error (No Buyers)

### Input: Canonical Data

```json
{
  "people": [...],
  "properties": [...],
  "edges": [
    {
      "source_type": "person",
      "source_id": "person-1",
      "target_type": "property",
      "target_id": "property-1",
      "relationship": "sells",  // ← Only sells, no buys!
      "confidence": 0.95,
      "confirmed": true
    }
  ],
  "deal": null
}
```

### Validation Result

```typescript
{
  isValid: false,
  pendingItems: [
    {
      id: "pending_1703500800_3",
      section_id: "parties",
      field_path: "buyers",
      reason: "No buyers identified in the transaction",
      severity: "error"  // ← ERROR level
    },
    {
      id: "pending_1703500800_5",
      section_id: "price",
      field_path: "deal",
      reason: "Transaction details (price, payment) are missing",
      severity: "error"  // ← ERROR level
    }
  ],
  warnings: []
}
```

### Job Execution

Despite errors, the job continues and generates a draft (with errors marked):

```typescript
// runDraftJob still continues to generation
const sections = parseSectionsFromResponse(responseText)

// Database insert happens with status: 'reviewing' (not 'generated')
// because validation.isValid === false

const { data: newDraft } = await supabase
  .from('drafts')
  .insert({
    // ...
    status: validation.isValid ? 'generated' : 'reviewing'
    // status becomes 'reviewing' because validation.isValid is false
  })
```

### Database Result

```sql
INSERT INTO drafts (...)
VALUES (
  case_id,
  1,
  content,
  html_content,
  '[
    {"id": "...", "reason": "No buyers...", "severity": "error"},
    {"id": "...", "reason": "Transaction details missing", "severity": "error"}
  ]',
  'reviewing'  -- ← ERROR status
)
```

### Job Return Value

```typescript
{
  status: 'completed',
  draft_id: 'draft-uuid-3',
  version: 1,
  sections_count: 7,
  pending_items: [
    {reason: "No buyers identified...", severity: "error"},
    {reason: "Transaction details missing...", severity: "error"}
  ],
  is_valid: false
}
```

### Frontend Notification

```typescript
// DraftPage displays error alert
<Alert variant="error">
  <ExclamationTriangleIcon className="h-5 w-5" />
  <AlertTitle>Errors Found</AlertTitle>
  <AlertDescription>
    No buyers identified in the transaction
    <br />
    Transaction details (price, payment) are missing
  </AlertDescription>
</Alert>
```

User must fix the entities/relationships in canvas or entities page before draft can be approved.

---

## Example 4: Gemini API Error

### Scenario

Gemini API is down or rate limited.

### Error Path

```typescript
try {
  const { model } = getGeminiClient()
  const result = await model.generateContent(prompt)
  // → API error thrown
} catch (geminiError) {
  const errorMessage = `Failed to generate draft with Gemini: ${geminiError.message}`
  console.error(errorMessage)
  throw new Error(errorMessage)
}

// Worker catches error and logs it
// Job status: 'failed' or 'retrying'
// Exponential backoff: 5s, 25s, 125s, etc.
```

### Job State After Failure

```sql
UPDATE processing_jobs
SET
  status = 'failed',  -- or 'retrying'
  error_message = 'Failed to generate draft with Gemini: API quota exceeded',
  attempts = attempts + 1,
  last_retry_at = NOW()
WHERE id = job_id;
```

### Frontend Behavior

```typescript
// DraftPage shows loading state
{isLoading && <Spinner />}

// If job fails after max retries:
<Alert variant="error">
  <AlertTitle>Draft Generation Failed</AlertTitle>
  <AlertDescription>
    The AI service encountered an error. Please try again.
  </AlertDescription>
</Alert>
```

User can click "Regenerate" to manually trigger job again.

---

## Example 5: Parsing Error (Malformed JSON)

### Scenario

Gemini returns invalid JSON (rare but possible).

### Response from Gemini

```
I'll generate the deed structure for you:

{
  "sections": [
    {
      "id": "header",
      "title": "Cabeçalho",
      "type": "header",
      "content": "ESCRITURA PÚBLICA...",  // ← MISSING CLOSING BRACE
    // Content continues but JSON is invalid
```

### Error Path

```typescript
const responseText = response.text()  // Malformed JSON

const codeBlockPattern = /^```(?:json)?\s*/
const cleanedResponse = responseText
  .replace(codeBlockPattern, '')
  .replace(codeBlockEndPattern, '')

try {
  const parsed = JSON.parse(cleanedResponse)
  // → JSON.parse throws SyntaxError
} catch (error) {
  console.error('Failed to parse sections:', error)
  console.error('Response preview:', responseText.substring(0, 500))
  throw new Error('Failed to parse draft sections from AI response...')
}
```

### Job Result

```typescript
{
  status: 'failed',
  error_message: 'Failed to parse draft sections from AI response. The response format may be invalid.'
}
```

### Debugging

```typescript
// Logs would show:
console.error('Response preview:',
  'I\'ll generate the deed structure for you:\n\n{\n  "sections": [\n    {\n      "id": "header",...'
)
// Developer can inspect and see JSON was malformed
```

---

## Example 6: Draft Regeneration (Version 2)

### Scenario

User uploads more documents, entities are updated, canvas shows new data.
User clicks "Regenerate Draft" button.

### New Processing Job

```typescript
// Frontend creates new job
const job = {
  case_id: caseId,
  job_type: 'draft',
  status: 'pending'
}

await supabase
  .from('processing_jobs')
  .insert(job)
```

### Execution

Worker picks up job, calls `runDraftJob()` again:

```typescript
// 1. Fetch updated case + canonical_data
const { data: caseData } = await supabase
  .from('cases')
  .select('*')
  .eq('id', job.case_id)
  .single()

// canonical_data now has new entities/edges

// 2-7. Same flow as before
// ...

// 8. Get next version
const existingDrafts = await supabase
  .from('drafts')
  .select('version')
  .eq('case_id', job.case_id)
  .order('version', { ascending: false })
  .limit(1)

const nextVersion = existingDrafts[0].version + 1  // 2

// 9. Insert new draft with version 2
const { data: newDraft } = await supabase
  .from('drafts')
  .insert({
    case_id: job.case_id,
    version: 2,  // ← Incremented
    content: { sections: updatedSections },
    html_content: htmlContent,
    // ...
  })
```

### Database State

```sql
SELECT * FROM drafts WHERE case_id = '550e8400...' ORDER BY version;

-- Result:
| id        | case_id   | version | status       | created_at           |
|-----------|-----------|---------|--------------|----------------------|
| draft-1   | 550e8400..| 1       | generated    | 2024-01-25 14:30:00  |
| draft-2   | 550e8400..| 2       | generated    | 2024-01-25 15:45:00  |
```

### Frontend Updates

```typescript
// DraftVersionHistory shows both versions
<DraftVersionHistory versions={[
  {version: 2, created_at: '2024-01-25 15:45:00', ...},
  {version: 1, created_at: '2024-01-25 14:30:00', ...}
]} />

// User can compare versions or restore old version
<DraftComparison versionA={draft2} versionB={draft1} />
```

---

## Summary Table

| Scenario | Valid | Pending Items | Status | Job Status | User Action |
|----------|-------|---------------|--------|-----------|------------|
| Complete data | ✓ | None | generated | completed | Review & approve |
| Missing CPF/RG | ✗ | Warnings | reviewing | completed | Fill missing fields |
| No buyers | ✗ | Errors | reviewing | completed | Add relationships in canvas |
| Gemini error | - | - | - | failed | Retry or contact support |
| Parse error | - | - | - | failed | Check API logs |
| Regenerate | ✓/✗ | Varies | generated/reviewing | completed | See version history |
