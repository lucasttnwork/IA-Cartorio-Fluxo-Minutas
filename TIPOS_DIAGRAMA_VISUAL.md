# Diagrama Visual - Estrutura de Tipos TypeScript

## Hierarquia de Tipos Principais

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TIPOS RAIZ                                  │
│                   (Entidades Principais)                            │
└─────────────────────────────────────────────────────────────────────┘

Organization
│
├─ id: string
├─ name: string (nome do cartório)
├─ settings: Record<string, unknown>
└─ created_at: string


User (AppUser)
│
├─ id: string
├─ organization_id: string ──→ Organization
├─ role: 'clerk' | 'supervisor' | 'admin'
├─ full_name: string
└─ created_at: string


Case (Entidade Central)
│
├─ id: string
├─ organization_id: string ──→ Organization
├─ act_type: ActType
│   └─ 'purchase_sale' | 'donation' | 'exchange' | 'lease'
├─ status: CaseStatus
│   └─ 'draft' | 'processing' | 'review' | 'approved' | 'archived'
├─ title: string
├─ created_by: string ──→ User
├─ assigned_to: string | null ──→ User
├─ canonical_data: CanonicalData | null (IMPORTANTE!)
├─ created_at: string
└─ updated_at: string
```

---

## Modelo Canônico (Dados Resolvidos)

```
CanonicalData (Armazenado em Case.canonical_data)
│
├── people: Person[]
│   │
│   └─ Person
│      ├─ id: string
│      ├─ case_id: string ──→ Case
│      ├─ full_name: string
│      ├─ cpf: string | null (CHAVE DE DEDUPLI)
│      ├─ rg: string | null
│      ├─ rg_issuer: string | null
│      ├─ birth_date: string | null
│      ├─ nationality: string | null
│      ├─ marital_status: MaritalStatus
│      │  └─ 'single'|'married'|'divorced'|'widowed'|'separated'|'stable_union'
│      ├─ profession: string | null
│      ├─ address: Address | null
│      │  ├─ street: string
│      │  ├─ number: string
│      │  ├─ complement?: string
│      │  ├─ neighborhood: string
│      │  ├─ city: string
│      │  ├─ state: string
│      │  ├─ zip: string
│      │  ├─ latitude?: number (GEOCODING)
│      │  ├─ longitude?: number
│      │  ├─ formatted_address?: string
│      │  ├─ geocoded_at?: string
│      │  ├─ geocode_confidence?: number
│      │  └─ geocode_status?: 'pending'|'success'|'failed'|'partial'
│      ├─ email: string | null
│      ├─ phone: string | null
│      ├─ father_name: string | null
│      ├─ mother_name: string | null
│      ├─ confidence: number (0-1)
│      ├─ source_docs: string[] (Document IDs)
│      ├─ metadata: Record<string, unknown>
│      │  └─ MergeMetadata (if merged)
│      │     ├─ merged_from?: string[]
│      │     ├─ merged_at?: string
│      │     ├─ original_data_a?: Partial<Person>
│      │     ├─ original_data_b?: Partial<Person>
│      │     └─ merge_reason?: string
│      ├─ created_at: string
│      └─ updated_at: string
│
├── properties: Property[]
│   │
│   └─ Property
│      ├─ id: string
│      ├─ case_id: string ──→ Case
│      ├─ registry_number: string | null (CHAVE DE DEDUPLI)
│      ├─ registry_office: string | null
│      ├─ address: Address | null (mesma estrutura que acima)
│      ├─ area_sqm: number | null
│      ├─ description: string | null
│      ├─ iptu_number: string | null
│      ├─ encumbrances: Encumbrance[] | null
│      │  └─ Encumbrance
│      │     ├─ type: string (hipoteca, penhor, etc)
│      │     ├─ description: string
│      │     ├─ value?: number
│      │     └─ beneficiary?: string
│      ├─ confidence: number
│      ├─ source_docs: string[] (Document IDs)
│      ├─ metadata: Record<string, unknown>
│      ├─ created_at: string
│      └─ updated_at: string
│
├── edges: GraphEdge[]
│   │
│   └─ GraphEdge
│      ├─ id: string
│      ├─ case_id: string ──→ Case
│      ├─ source_type: 'person' | 'property'
│      ├─ source_id: string ──→ Person | Property
│      ├─ target_type: 'person' | 'property'
│      ├─ target_id: string ──→ Person | Property
│      ├─ relationship: RelationshipType
│      │  └─ 'spouse_of' | 'represents' | 'owns' | 'sells' | 'buys'
│      │    | 'guarantor_of' | 'witness_for'
│      ├─ confidence: number
│      ├─ confirmed: boolean
│      ├─ metadata: GraphEdgeMetadata
│      │  ├─ proxy_document_id?: string ──→ Document
│      │  ├─ proxy_attached_at?: string
│      │  └─ [key: string]: unknown
│      └─ created_at: string
│
└── deal: DealDetails | null
    ├─ type: ActType ──→ 'purchase_sale'|'donation'|'exchange'|'lease'
    ├─ price?: number
    ├─ paymentSchedule?: PaymentSchedule
    │  └─ entries: PaymentEntry[]
    │     ├─ description: string
    │     ├─ percentage?: number
    │     ├─ amount?: number
    │     └─ due_date?: string
    └─ conditions?: string[]
```

---

## Fluxo de Documentos e Processamento

```
Document
│
├─ id: string
├─ case_id: string ──→ Case
├─ storage_path: string
├─ original_name: string
├─ mime_type: string ('application/pdf', 'image/jpeg', etc)
├─ file_size: number (bytes)
├─ page_count: number | null
├─ status: DocumentStatus
│  └─ 'uploaded'|'processing'|'processed'|'needs_review'|'approved'|'failed'
├─ doc_type: DocumentType | null
│  └─ 'cnh'|'rg'|'marriage_cert'|'deed'|'proxy'|'iptu'|'birth_cert'|'other'
├─ doc_type_confidence: number | null
├─ metadata: DocumentMetadata
│  └─ Campos específicos por tipo (ex: proxy_expiration_date, proxy_powers, etc)
├─ created_at: string
└─ updated_at: string
    │
    ├──→ Extraction
    │    │
    │    ├─ id: string
    │    ├─ document_id: string ──→ Document
    │    │
    │    ├─ ocr_result: OcrResult | null
    │    │  ├─ text: string
    │    │  ├─ blocks: OcrBlock[]
    │    │  │  ├─ text: string
    │    │  │  ├─ type: 'paragraph'|'line'|'word'
    │    │  │  ├─ confidence: number
    │    │  │  ├─ bounding_box: BoundingBox
    │    │  │  │  ├─ x: number
    │    │  │  │  ├─ y: number
    │    │  │  │  ├─ width: number
    │    │  │  │  └─ height: number
    │    │  │  └─ page: number
    │    │  ├─ confidence: number
    │    │  └─ language: string
    │    │
    │    ├─ llm_result: LlmResult | null
    │    │  ├─ document_type: DocumentType
    │    │  ├─ extracted_data: Record<string, unknown>
    │    │  ├─ confidence: number
    │    │  └─ notes: string[]
    │    │
    │    ├─ consensus: ConsensusResult | null
    │    │  ├─ fields: Record<string, ConsensusField>
    │    │  │  ├─ value: unknown (VALOR FINAL)
    │    │  │  ├─ ocr_value: unknown
    │    │  │  ├─ llm_value: unknown
    │    │  │  ├─ confidence: 'high'|'medium'|'low'
    │    │  │  ├─ source: 'ocr'|'llm'|'consensus'
    │    │  │  └─ is_pending: boolean
    │    │  ├─ overall_confidence: number
    │    │  ├─ conflicts: ConflictField[]
    │    │  ├─ total_fields: number
    │    │  ├─ confirmed_fields: number
    │    │  └─ pending_fields: number
    │    │
    │    ├─ pending_fields: string[]
    │    └─ created_at: string
    │
    └──→ Evidence (Rastreabilidade)
         │
         ├─ id: string
         ├─ entity_type: 'person'|'property'
         ├─ entity_id: string ──→ Person | Property
         ├─ field_name: string (ex: 'full_name', 'cpf')
         ├─ document_id: string ──→ Document
         ├─ page_number: number
         ├─ bounding_box: BoundingBox | null (LOCALIZAÇÃO NO DOC)
         ├─ extracted_text: string
         ├─ confidence: number
         ├─ source: 'ocr'|'llm'|'consensus'
         └─ created_at: string
```

---

## Pipeline de Processamento (Processing Jobs)

```
ProcessingJob
│
├─ id: string
├─ case_id: string ──→ Case
├─ document_id: string | null ──→ Document
├─ job_type: JobType (SEQUENCIAL!)
│  └─ [1] 'ocr'
│     [2] 'extraction'
│     [3] 'consensus'
│     [4] 'entity_resolution'
│     [5] 'draft'
├─ status: JobStatus
│  └─ 'pending'|'processing'|'completed'|'failed'|'retrying'
├─ attempts: number
├─ max_attempts: number (default 3)
├─ error_message: string | null
├─ result: Record<string, unknown> | null
├─ created_at: string
├─ started_at: string | null
├─ completed_at: string | null
├─ last_retry_at: string | null
└─ retry_delay_ms: number


Fluxo:
┌──────────────┐
│  OCR Job     │ (Google Document AI)
│ Document AI  │ Extrai: texto, blocos, layout
└──────┬───────┘
       │ OcrResult → Extraction.ocr_result
       │
┌──────▼───────┐
│ Extraction   │ (Gemini Flash)
│  Job (LLM)   │ Extrai: structured JSON
└──────┬───────┘
       │ LlmResult → Extraction.llm_result
       │
┌──────▼───────┐
│ Consensus    │ (Compara OCR vs LLM)
│    Job       │ Marca conflitos como pending
└──────┬───────┘
       │ ConflictField[] → Extraction.consensus
       │
┌──────▼──────────────────┐
│Entity Resolution (CPF)  │ (Deduplicação)
│ & Merge Suggestions     │ Cria People e Properties
└──────┬───────────────────┘
       │ Person[], Property[] → CanonicalData
       │
┌──────▼───────┐
│ Draft Job    │ (Gemini Pro)
│  Generation  │ Gera documento legal
└──────────────┘
       │ Draft content → Draft table
```

---

## Tipos de Conflito e Merge

```
ConflictField (Detectado no Consensus Job)
│
├─ fieldName: string
├─ fieldPath: string (dot notation)
├─ status: 'pending'|'confirmed'|'resolved'
├─ ocrValue: unknown
├─ llmValue: unknown
├─ finalValue?: unknown
├─ similarityScore: number (0-1)
├─ ocrConfidence?: number
├─ llmConfidence?: number
├─ conflictReason: ConflictReason | null
│  └─ 'low_similarity'|'type_mismatch'|'format_difference'
│    |'partial_match'|'ocr_confidence_low'|'llm_confidence_low'
│    |'both_confidence_low'|'semantic_difference'|'missing_value'
├─ reviewedBy?: string ──→ User
├─ reviewedAt?: string
├─ resolutionNote?: string
├─ createdAt: string
└─ autoResolved?: boolean


MergeSuggestion (Detectado na Entity Resolution)
│
├─ id: string
├─ case_id: string ──→ Case
├─ person_a_id: string ──→ Person (ou candidato)
├─ person_b_id: string ──→ Person (ou candidato)
├─ reason: MergeSuggestionReason
│  └─ 'same_cpf'|'similar_name'|'same_rg'
│    |'name_and_birth_date'|'name_and_address'
├─ confidence: number (0-1)
├─ similarity_score: number (0-1)
├─ status: 'pending'|'accepted'|'rejected'|'auto_merged'
├─ matching_fields: string[] (ex: ['cpf', 'birth_date'])
├─ conflicting_fields: string[] (ex: ['phone', 'email'])
├─ reviewed_by: string | null ──→ User
├─ reviewed_at: string | null
├─ notes: string | null
├─ created_at: string
└─ updated_at: string
```

---

## Tipos de Rascunho e Chat

```
Draft
│
├─ id: string
├─ case_id: string ──→ Case
├─ version: number
├─ content: DraftContent
│  └─ sections: DraftSection[]
│     ├─ id: string
│     ├─ title: string
│     ├─ type: SectionType
│     │  └─ 'header'|'parties'|'object'|'price'
│     │    |'conditions'|'clauses'|'closing'
│     ├─ content: string (Markdown ou HTML)
│     └─ order: number
├─ html_content: string (Tiptap rendered)
├─ pending_items: PendingItem[]
│  ├─ id: string
│  ├─ section_id: string ──→ DraftSection
│  ├─ field_path: string
│  ├─ reason: string
│  └─ severity: 'error'|'warning'|'info'
├─ status: 'generated'|'reviewing'|'approved'
└─ created_at: string


ChatSession
│
├─ id: string
├─ case_id: string ──→ Case
├─ draft_id: string ──→ Draft
└─ created_at: string
    │
    └──→ ChatMessage[]
         │
         ├─ id: string
         ├─ session_id: string ──→ ChatSession
         ├─ role: 'user'|'assistant'|'system'
         ├─ content: string
         ├─ operation: ChatOperation | null
         │  ├─ type: ChatOperationType
         │  │  └─ 'update_field'|'regenerate_section'
         │  │   |'add_clause'|'remove_clause'
         │  │   |'mark_pending'|'resolve_pending'
         │  ├─ target_path?: string
         │  ├─ old_value?: unknown
         │  ├─ new_value?: unknown
         │  ├─ section_id?: string
         │  ├─ reason?: string
         │  └─ status?: 'pending_approval'|'approved'|'rejected'
         └─ created_at: string
```

---

## Canvas (React Flow)

```
CanvasNode
│
├─ id: string
├─ type: 'person'|'property'
├─ position: { x: number; y: number }
└─ data: Person | Property


CanvasEdge
│
├─ id: string
├─ source: string ──→ CanvasNode.id
├─ target: string ──→ CanvasNode.id
├─ type: 'relationship'
└─ data:
   ├─ relationship: RelationshipType ──→ GraphEdge.relationship
   ├─ confirmed: boolean
   └─ confidence: number


CanvasPresence (Realtime)
│
├─ user_id: string ──→ User
├─ user_name: string
├─ cursor_x: number
├─ cursor_y: number
├─ color: string (assigned color for cursor)
└─ last_updated: number (timestamp)
```

---

## Tipos de Auditoria

```
AuditEntry (src/types/audit.ts)
│
├─ id: string
├─ caseId: string ──→ Case
├─ action: AuditActionType (20+ tipos)
│  └─ document_upload | document_delete | person_create | person_merge
│    | edge_confirm | draft_update | field_resolve_conflict | etc
├─ category: AuditCategory
│  └─ 'document'|'person'|'property'|'relationship'|'draft'|'field'|'case'|'system'
├─ status: 'success'|'pending'|'failed'|'rejected'
├─ targetType: 'document'|'person'|'property'|'edge'|'draft'|'case'|'field'
├─ targetId: string
├─ targetLabel: string (nome humano, ex: "João Silva - RG")
├─ description: string
├─ details?: string
├─ changes?: FieldChangeEvidence[]
│  ├─ fieldName: string
│  ├─ fieldPath: string
│  ├─ previousValue: unknown
│  ├─ newValue: unknown
│  ├─ previousDisplayValue?: string
│  ├─ newDisplayValue?: string
│  └─ source?: 'user'|'system'|'ai'|'import'
├─ evidence?: AuditEvidence[]
│  ├─ id: string
│  ├─ type: 'screenshot'|'document'|'diff'|'snapshot'|'reference'
│  ├─ label: string
│  ├─ data: string | Record<string, unknown> (base64 ou JSON)
│  └─ timestamp: string
├─ metadata?: Record<string, unknown>
├─ userId: string ──→ User
├─ userName: string
├─ userRole?: string
├─ timestamp: string
└─ createdAt: string
```

---

## Tipos de Evidência Visual

```
EvidenceItem
│
├─ id: string
├─ documentId: string ──→ Document
├─ imageUrl: string
├─ documentType?: DocumentType
├─ documentName: string
├─ pageNumber: number (1-indexed)
├─ totalPages: number
├─ boundingBoxes: EvidenceBoundingBox[]
│  ├─ id: string
│  ├─ page: number
│  ├─ label: string
│  ├─ confidence: number (0-1)
│  ├─ color?: string
│  ├─ fieldName?: string
│  ├─ extractedText?: string
│  ├─ overriddenValue?: string
│  ├─ isOverridden?: boolean
│  ├─ x, y, width, height (extends BoundingBox)
│  └─ (também suporta HighlightBoxState para interação)
├─ entityType?: 'person'|'property'
├─ entityId?: string
├─ fieldName?: string
└─ extractedValue?: string


EvidenceChain
│
├─ fieldName: string (ex: 'cpf')
├─ entityType: 'person'|'property'
├─ entityId: string
├─ currentValue: string | null
├─ confidence: number
├─ nodes: EvidenceChainNode[]
│  ├─ id: string
│  ├─ type: 'document'|'ocr'|'llm'|'consensus'|'entity'
│  ├─ label: string
│  ├─ value: string | null
│  ├─ confidence: number
│  ├─ timestamp: string
│  ├─ metadata?: Record<string, unknown>
│  ├─ documentId?: string ──→ Document
│  ├─ pageNumber?: number
│  └─ boundingBox?: BoundingBox
├─ links: EvidenceChainLink[]
│  ├─ source: string ──→ EvidenceChainNode.id
│  ├─ target: string ──→ EvidenceChainNode.id
│  ├─ type: 'extraction'|'validation'|'consensus'|'resolution'
│  └─ label?: string
├─ hasConflicts: boolean
└─ isPending: boolean


Visualização: Document → OCR → LLM → Consensus → Entity
             [extracted] [node] [node]   [node]    [node]
```

---

## Mapa de Relações (Referenciais)

```
Case (Entidade Central)
├─ organization_id → Organization
├─ created_by → User
├─ assigned_to → User | null
│
├─ canonical_data → CanonicalData
│  ├─ people → Person[]
│  │  └─ address → Address (próprio)
│  ├─ properties → Property[]
│  │  ├─ address → Address (próprio)
│  │  └─ encumbrances → Encumbrance[]
│  ├─ edges → GraphEdge[]
│  │  ├─ source_id → Person | Property
│  │  └─ target_id → Person | Property
│  └─ deal → DealDetails
│
├─ documents → Document[]
│  ├─ extractions → Extraction[]
│  │  ├─ ocr_result → OcrResult
│  │  ├─ llm_result → LlmResult
│  │  └─ consensus → ConsensusResult
│  │
│  └─ evidence → Evidence[]
│     └─ entity_id → Person | Property
│
├─ processing_jobs → ProcessingJob[]
│  └─ document_id → Document | null
│
├─ drafts → Draft[]
│  ├─ chat_sessions → ChatSession[]
│  │  └─ chat_messages → ChatMessage[]
│  └─ pending_items → PendingItem[]
│
├─ operations_log → OperationsLog[]
│  ├─ user_id → User
│  └─ draft_id → Draft
│
├─ merge_suggestions → MergeSuggestion[]
│  ├─ person_a_id → Person
│  ├─ person_b_id → Person
│  └─ reviewed_by → User | null
│
├─ graph_edges → GraphEdge[]
│  ├─ source_id → Person | Property
│  └─ target_id → Person | Property
│
└─ audit_trail → AuditEntry[]
   └─ userId → User
```

---

## Tipos de Dados por Fonte

### Dados Carregados do Usuário
- **Document** (upload)
- **DocumentMetadata** (associado ao documento)

### Dados Extraídos Automaticamente
- **OcrResult** (OCR Job)
- **LlmResult** (Extraction Job)
- **ConsensusResult** (Consensus Job)
- **ConflictField** (marcado em Consensus)
- **Evidence** (rastreabilidade)

### Dados Resolvidos Manualmente
- **Person** + **MergeMetadata** (usuário aprova merges)
- **Property** (agregado de extrações)
- **GraphEdge** (usuário confirma relacionamentos)
- **Draft** (rascunho legal gerado + edições manuais)

### Dados de Auditoria
- **AuditEntry** (todo evento importante)
- **OperationsLog** (mudanças em drafts)

---

## Resumo de Tabelas (Supabase)

| Tabela | Tipo | Descrição | Relacionada a |
|--------|------|-----------|---------------|
| `organizations` | Master | Cartórios | - |
| `users` | Master | Funcionários | Organization |
| `cases` | Master | Processos legais | Organization, User |
| `documents` | Detail | Documentos carregados | Case |
| `extractions` | Detail | Resultados OCR/LLM | Document |
| `evidence` | Detail | Rastreabilidade | Document, Person, Property |
| `people` | Master | Pessoas extraídas | Case |
| `properties` | Master | Propriedades extraídas | Case |
| `graph_edges` | Detail | Relacionamentos | Case, Person, Property |
| `processing_jobs` | Queue | Jobs de processamento | Case, Document |
| `drafts` | Master | Rascunhos legais | Case |
| `chat_sessions` | Detail | Sessões de chat | Case, Draft |
| `chat_messages` | Detail | Mensagens de chat | ChatSession |
| `operations_log` | Audit | Log de operações | Case, Draft, User |
| `merge_suggestions` | Detail | Sugestões de merge | Case, Person, User |
| `audit_trail` | Audit | Log completo de auditoria | Case, User |

---

Este diagrama fornece uma visão holística de como os tipos estão estruturados e relacionados no projeto Minuta Canvas.
