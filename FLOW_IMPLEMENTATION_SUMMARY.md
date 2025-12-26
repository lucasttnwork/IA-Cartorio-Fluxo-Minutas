# Purchase-Sale Flow - Implementation Summary

## Executive Summary

The purchase-sale flow implements a **5-step wizard** that guides users through case creation, document upload, entity extraction, relationship review, and draft generation. The system supports **seamless resumption** through localStorage persistence, allowing users to pick up where they left off.

---

## How It All Works Together

### The Complete Journey

```
┌─ USER INTERACTION ──────────────────────────────────────────┐
│                                                               │
│  1. Dashboard: Click "Novo Caso"                             │
│     └─→ resetFlow() + navigate('/purchase-sale-flow')        │
│                                                               │
│  2. Dashboard: Click "Continuar fluxo"                       │
│     └─→ navigate('/purchase-sale-flow?caseId=abc123')        │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────────────────────────────────────┐
│ PURCHASESALEFLOWPAGE INITIALIZATION                           │
│                                                               │
│  1. Extract URL param: caseIdFromUrl = searchParams.get('caseId')
│  2. useEffect checks:                                         │
│     - If caseId exists: Resume mode                           │
│       └─→ flow.startFlow('purchase_sale')                    │
│     - If no caseId: New mode                                  │
│       └─→ flow.resetFlow() + flow.startFlow('purchase_sale')│
│  3. Zustand persist middleware:                              │
│     - Detects store initialization                           │
│     - Loads localStorage['flow-store']                       │
│     - RESTORES: currentStep, caseData, documents, entities   │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────────────────────────────────────┐
│ FLOW STATE (from localStorage or fresh)                      │
│                                                               │
│  {                                                            │
│    flowId: 'flow-...',         ← Unique session ID           │
│    isActive: true,             ← Flow is running             │
│    currentStep: 'case_creation',  ← Position in wizard       │
│    caseData: {                 ← Case context                │
│      id: 'case-123' (if resuming),                           │
│      title: 'Venda Apt 101',                                 │
│      actType: 'purchase_sale'                                │
│    },                                                        │
│    documents: [...],           ← Uploaded files              │
│    people: [...],              ← Extracted persons           │
│    properties: [...],          ← Extracted properties        │
│    edges: [...],               ← Relationships               │
│    draft: {...},               ← Generated draft             │
│    steps: [                    ← Navigation gates            │
│      { id: 'case_creation', status: 'pending', ... },       │
│      { id: 'document_upload', status: 'completed', ... },   │
│      ...                                                     │
│    ]                                                         │
│  }                                                            │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────────────────────────────────────┐
│ UI RENDERING                                                 │
│                                                               │
│  1. Get currentStep from store: 'document_upload'            │
│  2. Render appropriate step component:                       │
│     - CaseCreationStep                                       │
│     - DocumentUploadStep (← rendered if currentStep=this)    │
│     - EntityExtractionStep                                   │
│     - CanvasReviewStep                                       │
│     - DraftGenerationStep                                    │
│  3. Show FlowStepper with:                                   │
│     - Current step highlighted                              │
│     - Previous steps marked as completed                     │
│     - Next steps locked/unlocked based on canGoToStep()      │
│  4. Show step-specific content + buttons:                    │
│     - "Proximo" button (if canProceed)                       │
│     - "Anterior" button (if canGoBack)                       │
│     - Cancelar dialog                                        │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────────────────────────────────────┐
│ USER ACTION ON CURRENT STEP                                  │
│                                                               │
│  ┌─ CASE CREATION STEP ──────────────────────────────────┐   │
│  │ 1. User fills: title, act type                        │   │
│  │ 2. User clicks: "Criar e Continuar"                   │   │
│  │ 3. flow.createCase()                                  │   │
│  │    ├─ POST /api/cases                                 │   │
│  │    ├─ DB returns case with id='case-123'             │   │
│  │    ├─ store.setCaseId('case-123')                    │   │
│  │    ├─ store.markStepCompleted('case_creation')       │   │
│  │    └─ [localStorage updated]                          │   │
│  │ 4. flow.nextStep()                                    │   │
│  │    └─ currentStep = 'document_upload'                │   │
│  │       [localStorage updated]                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ DOCUMENT UPLOAD STEP ────────────────────────────────┐   │
│  │ 1. User drags files                                   │   │
│  │ 2. DocumentDropzone uploads to Supabase Storage       │   │
│  │ 3. Create document record in DB                       │   │
│  │ 4. store.addDocument(doc)                             │   │
│  │    └─ [localStorage updated]                          │   │
│  │ 5. After ≥1 success:                                  │   │
│  │    ├─ flow.markStepCompleted('document_upload')       │   │
│  │    └─ [localStorage updated]                          │   │
│  │ 6. User clicks "Proximo"                              │   │
│  │    └─ currentStep = 'entity_extraction'              │   │
│  │       [localStorage updated]                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ ENTITY EXTRACTION STEP ──────────────────────────────┐   │
│  │ 1. User clicks "Iniciar Extracao"                     │   │
│  │ 2. flow.startExtraction()                             │   │
│  │    ├─ Create ocr/extraction/entity_extraction jobs    │   │
│  │    ├─ Poll progress every 2 seconds                   │   │
│  │    └─ Subscribe to realtime updates                   │   │
│  │ 3. When jobs complete:                                │   │
│  │    ├─ store.setPeople([...])                          │   │
│  │    ├─ store.setProperties([...])                      │   │
│  │    ├─ store.setEdges([...])                           │   │
│  │    ├─ store.markStepCompleted('entity_extraction')    │   │
│  │    └─ [localStorage updated with ALL data]            │   │
│  │ 4. User clicks "Proximo"                              │   │
│  │    └─ currentStep = 'canvas_review'                  │   │
│  │       [localStorage updated]                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ CANVAS REVIEW STEP ──────────────────────────────────┐   │
│  │ 1. Shows summary: people count, properties, edges    │   │
│  │ 2. User clicks "Abrir Canvas Completo"                │   │
│  │    └─ navigate(`/case/{caseId}/canvas`)              │   │
│  │ 3. [CanvasPage opens, user reviews/edits relationships]  │
│  │ 4. User navigates back to flow                        │   │
│  │ 5. currentStep still = 'canvas_review'                │   │
│  │ 6. User clicks "Proximo"                              │   │
│  │    └─ currentStep = 'draft_generation'               │   │
│  │       [localStorage updated]                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ DRAFT GENERATION STEP ───────────────────────────────┐   │
│  │ 1. User clicks "Gerar Minuta"                         │   │
│  │ 2. flow.generateDraft()                               │   │
│  │    ├─ Call draft generation API                       │   │
│  │    ├─ store.setDraft(draft)                           │   │
│  │    └─ [localStorage updated]                          │   │
│  │ 3. Draft displays with pending items                  │   │
│  │ 4. User clicks "Concluir"                             │   │
│  │    ├─ useFlowStore.getState().completeFlow()         │   │
│  │    └─ [localStorage updated with completedAt]         │   │
│  │ 5. FlowCompletion screen shown                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────────────────────────────────────┐
│ STATE PERSISTENCE (Automatic via Zustand)                    │
│                                                               │
│  Every state update → useFlowStore.setState(newState)        │
│                   │                                          │
│                   ├─ Zustand store updated in memory        │
│                   │                                          │
│                   ├─ persist middleware intercepts           │
│                   │                                          │
│                   └─ Calls partialize() to filter state      │
│                      │                                       │
│                      └─ localStorage['flow-store'] = filtered│
│                         {                                    │
│                           flowId: '...',                     │
│                           currentStep: '...',                │
│                           caseData: {...},                   │
│                           documents: [...],                  │
│                           people: [...],                     │
│                           properties: [...],                 │
│                           edges: [...],                      │
│                           draft: {...},                      │
│                           steps: [...]                       │
│                           (uploadProgress reset to {})       │
│                           (isProcessing reset to false)      │
│                         }                                    │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
                    ┌──────────────────────┐
                    │  USER CLOSES BROWSER │
                    │  Or navigates away   │
                    └──────────────────────┘
                               │
                    ┌──────────────────────────┐
                    │ localStorage['flow-store']│
                    │ persists on disk         │
                    └──────────────────────────┘
                               │
         [HOURS/DAYS LATER]     │
                               │
                    ┌──────────────────────────┐
                    │ User logs back in        │
                    │ Clicks "Continuar fluxo"│
                    └──────────────┬───────────┘
                                   │
                    ┌──────────────────────────────────┐
                    │ navigate('/purchase-sale-flow    │
                    │  ?caseId=abc123')                │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────────────────────────┐
                    │ PurchaseSaleFlowPage initializes │
                    │ Detects caseId in URL           │
                    │ Calls flow.startFlow()          │
                    │ Persist middleware loads        │
                    │ localStorage['flow-store']      │
                    └──────────────┬───────────────────┘
                                   │
        ┌──────────────────────────────────────────────┐
        │ STATE RESTORED FROM localStorage!              │
        │                                                │
        │ currentStep: 'document_upload'                │
        │ caseData: { id: 'case-123', ... }           │
        │ documents: [doc1, doc2, ...]                 │
        │ (and everything else preserved)              │
        └──────────────┬───────────────────────────────┘
                       │
        ┌──────────────────────────────────────────────┐
        │ UI renders at LAST STEP user was on          │
        │ User sees DocumentUploadStep with all        │
        │ previous documents listed                    │
        │                                              │
        │ ✓ RESUMPTION COMPLETE!                      │
        └──────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. **UI Layer** (React Components)

**Files**:
- `src/pages/PurchaseSaleFlowPage.tsx` - Main flow page
- `src/components/flow/` - Step components
- `src/pages/DashboardPage.tsx` - Entry point

**Responsibilities**:
- Render current step UI
- Handle user interactions
- Call hook methods on user action
- Display validation errors
- Show progress indicators

### 2. **Hook Layer** (Business Logic)

**File**: `src/hooks/usePurchaseSaleFlow.ts`

**Responsibilities**:
- Validation logic (what makes step complete?)
- API calls (create case, upload document, extract entities)
- Job monitoring (polling for extraction status)
- Step navigation logic
- Error handling

### 3. **State Management Layer** (Zustand Store)

**File**: `src/stores/flowStore.ts`

**Responsibilities**:
- Single source of truth for flow state
- Persist to localStorage
- Restore from localStorage on init
- Provide selectors for components
- Manage step status and completion

### 4. **Data Persistence Layer** (localStorage + Database)

**localStorage**:
- Stores `flow-store` key with complete flow state
- Survives page refresh
- Automatically managed by persist middleware

**Database**:
- Stores permanent case, document, and entity data
- Source of truth for extracted data
- Synced back to flow store as needed

---

## Data Flow Diagram

```
┌─────────────────┐
│  User Input     │ (Form fields, file uploads, button clicks)
└────────┬────────┘
         │
         ↓
    ┌────────────────────┐
    │  React Component   │ (PurchaseSaleFlowPage or step components)
    └────────┬───────────┘
             │
             ├─ Calls hook methods
             │  flow.updateCaseTitle(title)
             │  flow.createCase()
             │  flow.addDocument(doc)
             │  flow.startExtraction()
             │  flow.nextStep()
             │  etc.
             │
             ↓
    ┌──────────────────────────────┐
    │  usePurchaseSaleFlow Hook    │
    ├──────────────────────────────┤
    │ - Validation logic           │
    │ - API calls                  │
    │ - Job monitoring             │
    │ - Store method calls         │
    └────────┬─────────────────────┘
             │
             ├─ store.setCaseData(...)
             ├─ store.addDocument(...)
             ├─ store.setPeople(...)
             ├─ store.setEdges(...)
             ├─ store.markStepCompleted(...)
             ├─ store.nextStep()
             │
             ↓
    ┌──────────────────────────────┐
    │  Zustand Store               │
    │  (useFlowStore)              │
    ├──────────────────────────────┤
    │ State updated in memory      │
    │ All reducer functions        │
    └────────┬─────────────────────┘
             │
             ├─ (Persist middleware activates)
             │  Calls partialize() to filter
             │  Serializes to JSON
             │
             ↓
    ┌──────────────────────────────┐
    │  Browser localStorage        │
    │  Key: 'flow-store'           │
    │  Value: {...state JSON...}   │
    └──────────────────────────────┘
             │
             ├─ (Survives page refresh)
             │
             ↓
    ┌──────────────────────────────┐
    │  Page Reload                 │
    │  Flow page initializes       │
    └────────┬─────────────────────┘
             │
             ├─ useFlowStore() is instantiated
             ├─ Persist middleware detects init
             ├─ Loads localStorage['flow-store']
             ├─ Hydrates store with saved state
             │
             ↓
    ┌──────────────────────────────┐
    │  Zustand Store Hydrated      │
    │  (All data restored)         │
    │  currentStep: 'document_upload'
    │  caseData: {...}             │
    │  documents: [...]            │
    │  people: [...]               │
    │  etc.                        │
    └────────┬─────────────────────┘
             │
             ↓
    ┌──────────────────────────────┐
    │  Component Re-renders        │
    │  Reads from restored store   │
    │  Shows UI at last position   │
    └──────────────────────────────┘
```

---

## Key Data Structures

### FlowState (in Zustand store)

```typescript
{
  // Flow identification
  flowId: string | null
  isActive: boolean
  startedAt: string | null
  completedAt: string | null

  // Navigation
  currentStep: FlowStep  // 'case_creation' | ... | 'draft_generation'
  steps: FlowStepInfo[] // Status of each step

  // Step-specific data
  caseData: {
    id?: string
    title: string
    actType: ActType
  } | null

  documentData: {
    documents: Document[]
    uploadProgress: Record<string, number>
  }

  extractionData: {
    people: Person[]
    properties: Property[]
    edges: GraphEdge[]
    isProcessing: boolean
    processingProgress: number
  }

  draftData: {
    draft: Draft | null
    isGenerating: boolean
  }

  // Errors & loading
  globalError: string | null
  isLoading: boolean
  isSaving: boolean
}
```

### Document

```typescript
{
  id: string
  case_id: string
  storage_path: string
  original_name: string
  mime_type: string
  file_size: number
  page_count: number | null
  status: 'uploaded' | 'processing' | 'processed' | ...
  doc_type: 'cnh' | 'rg' | 'deed' | ...
  created_at: string
  updated_at: string
}
```

### Person (Extracted Entity)

```typescript
{
  id: string
  case_id: string
  full_name: string
  cpf: string | null
  rg: string | null
  birth_date: string | null
  address: Address | null
  confidence: number
  source_docs: string[]  // Document IDs
  created_at: string
  updated_at: string
}
```

### Property (Extracted Entity)

```typescript
{
  id: string
  case_id: string
  registry_number: string | null
  address: Address | null
  area_sqm: number | null
  confidence: number
  source_docs: string[]  // Document IDs
  created_at: string
  updated_at: string
}
```

### GraphEdge (Relationship)

```typescript
{
  id: string
  case_id: string
  source_id: string  // Person or Property ID
  source_type: 'person' | 'property'
  target_id: string
  target_type: 'person' | 'property'
  relationship: 'spouse_of' | 'owns' | 'sells' | ...
  confidence: number
  confirmed: boolean
  created_at: string
}
```

---

## Step Completion Conditions

| Step | Condition | Verified By | Auto-Complete |
|------|-----------|-------------|---|
| **case_creation** | Case created in DB + caseId set | `caseData?.id` exists | ✓ Yes |
| **document_upload** | ≥1 document with status uploaded/processed | `documents.length > 0` | ✓ Yes |
| **entity_extraction** | ≥1 person OR property extracted + no active jobs | `people.length > 0 \|\| properties.length > 0` | ✓ Yes |
| **canvas_review** | (Optional) Always allows proceeding | Manual click | ✗ No |
| **draft_generation** | Draft object created with content | `draft !== null` | ✗ No |

---

## Navigation Rules

```
canGoToStep(targetStep):
  ├─ If targetStep is in PAST steps → YES (always allow going back)
  ├─ If targetStep is CURRENT step → YES
  └─ If targetStep is in FUTURE steps:
     └─ For each step between current and target:
        └─ If status !== 'completed' → NO
        └─ If all are 'completed' → YES
```

Example: Can jump to "canvas_review"?
- Required: 'case_creation', 'document_upload', 'entity_extraction' all 'completed'

---

## Why This Architecture Works

### 1. **Single Source of Truth (Zustand Store)**
- One place to find current state
- Prevents prop drilling
- Easy to add features

### 2. **Automatic Persistence (Middleware)**
- No manual localStorage.setItem() calls
- Transparent to components
- Prevents consistency issues

### 3. **Selective Serialization**
- Only persists what can resume
- Resets transient state (upload progress, processing flags)
- Prevents stale state issues

### 4. **URL Parameter Signaling**
- Clear intent: `?caseId=` means resume
- No ambiguity about new vs. resume
- Easy to implement in router

### 5. **Step Status Gating**
- Prevents users from skipping steps
- Clear progression
- Allows going back for review

### 6. **Hook Abstraction**
- Business logic separated from UI
- Easy to test
- Reusable across pages

---

## Common Patterns

### Pattern 1: Creating a Step Resource

```typescript
// In hook
const handleCreateStep = async () => {
  try {
    store.setLoading(true)
    const result = await api.createResource()
    store.setResourceId(result.id)
    store.markStepCompleted(currentStep)
    store.nextStep()
  } catch (error) {
    store.setError(error.message)
  } finally {
    store.setLoading(false)
  }
}

// In component
<Button onClick={handleCreateStep} disabled={isLoading}>
  {isLoading ? 'Creating...' : 'Create and Continue'}
</Button>
```

### Pattern 2: Checking Step Access

```typescript
// In component
const isStepAccessible = flow.canGoToStep('canvas_review')

<StepButton
  onClick={() => {
    if (isStepAccessible) {
      flow.goToStep('canvas_review')
    }
  }}
  disabled={!isStepAccessible}
>
  Skip to Review
</StepButton>
```

### Pattern 3: Monitoring Long Operation

```typescript
// In hook
const startLongOperation = async () => {
  store.setProcessing(true, 0)

  const unsubscribe = subscribeToProgress(caseId, (progress) => {
    store.setProcessing(true, progress)
  })

  try {
    await pollUntilComplete()
    store.markStepCompleted()
  } finally {
    unsubscribe()
    store.setProcessing(false, 100)
  }
}
```

---

## Testing Resumption

### Manual Test Steps

1. **Start new flow**
   - Click "Novo Caso" on dashboard
   - Create case, upload document
   - Stop before extraction (close browser tab)

2. **Verify state saved**
   - Open DevTools → Application → LocalStorage
   - Look for `flow-store` key
   - Verify it contains `currentStep`, `caseData`, `documents`

3. **Resume flow**
   - Return to dashboard
   - Click "Continuar fluxo" on the case
   - Should navigate to `/purchase-sale-flow?caseId=xxx`
   - Should render at `document_upload` step
   - Previous documents should be visible

4. **Verify full restoration**
   - Refresh page while in flow
   - Should stay at same step
   - All data intact

### Automated Test Example

```typescript
describe('Flow Resumption', () => {
  it('should resume from localStorage after page refresh', async () => {
    // Start flow
    const { getByText } = render(<PurchaseSaleFlowPage />)

    // Create case
    fireEvent.change(getByLabelText('Título'), { target: { value: 'Test Case' } })
    fireEvent.click(getByText('Criar e Continuar'))

    // Verify saved to localStorage
    const saved = JSON.parse(localStorage.getItem('flow-store'))
    expect(saved.currentStep).toBe('document_upload')

    // Simulate page refresh
    cleanup()

    // Resume with caseId
    render(<PurchaseSaleFlowPage />, {
      initialRoute: `/purchase-sale-flow?caseId=${saved.caseData.id}`
    })

    // Verify restored
    expect(getByText('Upload de Documentos')).toBeInTheDocument()
  })
})
```

---

## Potential Issues & Solutions

### Issue 1: "Resume doesn't restore"
**Cause**: localStorage disabled or cleared
**Fix**: Check `localStorage.getItem('flow-store')` in console

### Issue 2: "Always starts fresh"
**Cause**: `resetFlow()` called unexpectedly or no caseId in URL
**Fix**: Verify URL includes `?caseId=...` parameter

### Issue 3: "Data lost after refresh"
**Cause**: Field not included in `partialize()`
**Fix**: Add field to persist middleware config

### Issue 4: "Stuck in extraction step"
**Cause**: Worker not running or job failed
**Fix**: Check worker logs, ensure jobs processing

### Issue 5: "Can't navigate backward"
**Cause**: Previous step not marked 'completed'
**Fix**: Ensure `markStepCompleted()` called at right time

---

## Future Enhancements

1. **Database-backed flow state**
   - Save flow to database for audit
   - Sync localStorage ↔ DB

2. **Flow expiration**
   - Auto-clear flows older than N hours
   - Prevent resuming very old flows

3. **Incremental progress**
   - Save progress at each sub-step
   - More granular resumption

4. **Conflict resolution**
   - Handle case where data changed while paused
   - Merge strategies

5. **Flow templates**
   - Save flow configurations
   - Restart similar flows faster

---

## Summary

The purchase-sale flow is a **well-architected wizard** that combines:

- **URL signaling** for resume intent
- **Zustand persistence** for transparent state saving
- **localStorage** for cross-session data retention
- **Step gating** for coherent progression
- **Hook abstraction** for clean business logic
- **Component composition** for modular UI

The **magic happens** in the Zustand persist middleware, which automatically saves state on every change and restores it on initialization, making resumption seamless and transparent.

---

**For detailed information**, see:
- `PURCHASE_SALE_FLOW_ANALYSIS.md` - Complete architecture
- `FLOW_RESUMPTION_DIAGRAM.md` - Visual diagrams
- `FLOW_QUICK_REFERENCE.md` - Quick lookup guide
