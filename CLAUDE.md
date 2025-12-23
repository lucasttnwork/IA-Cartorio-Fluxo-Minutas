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
