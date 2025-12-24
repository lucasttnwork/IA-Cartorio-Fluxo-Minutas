
🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx,js,jsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/package.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.prisma"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\package.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx}",
  "path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\consensus.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\database.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\lib\\supabase.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "worker/**/*.ts",
  "path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "worker/src/jobs/*.ts",
  "path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\processor.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\ocr.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\jobs\\extraction.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "worker/src/types*.ts",
  "path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\src\\types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\worker\\package.json"
}

Now I have a comprehensive understanding of the codebase. Let me generate the specification.

---

# Specification: Consensus Engine Marks Divergent Fields as Pending

## 1. Problem
When documents are processed, both OCR and LLM extract field values independently. Currently, there's no mechanism to detect disagreements between these two extraction methods, potentially leading to incorrect data being used in legal documents. Users need a way to identify fields where OCR and LLM results diverge, review both values, and manually resolve conflicts.

## 2. Solution
Implement a consensus engine that compares OCR and LLM extraction results field-by-field using string similarity (Levenshtein distance) and semantic value comparison. Fields with low similarity scores are marked as "pending" for human review, while matching fields are auto-confirmed. The system provides API endpoints to trigger consensus checks, view conflicts, and resolve them manually.

## 3. Acceptance Criteria

- **GIVEN** a document with both OCR and LLM extraction results, **WHEN** consensus job is triggered, **THEN** fields are compared and marked as 'confirmed' (match) or 'pending' (divergent) based on similarity thresholds.

- **GIVEN** a field with similarity score below 85%, **WHEN** consensus processing runs, **THEN** both OCR and LLM values are stored with status 'pending' and a conflict reason.

- **GIVEN** a pending field conflict, **WHEN** user calls the resolve endpoint with chosen value, **THEN** field status changes to 'resolved' with audit trail (reviewedBy, reviewedAt).

- **GIVEN** an extraction, **WHEN** calling GET /api/extractions/:id/conflicts, **THEN** all pending fields are returned with OCR value, LLM value, similarity score, and conflict reason.

- **GIVEN** numeric or date fields, **WHEN** comparing values, **THEN** values are normalized before comparison (e.g., "R$ 1.000,00" vs "1000" should match).

## 4. Files to Modify

| File | Purpose | Action |
|------|---------|--------|
| worker/src/types.ts | Add consensus field types with status, similarity, conflict reason | modify |
| worker/src/services/ConsensusEngine.ts | Core consensus comparison logic | create |
| worker/src/services/FieldComparator.ts | Field-specific comparison strategies | create |
| worker/src/services/ConflictResolver.ts | Manual resolution workflow | create |
| worker/src/jobs/consensus.ts | Integrate consensus engine into job processor | modify |
| worker/src/config/consensusConfig.ts | Similarity thresholds and auto-resolution rules | create |
| src/types/index.ts | Add frontend types for consensus fields | modify |
| src/lib/supabase.ts | Add consensus API helper functions | modify |
| src/pages/ConflictReviewPage.tsx | UI for reviewing and resolving conflicts | create |
| src/components/consensus/ConflictCard.tsx | Display individual field conflicts | create |
| src/components/consensus/index.ts | Export consensus components | create |
| src/App.tsx | Add route for conflict review page | modify |

## 5. Implementation Tasks

```tasks
- [ ] T001: Extend worker/src/types.ts with ConflictField interface (status, ocrValue, llmValue, similarityScore, conflictReason, reviewedBy, reviewedAt) | File: worker/src/types.ts
- [ ] T002: Create consensus configuration with field-specific thresholds and auto-resolution rules | File: worker/src/config/consensusConfig.ts
- [ ] T003: Implement FieldComparator service with Levenshtein distance and normalized value comparison | File: worker/src/services/FieldComparator.ts
- [ ] T004: Implement ConsensusEngine service orchestrating field-by-field comparison | File: worker/src/services/ConsensusEngine.ts
- [ ] T005: Implement ConflictResolver service for manual resolution workflow | File: worker/src/services/ConflictResolver.ts
- [ ] T006: Update consensus job to use ConsensusEngine and store results with pending fields | File: worker/src/jobs/consensus.ts
- [ ] T007: Add consensus field types to frontend types | File: src/types/index.ts
- [ ] T008: Add API helper functions for consensus operations in supabase.ts | File: src/lib/supabase.ts
- [ ] T009: Create ConflictCard component for displaying field conflicts | File: src/components/consensus/ConflictCard.tsx
- [ ] T010: Create consensus components index export | File: src/components/consensus/index.ts
- [ ] T011: Create ConflictReviewPage for reviewing and resolving conflicts | File: src/pages/ConflictReviewPage.tsx
- [ ] T012: Add conflict review route to App.tsx | File: src/App.tsx
```

## 6. Verification

1. Upload a test document and trigger OCR + extraction jobs
2. Trigger consensus job via worker or API
3. Navigate to conflict review page at `/case/:caseId/conflicts`
4. Verify pending fields are displayed with both OCR and LLM values
5. Resolve a conflict by selecting preferred value
6. Confirm field status changes to 'resolved' with audit trail
7. Verify high-similarity fields are auto-confirmed

[SPEC_GENERATED] Please review the specification above. Reply with 'approved' to proceed or provide feedback for revisions.Now I can see the existing types. I need to extend the `ConsensusField` interface with the additional fields specified in the task: status, ocrValue, llmValue, similarityScore, conflictReason, reviewedBy, reviewedAt. 

Looking at the existing `ConsensusField`, it already has `ocr_value` and `llm_value`, but I need to add a proper `ConflictField` interface with all the required fields for the consensus engine. Let me add the new interface and related types:The edit was successful. Now let me verify the complete file to ensure everything is in order:The file has been successfully updated. Let me verify the TypeScript syntax is correct by checking if there are any TypeScript configuration files and running a type check:The TypeScript check passed without any errors. 

## Summary of Task T001 Implementation

I have successfully extended `worker/src/types.ts` with the `ConflictField` interface and supporting types. Here's what was implemented:

### New Types Added:

1. **`ConflictFieldStatus`** - Union type for conflict status:
   - `'pending'` - Awaiting human review
   - `'confirmed'` - Auto-confirmed (high similarity)
   - `'resolved'` - Manually resolved by user

2. **`ConflictReason`** - Union type explaining why a conflict occurred:
   - `'low_similarity'` - Similarity score below threshold
   - `'type_mismatch'` - Different data types detected
   - `'format_difference'` - Same value, different format
   - `'partial_match'` - One value contains the other
   - `'ocr_confidence_low'` - OCR confidence below threshold
   - `'llm_confidence_low'` - LLM confidence below threshold
   - `'both_confidence_low'` - Both sources have low confidence
   - `'semantic_difference'` - Semantically different values
   - `'missing_value'` - One source has value, other doesn't

3. **`ConflictField`** interface with all required fields:
   - `fieldName` / `fieldPath` - Field identification
   - `status` - Conflict status (pending/confirmed/resolved)
   - `ocrValue` / `llmValue` - Values from each source
   - `finalValue` - The resolved/confirmed value
   - `similarityScore` - Normalized similarity (0-1)
   - `ocrConfidence` / `llmConfidence` - Confidence metrics
   - `conflictReason` - Reason for the conflict
   - `reviewedBy` / `reviewedAt` - Audit trail fields
   - `resolutionNote` - Optional resolution explanation
   - `createdAt` - Timestamp of conflict detection
   - `autoResolved` - Flag for auto-resolved conflicts

4. **Updated `ConsensusResult`** interface with:
   - `conflicts: ConflictField[]` - Array of all conflicts
   - `total_fields` / `confirmed_fields` / `pending_fields` - Summary countsThe TypeScript check passed without any errors. 

## Summary of Task T001 Implementation

I have successfully extended `worker/src/types.ts` with the `ConflictField` interface and supporting types. Here's what was implemented:

### New Types Added:

1. **`ConflictFieldStatus`** - Union type for conflict status:
   - `'pending'` - Awaiting human review
   - `'confirmed'` - Auto-confirmed (high similarity)
   - `'resolved'` - Manually resolved by user

2. **`ConflictReason`** - Union type explaining why a conflict occurred:
   - `'low_similarity'` - Similarity score below threshold
   - `'type_mismatch'` - Different data types detected
   - `'format_difference'` - Same value, different format
   - `'partial_match'` - One value contains the other
   - `'ocr_confidence_low'` - OCR confidence below threshold
   - `'llm_confidence_low'` - LLM confidence below threshold
   - `'both_confidence_low'` - Both sources have low confidence
   - `'semantic_difference'` - Semantically different values
   - `'missing_value'` - One source has value, other doesn't

3. **`ConflictField`** interface with all required fields:
   - `fieldName` / `fieldPath` - Field identification
   - `status` - Conflict status (pending/confirmed/resolved)
   - `ocrValue` / `llmValue` - Values from each source
   - `finalValue` - The resolved/confirmed value
   - `similarityScore` - Normalized similarity (0-1)
   - `ocrConfidence` / `llmConfidence` - Confidence metrics
   - `conflictReason` - Reason for the conflict
   - `reviewedBy` / `reviewedAt` - Audit trail fields
   - `resolutionNote` - Optional resolution explanation
   - `createdAt` - Timestamp of conflict detection
   - `autoResolved` - Flag for auto-resolved conflicts

4. **Updated `ConsensusResult`** interface with:
   - `conflicts: ConflictField[]` - Array of all conflicts
   - `total_fields` / `confirmed_fields` / `pending_fields` - Summary countsNow let me check the worker directory structure and look for any existing patterns in the codebase:Now I have a good understanding of the codebase. I can see:
1. The `ConflictField` interface has been added in T001 with all the necessary fields
2. There's a pattern for how document types are defined
3. The worker doesn't have a `config` folder yet

Let me create the `consensusConfig.ts` file with field-specific thresholds and auto-resolution rules:Now let me verify the file was created correctly and check that the imports are valid:The TypeScript compilation passed without errors. Let me also verify the file structure:The file was created successfully and passes TypeScript type checking. Let me provide a summary of what was implemented:

---

## Task T002 Complete ✅

### Summary: Created `worker/src/config/consensusConfig.ts`

I implemented a comprehensive consensus configuration module with the following components:

### 1. **Field Type System**
- Defined 14 field types (`FieldType`): `text`, `name`, `date`, `money`, `cpf`, `cnpj`, `rg`, `phone`, `email`, `address`, `number`, `registry`, `percentage`, `boolean`
- Each type has specific comparison strategies suited for Brazilian legal documents

### 2. **Default Similarity Thresholds** (`DEFAULT_THRESHOLDS`)
- Critical fields like CPF, CNPJ, email: **100%** (exact match required after normalization)
- Dates and money: **95%** (high accuracy for legal documents)
- Names: **80%** (allow for accents, abbreviations)
- Addresses: **75%** (most lenient, allowing formatting differences)

### 3. **Field-Specific Configurations** (`FIELD_CONFIGS`)
- 80+ field configurations covering all Brazilian document types mentioned in the codebase:
  - Personal IDs: nome, cpf, rg, cnpj
  - CNH fields: categoria, registro_nacional
  - Marriage certificates: conjuge1/2, regime_bens, data_casamento
  - Deeds: outorgante, outorgado, matricula
  - Procuração: procurador, poderes
  - IPTU: inscricao_imobiliaria, valor_venal
  - Contact: telefone, email, endereco
- Each field has: type, threshold, auto-resolve settings, confidence weight

### 4. **Auto-Resolution Rules** (`DEFAULT_AUTO_RESOLUTION_RULES`)
- 5 priority-ordered rules:
  1. **Exact match** → auto-confirm (priority 100)
  2. **High similarity (≥95%)** → auto-confirm (priority 90)
  3. **Only one source has value** → prefer that source if confidence > 70% (priority 80)
  4. **Medium similarity with high LLM confidence** → prefer LLM (priority 70)
  5. **Low similarity (<70%)** → mark pending for human review (priority 10)

### 5. **Helper Functions**
- `getFieldConfig(fieldPath)` - Get config with fallback inference
- `inferFieldType(fieldName)` - Smart type inference from field names
- `getSimilarityThreshold(fieldPath)` - Get threshold for a field
- `canAutoResolve(fieldPath)` - Check if auto-resolution is allowed
- `getAutoResolvePreference(fieldPath)` - Get preferred source
- `evaluateAutoResolutionRules(...)` - Evaluate rules for an action
- `createConsensusConfig(overrides)` - Create custom configuration

### 6. **Global Configuration** (`ConsensusConfig` / `DEFAULT_CONSENSUS_CONFIG`)
- Default similarity threshold: 85%
- Min auto-resolve threshold: 70%
- Max pending fields: 10
- OCR confidence minimum: 60%
- LLM confidence minimum: 70%
- Semantic comparison: enabled

The configuration is ready to be used by the `FieldComparator` (T003) and `ConsensusEngine` (T004) services.The file was created successfully and passes TypeScript type checking. Let me provide a summary of what was implemented:

---

## Task T002 Complete ✅

### Summary: Created `worker/src/config/consensusConfig.ts`

I implemented a comprehensive consensus configuration module with the following components:

### 1. **Field Type System**
- Defined 14 field types (`FieldType`): `text`, `name`, `date`, `money`, `cpf`, `cnpj`, `rg`, `phone`, `email`, `address`, `number`, `registry`, `percentage`, `boolean`
- Each type has specific comparison strategies suited for Brazilian legal documents

### 2. **Default Similarity Thresholds** (`DEFAULT_THRESHOLDS`)
- Critical fields like CPF, CNPJ, email: **100%** (exact match required after normalization)
- Dates and money: **95%** (high accuracy for legal documents)
- Names: **80%** (allow for accents, abbreviations)
- Addresses: **75%** (most lenient, allowing formatting differences)

### 3. **Field-Specific Configurations** (`FIELD_CONFIGS`)
- 80+ field configurations covering all Brazilian document types mentioned in the codebase:
  - Personal IDs: nome, cpf, rg, cnpj
  - CNH fields: categoria, registro_nacional
  - Marriage certificates: conjuge1/2, regime_bens, data_casamento
  - Deeds: outorgante, outorgado, matricula
  - Procuração: procurador, poderes
  - IPTU: inscricao_imobiliaria, valor_venal
  - Contact: telefone, email, endereco
- Each field has: type, threshold, auto-resolve settings, confidence weight

### 4. **Auto-Resolution Rules** (`DEFAULT_AUTO_RESOLUTION_RULES`)
- 5 priority-ordered rules:
  1. **Exact match** → auto-confirm (priority 100)
  2. **High similarity (≥95%)** → auto-confirm (priority 90)
  3. **Only one source has value** → prefer that source if confidence > 70% (priority 80)
  4. **Medium similarity with high LLM confidence** → prefer LLM (priority 70)
  5. **Low similarity (<70%)** → mark pending for human review (priority 10)

### 5. **Helper Functions**
- `getFieldConfig(fieldPath)` - Get config with fallback inference
- `inferFieldType(fieldName)` - Smart type inference from field names
- `getSimilarityThreshold(fieldPath)` - Get threshold for a field
- `canAutoResolve(fieldPath)` - Check if auto-resolution is allowed
- `getAutoResolvePreference(fieldPath)` - Get preferred source
- `evaluateAutoResolutionRules(...)` - Evaluate rules for an action
- `createConsensusConfig(overrides)` - Create custom configuration

### 6. **Global Configuration** (`ConsensusConfig` / `DEFAULT_CONSENSUS_CONFIG`)
- Default similarity threshold: 85%
- Min auto-resolve threshold: 70%
- Max pending fields: 10
- OCR confidence minimum: 60%
- LLM confidence minimum: 70%
- Semantic comparison: enabled

The configuration is ready to be used by the `FieldComparator` (T003) and `ConsensusEngine` (T004) services.Now I have a clear understanding of the types and configuration. The `services` folder doesn't exist yet, so I need to create it. Let me check if there's any existing pattern for services in the codebase and look at the worker package.json for dependencies:Now I have all the context I need. I'll create the `FieldComparator.ts` service in `worker/src/services/`. This service will:

1. Implement Levenshtein distance calculation
2. Provide normalized value comparison for different field types (money, dates, CPF, CNPJ, etc.)
3. Calculate similarity scores
4. Handle field-type-specific comparison strategiesNow let me verify the implementation by checking that the imports work correctly and the file compiles:The file compiles without errors. Let me also run the full type check to make sure it integrates well with the rest of the codebase:The type check passed with no errors. The FieldComparator service is now complete.

## Summary: Task T003 Completed

I implemented the **FieldComparator service** at `worker/src/services/FieldComparator.ts` with the following features:

### Core Functionality:
1. **Levenshtein Distance Algorithm** - Dynamic programming implementation for calculating edit distance between strings
2. **Normalized Similarity Score** - Converts Levenshtein distance to a 0-1 similarity score

### Field-Type Specific Normalization:
- **CPF/CNPJ**: Removes formatting, keeps only digits, pads with zeros
- **Money**: Handles Brazilian (R$ 1.000,50) and US (1,000.50) formats, normalizes to consistent decimal format
- **Dates**: Parses multiple formats (DD/MM/YYYY, ISO, Portuguese written dates like "25 de dezembro de 2024", English dates)
- **Phone**: Extracts digits, handles country codes (55 for Brazil)
- **Names**: Removes accents, normalizes case and spacing
- **Addresses**: Standardizes common abbreviations (R. → Rua, Av. → Avenida, etc.)
- **Numbers/Percentages**: Handles Brazilian decimal format (comma as decimal separator)
- **RG/Registry**: Removes formatting, uppercases
- **Boolean**: Normalizes various true/false representations (sim/não, yes/no, etc.)
- **Email**: Lowercases and trims

### Specialized Similarity Functions:
- **Numeric**: Relative difference comparison for money/numbers
- **Date**: Date parsing with tolerance for small differences
- **Phone**: Digit-only comparison with area code handling
- **Name**: Token-based matching with initial abbreviation support
- **Address**: Token-based fuzzy matching with lenient thresholds
- **Registry**: Alphanumeric-only comparison

### Integration:
- Uses `FieldConfig` from `consensusConfig.ts` to determine field types and thresholds
- Provides `ComparisonResult` interface with similarity score, match status, normalized values, and conflict reason
- Exports both a class and a singleton instance for convenience
- Includes batch comparison method `compareFields()` for processing multiple fields at onceThe type check passed with no errors. The FieldComparator service is now complete.

## Summary: Task T003 Completed

I implemented the **FieldComparator service** at `worker/src/services/FieldComparator.ts` with the following features:

### Core Functionality:
1. **Levenshtein Distance Algorithm** - Dynamic programming implementation for calculating edit distance between strings
2. **Normalized Similarity Score** - Converts Levenshtein distance to a 0-1 similarity score

### Field-Type Specific Normalization:
- **CPF/CNPJ**: Removes formatting, keeps only digits, pads with zeros
- **Money**: Handles Brazilian (R$ 1.000,50) and US (1,000.50) formats, normalizes to consistent decimal format
- **Dates**: Parses multiple formats (DD/MM/YYYY, ISO, Portuguese written dates like "25 de dezembro de 2024", English dates)
- **Phone**: Extracts digits, handles country codes (55 for Brazil)
- **Names**: Removes accents, normalizes case and spacing
- **Addresses**: Standardizes common abbreviations (R. → Rua, Av. → Avenida, etc.)
- **Numbers/Percentages**: Handles Brazilian decimal format (comma as decimal separator)
- **RG/Registry**: Removes formatting, uppercases
- **Boolean**: Normalizes various true/false representations (sim/não, yes/no, etc.)
- **Email**: Lowercases and trims

### Specialized Similarity Functions:
- **Numeric**: Relative difference comparison for money/numbers
- **Date**: Date parsing with tolerance for small differences
- **Phone**: Digit-only comparison with area code handling
- **Name**: Token-based matching with initial abbreviation support
- **Address**: Token-based fuzzy matching with lenient thresholds
- **Registry**: Alphanumeric-only comparison

### Integration:
- Uses `FieldConfig` from `consensusConfig.ts` to determine field types and thresholds
- Provides `ComparisonResult` interface with similarity score, match status, normalized values, and conflict reason
- Exports both a class and a singleton instance for convenience
- Includes batch comparison method `compareFields()` for processing multiple fields at onceNow let me examine the existing consensus job to understand how the ConsensusEngine should integrate with it:Let me also check the extraction job to understand the structure of OCR and LLM results:Now I have a good understanding of the existing codebase. Let me implement the `ConsensusEngine` service. The service should:

1. Orchestrate field-by-field comparison using `FieldComparator`
2. Apply auto-resolution rules from the consensus config
3. Generate `ConflictField` records for pending/resolved fields
4. Calculate overall confidence
5. Return a complete `ConsensusResult`Now let me verify the implementation by checking the import paths and making sure all types are correctly referenced:Let me fix the type casting issue:The type check passed without errors. Now let me also verify the full worker build compiles correctly:All TypeScript checks pass. Let me read the created file to confirm the implementation is complete:The implementation is complete. Let me provide a summary of what was implemented:

## Summary: Task T004 Completed

I implemented the **ConsensusEngine** service at `worker/src/services/ConsensusEngine.ts`. This service orchestrates field-by-field comparison between OCR and LLM extraction results.

### Key Features Implemented:

1. **Main `process()` method**: Takes `ConsensusInput` with OCR/LLM results and returns a complete `ConsensusResult` with:
   - All processed fields with their consensus values
   - List of pending conflicts requiring human review
   - Statistics (total/confirmed/pending field counts)
   - Overall confidence score

2. **Field Processing Logic** (`processField()`):
   - Uses `FieldComparator` for value comparison (Levenshtein distance, type-specific normalization)
   - Applies auto-resolution rules from consensus config
   - Determines status: `confirmed`, `pending`, or `resolved`
   - Respects `allowAutoResolve` field config to prevent auto-resolution where disallowed

3. **Value Selection Strategies**:
   - `pickBestValue()`: Selects optimal value based on field type preferences
   - `pickByConfidence()`: Selects value from source with higher confidence
   - Prefers OCR for document numbers (CPF, CNPJ, RG, registry)
   - Prefers LLM for interpretive content (names, addresses, descriptions)

4. **Data Extraction Helpers**:
   - `extractDataFromOcr()`: Handles OCR structured data if available
   - `extractDataFromLlm()`: Extracts and flattens LLM extracted data
   - `flattenObject()`: Converts nested objects to dot-notation paths

5. **Confidence Calculation**:
   - `calculateOverallConfidence()`: Weighted average using field-specific confidence weights
   - Pending fields contribute low (0.3) to overall confidence
   - Factors in similarity scores as bonus

6. **Utility Methods**:
   - `hasTooManyPendingFields()`: Checks against max pending threshold
   - `getRequiredPendingFields()`: Returns required fields still pending review
   - `reprocessField()`: For re-evaluating after manual input
   - `mergeResults()`: For incremental consensus updates
   - `updateConfig()` / `getConfig()`: Configuration management

### Exports:
- `ConsensusEngine` class
- `consensusEngine` singleton instance
- `createConsensusEngine()` factory function
- `ConsensusInput` interfaceThe implementation is complete. Let me provide a summary of what was implemented:

## Summary: Task T004 Completed

I implemented the **ConsensusEngine** service at `worker/src/services/ConsensusEngine.ts`. This service orchestrates field-by-field comparison between OCR and LLM extraction results.

### Key Features Implemented:

1. **Main `process()` method**: Takes `ConsensusInput` with OCR/LLM results and returns a complete `ConsensusResult` with:
   - All processed fields with their consensus values
   - List of pending conflicts requiring human review
   - Statistics (total/confirmed/pending field counts)
   - Overall confidence score

2. **Field Processing Logic** (`processField()`):
   - Uses `FieldComparator` for value comparison (Levenshtein distance, type-specific normalization)
   - Applies auto-resolution rules from consensus config
   - Determines status: `confirmed`, `pending`, or `resolved`
   - Respects `allowAutoResolve` field config to prevent auto-resolution where disallowed

3. **Value Selection Strategies**:
   - `pickBestValue()`: Selects optimal value based on field type preferences
   - `pickByConfidence()`: Selects value from source with higher confidence
   - Prefers OCR for document numbers (CPF, CNPJ, RG, registry)
   - Prefers LLM for interpretive content (names, addresses, descriptions)

4. **Data Extraction Helpers**:
   - `extractDataFromOcr()`: Handles OCR structured data if available
   - `extractDataFromLlm()`: Extracts and flattens LLM extracted data
   - `flattenObject()`: Converts nested objects to dot-notation paths

5. **Confidence Calculation**:
   - `calculateOverallConfidence()`: Weighted average using field-specific confidence weights
   - Pending fields contribute low (0.3) to overall confidence
   - Factors in similarity scores as bonus

6. **Utility Methods**:
   - `hasTooManyPendingFields()`: Checks against max pending threshold
   - `getRequiredPendingFields()`: Returns required fields still pending review
   - `reprocessField()`: For re-evaluating after manual input
   - `mergeResults()`: For incremental consensus updates
   - `updateConfig()` / `getConfig()`: Configuration management

### Exports:
- `ConsensusEngine` class
- `consensusEngine` singleton instance
- `createConsensusEngine()` factory function
- `ConsensusInput` interfaceNow let me also read the FieldComparator service to understand the comparison result structure:Now let me also check the supabase.ts file and the jobs/consensus.ts file to understand how data is stored and retrieved:Now I have a complete understanding of the codebase. Let me create the `ConflictResolver` service for manual resolution workflow. This service will handle:

1. Resolving individual field conflicts with chosen values
2. Bulk resolution of multiple conflicts
3. Resolution validation
4. Audit trail trackingNow let me verify the file was created correctly and check if there's an index.ts for services that needs to be updated:The file was created successfully. There's no services index file, which is consistent with the pattern used by other services (ConsensusEngine and FieldComparator are standalone exports). Let me verify the entire file was written correctly by reading it completely:The file has 748 lines. Let me verify the imports are correct and the file compiles by checking TypeScript:There's a minor TypeScript issue with Map iteration. Let me fix this by converting to Array.from:Now let me check for similar issues and fix them if any:Good. Now let me also check for Object.entries which could have similar issues:Let me check the worker's tsconfig to see the target version:The tsconfig has "target": "ES2022" which should support Map iteration. The error we saw was likely from running tsc without the project config. Let me run the full build check:No errors! The TypeScript compilation passed. Let me also verify the file structure by listing all services:All three services are now in place. Let me verify the imports are consistent by reading the unused import warning check:I notice that `ConflictReason` and `ConflictFieldStatus` are imported but might not be used directly as types. Let me check if they're actually used:`ConflictFieldStatus` is used on line 104. Let me check if `ConflictReason` is actually used:`ConflictReason` is imported but not used. Let me remove it to clean up the code:Now let me run the TypeScript check one more time to confirm everything is correct:The TypeScript compilation passed with no errors. 

## Summary

I have successfully implemented **T005: ConflictResolver service for manual resolution workflow** at `worker/src/services/ConflictResolver.ts`.

### What was implemented:

The `ConflictResolver` service provides a complete manual resolution workflow for field conflicts between OCR and LLM extraction results. Here are the key features:

#### Core Types and Interfaces:
- `ResolutionChoice`: Type for resolution options (`'ocr' | 'llm' | 'custom'`)
- `ResolveFieldInput`: Input interface for resolving a single field
- `ResolveFieldResult`: Result of a field resolution
- `BulkResolveInput` & `BulkResolveResult`: For batch resolution of multiple fields
- `ValidationResult`: Validation feedback with errors and warnings
- `ResolutionAuditEntry`: Complete audit trail for each resolution

#### Key Methods:
1. **`resolveField()`** - Resolves a single field conflict with validation
2. **`bulkResolve()`** - Resolves multiple conflicts in a single operation
3. **`applyResolutionsToConsensusResult()`** - Updates a ConsensusResult with resolutions
4. **`validateResolution()`** - Validates a resolution before applying
5. **`suggestResolution()`** - Provides intelligent suggestions based on field type and configuration
6. **`createResolutionFromSuggestion()`** - Creates resolution input from suggestion

#### Audit Trail Features:
- `getFieldAuditLog()` - Get audit entries for a specific field
- `getAuditLog()` - Get full audit log
- `getAuditLogByUser()` - Filter by user ID
- `getAuditLogByDateRange()` - Filter by date range

#### Utility Methods:
- `getPendingConflicts()` - Get all pending conflicts from a result
- `getRequiredPendingFields()` - Get required fields that are still pending
- `areAllRequiredFieldsResolved()` - Check if all required fields are resolved
- `getConflictSummary()` - Get a summary of conflict status

#### Exports:
- `ConflictResolver` class
- `conflictResolver` singleton instance
- `createConflictResolver()` factory function

The service integrates with:
- `../types` for ConflictField, ConsensusResult, and ConsensusField types
- `../config/consensusConfig` for field configuration (getFieldConfig)The TypeScript compilation passed with no errors. 

## Summary

I have successfully implemented **T005: ConflictResolver service for manual resolution workflow** at `worker/src/services/ConflictResolver.ts`.

### What was implemented:

The `ConflictResolver` service provides a complete manual resolution workflow for field conflicts between OCR and LLM extraction results. Here are the key features:

#### Core Types and Interfaces:
- `ResolutionChoice`: Type for resolution options (`'ocr' | 'llm' | 'custom'`)
- `ResolveFieldInput`: Input interface for resolving a single field
- `ResolveFieldResult`: Result of a field resolution
- `BulkResolveInput` & `BulkResolveResult`: For batch resolution of multiple fields
- `ValidationResult`: Validation feedback with errors and warnings
- `ResolutionAuditEntry`: Complete audit trail for each resolution

#### Key Methods:
1. **`resolveField()`** - Resolves a single field conflict with validation
2. **`bulkResolve()`** - Resolves multiple conflicts in a single operation
3. **`applyResolutionsToConsensusResult()`** - Updates a ConsensusResult with resolutions
4. **`validateResolution()`** - Validates a resolution before applying
5. **`suggestResolution()`** - Provides intelligent suggestions based on field type and configuration
6. **`createResolutionFromSuggestion()`** - Creates resolution input from suggestion

#### Audit Trail Features:
- `getFieldAuditLog()` - Get audit entries for a specific field
- `getAuditLog()` - Get full audit log
- `getAuditLogByUser()` - Filter by user ID
- `getAuditLogByDateRange()` - Filter by date range

#### Utility Methods:
- `getPendingConflicts()` - Get all pending conflicts from a result
- `getRequiredPendingFields()` - Get required fields that are still pending
- `areAllRequiredFieldsResolved()` - Check if all required fields are resolved
- `getConflictSummary()` - Get a summary of conflict status

#### Exports:
- `ConflictResolver` class
- `conflictResolver` singleton instance
- `createConflictResolver()` factory function

The service integrates with:
- `../types` for ConflictField, ConsensusResult, and ConsensusField types
- `../config/consensusConfig` for field configuration (getFieldConfig)Now I have a good understanding of the codebase. Let me also check the existing job patterns for how other jobs store their results:Now I have a clear picture of how other jobs work. Let me also check the database schema to understand the `extractions` table structure:Let me check the Extraction type:Now I have all the information I need. Let me implement the updated consensus job that uses ConsensusEngine and stores results with pending fields:Now let me verify the implementation compiles correctly by checking if TypeScript can find any issues:The TypeScript compilation succeeded. Let me also verify that the consensus job file is properly integrated by checking the worker index file:Let me check the processor.ts to see how it routes jobs:The consensus job is already properly imported and registered in the processor. The implementation is complete. Let me run a final verification to make sure everything compiles:The TypeScript compilation passes without errors.

## Summary: Task T006 Completed

I have successfully updated the consensus job (`worker/src/jobs/consensus.ts`) to use the `ConsensusEngine` and store results with pending fields.

### Changes Made:

1. **Replaced the placeholder implementation** with a fully functional consensus job that:
   - Fetches OCR and LLM results from the `extractions` table
   - Uses the `ConsensusEngine` service to compare fields and identify conflicts
   - Stores the complete consensus result (including conflicts) back to the `extractions` table
   - Updates the `pending_fields` column with paths of fields that need human review
   - Updates document status based on consensus results (`processed` or `needs_review`)

2. **Key features of the implementation:**
   - **Validation**: Checks for document_id and extraction record existence
   - **Graceful handling**: Handles cases where OCR or LLM results are missing
   - **Extended storage format**: `StoredConsensusResult` includes metadata like `processed_at`, `document_id`, and `version`
   - **Smart status determination**: Uses `determineDocumentStatus()` to decide if document needs review based on:
     - Critical pending fields (required fields that are unresolved)
     - Too many pending fields (configurable threshold)
     - Low overall confidence
   - **Conflict summary**: `summarizeConflicts()` provides grouped counts by conflict reason

3. **Return value structure**: The job returns a comprehensive result object with:
   - `status`: 'completed'
   - `consensus`: Summary of total, confirmed, and pending fields
   - `pending_field_paths`: Array of field paths that need review
   - `conflicts_summary`: Counts grouped by conflict reason
   - `document_status`: The final document status setThe TypeScript compilation passes without errors.

## Summary: Task T006 Completed

I have successfully updated the consensus job (`worker/src/jobs/consensus.ts`) to use the `ConsensusEngine` and store results with pending fields.

### Changes Made:

1. **Replaced the placeholder implementation** with a fully functional consensus job that:
   - Fetches OCR and LLM results from the `extractions` table
   - Uses the `ConsensusEngine` service to compare fields and identify conflicts
   - Stores the complete consensus result (including conflicts) back to the `extractions` table
   - Updates the `pending_fields` column with paths of fields that need human review
   - Updates document status based on consensus results (`processed` or `needs_review`)

2. **Key features of the implementation:**
   - **Validation**: Checks for document_id and extraction record existence
   - **Graceful handling**: Handles cases where OCR or LLM results are missing
   - **Extended storage format**: `StoredConsensusResult` includes metadata like `processed_at`, `document_id`, and `version`
   - **Smart status determination**: Uses `determineDocumentStatus()` to decide if document needs review based on:
     - Critical pending fields (required fields that are unresolved)
     - Too many pending fields (configurable threshold)
     - Low overall confidence
   - **Conflict summary**: `summarizeConflicts()` provides grouped counts by conflict reason

3. **Return value structure**: The job returns a comprehensive result object with:
   - `status`: 'completed'
   - `consensus`: Summary of total, confirmed, and pending fields
   - `pending_field_paths`: Array of field paths that need review
   - `conflicts_summary`: Counts grouped by conflict reason
   - `document_status`: The final document status setNow I can see both files. The worker types have the extended `ConflictField` interface (from T001), and I need to add the equivalent frontend types to `src/types/index.ts`. I can see that the frontend already has a simpler `ConsensusField` interface, but it needs the full `ConflictField` interface with status, similarity scores, conflict reasons, and audit trail fields.

Let me add the consensus field types to the frontend types file:Now let me verify the file compiles correctly by checking if TypeScript is available and running a type check:The TypeScript compilation succeeded without errors. Let me also verify the full content was added correctly by reading the relevant section:The implementation is complete. Let me provide a summary:

## Task T007 Completed: Add consensus field types to frontend types

### Summary of Changes

I updated `src/types/index.ts` to add the frontend types for the consensus engine's conflict resolution workflow. The changes include:

**1. Extended `ConsensusResult` interface** with additional fields:
- `conflicts: ConflictField[]` - Array of field conflicts
- `total_fields: number` - Total number of compared fields
- `confirmed_fields: number` - Count of auto-confirmed fields
- `pending_fields: number` - Count of fields pending review

**2. Added new types for conflict tracking:**
- `ConflictFieldStatus` - Union type: `'pending' | 'confirmed' | 'resolved'`
- `ConflictReason` - Union type with 9 possible reasons for conflicts (low_similarity, type_mismatch, format_difference, partial_match, ocr_confidence_low, llm_confidence_low, both_confidence_low, semantic_difference, missing_value)

**3. Added `ConflictField` interface** with full conflict details:
- Field identification (`fieldName`, `fieldPath`)
- Conflict status
- Values from each source (`ocrValue`, `llmValue`, `finalValue`)
- Similarity and confidence metrics
- Conflict details and reason
- Resolution audit trail (`reviewedBy`, `reviewedAt`, `resolutionNote`)
- Metadata (`createdAt`, `autoResolved`)

**4. Added API request/response types:**
- `ResolveConflictRequest` - For resolving conflicts via API
- `ResolveConflictResponse` - Response from resolution API
- `ConflictsSummary` - Summary of all conflicts for an extraction

These types mirror the worker backend types from T001 and will be used by the upcoming tasks (T008-T012) to build the conflict resolution UI and API helpers.The implementation is complete. Let me provide a summary:

## Task T007 Completed: Add consensus field types to frontend types

### Summary of Changes

I updated `src/types/index.ts` to add the frontend types for the consensus engine's conflict resolution workflow. The changes include:

**1. Extended `ConsensusResult` interface** with additional fields:
- `conflicts: ConflictField[]` - Array of field conflicts
- `total_fields: number` - Total number of compared fields
- `confirmed_fields: number` - Count of auto-confirmed fields
- `pending_fields: number` - Count of fields pending review

**2. Added new types for conflict tracking:**
- `ConflictFieldStatus` - Union type: `'pending' | 'confirmed' | 'resolved'`
- `ConflictReason` - Union type with 9 possible reasons for conflicts (low_similarity, type_mismatch, format_difference, partial_match, ocr_confidence_low, llm_confidence_low, both_confidence_low, semantic_difference, missing_value)

**3. Added `ConflictField` interface** with full conflict details:
- Field identification (`fieldName`, `fieldPath`)
- Conflict status
- Values from each source (`ocrValue`, `llmValue`, `finalValue`)
- Similarity and confidence metrics
- Conflict details and reason
- Resolution audit trail (`reviewedBy`, `reviewedAt`, `resolutionNote`)
- Metadata (`createdAt`, `autoResolved`)

**4. Added API request/response types:**
- `ResolveConflictRequest` - For resolving conflicts via API
- `ResolveConflictResponse` - Response from resolution API
- `ConflictsSummary` - Summary of all conflicts for an extraction

These types mirror the worker backend types from T001 and will be used by the upcoming tasks (T008-T012) to build the conflict resolution UI and API helpers.Now I understand the existing codebase patterns. I can see:
1. The `supabase.ts` file has helper functions for document operations, storage, and realtime subscriptions
2. The `src/types/index.ts` has all the consensus-related types including `ConflictField`, `ConflictsSummary`, `ResolveConflictRequest`, and `ResolveConflictResponse`

Let me also check if there's an extractions table pattern in the database types:Now I have a complete understanding of the database schema. I can see:
- There's an `extractions` table that contains `consensus`, `pending_fields`, etc.
- The `Extraction` type has `document_id`, `ocr_result`, `llm_result`, `consensus`, `pending_fields`
- The `ConsensusResult` type contains `conflicts: ConflictField[]`

Now I'll add the API helper functions for consensus operations to `supabase.ts`. Based on the types defined and the existing patterns, I need to add functions for:
1. Getting conflicts for a document/extraction
2. Resolving a specific conflict
3. Getting conflicts summary for a case
4. Triggering consensus checkNow let me add the consensus API helper functions at the end of the file before the default export:The implementation is complete. Let me verify the file is correct by reading it once more:The implementation is complete. Let me provide a summary of what was implemented:

---

## Task T008 Complete: Add API helper functions for consensus operations in supabase.ts

I've added comprehensive API helper functions for consensus operations in `src/lib/supabase.ts`. Here's what was implemented:

### New Imports
- Added type imports for `ConflictField`, `ConflictsSummary`, `Extraction`, `ResolveConflictRequest`, and `ResolveConflictResponse`

### New Functions Added (11 total)

1. **`getExtractionByDocumentId(documentId)`** - Retrieves an extraction record by its document ID

2. **`getExtractionConflicts(extractionId)`** - Gets all conflict fields for a specific extraction

3. **`getConflictsSummary(extractionId)`** - Returns a `ConflictsSummary` with counts of total, pending, resolved conflicts and the list of all conflicts

4. **`getCaseConflicts(caseId)`** - Gets conflict summaries for all documents in a case by:
   - First fetching all document IDs for the case
   - Then fetching all extractions for those documents
   - Returning an array of `ConflictsSummary` objects

5. **`getCasePendingConflicts(caseId)`** - Gets only pending conflicts for a case (filters out resolved/confirmed)

6. **`resolveConflict(extractionId, request, userId)`** - Resolves a specific conflict by:
   - Finding the conflict by `fieldPath`
   - Updating its status to 'resolved'
   - Setting `finalValue`, `reviewedBy`, `reviewedAt`, and `resolutionNote`
   - Updating the `pending_fields` array
   - Recalculating consensus stats

7. **`resolveMultipleConflicts(extractionId, resolutions, userId)`** - Bulk resolves multiple conflicts, returning counts of resolved/failed

8. **`triggerConsensusJob(caseId, documentId)`** - Convenience wrapper to create a consensus processing job

9. **`subscribeToConsensusUpdates(caseId, callback)`** - Realtime subscription for consensus updates on extractions

10. **`areAllConflictsResolved(extractionId)`** - Checks if all conflicts are resolved for an extraction

11. **`getDocumentWithConflicts(documentId)`** - Gets document info, extraction, and conflicts in one call

All functions follow the existing codebase patterns:
- Use `(supabase as any)` pattern for type flexibility
- Return `{ data, error }` structures
- Include proper TypeScript typing
- Have error logging with `console.error`The implementation is complete. Let me provide a summary of what was implemented:

---

## Task T008 Complete: Add API helper functions for consensus operations in supabase.ts

I've added comprehensive API helper functions for consensus operations in `src/lib/supabase.ts`. Here's what was implemented:

### New Imports
- Added type imports for `ConflictField`, `ConflictsSummary`, `Extraction`, `ResolveConflictRequest`, and `ResolveConflictResponse`

### New Functions Added (11 total)

1. **`getExtractionByDocumentId(documentId)`** - Retrieves an extraction record by its document ID

2. **`getExtractionConflicts(extractionId)`** - Gets all conflict fields for a specific extraction

3. **`getConflictsSummary(extractionId)`** - Returns a `ConflictsSummary` with counts of total, pending, resolved conflicts and the list of all conflicts

4. **`getCaseConflicts(caseId)`** - Gets conflict summaries for all documents in a case by:
   - First fetching all document IDs for the case
   - Then fetching all extractions for those documents
   - Returning an array of `ConflictsSummary` objects

5. **`getCasePendingConflicts(caseId)`** - Gets only pending conflicts for a case (filters out resolved/confirmed)

6. **`resolveConflict(extractionId, request, userId)`** - Resolves a specific conflict by:
   - Finding the conflict by `fieldPath`
   - Updating its status to 'resolved'
   - Setting `finalValue`, `reviewedBy`, `reviewedAt`, and `resolutionNote`
   - Updating the `pending_fields` array
   - Recalculating consensus stats

7. **`resolveMultipleConflicts(extractionId, resolutions, userId)`** - Bulk resolves multiple conflicts, returning counts of resolved/failed

8. **`triggerConsensusJob(caseId, documentId)`** - Convenience wrapper to create a consensus processing job

9. **`subscribeToConsensusUpdates(caseId, callback)`** - Realtime subscription for consensus updates on extractions

10. **`areAllConflictsResolved(extractionId)`** - Checks if all conflicts are resolved for an extraction

11. **`getDocumentWithConflicts(documentId)`** - Gets document info, extraction, and conflicts in one call

All functions follow the existing codebase patterns:
- Use `(supabase as any)` pattern for type flexibility
- Return `{ data, error }` structures
- Include proper TypeScript typing
- Have error logging with `console.error`Now let me look at some existing component patterns to follow the same styling approach:Now I have a good understanding of:
1. The `ConflictField` type structure from `src/types/index.ts`
2. The existing component patterns (framer-motion, Tailwind CSS, dark mode support)
3. The API helper functions available in `supabase.ts`

Let me create the `ConflictCard` component:Now let me verify that the component follows proper TypeScript patterns by checking for any import issues:The JSX errors are expected when running tsc directly on a TSX file without the full project config. Let me verify the build works properly with the full project configuration:The full project type-check passes. Let me read the component I created to verify it looks correct:The component is complete. Let me provide a summary of what was implemented:

---

## Summary: Task T009 Completed

I created the `ConflictCard` component at `src/components/consensus/ConflictCard.tsx` for displaying field conflicts between OCR and LLM extraction results.

### Key Features Implemented:

1. **Main `ConflictCard` Component**:
   - Displays OCR and LLM values side-by-side in selectable cards
   - Shows similarity score with color-coded indicators (green/yellow/orange/red)
   - Displays conflict reason labels (e.g., "Low similarity score", "Type mismatch")
   - Supports three value sources: OCR, LLM, or custom input
   - Optional resolution notes for audit trail
   - Status badges (Pending Review, Confirmed, Resolved) with appropriate colors
   - Animated transitions using framer-motion
   - For resolved conflicts, shows final value with expandable original values
   - Dark mode support throughout

2. **`ConflictCardCompact` Component**:
   - A compact variant for displaying conflicts in list views
   - Shows field name, truncated OCR value preview, similarity score, and status

3. **Helper Functions**:
   - `formatFieldName()` - Converts dot notation to human-readable format
   - `formatValue()` - Handles null/undefined/object values gracefully
   - `getSimilarityColor()` / `getSimilarityBgColor()` - Color coding for similarity scores

4. **Props & Configuration**:
   - Size variants: `sm`, `md`, `lg`
   - `onResolve` callback for conflict resolution
   - `isLoading` and `disabled` states
   - `showDetails` toggle for detailed conflict info
   - Fully typed with TypeScript interfaces exported

The component follows the existing codebase patterns:
- Uses framer-motion for animations (like `ExpandableCard`, `DocumentStatusBadge`)
- Follows Tailwind CSS styling conventions
- Supports dark mode (`dark:` prefixes)
- Uses Heroicons for icons
- Imports types from the central `types/index.ts`The component is complete. Let me provide a summary of what was implemented:

---

## Summary: Task T009 Completed

I created the `ConflictCard` component at `src/components/consensus/ConflictCard.tsx` for displaying field conflicts between OCR and LLM extraction results.

### Key Features Implemented:

1. **Main `ConflictCard` Component**:
   - Displays OCR and LLM values side-by-side in selectable cards
   - Shows similarity score with color-coded indicators (green/yellow/orange/red)
   - Displays conflict reason labels (e.g., "Low similarity score", "Type mismatch")
   - Supports three value sources: OCR, LLM, or custom input
   - Optional resolution notes for audit trail
   - Status badges (Pending Review, Confirmed, Resolved) with appropriate colors
   - Animated transitions using framer-motion
   - For resolved conflicts, shows final value with expandable original values
   - Dark mode support throughout

2. **`ConflictCardCompact` Component**:
   - A compact variant for displaying conflicts in list views
   - Shows field name, truncated OCR value preview, similarity score, and status

3. **Helper Functions**:
   - `formatFieldName()` - Converts dot notation to human-readable format
   - `formatValue()` - Handles null/undefined/object values gracefully
   - `getSimilarityColor()` / `getSimilarityBgColor()` - Color coding for similarity scores

4. **Props & Configuration**:
   - Size variants: `sm`, `md`, `lg`
   - `onResolve` callback for conflict resolution
   - `isLoading` and `disabled` states
   - `showDetails` toggle for detailed conflict info
   - Fully typed with TypeScript interfaces exported

The component follows the existing codebase patterns:
- Uses framer-motion for animations (like `ExpandableCard`, `DocumentStatusBadge`)
- Follows Tailwind CSS styling conventions
- Supports dark mode (`dark:` prefixes)
- Uses Heroicons for icons
- Imports types from the central `types/index.ts`Let me look at the existing index files to understand the pattern used, and also the ConflictCard component to know what to export:Now I have a clear picture of:
1. The patterns used for index exports in this codebase
2. The `ConflictCard` component exports both a named export (`ConflictCard`) and a default export, plus `ConflictCardCompact` and their props types

Let me create the index.ts file for the consensus components:Let me verify the file was created correctly:## Task T010 Completed ✅

I have successfully created the consensus components index export file at `src/components/consensus/index.ts`.

### What was implemented:

The index file exports all components and types from the `ConflictCard.tsx` module:

**Component Exports:**
- `ConflictCard` - Main component for displaying individual field conflicts with OCR/LLM comparison
- `ConflictCardCompact` - Compact variant for list views
- `ConflictCardDefault` - The default export (aliased for flexibility)

**Type Exports:**
- `ConflictCardProps` - Props interface for the main ConflictCard component
- `ConflictCardCompactProps` - Props interface for the compact variant
- `ValueSource` - Type union for value source ('ocr' | 'llm' | 'custom')

This follows the existing patterns used in other component index files in the codebase (`src/components/case/index.ts`, `src/components/status/index.ts`, `src/components/entities/index.ts`), providing a clean barrel export for the consensus components module.## Task T010 Completed ✅

I have successfully created the consensus components index export file at `src/components/consensus/index.ts`.

### What was implemented:

The index file exports all components and types from the `ConflictCard.tsx` module:

**Component Exports:**
- `ConflictCard` - Main component for displaying individual field conflicts with OCR/LLM comparison
- `ConflictCardCompact` - Compact variant for list views
- `ConflictCardDefault` - The default export (aliased for flexibility)

**Type Exports:**
- `ConflictCardProps` - Props interface for the main ConflictCard component
- `ConflictCardCompactProps` - Props interface for the compact variant
- `ValueSource` - Type union for value source ('ocr' | 'llm' | 'custom')

This follows the existing patterns used in other component index files in the codebase (`src/components/case/index.ts`, `src/components/status/index.ts`, `src/components/entities/index.ts`), providing a clean barrel export for the consensus components module.Let me also read an existing page to understand the patterns used in this codebase:Let me also check an existing more complete page to understand the patterns better:Now I have a good understanding of the codebase patterns. Let me create the ConflictReviewPage.tsx file:Now let me verify the file was created correctly by reading it:The errors are mostly due to TypeScript configuration issues when running tsc directly on a single file without the full project config. These are not real errors in the component since the project uses Vite with proper tsconfig. Let me verify using the actual project build:Let me try using the Vite build to verify the component is valid:The TypeScript check passes with no errors. Let me also quickly verify our new page file exists and has the expected exports:The file is created successfully and passes TypeScript checks. Let me provide a summary of what was implemented.

## Summary: Task T011 Completed

I have successfully created the `ConflictReviewPage.tsx` file for reviewing and resolving conflicts between OCR and LLM extraction results.

### What was implemented:

**`src/pages/ConflictReviewPage.tsx`** - A complete page component with the following features:

1. **Page Header**
   - Title with icon
   - Description text
   - Refresh button
   - "Execute Consensus" button to trigger consensus jobs for all documents

2. **Statistics Cards**
   - Total conflicts count
   - Pending conflicts (amber colored)
   - Resolved conflicts (blue colored)
   - Confirmed fields (green colored)

3. **Filter Section**
   - Filter by status: All, Pending, Resolved, Confirmed
   - Visual badges showing counts for each status

4. **Document Groups**
   - Conflicts are grouped by document
   - Collapsible/expandable sections
   - Auto-expands documents with pending conflicts
   - Shows status badges per document (pending, resolved, confirmed counts)

5. **Conflict Resolution**
   - Uses the `ConflictCard` component from T009
   - Allows selecting OCR value, LLM value, or custom value
   - Supports resolution notes
   - Shows loading state during resolution
   - Disables other conflicts while one is being resolved

6. **Real-time Updates**
   - Subscribes to consensus updates
   - Automatically reloads data when changes occur

7. **Empty States**
   - When no conflicts exist
   - When all pending conflicts are resolved

8. **Help Section**
   - Explains the three conflict states (Pending, Resolved, Confirmed)

9. **Error & Success Handling**
   - Error alerts with dismissible UI
   - Success messages with auto-dismiss

The page follows the existing codebase patterns (similar to `EntitiesPage.tsx`) and integrates with:
- The `ConflictCard` component (T009)
- The supabase API helpers (T008)
- The consensus types (T007)
- The `useAuth` hook for user authenticationThe file is created successfully and passes TypeScript checks. Let me provide a summary of what was implemented.

## Summary: Task T011 Completed

I have successfully created the `ConflictReviewPage.tsx` file for reviewing and resolving conflicts between OCR and LLM extraction results.

### What was implemented:

**`src/pages/ConflictReviewPage.tsx`** - A complete page component with the following features:

1. **Page Header**
   - Title with icon
   - Description text
   - Refresh button
   - "Execute Consensus" button to trigger consensus jobs for all documents

2. **Statistics Cards**
   - Total conflicts count
   - Pending conflicts (amber colored)
   - Resolved conflicts (blue colored)
   - Confirmed fields (green colored)

3. **Filter Section**
   - Filter by status: All, Pending, Resolved, Confirmed
   - Visual badges showing counts for each status

4. **Document Groups**
   - Conflicts are grouped by document
   - Collapsible/expandable sections
   - Auto-expands documents with pending conflicts
   - Shows status badges per document (pending, resolved, confirmed counts)

5. **Conflict Resolution**
   - Uses the `ConflictCard` component from T009
   - Allows selecting OCR value, LLM value, or custom value
   - Supports resolution notes
   - Shows loading state during resolution
   - Disables other conflicts while one is being resolved

6. **Real-time Updates**
   - Subscribes to consensus updates
   - Automatically reloads data when changes occur

7. **Empty States**
   - When no conflicts exist
   - When all pending conflicts are resolved

8. **Help Section**
   - Explains the three conflict states (Pending, Resolved, Confirmed)

9. **Error & Success Handling**
   - Error alerts with dismissible UI
   - Success messages with auto-dismiss

The page follows the existing codebase patterns (similar to `EntitiesPage.tsx`) and integrates with:
- The `ConflictCard` component (T009)
- The supabase API helpers (T008)
- The consensus types (T007)
- The `useAuth` hook for user authenticationNow I have a clear picture of both files. I need to:
1. Import the `ConflictReviewPage` component in `App.tsx`
2. Add a route for `/case/:caseId/conflicts` that renders the `ConflictReviewPage`

Let me implement this:Let me verify the complete updated file:## Summary - Task T012 Complete

I have successfully implemented task T012: **Add conflict review route to App.tsx**.

### Changes Made to `src/App.tsx`:

1. **Added import statement** (line 13):
   ```typescript
   import ConflictReviewPage from './pages/ConflictReviewPage'
   ```

2. **Added route definition** (line 66):
   ```typescript
   <Route path="/case/:caseId/conflicts" element={<ConflictReviewPage />} />
   ```

### Route Details:
- **Path**: `/case/:caseId/conflicts`
- **Component**: `ConflictReviewPage`
- **Protection**: The route is inside the `<ProtectedRoute />` wrapper, so it requires authentication
- **Layout**: The route is inside the `<DashboardLayout />` wrapper, so it will render with the standard dashboard layout (sidebar, header, etc.)
- **Placement**: Added after the `/case/:caseId/history` route, following the existing pattern for case-related routes

This completes the routing setup for the consensus/conflict review feature. Users can now navigate to `/case/{caseId}/conflicts` to access the ConflictReviewPage where they can review and resolve conflicts between OCR and LLM extraction results.## Summary - Task T012 Complete

I have successfully implemented task T012: **Add conflict review route to App.tsx**.

### Changes Made to `src/App.tsx`:

1. **Added import statement** (line 13):
   ```typescript
   import ConflictReviewPage from './pages/ConflictReviewPage'
   ```

2. **Added route definition** (line 66):
   ```typescript
   <Route path="/case/:caseId/conflicts" element={<ConflictReviewPage />} />
   ```

### Route Details:
- **Path**: `/case/:caseId/conflicts`
- **Component**: `ConflictReviewPage`
- **Protection**: The route is inside the `<ProtectedRoute />` wrapper, so it requires authentication
- **Layout**: The route is inside the `<DashboardLayout />` wrapper, so it will render with the standard dashboard layout (sidebar, header, etc.)
- **Placement**: Added after the `/case/:caseId/history` route, following the existing pattern for case-related routes

This completes the routing setup for the consensus/conflict review feature. Users can now navigate to `/case/{caseId}/conflicts` to access the ConflictReviewPage where they can review and resolve conflicts between OCR and LLM extraction results.