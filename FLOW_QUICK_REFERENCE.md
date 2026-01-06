# Purchase-Sale Flow - Quick Reference Guide

## 🎯 Quick Answer: How Resume Works

**User clicks "Continuar fluxo"** → URL includes `?caseId=abc123` → Zustand's persist middleware **automatically restores** the entire flow state from localStorage → User sees the exact step they left off on.

---

## 📍 Key Files at a Glance

| File | Key Function | Lines |
|------|--------------|-------|
| `src/stores/flowStore.ts` | State management, persist config | 220-556 |
| `src/hooks/usePurchaseSaleFlow.ts` | Flow logic, API calls, validation | 1-915 |
| `src/pages/PurchaseSaleFlowPage.tsx` | Main UI, initialization, step rendering | 837-1141 |
| `src/pages/DashboardPage.tsx` | Case list, entry points | 343-350 |
| `src/types/index.ts` | Type definitions | All |

---

## 🔄 Flow Step Sequence

```
1. case_creation
   ↓ (after case created in DB)
2. document_upload
   ↓ (after ≥1 document uploaded)
3. entity_extraction
   ↓ (after extraction jobs complete)
4. canvas_review
   ↓ (optional, always allows proceeding)
5. draft_generation
   ↓ (after draft generated)
COMPLETE
```

---

## 🚀 Entry Points

### New Case
```typescript
// Dashboard "Novo Caso" button
handleNewCase = () => {
  useFlowStore.getState().resetFlow()  // Clear localStorage
  navigate('/purchase-sale-flow')       // No caseId parameter
}
```

### Resume Case
```typescript
// Dashboard "Continuar fluxo" button
const actionUrl = isWorkflowComplete
  ? `/case/${caseId}/draft`                          // Skip flow
  : `/purchase-sale-flow?caseId=${caseId}`          // Resume flow
navigate(actionUrl)
```

---

## 💾 What Gets Persisted

**YES → Persisted to localStorage:**
- `flowId` - Unique flow identifier
- `isActive` - Whether flow is active
- `currentStep` - Which step user is on ← CRITICAL
- `steps` - Status of each step (pending/in_progress/completed/error)
- `caseData` - Case ID, title, act type
- `documents` - All uploaded documents
- `people` - Extracted persons
- `properties` - Extracted properties
- `edges` - Relationship graph
- `draft` - Generated draft

**NO → NOT Persisted:**
- `uploadProgress` - Reset to {}
- `isProcessing` - Reset to false
- `processingProgress` - Reset to 0
- `isGenerating` - Reset to false

**Config**: `src/stores/flowStore.ts`, lines 527-551

---

## 🔍 How Resume Initialization Works

```typescript
// PurchaseSaleFlowPage.tsx, lines 845-876

const caseIdFromUrl = searchParams.get('caseId')

useEffect(() => {
  if (!hasInitialized.current) {
    hasInitialized.current = true

    if (caseIdFromUrl) {
      // URL has caseId → RESUME MODE
      if (!flow.isActive) {
        flow.startFlow('purchase_sale')
        // ↑ This triggers persist middleware
        // ↓ Which loads localStorage['flow-store']
        // ↓ Restoring currentStep, caseData, documents, entities...
      }
    } else {
      // No caseId → NEW CASE MODE
      flow.resetFlow()
      flow.startFlow('purchase_sale')
    }
  }
}, [caseIdFromUrl, flow.isActive, flow.caseData?.id])
```

---

## ✅ Step Completion Checklist

| Step | Completed When | Auto-mark? | Code Location |
|------|----------------|-----------|---|
| case_creation | Case created in DB + caseId set | ✓ | usePurchaseSaleFlow.ts:418 |
| document_upload | ≥1 document uploads successfully | ✓ | PurchaseSaleFlowPage.tsx:993 |
| entity_extraction | entity_resolution job completes | ✓ | usePurchaseSaleFlow.ts:630 |
| canvas_review | User clicks Next (optional) | ✗ | PurchaseSaleFlowPage.tsx:905 |
| draft_generation | User clicks Complete | ✗ | PurchaseSaleFlowPage.tsx:909 |

---

## 🛡️ Navigation Rules

```typescript
// Can user go to a specific step?

canGoToStep(step):
  - If step is BEFORE current: YES (always can go back)
  - If step is CURRENT: YES
  - If step is AFTER current:
    - Check if ALL previous steps are 'completed'
    - If YES: can go forward
    - If NO: blocked

// Example: Can go to "canvas_review"?
// Requires: 'case_creation' + 'document_upload' + 'entity_extraction' all 'completed'
```

---

## 📊 Case Status vs Flow Step

```
Database (cases.status)          Flow (currentStep)
─────────────────────────────────────────────────
draft                            case_creation → document_upload
processing                       document_upload → entity_extraction
review                           entity_extraction → canvas_review
approved                         draft_generation (or skipped)
archived                         draft_generation (or skipped)
```

**Dashboard Logic**:
```typescript
const isWorkflowComplete = ['review', 'approved', 'archived'].includes(status)
if (isWorkflowComplete) {
  navigate(`/case/${id}/draft`)              // Skip flow
} else {
  navigate(`/purchase-sale-flow?caseId=${id}`) // Resume flow
}
```

---

## 🔧 Key Methods in usePurchaseSaleFlow

### Flow Lifecycle
```typescript
startFlow(actType)          // Start new flow
cancelFlow()                // Cancel and go to dashboard
resetFlow()                 // Clear all state
resumeFlow()                // Resume if active
```

### Step Navigation
```typescript
goToStep(step)              // Jump to step if accessible
nextStep()                  // Go to next step
previousStep()              // Go to previous step
canGoToStep(step)           // Check if step accessible
```

### Step Status
```typescript
markStepCompleted(step)     // Mark step as done
markStepError(step, error)  // Mark step as error
```

### Case Creation
```typescript
updateCaseTitle(title)      // Update case title
updateActType(actType)      // Update act type
createCase()                // Create case in DB
```

### Document Upload
```typescript
addDocument(document)       // Add to store
removeDocument(docId)       // Remove from store
setUploadProgress(docId, progress)
refreshDocuments()          // Fetch from DB
```

### Entity Extraction
```typescript
startExtraction()           // Trigger job creation + monitoring
updatePeople(people)        // Update extracted persons
updateProperties(properties) // Update extracted properties
updateEdges(edges)          // Update relationships
```

### Draft
```typescript
generateDraft()             // Start draft generation
updateDraft(draft)          // Update draft
```

### Validation
```typescript
validateCurrentStep()       // Validate current step
getStepValidation(step)     // Validate any step
```

---

## 📝 Common Code Patterns

### Checking if can proceed to next step
```typescript
if (flow.canProceed) {
  flow.nextStep()
}
```

### Getting current step info
```typescript
const stepInfo = steps.find(s => s.id === flow.currentStep)
// {
//   id: 'document_upload',
//   label: 'Upload de Documentos',
//   description: '...',
//   status: 'in_progress',
//   completedAt: undefined,
//   error: undefined
// }
```

### Checking if step is accessible
```typescript
if (flow.canGoToStep('canvas_review')) {
  flow.goToStep('canvas_review')
}
```

### Getting completion percentage
```typescript
console.log(flow.progress)  // 0-100
console.log(flow.completedSteps)  // Number
console.log(flow.totalSteps)  // 5
```

### Handling step-specific data
```typescript
const { caseData } = flow
const { documents } = flow
const { people, properties, edges } = flow
const { draft } = flow
```

---

## 🐛 Debugging Resume Issues

### Issue: Resume doesn't work
**Check these:**
1. Is localStorage enabled? `console.log(localStorage.getItem('flow-store'))`
2. Is caseId in URL? `console.log(window.location.search)`
3. Is persist middleware working? Check Zustand devtools
4. Clear localStorage and try again: `localStorage.clear()`

### Issue: Lost data on resume
**Check these:**
1. Is field included in `partialize()`? (src/stores/flowStore.ts:529)
2. Is data being set before page close? Add logging to `store.set*()` calls
3. Is localStorage quota exceeded? (iOS has strict limits)

### Issue: Always starting fresh
**Check these:**
1. Is `resetFlow()` being called unexpectedly?
2. Is URL missing caseId parameter?
3. Is `flow.startFlow()` being called when it shouldn't?

---

## 🧪 Testing Resume Flow

```javascript
// 1. Start a flow (get caseId from logs)
// Navigate to /purchase-sale-flow
// Create case → get caseId = 'case-abc123'

// 2. Simulate page close
window.close()  // or just close browser tab

// 3. Resume from localStorage
localStorage.getItem('flow-store')  // Should show complete state

// 4. Return to flow with caseId
navigate('/purchase-sale-flow?caseId=case-abc123')

// 5. Verify restoration
useFlowStore.getState()  // Should show all data restored
```

---

## 📋 LocalStorage Schema

```javascript
localStorage['flow-store'] = {
  flowId: string              // "flow-1703001234-abc123def"
  isActive: boolean           // true
  startedAt: string | null    // ISO timestamp
  completedAt: string | null  // ISO timestamp or null
  currentStep: FlowStep       // "document_upload"
  steps: [
    {
      id: FlowStep
      label: string
      description: string
      status: 'pending' | 'in_progress' | 'completed' | 'error'
      completedAt?: string    // ISO timestamp
      error?: string
    }
    // ... 5 total steps
  ]
  caseData: {
    id?: string               // Case ID from database
    title: string             // "Venda Apt 101"
    actType: ActType          // "purchase_sale"
  } | null
  documentData: {
    documents: Array<Document>
    uploadProgress: {}        // Always {} when persisted
  }
  extractionData: {
    people: Array<Person>
    properties: Array<Property>
    edges: Array<GraphEdge>
    isProcessing: false       // Always false when persisted
    processingProgress: 0     // Always 0 when persisted
  }
  draftData: {
    draft: Draft | null
    isGenerating: false       // Always false when persisted
  }
  globalError: string | null
  isLoading: boolean
  isSaving: boolean
}
```

---

## ⚡ Performance Notes

- **State updates**: Persist middleware writes to localStorage on every `set()` call (debounce if needed)
- **Large documents**: Array of Document objects in localStorage can be large
- **Extraction data**: People/properties/edges arrays can grow with case size
- **Best practice**: Don't persist upload progress or processing flags (done automatically via `partialize`)

---

## 🎓 Learning Path

1. **Understand the flow**: Read `PURCHASE_SALE_FLOW_ANALYSIS.md`
2. **See the diagrams**: Review `FLOW_RESUMPTION_DIAGRAM.md`
3. **Browse the code**: Start with `src/pages/DashboardPage.tsx` lines 343-350
4. **Follow the hooks**: Then `src/hooks/usePurchaseSaleFlow.ts`
5. **Check the store**: Finally `src/stores/flowStore.ts`
6. **Test it**: Create a new flow, go partway, close browser, resume

---

## 🔗 Related Documentation

- `PURCHASE_SALE_FLOW_ANALYSIS.md` - Complete architecture analysis
- `FLOW_RESUMPTION_DIAGRAM.md` - Visual diagrams and flows
- `CLAUDE.md` - Project overview and conventions
- `src/stores/flowStore.ts` - Source of truth for state shape

---

## 💡 Key Insights

1. **URL parameter is the entry signal** - `?caseId=...` tells app to resume
2. **Zustand persist is transparent** - No explicit "load from storage" code needed
3. **Step status gates navigation** - Can only go forward if previous steps completed
4. **LocalStorage is the resume mechanism** - All data survives page refresh
5. **Partialize is selective** - Only persists what can be resumed, resets transient state
6. **Case status and flow step are different** - One tracks database state, one tracks UI progress
7. **Backward navigation always allowed** - Users can review previous steps anytime
8. **Processing state resets** - Upload/extraction progress flags don't persist (good design!)

---

## 🚦 State Machine

```
┌─────────────┐
│ case_creation│
└──────┬──────┘
       │ (complete)
       ↓
┌──────────────────┐
│ document_upload  │
└──────┬───────────┘
       │ (complete)
       ↓
┌──────────────────────┐
│ entity_extraction    │
└──────┬───────────────┘
       │ (complete)
       ↓
┌──────────────────┐
│ canvas_review    │
└──────┬───────────┘
       │ (optional)
       ↓
┌──────────────────────┐
│ draft_generation     │
└──────┬───────────────┘
       │ (complete)
       ↓
┌──────────┐
│ COMPLETE │
└──────────┘
```

Each step can navigate backward to any previous step at any time.

---

**Last Updated**: 2025-12-26
**For Questions**: See PURCHASE_SALE_FLOW_ANALYSIS.md sections 10-12
