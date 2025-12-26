# Relatório de Teste E2E - Sistema de Criação de Minutas
**Data:** 25 de Dezembro de 2025
**Ambiente:** Desenvolvimento (localhost:5173)
**Tester:** Claude Code

---

## Sumário Executivo

❌ **TESTE FALHOU** - Foi identificado um **erro crítico** que impede o fluxo de criação de novas minutas.

**Problema Principal:** Loop infinito de atualização de estado (Maximum update depth exceeded) no componente `PurchaseSaleFlowPage`.

---

## 1. Teste do Fluxo de Ponta a Ponta

### 1.1 Ambientes Testados
- ✅ Frontend: Vite dev server (localhost:5173)
- ✅ Autenticação: Supabase
- ✅ Dashboard: Carrega corretamente

### 1.2 Testes Realizados

#### Teste 1: Navegação para Dashboard
- **Status:** ✅ PASSOU
- **Resultado:** Dashboard carrega com sucesso
- **Observação:** 7 casos de teste anteriores já existem no sistema

#### Teste 2: Clique em "Novo Caso"
- **Status:** ❌ FALHOU
- **Erro:** `Maximum update depth exceeded. This can happen when a component repeatedly calls setState instead of passing an updated state to setState`
- **Local do Erro:** Componente `PurchaseSaleFlowPage`
- **Console Error ID:** React Error Boundary
- **Stacktrace Relevante:**
  ```
  Error: Maximum update depth exceeded. This can happen when a component
  repeatedly calls setState instead of passing an updated state to setState.

  The above error occurred in the <PurchaseSaleFlowPage> component
  ```

#### Teste 3: Clique em "Continuar fluxo" (caso existente)
- **Status:** ❌ FALHOU
- **Erro:** Mesmo erro do Teste 2
- **Conclusão:** O problema afeta tanto criação de novo caso quanto continuação de caso existente

---

## 2. Análise do Problema

### 2.1 Root Cause Analysis

**Localização:** `src/pages/PurchaseSaleFlowPage.tsx` (linhas 831-835)

**Código Problemático:**
```typescript
// src/pages/PurchaseSaleFlowPage.tsx
const navigate = useNavigate()
const flow = usePurchaseSaleFlow()
const steps = useFlowStore((state) => state.steps)

// ❌ PROBLEMA: useEffect sem dependências
useEffect(() => {
  if (!flow.isActive) {
    flow.startFlow('purchase_sale') // Chama navigate() internamente
  }
}, []) // eslint-disable-line react-hooks/exhaustive-deps ⚠️ ALERTA IGNORADO
```

**Cadeia de Eventos que Causa o Loop:**

1. Componente `PurchaseSaleFlowPage` monta
2. `useEffect` dispara (sem dependências)
3. `flow.startFlow('purchase_sale')` é chamado
4. `startFlow` (em `usePurchaseSaleFlow.ts` linha 334-340):
   ```typescript
   const startFlow = useCallback(
     (actType: ActType = 'purchase_sale') => {
       store.startFlow(actType)
       navigate('/purchase-sale-flow') // ⚠️ NAVEGA PARA A MESMA PÁGINA
     },
     [store, navigate]
   )
   ```
5. `navigate('/purchase-sale-flow')` causa re-render do componente
6. Re-render dispara `useEffect` novamente
7. Loop volta ao passo 2 → **Loop Infinito**

**Por que o alerta foi ignorado?**
- A linha `eslint-disable-line react-hooks/exhaustive-deps` desativa o alerta do ESLint
- Isto é uma prática perigosa quando o `useEffect` chama funções que causam navegação

---

## 3. Impacto do Problema

### 3.1 Funcionalidades Afetadas
- ❌ Criação de novo caso
- ❌ Continuação de caso existente
- ❌ Acesso à página `/purchase-sale-flow`

### 3.2 Funcionalidades Funcionando
- ✅ Autenticação/Login
- ✅ Dashboard listing
- ✅ Navegação geral
- ✅ Temas (dark/light mode)
- ✅ Visualização de casos existentes

---

## 4. Stack Trace Completo

```
Error: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState instead of passing an updated state to setState.

Location:
- Component: PurchaseSaleFlowPage (src/pages/PurchaseSaleFlowPage.tsx)
- Hook: usePurchaseSaleFlow (src/hooks/usePurchaseSaleFlow.ts)
- Store: flowStore (src/stores/flowStore.ts)

Timing: Imediato após navegação para /purchase-sale-flow
```

---

## 5. Recomendações de Correção

### 5.1 Solução Recomendada (Nível Alta Prioridade)

**Opção 1: Usar useRef para rastrear inicialização** ✅ RECOMENDADO
```typescript
const initRef = useRef(false)

useEffect(() => {
  if (!initRef.current && !flow.isActive) {
    initRef.current = true
    flow.startFlow('purchase_sale')
  }
}, [flow.isActive])
```

**Opção 2: Remover navigate() de startFlow**
```typescript
const startFlow = useCallback(
  (actType: ActType = 'purchase_sale') => {
    store.startFlow(actType)
    // Remover: navigate('/purchase-sale-flow')
  },
  [store]
)
```

**Opção 3: Condicional de URL**
```typescript
useEffect(() => {
  if (!flow.isActive && location.pathname === '/purchase-sale-flow') {
    flow.startFlow('purchase_sale')
  }
}, [flow.isActive, location.pathname])
```

---

## 6. Testes Automatizados (npm run test:regression)

### 6.1 Resultado Resumido
- **Total de Testes:** 130 (e2e/case-management.spec.ts, e2e/document-upload.spec.ts, e2e/entity-extraction.spec.ts)
- **Status:** ❌ TODOS FALHAM (casos de teste esperavam navegação funcional)

### 6.2 Testes Falhos Observados (amostra)
```
✗ T001: Create new case with title and act type (1.0m)
✗ T002: Filter cases by status (1.0m)
✗ T003: Search cases by title (1.0m)
✗ T004: Pagination works with different page sizes (1.0m)
✗ T005: Sort cases by creation date (1.0m)
✗ T009: Drag and drop file upload (1.0m)
✗ T010-T016: Document upload tests (1.0m cada)
```

---

## 7. Verificação de Ambiente

### 7.1 Configuração
- ✅ Node/npm instalado
- ✅ Playwright configurado
- ✅ Supabase conectado
- ✅ Vite server rodando
- ✅ TypeScript compila
- ⚠️ ESLint desativado para `exhaustive-deps` em múltiplos locais

### 7.2 Console Warnings/Errors
```
[WARNING] React Router Future Flag Warning (ignorável)
[WARNING] WebSocket connection to Supabase Realtime
[ERROR] Maximum update depth exceeded ← CRÍTICO
```

---

## 8. Checklist de Correção

- [ ] Revisar e corrigir `src/pages/PurchaseSaleFlowPage.tsx` (useEffect)
- [ ] Revisar `src/hooks/usePurchaseSaleFlow.ts` (startFlow logic)
- [ ] Remover eslint-disable-line para `react-hooks/exhaustive-deps`
- [ ] Adicionar testes unitários para `usePurchaseSaleFlow`
- [ ] Executar `npm run lint` após correção
- [ ] Executar `npm run typecheck`
- [ ] Rodar testes E2E: `npm run test:regression`
- [ ] Teste manual: Criar novo caso
- [ ] Teste manual: Continuar caso existente

---

## 9. Conclusão

O sistema atual **não é funcional** para o fluxo de criação/edição de minutas devido ao loop infinito no `PurchaseSaleFlowPage`.

**Severidade:** 🔴 **CRÍTICA**
**Status:** 🔴 **BLOQUEANTE**
**Estimativa de Correção:** 30-45 minutos com testes

A correção é straightforward e envolve apenas ajustar a lógica de inicialização do `useEffect` no componente principal da página.

---

## Anexo: Arquivos Relevantes

### Arquivos com Problemas:
1. `src/pages/PurchaseSaleFlowPage.tsx` (linhas 831-835)
2. `src/hooks/usePurchaseSaleFlow.ts` (linhas 334-340)
3. `src/stores/flowStore.ts` (linhas 227+)

### Arquivos de Configuração:
- `playwright.config.ts` - Configuração dos testes
- `package.json` - Scripts de teste

### Log de Teste:
- Navegação da Home → Dashboard ✅
- Clique "Novo Caso" → ❌ ERRO
- Clique "Continuar fluxo" → ❌ ERRO

---

**Próximas Ações Recomendadas:**
1. Implementar correção da opção 1 (useRef)
2. Rodar `npm run test:regression` novamente
3. Testar manualmente o fluxo completo
4. Validar testes E2E
5. Fazer commit com mensagem clara do fix
