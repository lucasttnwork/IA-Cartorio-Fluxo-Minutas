# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minuta Canvas is a document processing and legal draft generation system for Brazilian notary offices (cartórios). It transforms bulk document uploads (IDs, deeds, certificates) into structured, auditable legal drafts using AI-powered extraction.

**Core principle:** "No evidence = no auto-fill" - all extracted data must be traceable to source documents.

## Commands

### Frontend (root directory)
```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # TypeScript check + production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript without emit
npm run preview      # Preview production build
```

### Worker Service (worker/ directory)
```bash
cd worker
npm run dev          # tsx watch mode for job processor
npm run build        # Compile TypeScript
npm run start        # Run compiled worker
```

### Supabase (requires Supabase CLI)
```bash
supabase start                                    # Start local Supabase
supabase db push                                  # Apply migrations
supabase gen types typescript --local > src/types/database.ts  # Generate types
```

## Architecture

### Two-Service Architecture
1. **Frontend (src/)**: React SPA with React Flow canvas for visual relationship mapping
2. **Worker (worker/)**: Node.js background processor that polls `processing_jobs` table

### Data Processing Pipeline
Documents flow through five sequential job types (defined in `worker/src/jobs/`):
1. `ocr` - Google Document AI extracts text + layout blocks
2. `extraction` - Gemini Flash extracts structured JSON from images
3. `consensus` - Compares OCR vs LLM results, marks conflicts as pending
4. `entity_resolution` - Creates/merges Person and Property entities (dedupes by CPF)
5. `draft` - Generates legal document from canonical data model

### State Management
- **Zustand store** (`src/stores/caseStore.ts`): Manages current case, documents, people, properties, edges, and draft
- **React Query**: Server state and caching (5-minute stale time)
- **Canonical data model**: The graph (people + properties + edges) is the source of truth; drafts are rendered from it

### Key Database Tables
- `cases`: Links everything; contains `canonical_data` JSONB with the case's resolved state
- `graph_edges`: Relationship graph (spouse_of, represents, owns, sells, buys, etc.)
- `evidence`: Links every extracted field back to document/page/bounding box
- `processing_jobs`: Job queue polled by worker (status: pending → processing → completed/failed)
- `operations_log`: Immutable audit trail for all draft changes

### Route Structure
All case-specific routes follow `/case/:caseId/*`:
- `/upload` - Document upload (drag-and-drop)
- `/entities` - Person/Property cards management
- `/canvas` - React Flow infinite canvas for relationships
- `/draft` - Tiptap editor with chat panel
- `/history` - Audit log viewer

## Technology Choices

### Frontend Stack
- React 18 + TypeScript + Vite
- @xyflow/react (React Flow v12) for infinite canvas
- Tiptap for rich text draft editing
- Framer Motion for animations
- TailwindCSS

### Backend Stack
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Google Document AI (Enterprise OCR)
- Google Gemini (Flash for extraction, Pro for draft generation)

### AI Integration Patterns
- All LLM outputs use **Structured Outputs (JSON Schema)** for predictable parsing
- Chat edits use **function calling** to produce structured operations, not free text
- Context caching for repeated queries on same documents

## Brazilian Legal Document Types

Document types handled (`DocumentType` in `src/types/index.ts`):
- `cnh` - Driver's license (Carteira Nacional de Habilitação)
- `rg` - National ID (Registro Geral)
- `marriage_cert` - Marriage certificate
- `deed` - Property deed (escritura)
- `proxy` - Power of attorney (procuração)
- `iptu` - Property tax document
- `birth_cert` - Birth certificate

Act types supported: `purchase_sale`, `donation`, `exchange`, `lease`

## Environment Variables

Copy `.env.example` to `.env.local`. Required:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` - Frontend Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - Worker service role (bypasses RLS)
- `GOOGLE_PROJECT_ID`, `DOCUMENT_AI_PROCESSOR_ID` - Document AI
- `GEMINI_API_KEY` - Gemini API

## UI Refactoring Guide

**Complete refactoring documentation available in:** `REFACTORING_SHADCN_GLASSMORPHISM.md`

This file contains:
- Comprehensive inventory of all 38 components and 33 pages
- Step-by-step refactoring guide for each component
- Implementation patterns and best practices
- Complete checklist for 15 phases of refactoring
- Before/after code examples
- Glassmorphism application patterns
- CSS consolidation strategy
- QA testing procedures

**Quick Links:**
- [Refactoring Overview](REFACTORING_SHADCN_GLASSMORPHISM.md#visão-geral)
- [Implementation Phases](REFACTORING_SHADCN_GLASSMORPHISM.md#fases)
- [Component Refactoring Guide](REFACTORING_SHADCN_GLASSMORPHISM.md#componentes-mapeamento)
- [Implementation Checklist](REFACTORING_SHADCN_GLASSMORPHISM.md#checklist)

---

## Design System & UI Guidelines

### ShadCN UI Integration
The project uses **ShadCN UI** as the component foundation with custom **Glassmorphism** styling for a modern, transparent aesthetic.

**Component Structure:**
- **ShadCN Components** (`src/components/ui/`): Base components from ShadCN UI library (Button, Card, Dialog, Input, etc.)
- **Custom Components** (`src/components/common/`): Project-specific reusable components (Avatar, Pagination, etc.)
- **Feature Components** (`src/components/{canvas,case,chat,etc.}/`): Feature-specific UI organized by domain

**Key Utilities:**
- `cn()` utility (`src/lib/utils.ts`): Merge Tailwind classes without conflicts
  ```typescript
  import { cn } from "@/lib/utils"
  <div className={cn("base-class", condition && "conditional-class")} />
  ```

**Configuration Files:**
- `components.json`: ShadCN configuration (style: new-york, cssVariables: true)
- `tailwind.config.js`: Extended with ShadCN theme colors and animation plugin
- `src/styles/index.css`: CSS variables for theming + glassmorphism utility classes

### Glassmorphism Design Language

**Core Principle:** Create depth and hierarchy through transparency, subtle blur effects, and refined shadows. All glassmorphism classes support dark mode automatically.

**Available Glassmorphism Classes:**
- `.glass` - Standard glassmorphism with medium blur (80% opacity, backdrop-blur-md)
- `.glass-card` - Cards with glassmorphism styling (rounded, border, shadow-xl)
- `.glass-strong` - Heavy blur for modals and overlays (90% opacity, backdrop-blur-xl)
- `.glass-subtle` - Light blur for secondary elements (60% opacity, backdrop-blur-sm)
- `.glass-dialog` - Dialogs with strong blur (95% opacity, strong border definition)
- `.glass-popover` - Popovers and tooltips (medium blur with shadow-2xl)
- `.glass-gradient` - Glassmorphism with gradient backgrounds
- `.glass-elevated` - Elevated cards with ring borders and strong shadow

**Usage Patterns:**

1. **Cards and Containers:**
```tsx
import { Card, CardContent } from "@/components/ui/card"

<Card className="glass-card">
  <CardContent>Content goes here</CardContent>
</Card>
```

2. **Dialogs and Modals:**
```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog"

<DialogContent className="glass-dialog">
  Modal content with glassmorphic background
</DialogContent>
```

3. **Custom Glassmorphism with ShadCN Components:**
```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

<Button className={cn("glass-card", "px-6 py-4")}>
  Glassmorphic Button
</Button>
```

**Design Guidelines:**
- Use **glassmorphism for elevated UI elements** (cards, modals, popovers, overlays)
- Maintain **WCAG AA accessibility compliance** - existing standard enforced
- Combine ShadCN component variants with glassmorphism classes using `cn()` utility
- Prefer `.glass-card` for standard cards, `.glass-dialog` for modals/overlays
- Use `.glass-subtle` for background panels, `.glass-strong` for focused content
- Test in both light and dark modes (toggle via `class="dark"` on root element)

**Dark Mode Support:**
- All glassmorphism classes automatically adapt to dark mode
- Dark mode uses `dark:bg-gray-900/XX` opacity variants
- CSS variables switch automatically when `.dark` class is applied
- Example: `.glass-card` uses `dark:border-gray-700/50` in dark mode

### Icon Libraries

**Primary Library:** Heroicons (`@heroicons/react`)
- Continue using for consistency with existing design
- 24px outline and solid variants available
- `import { DocumentIcon } from '@heroicons/react/24/outline'`

**Secondary Library:** Lucide React (`lucide-react`)
- Available via ShadCN components
- Use when Heroicons icon doesn't exist
- `import { FileText } from 'lucide-react'`

Both libraries coexist. Use Heroicons for custom components to maintain visual consistency.

### When Building New Components

1. **Check ShadCN first:** Use `npx shadcn@latest add <component-name>` if available
2. **Apply glassmorphism:** Add `.glass-*` classes as needed for visual style
3. **Use `cn()` utility:** For dynamic className composition
4. **Maintain accessibility:** Follow WCAG AA standards (existing requirement)
5. **Test dark mode:** Ensure components work in both light/dark themes
6. **Document evidence:** Link UI elements to source documents when applicable

### Component Installation Reference

**Commonly needed ShadCN components:**
```bash
# Layout & Structure
npx shadcn@latest add separator scroll-area tabs

# Forms
npx shadcn@latest add select checkbox radio-group switch

# Overlays
npx shadcn@latest add dropdown-menu popover tooltip

# Feedback
npx shadcn@latest add badge alert toast

# Data Display
npx shadcn@latest add table avatar skeleton
```

### Migration Strategy

- **Existing custom components:** Keep in `src/components/common/` - no immediate changes required
- **New features:** Use ShadCN components + glassmorphism styling
- **Refactoring:** Gradually replace custom components with ShadCN equivalents as needed
- **CSS classes:** Existing custom classes (`.btn-primary`, `.card`, etc.) remain functional

The goal is **progressive enhancement**, not a hard cutover.
