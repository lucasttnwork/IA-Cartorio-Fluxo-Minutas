# Minuta Canvas

**Document Processing & Draft Generation System for Notary Offices**

Transform bulk document uploads into structured, auditable legal drafts with AI-powered extraction, visual relationship mapping, and conversational editing.

## Overview

Minuta Canvas is a complete document processing system that:

- **Extracts** people and properties from documents using dual extraction (OCR + AI)
- **Validates** through a consensus engine that compares results
- **Visualizes** relationships on an infinite canvas
- **Generates** drafts with explicit pending items
- **Enables** conversational editing with full audit trail

The system follows the principle: **"No evidence = no auto-fill"** ensuring reliability and traceability.

## Features

### Document Processing
- Bulk upload via drag-and-drop
- Support for PDF and images
- Automatic document type detection (CNH, RG, marriage certificate, deed, proxy)
- Dual extraction: Google Document AI OCR + Gemini AI
- Consensus engine for high-confidence results

### Entity Management
- Automatic creation of Person and Property cards
- Confidence indicators and evidence links
- Entity deduplication and merge capabilities
- Source document tracking

### Visual Canvas
- Infinite canvas with pan/zoom (React Flow)
- Drag-and-drop node positioning
- Visual connection of relationships:
  - Seller/Buyer roles
  - Spouse relationships
  - Proxy/Representative links
  - Property ownership and transfer

### Draft Generation
- Template-based generation for act types
- Section-based structure
- Pending items highlighted (never invented)
- Version control

### Conversational Editing
- Chat panel alongside draft editor
- Natural language requests for changes
- Function calling for structured operations
- Real-time section regeneration
- Complete audit trail

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Framer Motion for animations
- React Flow (Xyflow) for infinite canvas
- Tiptap for rich text editing
- Zustand for state management

### Backend (Supabase)
- PostgreSQL with Row Level Security
- Supabase Auth for authentication
- Supabase Storage for documents
- Supabase Realtime for live updates
- Supabase Queues (pgmq) for job processing
- Supabase Vault for secrets

### Worker Service
- Node.js with TypeScript (containerized)
- Google Document AI for OCR
- Gemini API for AI extraction
- Consensus engine
- Entity resolution

### AI Services (Google)
- Document AI - Enterprise Document OCR
- Gemini Flash - Multimodal extraction
- Gemini Pro - Draft generation
- Structured Outputs (JSON Schema)
- Function Calling
- Context Caching

## Project Structure

```
minuta-canvas/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── canvas/         # Infinite canvas components
│   │   ├── chat/           # Chat panel components
│   │   ├── common/         # Shared UI components
│   │   ├── documents/      # Document upload/view
│   │   ├── draft/          # Draft editor components
│   │   ├── entities/       # Person/Property cards
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   ├── services/           # API service layer
│   ├── stores/             # Zustand stores
│   ├── styles/             # Global styles
│   └── types/              # TypeScript types
├── supabase/               # Supabase configuration
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
├── worker/                 # Background worker service
│   └── src/
│       ├── jobs/           # Job handlers
│       ├── services/       # External service integrations
│       └── utils/          # Utilities
├── public/                 # Static assets
├── feature_list.json       # Test cases (200+)
├── init.sh                 # Development setup script
└── app_spec.txt            # Project specification
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Google Cloud account with Document AI
- Gemini API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/lucasttnwork/IA-Cartorio-Fluxo-Minutas.git
   cd IA-Cartorio-Fluxo-Minutas
   ```

2. **Run the setup script**
   ```bash
   chmod +x init.sh
   ./init.sh
   ```

   On Windows, use Git Bash, WSL, or run commands manually.

3. **Configure environment variables**

   Copy `.env.local` and fill in your credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   GEMINI_API_KEY=your-gemini-key
   GOOGLE_PROJECT_ID=your-project-id
   DOCUMENT_AI_PROCESSOR_ID=your-processor-id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**

   Navigate to `http://localhost:5173`

### Database Setup

If using Supabase CLI for local development:

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

### Worker Service

The worker service handles heavy processing:

```bash
cd worker
npm install
npm run dev
```

## Architecture

### Data Flow

1. **Upload** - Documents stored in Supabase Storage
2. **Queue** - Processing jobs enqueued in pgmq
3. **OCR** - Document AI extracts text + layout
4. **AI Extraction** - Gemini extracts structured data
5. **Consensus** - Compare OCR vs AI results
6. **Entity Resolution** - Create/merge entities
7. **Canvas** - User defines relationships
8. **Draft** - Generate from canonical model
9. **Chat** - Edit via structured operations

### Security

- Row Level Security (RLS) on all tables
- Signed URLs for document access
- Vault for secret storage
- Role-based access control

## Testing

The project includes 200+ test cases in `feature_list.json`:

- **Functional tests** - Core feature verification
- **Style tests** - UI/UX design compliance

Tests cover:
- Authentication flows
- Document processing
- Entity extraction and management
- Canvas interactions
- Draft generation and editing
- Audit trail verification
- Responsive design
- Accessibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
