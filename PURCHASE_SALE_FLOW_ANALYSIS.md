# Purchase-Sale Flow Architecture Analysis

## Overview

The Purchase-Sale flow is a **5-step wizard** that guides users through creating a case, uploading documents, extracting entities, reviewing relationships, and generating drafts. The system supports both **new cases** and **resuming existing cases**.

**Key Design Principle**: State is persisted to localStorage using Zustand's persist middleware, allowing flows to be resumed even after page refresh.

---

## 1. Flow Step Sequence

The flow follows a strict linear progression with optional backward navigation:

```
1. case_creation
   ↓
2. document_upload
   ↓
3. entity_extraction
   ↓
4. canvas_review
   ↓
5. draft_generation
```

**Step Order Definition**: `src/stores/flowStore.ts`, lines 176-182

---

## 2. How Flow Resumption Works

### 2.1 Dashboard → Flow Navigation

**File**: `src/pages/DashboardPage.tsx`, lines 343-350

```typescript
const isWorkflowComplete = ['review', 'approved', 'archived'].includes(caseItem.status)
const actionUrl = isWorkflowComplete
  ? `/case/${caseItem.id}/draft`
  : `/purchase-sale-flow?caseId=${caseItem.id}`
const actionLabel = isWorkflowComplete ? 'Ver minuta' : 'Continuar fluxo'
```

**Key Points:**
- Unfinished cases (status: draft, processing) → navigate to `/purchase-sale-flow?caseId=<caseId>`
- Finished cases (status: review, approved, archived) → navigate to `/case/<caseId>/draft` (skips flow)
- Query parameter `?caseId=<caseId>` tells the flow page whether to resume or create new

**Reset on New Case** (line 89):
```typescript
const handleNewCase = () => {
  useFlowStore.getState().resetFlow()
  navigate('/purchase-sale-flow')  // No caseId param
}
```

---

### 2.2 Flow Page Initialization Logic

**File**: `src/pages/PurchaseSaleFlowPage.tsx`, lines 845-876

```typescript
const caseIdFromUrl = searchParams.get('caseId')

useEffect(() => {
  if (!hasInitialized.current) {
    hasInitialized.current = true

    if (caseIdFromUrl) {
      // RESUMING EXISTING CASE
      console.log('[Flow] Resuming existing case:', caseIdFromUrl)

      if (flow.caseData?.id === caseIdFromUrl && flow.isActive) {
        // Case already loaded, nothing to do
        return
      }

      if (!flow.isActive) {
        flow.startFlow('purchase_sale')
      }
    } else {
      // CREATING NEW CASE - ALWAYS RESET
      console.log('[Flow] Starting new case')
      flow.resetFlow()
      flow.startFlow('purchase_sale')
    }
  }
}, [caseIdFromUrl, flow.isActive, flow.caseData?.id])
```

**Critical Insight - How Resumption Happens:**
1. User clicks "Continuar fluxo" with `?caseId=123`
2. PurchaseSaleFlowPage detects `caseId` in URL
3. Calls `flow.startFlow('purchase_sale')`
4. Zustand's persist middleware **automatically restores** the flowStore from localStorage
5. The restored state includes:
   - `currentStep`: The step where the user left off
   - `caseData`: Case ID, title, act type
   - `documentData`: Previously uploaded documents
   - `extractionData`: Previously extracted people, properties, edges
   - `draftData`: Previously generated draft

---

## 3. State Persistence Architecture

### 3.1 Zustand Store Configuration

**File**: `src/stores/flowStore.ts`, lines 220-555

The store uses **two middlewares**:

```typescript
export const useFlowStore = create<FlowState & FlowActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ... store implementation
      }),
      {
        name: 'flow-store',
        partialize: (state) => ({
          // Only persist specific fields, not everything
          flowId: state.flowId,
          isActive: state.isActive,
          startedAt: state.startedAt,
          currentStep: state.currentStep,
          steps: state.steps,
          caseData: state.caseData,
          documentData: {
            documents: state.documentData.documents,
            uploadProgress: {},  // Don't persist progress
          },
          extractionData: {
            people: state.extractionData.people,
            properties: state.extractionData.properties,
            edges: state.extractionData.edges,
            isProcessing: false,  // Don't persist processing state
            processingProgress: 0,
          },
          draftData: {
            draft: state.draftData.draft,
            isGenerating: false,  // Don't persist generating state
          },
        }),
      }
    ),
    { name: 'flow-store' }
  )
)
```

**localStorage Key**: `flow-store` (automatically created by persist middleware)

**What Gets Persisted:**
- `flowId`: Unique identifier for this flow session
- `isActive`: Whether flow is active
- `currentStep`: Resume position
- `steps`: Status of each step (pending, in_progress, completed, error)
- `caseData`: Case details (id, title, actType)
- `documentData.documents`: List of uploaded documents
- `extractionData`: People, properties, edges (final extracted data)
- `draftData.draft`: The generated draft

**What Does NOT Persist:**
- Upload progress bars
- Processing flags/progress percentages
- Generation flags

---

### 3.2 Step Status Tracking

Each step has a status that determines navigation:

```typescript
export type FlowStepStatus = 'pending' | 'in_progress' | 'completed' | 'error'

interface FlowStepInfo {
  id: FlowStep
  label: string
  description: string
  status: FlowStepStatus
  completedAt?: string
  error?: string
}
```

**Navigation Rules** (`src/stores/flowStore.ts`, lines 323-337):

```typescript
canGoToStep: (step) => {
  const stepIndex = STEP_ORDER.indexOf(step)
  const currentIndex = STEP_ORDER.indexOf(state.currentStep)

  // Can always go back
  if (stepIndex <= currentIndex) return true

  // Can only go forward if previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    const prevStepInfo = state.steps.find((s) => s.id === STEP_ORDER[i])
    if (prevStepInfo?.status !== 'completed') return false
  }
  return true
}
```

**Logic:**
- Users can always navigate **backward** to any previous step
- Users can only navigate **forward** if all previous steps are marked as `completed`
- Current step starts as `in_progress` when accessed

---

## 4. How Each Step Determines Completion

### 4.1 Case Creation (Step 1)

**Completion Trigger**: `src/hooks/usePurchaseSaleFlow.ts`, lines 398-432

```typescript
const createCase = useCallback(async (): Promise<string | null> => {
  const validation = validateCaseCreation(caseData)
  if (!validation.isValid) {
    store.setGlobalError(validation.errors.join('. '))
    return null
  }

  try {
    const newCase = await createCaseMutation.mutateAsync({
      title: caseData.title,
      act_type: caseData.actType,
    })

    store.setCaseId(newCase.id)
    store.markStepCompleted('case_creation')  // ← MARKS AS COMPLETE
    queryClient.invalidateQueries({ queryKey: casesQueryKey })

    return newCase.id
  } catch (error) {
    store.markStepError('case_creation', errorMessage)
    return null
  }
})
```

**Completion Condition**: Case is successfully created in database and `caseId` is set

**Next Step Trigger** (`src/pages/PurchaseSaleFlowPage.tsx`, lines 892-901):

```typescript
case 'case_creation':
  if (!flow.caseData?.id) {
    const caseId = await flow.createCase()
    if (caseId) {
      flow.nextStep()  // Move to document_upload
    }
  } else {
    flow.nextStep()
  }
  break
```

---

### 4.2 Document Upload (Step 2)

**Completion Trigger** (`src/pages/PurchaseSaleFlowPage.tsx`, lines 989-994):

```typescript
onUploadComplete={(results) => {
  const successCount = results.filter(r => r.success).length
  if (successCount > 0) {
    flow.markStepCompleted('document_upload')  // ← MARKS AS COMPLETE
  }
}}
```

**Completion Condition**: At least one document uploads successfully

**Can Proceed** (`src/hooks/usePurchaseSaleFlow.ts`, lines 251-252):

```typescript
case 'document_upload':
  return validateDocumentUpload(documentData.documents).isValid
```

Must have at least one document with status `uploaded`, `processing`, or `processed`

---

### 4.3 Entity Extraction (Step 3)

**Completion Trigger** (`src/hooks/usePurchaseSaleFlow.ts`, lines 628-630):

```typescript
// Mark extraction as complete
store.setExtractionProcessing(false, 100)
store.markStepCompleted('entity_extraction')  // ← MARKS AS COMPLETE
```

Triggered when the worker completes the `entity_resolution` job for all documents.

**Can Proceed** (`src/hooks/usePurchaseSaleFlow.ts`, lines 253-258):

```typescript
case 'entity_extraction':
  return validateEntityExtraction(
    extractionData.people,
    extractionData.properties,
    extractionData.isProcessing
  ).isValid
```

Must have:
- At least one person OR one property extracted
- No active processing jobs

---

### 4.4 Canvas Review (Step 4)

**Completion Trigger** (`src/pages/PurchaseSaleFlowPage.tsx`, line 905):

```typescript
case 'canvas_review':
  flow.nextStep()  // No explicit completion marking
  break
```

**Can Proceed** (`src/hooks/usePurchaseSaleFlow.ts`, lines 259-261):

```typescript
case 'canvas_review':
  // Canvas review validation is optional - can proceed with warnings
  return extractionData.people.length > 0 || extractionData.properties.length > 0
```

Canvas review is **optional** - users can proceed even with warnings.

**Note**: Step is NOT explicitly marked as completed in flow. The canvas is used for visualization only in this step; actual edits are made elsewhere (CanvasPage).

---

### 4.5 Draft Generation (Step 5)

**Completion Trigger** - Draft is generated externally (not shown in flow hook):

```typescript
// This is handled elsewhere, likely in the DraftPage component
// The flow just tracks that a draft exists
```

**Can Proceed** (`src/hooks/usePurchaseSaleFlow.ts`, lines 262-263):

```typescript
case 'draft_generation':
  return hasDraft
```

Must have a draft object with content.

---

## 5. How Resume Works in Detail

### 5.1 Step-by-Step Resume Flow

```
User clicks "Continuar fluxo" on dashboard
                ↓
Navigate to: /purchase-sale-flow?caseId=abc123
                ↓
PurchaseSaleFlowPage mounts
                ↓
useEffect detects caseIdFromUrl = 'abc123'
                ↓
Checks if case already loaded: flow.caseData?.id === 'abc123'
                ↓ (NO)
Call flow.startFlow('purchase_sale')
                ↓
startFlow creates new flowId, sets isActive=true
                ↓
Zustand persist middleware RESTORES from localStorage
                ↓
Restored state includes:
  - currentStep: 'document_upload' (where user left off)
  - caseData: { id: 'abc123', title: '...', actType: 'purchase_sale' }
  - documentData.documents: [... previous documents ...]
  - extractionData.people: [... extracted people ...]
  - etc.
                ↓
PurchaseSaleFlowPage renders the LAST STEP the user was on
```

---

### 5.2 Resume Scenarios

#### Scenario A: User left during Case Creation

**Persisted State**:
- `currentStep: 'case_creation'`
- `caseData: null` (case not created yet)

**Resume Behavior**:
- Flow shows case creation step again
- User must create the case (no existing caseId)
- Proceeds to next step

#### Scenario B: User left during Document Upload

**Persisted State**:
- `currentStep: 'document_upload'`
- `caseData: { id: 'abc123', ... }`
- `documentData.documents: [doc1, doc2, ...]`

**Resume Behavior**:
- Flow shows document upload step
- Previous documents are already in the flow store
- User can upload more documents
- DocumentUploadStep shows "Documentos Carregados" list

#### Scenario C: User left during Entity Extraction

**Persisted State**:
- `currentStep: 'entity_extraction'`
- `caseData: { id: 'abc123', ... }`
- `extractionData.people: [...]`
- `extractionData.properties: [...]`

**Resume Behavior**:
- Flow shows extraction step
- Can see previously extracted entities
- Can click "Iniciar Extracao" to re-run or continue
- Processing flags are reset (not persisted)

#### Scenario D: User left during Canvas Review

**Persisted State**:
- `currentStep: 'canvas_review'`
- Full extraction data including edges
- People and properties already extracted

**Resume Behavior**:
- Flow shows canvas review step with summary cards
- Shows count of people, properties, relationships
- "Abrir Canvas Completo" button opens full canvas

---

## 6. Case Status vs Flow Step Relationship

### 6.1 Case Status (Database)

Stored in `cases.status` column. Determined by case stage:

```typescript
export type CaseStatus = 'draft' | 'processing' | 'review' | 'approved' | 'archived'
```

- **draft**: Initial state, case created but not submitted
- **processing**: Documents are being processed (jobs running)
- **review**: Extraction complete, waiting for user review
- **approved**: Approved by supervisor
- **archived**: Archived case

### 6.2 Flow Step (In-Memory)

Stored in Zustand and localStorage. Represents position within the wizard:

```typescript
export type FlowStep =
  | 'case_creation'
  | 'document_upload'
  | 'entity_extraction'
  | 'canvas_review'
  | 'draft_generation'
```

### 6.3 Relationship

```
Case Status          Flow Step(s)
─────────────────────────────────────────────────
draft                case_creation → document_upload
processing           document_upload → entity_extraction
review               entity_extraction → canvas_review
approved/archived    draft_generation (skipped in dashboard)
```

**Decision Logic in Dashboard** (`DashboardPage.tsx`, lines 345-349):

```typescript
const isWorkflowComplete = ['review', 'approved', 'archived'].includes(caseItem.status)
if (isWorkflowComplete) {
  // Skip flow entirely, go directly to draft view
  navigate(`/case/${caseItem.id}/draft`)
} else {
  // Resume flow at current step
  navigate(`/purchase-sale-flow?caseId=${caseItem.id}`)
}
```

---

## 7. URL Routes and Navigation

### 7.1 Key Routes

| Route | Purpose | Navigation From |
|-------|---------|-----------------|
| `/purchase-sale-flow` | Start new flow | Dashboard "Novo Caso" button |
| `/purchase-sale-flow?caseId=<id>` | Resume existing flow | Dashboard "Continuar fluxo" button |
| `/case/<id>/canvas` | Edit relationships in canvas | Canvas Review step → "Abrir Canvas Completo" |
| `/case/<id>/draft` | View/edit draft | Draft Generation step → "Abrir" button |
| `/case/<id>` | Case overview | Dashboard "Ver mais" button |
| `/dashboard` | Return to cases list | Flow header "Cancelar" button |

### 7.2 Flow-Internal Navigation

```typescript
// Within PurchaseSaleFlowPage component

// Next step
flow.nextStep()  // Updates currentStep in store

// Previous step
flow.previousStep()  // Updates currentStep in store

// Jump to specific step (if accessible)
flow.goToStep(step)  // Checks canGoToStep() first

// Cancel and exit
navigate('/dashboard')  // Also calls flow.cancelFlow()
```

---

## 8. Data Flow During Each Step

### 8.1 Case Creation Step

```
User fills form: title, act type
        ↓
User clicks "Criar e Continuar"
        ↓
flow.createCase()
        ↓
POST /api/cases { title, act_type, organization_id, created_by }
        ↓
Database creates case with status='draft'
        ↓
store.setCaseId(newCase.id)
store.markStepCompleted('case_creation')
        ↓
Step completion enables "Proximo" button
        ↓
flow.nextStep() → currentStep='document_upload'
```

### 8.2 Document Upload Step

```
User drags files or clicks upload
        ↓
DocumentDropzone component handles upload
        ↓
POST to Supabase Storage + create document record
        ↓
Document status = 'uploaded'
        ↓
Document added to store.documents[]
        ↓
markStepCompleted('document_upload') when ≥1 upload succeeds
        ↓
User clicks "Proximo"
        ↓
flow.nextStep() → currentStep='entity_extraction'
```

### 8.3 Entity Extraction Step

```
User clicks "Iniciar Extracao"
        ↓
flow.startExtraction()
        ↓
For each document:
  - If status='uploaded': create ocr job
  - If status='processed': check extraction, create entity_extraction job
        ↓
Worker processes jobs in pipeline:
  ocr → extraction → entity_extraction → entity_resolution
        ↓
Flow monitors progress via polling (every 2 seconds)
        ↓
When entity_resolution completes:
  - Fetch people[], properties[], edges[]
  - store.setPeople/setProperties/setEdges()
  - markStepCompleted('entity_extraction')
        ↓
Progress reaches 100%
        ↓
User can click "Proximo"
        ↓
flow.nextStep() → currentStep='canvas_review'
```

### 8.4 Canvas Review Step

```
Flow displays summary cards:
  - People count
  - Properties count
  - Relationships count
        ↓
User clicks "Abrir Canvas Completo"
        ↓
navigate(`/case/${caseId}/canvas`)
        ↓
[User edits relationships in CanvasPage]
        ↓
User returns to flow (browser back or explicit nav)
        ↓
Flow shows previous step with updated edge data
        ↓
User clicks "Proximo"
        ↓
flow.nextStep() → currentStep='draft_generation'
```

### 8.5 Draft Generation Step

```
Flow displays "Pronto para gerar a minuta" message
        ↓
User clicks "Gerar Minuta"
        ↓
flow.generateDraft()
        ↓
[Implementation TBD - calls draft generation API]
        ↓
store.setDraft(draft)
        ↓
Draft is displayed with pending items
        ↓
User clicks "Concluir"
        ↓
useFlowStore.getState().completeFlow()
  - Sets completedAt timestamp
  - Marks draft_generation as 'completed'
        ↓
FlowCompletion component shows success screen
        ↓
Options:
  - "Voltar ao Dashboard"
  - "Ver Minuta" (opens /case/<id>/draft)
  - "Novo Fluxo" (resets and starts fresh)
```

---

## 9. Key Implementation Files

### Core Files

| File | Purpose |
|------|---------|
| `src/stores/flowStore.ts` | State management with persist middleware |
| `src/hooks/usePurchaseSaleFlow.ts` | Flow logic, validation, API calls |
| `src/pages/PurchaseSaleFlowPage.tsx` | Main flow UI and navigation |
| `src/pages/DashboardPage.tsx` | Case list and flow entry points |
| `src/types/index.ts` | Type definitions for flow state |

### Related Files

| File | Purpose |
|------|---------|
| `src/components/upload/DocumentDropzone.tsx` | Document upload UI |
| `src/components/case/CreateCaseModal.tsx` | Case creation (alternative entry) |
| `src/pages/CanvasPage.tsx` | Canvas editor for relationships |
| `src/pages/DraftPage.tsx` | Draft viewer/editor |

---

## 10. Resumption Logic Summary

### The Magic Happens Here

**File**: `src/stores/flowStore.ts`, lines 527-551

```typescript
persist(
  (set, get) => ({ /* store implementation */ }),
  {
    name: 'flow-store',  // ← localStorage key
    partialize: (state) => ({
      // Selective persistence - only these fields survive page refresh
      flowId: state.flowId,
      isActive: state.isActive,
      startedAt: state.startedAt,
      currentStep: state.currentStep,  // ← CRITICAL: where user left off
      steps: state.steps,
      caseData: state.caseData,  // ← CRITICAL: case context
      documentData: { documents: state.documentData.documents },
      extractionData: {
        people: state.extractionData.people,  // ← CRITICAL: extracted data
        properties: state.extractionData.properties,
        edges: state.extractionData.edges,
        isProcessing: false,  // Reset processing flags
        processingProgress: 0,
      },
      draftData: { draft: state.draftData.draft },
    }),
  }
)
```

### When User Returns

1. **URL has `?caseId=abc123`**
   - Tells app: "Resume existing case"
   - Flow initialization calls `flow.startFlow('purchase_sale')`

2. **Zustand persist middleware activates**
   - Reads `localStorage['flow-store']`
   - Restores all persisted fields
   - **currentStep is restored** → User sees the step they left

3. **flowStore now has**
   - All extracted entities (people, properties, edges)
   - All uploaded documents
   - Current step position
   - Step completion status

4. **User sees flow at their last position**
   - If in extraction step: Shows extracted entities, can re-run or proceed
   - If in canvas step: Shows canvas preview with summaries
   - If in draft step: Shows draft or "ready to generate" message

---

## 11. Common Issues & Solutions

### Issue: "Continuar fluxo" always starts from step 1

**Cause**:
- Zustand persist middleware not configured correctly
- localStorage is cleared/disabled
- `resetFlow()` is called unexpectedly

**Solution**:
- Verify browser localStorage is enabled
- Check that `useFlowStore.persist` is in URL flow page initialization
- Ensure `resetFlow()` only called for new cases (no caseId in URL)

---

### Issue: Extracted entities disappear when resuming

**Cause**:
- `partialize` doesn't include all necessary fields
- Store not properly syncing with database

**Solution**:
- Check that `extractionData.people/properties/edges` are in `partialize`
- Ensure `useCaseDocuments` hook fetches fresh data on resume

---

### Issue: Can't navigate backward to previous steps

**Cause**:
- Previous step status not marked as `completed`
- `canGoToStep()` returning false

**Solution**:
- Ensure each step calls `markStepCompleted()` when done
- Check step order matches `STEP_ORDER` array

---

## 12. Future Improvements

1. **Implement step-specific progress recovery**
   - Current: Only restores completed state
   - Desired: Restore mid-step progress (e.g., partial document list)

2. **Add flow timeout/expiration**
   - Current: No time limit on persisted state
   - Desired: Expire flows older than 24 hours

3. **Implement flow auto-save during each step**
   - Current: Only localStorage persists
   - Desired: Also save to database for audit trail

4. **Add resume confirmation**
   - Current: Silently resumes
   - Desired: Ask user "Resume previous flow?" before restoring

5. **Implement step-specific recovery**
   - Current: All-or-nothing resume
   - Desired: Recover as much as possible even if some data is stale

---

## Summary

The purchase-sale flow implements **smart resumption** through:

1. **URL Query Parameters** (`?caseId=...`) signal resume intent
2. **Zustand Persist Middleware** saves to localStorage on every state change
3. **Selective Serialization** via `partialize` saves only resumable data
4. **Step Status Tracking** ensures navigation validity
5. **Case Context Preservation** keeps case ID, documents, and extracted entities

When a user clicks "Continuar fluxo" with a caseId, the flow **automatically restores** where they left off using localStorage, providing a seamless continuation experience.
