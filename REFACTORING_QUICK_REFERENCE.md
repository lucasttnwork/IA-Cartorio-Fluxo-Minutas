# ⚡ Quick Reference: ShadCN + Glassmorphism

Consulta rápida durante refatoração. Para detalhes completos, ver `REFACTORING_SHADCN_GLASSMORPHISM.md`.

---

## 🗂️ Estrutura de Arquivos Importante

```
src/
├── components/
│   ├── ui/              ← ShadCN components aqui
│   ├── common/          ← Componentes custom reutilizáveis
│   ├── canvas/          ← Canvas-specific
│   ├── chat/            ← Chat components
│   ├── entities/        ← Entity cards
│   ├── evidence/        ← Evidence modal
│   ├── status/          ← Status badges
│   ├── layout/          ← Layout components
│   └── ...
├── lib/
│   └── utils.ts         ← cn() utility aqui
├── styles/
│   └── index.css        ← Glassmorphism classes aqui
└── pages/
```

---

## 🎨 Glassmorphism Classes

```css
.glass              /* backdrop-blur-md, 80% opacity */
.glass-card         /* Para cards padrão */
.glass-strong       /* Para modais (90% opacity, blur-xl) */
.glass-subtle       /* Para backgrounds (60% opacity, blur-sm) */
.glass-dialog       /* Para dialogs (95% opacity, blur-xl) */
.glass-popover      /* Para menus/dropdowns */
.glass-gradient     /* Com gradient backgrounds */
.glass-elevated     /* Cards destacados com shadow-2xl */
```

---

## 🔄 Refactoring Pattern Rápido

### Padrão 1: Card Component

**Antes:**
```tsx
<div className="card card-hover">
  <h3>{title}</h3>
  <p>{content}</p>
</div>
```

**Depois:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card className="glass-card">
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>{content}</CardContent>
</Card>
```

---

### Padrão 2: Button Component

**Antes:**
```tsx
<button className="btn btn-primary">Click</button>
<button className="btn btn-outline">Outline</button>
<button className="btn btn-danger">Delete</button>
```

**Depois:**
```tsx
import { Button } from "@/components/ui/button"

<Button>Click</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
```

---

### Padrão 3: Dialog/Modal

**Antes:**
```tsx
{isOpen && (
  <div className="modal-backdrop">
    <div className="modal glass">Content</div>
  </div>
)}
```

**Depois:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="glass-dialog">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

---

### Padrão 4: Dropdown/Menu

**Antes:**
```tsx
<Menu as="div">
  <Menu.Button className="btn">Menu</Menu.Button>
  <Menu.Items>
    <Menu.Item>{/* item */}</Menu.Item>
  </Menu.Items>
</Menu>
```

**Depois:**
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="glass-popover">
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Padrão 5: Expandable/Accordion

**Antes:**
```tsx
<div className="card-expandable">
  <div onClick={toggle}>{title}</div>
  {open && <div>{content}</div>}
</div>
```

**Depois:**
```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

<Card className="glass-card">
  <Accordion>
    <AccordionItem value="section1">
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{content}</AccordionContent>
    </AccordionItem>
  </Accordion>
</Card>
```

---

## 📦 ShadCN Components Disponíveis

### ✅ Instalados
- `button` - Botões com variantes
- `card` - Cards com header/content
- `input` - Inputs de texto
- `label` - Labels para forms
- `dialog` - Modais/Dialogs
- `dropdown-menu` - Menus dropdown
- `progress` - Progress bars
- `badge` - Badges/labels
- `accordion` - Accordions/collapsible
- `table` - Tabelas

### 📋 Instalar Conforme Necessário
```bash
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add tabs
npx shadcn@latest add alert
npx shadcn@latest add toast
```

---

## 🎯 Componentes por Complexidade

### Simples (< 30 min)
- Avatar.tsx
- AvatarGroup.tsx
- Pagination.tsx
- SortControls.tsx
- BrowserNavigation.tsx
- DocumentStatusBadge.tsx

### Médio (30 min - 1 hora)
- Breadcrumb.tsx
- ExpandableCard.tsx
- DeleteConfirmationModal.tsx
- UserProfileDropdown.tsx
- CaseStatusBadge.tsx
- DocumentDropzone.tsx
- CreateCaseModal.tsx

### Complexo (1-2 horas)
- DashboardLayout.tsx
- PersonEntityCard.tsx
- PropertyEntityCard.tsx
- EvidenceModal.tsx
- TiptapEditor.tsx
- ChatPanel.tsx
- ConflictCard.tsx

### Muito Complexo (2+ horas)
- PersonNode.tsx + EditPersonModal.tsx
- PropertyNode.tsx + EditPropertyModal.tsx
- CanvasPage.tsx
- DraftPage.tsx
- EntitiesPage.tsx

---

## 🏗️ Structural Changes

### Sempre Mudar
```tsx
// Import ShadCN components
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Use className instead of inline styles
className={cn("glass-card", customClass)}

// Use Tailwind utilities instead of custom CSS classes
className="flex items-center gap-2"

// Use component props instead of creating wrappers
<Button variant="outline" size="sm">Click</Button>
```

### Nunca Remover
```tsx
// Manter TypeScript types
interface MyComponentProps { ... }

// Manter lógica de negócio
const [state, setState] = useState(...)
useEffect(...)

// Manter acessibilidade
aria-label="..."
role="button"
tabIndex={0}
onKeyDown={handleKeyboard}

// Manter funcionalidade
onClick handlers
onChange handlers
API calls
```

---

## 🌙 Dark Mode Checklist

ShadCN cuida automaticamente via CSS variables, mas verificar:

- [ ] Componentes têm `dark:` classes quando necessário
- [ ] Backgrounds não são muito claros/escuros no dark mode
- [ ] Text contrast é adequado (WCAG AA)
- [ ] Borders visíveis em ambos modos
- [ ] Glassmorphism funciona em dark mode

**Glassmorphism dark mode é automático:**
```tsx
.glass-card  /* Aplica dark:bg-gray-900/80 automaticamente */
.glass-dialog /* Aplica dark:bg-gray-900/95 automaticamente */
```

---

## ⚙️ Utility: cn() Function

Use `cn()` para combinar classes dinamicamente:

```tsx
import { cn } from "@/lib/utils"

// Combinar classes
className={cn("glass-card", "p-4")}

// Condicional
className={cn(
  "glass-card",
  isActive && "ring-2 ring-blue-500",
  disabled && "opacity-50"
)}

// Props
<MyComponent className={cn("custom-class", props.className)} />
```

---

## 📋 Component Checklist

Ao refatorar cada componente:

- [ ] Remover classes CSS customizadas
- [ ] Usar ShadCN components
- [ ] Aplicar glassmorphism (`.glass-*`)
- [ ] Usar `cn()` utility
- [ ] Aceitar `className` prop
- [ ] Dark mode funciona
- [ ] Acessibilidade mantida (ARIA, keyboard)
- [ ] TypeScript types corretos
- [ ] Props interface documentada
- [ ] Testes executam sem erro

---

## 🔍 Debugging

### Component não está com glassmorphism?
- [ ] Adicionou `className="glass-card"`?
- [ ] Componente está com `className` prop?
- [ ] CSS variables estão definidas no index.css?

### Dark mode não funciona?
- [ ] Está togglando `.dark` no html root?
- [ ] Componentes ShadCN têm dark: classes?
- [ ] Verificou contrast ratios?

### Performance lenta?
- [ ] Removeu Framer Motion desnecessário?
- [ ] Verificou re-renders com React DevTools?
- [ ] CSS não tem inline styles pesados?

---

## 📊 Comparison Table: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Base Components | Custom CSS | ShadCN + Tailwind |
| Button Variants | 9 classes (.btn-primary, etc.) | 6 variants (default, outline, etc.) |
| Card Styling | .card, .card-hover | Card component + .glass-card |
| Modal | Custom div + backdrop | Dialog component + .glass-dialog |
| Dropdown | Headless UI Menu | ShadCN Dropdown |
| Dark Mode | Manual dark: classes | CSS variables (automático) |
| Glassmorphism | Não tinha | Todos componentes |
| Accessibility | Implementado manual | Radix UI built-in |

---

## 📈 Fases: Resumido

```
Fase 1 ✅  → Preparação (ShadCN setup)
Fase 2-4 → Componentes base + layout (11-16h) 🔴
Fase 5-13 → Features + páginas (27-35h) 🟡
Fase 14 → CSS consolidação (2-3h) 🟢
Fase 15 → QA completo (4-6h) 🔴

Total: 45-65 horas (~1-2 semanas)
```

---

## 🚀 Começar Agora

1. **Abra REFACTORING_SHADCN_GLASSMORPHISM.md** - Documento completo
2. **Escolha uma fase** - Recomendado: Fase 2 (Componentes Base)
3. **Siga o padrão** - Use code examples como template
4. **Teste incrementalmente** - Teste após cada componente
5. **Marque no checklist** - `REFACTORING_SHADCN_GLASSMORPHISM.md`

---

## 💬 Quick Tips

- **Tá difícil?** → Veja exemplos no documento completo
- **Não sabe qual component usar?** → Ver "Componentes: Mapeamento ShadCN"
- **Que classe glassmorphism usar?** → Ver "Padrões de Implementação"
- **Qual é a prioridade?** → Ver "Fases de Implementação"
- **Falta um component ShadCN?** → `npx shadcn@latest add <nome>`

---

**Última atualização:** 2025-12-24
**Próxima etapa:** Iniciar Fase 2
