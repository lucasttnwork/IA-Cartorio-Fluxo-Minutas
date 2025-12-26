# Draft Generation Job - Documentation Index

## Overview

Complete exploration and documentation of the draft generation job in `worker/src/jobs/draft.ts`. This job transforms the canonical data model (people, properties, edges, deal) into a professional Brazilian legal deed document using Google Gemini 3 Pro.

---

## Documentation Files

### 1. README - START HERE
**File**: `DRAFT_GENERATION_README.md`

Quick reference guide covering:
- Core concepts (canonical data, validation, sections)
- Processing pipeline (8 steps)
- Database integration
- Frontend integration
- Error handling
- Performance metrics
- Configuration
- Best practices
- Troubleshooting

**Time to read**: 15-20 minutes
**Best for**: Getting a working understanding of how the system works

---

### 2. DETAILED ANALYSIS
**File**: `DRAFT_GENERATION_ANALYSIS.md`

Comprehensive technical deep dive including:
- Architecture and data flow
- Detailed input/output structures (with all fields)
- Step-by-step processing walkthrough
- Validation rules with code examples
- Prompt engineering patterns
- Structured output format
- HTML rendering logic
- Database schema and queries
- Integration with upstream/downstream jobs
- Error handling paths
- Prompt templates with instructions
- Return values and job states
- Key insights and design patterns

**Time to read**: 30-45 minutes
**Best for**: Understanding implementation details and making modifications

---

### 3. FLOW DIAGRAMS & ARCHITECTURE
**File**: `DRAFT_GENERATION_FLOW.md`

Visual representations and architectural details:
- High-level pipeline diagram (8 stages)
- Internal job flow with ASCII art
- Detailed step-by-step flow breakdown
- Validation rules matrix
- Prompt template structure with examples
- Section types and Brazilian conventions diagram
- Database schema definition
- Integration points (frontend, chat, audit)
- Performance considerations
- Testing scenarios

**Time to read**: 20-25 minutes
**Best for**: Understanding architecture and creating diagrams/documentation

---

### 4. PRACTICAL EXAMPLES
**File**: `DRAFT_GENERATION_EXAMPLES.md`

Six real-world scenarios with complete input/output:

1. **Complete Data** (Happy Path)
   - All fields present
   - Output: Generated draft with no pending items

2. **Incomplete Data** (Warnings)
   - Missing CPF, address, registry number, price
   - Output: Draft marked as reviewing with warnings

3. **Critical Error** (No Buyers)
   - Missing buyer relationship
   - Output: Draft with error-level pending items

4. **API Failure** (Gemini Error)
   - API is down or rate limited
   - Output: Job fails and retries with backoff

5. **Parsing Error** (Malformed JSON)
   - Gemini returns invalid JSON
   - Output: Detailed error log with response preview

6. **Regeneration** (Version 2)
   - User uploads new documents and regenerates
   - Output: New version with incremented version number

Each example includes:
- Input canonical data
- Generated prompt
- Validation result
- Output draft with sections
- Database insert result
- Job return value
- User-facing behavior

**Time to read**: 20-30 minutes
**Best for**: Understanding expected behavior and debugging issues

---

## Quick Navigation by Topic

### Understanding Core Concepts

| Topic | File | Section |
|-------|------|---------|
| Canonical data model | README | "Quick Reference" |
| Validation system | README | "Validation System" |
| Section structure | README | "Section-Based Structure" |
| Versioning | README | "Versioning" |
| No evidence = no auto-fill | ANALYSIS | "Core principle" intro |

### Implementation Details

| Topic | File | Section |
|-------|------|---------|
| Processing steps | ANALYSIS | "Core Processing Steps" |
| Validation rules | ANALYSIS | "Validation & Pending Items" |
| Prompt engineering | ANALYSIS | "Prompt Engineering Details" |
| HTML generation | ANALYSIS | "Step 6: Generate HTML" |
| Database persistence | ANALYSIS | "Step 7: Save to Database" |

### Architecture & Design

| Topic | File | Section |
|-------|------|---------|
| Pipeline flow | FLOW | "High-Level Data Flow" |
| Job internals | FLOW | "Draft Generation Job Internals" |
| Section types | FLOW | "Section Types & Brazilian Conventions" |
| Database schema | FLOW | "Database Schema" |
| Integration points | FLOW | "Integration Points" |

### Frontend Integration

| Topic | File | Section |
|-------|------|---------|
| DraftPage component | README | "Frontend Integration" |
| Chat integration | ANALYSIS | "Downstream: Chat & Edits" |
| Version history | FLOW | "Performance Considerations" |
| Pending items UI | EXAMPLES | "Example 2: Frontend Notification" |

### Error Handling

| Topic | File | Section |
|-------|------|---------|
| Validation errors | README | "Error Handling" |
| API errors | README | "Error Handling" |
| Parsing errors | README | "Error Handling" |
| Gemini failure | EXAMPLES | "Example 4" |
| Parse failure | EXAMPLES | "Example 5" |

### Examples & Scenarios

| Topic | File |
|-------|------|
| Complete purchase & sale | EXAMPLES - Example 1 |
| Missing data with warnings | EXAMPLES - Example 2 |
| Critical error handling | EXAMPLES - Example 3 |
| Gemini API failure | EXAMPLES - Example 4 |
| JSON parsing error | EXAMPLES - Example 5 |
| Draft regeneration | EXAMPLES - Example 6 |

---

## Reading Paths

### Path 1: Quick Overview (30 minutes)
1. README - All sections
2. FLOW - "High-Level Data Flow" + "Draft Generation Job Internals"

**Outcome**: Working understanding of how job works

### Path 2: Implementation (60 minutes)
1. README - All sections
2. ANALYSIS - All sections except "Integration with Other Jobs"
3. FLOW - "Draft Generation Job Internals" + "Validation Rules"

**Outcome**: Can modify job code or debug issues

### Path 3: Architecture Review (45 minutes)
1. README - "Core Concepts" + "Processing Pipeline"
2. FLOW - All diagram sections
3. EXAMPLES - Example 1

**Outcome**: Understanding of system architecture

### Path 4: Troubleshooting (40 minutes)
1. README - "Troubleshooting"
2. EXAMPLES - All 6 examples
3. ANALYSIS - "Error Handling"

**Outcome**: Can diagnose and fix issues

### Path 5: Complete Deep Dive (120 minutes)
1. README - All sections
2. ANALYSIS - All sections
3. FLOW - All sections
4. EXAMPLES - All examples

**Outcome**: Expert-level understanding of entire system

---

## Key Files Referenced

### Source Code
- `worker/src/jobs/draft.ts` - Main draft generation job
- `worker/src/jobs/processor.ts` - Job routing
- `src/pages/DraftPage.tsx` - Frontend interface
- `src/stores/caseStore.ts` - State management
- `src/types/index.ts` - Type definitions

### Related Jobs
- `worker/src/jobs/ocr.ts` - OCR extraction
- `worker/src/jobs/extraction.ts` - LLM extraction
- `worker/src/jobs/consensus.ts` - Consensus resolution
- `worker/src/jobs/entityExtraction.ts` - Entity extraction
- `worker/src/jobs/entityResolution.ts` - Entity resolution (upstream)

### Database Tables
- `cases` - Contains canonical_data JSONB
- `drafts` - Versioned draft records
- `processing_jobs` - Job queue
- `operations_log` - Audit trail

---

## Technology Stack

### AI/ML
- **Google Gemini 3 Pro Preview** - Draft generation (LLM)
- **Structured Outputs** - JSON schema enforcement
- **Token usage** - ~2500-5000 tokens per draft

### Backend
- **Supabase** - PostgreSQL database + Auth
- **Node.js** - Worker process
- **TypeScript** - Type safety

### Frontend
- **React 18** - UI framework
- **Zustand** - State management
- **Tiptap** - Rich text editor
- **TailwindCSS** - Styling

### Data
- **JSONB** - Storing canonical data and draft content
- **Text** - Storing HTML rendering
- **Versioning** - Auto-incrementing version numbers

---

## Important Concepts

### Canonical Data Model
The graph-based data structure containing:
- People (parties with full details)
- Properties (real estate with registry info)
- Edges (relationships like sells, buys, spouse_of)
- Deal (transaction terms)

### Validation
Two-level system:
- **Errors** - Block draft approval (no parties, no property)
- **Warnings** - Allow generation but mark reviewing (missing CPF, address)

### Pending Items
Structured records tracking missing information:
```typescript
{
  id: string,
  section_id: string,
  field_path: string,
  reason: string,
  severity: 'error' | 'warning' | 'info'
}
```

### Draft Sections
Seven structured sections in order:
1. Cabeçalho (Header)
2. Partes (Parties)
3. Objeto (Object)
4. Preço e Forma de Pagamento (Price & Payment)
5. Condições Especiais (Conditions)
6. Cláusulas Gerais (Clauses)
7. Encerramento (Closing)

### Versioning
Automatic version incrementing:
- V1: Initial draft
- V2: Updated with new entities
- V3, V4, ... : Subsequent regenerations

Users can view history, compare versions, restore old versions.

---

## Development Tasks

### Adding Support for New Document Type

1. Add type to `ActType` in `src/types/index.ts`
2. Create new validation function in `draft.ts`
3. Create document-specific prompt template
4. Test with examples in `DRAFT_GENERATION_EXAMPLES.md`

### Customizing Section Structure

1. Modify `DraftSection` type in `src/types/index.ts`
2. Update section types list in prompt
3. Modify `generateDraftPrompt()` to include new sections
4. Update Tiptap editor to handle new section types

### Integrating with External Service

1. Modify Gemini client initialization in `draft.ts`
2. Create fallback handler if API fails
3. Implement caching if needed
4. Test with `DRAFT_GENERATION_EXAMPLES.md` scenarios

### Performance Optimization

1. Implement context caching for Gemini API
2. Pre-compile prompt templates
3. Cache HTML templates
4. Profile token usage (currently 2500-5000 per draft)

---

## Testing Checklist

- [ ] Complete data - generates valid draft with no pending items
- [ ] Missing CPF - marks as warning, includes in pending items
- [ ] Missing address - marks as warning, includes in pending items
- [ ] Missing registry number - marks as warning, includes in pending items
- [ ] No buyers - marks as error, draft status is reviewing
- [ ] Married seller without spouse - marks as warning
- [ ] Empty price - marks as warning
- [ ] Gemini API error - job fails and retries
- [ ] Malformed JSON response - logs error and fails gracefully
- [ ] Regeneration - creates version 2 with updated content
- [ ] Version history - can load and compare all versions
- [ ] HTML rendering - styles correctly in browser
- [ ] Pending items display - shows in UI with correct severity

---

## FAQ

**Q: What is canonical data?**
A: The resolved, deduplicated source of truth for a case, containing people, properties, relationships, and deal terms. Stored in `cases.canonical_data` JSONB field.

**Q: Why use `[PENDING]` instead of inferring data?**
A: Legal documents require traceability. Every piece of information must be traceable to source documents. `[PENDING]` markers make it explicit what needs notary review.

**Q: How are validation errors vs warnings handled?**
A: Errors block draft approval (no parties, no property). Warnings allow generation but mark draft as reviewing (missing CPF). User must resolve before approval.

**Q: Can I regenerate just one section?**
A: Yes, via chat interface. The `regenerate_section` chat function can regenerate individual sections without full draft regeneration.

**Q: How is versioning handled?**
A: Automatic version incrementing. Each regeneration creates a new version with version number incremented. Users can view all versions and compare.

**Q: What happens if Gemini API fails?**
A: Job fails and worker retries with exponential backoff (5s, 25s, 125s, ...). After max retries, marked failed. User can manually retry.

**Q: How large are draft records?**
A: Typically 50 KB per draft (content + HTML). With 5 versions per case, ~250 KB. Scales linearly with number of versions.

**Q: What's the cost per draft?**
A: ~$0.01-0.02 per draft using Gemini 3 Pro (~2500-5000 tokens). Can be optimized with context caching.

---

## Glossary

| Term | Definition |
|------|-----------|
| Canonical Data | Resolved source of truth graph (people, properties, edges, deal) |
| Escritura | Brazilian notarial deed |
| Matrícula | Property registry number |
| Cartório | Notary office |
| Tabelião | Notary public |
| CPF | Brazilian individual taxpayer ID |
| RG | Brazilian national ID |
| IPTU | Property tax (imposto predial) |
| Pending | Item marked [PENDING] requiring review/completion |
| Section | Structural division of draft (header, parties, object, etc.) |
| Version | Iteration of draft (V1, V2, V3) |
| Pending Item | Record of missing/incomplete data |
| Validation | Check for required data before generation |
| Gemini | Google's large language model |

---

## Contact & Support

For issues or questions:

1. Check README "Troubleshooting" section
2. Review relevant example in EXAMPLES file
3. Check job logs in `processing_jobs` table
4. Review error message in `job.error_message` field
5. Check Gemini API quota and status

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-25 | 1.0 | Initial documentation |

---

## Document Navigation

Quick links to all sections:

- [README](DRAFT_GENERATION_README.md) - Start here for overview
- [Analysis](DRAFT_GENERATION_ANALYSIS.md) - Detailed technical deep dive
- [Flow Diagrams](DRAFT_GENERATION_FLOW.md) - Visual architecture
- [Examples](DRAFT_GENERATION_EXAMPLES.md) - Real-world scenarios
- [This Index](DRAFT_GENERATION_INDEX.md) - You are here
