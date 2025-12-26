# Diagrama de Fluxo: Entity Extraction → Entity Resolution

## Visão Geral do Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MINUTA CANVAS - JOB PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────┘

    FRONTEND (src/)                    WORKER (worker/)                  DATABASE
    ┌──────────────┐                  ┌──────────────┐                ┌──────────┐
    │   Upload     │                  │   Job Queue  │                │ Postgres │
    │  Documents   │                  │   Processor  │                │          │
    └──────┬───────┘                  └──────┬───────┘                └──────────┘
           │                                  │                              │
           │ 1. Insert files                  │                              │
           │    → storage/documents           │                              │
           ├─────────────────────────────────>│                              │
           │                                  │ 2. Create OCR job           │
           │                                  │    (status: pending)         │
           │                                  ├─────────────────────────────>
           │                                  │                           INSERT
           │                                  │                      processing_jobs
           │                                  │
           │ 3. Subscribe to                  │ 4. Poll for jobs            │
           │    processing_jobs               │    every 5 seconds          │
           │    (via realtime)                │                             │
           │<─────────────────────────────────┼─────────────────────────────┤
           │                                  │    SELECT * WHERE           │
           │                                  │    status = 'pending'       │
           │                                  │                             │
           │                                  │ 5. OCR Job                  │
           │                                  │    - Download document      │
           │                                  │    - Document AI extract    │
           │                                  │    - Store ocr_result       │
           │                                  ├─────────────────────────────>
           │                                  │ UPDATE extractions          │
           │                                  │ SET ocr_result = {...}      │
           │                                  │                             │
           │                         ┌────────┴────────┐                   │
           │                         │ Job Complete?   │                   │
           │                         └────────┬────────┘                   │
           │                                  │                             │
           │                    YES ┌─────────┴──────────┐ NO             │
           │                        │                    │                 │
           │                   ┌────▼────┐         ┌─────▼────┐            │
           │                   │ Update   │         │ Update   │            │
           │                   │ status   │         │ status   │            │
           │                   │ completed│         │ failed   │            │
           │                   └────┬─────┘         └─────┬────┘            │
           │                        │                    │                 │
           │         ┌──────────────┴────────────────────┴───────┐         │
           │         │                                           │         │
           │         │ 6. TRIGGER NEXT JOB [NOVO]                │         │
           │         │    triggerNextJob(ocr) → extraction        │         │
           │         │                                           │         │
           │         ├────────────────────────────────────────────────────>
           │         │ INSERT INTO processing_jobs                        │
           │         │ (job_type: 'extraction', status: 'pending')        │
           │         │                                                    │
           │         │ 7. Continue polling...                             │
           │         │    extraction job picked up                        │
           │         │    ├── Gemini classify doc type                    │
           │         │    ├── Store classification                        │
           │         │    └── triggerNextJob(extraction) → consensus      │
           │         │                                                    │
           │         │ 8. consensus job                                   │
           │         │    ├── Compare OCR vs LLM results                  │
           │         │    ├── Mark conflicts as pending                   │
           │         │    └── triggerNextJob(consensus) → entity_resolution
           │         │                                                    │
           │         │ 9. entity_extraction job [INDEPENDENT]             │
           │         │    ├── Gemini extract entities (CPF, names, etc)  │
           │         │    ├── Deduplicate & filter                        │
           │         │    ├── Store in extractions.llm_result             │
           │         │    └── triggerNextJob(entity_extraction)           │
           │         │        → entity_resolution [KEY]                   │
           │         │                                                    │
           │         │ 10. entity_resolution job [UNIFIED]                │
           │         │     ├── Input: consensus + entity_extraction      │
           │         │     ├── Dedupe persons by CPF                      │
           │         │     ├── Create Person entities                     │
           │         │     ├── Match properties                           │
           │         │     └── triggerNextJob(entity_resolution) → draft  │
           │         │                                                    │
           │         │ 11. draft job                                      │
           │         │     ├── Generate legal document                    │
           │         │     ├── Format for Tiptap editor                   │
           │         │     └── Store in drafts table                      │
           │         │     (terminal job - no next trigger)               │
           │         │                                                    │
           │         └────────────────────────────────────────────────────┘
           │                                  │
           │ 12. Document complete            │
           │     Update UI with results       │
           │                                  │
           └──────────────────────────────────┘
```

---

## Fluxo Detalhado: Entity Extraction

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTITY EXTRACTION JOB                        │
│              worker/src/jobs/entityExtraction.ts                │
└─────────────────────────────────────────────────────────────────┘

    START (ProcessingJob)
          │
          ├─ job_type: 'entity_extraction'
          ├─ document_id: 'doc-uuid'
          ├─ case_id: 'case-uuid'
          └─ status: 'pending'
          │
          ▼
    ┌─────────────────────┐
    │ 1. GET OCR Result   │
    │ FROM extractions    │
    │ ocr_result.text     │
    └──────────┬──────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 2. CHUNK TEXT        │
    │ MAX: 25,000 chars    │
    │ (Gemini limit)       │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 3. FOR EACH CHUNK:                   │
    │    Call Gemini Flash                 │
    │    Prompt: Extract entities...       │
    │    Output: JSON array                │
    └──────────┬──────────────────────────┘
               │
               ├─► RATE LIMIT: 500ms between chunks
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 4. PARSE ENTITIES                    │
    │    ├─ Validate JSON                  │
    │    ├─ Filter by confidence (>0.5)    │
    │    ├─ Add position from OCR blocks   │
    │    └─ Map entity types               │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 5. AGGREGATE CHUNKS                  │
    │    ├─ Collect all entities           │
    │    ├─ Count: ~42 entities (example)  │
    │    └─ Log summary by type            │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 6. POST-PROCESSING                   │
    │    ├─ deduplicateEntities()          │
    │    │  └─ Remove duplicates by value  │
    │    └─ filterByConfidence()           │
    │       └─ Keep only confidence > 0.5  │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 7. STORE IN DATABASE                 │
    │                                      │
    │ UPDATE extractions SET:              │
    │ llm_result: {                        │
    │   entity_extraction: {               │
    │     entities: [...],                 │
    │     document_id: 'doc-uuid',         │
    │     processing_time_ms: 5234,        │
    │     model_used: 'gemini-...'         │
    │   }                                  │
    │ }                                    │
    │                                      │
    │ UPDATE documents SET:                │
    │ metadata: {                          │
    │   entity_count: 42,                  │
    │   entity_extraction_date: '2025...'  │
    │ }                                    │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 8. RETURN STATUS                     │
    │ {                                    │
    │   status: 'completed',               │
    │   entities_count: 42,                │
    │   entity_summary: {                  │
    │     PERSON: 8,                       │
    │     CPF: 5,                          │
    │     DATE: 4,                         │
    │     ADDRESS: 6,                      │
    │     MONEY: 3,                        │
    │     ...                              │
    │   },                                 │
    │   chunks_processed: 2,               │
    │   processing_time_ms: 5234           │
    │ }                                    │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 9. UPDATE JOB STATUS (in index.ts)   │
    │                                      │
    │ UPDATE processing_jobs SET:          │
    │ status: 'completed',                 │
    │ completed_at: now(),                 │
    │ result: {...}                        │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ 10. TRIGGER NEXT JOB [NEW]           │
    │     triggerNextJob(job)              │
    │                                      │
    │     JOB_PIPELINE_SEQUENCE[           │
    │       'entity_extraction'             │
    │     ] = 'entity_resolution'          │
    │                                      │
    │     INSERT processing_jobs:          │
    │     job_type: 'entity_resolution'    │
    │     status: 'pending'                │
    │     document_id: same                │
    │     case_id: same                    │
    │                                      │
    │     *** KEY CHANGE ***               │
    │     Automatic triggering now!        │
    └──────────┬──────────────────────────┘
               │
               ▼
           SUCCESS


ENTITY TYPES EXTRACTED
─────────────────────────────────────────────────────────────

  PERSON
  ├─ Nomes (John Doe)
  ├─ Variações de nome
  └─ Confidence: 0.9-0.95

  CPF
  ├─ Format: XXX.XXX.XXX-XX
  ├─ Validação de formato
  └─ Confidence: 0.95+

  DATE
  ├─ Normalized: YYYY-MM-DD
  ├─ Any format in doc
  └─ Confidence: 0.85-0.95

  LOCATION
  ├─ Cities, states, neighborhoods
  ├─ Addresses
  └─ Confidence: 0.7-0.85

  ORGANIZATION
  ├─ Companies, cartórios
  ├─ Government agencies
  └─ Confidence: 0.75-0.90

  OTHER TYPES
  ├─ RG, CNPJ, EMAIL, PHONE
  ├─ ADDRESS, PROPERTY_REGISTRY
  ├─ MONEY, RELATIONSHIP, DOC_NUMBER
  └─ Confidence: 0.6-0.95


ARMAZENAMENTO DE ENTIDADES
─────────────────────────────────────────────────────────────

┌─ Tabela: extractions
│  ├─ id: UUID
│  ├─ document_id: UUID
│  ├─ ocr_result: JSONB
│  │  └─ {text, blocks[], ...}
│  ├─ llm_result: JSONB
│  │  ├─ llm_result.extraction: {...}
│  │  │  └─ doc_type, confidence
│  │  └─ llm_result.entity_extraction: {...}
│  │     └─ entities: [{
│  │           id, type, value, confidence,
│  │           normalized_value, context,
│  │           position: {page, bounding_box}
│  │         }]
│  ├─ consensus: JSONB (after consensus job)
│  ├─ pending_fields: TEXT[]
│  └─ updated_at: TIMESTAMP
│
├─ Tabela: documents
│  ├─ id: UUID
│  ├─ metadata: JSONB
│  │  ├─ entity_count: 42
│  │  └─ entity_extraction_date: TIMESTAMP
│  ├─ status: enum
│  └─ updated_at: TIMESTAMP
│
└─ Tabela: evidence (created later in entity_resolution)
   ├─ id: UUID
   ├─ document_id: UUID
   ├─ field_path: TEXT
   ├─ source_value: TEXT
   ├─ entity_type: enum
   ├─ page: INT
   ├─ bounding_box: JSONB
   └─ created_at: TIMESTAMP
```

---

## Antes vs. Depois da Implementação

### ANTES (Sem Trigger Automático)

```
┌────────────┐
│   Upload   │
│ Documents  │
└─────┬──────┘
      │
      ▼
┌─────────────────────┐
│ OCR Job Created     │
│ (status: pending)   │
└─────┬───────────────┘
      │
      ▼ [Worker polls & processes]
┌─────────────────────┐
│ OCR Job Completes   │
│ (status: completed) │
└─────────────────────┘
      │
      │ ❌ NOTHING HAPPENS
      │ ❌ No automatic next job
      │ ❌ User must manually trigger extraction
      │
      ▼ [Manual trigger needed]
┌─────────────────────┐
│ Extraction Job      │
│ (manually created)  │
└─────────────────────┘

Result: Incomplete pipeline, user must manage each step
```

### DEPOIS (Com Trigger Automático)

```
┌────────────┐
│   Upload   │
│ Documents  │
└─────┬──────┘
      │
      ▼
┌─────────────────────────┐
│ OCR Job Created         │
│ (status: pending)       │
└─────┬───────────────────┘
      │
      ▼ [Worker polls & processes]
┌─────────────────────────┐
│ OCR Job Completes       │
│ (status: completed)     │
└─────┬───────────────────┘
      │
      ▼ ✅ triggerNextJob() called
┌─────────────────────────┐
│ Extraction Job Created  │
│ (status: pending)       │
│ [AUTOMATIC]             │
└─────┬───────────────────┘
      │
      ▼ [Worker continues polling]
┌─────────────────────────┐
│ Extraction Job          │
│ Completes              │
└─────┬───────────────────┘
      │
      ▼ ✅ triggerNextJob() called
┌─────────────────────────┐
│ Consensus Job Created   │
│ (status: pending)       │
│ [AUTOMATIC]             │
└─────┬───────────────────┘
      │
      ▼ [Continues...]
┌─────────────────────────┐
│ Entity_Extraction Job   │
│ [Created separately]    │
└─────┬───────────────────┘
      │
      ▼ [Worker processes]
┌─────────────────────────┐
│ Entity_Extraction       │
│ Completes              │
└─────┬───────────────────┘
      │
      ▼ ✅ triggerNextJob() called
      │    entity_extraction → entity_resolution
      │
┌─────────────────────────┐
│ Entity_Resolution Job   │
│ Created [AUTOMATIC]     │
│ **KEY INTEGRATION**     │
└─────┬───────────────────┘
      │
      ▼ [Worker processes]
┌─────────────────────────┐
│ Entity_Resolution       │
│ Completes              │
│ (Person/Property ents) │
└─────┬───────────────────┘
      │
      ▼ ✅ triggerNextJob() called
┌─────────────────────────┐
│ Draft Job Created       │
│ (status: pending)       │
│ [AUTOMATIC]             │
└─────┬───────────────────┘
      │
      ▼ [Final step]
┌─────────────────────────┐
│ Draft Job Completes     │
│ Legal Doc Generated     │
└─────────────────────────┘

Result: Complete automated pipeline, no user intervention
```

---

## Sequência Detalhada com Timing

```
Timeline de Processamento (Example)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T+0s    User uploads document.pdf
        └─> Frontend: INSERT documents + CREATE processing_job (OCR)

T+2s    Worker polls, picks up OCR job
        └─> status: processing

T+5s    OCR completes
        └─> status: completed
        └─> UPDATE extractions with ocr_result
        └─> ✅ triggerNextJob() CREATES extraction job

T+7s    Worker polls, picks up extraction job
        └─> status: processing

T+10s   Extraction completes (Gemini classification)
        └─> status: completed
        └─> UPDATE documents with doc_type
        └─> ✅ triggerNextJob() CREATES consensus job

T+12s   Worker polls, picks up consensus job
        └─> status: processing

T+15s   Consensus completes
        └─> status: completed
        └─> UPDATE extractions with consensus data
        └─> ✅ triggerNextJob() CREATES entity_resolution job

T+17s   SEPARATELY: entity_extraction job processed
        (created manually by system or triggered elsewhere)
        └─> Gemini extracts entities from OCR text
        └─> Stores 42 entities: CPF, PERSON, DATE, etc.
        └─> ✅ triggerNextJob() CREATES entity_resolution job
        └─> [Job may already exist from consensus job]

T+19s   Worker polls, picks up entity_resolution job
        └─> status: processing
        └─> Input: consensus data + entity extraction data

T+25s   Entity_Resolution completes
        └─> Person entities created (dedup by CPF)
        └─> Property entities created (matched)
        └─> status: completed
        └─> ✅ triggerNextJob() CREATES draft job

T+27s   Worker polls, picks up draft job
        └─> status: processing
        └─> Reads Person/Property entities
        └─> Generates legal document content

T+35s   Draft completes
        └─> status: completed
        └─> Inserts record in drafts table
        └─> NO triggerNextJob() (terminal job)

T+36s   UI updates for user
        └─> All jobs completed
        └─> Draft available for editing in Tiptap


TOTAL PROCESSING TIME: ~36 seconds (end-to-end)
NO USER INTERVENTION REQUIRED AFTER UPLOAD
```

---

## Integração com Consensus Job

```
┌──────────────────────────────────────┐
│         CONSENSUS JOB INPUT          │
│  (from extraction.llm_result)         │
│                                      │
│ Compare:                             │
│ ├─ OCR results (extraction.ocr_result)
│ ├─ LLM results (extraction.llm_result)
│ └─ Mark conflicts                    │
└──────────────────────────────────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │ consensus job runs    │
      │ Updates extractions   │
      │ Sets pending_fields   │
      └───────────┬───────────┘
                  │
                  ▼ triggerNextJob()
      ┌───────────────────────────────┐
      │ entity_resolution job created │
      │                               │
      │ INPUT (from consensus):       │
      │ ├─ confirmed_fields           │
      │ ├─ pending_fields             │
      │ └─ conflicts (resolved values)│
      └───────────┬───────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
   ┌───────────┐     ┌──────────────────┐
   │ OCR Path  │     │ entity_extraction │
   │ ├─ ocr    │     │ [INDEPENDENT]     │
   │ └─ gemini │     │ ├─ Gemini extract │
   │   class   │     │ ├─ Entities       │
   └───────────┘     │ └─ Store          │
                     └──────────┬────────┘
                                │
                                ▼ triggerNextJob()
                        ┌────────────────────┐
                        │entity_resolution   │
                        │job now has INPUT:  │
                        │├─ from consensus   │
                        │└─ from entity_extr │
                        │                    │
                        │Merged entities     │
                        │Person dedup by CPF │
                        │Property matching   │
                        └────────────────────┘
```

---

## Fluxo de Erro e Recuperação

```
Error Scenarios
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Entity Extraction Job Fails
   ┌─────────────────────────────────────┐
   │ Job fails (status: failed)           │
   ├─ No triggerNextJob() called          │
   ├─ entity_resolution NOT created       │
   ├─ Error logged                        │
   └─ Max retries exhausted               │
        │
        ▼ Recovery needed
   ┌─────────────────────────────────────┐
   │ Manual retry or recovery function    │
   │ recoverStuckEntityExtractionJobs()   │
   │ └─ Find all completed entity_extr    │
   │    without entity_resolution         │
   │ └─ Create missing jobs               │
   └─────────────────────────────────────┘

2. Duplicate Job Prevention
   ┌─────────────────────────────────────┐
   │ entity_extraction completes          │
   ├─ Check if entity_resolution exists   │
   │ for same document                    │
   │ (from consensus job)                 │
   │                                      │
   │ IF EXISTS:                           │
   │ └─ Skip creation, log info           │
   │                                      │
   │ IF NOT EXISTS:                       │
   │ └─ Create entity_resolution job      │
   └─────────────────────────────────────┘

3. Job Status Transitions
   ┌────────────────────────────────────────┐
   │ pending → processing → completed       │
   │ pending → processing → failed          │
   │ pending → processing → retrying        │
   │                   → pending (retry)    │
   │                   → failed (max)       │
   └────────────────────────────────────────┘
```

