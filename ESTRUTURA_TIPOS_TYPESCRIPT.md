# Estrutura de Tipos TypeScript - Minuta Canvas

## Visão Geral

O projeto utiliza um sistema de tipos bem organizado em `src/types/` que espelha o schema do Supabase e adiciona tipos customizados para a aplicação. Os tipos são estruturados em múltiplos arquivos especializados.

---

## Arquivos de Tipos

### 1. **src/types/index.ts** (Principal - 726 linhas)
Arquivo central que contém a maioria dos tipos da aplicação.

### 2. **src/types/database.ts** (Gerado Automaticamente)
Define interfaces para operações de banco de dados (Row, Insert, Update).

### 3. **src/types/audit.ts** (Auditoria - 184 linhas)
Tipos específicos para rastreamento de auditoria e mudanças.

### 4. **src/types/evidence.ts** (Evidência - 559 linhas)
Tipos para visualização de evidências e bounding boxes em documentos.

### 5. **src/types/database.generated.ts** (Gerado)
Backup/reference do último tipo gerado automaticamente.

---

## Estrutura de Tipos por Categoria

```
src/types/
├── Tipos de Organização e Usuários
│   ├── Organization
│   └── User (com role: clerk | supervisor | admin)
│
├── Tipos de Casos e Documentos
│   ├── Case (com canonical_data)
│   ├── Document
│   ├── DocumentMetadata
│   └── ActType (purchase_sale | donation | exchange | lease)
│
├── Tipos de Extração
│   ├── Extraction
│   ├── OcrResult
│   ├── OcrBlock
│   ├── LlmResult
│   ├── ConsensusResult
│   └── ConsensusField
│
├── Tipos de Entidades
│   ├── Person (com CPF, RG, marital_status)
│   ├── Property (com registry_number, IPTU)
│   ├── Evidence
│   ├── Address (com geocoding)
│   └── Encumbrance
│
├── Tipos de Relacionamentos
│   ├── GraphEdge
│   ├── GraphEdgeMetadata
│   └── RelationshipType
│
├── Tipos de Rascunho
│   ├── Draft
│   ├── DraftContent
│   ├── DraftSection
│   ├── DraftTemplate
│   ├── PendingItem
│   └── SectionType
│
├── Tipos de Chat
│   ├── ChatSession
│   ├── ChatMessage
│   ├── ChatOperation
│   └── ChatOperationType
│
├── Tipos de Processamento
│   ├── ProcessingJob
│   ├── JobType (ocr | extraction | consensus | entity_resolution | draft)
│   └── JobStatus
│
├── Tipos de Conflito e Resolução
│   ├── ConflictField
│   ├── ConflictFieldStatus
│   ├── ConflictReason
│   ├── ResolveConflictRequest
│   └── ConflictsSummary
│
├── Tipos de Merge/Split de Entidades
│   ├── MergeSuggestion
│   ├── MergeSuggestionStatus
│   ├── MergeSuggestionReason
│   ├── MergeMetadata
│   └── SplitCandidate
│
├── Tipos de Canvas (React Flow)
│   ├── CanvasNode
│   ├── CanvasEdge
│   └── CanvasPresence
│
├── Tipos de Modelo Canônico
│   ├── CanonicalData
│   ├── DealDetails
│   ├── PaymentSchedule
│   └── PaymentEntry
│
├── Tipos de Auditoria (em audit.ts)
│   ├── AuditEntry
│   ├── AuditActionType
│   ├── AuditCategory
│   ├── AuditEvidence
│   ├── FieldChangeEvidence
│   └── AuditFilters
│
├── Tipos de Evidência Visual (em evidence.ts)
│   ├── EvidenceBoundingBox
│   ├── EvidenceItem
│   ├── EvidenceChain
│   ├── EvidenceChainNode
│   ├── EvidenceChainLink
│   ├── DocumentViewer
│   ├── BoundingBoxOverlay
│   └── HighlightBox
│
└── Tipos de API
    ├── ApiResponse<T>
    ├── ApiError
    ├── PaginatedResponse<T>
    ├── UploadProgress
    ├── Notification
    └── FilterState
```

---

## Tipos Relacionados a Usuários

### User (AppUser)
```typescript
interface User {
  id: string                                    // UUID Supabase
  organization_id: string                       // FK para Organization
  role: 'clerk' | 'supervisor' | 'admin'        // Níveis de acesso
  full_name: string                             // Nome completo
  created_at: string                            // ISO timestamp
}
```

### Organization
```typescript
interface Organization {
  id: string
  name: string                                  // Nome do cartório
  settings: Record<string, unknown>             // JSON customizável
  created_at: string
}
```

### Autenticação (em useAuth.tsx)
```typescript
interface AuthContextType {
  user: User | null                             // Usuário Supabase Auth
  appUser: AppUser | null                       // Usuário da aplicação
  session: Session | null                       // Sessão Supabase
  loading: boolean
  signIn: (email: string, password: string) => Promise<...>
  signUp: (email: string, password: string, fullName: string) => Promise<...>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<...>
  changePassword: (newPassword: string) => Promise<...>
  updateProfile: (fullName: string) => Promise<...>
}
```

---

## Tipos Relacionados a Autenticação

### Localização: `src/hooks/useAuth.tsx`

**Context Provider:**
- `AuthProvider` - Componente que envolve a aplicação
- `AuthContext` - Context contendo estado e funções de auth

**Hooks:**
```typescript
export function useAuth(): AuthContextType {
  // Retorna: user, appUser, session, loading, signIn, signUp, signOut, etc.
}
```

**Fluxo de Autenticação:**
1. `getSession()` - Obtém sessão inicial
2. `onAuthStateChange()` - Listener contínuo de mudanças
3. `fetchAppUser()` - Busca dados do usuário na tabela `users`
4. Sincroniza `User` (Supabase Auth) com `AppUser` (banco de dados)

---

## Organização de Tipos

### Padrão 1: Espelhamento do Schema
A maioria dos tipos em `index.ts` espelha diretamente as tabelas do Supabase:
- `User` → tabela `users`
- `Case` → tabela `cases`
- `Document` → tabela `documents`
- etc.

### Padrão 2: Tipos de Banco de Dados
Em `database.ts`, para cada tabela há três tipos:
```typescript
interface Database {
  public: {
    Tables: {
      [table_name]: {
        Row: SomeType              // SELECT
        Insert: SomeInsertType     // INSERT (sem id, created_at)
        Update: SomeUpdateType     // UPDATE (campos opcionais)
      }
    }
  }
}
```

### Padrão 3: Tipos Customizados
Tipos que não vêm diretamente do banco:
- `CanvasNode`, `CanvasEdge` - Específicos para React Flow
- `EvidenceChain` - Composição de múltiplas entidades
- `CanvasPresence` - Estado realtime de presença

---

## Como os Tipos do Banco são Gerados

### Comando de Geração
```bash
# Via npm script
npm run generate-types

# Via CLI direto
supabase gen types typescript --project-id kllcbgoqtxedlfbkxpfo > src/types/database.ts
```

### Processo
1. **Supabase CLI** conecta ao projeto PostgreSQL
2. **Analisa schema** das tabelas, colunas, tipos
3. **Gera tipos TypeScript** automaticamente
4. **Salva em** `src/types/database.ts`

### Output Esperado
```typescript
// database.ts contém:
- Database type com estrutura de Tables
- Row types para SELECT
- Insert types para INSERT
- Update types para UPDATE
- Helper types: Tables<T>, InsertTables<T>, UpdateTables<T>
```

### Integração com index.ts
```typescript
// database.ts importa de index.ts
import type {
  Organization,
  User,
  Case,
  Document,
  // ... todos os tipos principais
} from './index'

// index.ts é a "source of truth" para tipos
```

### Fluxo Recomendado
1. Criar/modificar tabelas no Supabase
2. Rodar `npm run generate-types`
3. Verificar se novos tipos aparecem em `database.ts`
4. Importar em componentes via `import type { Tables } from '@/types'`

---

## Exemplo de Uso de Tipos

### Insert
```typescript
import type { InsertTables } from '@/types/database'

const newDoc: InsertTables<'documents'> = {
  case_id: '123',
  storage_path: 'path/to/doc',
  original_name: 'RG.pdf',
  mime_type: 'application/pdf',
  file_size: 50000,
  status: 'uploaded',
  doc_type: 'rg'
}

await supabase.from('documents').insert(newDoc)
```

### Query
```typescript
import type { Tables } from '@/types/database'

const doc: Tables<'documents'> = await supabase
  .from('documents')
  .select('*')
  .eq('id', docId)
  .single()
```

### Update
```typescript
import type { UpdateTables } from '@/types/database'

const updates: UpdateTables<'documents'> = {
  status: 'processed',
  doc_type: 'rg'
}

await supabase.from('documents').update(updates).eq('id', docId)
```

---

## Tipos Especiais - Dados Canônicos

O projeto usa um modelo canônico centralizado em `Case`:

```typescript
interface Case {
  // ... campos básicos
  canonical_data: CanonicalData | null
}

interface CanonicalData {
  people: Person[]                              // Entidades de pessoas
  properties: Property[]                        // Entidades de propriedades
  edges: GraphEdge[]                            // Relacionamentos
  deal: DealDetails | null                      // Detalhes da transação
}
```

**Princípio:** "No evidence = no auto-fill"
- Todos os dados em `canonical_data` devem ter rastreabilidade
- Linked via `Evidence` records com documentId + page + bounding box

---

## Tipos de Conflito e Resolução

Para o pipeline OCR vs LLM:

```typescript
interface ConflictField {
  fieldName: string
  fieldPath: string
  status: 'pending' | 'confirmed' | 'resolved'
  ocrValue: unknown
  llmValue: unknown
  finalValue?: unknown
  similarityScore: number
  conflictReason: ConflictReason | null
  reviewedBy?: string
  reviewedAt?: string
  resolutionNote?: string
  createdAt: string
  autoResolved?: boolean
}

type ConflictReason =
  | 'low_similarity'
  | 'type_mismatch'
  | 'format_difference'
  | 'partial_match'
  | 'ocr_confidence_low'
  | 'llm_confidence_low'
  | 'both_confidence_low'
  | 'semantic_difference'
  | 'missing_value'
```

---

## Tipos de Merge e Deduplicação

Para resolver duplicatas de pessoas:

```typescript
interface MergeSuggestion {
  id: string
  case_id: string
  person_a_id: string
  person_b_id: string
  reason: MergeSuggestionReason       // same_cpf | similar_name | same_rg | etc
  confidence: number                  // 0-1
  similarity_score: number            // 0-1
  status: 'pending' | 'accepted' | 'rejected' | 'auto_merged'
  matching_fields: string[]           // Quais campos casaram
  conflicting_fields: string[]        // Quais têm valores diferentes
  reviewed_by?: string
  reviewed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Para split de pessoas já mergeadas
interface MergeMetadata {
  merged_from?: string[]
  merged_at?: string
  original_data_a?: Partial<Person>
  original_data_b?: Partial<Person>
  merge_reason?: string
}
```

---

## Tipos de Auditoria

Definidos em `src/types/audit.ts`:

```typescript
interface AuditEntry {
  id: string
  caseId: string
  action: AuditActionType                     // Tipo de ação
  category: AuditCategory                     // Categoria
  status: 'success' | 'pending' | 'failed' | 'rejected'
  targetType: 'document' | 'person' | 'property' | 'edge' | 'draft' | 'case' | 'field'
  targetId: string
  targetLabel: string                         // Nome humano
  description: string
  details?: string
  changes?: FieldChangeEvidence[]             // Before/after
  evidence?: AuditEvidence[]                  // Attachments
  metadata?: Record<string, unknown>
  userId: string
  userName: string
  userRole?: string
  timestamp: string
  createdAt: string
}

type AuditActionType =
  | 'document_upload' | 'document_delete' | 'document_approve' | 'document_reject'
  | 'person_create' | 'person_update' | 'person_delete' | 'person_merge'
  | 'property_create' | 'property_update' | 'property_delete'
  | 'edge_create' | 'edge_update' | 'edge_delete' | 'edge_confirm'
  | 'draft_create' | 'draft_update' | 'draft_approve'
  | 'draft_section_update' | 'draft_clause_add' | 'draft_clause_remove'
  | 'field_update' | 'field_resolve_conflict'
  | 'case_create' | 'case_update' | 'case_status_change' | 'case_assign'
  | 'custom'
```

---

## Tipos de Evidência Visual

Definidos em `src/types/evidence.ts`:

```typescript
interface EvidenceItem {
  id: string
  documentId: string
  imageUrl: string
  documentType?: DocumentType
  documentName: string
  pageNumber: number
  totalPages: number
  boundingBoxes: EvidenceBoundingBox[]
  entityType?: 'person' | 'property'
  entityId?: string
  fieldName?: string
  extractedValue?: string
}

interface EvidenceBoundingBox extends BoundingBox {
  id: string
  page: number
  label: string
  confidence: number                         // 0-1
  color?: string
  fieldName?: string
  extractedText?: string
  overriddenValue?: string
  isOverridden?: boolean
}

interface EvidenceChain {
  fieldName: string
  entityType: 'person' | 'property'
  entityId: string
  currentValue: string | null
  confidence: number
  nodes: EvidenceChainNode[]                // Document → OCR → LLM → Consensus → Entity
  links: EvidenceChainLink[]
  hasConflicts: boolean
  isPending: boolean
}

type EvidenceChainNodeType = 'document' | 'ocr' | 'llm' | 'consensus' | 'entity'
```

---

## Resumo Estrutural

```
┌─────────────────────────────────────────────────────────────┐
│                    src/types/index.ts                       │
│                    (SOURCE OF TRUTH)                        │
│  • 20+ interfaces principais                                │
│  • 30+ tipos union                                          │
│  • Espelha schema Supabase + tipos customizados             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─→ src/types/database.ts
                       │   (GERADO AUTOMATICAMENTE)
                       │   • Database interface
                       │   • Row/Insert/Update types
                       │   • Helper generics
                       │
                       ├─→ src/types/audit.ts
                       │   • AuditEntry
                       │   • AuditActionType (20+ ações)
                       │   • AuditFilters
                       │
                       └─→ src/types/evidence.ts
                           • EvidenceItem
                           • EvidenceBoundingBox
                           • EvidenceChain
                           • 20+ tipos visuais
```

### Fluxo de Geração

```
Supabase PostgreSQL Database
         ↓
    supabase gen types
         ↓
src/types/database.ts (auto-generated)
         ↓
Import em componentes
         ↓
Type-safe queries
```

---

## Convenções Adotadas

1. **Naming:** Singular para entidades (`Person`, `Property`), Plural para arrays
2. **Timestamps:** Sempre `string` em formato ISO (`created_at`, `updated_at`)
3. **IDs:** Sempre UUID strings (gerados pelo Supabase)
4. **Nullable:** Usar `| null` em vez de `?` para clareza
5. **Union Types:** Para enums (ActType, CaseStatus, JobType, etc)
6. **Composição:** Preferir `interface A extends B` em vez de herança
7. **Metadados:** Usar `Record<string, unknown>` para campos JSON flexíveis

---

## Importações Comuns

```typescript
// Tipos principais
import type { User, Case, Document, Person, Property } from '@/types'

// Tipos de banco (com generics)
import type { Tables, InsertTables, UpdateTables } from '@/types/database'

// Tipos de auditoria
import type { AuditEntry, AuditActionType } from '@/types/audit'

// Tipos de evidência
import type { EvidenceChain, EvidenceBoundingBox } from '@/types/evidence'
```

---

## Arquivo Referência Completa

| Arquivo | Linhas | Propósito | Gerado? |
|---------|--------|----------|---------|
| `index.ts` | 726 | Tipos principais da app | Manualmente |
| `database.ts` | 175 | Operações DB type-safe | **SIM** |
| `database.generated.ts` | ~175 | Backup da geração | **SIM** |
| `audit.ts` | 184 | Auditoria e logs | Manualmente |
| `evidence.ts` | 559 | Visualização de evidência | Manualmente |
| **TOTAL** | **~1,800** | | |

---

Este documento reflete a estrutura atual do projeto a partir da análise dos arquivos de tipos. Pode ser atualizado conforme novas entidades forem adicionadas.
