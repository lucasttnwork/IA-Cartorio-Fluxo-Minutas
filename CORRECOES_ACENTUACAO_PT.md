# Correções Necessárias: Acentuação em Português

## Resumo
Identificadas **7 erros de digitação/acentuação** em strings em português que já existem no código.
Estas devem ser corrigidas antes da implementação de i18n.

---

## Lista de Correções Necessárias

### 1. PurchaseSaleFlowPage.tsx - "Extracao" → "Extração"

**Arquivo:** `src/pages/PurchaseSaleFlowPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 353 | Pronto para iniciar a extracao | Pronto para iniciar a extração | Message |
| 360 | Iniciar Extracao | Iniciar Extração | Button |

**Buscar/Substituir:**
```
extracao → extração (case-insensitive)
Extracao → Extração
EXTRACAO → EXTRAÇÃO
```

---

### 2. PurchaseSaleFlowPage.tsx - "Imovel" → "Imóvel"

**Arquivo:** `src/pages/PurchaseSaleFlowPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 383 | Imovel(is) encontrado(s) | Imóvel(is) encontrado(s) | Label |
| 422 | Imoveis | Imóveis | Section Title |
| 434 | Matricula nao identificada | Matrícula não identificada | Default text |
| 497 | Imoveis | Imóveis | Summary Label |

**Buscar/Substituir:**
```
Imovel → Imóvel
Imoveis → Imóveis
imovel → imóvel
imoveis → imóveis
```

---

### 3. PurchaseSaleFlowPage.tsx - "Endereco" → "Endereço"

**Arquivo:** `src/pages/PurchaseSaleFlowPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 439 | Endereco nao informado | Endereço não informado | Default text |

**Buscar/Substituir:**
```
Endereco → Endereço
endereco → endereço
ENDERECO → ENDEREÇO
```

---

### 4. PurchaseSaleFlowPage.tsx - "nao" → "não"

**Arquivo:** `src/pages/PurchaseSaleFlowPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 406 | CPF nao informado | CPF não informado | Label |
| 434 | Matricula nao identificada | Matrícula não identificada | Default text |
| 439 | Endereco nao informado | Endereço não informado | Default text |

**Buscar/Substituir:**
```
nao → não
Nao → Não
NAO → NÃO
```

---

### 5. PurchaseSaleFlowPage.tsx - "Concluido" → "Concluído"

**Arquivo:** `src/pages/PurchaseSaleFlowPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 787 | Fluxo Concluido! | Fluxo Concluído! | Completion Title |

**Buscar/Substituir:**
```
Concluido → Concluído
concluido → concluído
CONCLUIDO → CONCLUÍDO
```

---

### 6. EntitiesPage.tsx - "Disponiveis" → "Disponíveis"

**Arquivo:** `src/pages/EntitiesPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 543 | Documentos Disponiveis | Documentos Disponíveis | Card Title |

**Buscar/Substituir:**
```
Disponiveis → Disponíveis
disponiveis → disponíveis
DISPONIVEIS → DISPONÍVEIS
```

---

### 7. EntitiesPage.tsx - "Faca" → "Faça" + "extraidas" → "extraídas"

**Arquivo:** `src/pages/EntitiesPage.tsx`

| Linha | Texto Atual | Texto Correto | Contexto |
|-------|------------|-----------------|---------|
| 344 | Entidades Extraidas | Entidades Extraídas | Page Title |
| 347 | Visualize e gerencie as entidades extraidas... | Visualize e gerencie as entidades extraídas... | Subtitle |
| 516 | Faca upload de documentos primeiro... | Faça upload de documentos primeiro... | Empty State |

**Buscar/Substituir:**
```
Faca → Faça
faca → faça
FACA → FAÇA

extraidas → extraídas
Extraidas → Extraídas
EXTRAIDAS → EXTRAÍDAS
```

---

## Tabela de Substituição Consolidada

Para usar em busca/substituição em massa:

```
extracao → extração
Extracao → Extração
Imovel → Imóvel
Imoveis → Imóveis
imovel → imóvel
imoveis → imóveis
Endereco → Endereço
endereco → endereço
nao → não
Nao → Não
Concluido → Concluído
concluido → concluído
Disponiveis → Disponíveis
disponiveis → disponíveis
Faca → Faça
faca → faça
extraidas → extraídas
Extraidas → Extraídas
```

---

## Procedimento de Correção

### Opção 1: VSCode Find and Replace (Recomendado)

1. Abrir **Find and Replace** (`Ctrl+H` / `Cmd+H`)
2. Para cada linha acima:
   - Cole o texto "Atual" no campo "Find"
   - Cole o texto "Correto" no campo "Replace"
   - Clique "Replace All" (ou "Replace" individual se preferir revisar)

3. Termos a procurar especificamente:
   ```
   Find: extracao
   Replace: extração

   Find: Extracao
   Replace: Extração

   Find: Imovel
   Replace: Imóvel

   Find: Imoveis
   Replace: Imóveis

   ... (e assim por diante)
   ```

### Opção 2: Script de Substituição

Executar script em bash:
```bash
# Para um único arquivo
sed -i 's/extracao/extração/g' src/pages/PurchaseSaleFlowPage.tsx
sed -i 's/Extracao/Extração/g' src/pages/PurchaseSaleFlowPage.tsx
sed -i 's/Imovel/Imóvel/g' src/pages/PurchaseSaleFlowPage.tsx
sed -i 's/Imoveis/Imóveis/g' src/pages/PurchaseSaleFlowPage.tsx
sed -i 's/Endereco/Endereço/g' src/pages/PurchaseSaleFlowPage.tsx
sed -i 's/nao /não /g' src/pages/PurchaseSaleFlowPage.tsx
sed -i 's/Concluido/Concluído/g' src/pages/PurchaseSaleFlowPage.tsx

# Para EntitiesPage
sed -i 's/Disponiveis/Disponíveis/g' src/pages/EntitiesPage.tsx
sed -i 's/Faca /Faça /g' src/pages/EntitiesPage.tsx
sed -i 's/extraidas/extraídas/g' src/pages/EntitiesPage.tsx
sed -i 's/Extraidas/Extraídas/g' src/pages/EntitiesPage.tsx
```

### Opção 3: Manualmente (Se preferir revisar linha por linha)

1. Abrir cada arquivo mencionado
2. Navegar até as linhas indicadas
3. Fazer as correções manualmente
4. Salvar cada arquivo

---

## Checklist de Validação

Após fazer as correções, validar:

- [ ] Todas as 7 correções foram aplicadas
- [ ] Código compila sem erros
- [ ] Git diff mostra apenas as mudanças de acentuação esperadas
- [ ] Não há quebra de funcionalidade
- [ ] Strings visualmente corretas

### Validação Visual

Para cada arquivo, fazer grep e verificar:

```bash
# Verificar se "extracao" ainda existe
grep -n "extracao" src/pages/PurchaseSaleFlowPage.tsx
# Resultado esperado: (empty/nenhum resultado)

# Verificar se "extração" agora existe
grep -n "extração" src/pages/PurchaseSaleFlowPage.tsx
# Resultado esperado: 2 ocorrências encontradas
```

---

## Impacto das Correções

### Sem Impacto em Funcionalidade
✓ Estas são correções puramente de ortografia
✓ Não afetam lógica de código ou tipos TypeScript
✓ Apenas o texto exibido ao usuário muda

### Impacto em Testes
⚠️ Se houver testes que verificam strings exatas, será necessário atualizar:
```typescript
// Antes
expect(screen.getByText('Imovel')).toBeInTheDocument()

// Depois
expect(screen.getByText('Imóvel')).toBeInTheDocument()
```

### Impacto em i18n
✓ Estas correções devem ser feitas ANTES de implementar i18n
✓ Depois, usar as versões corrigidas como base para as chaves de tradução

---

## Cronograma Recomendado

**Pré-i18n (Imediato - Hoje):**
- [ ] Aplicar todas as 7 correções de acentuação
- [ ] Testar que o app ainda funciona
- [ ] Fazer commit: "Fix: Portuguese accentuation in UI strings"

**Durante i18n Implementation (Próxima semana):**
- [ ] Usar as strings corrigidas como base para chaves i18n
- [ ] Criar arquivo locales/pt-BR/dashboard.json etc.
- [ ] Remover strings hardcoded e usar `t()` hooks

---

## Exemplos de Antes e Depois

### Exemplo 1: PurchaseSaleFlowPage.tsx linha 360

**Antes:**
```tsx
<Button onClick={onStartExtraction} className="mt-6">
  Iniciar Extracao
</Button>
```

**Depois:**
```tsx
<Button onClick={onStartExtraction} className="mt-6">
  Iniciar Extração
</Button>
```

### Exemplo 2: EntitiesPage.tsx linha 344

**Antes:**
```tsx
<h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
  <SparklesIcon className="w-7 h-7 text-purple-500" />
  Entidades Extraidas
</h1>
```

**Depois:**
```tsx
<h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
  <SparklesIcon className="w-7 h-7 text-purple-500" />
  Entidades Extraídas
</h1>
```

---

## Referência de Caracteres Acentuados

Para copy/paste se necessário:

| Caractere | Unicode | Descrição |
|-----------|---------|-----------|
| á | U+00E1 | a com acento agudo |
| é | U+00E9 | e com acento agudo |
| í | U+00ED | i com acento agudo |
| ó | U+00F3 | o com acento agudo |
| ú | U+00FA | u com acento agudo |
| à | U+00E0 | a com acento grave |
| ã | U+00E3 | a com til |
| õ | U+00F5 | o com til |
| ç | U+00E7 | c cedilha |
| ê | U+00EA | e com circunflexo |
| ô | U+00F4 | o com circunflexo |

---

## Próximas Etapas

1. **Hoje:** Aplicar todas as 7 correções
2. **Amanhã:** Revisar git diff e testar
3. **Próxima semana:** Começar implementação de i18n com strings corretas

---

**Gerado por:** Claude Code AI
**Data:** 2025-12-25
**Total de erros identificados:** 7 erros de acentuação
**Arquivos afetados:** 2 (PurchaseSaleFlowPage.tsx, EntitiesPage.tsx)
**Tempo estimado de correção:** 5-10 minutos
