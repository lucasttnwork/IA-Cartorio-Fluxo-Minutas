# Draft Generation Job Documentation - START HERE

## You Have 6 Comprehensive Documents

```
📚 DOCUMENTATION SUITE
│
├─ 🎯 START_HERE.md (this file)
│  └─ Quick navigation guide
│
├─ 📖 DRAFT_GENERATION_README.md (15 min read)
│  └─ Quick reference and overview
│
├─ 🔬 DRAFT_GENERATION_ANALYSIS.md (45 min read)
│  └─ Detailed technical implementation
│
├─ 📊 DRAFT_GENERATION_FLOW.md (25 min read)
│  └─ Flow diagrams and architecture
│
├─ 💡 DRAFT_GENERATION_EXAMPLES.md (30 min read)
│  └─ Six real-world scenarios with data
│
├─ 🗺️ DRAFT_GENERATION_INDEX.md (5 min read)
│  └─ Navigation index by topic
│
└─ 📋 DRAFT_GENERATION_SUMMARY.md (10 min read)
   └─ Summary of all documentation
```

## What You Need to Know (2 Minutes)

### The Job
Transforms canonical data (people, properties, relationships, deal) → Professional Brazilian legal deed (Escritura Pública)

### Location
`worker/src/jobs/draft.ts`

### AI Model
Google Gemini 3 Pro Preview

### Output
7-section legal document with automatic versioning

### Key Principle
**"No evidence = no auto-fill"** - Missing data explicitly marked `[PENDING]`

## Choose Your Reading Path

### 🚀 Fast Track (30 minutes)
1. **README** - Overview (15 min)
2. **FLOW** - Diagrams (15 min)

**Result**: Working understanding of the system

---

### 🏗️ Architecture Review (45 minutes)
1. **README** - Quick reference (15 min)
2. **FLOW** - All diagrams (20 min)
3. **EXAMPLES** - Example 1 (10 min)

**Result**: Understanding of system design and flow

---

### 🔧 Implementation (90 minutes)
1. **README** - All sections (20 min)
2. **ANALYSIS** - Core processing (45 min)
3. **EXAMPLES** - Two examples (15 min)
4. **INDEX** - Reference (10 min)

**Result**: Can modify and debug the code

---

### 🐛 Troubleshooting (60 minutes)
1. **README** - Troubleshooting section (10 min)
2. **EXAMPLES** - All 6 scenarios (30 min)
3. **ANALYSIS** - Error handling (20 min)

**Result**: Can diagnose and fix issues

---

### 🎓 Expert Mastery (3-4 hours)
Read all documents in order:
1. README (20 min)
2. ANALYSIS (45 min)
3. FLOW (25 min)
4. EXAMPLES (35 min)
5. INDEX (10 min)
6. SUMMARY (10 min)

**Result**: Complete expert understanding

## Document Map by Purpose

### Understanding How It Works
- 📖 README - "Processing Pipeline" section
- 🔬 ANALYSIS - "Core Processing Steps"
- 📊 FLOW - "Draft Generation Job Internals"

### Understanding the Data
- 📖 README - "Core Concepts" section
- 🔬 ANALYSIS - "Input: Canonical Data Model"
- 💡 EXAMPLES - All 6 examples with complete data

### Understanding Validation
- 📖 README - "Validation System" section
- 🔬 ANALYSIS - "Validation & Pending Items"
- 📊 FLOW - "Validation Rules"
- 💡 EXAMPLES - Example 2 and 3

### Understanding Error Handling
- 📖 README - "Error Handling" section
- 🔬 ANALYSIS - "Error Handling"
- 📊 FLOW - "Error Handling Paths"
- 💡 EXAMPLES - Example 4 and 5

### Understanding Architecture
- 📊 FLOW - "High-Level Data Flow"
- 📊 FLOW - "Database Schema"
- 🗺️ INDEX - "Architecture & Design" section

### Understanding Frontend Integration
- 📖 README - "Frontend Integration"
- 🔬 ANALYSIS - "Integration with Other Jobs"
- 📊 FLOW - "Integration Points"

## Quick Question? Find Your Answer

### "How does it work?"
→ README: "Processing Pipeline"

### "What data does it use?"
→ ANALYSIS: "Input: Canonical Data Model"

### "What does it produce?"
→ ANALYSIS: "Output: Draft Structure"

### "How is data validated?"
→ ANALYSIS: "Validation & Pending Items"

### "What if something breaks?"
→ README: "Troubleshooting"

### "Show me an example"
→ EXAMPLES: "Example 1: Complete Purchase & Sale"

### "What sections are generated?"
→ FLOW: "Section Types & Brazilian Conventions"

### "How does versioning work?"
→ README: "Versioning"

### "What's the database schema?"
→ FLOW: "Database Schema"

### "How does it integrate with frontend?"
→ README: "Frontend Integration"

### "What if Gemini API fails?"
→ EXAMPLES: "Example 4: Gemini API Error"

### "Can I regenerate just one section?"
→ ANALYSIS: "Downstream: Chat & Edits"

## File Locations

### Source Code
- Main job: `worker/src/jobs/draft.ts`
- Types: `src/types/index.ts`
- Frontend: `src/pages/DraftPage.tsx`
- Store: `src/stores/caseStore.ts`

### Documentation (You Are Here)
- START_HERE.md (navigation)
- DRAFT_GENERATION_README.md (quick ref)
- DRAFT_GENERATION_ANALYSIS.md (deep dive)
- DRAFT_GENERATION_FLOW.md (diagrams)
- DRAFT_GENERATION_EXAMPLES.md (scenarios)
- DRAFT_GENERATION_INDEX.md (topic map)
- DRAFT_GENERATION_SUMMARY.md (overview)

## Key Files to Know

| File | Purpose |
|------|---------|
| `worker/src/jobs/draft.ts` | Main job implementation |
| `worker/src/jobs/processor.ts` | Job routing |
| `src/pages/DraftPage.tsx` | Frontend editor |
| `src/stores/caseStore.ts` | State management |
| `src/types/index.ts` | Type definitions |

## Environment Setup

### Required Env Vars
```bash
GEMINI_API_KEY              # Google AI API key
SUPABASE_SERVICE_ROLE_KEY   # Admin key for worker
```

### Model Used
```
Google Gemini 3 Pro Preview
- For: Complex legal document generation
- Speed: 2-6 seconds per draft
- Cost: ~$0.01-0.02 per draft
```

## The 8-Step Process (30-second version)

1. **Fetch** - Get case & canonical data from database
2. **Validate** - Check for missing required fields
3. **Prompt** - Format data into text prompt
4. **Generate** - Call Gemini API
5. **Parse** - Extract JSON sections from response
6. **Render** - Create styled HTML document
7. **Save** - Insert versioned draft to database
8. **Return** - Send job completion result

## The 7 Draft Sections (Always Generated)

1. Cabeçalho (Header)
2. Partes (Parties)
3. Objeto (Object/Property)
4. Preço e Forma de Pagamento (Price & Payment)
5. Condições Especiais (Special Conditions)
6. Cláusulas Gerais (General Clauses)
7. Encerramento (Closing)

## Core Concept in One Sentence

**Draft generation transforms a graph of extracted entities (people, properties, relationships, terms) into a professional, auditable Brazilian legal deed using AI, with all missing data explicitly marked for notary review.**

## Next Steps

1. **Pick your reading path above**
2. **Start with README (15 min)**
3. **Reference other docs as needed**
4. **Use INDEX to find specific topics**
5. **Check EXAMPLES for real data**

## Questions?

1. Check **README** - "Troubleshooting" section
2. Review relevant **EXAMPLES**
3. Find specific topic in **INDEX**
4. Read detailed **ANALYSIS**
5. Check job logs in `processing_jobs` table

---

**Ready to dive in?** Start with **DRAFT_GENERATION_README.md** →
