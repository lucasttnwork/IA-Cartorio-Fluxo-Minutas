# Índice Completo - Documentação de Tipos TypeScript

## Visão Geral

Esta documentação explora completamente a estrutura de tipos TypeScript do projeto **Minuta Canvas**, um sistema de processamento de documentos e geração de rascunhos legais para cartórios brasileiros.

**Data de Criação:** 2024-12-25
**Versão:** 1.0

---

## Documentos Criados

### 1. **ESTRUTURA_TIPOS_TYPESCRIPT.md** ⭐ COMECE AQUI
Documento principal e mais completo sobre a organização de tipos.

**Conteúdo:**
- Visão geral dos 5 arquivos de tipos
- Estrutura completa em categorias
- Tipos relacionados a usuários (User, Organization)
- Tipos relacionados a autenticação (AuthContextType)
- Tipos de organização
- Como os tipos do banco são gerados (`npm run generate-types`)
- Convenções adotadas no projeto
- Tabela de referência de arquivos

**Quando usar:** Primeira leitura, entender a estrutura geral.

---

### 2. **TIPOS_DIAGRAMA_VISUAL.md** 📊 VISUALIZAÇÃO
Diagramas ASCII e hierarquias de tipos para melhor compreensão visual.

**Conteúdo:**
- Hierarquia de tipos raiz
- Modelo canônico completo (CanonicalData)
- Fluxo de documentos e processamento
- Pipeline de jobs sequencial
- Tipos de conflito e merge
- Tipos de rascunho e chat
- Canvas/React Flow
- Tipos de auditoria
- Tipos de evidência visual
- Mapa completo de relações (referenciais)
- Resumo de tabelas Supabase

**Quando usar:** Quando precisar entender relacionamentos e hierarquias visuais.

---

### 3. **TIPOS_AUTENTICACAO_ORGANIZACAO.md** 🔐 DEEP DIVE
Documentação detalhada sobre autenticação e organização multitenante.

**Conteúdo:**
- Estrutura de autenticação em 2 níveis
- User (Supabase Auth) vs AppUser (local)
- Session e JWT tokens
- Fluxo completo de autenticação
- Sign Up, Sign In, Sign Out
- Password Reset flow
- Structure de Organization (cartório)
- Papéis (Admin, Supervisor, Clerk)
- RLS (Row Level Security)
- Sincronização User vs AppUser
- Implementação em componentes
- Casos de uso comuns
- Segurança

**Quando usar:** Implementar funcionalidades de auth, entender multi-tenancy, trabalhar com papéis.

---

### 4. **TIPOS_REFERENCIA_RAPIDA.md** ⚡ QUICK LOOKUP
Referência compacta para uso durante desenvolvimento.

**Conteúdo:**
- TL;DR estrutura básica
- Imports mais usados
- Como usar cada tipo
- Tipos por arquivo
- Padrões comuns
- Dados vs Tipos
- Comandos úteis
- Checklists de implementação
- Debugging
- Dúvidas frequentes

**Quando usar:** Durante codificação, consulta rápida, procurando exemplos.

---

## Mapa Mental - Como Tudo Se Conecta

```
┌─────────────────────────────────────────────────────────┐
│         MINUTA CANVAS TIPO SYSTEM                       │
└─────────────────────────────────────────────────────────┘

CAMADA 1: ORGANIZAÇÃO
├─ Organization (Cartório)
├─ User (Supabase Auth)
└─ AppUser (User com role)
    └─ Leia: TIPOS_AUTENTICACAO_ORGANIZACAO.md

CAMADA 2: CASOS E DOCUMENTOS
├─ Case (Entidade Central)
├─ Document
└─ DocumentType
    └─ Leia: TIPOS_DIAGRAMA_VISUAL.md (seção "Fluxo de Documentos")

CAMADA 3: PROCESSAMENTO
├─ ProcessingJob (ocr → extraction → consensus → entity_resolution → draft)
├─ Extraction
├─ OcrResult
├─ LlmResult
├─ ConsensusResult
└─ ConflictField
    └─ Leia: ESTRUTURA_TIPOS_TYPESCRIPT.md (seção "Tipos de Conflito")

CAMADA 4: DADOS RESOLVIDOS
├─ CanonicalData (Dados consolidados)
├─ Person (Pessoa extraída)
├─ Property (Propriedade extraída)
├─ GraphEdge (Relacionamento)
├─ Evidence (Rastreabilidade)
└─ MergeSuggestion (Deduplicação)
    └─ Leia: TIPOS_DIAGRAMA_VISUAL.md (seção "Modelo Canônico")

CAMADA 5: RASCUNHO LEGAL
├─ Draft
├─ DraftSection
├─ ChatSession
├─ ChatMessage
└─ ChatOperation
    └─ Leia: TIPOS_DIAGRAMA_VISUAL.md (seção "Rascunho e Chat")

CAMADA 6: AUDITORIA
├─ AuditEntry
├─ AuditActionType
└─ OperationsLog
    └─ Leia: TIPOS_DIAGRAMA_VISUAL.md (seção "Auditoria")

CAMADA 7: VISUALIZAÇÃO
├─ CanvasNode (React Flow)
├─ CanvasEdge
├─ CanvasPresence (Realtime)
├─ EvidenceChain
└─ EvidenceBoundingBox
    └─ Leia: TIPOS_DIAGRAMA_VISUAL.md (seção "Canvas e Evidência Visual")

IMPLEMENTAÇÃO:
├─ src/types/index.ts (726 linhas - tipos principais)
├─ src/types/database.ts (gerado via npm run generate-types)
├─ src/types/audit.ts (tipos de auditoria)
├─ src/types/evidence.ts (tipos de visualização)
└─ src/hooks/useAuth.tsx (autenticação)
    └─ Leia: TIPOS_AUTENTICACAO_ORGANIZACAO.md
```

---

## Navegação por Caso de Uso

### 🔐 Preciso entender Autenticação

1. Comece com: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Como Usar - 4. Usar Authentication"
2. Depois leia: **TIPOS_AUTENTICACAO_ORGANIZACAO.md** (documento inteiro)
3. Consulte: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos Relacionados a Autenticação"
4. Veja exemplos: **TIPOS_DIAGRAMA_VISUAL.md** → Nenhuma (auth não tem diagrama visual)

---

### 🏢 Preciso entender Organização Multitenante

1. Comece com: **TIPOS_AUTENTICACAO_ORGANIZACAO.md** → Seção "Estrutura de Organização"
2. Depois leia: **TIPOS_AUTENTICACAO_ORGANIZACAO.md** → Seção "Papéis (Roles)" e "RLS"
3. Consulte: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos Relacionados a Organização"
4. Veja implementação: **TIPOS_AUTENTICACAO_ORGANIZACAO.md** → Seção "Implementação em Componentes"

---

### 📄 Preciso entender o Fluxo de Documentos

1. Comece com: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Fluxo de Documentos e Processamento"
2. Depois leia: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Pipeline de Processamento"
3. Consulte: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos de Extração"
4. Referência rápida: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Padrão 1"

---

### 🎯 Preciso entender Dados Canônicos

1. Comece com: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Modelo Canônico"
2. Depois leia: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos Especiais - Dados Canônicos"
3. Consulte: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Como Usar - 2. Buscar Case com Canonical Data"
4. Aprofunde: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Exemplo de Uso de Tipos"

---

### ⚔️ Preciso entender Conflitos e Merges

1. Comece com: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Tipos de Conflito e Merge"
2. Depois leia: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos de Conflito e Resolução"
3. Aprofunde: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos de Merge e Deduplicação"
4. Referência: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "TL;DR"

---

### 📝 Preciso entender Rascunhos Legais

1. Comece com: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Tipos de Rascunho e Chat"
2. Depois leia: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Não há seção específica, está em index.ts
3. Consulte: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "TL;DR"

---

### 👁️ Preciso entender Visualização de Evidência

1. Comece com: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Tipos de Evidência Visual"
2. Depois leia: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos de Evidência Visual"
3. Aprofunde: **src/types/evidence.ts** (arquivo direto - 559 linhas)

---

### 🕐 Preciso entender Auditoria

1. Comece com: **TIPOS_DIAGRAMA_VISUAL.md** → Seção "Tipos de Auditoria"
2. Depois leia: **ESTRUTURA_TIPOS_TYPESCRIPT.md** → Seção "Tipos de Auditoria"
3. Aprofunde: **src/types/audit.ts** (arquivo direto - 184 linhas)

---

### 🔧 Preciso usar Types com Segurança

1. Comece com: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Padrões Comuns"
2. Depois leia: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Dados vs Tipos"
3. Consulte: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Debugging"
4. Referência: **TIPOS_REFERENCIA_RAPIDA.md** → Seção "Type Errors Comuns"

---

## Fluxo de Dados End-to-End

```
USER UPLOADS DOCUMENT
    │
    └─→ Document criado
        │
        ├─→ ProcessingJob (OCR)
        │   └─→ OcrResult (Google Document AI)
        │       └─→ Extraction.ocr_result
        │
        ├─→ ProcessingJob (Extraction)
        │   └─→ LlmResult (Gemini)
        │       └─→ Extraction.llm_result
        │
        ├─→ ProcessingJob (Consensus)
        │   ├─→ ConsensusResult
        │   ├─→ ConflictField[] (se houver conflitos)
        │   └─→ Extraction.consensus
        │
        ├─→ ProcessingJob (Entity Resolution)
        │   ├─→ Person[] criadas/atualizadas
        │   ├─→ Property[] criadas/atualizadas
        │   ├─→ MergeSuggestion[] se duplicatas
        │   └─→ CanonicalData.people/properties
        │
        └─→ ProcessingJob (Draft)
            ├─→ Draft criado
            ├─→ ChatSession criada
            └─→ Draft.content gerado de CanonicalData

TIMELINE COMPLETA:
Document → Extraction → Person/Property → Evidence → CanonicalData → Draft → Chat

Leia para entender fluxo completo:
  1. TIPOS_DIAGRAMA_VISUAL.md → Seção "Fluxo de Documentos"
  2. TIPOS_DIAGRAMA_VISUAL.md → Seção "Pipeline de Processamento"
  3. ESTRUTURA_TIPOS_TYPESCRIPT.md → Seção "Tipos de Banco são Gerados"
```

---

## Mapa de Arquivos de Tipos

```
src/types/
│
├─ index.ts (726 linhas) ⭐ PRINCIPAL
│  ├─ Interfaces de banco (Organization, User, Case, Document, etc)
│  ├─ Tipos de extração (Extraction, OcrResult, LlmResult, etc)
│  ├─ Tipos de canvas (CanvasNode, CanvasEdge)
│  ├─ Tipos de auditoria (mas veja audit.ts para completo)
│  ├─ Tipos de evidência (mas veja evidence.ts para completo)
│  └─ Tipos de API (ApiResponse, ApiError)
│
├─ database.ts (175 linhas) 🤖 GERADO
│  ├─ Importa tipos de index.ts
│  ├─ Define Database interface com Tables
│  ├─ Tipos Row/Insert/Update para cada tabela
│  └─ Helper generics (Tables<T>, InsertTables<T>, UpdateTables<T>)
│
├─ database.generated.ts (backup)
│  └─ Cópia anterior de database.ts
│
├─ audit.ts (184 linhas) 🎯 AUDITORIA
│  ├─ AuditEntry (interface principal)
│  ├─ AuditActionType (20+ tipos de ação)
│  ├─ AuditCategory
│  ├─ AuditEvidence
│  ├─ FieldChangeEvidence
│  ├─ AuditFilters
│  ├─ AuditSummary
│  └─ AuditTrailState (para store)
│
└─ evidence.ts (559 linhas) 👁️ VISUALIZAÇÃO
   ├─ EvidenceBoundingBox
   ├─ HighlightBoxState/Style
   ├─ EvidenceItem
   ├─ EvidenceModalConfig/State
   ├─ EvidenceChain (tipo principal)
   ├─ EvidenceChainNode/Link
   ├─ Default configs e funções utilitárias
   └─ Props types para componentes
```

---

## Geração de Tipos (npm run generate-types)

```
Supabase PostgreSQL (schema real)
    ↓
    supabase gen types typescript
    ↓
src/types/database.ts (GERADO)
    ├─ Database interface
    ├─ Tables<'users'>
    ├─ InsertTables<'users'>
    ├─ UpdateTables<'users'>
    ├─ Tables<'cases'>
    ├─ ... (todas as 15+ tabelas)
    └─ Helper generics

Importa de:
    ← src/types/index.ts (tipos principais)

Usado em:
    → Componentes React (select, insert, update)
    → Worker service
    → Edge Functions
```

**Documentação:** ESTRUTURA_TIPOS_TYPESCRIPT.md → Seção "Como os Tipos do Banco são Gerados"

---

## Convenções Importantes

| Convenção | Exemplos | Documentação |
|-----------|----------|--------------|
| **Singular para entidades** | `Person`, `Property`, `Organization` | ESTRUTURA_TIPOS_TYPESCRIPT.md |
| **Plural para arrays** | `people: Person[]`, `properties: Property[]` | ESTRUTURA_TIPOS_TYPESCRIPT.md |
| **Timestamps ISO strings** | `created_at: string`, `updated_at: string` | ESTRUTURA_TIPOS_TYPESCRIPT.md |
| **Nullable com \| null** | `cpf: string \| null` (não `cpf?: string`) | ESTRUTURA_TIPOS_TYPESCRIPT.md |
| **Union types para enums** | `type ActType = 'purchase_sale' \| 'donation'` | TIPOS_REFERENCIA_RAPIDA.md |
| **Record para JSON flexível** | `settings: Record<string, unknown>` | ESTRUTURA_TIPOS_TYPESCRIPT.md |
| **Metadata para histórico** | `metadata: Record<string, unknown>` | ESTRUTURA_TIPOS_TYPESCRIPT.md |

---

## Comandos Úteis (npm scripts)

```bash
# Regenerar tipos do banco de dados
npm run generate-types

# Fazer type checking sem compilar
npm run typecheck

# Build com type checking incluído
npm run build

# Iniciar desenvolvimento
npm run dev
```

**Documentação:** TIPOS_REFERENCIA_RAPIDA.md → Seção "Comandos Úteis"

---

## Checklist Para Novos Desenvolvedores

- [ ] Ler `ESTRUTURA_TIPOS_TYPESCRIPT.md` (visão geral)
- [ ] Ler `TIPOS_DIAGRAMA_VISUAL.md` (entender relacionamentos)
- [ ] Ler `TIPOS_AUTENTICACAO_ORGANIZACAO.md` (se trabalhar com auth)
- [ ] Bookmarcar `TIPOS_REFERENCIA_RAPIDA.md` (para consultá-lo frequentemente)
- [ ] Abrir `src/types/index.ts` e ler comentários
- [ ] Testar: `npm run typecheck` com sucesso
- [ ] Entender padrão: `import type { ... } from '@/types'`
- [ ] Entender padrão: `InsertTables<'table'>`, `Tables<'table'>`
- [ ] Entender fluxo: Document → Job → Extraction → Person → Draft
- [ ] Entender multi-tenancy: `organization_id` em todas as tabelas

---

## FAQ Rápido

**P: Qual arquivo ler primeiro?**
R: `ESTRUTURA_TIPOS_TYPESCRIPT.md`

**P: Quero diagramas visuais**
R: `TIPOS_DIAGRAMA_VISUAL.md`

**P: Estou codificando e preciso de exemplo rápido**
R: `TIPOS_REFERENCIA_RAPIDA.md`

**P: Preciso entender autenticação**
R: `TIPOS_AUTENTICACAO_ORGANIZACAO.md`

**P: Como regenerar tipos?**
R: `npm run generate-types`

**P: Qual é a diferença entre User e AppUser?**
R: `TIPOS_AUTENTICACAO_ORGANIZACAO.md` → Seção "Tipos Principais"

**P: Como fazer query type-safe?**
R: `TIPOS_REFERENCIA_RAPIDA.md` → Seção "Padrões Comuns"

---

## Versioning

| Versão | Data | Alterações |
|--------|------|-----------|
| 1.0 | 2024-12-25 | Documentação inicial completa |

---

## Contribuindo com Documentação

Quando adicionar novos tipos:

1. Adicionar interface em `src/types/index.ts`
2. Rodar `npm run generate-types`
3. Atualizar seção apropriada em `ESTRUTURA_TIPOS_TYPESCRIPT.md`
4. Adicionar diagrama em `TIPOS_DIAGRAMA_VISUAL.md` se apropriado
5. Adicionar exemplo em `TIPOS_REFERENCIA_RAPIDA.md`
6. Rodar `npm run typecheck` para verificar

---

## Sumário Executivo

**Minuta Canvas** usa um sistema de tipos TypeScript robusto com:
- **5 arquivos de tipos** organizados por responsabilidade
- **Tipos gerados automaticamente** a partir do schema Supabase
- **2 níveis de autenticação**: Supabase Auth + modelo local
- **Multi-tenancy** com `organization_id` em todas as tabelas
- **Dados canônicos** em `Case.canonical_data` como fonte única de verdade
- **Pipeline sequencial** de 5 jobs (OCR → Extraction → Consensus → Entity Resolution → Draft)
- **Rastreabilidade completa** via `Evidence` records
- **Auditoria imutável** via `AuditEntry`

Esta documentação fornece:
1. **Visão estrutural** - Como tipos estão organizados
2. **Visão visual** - Diagramas e relacionamentos
3. **Visão prática** - Exemplos de código
4. **Visão detalhada** - Autenticação e multi-tenancy
5. **Referência rápida** - Para uso durante desenvolvimento

**Total de documentação:** ~4 documentos + este índice = guia completo.

---

## Próximos Passos

1. **Já programando?** → `TIPOS_REFERENCIA_RAPIDA.md`
2. **Novo no projeto?** → Comece com `ESTRUTURA_TIPOS_TYPESCRIPT.md`
3. **Duvida visual?** → `TIPOS_DIAGRAMA_VISUAL.md`
4. **Trabalhando com auth?** → `TIPOS_AUTENTICACAO_ORGANIZACAO.md`
5. **Precisa de mais?** → Consulte `src/types/*.ts` direto

---

**Última atualização:** 2024-12-25
**Documentação de Tipos TypeScript v1.0**
