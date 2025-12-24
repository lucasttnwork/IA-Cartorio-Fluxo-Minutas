import type { ConflictReason } from '../types'

/**
 * Field type categories for consensus comparison
 * Different field types require different comparison strategies
 */
export type FieldType =
  | 'text'           // General text fields (names, descriptions)
  | 'name'           // Person/organization names (special normalization)
  | 'date'           // Date fields (various formats)
  | 'money'          // Currency values (R$ formatting)
  | 'cpf'            // CPF numbers (Brazilian individual tax ID)
  | 'cnpj'           // CNPJ numbers (Brazilian company tax ID)
  | 'rg'             // RG numbers (Brazilian ID card)
  | 'phone'          // Phone numbers
  | 'email'          // Email addresses
  | 'address'        // Street addresses
  | 'number'         // Generic numeric values
  | 'registry'       // Property/document registry numbers
  | 'percentage'     // Percentage values
  | 'boolean'        // Yes/No, true/false values

/**
 * Configuration for a specific field's consensus comparison
 */
export interface FieldConfig {
  /** Field type for determining comparison strategy */
  type: FieldType
  /** Similarity threshold for auto-confirmation (0-1) */
  similarityThreshold: number
  /** Whether this field can be auto-resolved */
  allowAutoResolve: boolean
  /** Priority for auto-resolution: which source to prefer */
  autoResolvePreference?: 'ocr' | 'llm' | 'higher_confidence'
  /** Whether the field is required for document validity */
  required?: boolean
  /** Custom normalization function name */
  normalizationStrategy?: string
  /** Weight for overall document confidence calculation */
  confidenceWeight?: number
}

/**
 * Default similarity thresholds by field type
 * Higher values = stricter matching required
 */
export const DEFAULT_THRESHOLDS: Record<FieldType, number> = {
  text: 0.85,           // General text: 85% similarity
  name: 0.80,           // Names: Allow more variation (accents, abbreviations)
  date: 0.95,           // Dates: Need high accuracy (critical data)
  money: 0.95,          // Money: Need high accuracy (critical data)
  cpf: 1.0,             // CPF: Must match exactly (after normalization)
  cnpj: 1.0,            // CNPJ: Must match exactly (after normalization)
  rg: 0.95,             // RG: Very high accuracy (may have formatting differences)
  phone: 0.90,          // Phone: Allow some formatting differences
  email: 1.0,           // Email: Must match exactly
  address: 0.75,        // Address: More lenient (abbreviations, formatting)
  number: 0.95,         // Numbers: High accuracy
  registry: 0.95,       // Registry: High accuracy
  percentage: 0.95,     // Percentage: High accuracy
  boolean: 1.0,         // Boolean: Must match exactly
}

/**
 * Auto-resolution rules configuration
 */
export interface AutoResolutionRule {
  /** Conditions that must all be met for auto-resolution */
  conditions: AutoResolutionCondition[]
  /** Action to take when conditions are met */
  action: AutoResolutionAction
  /** Priority (higher = evaluated first) */
  priority: number
}

export interface AutoResolutionCondition {
  type: 'similarity_above' | 'similarity_below' | 'confidence_above' | 'confidence_below' | 'field_type' | 'value_present' | 'values_match'
  field?: 'ocr' | 'llm' | 'both'
  value?: number | string | boolean
}

export interface AutoResolutionAction {
  type: 'confirm' | 'prefer_ocr' | 'prefer_llm' | 'prefer_higher_confidence' | 'mark_pending'
  reason?: ConflictReason
}

/**
 * Default auto-resolution rules applied in order of priority
 */
export const DEFAULT_AUTO_RESOLUTION_RULES: AutoResolutionRule[] = [
  // Rule 1: Exact match after normalization -> auto-confirm
  {
    conditions: [
      { type: 'values_match', value: true }
    ],
    action: { type: 'confirm' },
    priority: 100
  },
  // Rule 2: High similarity (>= threshold) -> auto-confirm with OCR value
  {
    conditions: [
      { type: 'similarity_above', value: 0.95 }
    ],
    action: { type: 'confirm' },
    priority: 90
  },
  // Rule 3: Only one source has value -> use that value if confidence is good
  {
    conditions: [
      { type: 'value_present', field: 'ocr', value: true },
      { type: 'value_present', field: 'llm', value: false },
      { type: 'confidence_above', field: 'ocr', value: 0.7 }
    ],
    action: { type: 'prefer_ocr', reason: 'missing_value' },
    priority: 80
  },
  {
    conditions: [
      { type: 'value_present', field: 'ocr', value: false },
      { type: 'value_present', field: 'llm', value: true },
      { type: 'confidence_above', field: 'llm', value: 0.7 }
    ],
    action: { type: 'prefer_llm', reason: 'missing_value' },
    priority: 80
  },
  // Rule 4: Medium similarity with high LLM confidence -> prefer LLM
  {
    conditions: [
      { type: 'similarity_above', value: 0.70 },
      { type: 'similarity_below', value: 0.95 },
      { type: 'confidence_above', field: 'llm', value: 0.85 }
    ],
    action: { type: 'prefer_llm', reason: 'format_difference' },
    priority: 70
  },
  // Rule 5: Low similarity -> mark as pending for human review
  {
    conditions: [
      { type: 'similarity_below', value: 0.70 }
    ],
    action: { type: 'mark_pending', reason: 'low_similarity' },
    priority: 10
  }
]

/**
 * Field-specific configurations for common Brazilian document fields
 * Maps field paths (dot notation for nested) to their configurations
 */
export const FIELD_CONFIGS: Record<string, FieldConfig> = {
  // Personal identification fields
  'nome': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'nome_completo': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'name': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'full_name': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },

  // Document numbers - must be exact
  'cpf': { type: 'cpf', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', required: true, confidenceWeight: 2.0 },
  'cnpj': { type: 'cnpj', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', required: true, confidenceWeight: 2.0 },
  'rg': { type: 'rg', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', required: true, confidenceWeight: 1.8 },
  'rg_number': { type: 'rg', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', required: true, confidenceWeight: 1.8 },
  'numero_documento': { type: 'registry', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.5 },
  'document_number': { type: 'registry', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.5 },

  // Date fields - critical accuracy
  'data_nascimento': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'birth_date': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'data_emissao': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'issue_date': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'data_validade': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'expiry_date': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'data_casamento': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'marriage_date': { type: 'date', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },

  // Money fields - critical accuracy
  'valor': { type: 'money', similarityThreshold: 0.95, allowAutoResolve: false, required: true, confidenceWeight: 2.0 },
  'value': { type: 'money', similarityThreshold: 0.95, allowAutoResolve: false, required: true, confidenceWeight: 2.0 },
  'valor_venal': { type: 'money', similarityThreshold: 0.95, allowAutoResolve: false, confidenceWeight: 1.8 },
  'property_value': { type: 'money', similarityThreshold: 0.95, allowAutoResolve: false, confidenceWeight: 1.8 },
  'valor_transacao': { type: 'money', similarityThreshold: 0.95, allowAutoResolve: false, required: true, confidenceWeight: 2.0 },
  'transaction_value': { type: 'money', similarityThreshold: 0.95, allowAutoResolve: false, required: true, confidenceWeight: 2.0 },

  // Address fields - more lenient
  'endereco': { type: 'address', similarityThreshold: 0.75, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'address': { type: 'address', similarityThreshold: 0.75, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'logradouro': { type: 'address', similarityThreshold: 0.75, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'street': { type: 'address', similarityThreshold: 0.75, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'cidade': { type: 'text', similarityThreshold: 0.85, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'city': { type: 'text', similarityThreshold: 0.85, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'estado': { type: 'text', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'state': { type: 'text', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'cep': { type: 'number', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },
  'zip_code': { type: 'number', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },

  // Contact fields
  'telefone': { type: 'phone', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 0.8 },
  'phone': { type: 'phone', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 0.8 },
  'email': { type: 'email', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.8 },

  // Registry and legal fields
  'matricula': { type: 'registry', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', required: true, confidenceWeight: 1.8 },
  'registry_number': { type: 'registry', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', required: true, confidenceWeight: 1.8 },
  'livro': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.2 },
  'book': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.2 },
  'folha': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.2 },
  'page': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.2 },
  'termo': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'ocr', confidenceWeight: 1.2 },

  // Marriage specific fields
  'regime_bens': { type: 'text', similarityThreshold: 0.85, allowAutoResolve: false, required: true, confidenceWeight: 1.8 },
  'property_regime': { type: 'text', similarityThreshold: 0.85, allowAutoResolve: false, required: true, confidenceWeight: 1.8 },
  'conjuge1': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'spouse1': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'conjuge2': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'spouse2': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },

  // CNH specific fields
  'categoria': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },
  'category': { type: 'text', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },
  'registro_nacional': { type: 'registry', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'ocr', required: true, confidenceWeight: 1.8 },
  'national_registry': { type: 'registry', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'ocr', required: true, confidenceWeight: 1.8 },

  // Deed/Escritura specific fields
  'outorgante': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'grantor': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'outorgado': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'grantee': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },

  // Proxy/Procuração specific fields
  'procurador': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'attorney': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', required: true, confidenceWeight: 1.5 },
  'poderes': { type: 'text', similarityThreshold: 0.80, allowAutoResolve: false, required: true, confidenceWeight: 1.8 },
  'powers': { type: 'text', similarityThreshold: 0.80, allowAutoResolve: false, required: true, confidenceWeight: 1.8 },

  // IPTU specific fields
  'inscricao_imobiliaria': { type: 'registry', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'ocr', required: true, confidenceWeight: 1.8 },
  'property_registration': { type: 'registry', similarityThreshold: 1.0, allowAutoResolve: true, autoResolvePreference: 'ocr', required: true, confidenceWeight: 1.8 },
  'area_construida': { type: 'number', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },
  'built_area': { type: 'number', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },
  'area_terreno': { type: 'number', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },
  'land_area': { type: 'number', similarityThreshold: 0.95, allowAutoResolve: true, autoResolvePreference: 'higher_confidence', confidenceWeight: 1.2 },

  // Parent/filiation fields
  'pai': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'father': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'mae': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'mother': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'filiacao': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },
  'filiation': { type: 'name', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.2 },

  // Nationality and origin
  'nacionalidade': { type: 'text', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.8 },
  'nationality': { type: 'text', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.8 },
  'naturalidade': { type: 'text', similarityThreshold: 0.85, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.8 },
  'birthplace': { type: 'text', similarityThreshold: 0.85, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.8 },

  // Profession and civil status
  'profissao': { type: 'text', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.6 },
  'profession': { type: 'text', similarityThreshold: 0.80, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 0.6 },
  'estado_civil': { type: 'text', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
  'marital_status': { type: 'text', similarityThreshold: 0.90, allowAutoResolve: true, autoResolvePreference: 'llm', confidenceWeight: 1.0 },
}

/**
 * Global consensus configuration
 */
export interface ConsensusConfig {
  /** Default similarity threshold when field-specific config not found */
  defaultSimilarityThreshold: number
  /** Minimum similarity to consider auto-resolution */
  minAutoResolveThreshold: number
  /** Maximum number of pending fields before blocking document processing */
  maxPendingFields: number
  /** Whether to auto-resolve when only one source has a value */
  autoResolveOnMissingValue: boolean
  /** OCR confidence threshold below which values are suspect */
  minOcrConfidence: number
  /** LLM confidence threshold below which values are suspect */
  minLlmConfidence: number
  /** Whether to use semantic comparison in addition to string similarity */
  useSemanticComparison: boolean
  /** Field-specific configurations */
  fieldConfigs: Record<string, FieldConfig>
  /** Auto-resolution rules */
  autoResolutionRules: AutoResolutionRule[]
}

/**
 * Default consensus configuration
 */
export const DEFAULT_CONSENSUS_CONFIG: ConsensusConfig = {
  defaultSimilarityThreshold: 0.85,
  minAutoResolveThreshold: 0.70,
  maxPendingFields: 10,
  autoResolveOnMissingValue: true,
  minOcrConfidence: 0.60,
  minLlmConfidence: 0.70,
  useSemanticComparison: true,
  fieldConfigs: FIELD_CONFIGS,
  autoResolutionRules: DEFAULT_AUTO_RESOLUTION_RULES,
}

/**
 * Get field configuration with fallback to defaults
 */
export function getFieldConfig(fieldPath: string): FieldConfig {
  // Try exact match first
  const normalizedPath = fieldPath.toLowerCase().replace(/[\s-]/g, '_')

  if (FIELD_CONFIGS[normalizedPath]) {
    return FIELD_CONFIGS[normalizedPath]
  }

  // Try last segment of path (for nested fields)
  const segments = normalizedPath.split('.')
  const lastSegment = segments[segments.length - 1]

  if (FIELD_CONFIGS[lastSegment]) {
    return FIELD_CONFIGS[lastSegment]
  }

  // Try to infer type from field name patterns
  const inferredType = inferFieldType(lastSegment)

  return {
    type: inferredType,
    similarityThreshold: DEFAULT_THRESHOLDS[inferredType],
    allowAutoResolve: true,
    autoResolvePreference: 'higher_confidence',
    confidenceWeight: 1.0
  }
}

/**
 * Infer field type from field name when no explicit config exists
 */
function inferFieldType(fieldName: string): FieldType {
  const name = fieldName.toLowerCase()

  // Date patterns
  if (name.includes('data') || name.includes('date') || name.includes('nascimento') || name.includes('birth') || name.includes('emissao') || name.includes('validade') || name.includes('expiry')) {
    return 'date'
  }

  // Money patterns
  if (name.includes('valor') || name.includes('value') || name.includes('preco') || name.includes('price') || name.includes('total') || name.includes('custo') || name.includes('cost')) {
    return 'money'
  }

  // Document number patterns
  if (name.includes('cpf')) return 'cpf'
  if (name.includes('cnpj')) return 'cnpj'
  if (name.includes('rg') || name.includes('identidade')) return 'rg'

  // Contact patterns
  if (name.includes('telefone') || name.includes('phone') || name.includes('celular') || name.includes('mobile')) return 'phone'
  if (name.includes('email') || name.includes('e-mail') || name.includes('mail')) return 'email'

  // Address patterns
  if (name.includes('endereco') || name.includes('address') || name.includes('logradouro') || name.includes('rua') || name.includes('avenida') || name.includes('street')) return 'address'

  // Name patterns
  if (name.includes('nome') || name.includes('name') || name.includes('conjuge') || name.includes('spouse') || name.includes('pai') || name.includes('mae') || name.includes('father') || name.includes('mother')) return 'name'

  // Registry patterns
  if (name.includes('matricula') || name.includes('registro') || name.includes('registry') || name.includes('inscricao') || name.includes('livro') || name.includes('book')) return 'registry'

  // Numeric patterns
  if (name.includes('numero') || name.includes('number') || name.includes('quantidade') || name.includes('quantity') || name.includes('area')) return 'number'

  // Percentage patterns
  if (name.includes('percentual') || name.includes('percent') || name.includes('taxa') || name.includes('rate')) return 'percentage'

  // Default to text
  return 'text'
}

/**
 * Get the similarity threshold for a specific field
 */
export function getSimilarityThreshold(fieldPath: string): number {
  const config = getFieldConfig(fieldPath)
  return config.similarityThreshold
}

/**
 * Check if a field can be auto-resolved
 */
export function canAutoResolve(fieldPath: string): boolean {
  const config = getFieldConfig(fieldPath)
  return config.allowAutoResolve
}

/**
 * Get the preferred source for auto-resolution
 */
export function getAutoResolvePreference(fieldPath: string): 'ocr' | 'llm' | 'higher_confidence' {
  const config = getFieldConfig(fieldPath)
  return config.autoResolvePreference || 'higher_confidence'
}

/**
 * Evaluate auto-resolution rules to determine action
 */
export function evaluateAutoResolutionRules(
  similarityScore: number,
  ocrValue: unknown,
  llmValue: unknown,
  ocrConfidence: number | undefined,
  llmConfidence: number | undefined,
  fieldType: FieldType,
  valuesMatch: boolean,
  rules: AutoResolutionRule[] = DEFAULT_AUTO_RESOLUTION_RULES
): AutoResolutionAction {
  // Sort rules by priority (descending)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    if (evaluateConditions(rule.conditions, similarityScore, ocrValue, llmValue, ocrConfidence, llmConfidence, fieldType, valuesMatch)) {
      return rule.action
    }
  }

  // Default action: mark as pending
  return { type: 'mark_pending', reason: 'low_similarity' }
}

/**
 * Evaluate all conditions for a rule
 */
function evaluateConditions(
  conditions: AutoResolutionCondition[],
  similarityScore: number,
  ocrValue: unknown,
  llmValue: unknown,
  ocrConfidence: number | undefined,
  llmConfidence: number | undefined,
  fieldType: FieldType,
  valuesMatch: boolean
): boolean {
  return conditions.every(condition => {
    switch (condition.type) {
      case 'similarity_above':
        return similarityScore >= (condition.value as number)

      case 'similarity_below':
        return similarityScore < (condition.value as number)

      case 'confidence_above':
        if (condition.field === 'ocr') {
          return (ocrConfidence ?? 0) >= (condition.value as number)
        } else if (condition.field === 'llm') {
          return (llmConfidence ?? 0) >= (condition.value as number)
        } else {
          return (ocrConfidence ?? 0) >= (condition.value as number) && (llmConfidence ?? 0) >= (condition.value as number)
        }

      case 'confidence_below':
        if (condition.field === 'ocr') {
          return (ocrConfidence ?? 1) < (condition.value as number)
        } else if (condition.field === 'llm') {
          return (llmConfidence ?? 1) < (condition.value as number)
        } else {
          return (ocrConfidence ?? 1) < (condition.value as number) && (llmConfidence ?? 1) < (condition.value as number)
        }

      case 'field_type':
        return fieldType === condition.value

      case 'value_present':
        if (condition.field === 'ocr') {
          const hasValue = ocrValue !== null && ocrValue !== undefined && ocrValue !== ''
          return condition.value ? hasValue : !hasValue
        } else if (condition.field === 'llm') {
          const hasValue = llmValue !== null && llmValue !== undefined && llmValue !== ''
          return condition.value ? hasValue : !hasValue
        } else {
          const ocrHasValue = ocrValue !== null && ocrValue !== undefined && ocrValue !== ''
          const llmHasValue = llmValue !== null && llmValue !== undefined && llmValue !== ''
          return condition.value ? (ocrHasValue && llmHasValue) : (!ocrHasValue && !llmHasValue)
        }

      case 'values_match':
        return valuesMatch === condition.value

      default:
        return false
    }
  })
}

/**
 * Create a custom consensus configuration
 */
export function createConsensusConfig(overrides: Partial<ConsensusConfig> = {}): ConsensusConfig {
  return {
    ...DEFAULT_CONSENSUS_CONFIG,
    ...overrides,
    fieldConfigs: {
      ...DEFAULT_CONSENSUS_CONFIG.fieldConfigs,
      ...(overrides.fieldConfigs || {})
    },
    autoResolutionRules: overrides.autoResolutionRules || DEFAULT_CONSENSUS_CONFIG.autoResolutionRules
  }
}
