# Relatório de Strings em Inglês - src/stores/ e src/hooks/

## Resumo Executivo
Encontradas **11 strings em inglês que aparecem para o usuário final**, localizadas em **9 arquivos de hooks**. Além disso, existem **22+ mensagens de console em inglês** (apenas para desenvolvimento/debug).

---

## 1. STRINGS VISÍVEIS PARA O USUÁRIO (ALTA PRIORIDADE)

### 1.1 useAuth.tsx
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useAuth.tsx`

| Linha | String | Contexto |
|-------|--------|---------|
| 141 | `'User not authenticated'` | Erro ao atualizar perfil sem autenticação |

**Status:** Visível para usuário quando tenta atualizar perfil sem estar autenticado

---

### 1.2 useCases.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useCases.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 180 | `'User not authenticated'` | Erro ao criar caso sem autenticação |
| 307 | `'User not authenticated'` | Erro ao duplicar caso sem autenticação |

**Status:** Visível para usuário ao tentar criar ou duplicar um caso

---

### 1.3 useCanvasData.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useCanvasData.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 62 | `'Failed to fetch people: ${error.message}'` | Erro ao carregar pessoas do canvas |
| 65 | `'Failed to fetch properties: ${error.message}'` | Erro ao carregar imóveis do canvas |
| 68 | `'Failed to fetch edges: ${error.message}'` | Erro ao carregar relacionamentos do canvas |
| 71 | `'Failed to fetch documents: ${error.message}'` | Erro ao carregar documentos do canvas |
| 82 | `'Failed to load canvas data'` | Mensagem genérica de erro ao carregar canvas |

**Status:** Visível para usuário na tela do canvas quando há falha ao carregar dados

---

### 1.4 useCaseDocuments.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useCaseDocuments.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 37 | `'Failed to fetch documents'` | Erro ao buscar documentos de um caso |

**Status:** Visível para usuário ao carregar lista de documentos

---

### 1.5 useDocumentNames.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useDocumentNames.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 59 | `'Failed to fetch document names'` | Erro ao buscar nomes dos documentos |

**Status:** Visível para usuário quando tenta visualizar nomes de documentos

---

### 1.6 useDocumentPreview.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useDocumentPreview.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 99 | `'Nao foi possivel carregar o documento'` | Erro ao gerar URL assinada para preview (PORTUGUÊS COM ACENTO FALTANDO) |
| 104 | `'Erro ao carregar documento'` | Erro genérico ao carregar URL (pode vir em inglês) |

**Status:** Parcialmente em português (com erro de digitação), mas pode mostrar erro técnico em inglês

---

### 1.7 useImagePreview.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useImagePreview.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 90 | `'Nao foi possivel carregar a imagem'` | Erro ao gerar URL assinada (PORTUGUÊS COM ACENTO FALTANDO) |
| 95 | `'Erro ao carregar imagem'` | Erro genérico ao carregar imagem (pode vir em inglês) |

**Status:** Parcialmente em português (com erro de digitação), mas pode mostrar erro técnico em inglês

---

### 1.8 useDraftAutoSave.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useDraftAutoSave.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 79 | `'Erro ao salvar'` | Erro genérico ao salvar rascunho (pode vir em inglês) |

**Status:** Português com risco de mostrar erro técnico em inglês

---

### 1.9 useEvidenceChain.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useEvidenceChain.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 247 | `'Failed to fetch evidence chain'` | Erro ao buscar cadeia de evidências |

**Status:** Visível para usuário quando tenta visualizar cadeia de evidências

---

### 1.10 useDocumentProcessingStatus.ts
**Localização:** `C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\IA-Cartório-Fluxo-Minutas\src\hooks\useDocumentProcessingStatus.ts`

| Linha | String | Contexto |
|-------|--------|---------|
| 364 | `'Unknown error'` | Erro genérico ao buscar status de processamento |
| 185 | `'Falha no processamento'` | Label de status (PORTUGUÊS CORRETO) |

**Status:** Mensagem genérica em inglês em situação de erro desconhecido

---

## 2. CONSOLE MESSAGES (BAIXA PRIORIDADE - Apenas para Desenvolvimento)

Encontradas 22+ mensagens de console.error e console.log em inglês que **NÃO aparecem para usuário final**:

### Por arquivo:

| Arquivo | Linhas | Mensagens | Tipo |
|---------|--------|-----------|------|
| useAuth.tsx | 77 | `'Error fetching app user:'` | console.error |
| useCanvasData.ts | 81 | `'Error loading canvas data:'` | console.error |
| useCanvasPresence.ts | 106, 109 | `'User joined/left canvas:'` | console.log |
| useCaseDocuments.ts | 36 | `'Error fetching documents:'` | console.error |
| useCases.ts | 27, 105, 117, 148, 225, 262, 288, 318, 344 | `'Error fetching/creating/updating/deleting case:'` | console.error |
| useChatHistory.ts | 51, 68, 77, 91, 169 | `'Error loading/saving/clearing chat history:'` | console.error |
| useDocumentNames.ts | 58 | `'Error fetching document names:'` | console.error |
| useDocumentPreview.ts | 103 | `'Error loading document URL:'` | console.error |
| useDocumentProcessingStatus.ts | 361, 459, 473 | `'Error fetching status:' / 'Subscribed/Unsubscribing:'` | console.error/log |
| useDocumentStatusSubscription.ts | 133, 140 | `'Subscribed/Unsubscribing from case:'` | console.log |
| useDraftAutoSave.ts | 77 | `'Error saving draft:'` | console.error |
| useEvidenceChain.ts | 246 | `'Error fetching evidence chain:'` | console.error |
| useImagePreview.ts | 94, 197 | `'Error loading image/thumbnail URL:'` | console.error |
| useProcessingJobsSubscription.ts | 304, 315, 318, 344, 353 | `'Error fetching/refreshing jobs:' / 'Loaded jobs:'` | console.error/log |
| useSessionTimeout.ts | 81 | `'Session expired due to inactivity'` | console.log |
| useUsers.ts | 27 | `'Error fetching users:'` | console.error |

---

## 3. CATEGORIZAÇÃO E PRIORIDADES

### CRÍTICA (Devem ser traduzidas IMEDIATAMENTE)
1. **useAuth.tsx:141** - `'User not authenticated'` - Autenticação
2. **useCases.ts:180,307** - `'User not authenticated'` - Autenticação
3. **useCanvasData.ts:62-71,82** - 5 strings sobre falhas ao carregar canvas
4. **useDocumentNames.ts:59** - `'Failed to fetch document names'`
5. **useEvidenceChain.ts:247** - `'Failed to fetch evidence chain'`
6. **useDocumentProcessingStatus.ts:364** - `'Unknown error'`

**Total: 11 strings em inglês visíveis**

### MÉDIA (Verificar e melhorar)
1. **useDocumentPreview.ts:99,104** - Português incompleto (falta acento) e risco de erro em inglês
2. **useImagePreview.ts:90,95** - Português incompleto (falta acento) e risco de erro em inglês
3. **useCaseDocuments.ts:37** - `'Failed to fetch documents'`
4. **useDraftAutoSave.ts:79** - Português com risco de erro em inglês

### BAIXA (Console apenas, não crítica)
- 22+ mensagens em inglês em console.error/console.log

---

## 4. PADRÃO RECOMENDADO DE TRADUÇÃO

### Mensagens de Erro de Rede/API
```
English:  'Failed to fetch X'
Portuguese: 'Falha ao carregar X' ou 'Não foi possível carregar X'

English: 'User not authenticated'
Portuguese: 'Usuário não autenticado'

English: 'Unknown error'
Portuguese: 'Erro desconhecido'
```

### Mensagens Genéricas
```
English: 'Error loading...'
Portuguese: 'Erro ao carregar...'

English: 'Error saving...'
Portuguese: 'Erro ao salvar...'
```

---

## 5. PRÓXIMOS PASSOS

1. **Fase 1 (Imediato):** Traduzir as 11 strings críticas (useAuth, useCases, useCanvasData, etc.)
2. **Fase 2 (Curto prazo):** Corrigir acentuação em português (useDocumentPreview, useImagePreview)
3. **Fase 3 (Opcional):** Considerar traduzir console.log para suportar usuários/suporte em português
4. **Fase 4 (Boas práticas):** Centralizar strings em arquivo de i18n (internacionalização)

---

## 6. ARQUIVOS IMPACTADOS (RESUMO)

- src/hooks/useAuth.tsx
- src/hooks/useCases.ts
- src/hooks/useCanvasData.ts
- src/hooks/useCaseDocuments.ts
- src/hooks/useDocumentNames.ts
- src/hooks/useDocumentPreview.ts
- src/hooks/useImagePreview.ts
- src/hooks/useDraftAutoSave.ts
- src/hooks/useEvidenceChain.ts
- src/hooks/useDocumentProcessingStatus.ts

**Total de arquivos impactados: 10**
**Total de strings em inglês para usuário: 11**
**Total de console messages em inglês: 22+**

