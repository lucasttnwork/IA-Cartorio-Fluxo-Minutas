# Purchase-Sale Flow Resumption - Visual Diagrams

## 1. New Case vs Resume Case Flow

```
DASHBOARD PAGE
│
├─→ User clicks "Novo Caso"
│   ├─ Reset flow: resetFlow() called
│   └─ Navigate to: /purchase-sale-flow (NO caseId)
│
└─→ User clicks "Continuar fluxo" on card
    ├─ Navigate to: /purchase-sale-flow?caseId=abc123
    └─ PurchaseSaleFlowPage detects caseId parameter
        │
        ├─ If NO caseId:
        │   ├─ resetFlow()
        │   └─ startFlow() → Creates new flowId
        │
        └─ If YES caseId:
            └─ startFlow() → Zustand persist restores from localStorage!
                └─ Restored state includes currentStep, caseData, documents, entities...
```

---

## 2. Step Completion & Persistence Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PURCHASE-SALE FLOW WIZARD                     │
└─────────────────────────────────────────────────────────────────┘

User Interaction              Store Update                Storage
────────────────────────────────────────────────────────────────

1. CASE CREATION
   User fills: title, actType
   User clicks: "Criar e Continuar"
         │
         ├─→ flow.createCase()
         │   └─ POST /api/cases
         │       └─ DB creates case (status='draft')
         │           │
         │           ├─ store.setCaseId(id)
         │           ├─ store.markStepCompleted('case_creation')
         │           │
         │           └─→ [Zustand persist writes to localStorage]
         │               {
         │                 flowId: '...',
         │                 currentStep: 'case_creation',
         │                 caseData: { id: '...', title, actType },
         │                 steps: [...],
         │                 ...
         │               }
         │
         ├─→ flow.nextStep()
         │   └─ currentStep = 'document_upload'
         │       └─→ [localStorage updated again]

2. DOCUMENT UPLOAD
   User uploads: doc1.pdf, doc2.jpg
         │
         ├─→ DocumentDropzone handles upload
         │   ├─ POST /storage/upload
         │   └─ POST /api/documents (create record)
         │       ├─ store.addDocument(doc)
         │       ├─ store.setUploadProgress(docId, 100)
         │       │
         │       └─→ [localStorage updated]
         │           └─ documents: [doc1, doc2]
         │
         ├─→ When ≥1 upload succeeds:
         │   ├─ flow.markStepCompleted('document_upload')
         │   └─→ [localStorage updated]
         │
         └─→ flow.nextStep()
             └─ currentStep = 'entity_extraction'
                 └─→ [localStorage updated]

3. ENTITY EXTRACTION
   User clicks: "Iniciar Extracao"
         │
         ├─→ flow.startExtraction()
         │   ├─ Create processing jobs (ocr, extraction, entity_extraction, entity_resolution)
         │   ├─ Poll job progress every 2 seconds
         │   └─ When complete:
         │       ├─ store.setPeople([...])
         │       ├─ store.setProperties([...])
         │       ├─ store.setEdges([...])
         │       ├─ store.markStepCompleted('entity_extraction')
         │       │
         │       └─→ [localStorage updated with ALL extraction data]
         │           └─ people: [person1, person2, ...]
         │              properties: [property1, ...]
         │              edges: [edge1, ...]
         │
         └─→ flow.nextStep()
             └─ currentStep = 'canvas_review'
                 └─→ [localStorage updated]

4. CANVAS REVIEW
   User views summary, clicks: "Abrir Canvas Completo"
         │
         ├─→ Navigate to: /case/{caseId}/canvas
         │   └─ [CanvasPage opens separately]
         │
         └─→ User returns (back button or nav)
             ├─ currentStep still = 'canvas_review'
             └─→ [localStorage still has all data]

5. DRAFT GENERATION
   User clicks: "Gerar Minuta"
         │
         ├─→ flow.generateDraft()
         │   └─ Generate draft with extracted data
         │       ├─ store.setDraft(draft)
         │       │
         │       └─→ [localStorage updated with draft]
         │           └─ draftData: { draft: {...} }
         │
         ├─→ User clicks: "Concluir"
         │   ├─ useFlowStore.getState().completeFlow()
         │   ├─ Sets completedAt timestamp
         │   │
         │   └─→ [localStorage updated with completion]
         │
         └─→ FlowCompletion component shows success screen
```

---

## 3. Resume Mechanism - Step by Step

```
SCENARIO: User closes browser during extraction step, comes back 2 hours later

├─ localStorage still has:
│  {
│    flowId: 'flow-1703001234-abc123',
│    isActive: true,
│    currentStep: 'entity_extraction',
│    steps: [
│      { id: 'case_creation', status: 'completed' },
│      { id: 'document_upload', status: 'completed' },
│      { id: 'entity_extraction', status: 'in_progress' },
│      { id: 'canvas_review', status: 'pending' },
│      { id: 'draft_generation', status: 'pending' }
│    ],
│    caseData: { id: 'case-123', title: 'Venda Apt 101', actType: 'purchase_sale' },
│    documentData: {
│      documents: [
│        { id: 'doc-1', original_name: 'rg.pdf', status: 'processed' },
│        { id: 'doc-2', original_name: 'matricula.pdf', status: 'processed' }
│      ],
│      uploadProgress: {} // Reset by partialize
│    },
│    extractionData: {
│      people: [
│        { id: 'p1', full_name: 'João Silva', cpf: '123.456.789-00', ... },
│        { id: 'p2', full_name: 'Maria Silva', cpf: '987.654.321-11', ... }
│      ],
│      properties: [
│        { id: 'pr1', registry_number: '123456', address: {...}, ... }
│      ],
│      edges: [
│        { id: 'e1', source_id: 'p1', target_id: 'pr1', relationship: 'owns', ... }
│      ],
│      isProcessing: false,     // Reset by partialize
│      processingProgress: 0    // Reset by partialize
│    },
│    draftData: { draft: null }
│  }
│
└─ User clicks "Continuar fluxo" on dashboard
   │
   ├─→ Dashboard determines case status = 'processing' (not completed)
   │   └─ Constructs URL: /purchase-sale-flow?caseId=case-123
   │
   ├─→ PurchaseSaleFlowPage mounts
   │   │
   │   ├─ Extract from URL: caseIdFromUrl = 'case-123'
   │   │
   │   ├─ useEffect runs initialization:
   │   │  if (caseIdFromUrl) {
   │   │    if (!flow.isActive) {
   │   │      flow.startFlow('purchase_sale')  // ← THIS TRIGGERS RESTORE!
   │   │    }
   │   │  }
   │   │
   │   └─ startFlow() is called:
   │      {
   │        flowId: generateFlowId(),  // Creates NEW flowId
   │        isActive: true,
   │        currentStep: 'case_creation',  // Resets to beginning...
   │        steps: FLOW_STEPS.map(...)  // Reset all steps
   │        // ... other fields reset ...
   │      }
   │
   └─→ BUT! Zustand's persist middleware intercepts:
       │
       ├─ Middleware sees: set(state) called in startFlow()
       ├─ Before updating, middleware:
       │  1. Loads current state
       │  2. Applies partialize() to save to localStorage
       │  3. THEN loads from localStorage to hydrate
       │     [Because store was created with persist config]
       │
       └─→ RESULT: State is RESTORED from localStorage!
          {
            flowId: 'flow-1703001234-abc123',    ← RESTORED
            isActive: true,                       ← RESTORED
            currentStep: 'entity_extraction',     ← RESTORED (user's position!)
            steps: [
              { id: 'case_creation', status: 'completed' },    ← RESTORED
              { id: 'document_upload', status: 'completed' },   ← RESTORED
              { id: 'entity_extraction', status: 'in_progress' }, ← RESTORED
              ...
            ],
            caseData: { id: 'case-123', ... },     ← RESTORED
            documentData: {
              documents: [doc1, doc2, ...],        ← RESTORED
              uploadProgress: {}
            },
            extractionData: {
              people: [person1, person2, ...],    ← RESTORED
              properties: [property1, ...],       ← RESTORED
              edges: [edge1, ...],                ← RESTORED
              isProcessing: false,                ← RESET by partialize
              processingProgress: 0               ← RESET by partialize
            },
            draftData: { draft: null }            ← RESTORED
          }
       │
       └─→ PurchaseSaleFlowPage renders:
          ├─ currentStep = 'entity_extraction'
          ├─ Shows EntityExtractionStep component
          ├─ Displays previously extracted people and properties
          └─ User can continue from where they left off!
```

---

## 4. State Persistence Timeline

```
Timeline: New Case to Complete

T=0s     User clicks "Novo Caso"
         ├─ resetFlow() clears localStorage['flow-store']
         └─ navigate('/purchase-sale-flow')

T=1s     PurchaseSaleFlowPage initializes
         ├─ No caseId in URL
         └─ flow.startFlow('purchase_sale')
            └─ localStorage['flow-store'] = {
                 flowId: 'flow-...',
                 isActive: true,
                 currentStep: 'case_creation',
                 caseData: { title: '', actType: 'purchase_sale' },
                 ...
               }

T=10s    User enters case title and act type
         ├─ flow.updateCaseTitle('Venda Apt 101')
         ├─ flow.updateActType('purchase_sale')
         └─ localStorage['flow-store'] updates immediately
            └─ caseData: { title: 'Venda Apt 101', actType: 'purchase_sale' }

T=20s    User clicks "Criar e Continuar"
         ├─ flow.createCase()
         ├─ Case created in DB: id='case-123'
         ├─ flow.setCaseId('case-123')
         ├─ flow.markStepCompleted('case_creation')
         ├─ flow.nextStep()
         └─ localStorage['flow-store'] updates:
            └─ caseData: { id: 'case-123', title: 'Venda Apt 101', ... }
               currentStep: 'document_upload'
               steps[0].status: 'completed'

T=60s    User uploads 2 documents
         ├─ DocumentDropzone uploads files
         ├─ store.addDocument(doc1)
         ├─ store.addDocument(doc2)
         ├─ flow.markStepCompleted('document_upload')
         ├─ flow.nextStep()
         └─ localStorage['flow-store'] updates:
            └─ documentData.documents: [doc1, doc2]
               currentStep: 'entity_extraction'
               steps[1].status: 'completed'

T=120s   User clicks "Iniciar Extracao"
         ├─ flow.startExtraction()
         ├─ Creates ocr/extraction/entity_extraction jobs
         ├─ Polls progress every 2 seconds
         └─ localStorage NOT updated during polling (status flags not persisted)

T=180s   Jobs complete
         ├─ flow.setPeople([person1, person2])
         ├─ flow.setProperties([property1])
         ├─ flow.setEdges([edge1])
         ├─ flow.markStepCompleted('entity_extraction')
         ├─ flow.nextStep()
         └─ localStorage['flow-store'] updates:
            └─ extractionData: { people: [...], properties: [...], edges: [...] }
               currentStep: 'canvas_review'
               steps[2].status: 'completed'

T=200s   [User closes browser here]
         └─ localStorage['flow-store'] still has:
            └─ currentStep: 'canvas_review'
               All documents, people, properties, edges preserved

T=7200s  [2 hours later, user returns]
         ├─ Clicks "Continuar fluxo" on dashboard
         ├─ navigate('/purchase-sale-flow?caseId=case-123')
         ├─ PurchaseSaleFlowPage initializes
         ├─ flow.startFlow() triggers persist middleware hydration
         └─ localStorage['flow-store'] RESTORED:
            └─ currentStep: 'canvas_review'     ← User sees canvas review step!
               All data intact
```

---

## 5. Key Data Flow Arrows

```
CASE CREATION STEP:
┌────────────────┐
│ User Input     │ title, actType
└────────┬───────┘
         │ flow.updateCaseTitle()
         │ flow.updateActType()
         ↓
    ┌──────────┐
    │ Zustand  │ caseData updated
    │  Store   │
    └────┬─────┘
         │ (persist middleware)
         ↓
    ┌──────────────────────┐
    │  localStorage[...]   │ "flow-store" key
    └──────────────────────┘


ENTITY EXTRACTION STEP:
┌──────────────────┐
│ Processing Jobs  │ ocr, extraction, entity_extraction, entity_resolution
│ (Background)     │
└────────┬─────────┘
         │ Job completions
         ↓
    ┌──────────────────────────────────┐
    │ flow.setPeople()                 │
    │ flow.setProperties()             │
    │ flow.setEdges()                  │
    │ flow.markStepCompleted()         │
    └────────┬─────────────────────────┘
             │
             ↓
        ┌──────────┐
        │ Zustand  │ extractionData updated
        │  Store   │
        └────┬─────┘
             │ (persist middleware)
             ↓
        ┌──────────────────────┐
        │  localStorage[...]   │ extractionData serialized
        └──────────────────────┘
                     ↑
                     │
        ┌────────────────────────────────┐
        │ Page Refresh / Tab Close        │
        │ (User leaves)                  │
        └────────────────────────────────┘


RESUMPTION:
┌────────────────────────────────────┐
│ User Returns with URL parameter    │
│ /purchase-sale-flow?caseId=case-123│
└────────┬─────────────────────────────┘
         │
         ↓
    ┌──────────────────────┐
    │  localStorage[...]   │ "flow-store" key exists!
    └────────┬─────────────┘
             │ persist middleware hydrates
             ↓
        ┌──────────────────────┐
        │ Zustand Store        │ Fully restored with
        │ rehydrated           │ - currentStep
        │                      │ - caseData
        │                      │ - documents
        │                      │ - people, properties, edges
        └────────┬─────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │ PurchaseSaleFlowPage   │
        │ renders at LAST STEP   │
        └────────────────────────┘
```

---

## 6. Critical Dependencies

```
Flow Resumption depends on:

✓ Zustand persist middleware enabled
  └─ Location: src/stores/flowStore.ts, line 222
     persist((set, get) => ({ ... }), { name: 'flow-store', partialize: ... })

✓ URL parameter handling
  └─ Location: src/pages/PurchaseSaleFlowPage.tsx, line 839
     const caseIdFromUrl = searchParams.get('caseId')

✓ Initialization logic
  └─ Location: src/pages/PurchaseSaleFlowPage.tsx, lines 851-876
     useEffect detects caseId and calls flow.startFlow()

✓ Case context preservation
  └─ Location: src/stores/flowStore.ts, lines 530-550
     partialize() includes caseData and extraction data

✓ Database connection
  └─ Case must exist in DB with case_id parameter matching
     Otherwise flow will create new case

✓ localStorage availability
  └─ Browser must have localStorage enabled
     If disabled, resumption won't work
```

---

## 7. State Diagram

```
                    ┌─────────────────────┐
                    │ FLOW NOT INITIALIZED│
                    │  isActive: false    │
                    │ currentStep: null   │
                    └──────────┬──────────┘
                               │
                    ┌──────────────────────┐
                    │ resetFlow() called   │
                    └──────────┬───────────┘
                               │
                    ┌──────────────────────────┐
                    │ startFlow() called       │
                    │ - Generate flowId       │
                    │ - Set isActive=true     │
                    │ - Set currentStep='...' │
                    │ - Case data initialized │
                    └──────────┬──────────────┘
                               │
                  ┌────────────────────────────────┐
                  │ Persist middleware restores    │
                  │ from localStorage if available │
                  └────────────┬───────────────────┘
                               │
                   ┌───────────────────────────┐
                   │ FLOW ACTIVE               │
                   │ isActive: true            │
                   │ currentStep: restored     │
                   │ caseData: restored        │
                   │ documents: restored       │
                   │ people/properties: ...    │
                   └───────────┬───────────────┘
                               │
                    ┌──────────────────────────┐
                    │ User navigates steps     │
                    │ - goToStep()             │
                    │ - nextStep()             │
                    │ - previousStep()         │
                    └──────────┬───────────────┘
                               │
                    ┌──────────────────────────┐
                    │ State updated            │
                    │ Persist saves to         │
                    │ localStorage automatically│
                    └──────────┬───────────────┘
                               │
                    ┌──────────────────────────┐
                    │ User closes browser      │
                    │ (or navigates away)      │
                    └──────────┬───────────────┘
                               │
                    ┌──────────────────────────┐
                    │ State persisted in       │
                    │ localStorage['flow-store']
                    └──────────┬───────────────┘
                               │
                    ┌──────────────────────────┐
                    │ Hours/days later...      │
                    │ User returns with caseId │
                    └──────────┬───────────────┘
                               │
                    ┌──────────────────────────┐
                    │ startFlow() called again │
                    │ Persist middleware       │
                    │ RESTORES from localStorage
                    └──────────┬───────────────┘
                               │
                   ┌───────────────────────────┐
                   │ FLOW RESUMED              │
                   │ currentStep: where left   │
                   │ All data preserved        │
                   │ User sees last position   │
                   └───────────────────────────┘
```

---

## Summary

The resumption mechanism relies on:

1. **URL parameter** (`?caseId=...`) signals resume intent
2. **Zustand persist** saves to localStorage on every state change
3. **Automatic hydration** restores when store is initialized
4. **Selective serialization** via `partialize()` saves what matters
5. **Step status tracking** ensures navigation validity

All happening **transparently** through Zustand's persist middleware!
