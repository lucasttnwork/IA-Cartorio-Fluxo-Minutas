# Proxy Validity Check Feature Implementation

## Overview
Implemented a comprehensive proxy document validation system that checks the validity of proxy (procuração) documents attached to representation relationships in the canvas.

## Feature ID
**proxy-validity**

## Implementation Summary

### 1. Type System Extensions
**File:** `src/types/index.ts`

Added `DocumentMetadata` interface to support structured metadata for proxy documents:

```typescript
export interface DocumentMetadata {
  // Proxy-specific fields
  proxy_expiration_date?: string // ISO date string
  proxy_powers?: string[] // e.g., ['comprar', 'vender', 'assinar']
  proxy_signatories?: string[] // Names of people who signed
  proxy_grantor?: string // Name of person granting the power
  proxy_grantee?: string // Name of person receiving the power
  proxy_notary_info?: string // Notary office information
  proxy_type?: 'public' | 'private' // Type of proxy

  [key: string]: unknown // Allow other metadata
}
```

### 2. Proxy Validation Utility
**File:** `src/utils/proxyValidation.ts` (NEW)

Created a dedicated validation utility that checks:

#### Validation Rules:
1. **Expiration Date**
   - ERROR if proxy is expired
   - WARNING if proxy expires within 30 days

2. **Required Powers**
   - ERROR if proxy lacks real estate transaction powers (vender, comprar, alienar, transacionar, negociar)
   - WARNING if powers were not extracted

3. **Signatories**
   - ERROR if no signatories identified

4. **Grantor (Outorgante)**
   - ERROR if grantor not identified

5. **Grantee (Outorgado)**
   - ERROR if grantee not identified

6. **Additional Warnings**
   - WARNING if private proxy (less formal than public)
   - WARNING if notary information missing
   - WARNING if document classification confidence < 70%

#### Key Functions:
- `validateProxyDocument(document: Document): ProxyValidationResult`
- `getProxyValidationSummary(result: ProxyValidationResult): string`

### 3. Canvas Validation Integration
**File:** `src/utils/canvasValidation.ts`

Extended the canvas validation system with a new function:

```typescript
function checkProxyValidity(
  people: Person[],
  edges: GraphEdge[],
  documents: Document[]
): ValidationWarning[]
```

This function:
- Finds all representation relationships with attached proxy documents
- Validates each proxy document using `validateProxyDocument()`
- Converts validation errors/warnings into canvas validation warnings
- Links warnings to affected persons (representative and represented)

### 4. Data Loading Enhancement
**File:** `src/hooks/useCanvasData.ts`

Extended the canvas data hook to include proxy documents:

```typescript
export interface CanvasData {
  people: Person[]
  properties: Property[]
  edges: GraphEdge[]
  documents: Document[] // NEW
}
```

- Fetches proxy documents alongside other canvas data
- Subscribes to real-time document updates
- Filters for `doc_type = 'proxy'` documents

### 5. UI Component Enhancement
**File:** `src/components/canvas/AttachProxyDialog.tsx`

Added visual proxy validity indicators:

- New function `getProxyValidityBadge(doc: Document)` that displays:
  - ✅ Green "Válida" badge for valid proxies
  - ⚠️ Yellow warning badge showing number of warnings
  - ❌ Red "Inválida" badge for invalid proxies

- Updated document card layout to show both status and validity badges

### 6. Page Integration
**File:** `src/pages/CanvasPage.tsx`

Updated validation warnings calculation to include documents:

```typescript
const validationWarnings = useMemo<ValidationWarning[]>(() => {
  return validateCanvas(data.people, data.properties, data.edges, data.documents)
}, [data.people, data.properties, data.edges, data.documents])
```

## Validation Test Scenarios

Created `test-proxy-validation.html` demonstrating 5 test scenarios:

1. **✅ Valid Proxy** - All validation criteria met
2. **❌ Expired Proxy** - Expiration date in the past
3. **⚠️ Expiring Soon** - Expires within 30 days
4. **❌ Missing Powers** - Lacks real estate transaction powers
5. **❌ Incomplete Data** - Missing signatories, grantor, grantee

## Validation Results

All test scenarios passed successfully:

- **Valid proxy**: Shows green "Válida" badge
- **Expired proxy**: Shows red "Inválida" badge with "EXPIRED" error
- **Expiring soon**: Shows yellow warning badge with "EXPIRING_SOON" warning
- **Missing powers**: Shows red "Inválida" badge with "MISSING_POWERS" error
- **Incomplete**: Shows multiple errors (signatories, grantor, grantee) and warnings

## Files Modified

1. `src/types/index.ts` - Added DocumentMetadata interface
2. `src/utils/canvasValidation.ts` - Added checkProxyValidity function
3. `src/hooks/useCanvasData.ts` - Added documents to CanvasData
4. `src/pages/CanvasPage.tsx` - Integrated documents into validation
5. `src/components/canvas/AttachProxyDialog.tsx` - Added validity badges

## Files Created

1. `src/utils/proxyValidation.ts` - Proxy validation utility
2. `test-proxy-validation.html` - Validation demo page

## TypeScript Compliance

All code changes are TypeScript-compliant with no errors in the modified files.

## Real-time Updates

The system automatically reloads when:
- Documents are uploaded
- Document metadata is updated
- Graph edges are modified
- Person data changes

## Future Enhancements

Potential improvements:
1. Add validation for specific proxy powers (e.g., "vender apartamento")
2. Parse expiration dates from OCR text
3. Match proxy grantor/grantee with person entities
4. Validate proxy document against representation relationship
5. Add bulk validation reporting
6. Integration with document processing pipeline

## Business Value

This feature helps legal clerks:
- Identify invalid or expired proxy documents before finalizing drafts
- Ensure all representation relationships have proper legal authorization
- Reduce manual verification time
- Prevent legal issues from invalid proxies
- Maintain compliance with real estate transaction requirements

## Accessibility

- Clear visual indicators (colored badges)
- Descriptive error and warning messages in Portuguese
- Keyboard-navigable UI components
- Screen reader compatible (ARIA labels)

---

**Implementation Date:** 2025-12-25
**Status:** ✅ Complete and Verified
