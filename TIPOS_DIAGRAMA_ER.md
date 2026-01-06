# Diagrama Entity-Relationship de Tipos

## ER Simplificado - Relações Principais

```
┌──────────────────┐
│  Organization    │
├──────────────────┤
│ id (PK)          │
│ name             │
│ settings (JSON)  │
│ created_at       │
└────────┬─────────┘
         │ 1:N
         │
         └─→ ┌──────────────────┐
             │   User (AppUser) │
             ├──────────────────┤
             │ id (FK-Auth)     │
             │ organization_id  │
             │ role             │
             │ full_name        │
             │ created_at       │
             └──────┬───────────┘
                    │ 1:N
                    │
                    └─→ ┌──────────────────┐
                        │     Case         │ ◄── Entidade Central
                        ├──────────────────┤
                        │ id (PK)          │
                        │ organization_id  │
                        │ act_type         │
                        │ status           │
                        │ title            │
                        │ created_by (FK)  │
                        │ assigned_to (FK) │
                        │ canonical_data   │ ◄── JSON embarcado
                        │ created_at       │
                        │ updated_at       │
                        └──────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                │              │              │
           1:N  │          1:N │          1:N │
                │              │              │
                ▼              ▼              ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Document    │ │   Draft      │ │ Processing   │
        ├──────────────┤ ├──────────────┤ │ Job          │
        │ id (PK)      │ │ id (PK)      │ ├──────────────┤
        │ case_id (FK) │ │ case_id (FK) │ │ id (PK)      │
        │ storage_path │ │ version      │ │ case_id (FK) │
        │ original_name│ │ content      │ │ document_id  │
        │ mime_type    │ │ html_content │ │ job_type     │
        │ file_size    │ │ status       │ │ status       │
        │ page_count   │ │ created_at   │ │ attempts     │
        │ status       │ └──────┬───────┘ │ error_msg    │
        │ doc_type     │        │         │ result       │
        │ doc_type_conf│        │ 1:N     │ created_at   │
        │ metadata     │        │         │ started_at   │
        │ created_at   │        │         │ completed_at │
        └──────┬───────┘        │         └──────────────┘
               │                │
               │ 1:N            │
               │                │
               └─→ ┌────────────┴──┐
                   │  ChatSession  │ 1:N
                   │               │
                   └──────────┬────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ChatMessage     │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ session_id (FK)  │
                    │ role             │
                    │ content          │
                    │ operation        │
                    │ created_at       │
                    └──────────────────┘

        ┌──────────────┐
        │ Extraction   │ (resultado de Documento)
        ├──────────────┤
        │ id (PK)      │
        │ document_id  │
        │ ocr_result   │
        │ llm_result   │
        │ consensus    │
        │ pending_      │
        │ fields       │
        │ created_at   │
        └──────┬───────┘
               │ 1:1
               │
               └─→ Dentro de Case.canonical_data:

                   ┌──────────────────────────────────┐
                   │     CanonicalData (JSON)         │
                   ├──────────────────────────────────┤
                   │ people: Person[]                 │
                   │ properties: Property[]           │
                   │ edges: GraphEdge[]               │
                   │ deal: DealDetails                │
                   └──────────────────────────────────┘
                        │        │         │
              ┌─────────┼────────┼────────┐
              │         │        │        │
              ▼         ▼        ▼        ▼
        ┌─────────┐┌─────────┐┌────────┐┌───────┐
        │ Person  ││Property ││GraphEdg││ Deal  │
        └─────────┘└─────────┘└────────┘└───────┘
```

---

## ER Completo - Todas as Entidades

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE SCHEMA                                │
└─────────────────────────────────────────────────────────────────────┘

TIER 1: ORGANIZAÇÃO
├─ organizations (Master)
│   ├─ id: UUID
│   ├─ name: String
│   ├─ settings: JSONB
│   └─ created_at: Timestamp
│
├─ auth.users (Supabase Auth - Externa)
│   ├─ id: UUID
│   ├─ email: String
│   ├─ encrypted_password: ...
│   └─ user_metadata: JSONB
│
└─ users (AppUser - Local)
    ├─ id: UUID (FK → auth.users)
    ├─ organization_id: UUID (FK → organizations)
    ├─ role: String (admin|supervisor|clerk)
    ├─ full_name: String
    └─ created_at: Timestamp

TIER 2: CASOS
├─ cases (Master - Central)
│   ├─ id: UUID
│   ├─ organization_id: UUID (FK → organizations)
│   ├─ act_type: String
│   ├─ status: String
│   ├─ title: String
│   ├─ created_by: UUID (FK → users)
│   ├─ assigned_to: UUID (FK → users, nullable)
│   ├─ canonical_data: JSONB ◄── DADOS RESOLVIDOS
│   ├─ created_at: Timestamp
│   └─ updated_at: Timestamp

TIER 3: DOCUMENTOS & EXTRAÇÃO
├─ documents (Detail)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ storage_path: String
│   ├─ original_name: String
│   ├─ mime_type: String
│   ├─ file_size: Integer
│   ├─ page_count: Integer
│   ├─ status: String
│   ├─ doc_type: String
│   ├─ doc_type_confidence: Decimal
│   ├─ metadata: JSONB
│   ├─ created_at: Timestamp
│   └─ updated_at: Timestamp
│
├─ extractions (Detail)
│   ├─ id: UUID
│   ├─ document_id: UUID (FK → documents)
│   ├─ ocr_result: JSONB (OcrResult)
│   ├─ llm_result: JSONB (LlmResult)
│   ├─ consensus: JSONB (ConsensusResult)
│   ├─ pending_fields: Array<String>
│   └─ created_at: Timestamp
│
└─ processing_jobs (Queue)
    ├─ id: UUID
    ├─ case_id: UUID (FK → cases)
    ├─ document_id: UUID (FK → documents, nullable)
    ├─ job_type: String (ocr|extraction|consensus|entity_resolution|draft)
    ├─ status: String (pending|processing|completed|failed|retrying)
    ├─ attempts: Integer
    ├─ max_attempts: Integer
    ├─ error_message: String
    ├─ result: JSONB
    ├─ created_at: Timestamp
    ├─ started_at: Timestamp
    ├─ completed_at: Timestamp
    ├─ last_retry_at: Timestamp
    └─ retry_delay_ms: Integer

TIER 4: ENTIDADES RESOLVIDAS
├─ people (Master)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ full_name: String
│   ├─ cpf: String (DEDUPLI KEY)
│   ├─ rg: String
│   ├─ rg_issuer: String
│   ├─ birth_date: String (ISO Date)
│   ├─ nationality: String
│   ├─ marital_status: String
│   ├─ profession: String
│   ├─ address: JSONB (Address)
│   ├─ email: String
│   ├─ phone: String
│   ├─ father_name: String
│   ├─ mother_name: String
│   ├─ confidence: Decimal (0-1)
│   ├─ source_docs: Array<UUID>
│   ├─ metadata: JSONB (MergeMetadata se merged)
│   ├─ created_at: Timestamp
│   └─ updated_at: Timestamp
│
├─ properties (Master)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ registry_number: String (DEDUPLI KEY)
│   ├─ registry_office: String
│   ├─ address: JSONB (Address)
│   ├─ area_sqm: Decimal
│   ├─ description: String
│   ├─ iptu_number: String
│   ├─ encumbrances: JSONB (Array<Encumbrance>)
│   ├─ confidence: Decimal
│   ├─ source_docs: Array<UUID>
│   ├─ metadata: JSONB
│   ├─ created_at: Timestamp
│   └─ updated_at: Timestamp
│
├─ graph_edges (Detail)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ source_type: String (person|property)
│   ├─ source_id: UUID (FK → people|properties)
│   ├─ target_type: String (person|property)
│   ├─ target_id: UUID (FK → people|properties)
│   ├─ relationship: String (spouse_of|represents|owns|sells|buys|...)
│   ├─ confidence: Decimal
│   ├─ confirmed: Boolean
│   ├─ metadata: JSONB (ex: proxy_document_id)
│   └─ created_at: Timestamp
│
└─ evidence (Detail - Rastreabilidade)
    ├─ id: UUID
    ├─ entity_type: String (person|property)
    ├─ entity_id: UUID (FK → people|properties)
    ├─ field_name: String (ex: 'cpf', 'full_name')
    ├─ document_id: UUID (FK → documents)
    ├─ page_number: Integer
    ├─ bounding_box: JSONB (BoundingBox)
    ├─ extracted_text: String
    ├─ confidence: Decimal
    ├─ source: String (ocr|llm|consensus)
    └─ created_at: Timestamp

TIER 5: RASCUNHO & CHAT
├─ drafts (Master)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ version: Integer
│   ├─ content: JSONB (DraftContent)
│   ├─ html_content: String
│   ├─ pending_items: JSONB (Array<PendingItem>)
│   ├─ status: String (generated|reviewing|approved)
│   └─ created_at: Timestamp
│
├─ chat_sessions (Detail)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ draft_id: UUID (FK → drafts)
│   └─ created_at: Timestamp
│
└─ chat_messages (Detail)
    ├─ id: UUID
    ├─ session_id: UUID (FK → chat_sessions)
    ├─ role: String (user|assistant|system)
    ├─ content: String
    ├─ operation: JSONB (ChatOperation)
    └─ created_at: Timestamp

TIER 6: AUDITORIA
├─ operations_log (Immutable)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ draft_id: UUID (FK → drafts)
│   ├─ user_id: UUID (FK → users)
│   ├─ operation_type: String
│   ├─ target_path: String
│   ├─ old_value: JSONB
│   ├─ new_value: JSONB
│   ├─ reason: String
│   └─ created_at: Timestamp
│
├─ merge_suggestions (Transient)
│   ├─ id: UUID
│   ├─ case_id: UUID (FK → cases)
│   ├─ person_a_id: UUID (FK → people)
│   ├─ person_b_id: UUID (FK → people)
│   ├─ reason: String
│   ├─ confidence: Decimal
│   ├─ similarity_score: Decimal
│   ├─ status: String
│   ├─ matching_fields: Array<String>
│   ├─ conflicting_fields: Array<String>
│   ├─ reviewed_by: UUID (FK → users, nullable)
│   ├─ reviewed_at: Timestamp
│   ├─ notes: String
│   ├─ created_at: Timestamp
│   └─ updated_at: Timestamp
│
└─ audit_trail (Immutable)
    ├─ id: UUID
    ├─ caseId: UUID (FK → cases)
    ├─ action: String (document_upload|person_merge|draft_update|...)
    ├─ category: String (document|person|property|draft|...)
    ├─ status: String (success|pending|failed|rejected)
    ├─ targetType: String
    ├─ targetId: UUID
    ├─ targetLabel: String
    ├─ description: String
    ├─ details: String
    ├─ changes: JSONB (Array<FieldChangeEvidence>)
    ├─ evidence: JSONB (Array<AuditEvidence>)
    ├─ metadata: JSONB
    ├─ userId: UUID (FK → users)
    ├─ userName: String
    ├─ userRole: String
    ├─ timestamp: Timestamp
    └─ createdAt: Timestamp
```

---

## Diagrama de Dependências Conceitual

```
┌────────────────────────────────────────────────────────────┐
│               DATA FLOW & DEPENDENCIES                     │
└────────────────────────────────────────────────────────────┘

NÍVEL 1: ENTRADA (User Actions)
┌─────────────────────┐
│  Upload Document    │
└──────────┬──────────┘
           │
           │ Cria Document
           │ Status: 'uploaded'
           │
           ▼
┌──────────────────────────────────────────────────────┐
│ NÍVEL 2: PROCESSAMENTO (Jobs Sequenciais)            │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ProcessingJob 1: OCR                                 │
│ └─ Google Document AI                                │
│    └─ OcrResult (texto + blocos)                    │
│       └─ Extraction.ocr_result                      │
│                                                      │
│ ProcessingJob 2: Extraction                          │
│ └─ Gemini Flash LLM                                  │
│    └─ LlmResult (structured data)                   │
│       └─ Extraction.llm_result                      │
│                                                      │
│ ProcessingJob 3: Consensus                           │
│ └─ Compara OCR vs LLM                               │
│    ├─ ConsensusResult (best values)                 │
│    ├─ ConflictField[] (conflitos)                   │
│    └─ Extraction.consensus                          │
│                                                      │
│ ProcessingJob 4: Entity Resolution                   │
│ └─ Cria/Merge Pessoas & Propriedades                │
│    ├─ Person[] + Property[]                         │
│    ├─ MergeSuggestion[] (se duplicatas)             │
│    ├─ GraphEdge[] (relacionamentos)                 │
│    ├─ Evidence[] (rastreabilidade)                  │
│    └─ CanonicalData (em Case)                       │
│                                                      │
│ ProcessingJob 5: Draft Generation                    │
│ └─ Gemini Pro gera documento legal                   │
│    ├─ Draft (conteúdo)                              │
│    ├─ ChatSession (para edições)                    │
│    └─ PendingItem[] (campos em aberto)              │
│                                                      │
└──────────────────────────────────────────────────────┘
           │
           │ Tudo armazenado em Case
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ NÍVEL 3: DADOS RESOLVIDOS (CanonicalData)              │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Case.canonical_data = {                               │
│   people: Person[],                                   │
│   properties: Property[],                             │
│   edges: GraphEdge[],                                 │
│   deal: DealDetails                                   │
│ }                                                     │
│                                                        │
│ SOURCE OF TRUTH para:                                 │
│ - Draft generation                                    │
│ - Chat responses                                      │
│ - Canvas visualization                               │
│                                                        │
└────────────────────────────────────────────────────────┘
           │
           │ Renderizado em
           │
           ▼
┌─────────────────────────────────────────────┐
│ NÍVEL 4: VISUALIZAÇÃO & EDIÇÃO (Frontend)   │
├─────────────────────────────────────────────┤
│                                             │
│ Canvas (React Flow)                         │
│ ├─ CanvasNode[] (Person & Property)         │
│ ├─ CanvasEdge[] (GraphEdge rendered)        │
│ └─ CanvasPresence (realtime cursors)        │
│                                             │
│ Draft Editor (Tiptap)                       │
│ ├─ DraftSection[] editable                  │
│ ├─ ChatSession para AI edits                │
│ └─ OperationsLog para auditoria             │
│                                             │
│ Evidence Viewer                             │
│ ├─ EvidenceChain (field rastreability)      │
│ ├─ EvidenceBoundingBox (document overlay)   │
│ └─ Links documents → Entity fields          │
│                                             │
└─────────────────────────────────────────────┘
           │
           │ User approves/edits
           │
           ▼
┌─────────────────────────┐
│ NÍVEL 5: AUDITORIA      │
├─────────────────────────┤
│                         │
│ AuditEntry (todas as ações)
│ OperationsLog (draft edits)
│ MergeHistory (em metadata)
│ Evidence (rastreabilidade)
│                         │
└─────────────────────────┘
           │
           │ Caso aprovado
           │
           ▼
┌──────────────────────┐
│ Case.status = 'approved'
│ Draft.status = 'approved'
│ Pronto para emissão
└──────────────────────┘
```

---

## Matriz de Dependências

```
Tabela               │ Depende De           │ Referenciada Por
─────────────────────┼──────────────────────┼─────────────────
organizations        │ -                    │ users, cases
users (auth)         │ -                    │ -
users (local)        │ organizations        │ cases, operations_log, merge_suggestions, audit_trail
cases                │ organizations, users │ documents, extractions, processing_jobs, drafts, people, properties, graph_edges, evidence, chat_sessions, operations_log, merge_suggestions, audit_trail
documents            │ cases                │ extractions, processing_jobs, evidence
extractions          │ documents            │ (data reference only)
processing_jobs      │ cases, documents     │ (queue reference only)
people               │ cases                │ graph_edges (source/target), evidence, merge_suggestions
properties           │ cases                │ graph_edges (source/target), evidence
graph_edges          │ cases, people/props  │ (data reference only)
evidence             │ cases, documents     │ (data reference only)
drafts               │ cases                │ chat_sessions, operations_log
chat_sessions        │ cases, drafts        │ chat_messages
chat_messages        │ chat_sessions        │ (data reference only)
operations_log       │ cases, drafts, users │ (immutable audit)
merge_suggestions    │ cases, people, users │ (user action reference)
audit_trail          │ cases, users         │ (immutable audit)
```

---

## Fluxo de Dados Completo

```
┌─ USER UPLOADS DOCUMENT ─┐
│                         │
│  Document created       │
│  status: 'uploaded'     │
│                         │
└────────┬────────────────┘
         │
         │ WORKER POLLS
         │
         ├─→ ProcessingJob 1
         │   ├─ Google Document AI
         │   └─ OcrResult → Extraction
         │
         ├─→ ProcessingJob 2
         │   ├─ Gemini LLM
         │   └─ LlmResult → Extraction
         │
         ├─→ ProcessingJob 3
         │   ├─ Compare OCR vs LLM
         │   ├─ ConsensusResult
         │   └─ ConflictField[]
         │
         ├─→ ProcessingJob 4
         │   ├─ Create/Update Person, Property
         │   ├─ Detect Duplicates → MergeSuggestion
         │   ├─ Create Evidence records
         │   └─ Populate CanonicalData
         │
         └─→ ProcessingJob 5
             ├─ Gemini Pro generates Draft
             ├─ Create ChatSession
             └─ Draft ready for review

         ⬇ ALL DATA NOW IN Case ⬇

         FRONTEND LOADS CASE
         │
         ├─→ Canvas renders
         │   ├─ CanvasNode[] from Person[]
         │   ├─ CanvasEdge[] from GraphEdge[]
         │   └─ CanvasPresence for realtime
         │
         ├─→ Draft opens
         │   ├─ DraftSection[] editable
         │   ├─ PendingItem[] highlighted
         │   └─ Chat available
         │
         ├─→ Entities page
         │   ├─ Person cards
         │   ├─ Property cards
         │   └─ Evidence viewer
         │
         └─→ History page
             ├─ AuditEntry[]
             ├─ OperationsLog[]
             └─ MergeSuggestion[]

         USER EDITS DRAFT
         │
         ├─→ ChatMessage sent to AI
         │   ├─ AI suggests ChatOperation
         │   ├─ User approves/rejects
         │   └─ OperationsLog created
         │
         └─→ Direct field edits
             ├─ AuditEntry logged
             ├─ Evidence updated
             └─ CanonicalData synced

         ⬇ USER APPROVES ⬇

         Case.status = 'approved'
         Draft.status = 'approved'
         Ready for notary seal
```

---

## Índice de Tipos por Tabela

| Tabela | Tipo Row | Insert Type | Update Type | Descrição |
|--------|----------|-------------|-------------|-----------|
| `organizations` | Organization | Omit<Org, 'id'\|'created_at'> | Partial<Org> | Cartório |
| `users` | User | Omit<User, 'id'\|'created_at'> | Partial<User> | Usuário com role |
| `cases` | Case | Omit<Case, 'id'\|timestamps> | Partial<Case> | Caso central |
| `documents` | Document | DocumentInsert | Partial<DocumentInsert> | Documento |
| `extractions` | Extraction | Omit<Extraction, 'id'\|'created_at'> | Partial<Extraction> | Resultados |
| `people` | Person | Omit<Person, 'id'\|timestamps> | Partial<Person> | Entidade pessoa |
| `properties` | Property | Omit<Property, 'id'\|timestamps> | Partial<Property> | Entidade propriedade |
| `graph_edges` | GraphEdge | Omit<GraphEdge, 'id'\|'created_at'> | Partial<GraphEdge> | Relacionamento |
| `evidence` | Evidence | Omit<Evidence, 'id'\|'created_at'> | Partial<Evidence> | Rastreabilidade |
| `processing_jobs` | ProcessingJob | ProcessingJobInsert | Partial<ProcessingJobInsert> | Job queue |
| `drafts` | Draft | Omit<Draft, 'id'\|'created_at'> | Partial<Draft> | Rascunho legal |
| `chat_sessions` | ChatSession | Omit<ChatSession, 'id'\|'created_at'> | Partial<ChatSession> | Sessão chat |
| `chat_messages` | ChatMessage | Omit<ChatMessage, 'id'\|'created_at'> | Partial<ChatMessage> | Mensagem chat |
| `operations_log` | OperationsLog | Omit<OperationsLog, 'id'\|'created_at'> | - (imutável) | Log operações |
| `merge_suggestions` | MergeSuggestion | Omit<MergeSuggestion, 'id'\|timestamps> | Partial<MergeSuggestion> | Sugestão merge |
| `audit_trail` | AuditEntry | CreateAuditEntryPayload | - (imutável) | Log auditoria |

---

## Normalization

O schema está em **3ª Forma Normal (3NF)**:

- **1NF:** Todos os valores são atômicos (não há arrays nas colunas, usam JSONB)
- **2NF:** Todas as colunas não-chave dependem totalmente da chave primária
- **3NF:** Nenhuma coluna não-chave depende de outra coluna não-chave

**Exceções intencionais:**
- `canonical_data` em `cases` - JSONB embarcado (desnormalizado propositalmente para performance)
- `metadata` em várias tabelas - JSONB flexível para futuros campos

---

## Constraints & Validações

```
Nível Database (PostgreSQL):
├─ PRIMARY KEY: Todas as tabelas
├─ FOREIGN KEY: Relacionamentos cross-table
├─ CHECK: Status enum values
├─ UNIQUE: cpf em people, registry_number em properties
├─ NOT NULL: campos obrigatórios
│
Nível TypeScript:
├─ Type Safety via Type System
├─ Union Types para enums
├─ Discriminated Unions (jobType | status)
├─ Custom Brands para IDs (UUID branded types)
│
Nível RLS (Row Level Security):
├─ Filtro organization_id em todas as queries
├─ Role-based permissions (admin | supervisor | clerk)
├─ Policy: "Users see only their organization data"
```

---

Este diagrama fornece uma visão arquitetural completa de como os tipos de dados estão organizados e relacionados no Minuta Canvas.
