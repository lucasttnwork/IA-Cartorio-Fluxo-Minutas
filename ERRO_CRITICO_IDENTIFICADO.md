# 🚨 ERRO CRÍTICO IDENTIFICADO - Loop Infinito no PurchaseSaleFlowPage

## Status: BLOQUEANTE
**Data de Descoberta:** 25 de Dezembro de 2025
**Tipo:** React Infinite Update Loop
**Severidade:** 🔴 CRÍTICA

---

## O Que Não Está Funcionando

❌ **Criar Nova Minuta** - Clicando "Novo Caso" no dashboard
❌ **Continuar Minuta Existente** - Clicando "Continuar fluxo" em caso já criado
❌ **Acessar /purchase-sale-flow** - Qualquer navegação para esta rota

## Mensagem de Erro

```
Error: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState instead of passing an updated state to setState.

The above error occurred in the <PurchaseSaleFlowPage> component:
```

---

## Causa Raiz (Root Cause)

### Arquivo: `src/pages/PurchaseSaleFlowPage.tsx`
**Linhas:** 831-835

```typescript
// ❌ PROBLEMA: Este código cria um loop infinito
useEffect(() => {
  if (!flow.isActive) {
    flow.startFlow('purchase_sale')  // Esta função chama navigate()
  }
}, []) // ← Sem dependências! O alerta foi ignorado com eslint-disable
```

### Como o Loop Acontece

```
1. Página monta (em /purchase-sale-flow)
   ↓
2. useEffect roda e chama flow.startFlow()
   ↓
3. startFlow() chama navigate('/purchase-sale-flow')
   ↓
4. Navigate causa re-render
   ↓
5. Re-render faz useEffect rodar novamente
   ↓
6. Volta ao passo 2 → LOOP INFINITO ♻️
```

---

## Impacto nos Testes

### Testes E2E Automatizados (npm run test:regression)
```
Running 130 tests...
✗ T001: Create new case with title and act type
✗ T002: Filter cases by status
✗ T003: Search cases by title
✗ T004: Pagination works
✗ T005: Sort cases
✗ T009-T016: Document upload tests
... (todos falham por causa deste erro)
```

### Fluxo de Teste com Playwright MCP
```
✅ DASHBOARD CARREGA (pode listar casos)
❌ NOVO CASO (Error: Maximum update depth exceeded)
❌ CONTINUAR FLUXO (Error: Maximum update depth exceeded)
```

---

## Solução Rápida (5 minutos)

Arquivo: `src/pages/PurchaseSaleFlowPage.tsx`

### Antes (❌ Buggy):
```typescript
useEffect(() => {
  if (!flow.isActive) {
    flow.startFlow('purchase_sale')
  }
}, []) // ← PROBLEMA: sem dependências
```

### Depois (✅ Correto):
```typescript
const initRef = useRef(false)

useEffect(() => {
  if (!initRef.current && !flow.isActive) {
    initRef.current = true
    flow.startFlow('purchase_sale')
  }
}, [flow.isActive]) // ← Adicionar dependência
```

---

## Checklist de Implementação

- [ ] Abrir `src/pages/PurchaseSaleFlowPage.tsx`
- [ ] Adicionar `import { useRef } from 'react'` (se não existir)
- [ ] Adicionar const `initRef = useRef(false)` após `const [showCancelDialog, ...]`
- [ ] Modificar o useEffect conforme código acima
- [ ] Remover `// eslint-disable-line react-hooks/exhaustive-deps`
- [ ] Salvar arquivo
- [ ] Rodar `npm run typecheck`
- [ ] Rodar `npm run lint`
- [ ] Testar manualmente no browser:
  - [ ] Ir ao dashboard
  - [ ] Clicar "Novo Caso"
  - [ ] Verificar se formulário aparece (sem erro)
  - [ ] Clicar "Continuar fluxo" num caso
  - [ ] Verificar se carrega corretamente
- [ ] Rodar `npm run test:regression`

---

## Análise Detalhada

### Por que isso acontece?

O React controla atualizações de estado de forma rigorosa. Quando um `useEffect`:

1. Chama uma função que muda o estado
2. Que causa um re-render
3. Que dispara o mesmo `useEffect` novamente
4. E a função muda o estado novamente...

**Resultado:** React detecta isso como comportamento anormal e lança o erro.

### Por que o alerta foi ignorado?

```javascript
// Esta linha desativa o aviso do ESLint
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

O comentário `eslint-disable-line` foi colocado sem uma boa razão. ESLint estava **certo** em avisar sobre as dependências faltantes.

---

## Contexto Técnico

### Stack do Problema
```
PurchaseSaleFlowPage.tsx
    ↓ (useEffect chama)
usePurchaseSaleFlow.ts (hook)
    ↓ (startFlow chama)
flowStore.ts (store Zustand)
    ↓ (navigate causa re-render)
React Router
    ↓ (volta ao inicio)
PurchaseSaleFlowPage.tsx ↩️ LOOP
```

### Versões Relevantes
```
React: ^18.2.0
React Router: ^6.21.1
Zustand: ^4.4.7
Playwright: ^1.57.0
```

---

## Próximas Ações

1. **Implementar Correção** (5 min) - Usar solução com `useRef` acima
2. **Verificar Linter** (2 min) - Rodar `npm run lint` e `npm run typecheck`
3. **Teste Manual** (5 min) - Criar e continuar casos no browser
4. **Teste Automatizado** (30 min) - Rodar `npm run test:regression`
5. **Commit & Push** - Com mensagem: "Fix: Resolve infinite update loop in PurchaseSaleFlowPage"

---

## Referências

- Arquivo: `src/pages/PurchaseSaleFlowPage.tsx`
- Hook: `src/hooks/usePurchaseSaleFlow.ts`
- Store: `src/stores/flowStore.ts`
- React Docs: https://react.dev/learn/synchronizing-with-effects#fetching-data
- ESLint Rules: react-hooks/exhaustive-deps

---

**Estimativa Total de Correção:** 45 minutos (implementação + testes)
