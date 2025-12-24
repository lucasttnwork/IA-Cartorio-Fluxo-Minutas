# 🎨 Refatoração Completa UI: ShadCN + Glassmorphism

## Documento de Referência para Refatoração Completa

**Objetivo:** Refatorar toda a UI existente para usar ShadCN UI Components e aplicar estilo Glassmorphism em todas as interfaces.

**Status:** Planejamento - 38 Componentes, 33 Páginas

**Data de Início:** 2025-12-24

---

## 📋 Índice

1. [Visão Geral da Refatoração](#visão-geral)
2. [Prioridades e Fases](#fases)
3. [Padrões de Implementação](#padrões)
4. [Componentes: Mapeamento ShadCN](#componentes-mapeamento)
5. [Componentes Common: Refatoração Detalhada](#common-components)
6. [Componentes Layout: Refatoração](#layout-components)
7. [Componentes Canvas: Refatoração](#canvas-components)
8. [Componentes Entities: Refatoração](#entities-components)
9. [Componentes Status: Refatoração](#status-components)
10. [Componentes Evidence: Refatoração](#evidence-components)
11. [Componentes Outros: Refatoração](#other-components)
12. [Páginas: Refatoração Detalhada](#pages-refactoring)
13. [CSS Customizado: Consolidação](#css-consolidation)
14. [Checklist de Implementação](#checklist)

---

## 🎯 Visão Geral da Refatoração {#visão-geral}

### Escopo Completo

**O que será refatorado:**
- ✅ 38 Componentes React
- ✅ 33 Páginas
- ✅ 100+ Classes CSS customizadas
- ✅ Estilos inline e Framer Motion
- ✅ Layout e responsividade
- ✅ Dark mode em todas as interfaces

**O que será mantido:**
- ✅ Funcionalidade de negócio
- ✅ Lógica de estado (Zustand, React Query)
- ✅ Tipos TypeScript
- ✅ Acessibilidade WCAG AA
- ✅ Animações e transições (otimizadas)

### Benefícios

1. **Consistência Visual** - Design system unificado
2. **Acessibilidade Garantida** - Radix UI built-in
3. **Manutenibilidade** - Componentes padronizados
4. **Performance** - Menos CSS customizado
5. **Escalabilidade** - Fácil adicionar novos componentes
6. **Estética Moderna** - Glassmorphism em toda parte

---

## 📊 Fases de Implementação {#fases}

### Fase 1: Preparação (COMPLETO ✅)
- [x] Instalar ShadCN UI
- [x] Configurar componentes base (Button, Card, Input, Label, Dialog)
- [x] Adicionar glassmorphism classes
- [x] Atualizar documentação
- [x] Preparar ambiente

**Tempo:** Completo | **Status:** ✅ Pronto

---

### Fase 2: Componentes Base (PRIORIDADE 1 - CRÍTICO)
**Objetivo:** Refatorar componentes fundamentais reutilizáveis

**Componentes:**
1. Avatar.tsx - Usar Dialog com glassmorphism
2. Breadcrumb.tsx - Usar ShadCN layout pattern
3. BrowserNavigation.tsx - Usar Button components
4. ExpandableCard.tsx - Refatorar com Card component
5. DeleteConfirmationModal.tsx - Usar Dialog component
6. Pagination.tsx - Refatorar com Button components
7. SortControls.tsx - Usar Button + Dropdown pattern

**Critério de Sucesso:**
- Todos componentes usam ShadCN
- Aplicado glassmorphism onde apropriado
- Dark mode funcionando
- Acessibilidade mantida

**Tempo Estimado:** 3-4 horas
**Prioridade:** 🔴 CRÍTICO

---

### Fase 3: Componentes Status & Feedback (PRIORIDADE 1)
**Objetivo:** Refatorar status, badges e feedback visual

**Componentes:**
1. CaseStatusBadge.tsx - Usar Badge component
2. DocumentStatusBadge.tsx - Refatorar com Badge + Icon
3. ProcessingStatusPanel.tsx - Usar Progress pattern com glassmorphism

**Critério de Sucesso:**
- Status visualmente consistentes
- Glassmorphism aplicado
- Animações suaves

**Tempo Estimado:** 2-3 horas
**Prioridade:** 🔴 CRÍTICO

---

### Fase 4: Componentes Layout (PRIORIDADE 1)
**Objetivo:** Refatorar layout principal e navegação

**Componentes:**
1. DashboardLayout.tsx - Refatorar sidebar com glassmorphism
2. UserProfileDropdown.tsx - Usar Dropdown + Dialog pattern

**Critério de Sucesso:**
- Layout mantém responsividade
- Glassmorphism em header/sidebar
- Dark mode funciona perfeitamente
- Mobile layout otimizado

**Tempo Estimado:** 2-3 horas
**Prioridade:** 🔴 CRÍTICO

---

### Fase 5: Componentes Entities (PRIORIDADE 2)
**Objetivo:** Refatorar cards de entidades

**Componentes:**
1. PersonEntityCard.tsx - Usar Card + ExpandableSection pattern
2. PropertyEntityCard.tsx - Usar Card + ExpandableSection pattern
3. EntityTable.tsx - Usar Table component + glassmorphism

**Critério de Sucesso:**
- Cards com glassmorphism
- Expandable sections funcionam
- Confidence badges estilizadas
- Evidence links mantidos

**Tempo Estimado:** 3-4 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 6: Componentes Evidence (PRIORIDADE 2)
**Objetivo:** Refatorar modals e visualizadores

**Componentes:**
1. EvidenceModal.tsx - Usar Dialog component + glassmorphism
2. DocumentViewer.tsx - Refatorar overlay
3. BoundingBoxOverlay.tsx - Otimizar SVG
4. HighlightBox.tsx - Refatorar com glassmorphism

**Critério de Sucesso:**
- Modal com glassmorphism forte
- Document viewer funcional
- Bounding boxes otimizados
- Dark mode

**Tempo Estimado:** 2-3 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 7: Componentes Canvas (PRIORIDADE 2)
**Objetivo:** Refatorar componentes React Flow

**Componentes:**
1. PersonNode.tsx - Aplicar estilo glassmorphism
2. PropertyNode.tsx - Aplicar estilo glassmorphism
3. EditPersonModal.tsx - Usar Dialog + Form pattern
4. EditPropertyModal.tsx - Usar Dialog + Form pattern
5. ContextMenu.tsx - Refatorar com Dropdown component
6. SuggestionsPanel.tsx - Aplicar glassmorphism

**Critério de Sucesso:**
- Nós com glassmorphism
- Modais ShadCN
- Sugestões estilizadas
- Responsividade mantida

**Tempo Estimado:** 4-5 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 8: Componentes Editor & Chat (PRIORIDADE 2)
**Objetivo:** Refatorar editor e chat

**Componentes:**
1. TiptapEditor.tsx - Refatorar toolbar com Button components
2. ChatPanel.tsx - Usar Card + Input pattern com glassmorphism
3. ChatMessage.tsx - Usar Card pattern com glassmorphism

**Critério de Sucesso:**
- Editor toolbar moderno
- Chat com glassmorphism
- Dark mode funciona
- Responsividade mantida

**Tempo Estimado:** 3-4 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 9: Componentes Consensus (PRIORIDADE 3)
**Objetivo:** Refatorar componentes de resolução

**Componentes:**
1. ConflictCard.tsx - Usar Card + ExpandableSection com glassmorphism

**Critério de Sucesso:**
- Card com glassmorphism
- Campos de resolução estilizados
- Confidence badges modernos

**Tempo Estimado:** 2-3 horas
**Prioridade:** 🟢 DESEJÁVEL

---

### Fase 10: Componentes Upload & Case (PRIORIDADE 3)
**Objetivo:** Refatorar upload e criação de caso

**Componentes:**
1. DocumentDropzone.tsx - Refatorar com glassmorphism
2. CreateCaseModal.tsx - Usar Dialog + Form pattern

**Critério de Sucesso:**
- Dropzone com glassmorphism
- Modal ShadCN
- Form validation mantida

**Tempo Estimado:** 1-2 horas
**Prioridade:** 🟢 DESEJÁVEL

---

### Fase 11: Páginas - Rodada 1 (PRIORIDADE 2)
**Objetivo:** Refatorar principais páginas de funcionalidade

**Páginas:**
1. DashboardPage.tsx - Usar componentes refatorados
2. UploadPage.tsx - Usar DocumentDropzone refatorado
3. EntitiesPage.tsx - Usar EntityCard refatorado
4. CaseOverviewPage.tsx - Usar componentes refatorados

**Critério de Sucesso:**
- Todas funcionalidades mantidas
- Layout com glassmorphism
- Dark mode funcionando
- Responsivo em todos breakpoints

**Tempo Estimado:** 4-5 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 12: Páginas - Rodada 2 (PRIORIDADE 2)
**Objetivo:** Refatorar páginas feature-specific

**Páginas:**
1. CanvasPage.tsx - Usar componentes refatorados
2. DraftPage.tsx - Usar TiptapEditor + ChatPanel refatorados
3. ConflictReviewPage.tsx - Usar ConflictCard refatorado
4. HistoryPage.tsx - Refatorar com ShadCN Table

**Critério de Sucesso:**
- Funcionalidades mantidas
- Visual moderno
- Dark mode
- Responsividade

**Tempo Estimado:** 5-6 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 13: Páginas - Test Pages (PRIORIDADE 4)
**Objetivo:** Atualizar todas as páginas de teste/demo

**Páginas:** 25 Test* pages

**Critério de Sucesso:**
- Componentes funcionam em isolation
- Variantess testadas
- Dark mode testado

**Tempo Estimado:** 6-8 horas
**Prioridade:** 🟡 IMPORTANTE

---

### Fase 14: CSS Consolidação (PRIORIDADE 3)
**Objetivo:** Remover CSS não utilizado e consolidar

**Tarefas:**
1. Remover classes CSS antigas que foram migradas
2. Consolidar glassmorphism classes
3. Otimizar index.css
4. Remover Tailwind classes duplicadas
5. Validar dark mode em todas as classes

**Critério de Sucesso:**
- Sem CSS não utilizado
- Tamanho do arquivo reduzido
- Perf não impactada
- Dark mode funcionando 100%

**Tempo Estimado:** 2-3 horas
**Prioridade:** 🟢 DESEJÁVEL

---

### Fase 15: Testes & QA (PRIORIDADE 1)
**Objetivo:** Garantir qualidade da refatoração

**Tarefas:**
1. Teste de regressão completo
2. Teste de acessibilidade (WCAG AA)
3. Teste de responsividade (todos breakpoints)
4. Teste de dark mode
5. Teste de performance
6. Teste de navegação e fluxos

**Critério de Sucesso:**
- Sem regressões funcionais
- Acessibilidade mantida
- Performance não piora
- Responsive em todos devices

**Tempo Estimado:** 4-6 horas
**Prioridade:** 🔴 CRÍTICO

---

## 🏗️ Padrões de Implementação {#padrões}

### Padrão 1: Refatoração de Cards

**Antes (CSS customizado):**
```tsx
<div className="card card-hover">
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="text-sm text-gray-600">{description}</p>
</div>
```

**Depois (ShadCN + Glassmorphism):**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

<Card className="glass-card">
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

**Aplicar:**
- Todos os cards na aplicação
- Glassmorphism com `.glass-card`
- Shadows e borders mantidos
- Dark mode automático

---

### Padrão 2: Refatoração de Botões

**Antes:**
```tsx
<button className="btn btn-primary">
  Click me
</button>

<button className="btn btn-primary-outline">
  Outline
</button>
```

**Depois:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

**Mapeamento de Variantes:**
- `.btn-primary` → `variant="default"`
- `.btn-primary-outline` → `variant="outline"`
- `.btn-primary-ghost` → `variant="ghost"`
- `.btn-secondary` → `variant="secondary"`
- `.btn-danger` → `variant="destructive"`

**Aplicar:**
- Todos os botões no projeto
- Usar variantes ShadCN
- Manter tamanhos com `size` prop
- Dark mode automático

---

### Padrão 3: Refatoração de Modais/Dialogs

**Antes:**
```tsx
{isOpen && (
  <div className="evidence-modal-backdrop">
    <div className="evidence-modal glass">
      <h2>{title}</h2>
      {/* content */}
      <button onClick={onClose}>Close</button>
    </div>
  </div>
)}
```

**Depois:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="glass-dialog">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

**Aplicar:**
- Todos os modais (DeleteConfirmationModal, EvidenceModal, EditPersonModal, etc.)
- Usar `glass-dialog` para glassmorphism forte
- Dialog gerencia automaticamente close/escape
- Dark mode automático

---

### Padrão 4: Refatoração de Forms

**Antes:**
```tsx
<div>
  <label className="form-label">{label}</label>
  <input type="text" className="input" />
</div>
```

**Depois:**
```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div className="space-y-2">
  <Label htmlFor="field">{label}</Label>
  <Input id="field" type="text" />
</div>
```

**Aplicar:**
- Todos os formulários
- Usar Label + Input components
- Manter validação e error states
- Dark mode automático

---

### Padrão 5: Refatoração de Badges/Status

**Antes:**
```tsx
<span className="badge badge-success">Approved</span>
<span className="badge badge-warning">Pending</span>
```

**Depois:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="outline" className="bg-green-100 text-green-800">
  Approved
</Badge>

<Badge variant="outline" className="bg-yellow-100 text-yellow-800">
  Pending
</Badge>
```

**Alternativa (Custom Status Badge):**
```tsx
// Criar StatusBadge component que encapsula Badge com glassmorphism
<StatusBadge status="approved" className="glass-card" />
```

**Aplicar:**
- CaseStatusBadge
- DocumentStatusBadge
- ConfidenceBadge
- Todos os badges informativos

---

### Padrão 6: Expandable/Accordion Sections

**Antes:**
```tsx
<div className="card-expandable">
  <div className="card-expandable-header" onClick={toggle}>
    <span>{title}</span>
    <ChevronIcon className={isOpen ? "rotate-180" : ""} />
  </div>
  {isOpen && <div className="card-expandable-content">{content}</div>}
</div>
```

**Depois:**
```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

<Card className="glass-card">
  <CardHeader
    className="cursor-pointer"
    onClick={toggle}
  >
    <div className="flex items-center justify-between">
      <h3>{title}</h3>
      <ChevronDownIcon className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
    </div>
  </CardHeader>
  {isOpen && <CardContent>{content}</CardContent>}
</Card>
```

**Ou usar Accordion ShadCN:**
```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

<Accordion type="single" collapsible className="glass-card">
  <AccordionItem value="section1">
    <AccordionTrigger>{title}</AccordionTrigger>
    <AccordionContent>{content}</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Aplicar:**
- ExpandableCard
- PersonEntityCard sections
- PropertyEntityCard sections
- ConflictCard sections

---

### Padrão 7: Aplicar Glassmorphism

**Para Cards (padrão):**
```tsx
<Card className="glass-card">
  {/* Blur médio, border subtle, shadow elegante */}
</Card>
```

**Para Modais/Dialogs (forte):**
```tsx
<DialogContent className="glass-dialog">
  {/* Blur forte, 95% opacity, border definida */}
</DialogContent>
```

**Para Popovers/Dropdowns:**
```tsx
<div className="glass-popover">
  {/* Blur médio, shadow-2xl, border-white/30 */}
</div>
```

**Para Painéis Elevados:**
```tsx
<div className="glass-elevated">
  {/* Blur forte, shadow-2xl, ring border */}
</div>
```

**Para Elementos Secundários:**
```tsx
<div className="glass-subtle">
  {/* Blur leve, 60% opacity, background suave */}
</div>
```

---

### Padrão 8: Dark Mode

**ShadCN já suporta automaticamente via CSS variables**

Verificar que todos componentes têm:
```tsx
// Dark mode classes são aplicadas automaticamente
<Card className="glass-card">
  {/* dark:bg-gray-900/80, dark:border-gray-700/50, etc. */}
</Card>
```

**Não precisa fazer:**
```tsx
// Errado - ShadCN já trata isso
<Card className="dark:bg-gray-900">
```

---

### Padrão 9: Usar `cn()` Utility

**Para componentes customizados:**
```tsx
import { cn } from "@/lib/utils"

interface Props {
  className?: string
  variant?: "default" | "secondary"
}

export function MyComponent({ className, variant }: Props) {
  return (
    <div className={cn(
      "glass-card",
      variant === "secondary" && "glass-subtle",
      className
    )}>
      Content
    </div>
  )
}
```

**Aplicar em:**
- Todos componentes que aceitam className
- Qualquer composição dinâmica de classes
- Variantes customizadas

---

### Padrão 10: Animações

**De Framer Motion para Tailwind/CSS:**

**Antes:**
```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
>
  {content}
</motion.div>
```

**Depois (Manter se necessário):**
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

**Ou usar Tailwind transition:**
```tsx
<div className="transition-all duration-200 opacity-0 data-[state=open]:opacity-100">
  {content}
</div>
```

**Aplicar:**
- Manter Framer Motion para animações complexas
- Usar Tailwind transitions para simples
- Respeitar `prefers-reduced-motion`

---

## 🗺️ Componentes: Mapeamento ShadCN {#componentes-mapeamento}

### Tabela de Mapeamento Completo

| Componente Atual | ShadCN Base | Mudanças Principais | Glassmorphism | Prioridade |
|-----------------|------------|-------------------|---------------|-----------|
| **Avatar.tsx** | None (custom) | Manter; adicionar glass estilo | `.glass-card` optional | P1 |
| **AvatarGroup.tsx** | None (custom) | Manter; usar Avatar refatorado | Não necessário | P1 |
| **Breadcrumb.tsx** | nav semantic | Refatorar com nav + ul; icon handling | Não necessário | P1 |
| **BrowserNavigation.tsx** | Button | Refatorar com Button components | Não necessário | P1 |
| **UserProfileDropdown.tsx** | Dropdown-Menu | Refatorar com ShadCN Dropdown | `.glass-popover` | P1 |
| **ExpandableCard.tsx** | Card + Button | Refatorar com Card + Button | `.glass-card` | P1 |
| **DeleteConfirmationModal.tsx** | Dialog | Refatorar com Dialog ShadCN | `.glass-dialog` | P1 |
| **Pagination.tsx** | Button | Refatorar com Button + nav | Não necessário | P1 |
| **SortControls.tsx** | Button | Refatorar com Button | Não necessário | P1 |
| **ProtectedRoute.tsx** | None (logic) | Manter como está | N/A | - |
| **DashboardLayout.tsx** | Semantic HTML | Refatorar layout com Card borders glass | `.glass-card` para header | P1 |
| **PersonNode.tsx** | Card concept | Refatorar com Card estilo node | `.glass-card` | P2 |
| **PropertyNode.tsx** | Card concept | Refatorar com Card estilo node | `.glass-card` | P2 |
| **EditPersonModal.tsx** | Dialog | Refatorar com Dialog + Form | `.glass-dialog` | P2 |
| **EditPropertyModal.tsx** | Dialog | Refatorar com Dialog + Form | `.glass-dialog` | P2 |
| **ContextMenu.tsx** | Dropdown-Menu | Refatorar com ShadCN Dropdown | `.glass-popover` | P2 |
| **SuggestionsPanel.tsx** | Card | Refatorar com Card | `.glass-card` | P2 |
| **ChatPanel.tsx** | Card + Input | Refatorar com Card + Input | `.glass-card` | P2 |
| **ChatMessage.tsx** | Card | Refatorar com Card | `.glass-card` | P2 |
| **CaseStatusBadge.tsx** | Badge + Dropdown | Refatorar com Badge + Dropdown | `.glass-popover` para menu | P1 |
| **DocumentStatusBadge.tsx** | Badge | Refatorar com Badge | Não necessário | P1 |
| **ProcessingStatusPanel.tsx** | Card + Progress | Refatorar com Card + Progress (instalar) | `.glass-card` | P1 |
| **PersonEntityCard.tsx** | Card | Refatorar com Card + Accordion | `.glass-card` | P2 |
| **PropertyEntityCard.tsx** | Card | Refatorar com Card + Accordion | `.glass-card` | P2 |
| **EntityTable.tsx** | Table concept | Refatorar com Table component (instalar) | `.glass-card` para wrapper | P2 |
| **ConflictCard.tsx** | Card | Refatorar com Card + Accordion | `.glass-card` | P3 |
| **TiptapEditor.tsx** | Custom toolbar | Refatorar toolbar com Button group | Não necessário | P2 |
| **DocumentViewer.tsx** | Custom canvas | Manter; adicionar glass overlay border | `.glass-dialog` para container | P2 |
| **EvidenceModal.tsx** | Dialog | Refatorar com Dialog ShadCN | `.glass-dialog` | P2 |
| **BoundingBoxOverlay.tsx** | SVG custom | Manter como está (otimizar) | N/A | - |
| **HighlightBox.tsx** | SVG custom | Manter como está | N/A | - |
| **DocumentDropzone.tsx** | Custom div | Refatorar com Card border-dashed + glass | `.glass-card` | P3 |
| **CreateCaseModal.tsx** | Dialog | Refatorar com Dialog + Form | `.glass-dialog` | P3 |

---

## 🔧 Componentes Common: Refatoração Detalhada {#common-components}

### 1. Avatar.tsx

**Análise Atual:**
- Componente customizado bem implementado
- Usa hash para cores determinísticas
- Suporta status indicator
- Dark mode suportado

**Plano de Refatoração:**

```tsx
// ANTES
import { getColorForString } from "@/utils/colorUtils"

export function Avatar({ name, status, size = "md", url }: Props) {
  const bgColor = getColorForString(name)

  return (
    <div className={cn("avatar", `avatar-${size}`, bgColor)}>
      {initials}
      {status && <div className={`avatar-status avatar-status-${status}`} />}
    </div>
  )
}

// DEPOIS - Praticamente idêntico, mas com opção glass
import { cn } from "@/lib/utils"

export function Avatar({ name, status, size = "md", url, className }: Props) {
  const bgColor = getColorForString(name)

  return (
    <div className={cn(
      "avatar",
      `avatar-${size}`,
      bgColor,
      className // Para permitir glass-card se necessário
    )}>
      {initials}
      {status && <div className={`avatar-status avatar-status-${status}`} />}
    </div>
  )
}
```

**Mudanças Necessárias:**
1. Adicionar `className` prop para flexibilidade
2. Manter lógica de cor e status
3. Testar dark mode (já funciona)

**Glassmorphism:** Não aplicável (é um elemento pequeno/inline)

**Tempo Estimado:** 15 minutos

---

### 2. AvatarGroup.tsx

**Análise Atual:**
- Usa Avatar múltiplas vezes
- Mostra overflow count
- Hover effects

**Plano de Refatoração:**

```tsx
// Praticamente nenhuma mudança necessária
// Apenas usar Avatar refatorado

export function AvatarGroup({ avatars, maxDisplay = 3 }: Props) {
  const visible = avatars.slice(0, maxDisplay)
  const overflow = avatars.length - maxDisplay

  return (
    <div className="avatar-group">
      {visible.map(avatar => (
        <Avatar key={avatar.id} {...avatar} />
      ))}
      {overflow > 0 && (
        <div className="avatar">+{overflow}</div>
      )}
    </div>
  )
}
```

**Mudanças Necessárias:** Nenhuma

**Tempo Estimado:** 5 minutos (apenas testes)

---

### 3. Breadcrumb.tsx

**Análise Atual:**
- Usa react-router
- Gera breadcrumbs automaticamente
- Chevron dividers
- Current page accessibility

**Plano de Refatoração:**

```tsx
// ANTES
export function Breadcrumb() {
  const location = useLocation()

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, i) => (
          <li key={i} className="breadcrumb-item">
            {i === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.path}>{item.label}</Link>
            )}
            {i < items.length - 1 && <span className="breadcrumb-divider">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// DEPOIS
export function Breadcrumb() {
  const location = useLocation()

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="mx-1 text-gray-400">/</span>}
          {i === items.length - 1 ? (
            <span aria-current="page" className="text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
          ) : (
            <Link to={item.path} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
```

**Mudanças Necessárias:**
1. Remover classes CSS customizadas
2. Usar Tailwind utilities
3. Manter accessibility (aria-current)
4. Adicionar dark mode classes

**Glassmorphism:** Não aplicável

**Tempo Estimado:** 30 minutos

---

### 4. BrowserNavigation.tsx

**Análise Atual:**
- Botões back/forward
- Keyboard shortcuts (Alt+Arrow)
- Disabled states
- Accessibility

**Plano de Refatoração:**

```tsx
// ANTES
<div className="browser-navigation">
  <button className="browser-nav-button" onClick={goBack} aria-label="Go back">
    <ArrowLeftIcon className="w-5 h-5" />
  </button>
  <button className="browser-nav-button" onClick={goForward} aria-label="Go forward">
    <ArrowRightIcon className="w-5 h-5" />
  </button>
</div>

// DEPOIS
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline"

<div className="flex gap-1">
  <Button
    variant="outline"
    size="icon"
    onClick={goBack}
    aria-label="Go back"
    disabled={!canGoBack}
  >
    <ArrowLeftIcon className="w-5 h-5" />
  </Button>
  <Button
    variant="outline"
    size="icon"
    onClick={goForward}
    aria-label="Go forward"
    disabled={!canGoForward}
  >
    <ArrowRightIcon className="w-5 h-5" />
  </Button>
</div>
```

**Mudanças Necessárias:**
1. Usar Button component do ShadCN
2. Usar variant="outline"
3. Manter accessibility e keyboard shortcuts
4. Manter disabled states

**Glassmorphism:** Não aplicável

**Tempo Estimado:** 30 minutos

---

### 5. UserProfileDropdown.tsx

**Análise Atual:**
- Menu dropdown com role badge
- Framer Motion animations
- Click outside detection
- Sign out button

**Plano de Refatoração:**

```tsx
// ANTES
import { Menu, Transition } from "@headlessui/react"
import { motion, AnimatePresence } from "framer-motion"

export function UserProfileDropdown({ user }: Props) {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="btn-ghost">
        <Avatar name={user.name} />
      </Menu.Button>
      <Transition ...>
        <Menu.Items className="dropdown-menu glass">
          {/* items */}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

// DEPOIS
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function UserProfileDropdown({ user }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Avatar name={user.name} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-popover">
        <div className="px-2 py-1.5 text-sm font-semibold">{user.name}</div>
        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
          <RoleBadge role={user.role} />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Mudanças Necessárias:**
1. Instalar ShadCN Dropdown-Menu: `npx shadcn@latest add dropdown-menu`
2. Refatorar de Headless UI para ShadCN
3. Aplicar `.glass-popover`
4. Manter role badge
5. Manter sign out funcionalidade

**Glassmorphism:** `.glass-popover`

**Tempo Estimado:** 45 minutos

**Dependência:** Precisa instalar Dropdown-Menu ShadCN

---

### 6. ExpandableCard.tsx

**Análise Atual:**
- Controlled/uncontrolled modes
- Chevron animation
- Smooth transitions
- Header actions support

**Plano de Refatoração:**

```tsx
// ANTES
export function ExpandableCard({ title, children, isOpen, onToggle, className }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen ?? internalOpen

  return (
    <div className={cn("card-expandable", className)}>
      <div
        className="card-expandable-header"
        onClick={() => onToggle?.(open) || setInternalOpen(!open)}
      >
        <span>{title}</span>
        <ChevronIcon className={open ? "rotate-180" : ""} />
      </div>
      {open && <div className="card-expandable-content">{children}</div>}
    </div>
  )
}

// DEPOIS
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export function ExpandableCard({ title, children, isOpen, onToggle, className }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen ?? internalOpen
  const toggleOpen = () => onToggle?.(!open) ?? setInternalOpen(!open)

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader
        className="cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={toggleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggleOpen()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <ChevronDownIcon className={cn(
            "h-5 w-5 transition-transform",
            open && "rotate-180"
          )} />
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}
```

**Mudanças Necessárias:**
1. Usar Card + CardHeader + CardContent
2. Aplicar `.glass-card`
3. Manter controlled/uncontrolled behavior
4. Adicionar keyboard navigation (Enter key)
5. Melhorar hover states

**Glassmorphism:** `.glass-card`

**Tempo Estimado:** 45 minutos

---

### 7. DeleteConfirmationModal.tsx

**Análise Atual:**
- Confirmação de ação destrutiva
- Modal simples
- Warning messaging

**Plano de Refatoração:**

```tsx
// ANTES
export function DeleteConfirmationModal({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="evidence-modal-backdrop">
      <div className="evidence-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="flex gap-2">
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// DEPOIS
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DeleteConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="glass-dialog">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400">{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Mudanças Necessárias:**
1. Usar Dialog component (já instalado)
2. Usar Button destructive variant
3. Aplicar `.glass-dialog`
4. Adicionar `isOpen` prop control
5. Usar DialogDescription para message

**Glassmorphism:** `.glass-dialog`

**Tempo Estimado:** 30 minutos

---

### 8. Pagination.tsx

**Análise Atual:**
- Navegação de páginas
- Page number buttons
- Previous/Next buttons
- Disabled states

**Plano de Refatoração:**

```tsx
// ANTES
export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <div className="flex gap-1">
      <button
        className="btn btn-secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      {pageNumbers.map(page => (
        <button
          key={page}
          className={cn("btn", page === currentPage ? "btn-primary" : "btn-secondary")}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        className="btn btn-secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  )
}

// DEPOIS
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <nav className="flex items-center gap-1" role="navigation" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </Button>

      {pageNumbers.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </Button>
    </nav>
  )
}
```

**Mudanças Necessárias:**
1. Usar Button components
2. Usar variant="default" para current page
3. Adicionar aria-labels
4. Adicionar aria-current="page"
5. Usar icon buttons para prev/next

**Glassmorphism:** Não aplicável

**Tempo Estimado:** 30 minutos

---

### 9. SortControls.tsx

**Análise Atual:**
- Sorting buttons
- Direction toggle
- Icon indicators

**Plano de Refatoração:**

```tsx
// ANTES
export function SortControls({ fields, onSort }: Props) {
  return (
    <div className="flex gap-2">
      {fields.map(field => (
        <button
          key={field}
          className="btn btn-secondary"
          onClick={() => handleSort(field)}
        >
          {field}
          {sortField === field && <SortIcon direction={sortDir} />}
        </button>
      ))}
    </div>
  )
}

// DEPOIS
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline"

export function SortControls({ fields, onSort, sortField, sortDirection }: Props) {
  return (
    <div className="flex gap-2" role="group" aria-label="Sort controls">
      {fields.map(field => (
        <Button
          key={field}
          variant={sortField === field ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort(field)}
          className="gap-1"
        >
          {field}
          {sortField === field && (
            sortDirection === "asc"
              ? <ArrowUpIcon className="w-4 h-4" />
              : <ArrowDownIcon className="w-4 h-4" />
          )}
        </Button>
      ))}
    </div>
  )
}
```

**Mudanças Necessárias:**
1. Usar Button components
2. Usar variant="default" para active
3. Usar icons para direction
4. Adicionar role="group"

**Glassmorphism:** Não aplicável

**Tempo Estimado:** 25 minutos

---

## 📍 Layout Components: Refatoração {#layout-components}

### DashboardLayout.tsx

**Análise Atual:**
- Sidebar com navegação
- Mobile hamburger menu
- Top header com breadcrumbs
- Avatar + dropdown
- Responsive design

**Plano de Refatoração:**

```tsx
// ANTES (simplified)
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="modal-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className="sidebar">
        <nav>
          {/* Links de navegação */}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>Menu</button>
            <Breadcrumb />
            <BrowserNavigation />
            <Avatar />
            <UserProfileDropdown />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// DEPOIS
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30",
        "transform transition-transform duration-300 -translate-x-full md:translate-x-0",
        sidebarOpen && "translate-x-0"
      )}>
        <Card className="h-full glass-card rounded-none border-0 border-r border-white/20 dark:border-gray-700/50">
          <nav className="p-4 space-y-2">
            {/* Case navigation items */}
            <NavLink to={`/case/${caseId}/upload`} label="Upload" />
            <NavLink to={`/case/${caseId}/entities`} label="Entities" />
            <NavLink to={`/case/${caseId}/canvas`} label="Canvas" />
            <NavLink to={`/case/${caseId}/draft`} label="Draft" />
            <NavLink to={`/case/${caseId}/history`} label="History" />
          </nav>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Card className="glass-card rounded-none border-0 border-b border-white/20 dark:border-gray-700/50 p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Menu + Breadcrumb + Browser Nav */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden"
                >
                  <MenuIcon className="w-5 h-5" />
                </Button>
                <Breadcrumb />
                <BrowserNavigation />
              </div>

              {/* Right side: Avatar + Dropdown */}
              <div className="flex items-center gap-2">
                <UserProfileDropdown user={user} />
              </div>
            </div>
          </Card>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Helper NavLink component
function NavLink({ to, label, icon }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        "block px-4 py-2 rounded-lg transition-colors",
        isActive
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
      )}
    >
      {label}
    </Link>
  )
}
```

**Mudanças Necessárias:**

1. **Sidebar**
   - [ ] Usar Card com `.glass-card` para container
   - [ ] Aplicar border-white/20 dark:border-gray-700/50
   - [ ] Manter responsive behavior (fixed mobile, static desktop)
   - [ ] Usar Button components para mobile menu toggle

2. **Header**
   - [ ] Usar Card com `.glass-card`
   - [ ] Flex layout para melhor alinhamento
   - [ ] Aplicar sticky positioning
   - [ ] Border-white/20 para subtle divider

3. **Navegação**
   - [ ] Usar componentes refatorados (Breadcrumb, BrowserNavigation, UserProfileDropdown)
   - [ ] Manter active state styling
   - [ ] Dark mode classes

4. **Responsividade**
   - [ ] Mobile: fixed sidebar com backdrop, hamburger menu
   - [ ] Desktop: static sidebar
   - [ ] Smooth transitions

**Glassmorphism:**
- Header: `.glass-card`
- Sidebar: `.glass-card`
- Borders: `border-white/20 dark:border-gray-700/50`

**Tempo Estimado:** 2 horas

---

## 🖼️ Canvas Components: Refatoração {#canvas-components}

### PersonNode.tsx, PropertyNode.tsx

**Análise Atual:**
- React Flow nodes
- Custom styling
- Edit capability
- Data display

**Plano de Refatoração:**

```tsx
// ANTES
export function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  return (
    <div className={cn(
      "person-node",
      selected && "person-node-selected"
    )}>
      <div className="person-node-header">
        <div className="person-node-avatar">
          <Avatar name={data.person.full_name} size="md" />
        </div>
        <div className="person-node-info">
          <div className="person-node-name">{data.person.full_name}</div>
          <div className="person-node-cpf">{data.person.cpf}</div>
        </div>
      </div>
      <ConfidenceBadge confidence={data.person.confidence} />
    </div>
  )
}

// DEPOIS
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  return (
    <Card className={cn(
      "glass-card min-w-fit cursor-pointer transition-all",
      selected && "ring-2 ring-blue-500 dark:ring-blue-400"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar name={data.person.full_name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {data.person.full_name}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {maskCPF(data.person.cpf)}
            </div>
          </div>
          <Badge
            variant="outline"
            className={getConfidenceColor(data.person.confidence)}
          >
            {data.person.confidence}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// PropertyNode similar
export function PropertyNode({ data, selected }: NodeProps<PropertyNodeData>) {
  return (
    <Card className={cn(
      "glass-card min-w-fit cursor-pointer transition-all",
      selected && "ring-2 ring-green-500 dark:ring-green-400"
    )}>
      <CardContent className="p-3">
        <div className="space-y-1">
          <div className="font-semibold text-sm text-gray-900 dark:text-white">
            {data.property.registry_number}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {formatAddress(data.property.address)}
          </div>
          <Badge
            variant="outline"
            className={getConfidenceColor(data.property.confidence)}
          >
            {data.property.confidence}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Mudanças Necessárias:**
1. Usar Card component
2. Aplicar `.glass-card`
3. Usar Badge para confidence
4. Usar ring states para selected (ShadCN pattern)
5. Dark mode classes

**Glassmorphism:** `.glass-card`

**Tempo Estimado:** 1 hora

---

## 💳 Entities Components: Refatoração {#entities-components}

### PersonEntityCard.tsx

**Análise Atual:**
- Card grande com múltiplas seções
- Expandable sections
- Field rows com icons
- Evidence links
- Metadata footer

**Plano de Refatoração:**

```tsx
// ANTES (simplified)
export function PersonEntityCard({ person, onEditField, onViewEvidence }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  return (
    <div className="card-expandable person-entity-card">
      <div className="person-entity-header">
        <Avatar name={person.full_name} />
        <div className="person-entity-info">
          <h3>{person.full_name}</h3>
          <ConfidenceBadge confidence={person.confidence} />
        </div>
      </div>

      {SECTIONS.map(section => (
        <div key={section.id} className="person-entity-section">
          <div
            className="section-header"
            onClick={() => toggleSection(section.id)}
          >
            {section.label}
            <ChevronIcon />
          </div>
          {expandedSections.has(section.id) && (
            <div className="section-content">
              {section.fields.map(field => (
                <div key={field} className="field-row">
                  <Icon />
                  <span>{field}</span>
                  <span>{person[field]}</span>
                  <button onClick={() => onViewEvidence(field)}>Evidence</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="person-entity-footer">
        <span>{person.source_docs.length} documents</span>
        <span>{filledFields}/{totalFields} fields filled</span>
      </div>
    </div>
  )
}

// DEPOIS
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PersonEntityCard({ person, onEditField, onViewEvidence }: Props) {
  const sections = groupPersonFields()
  const filledFields = countFilledFields(person)
  const totalFields = getTotalFields(person)

  return (
    <Card className="glass-card">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar name={person.full_name} size="lg" />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {person.full_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={getConfidenceColor(person.confidence)}
              >
                {person.confidence}% Confidence
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Sections */}
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="text-sm font-semibold">
                {section.label}
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-4">
                {section.fields.map((fieldKey) => (
                  <div key={fieldKey} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3 flex-1">
                      {getFieldIcon(fieldKey)}
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatFieldLabel(fieldKey)}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatFieldValue(person[fieldKey]) || "Not provided"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewEvidence(fieldKey)}
                      title="View evidence"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>

      {/* Footer */}
      <div className="border-t border-white/20 dark:border-gray-700/50 px-6 py-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{person.source_docs.length} documents</span>
        <span>{filledFields}/{totalFields} fields filled</span>
      </div>
    </Card>
  )
}
```

**Mudanças Necessárias:**

1. Instalar Accordion: `npx shadcn@latest add accordion`
2. Usar Card + Accordion
3. Aplicar `.glass-card`
4. Refatorar field rows com flex layout
5. Usar Badge para confidence
6. Usar Button para evidence action
7. Dark mode classes completas

**Glassmorphism:** `.glass-card`

**Tempo Estimado:** 1.5 horas

---

## 📊 Status Components: Refatoração {#status-components}

### CaseStatusBadge.tsx

**Análise Atual:**
- Dropdown com status options
- Color-coded status
- Transitions entre status válidos
- Descriptions

**Plano de Refatoração:**

```tsx
// ANTES
export function CaseStatusBadge({ currentStatus, onStatusChange, allowedTransitions }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="badge-status">
        <StatusIcon status={currentStatus} />
        <span>{formatStatus(currentStatus)}</span>
      </Menu.Button>
      <Transition ...>
        <Menu.Items className="dropdown-menu">
          {allowedTransitions.map(status => (
            <Menu.Item key={status}>
              {({ active }) => (
                <button className={cn("menu-item", active && "active")}>
                  <StatusIcon status={status} />
                  {formatStatus(status)}
                  {status === currentStatus && <CheckIcon />}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

// DEPOIS
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CheckIcon } from "@heroicons/react/24/outline"

export function CaseStatusBadge({ currentStatus, onStatusChange, allowedTransitions }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "cursor-pointer gap-2",
            getStatusBadgeClass(currentStatus)
          )}
        >
          <StatusIcon status={currentStatus} className="w-4 h-4" />
          {formatStatus(currentStatus)}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="glass-popover">
        {allowedTransitions.map(status => (
          <DropdownMenuItem
            key={status}
            onClick={() => onStatusChange(status)}
            className="gap-2"
          >
            <StatusIcon status={status} className="w-4 h-4" />
            <span>{formatStatus(status)}</span>
            {status === currentStatus && <CheckIcon className="w-4 h-4 ml-auto text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getStatusBadgeClass(status: CaseStatus): string {
  const classes = {
    draft: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  }
  return classes[status] || ""
}
```

**Mudanças Necessárias:**
1. Refatorar de Headless UI para ShadCN DropdownMenu
2. Usar Badge como trigger
3. Aplicar `.glass-popover`
4. Status-specific color classes
5. Dark mode classes

**Glassmorphism:** `.glass-popover`

**Tempo Estimado:** 45 minutos

---

## 🔍 Evidence Components: Refatoração {#evidence-components}

### EvidenceModal.tsx

**Análise Atual:**
- Modal com document viewer
- Bounding box overlay
- Box navigation
- Close button

**Plano de Refatoração:**

```tsx
// ANTES
export function EvidenceModal({ isOpen, document, highlightBox, onClose }: Props) {
  return (
    <>
      {isOpen && <div className="modal-backdrop" onClick={onClose} />}
      {isOpen && (
        <div className="evidence-modal glass">
          <div className="evidence-modal-header">
            <h2>Evidence</h2>
            <button onClick={onClose}>×</button>
          </div>
          <div className="evidence-modal-content">
            <DocumentViewer document={document} />
            <BoundingBoxOverlay boxes={[highlightBox]} />
          </div>
        </div>
      )}
    </>
  )
}

// DEPOIS
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function EvidenceModal({ isOpen, document, highlightBox, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-dialog max-w-4xl">
        <DialogHeader>
          <DialogTitle>Evidence</DialogTitle>
        </DialogHeader>

        <div className="relative bg-gray-900 rounded-lg overflow-hidden mt-4">
          <DocumentViewer document={document} />
          <BoundingBoxOverlay boxes={[highlightBox]} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Mudanças Necessárias:**
1. Usar Dialog component (já instalado)
2. Aplicar `.glass-dialog`
3. Manter DocumentViewer
4. Manter BoundingBoxOverlay
5. Dialog gerencia close/escape automaticamente

**Glassmorphism:** `.glass-dialog`

**Tempo Estimado:** 30 minutos

---

## 📝 CSS Consolidação {#css-consolidation}

### Remover Classes Antigas

Após refaturar todos os componentes, remover das classes CSS:

**Classes de Botões a Remover:**
```css
.btn
.btn-primary
.btn-primary-outline
.btn-primary-ghost
.btn-secondary
.btn-secondary-outline
.btn-secondary-ghost
.btn-danger
.btn-danger-outline
.btn-danger-ghost
.btn-ghost
```

**Classes de Cards a Remover:**
```css
.card
.card-hover
.card-expandable
.card-expandable-header
.card-expandable-content
```

**Classes de Dropdowns/Menus a Remover:**
```css
.dropdown-menu
.menu-item
.browser-navigation
.browser-nav-button
```

**Classes de Badges a Remover:**
```css
.badge
.badge-success
.badge-warning
.badge-error
.badge-info
.confidence-badge
.confidence-badge-high
.confidence-badge-medium
.confidence-badge-low
.role-badge
```

**Classes de Modais a Remover:**
```css
.evidence-modal-backdrop
.evidence-modal
.evidence-modal-header
.evidence-modal-content
.modal-backdrop
```

**Manter Classes de:**
- React Flow customization (`.react-flow__*`)
- SVG elements (`.highlight-box`, `.bounding-box-overlay`)
- Pending items (`.pending-highlight`, `.pending-item-highlight`)
- Glassmorphism (`.glass*` - manter e otimizar)
- Utilities (`.sr-only`, animations)

---

## ✅ Checklist de Implementação {#checklist}

### Fase 1: Preparação ✅ COMPLETO
- [x] Instalar ShadCN
- [x] Configurar componentes base
- [x] Adicionar glassmorphism
- [x] Documentação

### Fase 2: Componentes Base
- [ ] Avatar.tsx
  - [ ] Adicionar className prop
  - [ ] Teste dark mode
  - [ ] Teste com glassmorphism

- [ ] AvatarGroup.tsx
  - [ ] Teste com Avatar refatorado

- [ ] Breadcrumb.tsx
  - [ ] Refatorar com Tailwind semantics
  - [ ] Manter accessibility
  - [ ] Teste dark mode

- [ ] BrowserNavigation.tsx
  - [ ] Usar Button component
  - [ ] Manter shortcuts
  - [ ] Teste accessibility

- [ ] UserProfileDropdown.tsx
  - [ ] Instalar dropdown-menu ShadCN
  - [ ] Refatorar com ShadCN
  - [ ] Aplicar .glass-popover
  - [ ] Teste dark mode

- [ ] ExpandableCard.tsx
  - [ ] Usar Card component
  - [ ] Aplicar .glass-card
  - [ ] Manter controlled/uncontrolled
  - [ ] Adicionar keyboard nav

- [ ] DeleteConfirmationModal.tsx
  - [ ] Usar Dialog component
  - [ ] Aplicar .glass-dialog
  - [ ] Manter funcionalidade

- [ ] Pagination.tsx
  - [ ] Usar Button components
  - [ ] Adicionar aria-labels
  - [ ] Teste accessibility

- [ ] SortControls.tsx
  - [ ] Usar Button components
  - [ ] Adicionar icons
  - [ ] Teste funcionalidade

**Checkpoint:** Todos componentes common refatorados
**Teste:** Rodas de teste em todas funções

---

### Fase 3: Status & Feedback
- [ ] CaseStatusBadge.tsx
  - [ ] Instalar dropdown-menu
  - [ ] Refatorar com ShadCN
  - [ ] Aplicar .glass-popover
  - [ ] Status color classes

- [ ] DocumentStatusBadge.tsx
  - [ ] Refatorar com Badge
  - [ ] Manter icons

- [ ] ProcessingStatusPanel.tsx
  - [ ] Instalar progress ShadCN
  - [ ] Usar Progress component
  - [ ] Aplicar .glass-card
  - [ ] Teste animations

**Checkpoint:** Status components prontos
**Teste:** Transições de status, cores, dark mode

---

### Fase 4: Layout
- [ ] DashboardLayout.tsx
  - [ ] Refatorar sidebar com Card
  - [ ] Aplicar .glass-card
  - [ ] Header com .glass-card
  - [ ] Manter responsividade
  - [ ] Teste mobile/desktop
  - [ ] Teste dark mode

**Checkpoint:** Layout principal funcional
**Teste:** Responsividade, sidebar toggle, navigation

---

### Fase 5: Entities
- [ ] Instalar accordion ShadCN

- [ ] PersonEntityCard.tsx
  - [ ] Usar Card + Accordion
  - [ ] Aplicar .glass-card
  - [ ] Refatorar field rows
  - [ ] Manter evidence links

- [ ] PropertyEntityCard.tsx
  - [ ] Similar a PersonEntityCard
  - [ ] Property-specific fields

- [ ] EntityTable.tsx
  - [ ] Instalar table ShadCN
  - [ ] Refatorar com Table
  - [ ] Aplicar .glass-card wrapper
  - [ ] Teste sorting/filtering

**Checkpoint:** Entity components refatorados
**Teste:** Expand/collapse, evidence viewing, dark mode

---

### Fase 6: Evidence
- [ ] EvidenceModal.tsx
  - [ ] Usar Dialog component
  - [ ] Aplicar .glass-dialog
  - [ ] Manter document viewer

- [ ] DocumentViewer.tsx
  - [ ] Otimizar sem mudanças visuais
  - [ ] Adicionar glass border

- [ ] BoundingBoxOverlay.tsx
  - [ ] Otimizar SVG
  - [ ] Manter funcionalidade

**Checkpoint:** Evidence modal funcional
**Teste:** Document viewing, bounding boxes, dark mode

---

### Fase 7: Canvas
- [ ] Instalar Dropdown-Menu ShadCN (já instalado)

- [ ] PersonNode.tsx
  - [ ] Usar Card component
  - [ ] Aplicar .glass-card
  - [ ] Ring states para selected

- [ ] PropertyNode.tsx
  - [ ] Similar a PersonNode

- [ ] EditPersonModal.tsx
  - [ ] Usar Dialog + Form pattern
  - [ ] Aplicar .glass-dialog

- [ ] EditPropertyModal.tsx
  - [ ] Similar a EditPersonModal

- [ ] ContextMenu.tsx
  - [ ] Refatorar com Dropdown
  - [ ] Aplicar .glass-popover

- [ ] SuggestionsPanel.tsx
  - [ ] Usar Card component
  - [ ] Aplicar .glass-card

**Checkpoint:** Canvas components modernizados
**Teste:** Node rendering, edit modals, context menu, suggestions

---

### Fase 8: Editor & Chat
- [ ] TiptapEditor.tsx
  - [ ] Refatorar toolbar com Button
  - [ ] Manter editor funcionalidade

- [ ] ChatPanel.tsx
  - [ ] Usar Card + Input pattern
  - [ ] Aplicar .glass-card

- [ ] ChatMessage.tsx
  - [ ] Usar Card pattern
  - [ ] Aplicar .glass-card

**Checkpoint:** Editor e chat refatorados
**Teste:** Editing, chat sending, message display, dark mode

---

### Fase 9: Consensus
- [ ] ConflictCard.tsx
  - [ ] Usar Card + Accordion
  - [ ] Aplicar .glass-card
  - [ ] Confidence badges
  - [ ] Custom value input

- [ ] ConflictCardCompact.tsx
  - [ ] Versão list variant

**Checkpoint:** Conflict resolution UI modernizada
**Teste:** Expand conflicts, confidence display, resolution

---

### Fase 10: Upload & Case
- [ ] DocumentDropzone.tsx
  - [ ] Refatorar com Card border-dashed
  - [ ] Aplicar .glass-card

- [ ] CreateCaseModal.tsx
  - [ ] Usar Dialog + Form
  - [ ] Aplicar .glass-dialog

**Checkpoint:** Upload e criação prontos
**Teste:** File dropping, form submission, dark mode

---

### Fase 11-12: Páginas
- [ ] DashboardPage.tsx
  - [ ] Usar componentes refatorados
  - [ ] Teste layout overall

- [ ] UploadPage.tsx
  - [ ] Usar DocumentDropzone refatorado

- [ ] EntitiesPage.tsx
  - [ ] Usar EntityCard refatorado

- [ ] CanvasPage.tsx
  - [ ] Usar canvas components refatorados

- [ ] DraftPage.tsx
  - [ ] Usar Editor + Chat refatorados

- [ ] ConflictReviewPage.tsx
  - [ ] Usar ConflictCard refatorado

- [ ] HistoryPage.tsx
  - [ ] Usar Table component

- [ ] CaseOverviewPage.tsx
  - [ ] Usar status components refatorados

- [ ] LoginPage.tsx
  - [ ] Refatorar com ShadCN Form

- [ ] Test* Pages (25 pages)
  - [ ] Atualizar para componentes refatorados

**Checkpoint:** Todas páginas funcionando
**Teste:** Navegação completa, funcionalidades, dark mode, responsividade

---

### Fase 13: CSS Consolidação
- [ ] Identificar CSS não utilizado
- [ ] Remover classes antigas
- [ ] Otimizar index.css
- [ ] Validar dark mode
- [ ] Verificar perf

**Checkpoint:** CSS limpo e otimizado

---

### Fase 14: Testes QA
- [ ] Regressão funcional completa
  - [ ] Upload documents
  - [ ] Manage entities
  - [ ] Canvas relationships
  - [ ] Draft editing
  - [ ] Chat operations
  - [ ] Conflict resolution

- [ ] Acessibilidade
  - [ ] WCAG AA compliance
  - [ ] Keyboard navigation
  - [ ] Screen reader testing

- [ ] Responsividade
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)

- [ ] Dark Mode
  - [ ] Todos componentes
  - [ ] Transição smooth
  - [ ] Contrast ratios

- [ ] Performance
  - [ ] Lighthouse audit
  - [ ] Bundle size
  - [ ] Load time
  - [ ] Rendering performance

**Checkpoint:** Tudo funcionando perfeitamente
**Release:** Refatoração completa pronta para produção

---

## 📚 Componentes ShadCN a Instalar

### Já Instalados ✅
```bash
✅ button
✅ card
✅ input
✅ label
✅ dialog
```

### Precisa Instalar

```bash
# Fase 3-4
npx shadcn@latest add dropdown-menu
npx shadcn@latest add progress
npx shadcn@latest add badge

# Fase 5
npx shadcn@latest add accordion
npx shadcn@latest add table

# Fase 8
npx shadcn@latest add separator
npx shadcn@latest add scroll-area

# Fase 10-11
npx shadcn@latest add form
npx shadcn@latest add select

# Optional (Para futuros melhoramentos)
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add tooltip
npx shadcn@latest add popover
```

---

## 🎯 Padrão de Desenvolvimento Futuro

Após refatoração completa, seguir este padrão para NOVOS componentes:

```tsx
// NOVO COMPONENTE - Pattern
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NewComponentProps {
  title: string
  onAction?: () => void
  className?: string
}

export function NewComponent({ title, onAction, className }: NewComponentProps) {
  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onAction}>Action</Button>
      </CardContent>
    </Card>
  )
}
```

**Checklist para novos componentes:**
- [ ] Usar ShadCN components
- [ ] Aplicar glassmorphism (.glass-*)
- [ ] Aceitar className prop
- [ ] Suportar dark mode (automático)
- [ ] TypeScript props interface
- [ ] Acessibilidade (ARIA, keyboard nav)
- [ ] Testes no componente
- [ ] Documentar uso

---

## 📞 Contatos & Referências

**Documentação:**
- CLAUDE.md - Design System Guidelines
- app_spec.txt - Technical Specifications
- components.json - ShadCN Configuration

**Recursos:**
- [ShadCN UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Radix UI Docs](https://www.radix-ui.com)
- [Heroicons](https://heroicons.com)

---

## 🚀 Próximas Etapas

1. **Iniciar Fase 2** - Refatorar componentes base
2. **Seguir checklist** - Usar este documento como referência
3. **Fazer testes** - Testar cada fase completamente
4. **Documentar** - Manter este arquivo atualizado
5. **Deploy** - Quando tudo pronto, fazer deploy com confiança

---

**Última atualização:** 2025-12-24
**Status:** Pronto para implementação
**Próxima revisão:** Após Fase 5
