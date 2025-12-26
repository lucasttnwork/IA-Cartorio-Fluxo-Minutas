# Referência Rápida de Tipos TypeScript

## TL;DR - Estrutura Básica

```typescript
// ===== ORGANIZAÇÃO & USUÁRIOS =====
Organization          // Cartório com settings JSON
User                  // Supabase Auth User
AppUser (User)        // Registro local com role: admin|supervisor|clerk

// ===== CASOS & DOCUMENTOS =====
Case                  // Entidade central, contém canonical_data
  ├─ ActType: 'purchase_sale'|'donation'|'exchange'|'lease'
  └─ CaseStatus: 'draft'|'processing'|'review'|'approved'|'archived'

Document              // PDF/JPEG carregado
  └─ DocumentType: 'cnh'|'rg'|'marriage_cert'|'deed'|'proxy'|'iptu'|'birth_cert'

// ===== EXTRAÇÃO & PROCESSAMENTO =====
ProcessingJob         // Job de processamento sequencial
  └─ JobType: 'ocr'|'extraction'|'consensus'|'entity_resolution'|'draft'

Extraction            // Resultados de OCR/LLM/Consensus
  ├─ OcrResult (Google Document AI)
  ├─ LlmResult (Gemini)
  └─ ConsensusResult (comparação)

// ===== DADOS RESOLVIDOS =====
CanonicalData         // Dados consolidados em Case.canonical_data
  ├─ people: Person[]
  ├─ properties: Property[]
  ├─ edges: GraphEdge[]
  └─ deal: DealDetails

// ===== RASTREABILIDADE =====
Evidence              // Liga extração ao entity + documento
ConflictField         // Conflito OCR vs LLM durante consensus
MergeSuggestion       // Sugestão de merge de pessoas duplicadas

// ===== CANVAS & VISUALIZAÇÃO =====
CanvasNode            // Pessoa ou Propriedade no React Flow
CanvasEdge            // Relacionamento no canvas
CanvasPresence        // Cursor realtime de outros usuários

// ===== RASCUNHO LEGAL =====
Draft                 // Documento legal gerado
DraftSection          // Seção do rascunho (header, parties, price, etc)

ChatSession           // Sessão de conversa sobre draft
ChatMessage           // Mensagem com operações estruturadas

// ===== AUDITORIA =====
AuditEntry            // Log de todas as ações importantes
OperationsLog         // Log específico de mudanças em drafts
```

---

## Imports Mais Usados

```typescript
// Tipos principais
import type {
  Case,
  Document,
  Person,
  Property,
  Draft,
  Evidence,
  GraphEdge,
  User,
  Organization
} from '@/types'

// Tipos de banco (com generics)
import type { Tables, InsertTables, UpdateTables } from '@/types/database'

// Tipos de auditoria
import type { AuditEntry, AuditActionType } from '@/types/audit'

// Tipos de evidência
import type { EvidenceChain, EvidenceBoundingBox } from '@/types/evidence'

// Hook de autenticação
import { useAuth } from '@/hooks/useAuth'
```

---

## Como Usar Cada Tipo

### 1. Inserir Documento

```typescript
import type { InsertTables } from '@/types/database'

const newDoc: InsertTables<'documents'> = {
  case_id: caseId,
  storage_path: 'uploads/doc.pdf',
  original_name: 'RG.pdf',
  mime_type: 'application/pdf',
  file_size: 50000,
  status: 'uploaded',
  doc_type: 'rg',
  page_count: 1
}

const { data } = await supabase
  .from('documents')
  .insert(newDoc)
  .select()
  .single() as { data: Tables<'documents'> }
```

### 2. Buscar Case com Canonical Data

```typescript
import type { Tables } from '@/types/database'
import type { Case, CanonicalData } from '@/types'

const caseData = await supabase
  .from('cases')
  .select('*')
  .eq('id', caseId)
  .single() as { data: Tables<'cases'> }

const canonicalData = caseData.data.canonical_data as CanonicalData

console.log(canonicalData.people)      // Person[]
console.log(canonicalData.properties)  // Property[]
console.log(canonicalData.edges)       // GraphEdge[]
```

### 3. Atualizar Status de Job

```typescript
import type { UpdateTables } from '@/types/database'

const jobUpdate: UpdateTables<'processing_jobs'> = {
  status: 'completed',
  completed_at: new Date().toISOString(),
  result: { extracted_data: {...} }
}

await supabase
  .from('processing_jobs')
  .update(jobUpdate)
  .eq('id', jobId)
```

### 4. Usar Authentication

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { appUser, user, session, signOut, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!appUser) return <div>Not authenticated</div>

  return (
    <div>
      <p>Olá, {appUser.full_name}</p>
      <p>Role: {appUser.role}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  )
}
```

### 5. Criar Audit Entry

```typescript
import type { CreateAuditEntryPayload } from '@/types/audit'

const auditEntry: CreateAuditEntryPayload = {
  caseId: case.id,
  action: 'person_merge',
  category: 'person',
  targetType: 'person',
  targetId: mergedPersonId,
  targetLabel: 'João Silva (CPF: 123.456.789-00)',
  description: 'Mesclou duas pessoas duplicadas',
  userId: appUser.id,
  userName: appUser.full_name,
  userRole: appUser.role,
  changes: [
    {
      fieldName: 'cpf',
      fieldPath: 'cpf',
      previousValue: '111.111.111-11',
      newValue: '123.456.789-00',
      source: 'user'
    }
  ]
}

// POST /api/audit ou via supabase.from('audit_trail').insert(...)
```

---

## Tipos por Arquivo

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| **index.ts** | `User` | Usuário da aplicação (role-based) |
| | `Organization` | Cartório |
| | `Case` | Caso legal (entidade central) |
| | `Document` | Documento carregado |
| | `Extraction` | Resultados de OCR/LLM |
| | `Person` | Pessoa física extraída |
| | `Property` | Propriedade extraída |
| | `GraphEdge` | Relacionamento entre entidades |
| | `Evidence` | Rastreabilidade de extração |
| | `Draft` | Rascunho legal |
| | `ChatSession/ChatMessage` | Chat sobre draft |
| | `ProcessingJob` | Job de processamento |
| | `CanonicalData` | Dados resolvidos |
| | `ConflictField` | Conflito OCR vs LLM |
| | `MergeSuggestion` | Sugestão de merge |
| **database.ts** | `Tables<T>` | Tipo de linha SELECT |
| | `InsertTables<T>` | Tipo para INSERT |
| | `UpdateTables<T>` | Tipo para UPDATE |
| **audit.ts** | `AuditEntry` | Log de auditoria |
| | `AuditActionType` | Tipos de ação (20+) |
| | `AuditCategory` | Categorias |
| **evidence.ts** | `EvidenceChain` | Cadeia de evidência |
| | `EvidenceBoundingBox` | Box no documento |
| | `EvidenceItem` | Item de evidência |

---

## Padrões Comuns

### Pattern 1: Buscar com Type Safety

```typescript
// ❌ Sem segurança
const data = await supabase.from('people').select('*')

// ✅ Com type safety
const data = await supabase
  .from('people')
  .select('*') as { data: Tables<'people'>[] }

// ✅ Melhor ainda (usar select específico)
const data = await supabase
  .from('people')
  .select('id, full_name, cpf, confidence')
  .eq('case_id', caseId) as { data: Tables<'people'>[] }
```

### Pattern 2: Inserir com Defaults

```typescript
// InsertTables já exclui id e timestamps obrigatórios
const insert: InsertTables<'people'> = {
  case_id: caseId,
  full_name: 'João Silva',
  cpf: '123.456.789-00',
  confidence: 0.95,
  source_docs: [docId],
  metadata: {}
  // id, created_at, updated_at são opcionais/auto
}

const { data } = await supabase
  .from('people')
  .insert(insert)
  .select()
  .single() as { data: Tables<'people'> }
```

### Pattern 3: Atualizar Parcial

```typescript
// UpdateTables faz todos os campos opcionais
const update: UpdateTables<'people'> = {
  full_name: 'João Silva dos Santos'
  // Outros campos não são tocados
}

await supabase
  .from('people')
  .update(update)
  .eq('id', personId)
```

### Pattern 4: Garantir Organização (RLS)

```typescript
// Sempre filtrar por organization_id
const data = await supabase
  .from('cases')
  .select('*')
  .eq('organization_id', appUser.organization_id)
  .eq('id', caseId)
  .single() as { data: Tables<'cases'> }
```

### Pattern 5: Validar Role

```typescript
const { appUser } = useAuth()

const canDelete = appUser?.role === 'admin' || appUser?.role === 'supervisor'

if (!canDelete) {
  showError('Você não tem permissão para deletar')
  return
}
```

---

## Dados vs. Tipos

```
┌─────────────────────────────────────────────────────────┐
│ Supabase PostgreSQL Database (Realidade)                │
│ - Constraints SQL                                       │
│ - Triggers e Functions                                  │
│ - RLS Policies                                          │
│ - Índices                                               │
└─────────────────────────────────────────────────────────┘
                          ↓
        supabase gen types typescript
                          ↓
┌─────────────────────────────────────────────────────────┐
│ src/types/database.ts (Gerado)                          │
│ - Tables<'people'> → type-safe SELECT                   │
│ - InsertTables<'people'> → type-safe INSERT             │
│ - UpdateTables<'people'> → type-safe UPDATE             │
└─────────────────────────────────────────────────────────┘
                          ↑
                    Espelha schema
                          ↓
┌─────────────────────────────────────────────────────────┐
│ src/types/index.ts (Source of Truth)                    │
│ - Person interface definida manualmente                 │
│ - database.ts importa de index.ts                       │
│ - Documentação e comentários                            │
└─────────────────────────────────────────────────────────┘
```

---

## Comandos Úteis

```bash
# Regenerar tipos do banco
npm run generate-types

# Ou manualmente
supabase gen types typescript --project-id kllcbgoqtxedlfbkxpfo > src/types/database.ts

# Verificar tipos
npm run typecheck

# Build com type checking
npm run build
```

---

## Checklists de Implementação

### Ao Adicionar Nova Entidade

- [ ] Criar tabela no Supabase
- [ ] Criar tipo em `src/types/index.ts`
- [ ] Rodar `npm run generate-types`
- [ ] Verificar novo tipo em `src/types/database.ts`
- [ ] Importar em componentes via `import type { ... } from '@/types'`
- [ ] Usar `Tables<'table_name'>` nas queries
- [ ] Adicionar RLS policy se necessário
- [ ] Adicionar AuditEntry para operações principais

### Ao Modificar Type Guard

- [ ] Atualizar interface em `index.ts`
- [ ] Rodar `npm run generate-types`
- [ ] Atualizar componentes que usam o tipo
- [ ] Rodar `npm run typecheck`

### Ao Adicionar Novo Role/Permission

- [ ] Atualizar `role: '...'` union type em `User`
- [ ] Adicionar RLS policy correspondente no Supabase
- [ ] Atualizar componentes com `useAuth().appUser.role`
- [ ] Atualizar ProtectedRoute se necessário
- [ ] Adicionar AuditCategory se necessário

---

## Debugging

### Ver Tipos em Arquivo

```bash
# VSCode: Ir para Definition (F12)
# Vai mostrar o tipo exato da variável

# Ou inspecionar no hover
interface Person {
  id: string  // ← passar mouse aqui
  // ...
}
```

### Type Errors Comuns

```typescript
// ❌ Erro: Property 'full_name' does not exist on type 'User'
const name = person.full_name // se person é User (Supabase Auth)

// ✅ Correto: User é AppUser
const appUser = useAuth().appUser
const name = appUser?.full_name

// ❌ Erro: Object is of type 'unknown'
const data = extraction.llm_result.extracted_data.some_field

// ✅ Correto: type assertion ou guarding
const data = (extraction.llm_result?.extracted_data as Record<string, any>)?.some_field
```

### Verificar Type Safety

```bash
# Rodar sem emit (apenas check)
npm run typecheck

# Ou no build
npm run build
```

---

## Relação com CLAUDE.md

No arquivo `CLAUDE.md` do projeto está documentado:

> "**Canonical data model:** The graph (people + properties + edges) is the source of truth; drafts are rendered from it"

Isso significa:
1. `Case.canonical_data: CanonicalData` é o estado único
2. `Person[]`, `Property[]`, `GraphEdge[]` devem estar em sincronia
3. `Draft` é gerado a partir desses dados, não ao contrário
4. Edições no draft não devem alterar canonical_data diretamente

---

## Links Rápidos

- Arquivo completo: `src/types/index.ts` (726 linhas)
- Tipos de banco: `src/types/database.ts` (gerado)
- Auditoria: `src/types/audit.ts` (184 linhas)
- Evidência: `src/types/evidence.ts` (559 linhas)
- Hook de auth: `src/hooks/useAuth.tsx` (140+ linhas)
- Documentação visual: `TIPOS_DIAGRAMA_VISUAL.md`
- Documentação detalhada: `ESTRUTURA_TIPOS_TYPESCRIPT.md`

---

## Dúvidas Frequentes

**P: Qual a diferença entre `User` e `AppUser`?**
R: `User` é do Supabase Auth (criptografado, gerenciado por Supabase). `AppUser` é o nosso tipo `User` na tabela local com `role` e `organization_id`.

**P: Como regenerar tipos?**
R: `npm run generate-types` - regenera `src/types/database.ts` a partir do schema Supabase.

**P: Posso editar manualmente `database.ts`?**
R: Não, será sobrescrito na próxima geração. Use `src/types/index.ts` como source of truth.

**P: Como validar que estou usando tipos corretamente?**
R: Rode `npm run typecheck` - faz type checking sem compilar.

**P: Preciso de uma entidade rastreável?**
R: Use `Evidence` - liga extração ao entity com documento + página + bounding box.

**P: Como merging de pessoas funciona?**
R: `MergeSuggestion` propõe merge → usuário aprova → `Person.metadata.MergeMetadata` armazena histórico.

---

Este é seu quick reference! Para detalhes completos, consulte `ESTRUTURA_TIPOS_TYPESCRIPT.md` ou `TIPOS_DIAGRAMA_VISUAL.md`.
