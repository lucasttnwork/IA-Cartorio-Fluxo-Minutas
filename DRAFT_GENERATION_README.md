# Draft Generation Job - Complete Documentation

## Quick Reference

**Location**: `worker/src/jobs/draft.ts`
**Model**: Google Gemini 3 Pro Preview
**Input**: Canonical data model (people, properties, edges, deal)
**Output**: Versioned draft with 7 structured sections
**Language**: Brazilian Portuguese (pt-BR)
**Document Type**: Escritura Pública de Compra e Venda (Purchase & Sale Deed)

---

## Documentation Files

This exploration includes three comprehensive documents:

### 1. **DRAFT_GENERATION_ANALYSIS.md**
Detailed technical analysis covering:
- Architecture and data flow
- Complete processing steps (8 steps)
- Input/output structures
- Validation logic and pending items
- Error handling
- Integration with other jobs
- Environment configuration

**Read this for**: Understanding how the job works internally

### 2. **DRAFT_GENERATION_FLOW.md**
Visual flow diagrams and architecture:
- High-level pipeline diagram
- Internal job flow with step details
- Validation rules with ASCII diagrams
- Prompt template structure
- Section types and Brazilian conventions
- Database schema
- Integration points with frontend
- Performance considerations
- Testing scenarios

**Read this for**: Visual understanding and architecture patterns

### 3. **DRAFT_GENERATION_EXAMPLES.md**
Six practical examples:
- **Example 1**: Complete purchase & sale (all data present)
- **Example 2**: Incomplete data (warnings and pending items)
- **Example 3**: Critical error (no buyers identified)
- **Example 4**: Gemini API failure
- **Example 5**: JSON parsing error
- **Example 6**: Draft regeneration (version 2)

**Read this for**: Real-world scenarios and expected behavior

---

## Core Concepts

### The Canonical Data Model

The foundation of draft generation is the **canonical data model**—a graph-based representation of the transaction:

```typescript
interface CanonicalData {
  people: Person[]          // Parties (buyers, sellers, spouses)
  properties: Property[]    // Real estate
  edges: GraphEdge[]        // Relationships (sells, buys, spouse_of, owns)
  deal: DealDetails         // Terms (price, payment, conditions)
}
```

This model is stored in the `cases.canonical_data` JSONB field and represents the "source of truth" for the draft.

### The "No Evidence = No Auto-Fill" Principle

**Core design philosophy**: Every piece of information in the draft must be traceable to source documents.

Missing data is marked `[PENDING]` rather than inferred:
```
- CPF: 123.456.789-00
- Address: [PENDING]  ← User must fill or pull from documents
```

This ensures:
- **Traceability**: Notary can verify everything against source documents
- **Accountability**: Clear audit trail of what was auto-filled vs. manual
- **Safety**: No invented data that could cause legal issues

### Validation System

Two levels of validation:

| Level | Examples | Impact | Status |
|-------|----------|--------|--------|
| **Error** | No parties, no property, no buyers/sellers | Blocks approval | `reviewing` |
| **Warning** | Missing CPF, missing RG, missing registry number | Allows draft but flags for review | `reviewing` |

Drafts can be generated even with errors, but are marked `status: 'reviewing'` so users must resolve them.

### Section-Based Structure

Rather than free-form text, drafts are organized as ordered sections:

1. **Cabeçalho** (Header) - Document title, notary info
2. **Partes** (Parties) - Buyer & seller identification
3. **Objeto** (Object) - Property description, registry details
4. **Preço e Forma de Pagamento** (Price & Payment) - Terms
5. **Condições Especiais** (Special Conditions) - Non-standard clauses
6. **Cláusulas Gerais** (General Clauses) - Standard legal language
7. **Encerramento** (Closing) - Signatures, certification

Each section can be:
- Regenerated independently via chat
- Edited manually in Tiptap editor
- Compared across versions
- Exported individually

### Versioning

Drafts are automatically versioned:

```
V1: Initial generation (2024-01-25 14:30)
V2: Updated with new entities (2024-01-25 15:45)
V3: Final approved version (2024-01-25 16:20)
```

Users can view history, compare versions, and restore old drafts.

---

## Processing Pipeline

### Step 1: Fetch Canonical Data
```typescript
const { data: caseData } = await supabase
  .from('cases')
  .select('*')
  .eq('id', job.case_id)
  .single()
```

### Step 2: Validate
```typescript
const validation = validatePurchaseSaleData(canonicalData)
// Returns: { isValid, pendingItems, warnings }
```

### Step 3: Generate Prompt
```typescript
const prompt = generateDraftPrompt(canonicalData)
// Formats data into text prompt with [PENDING] markers
```

### Step 4: Call Gemini
```typescript
const result = await geminiModel.generateContent(prompt)
const responseText = result.response.text()
// Returns: JSON with sections array
```

### Step 5: Parse Response
```typescript
const sections = parseSectionsFromResponse(responseText)
// Validates JSON and extracts DraftSection[]
```

### Step 6: Render HTML
```typescript
const htmlContent = generateHtmlFromSections(sections)
// Creates styled HTML for browser/print/PDF
```

### Step 7: Save to Database
```typescript
const nextVersion = existingDrafts[0].version + 1
await supabase.from('drafts').insert({
  case_id: job.case_id,
  version: nextVersion,
  content: { sections },
  html_content: htmlContent,
  pending_items: validation.pendingItems,
  status: validation.isValid ? 'generated' : 'reviewing'
})
```

### Step 8: Return Result
```typescript
return {
  status: 'completed',
  draft_id: newDraft.id,
  version: nextVersion,
  sections_count: sections.length,
  pending_items: validation.pendingItems,
  is_valid: validation.isValid
}
```

---

## Prompt Engineering

The job uses a carefully structured prompt to guide Gemini:

### Key Instructions

1. **Language**: Formal Brazilian Portuguese (pt-BR)
2. **Don't invent data**: Use `[PENDING]` for missing information
3. **Structure**: Specific section types with defined order
4. **Conventions**: Brazilian notarial standards
5. **Parties**: Identify roles (seller/buyer) clearly
6. **Spouse info**: Include if married parties
7. **Property**: Comprehensive description
8. **Price**: Clear payment terms
9. **Clauses**: Standard legal language for purchase & sale
10. **Tone**: Professional and formal

### Data Format in Prompt

```
PARTIES:
Person 1:
- Name: [full_name]
- CPF: [cpf || '[PENDING]']
- RG: [rg || '[PENDING]']
...

RELATIONSHIPS:
- [source] [relationship] [target]

PROPERTY:
Property 1:
- Registry Number: [registry_number || '[PENDING]']
...

TRANSACTION DETAILS:
Transaction Type: [type]
Price: R$ [formatted || '[PENDING]']
Payment Schedule: [entries with amounts and dates]
```

This ensures Gemini has all relevant information in a predictable format.

---

## Database Integration

### Drafts Table

```sql
CREATE TABLE drafts (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id),
  version INTEGER NOT NULL,

  -- Structured content
  content JSONB NOT NULL,          -- { sections: [...] }

  -- Rendered HTML
  html_content TEXT NOT NULL,      -- For display/print

  -- Items marked [PENDING]
  pending_items JSONB NOT NULL,    -- [{ reason, severity, ... }]

  -- Status
  status TEXT NOT NULL,            -- 'generated' | 'reviewing' | 'approved'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(case_id, version),
  INDEX(case_id),
  INDEX(status)
);
```

### Query Patterns

**Load latest draft:**
```typescript
const { data: drafts } = await supabase
  .from('drafts')
  .select('*')
  .eq('case_id', caseId)
  .order('version', { ascending: false })
  .limit(1)
```

**Load all versions:**
```typescript
const { data: versions } = await supabase
  .from('drafts')
  .select('*')
  .eq('case_id', caseId)
  .order('version', { ascending: false })
```

**Compare two versions:**
```typescript
const { data: [vA, vB] } = await supabase
  .from('drafts')
  .select('*')
  .eq('case_id', caseId)
  .in('version', [1, 2])
```

---

## Frontend Integration

### DraftPage Component

The main draft editing interface:

```typescript
export default function DraftPage() {
  // 1. Load draft on init
  useEffect(() => {
    const { data: drafts } = await supabase
      .from('drafts')
      .select('id, html_content')
      .eq('case_id', caseId)
      .order('version', { ascending: false })
      .limit(1)

    if (drafts?.length > 0) {
      setDraftId(drafts[0].id)
      setContent(drafts[0].html_content)
    }
  }, [caseId])

  // 2. Auto-save on changes
  const { saveStatus } = useDraftAutoSave({
    draftId, content, enabled: !!draftId
  })

  // 3. Display content
  return (
    <>
      <TiptapEditor content={content} onChange={setContent} />
      <ChatPanel draftId={draftId} />
      <DraftVersionHistory versions={draftVersions} />
      {pendingItems.length > 0 && (
        <Alert>
          <ExclamationTriangleIcon />
          {pendingItems.length} items require review
        </Alert>
      )}
    </>
  )
}
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `TiptapEditor` | Rich text editing of draft content |
| `ChatPanel` | Conversational editing with Gemini |
| `DraftVersionHistory` | View all versions, restore old drafts |
| `DraftComparison` | Side-by-side comparison of versions |
| `DraftSectionNav` | Navigate to specific sections |
| `DraftTemplateSelector` | Choose template when no draft exists |

### Operations & Audit Trail

All changes are logged to `operations_log`:

```typescript
{
  case_id: string,
  draft_id: string,
  user_id: string,
  operation_type: string,      // 'update_field', 'regenerate_section', etc.
  target_path: string,         // e.g. 'parties', 'price', 'parties.0.cpf'
  old_value: unknown,
  new_value: unknown,
  reason: string,
  created_at: string
}
```

This maintains full audit trail for compliance.

---

## Error Handling

### Validation Errors

Missing required data triggers validation warnings/errors:

| Error | Cause | Solution |
|-------|-------|----------|
| No properties | No real estate in case | Add property entity |
| No parties | No people identified | Add person entity |
| No buyers | No "buys" relationship | Create edge in canvas |
| No sellers | No "sells" relationship | Create edge in canvas |

### API Errors

Gemini API failures trigger retry logic:

```
Attempt 1: Fail → Wait 5s → Retry
Attempt 2: Fail → Wait 25s → Retry
Attempt 3: Fail → Wait 125s → Retry
Attempt 4: Fail → Mark failed
```

User can manually retry or contact support.

### Parsing Errors

Malformed JSON responses:

```typescript
try {
  const parsed = JSON.parse(cleanedResponse)
  if (!parsed.sections) throw new Error('No sections found')
} catch (error) {
  console.error('Response preview:', responseText.substring(0, 500))
  throw new Error('Failed to parse draft sections...')
}
```

Logs preview of response for debugging.

---

## Performance

### Token Usage
- Typical prompt: 500-1000 tokens
- Typical response: 2000-4000 tokens
- Total: ~2500-5000 tokens per draft
- Cost: ~$0.01-0.02 per draft (Gemini 3 Pro pricing)

### Speed
- Gemini generation: 2-5 seconds
- Database operations: <100ms
- Total job time: 2-6 seconds
- Worker throughput: 10+ drafts/minute

### Storage
- Content size: 1-5 KB per section
- HTML size: 10-30 KB
- Per draft: ~50 KB
- Per case with 5 versions: ~250 KB

---

## Configuration

### Environment Variables

```bash
GEMINI_API_KEY                 # Google Generative AI API key
SUPABASE_SERVICE_ROLE_KEY      # Supabase admin key (for worker)
```

### Model Selection

```typescript
const GEMINI_MODEL = 'gemini-3-pro-preview'
```

**Why Pro instead of Flash?**
- Pro has better reasoning for complex legal document generation
- Flash used for extraction (faster, cheaper)
- Pro used for generation (better quality)

---

## Best Practices

### For Developers

1. **Validate early**: Check missing data before Gemini call
2. **Be explicit**: Mark all missing data with `[PENDING]`
3. **Version everything**: Auto-increment versions for audit
4. **Log thoroughly**: Log at each step for debugging
5. **Test error paths**: API failures, parsing errors, invalid data
6. **Monitor token usage**: Track costs and optimize prompts

### For Notaries/Users

1. **Review pending items**: Check all `[PENDING]` markers before approval
2. **Verify relationships**: Make sure buyers/sellers are correct in canvas
3. **Check data completeness**: Fill in CPF/RG/addresses before draft generation
4. **Use version history**: Compare versions before finalizing
5. **Audit trail**: Review operations log for who changed what

### For Data Entry

1. **Extract all data**: Get CPF, RG, addresses from source documents
2. **Mark confidence**: Use entity extraction confidence scores
3. **Deduplicate people**: Merge duplicate person entities
4. **Create relationships**: Add edges for buyer/seller/spouse relationships
5. **Add deal details**: Specify price and payment schedule

---

## Troubleshooting

### Draft shows `[PENDING]` for CPF

**Cause**: CPF not extracted during entity extraction phase
**Solution**:
1. Check original documents have CPF visible
2. Re-run entity extraction job
3. Manually enter CPF in entities page

### No "buys" edge created

**Cause**: Buyer not identified in extraction
**Solution**:
1. Open canvas view
2. Create new person entity for buyer (if needed)
3. Drag edge from person to property, select "buys"
4. Regenerate draft

### Gemini fails with rate limit

**Cause**: Too many concurrent requests
**Solution**:
1. Wait a few minutes
2. Manually retry from DraftPage
3. Check API quota at Google Cloud Console

### JSON parsing fails

**Cause**: Gemini returned malformed JSON
**Solution**:
1. Check API logs for response preview
2. Try regenerating (might be transient)
3. Contact engineering team if persistent

---

## Future Enhancements

Potential improvements to draft generation:

1. **Multiple document types**: Donation, exchange, lease deeds
2. **Context caching**: Cache frequently used prompts for faster generation
3. **Section regeneration**: Regenerate individual sections without full draft
4. **Template customization**: Allow notaries to define custom sections
5. **Multi-language**: Support Portuguese, English, Spanish variants
6. **Signature block**: Auto-fill witness and notary information
7. **Document assembly**: Combine with other documents (receipts, tax docs)
8. **PDF generation**: Direct PDF export without HTML step
9. **Digital signature**: Integrate e-signature for approval workflow
10. **Batch generation**: Generate drafts for multiple cases

---

## Related Documentation

- `src/types/index.ts` - TypeScript type definitions
- `src/stores/caseStore.ts` - Zustand store for case state
- `src/pages/DraftPage.tsx` - Frontend draft editor
- `worker/src/jobs/processor.ts` - Job routing
- `worker/src/jobs/entityExtraction.ts` - Upstream entity extraction
- `CLAUDE.md` - Project overview and guidelines

---

## Support

For questions or issues:

1. Check the example scenarios in `DRAFT_GENERATION_EXAMPLES.md`
2. Review the flow diagrams in `DRAFT_GENERATION_FLOW.md`
3. Check the detailed analysis in `DRAFT_GENERATION_ANALYSIS.md`
4. Review logs and error messages
5. Check `processing_jobs` table for job status and error messages

---

## Summary

The draft generation job is the **semantic endpoint** of the Minuta Canvas pipeline. It transforms the canonical data model (people, properties, relationships, deal terms) into a professional, auditable Brazilian legal deed document using Gemini 3 Pro.

Key characteristics:
- **Traceability**: Everything links back to source documents
- **Clarity**: Missing data explicitly marked `[PENDING]`
- **Editability**: Section-based structure for targeted modifications
- **Auditability**: Versioning and operations log for compliance
- **Flexibility**: Works with partial or complete data

The design prioritizes legal correctness, document auditability, and user control over automatic data inference.
