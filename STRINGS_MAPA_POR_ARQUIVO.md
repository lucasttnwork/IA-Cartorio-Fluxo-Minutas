# Mapa Detalhado de Strings em Inglês por Arquivo

## Estrutura
- `src/stores/` - 0 strings críticas (apenas comentários em inglês)
- `src/hooks/` - 11 strings críticas em 10 arquivos

---

## 🔴 ARQUIVOS COM STRINGS CRÍTICAS

### 1. src/hooks/useAuth.tsx
**Criticidade:** CRÍTICA
**Strings em inglês:** 1
**Strings de console:** 1

```
Linha 141 | setError = { error: new Error('User not authenticated') }
          | Contexto: Erro ao atualizar perfil sem estar autenticado
          | Visibilidade: Usuário vê mensagem de erro
          | Tradução sugerida: 'Usuário não autenticado'

Linha 77  | console.error('Error fetching app user:', error)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Tela de atualização de perfil
**Prioridade:** Corrigir imediatamente

---

### 2. src/hooks/useCases.ts
**Criticidade:** CRÍTICA
**Strings em inglês:** 2
**Strings de console:** 8

```
Linha 180 | throw new Error('User not authenticated')
          | Contexto: Erro ao criar novo caso
          | Visibilidade: Usuário vê mensagem de erro
          | Tradução sugerida: 'Usuário não autenticado'

Linha 307 | throw new Error('User not authenticated')
          | Contexto: Erro ao duplicar caso existente
          | Visibilidade: Usuário vê mensagem de erro
          | Tradução sugerida: 'Usuário não autenticado'

Linhas 27, 105, 117, 148, 225, 262, 288, 318, 344:
          | console.error('Error fetching/creating/updating case:', error)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Tela de casos e criação/duplicação de casos
**Prioridade:** Corrigir imediatamente

---

### 3. src/hooks/useCanvasData.ts
**Criticidade:** CRÍTICA
**Strings em inglês:** 5
**Strings de console:** 1

```
Linha 62  | throw new Error(`Failed to fetch people: ${peopleResult.error.message}`)
          | Contexto: Erro ao carregar lista de pessoas
          | Visibilidade: Usuário vê em tela de canvas
          | Tradução sugerida: 'Falha ao carregar pessoas'

Linha 65  | throw new Error(`Failed to fetch properties: ${propertiesResult.error.message}`)
          | Contexto: Erro ao carregar lista de propriedades
          | Visibilidade: Usuário vê em tela de canvas
          | Tradução sugerida: 'Falha ao carregar imóveis'

Linha 68  | throw new Error(`Failed to fetch edges: ${edgesResult.error.message}`)
          | Contexto: Erro ao carregar relacionamentos
          | Visibilidade: Usuário vê em tela de canvas
          | Tradução sugerida: 'Falha ao carregar relacionamentos'

Linha 71  | throw new Error(`Failed to fetch documents: ${documentsResult.error.message}`)
          | Contexto: Erro ao carregar documentos
          | Visibilidade: Usuário vê em tela de canvas
          | Tradução sugerida: 'Falha ao carregar documentos'

Linha 82  | setError(err instanceof Error ? err.message : 'Failed to load canvas data')
          | Contexto: Erro genérico ao carregar dados do canvas
          | Visibilidade: Usuário vê em tela de canvas
          | Tradução sugerida: 'Falha ao carregar dados do canvas'

Linha 81  | console.error('Error loading canvas data:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Tela do Canvas (tela principal de trabalho)
**Prioridade:** CRÍTICA - Afeta experiência principal

---

### 4. src/hooks/useCaseDocuments.ts
**Criticidade:** CRÍTICA
**Strings em inglês:** 1
**Strings de console:** 1

```
Linha 37  | setError(err instanceof Error ? err : new Error('Failed to fetch documents'))
          | Contexto: Erro ao buscar documentos de um caso
          | Visibilidade: Usuário vê na seção de documentos
          | Tradução sugerida: 'Falha ao carregar documentos'

Linha 36  | console.error('Error fetching documents:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Tela de upload/gerenciamento de documentos
**Prioridade:** Corrigir imediatamente

---

### 5. src/hooks/useDocumentNames.ts
**Criticidade:** CRÍTICA
**Strings em inglês:** 1
**Strings de console:** 1

```
Linha 59  | setError(err instanceof Error ? err.message : 'Failed to fetch document names')
          | Contexto: Erro ao buscar nomes de documentos para chips de origem
          | Visibilidade: Usuário vê em cards de entidades
          | Tradução sugerida: 'Falha ao carregar nomes dos documentos'

Linha 58  | console.error('[useDocumentNames] Error fetching document names:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Exibição de origem de dados em cards de pessoas/propriedades
**Prioridade:** Corrigir imediatamente

---

### 6. src/hooks/useDocumentPreview.ts
**Criticidade:** MÉDIA
**Strings em inglês:** 0
**Strings de português com erro:** 2
**Strings de console:** 1

```
Linha 99  | setError('Nao foi possivel carregar o documento')
          | PROBLEMA: Falta acento (ã)
          | Versão correta: 'Não foi possível carregar o documento'
          | Contexto: Erro ao gerar URL assinada para preview
          | Visibilidade: Usuário vê em modal de preview

Linha 104 | setError(err instanceof Error ? err.message : 'Erro ao carregar documento')
          | Contexto: Erro genérico ao carregar documento
          | Visibilidade: Usuário pode ver erro técnico em inglês
          | Recomendação: Melhorar mensagem de erro padrão

Linha 103 | console.error('Error loading document URL:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Visualização de documentos no preview
**Prioridade:** Corrigir acentuação e melhorar mensagem

---

### 7. src/hooks/useImagePreview.ts
**Criticidade:** MÉDIA
**Strings em inglês:** 0
**Strings de português com erro:** 2
**Strings de console:** 2

```
Linha 90  | setError('Nao foi possivel carregar a imagem')
          | PROBLEMA: Falta acento (ã)
          | Versão correta: 'Não foi possível carregar a imagem'
          | Contexto: Erro ao gerar URL assinada para imagem
          | Visibilidade: Usuário vê em modal de preview

Linha 95  | setError(err instanceof Error ? err.message : 'Erro ao carregar imagem')
          | Contexto: Erro genérico ao carregar imagem
          | Visibilidade: Usuário pode ver erro técnico em inglês
          | Recomendação: Melhorar mensagem de erro padrão

Linhas 94, 197:
          | console.error('Error loading image/thumbnail URL:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Visualização de imagens em cards e previews
**Prioridade:** Corrigir acentuação

---

### 8. src/hooks/useDraftAutoSave.ts
**Criticidade:** MÉDIA
**Strings em inglês:** 0
**Strings em português:** 1 (com risco de erro)
**Strings de console:** 1

```
Linha 79  | setError(err instanceof Error ? err.message : 'Erro ao salvar')
          | Contexto: Erro ao auto-salvar rascunho
          | Problema: Mensagem genérica, pode mostrar erro técnico em inglês
          | Visibilidade: Usuário vê em tela de edição de minuta
          | Recomendação: Melhorar mensagem padrão

Linha 77  | console.error('Error saving draft:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Auto-save de rascunhos na tela de edição
**Prioridade:** Melhorar tratamento de erro

---

### 9. src/hooks/useEvidenceChain.ts
**Criticidade:** CRÍTICA
**Strings em inglês:** 1
**Strings de console:** 1

```
Linha 247 | setError(err instanceof Error ? err.message : 'Failed to fetch evidence chain')
          | Contexto: Erro ao buscar cadeia de evidências
          | Visibilidade: Usuário vê em modal de cadeia de evidências
          | Tradução sugerida: 'Falha ao carregar cadeia de evidências'

Linha 246 | console.error('Error fetching evidence chain:', err)
          | Tipo: console.error (desenvolvimento apenas)
```

**Impacto:** Visualização da rastreabilidade de dados (evidence chain)
**Prioridade:** Corrigir imediatamente

---

### 10. src/hooks/useDocumentProcessingStatus.ts
**Criticidade:** CRÍTICA
**Strings em inglês:** 1
**Strings em português:** 1 (correto)
**Strings de console:** 3

```
Linha 364 | error: err instanceof Error ? err : new Error('Unknown error')
          | Contexto: Erro genérico ao buscar status de processamento
          | Visibilidade: Usuário vê em modal de status
          | Tradução sugerida: 'Erro desconhecido'

Linha 185 | failed: 'Falha no processamento'
          | Contexto: Label de status de falha
          | Status: CORRETO - Já em português

Linhas 361, 459, 473:
          | console.error/log('Error fetching status:' / '[...] Subscribed:')
          | Tipo: console.error/log (desenvolvimento apenas)
```

**Impacto:** Exibição de status de processamento de documentos
**Prioridade:** Corrigir imediatamente

---

## 📦 ARQUIVOS SEM STRINGS CRÍTICAS (Apenas src/stores/)

### src/stores/auditStore.ts
**Status:** ✅ Sem strings em inglês para usuário
**Observação:** Todos os textos visíveis estão em português correto

### src/stores/caseStore.ts
**Status:** ✅ Sem strings em inglês para usuário
**Observação:** Arquivo apenas gerencia estado

### src/stores/flowStore.ts
**Status:** ✅ Sem strings em inglês para usuário
**Observação:** Todos os labels de fluxo estão em português (Criar Caso, Upload de Documentos, etc.)

---

## 📊 ESTATÍSTICAS POR TIPO

| Tipo | Quantidade | Arquivos |
|------|-----------|----------|
| Strings críticas em inglês | 11 | 9 |
| Strings com erro de acentuação | 2 | 2 |
| Console messages | 22+ | 15+ |
| Arquivos sem problemas | 3 | 3 |

---

## 🎯 ESTRATÉGIA DE CORREÇÃO

### Passo 1: Strings Críticas (2-3 horas)
1. useAuth.tsx:141 - 'User not authenticated'
2. useCases.ts:180,307 - 'User not authenticated'
3. useCanvasData.ts:62-71,82 - 5 strings de carregamento
4. useCaseDocuments.ts:37 - 'Failed to fetch documents'
5. useDocumentNames.ts:59 - 'Failed to fetch document names'
6. useEvidenceChain.ts:247 - 'Failed to fetch evidence chain'
7. useDocumentProcessingStatus.ts:364 - 'Unknown error'

### Passo 2: Correção de Acentuação (30 minutos)
1. useDocumentPreview.ts:99,104
2. useImagePreview.ts:90,95

### Passo 3: Melhorias de Mensagens (1 hora)
1. useDraftAutoSave.ts:79
2. Revisar todas as mensagens de erro padrão

### Passo 4: Console Messages (Opcional, 1 hora)
1. Considerar traduzir para português para suportar usuários

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar arquivo de strings/i18n
- [ ] Traduzir useAuth.tsx
- [ ] Traduzir useCases.ts
- [ ] Traduzir useCanvasData.ts
- [ ] Traduzir useCaseDocuments.ts
- [ ] Traduzir useDocumentNames.ts
- [ ] Corrigir useDocumentPreview.ts
- [ ] Corrigir useImagePreview.ts
- [ ] Melhorar useDraftAutoSave.ts
- [ ] Traduzir useEvidenceChain.ts
- [ ] Traduzir useDocumentProcessingStatus.ts
- [ ] Testar todas as mensagens de erro
- [ ] Atualizar documentação
- [ ] Implementar verificação de linter para strings em inglês

