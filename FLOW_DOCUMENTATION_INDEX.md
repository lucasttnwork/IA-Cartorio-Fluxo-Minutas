# Purchase-Sale Flow Documentation Index

Welcome! This index helps you navigate the comprehensive analysis of how the purchase-sale flow works, especially the resumption mechanism.

---

## 📚 Documentation Files

### 1. **This File** - INDEX & NAVIGATION
📄 `FLOW_DOCUMENTATION_INDEX.md`

Your roadmap to all documentation. Start here if you're new to the flow.

---

### 2. **EXECUTIVE SUMMARY** - Start Here
📄 `FLOW_IMPLEMENTATION_SUMMARY.md`

**Best for**: Understanding the big picture in 10 minutes

**Contains**:
- Complete journey diagram (user → UI → hook → store → localStorage)
- Architecture layers (UI, Hook, State, Persistence)
- Data flow diagram
- Key data structures
- Step completion conditions
- Navigation rules
- Why this architecture works
- Common patterns
- Testing approach

**Key Insight**: How Zustand persist middleware automatically saves and restores flow state

---

### 3. **DETAILED ANALYSIS** - Deep Dive
📄 `PURCHASE_SALE_FLOW_ANALYSIS.md`

**Best for**: Understanding every detail and implementation decision

**Contains**:
- Section 1: Flow step sequence
- Section 2: Dashboard navigation logic
- Section 3: State persistence architecture
  - Zustand store configuration
  - localStorage schema
  - What persists vs. resets
- Section 4: Step completion for each of 5 steps
  - Case creation completion
  - Document upload completion
  - Entity extraction completion
  - Canvas review completion
  - Draft generation completion
- Section 5: Resume scenarios (4 detailed examples)
- Section 6: Case status vs. flow step relationship
- Section 7: URL routes and navigation
- Section 8: Data flow during each step
- Section 9: Key files and related files
- Section 10: The magic of resumption logic
- Section 11: Common issues & solutions
- Section 12: Future improvements

**Key Files Referenced**:
- `src/stores/flowStore.ts` (state management)
- `src/hooks/usePurchaseSaleFlow.ts` (business logic)
- `src/pages/PurchaseSaleFlowPage.tsx` (UI)
- `src/pages/DashboardPage.tsx` (entry point)

---

### 4. **VISUAL DIAGRAMS** - See the Flows
📄 `FLOW_RESUMPTION_DIAGRAM.md`

**Best for**: Visual learners who want to see the flow in pictures

**Contains**:
- New Case vs. Resume Case flow diagram
- Step completion & persistence timeline
- Resume mechanism step-by-step walkthrough
- State persistence timeline (T=0s to T=7200s)
- Key data flow arrows (case creation, extraction, resumption)
- Critical dependencies graph
- State machine diagram
- Summary of how resumption works

**Best Diagrams**:
- Diagram 3: "Resume Mechanism" (most important!)
- Diagram 4: "State Persistence Timeline"
- Diagram 7: "State Machine"

---

### 5. **QUICK REFERENCE** - Cheat Sheet
📄 `FLOW_QUICK_REFERENCE.md`

**Best for**: Quick lookups while coding

**Contains**:
- Quick answer (1 sentence)
- Key files table
- Flow step sequence (visual)
- Entry points (new vs. resume)
- What gets persisted (YES/NO checklist)
- Resume initialization code
- Step completion checklist
- Navigation rules
- Case status vs. Flow step relationship
- Key methods in usePurchaseSaleFlow
- Common code patterns
- Debug checklist
- Testing flow
- localStorage schema
- Performance notes
- Key insights

**Perfect for**: Debugging, implementing features, remembering details

---

## 🗺️ Navigation Guide

### If You're Asking...

#### **"How does resumption work?"**
→ Read `FLOW_IMPLEMENTATION_SUMMARY.md` Section "Why This Architecture Works"
→ Then `FLOW_RESUMPTION_DIAGRAM.md` Diagram 3

#### **"What gets saved to localStorage?"**
→ `FLOW_QUICK_REFERENCE.md` "What Gets Persisted" section
→ Or `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 3.1

#### **"How do I resume a case?"**
→ `FLOW_IMPLEMENTATION_SUMMARY.md` top section
→ Or `FLOW_QUICK_REFERENCE.md` "Entry Points" section

#### **"What's the complete flow from start to finish?"**
→ `FLOW_IMPLEMENTATION_SUMMARY.md` "Complete Journey" diagram
→ Or `FLOW_RESUMPTION_DIAGRAM.md` Diagram 2

#### **"When does each step complete?"**
→ `FLOW_QUICK_REFERENCE.md` "Step Completion Checklist"
→ Or `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 4

#### **"I need to debug resumption. Where do I start?"**
→ `FLOW_QUICK_REFERENCE.md` "Debug Resume Issues" section
→ Then check localStorage: `console.log(localStorage.getItem('flow-store'))`

#### **"What files do I need to modify to add a new step?"**
→ `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 9
→ Key files: `flowStore.ts`, `usePurchaseSaleFlow.ts`, `PurchaseSaleFlowPage.tsx`

#### **"How do validation and navigation rules work?"**
→ `FLOW_QUICK_REFERENCE.md` "Navigation Rules" section
→ Or `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 3.2

#### **"What happens if localStorage is cleared?"**
→ `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 11 "Issues & Solutions"
→ Quick answer: Flow starts from step 1

#### **"How do I test if resumption works?"**
→ `FLOW_IMPLEMENTATION_SUMMARY.md` "Testing Resumption" section
→ Has both manual and automated test examples

---

## 🔑 Key Concepts

### 1. **URL Parameter Signaling**
- **No parameter**: `/purchase-sale-flow` → New case
- **With parameter**: `/purchase-sale-flow?caseId=abc123` → Resume case

### 2. **Zustand Persist Middleware**
The magic that makes resumption work automatically:
```typescript
persist(
  (set, get) => ({ /* store */ }),
  { name: 'flow-store', partialize: (state) => ({ /* filtered */ }) }
)
```
- `persist`: Enables localStorage
- `name: 'flow-store'`: localStorage key
- `partialize`: Selects what to save

### 3. **Step Status Gating**
```typescript
canGoToStep(step):
  - Past steps: Always allowed (can go back)
  - Future steps: Allowed only if all previous steps 'completed'
```

### 4. **Data Persistence Layer**
```
User Action → Hook Update → Store Update → Persist Middleware → localStorage
                                                    ↓
                                        Page Refresh/Close
                                                    ↓
                                        Page Reload → Init Store
                                        Persist Middleware → Restore from localStorage
```

### 5. **Case Status ≠ Flow Step**
- **Case Status** (database): `draft`, `processing`, `review`, `approved`, `archived`
- **Flow Step** (UI state): `case_creation`, `document_upload`, etc.
- Dashboard uses case status to decide: skip flow or resume flow

---

## 📋 File Reading Order

### For Quick Understanding (30 minutes)
1. This file (INDEX)
2. `FLOW_QUICK_REFERENCE.md` (Quick overview)
3. `FLOW_IMPLEMENTATION_SUMMARY.md` → top section (Big picture)

### For Complete Understanding (2-3 hours)
1. This file (INDEX)
2. `FLOW_IMPLEMENTATION_SUMMARY.md` (Complete)
3. `FLOW_RESUMPTION_DIAGRAM.md` (Visual understanding)
4. `PURCHASE_SALE_FLOW_ANALYSIS.md` (Deep dive)
5. `FLOW_QUICK_REFERENCE.md` (Memorize key points)

### For Debugging/Implementing Features (As Needed)
1. `FLOW_QUICK_REFERENCE.md` (Find what you need)
2. Go to specific section in `PURCHASE_SALE_FLOW_ANALYSIS.md`
3. Check code in `src/stores/flowStore.ts` or `src/hooks/usePurchaseSaleFlow.ts`

---

## 🎓 Learning Path

### Level 1: Beginner
**Goal**: Understand basic flow concept

**Do**:
- Read `FLOW_QUICK_REFERENCE.md` "Quick Answer"
- Review `FLOW_IMPLEMENTATION_SUMMARY.md` top 3 sections
- Look at flow step sequence diagram

**Know**: The 5 steps and what each does

---

### Level 2: Intermediate
**Goal**: Understand how resumption works

**Do**:
- Read entire `FLOW_IMPLEMENTATION_SUMMARY.md`
- Study `FLOW_RESUMPTION_DIAGRAM.md` Diagram 3 & 4
- Review `PURCHASE_SALE_FLOW_ANALYSIS.md` Sections 2, 3

**Know**: localStorage, persist middleware, URL parameter, initialization

---

### Level 3: Advanced
**Goal**: Implement features or debug issues

**Do**:
- Read all documentation thoroughly
- Study code files:
  - `src/stores/flowStore.ts` (entire file)
  - `src/hooks/usePurchaseSaleFlow.ts` (entire file)
  - `src/pages/PurchaseSaleFlowPage.tsx` (especially lines 845-876, 970-1031)
- Run manual tests from `FLOW_IMPLEMENTATION_SUMMARY.md`
- Debug with browser DevTools

**Know**: Every detail, all edge cases, can add new features

---

## 🔗 Cross-Reference Matrix

| Topic | Quick Reference | Analysis | Diagrams | Summary |
|-------|-----------------|----------|----------|---------|
| **Resumption Logic** | Lines 1-50 | Sec 5 | Diag 3 | Sec "Why This Architecture Works" |
| **URL Routing** | Lines 70-80 | Sec 7 | Diag 1 | Sec "UI Layer" |
| **localStorage** | Lines 22-40 | Sec 3 | Diag 5 | Sec "Data Persistence" |
| **Step Completion** | Lines 90-110 | Sec 4 | Diag 2 | Sec "Step Completion" |
| **Navigation Rules** | Lines 130-145 | Sec 3.2 | Diag 7 | Sec "Navigation Rules" |
| **Data Structures** | Lines 290-350 | Sec 10 | Diag 6 | Sec "Key Data Structures" |
| **API Integration** | Lines 360-380 | Sec 8 | Diag 4 | Sec "Hook Layer" |
| **Debugging** | Lines 450-520 | Sec 11 | - | Sec "Testing" |

---

## 🚀 Quick Start for Developers

### I Want to...

#### ...Add a new step to the flow
1. Add to `FlowStep` type in `flowStore.ts`
2. Add to `FLOW_STEPS` array in `flowStore.ts`
3. Add to `STEP_ORDER` array in `flowStore.ts`
4. Create step component in `PurchaseSaleFlowPage.tsx`
5. Add to `renderStepContent()` switch statement
6. Add validation function in `usePurchaseSaleFlow.ts`

**Reference**: `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 9

#### ...Fix a resumption bug
1. Check `localStorage.getItem('flow-store')` in DevTools
2. Is caseId in URL? `location.search`
3. Is flow being reset unexpectedly?
4. Check initialization logic: `PurchaseSaleFlowPage.tsx` lines 851-876

**Reference**: `FLOW_QUICK_REFERENCE.md` "Debugging Resume Issues"

#### ...Implement step validation
1. Look at existing validators in `usePurchaseSaleFlow.ts` lines 104-208
2. Add validation function for new step
3. Call from `validateCurrentStep()` and `getStepValidation()`
4. Return `{ isValid: boolean, errors: string[] }`

**Reference**: `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 4

#### ...Trace data flow for a feature
1. Start in UI: `PurchaseSaleFlowPage.tsx`
2. Find method call: `flow.methodName()`
3. Go to hook: `usePurchaseSaleFlow.ts`
4. Find store calls: `store.setData()`
5. Check store: `flowStore.ts`
6. Verify persistence: `partialize()` includes field

**Reference**: `FLOW_IMPLEMENTATION_SUMMARY.md` "Data Flow Diagram"

---

## 📞 Quick Help

### "How do I..."

| Question | Answer Location |
|----------|-----------------|
| Start a new case? | `FLOW_QUICK_REFERENCE.md` "Entry Points" → New Case |
| Resume a case? | `FLOW_QUICK_REFERENCE.md` "Entry Points" → Resume Case |
| Check what's persisted? | `FLOW_QUICK_REFERENCE.md` "What Gets Persisted" |
| Understand navigation rules? | `FLOW_QUICK_REFERENCE.md` "Navigation Rules" |
| See step completion logic? | `FLOW_QUICK_REFERENCE.md` "Step Completion Checklist" |
| Debug localStorage? | `FLOW_QUICK_REFERENCE.md` "Debugging" |
| Find relevant code? | `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 9 |
| Test resumption? | `FLOW_IMPLEMENTATION_SUMMARY.md` "Testing Resumption" |
| Understand persistence? | `FLOW_RESUMPTION_DIAGRAM.md` Diagram 5 |
| See state machine? | `FLOW_RESUMPTION_DIAGRAM.md` Diagram 7 |

---

## 🎯 Common Use Cases

### Use Case 1: "I need to understand how flow resumption works"
1. Read: `FLOW_IMPLEMENTATION_SUMMARY.md` top section
2. See: `FLOW_RESUMPTION_DIAGRAM.md` Diagram 3
3. Deep dive: `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 5

### Use Case 2: "A user can't resume their flow"
1. Check: `localStorage.getItem('flow-store')`
2. Verify: URL has `?caseId=` parameter
3. Debug: `FLOW_QUICK_REFERENCE.md` debug section
4. Fix: Re-read `PURCHASE_SALE_FLOW_ANALYSIS.md` Section 2

### Use Case 3: "I need to add a new validation rule"
1. Find: Existing validator in `usePurchaseSaleFlow.ts`
2. Copy: Function template
3. Modify: For your validation logic
4. Call: From `validateCurrentStep()` or `canProceed`

### Use Case 4: "I'm adding a new field to persist"
1. Add: Field to component state
2. Update: `partialize()` in `flowStore.ts`
3. Verify: Field is saved to localStorage
4. Test: Resume flow and check field restored

### Use Case 5: "I need to understand the complete data flow"
1. Diagram: `FLOW_IMPLEMENTATION_SUMMARY.md` "Complete Journey"
2. Details: `FLOW_IMPLEMENTATION_SUMMARY.md` "Data Flow Diagram"
3. Code: Start in `PurchaseSaleFlowPage.tsx`, follow to `flowStore.ts`

---

## 📈 Complexity Levels

| Concept | Difficulty | Time | Files |
|---------|-----------|------|-------|
| What is a flow step? | ⭐ Easy | 5 min | Quick Ref |
| How does URL routing work? | ⭐ Easy | 10 min | Diagrams |
| How does localStorage save data? | ⭐⭐ Medium | 15 min | Analysis Sec 3 |
| How does resumption work? | ⭐⭐ Medium | 30 min | Summary + Diagrams |
| How do validation rules work? | ⭐⭐ Medium | 20 min | Analysis Sec 4 |
| How do I add a new step? | ⭐⭐⭐ Complex | 1-2 hr | All files |
| How do I debug persistence? | ⭐⭐⭐ Complex | 1 hr | Analysis Sec 11 + Quick Ref |
| How do I understand all edge cases? | ⭐⭐⭐⭐ Very Hard | 3-4 hr | All files deeply |

---

## 📝 Document Maintenance

**Last Updated**: 2025-12-26
**Version**: 1.0
**Status**: Complete

### Document Structure
- `FLOW_DOCUMENTATION_INDEX.md` (This file) - Navigation & overview
- `FLOW_IMPLEMENTATION_SUMMARY.md` - Executive summary & architecture
- `FLOW_RESUMPTION_DIAGRAM.md` - Visual diagrams
- `PURCHASE_SALE_FLOW_ANALYSIS.md` - Detailed analysis
- `FLOW_QUICK_REFERENCE.md` - Quick lookup guide

### How to Update
When code changes:
1. Update relevant analysis file
2. Update diagrams if flow changes
3. Update quick reference
4. Update this index if structure changes

---

## 🎉 You Now Know...

After reading these documents, you'll understand:

✓ The 5 steps of the purchase-sale flow
✓ How users resume where they left off
✓ The role of localStorage and Zustand persist
✓ Why URL parameters are important
✓ How step completion determines navigation
✓ The data structures involved
✓ How to debug resumption issues
✓ How to add new features
✓ The architecture patterns used
✓ The dependencies and interactions

---

## 🚀 Next Steps

1. **Start reading**: Pick a document based on your goal from "Navigation Guide"
2. **Keep handy**: `FLOW_QUICK_REFERENCE.md` for quick lookups
3. **Refer back**: Use cross-reference matrix when exploring
4. **Code along**: Open relevant files while reading
5. **Test it**: Try manual tests from `FLOW_IMPLEMENTATION_SUMMARY.md`

---

**Happy learning! 🎓**

If you get stuck, check the "Common Use Cases" section above for your specific scenario.
