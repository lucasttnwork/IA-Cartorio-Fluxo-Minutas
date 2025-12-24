# Planning Outline

1. **Goal**: Add a confidence level filter to the entities view that allows users to filter entities by their confidence score.

2. **Approach**: First, I'll explore the codebase to understand the existing entities view structure and any existing filter patterns. Then I'll implement a confidence filter component that integrates with the existing filtering system, allowing users to filter entities by confidence levels (e.g., low, medium, high or a range slider).

3. **Files to Touch**:
   - Entities view component (to add the filter UI)
   - Filter-related components/hooks (to add confidence filtering logic)
   - Any relevant type definitions
   - Potentially a new confidence filter component

4. **Tasks**:
   1. Explore the entities view and existing filter patterns
   2. Identify how confidence data is structured in entities
   3. Create/modify confidence filter component
   4. Integrate filter with entities view
   5. Test the implementation with Playwright MCP
   6. Document and verify the feature

5. **Risks**:
   - Confidence field may have different formats across entity types
   - Need to ensure filter state persists correctly with URL params or state management
   - UI consistency with existing filters

[PLAN_GENERATED] Planning outline complete.

---

Let me start by exploring the codebase to understand the existing structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*entit*/**/*.{ts,tsx}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*Entit*.{ts,tsx}"
}

🔧 Tool: Grep
Input: {
  "pattern": "confidence",
  "glob": "*.{ts,tsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\EntitiesPage.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\entities\\EntityTable.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

Now I have a good understanding of the codebase. I can see that:

1. The `EntityTable` component already has filtering by entity type
2. The `ExtractedEntity` interface has a `confidence` field (0-1 range)
3. There's already a confidence badge display with color coding
4. There's a `FilterState` interface that includes a `confidence?: string[]` field

Now let me implement the confidence filter. I'll add a confidence filter to the existing EntityTable component that follows the same pattern as the type filter.

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\entities\\EntityTable.tsx",
  "old_string": "import {\n  ChevronUpIcon,\n  ChevronDownIcon,\n  FunnelIcon,\n  MagnifyingGlassIcon,\n  DocumentTextIcon,\n  UserIcon,\n  BuildingOfficeIcon,\n  MapPinIcon,\n  CalendarIcon,\n  CurrencyDollarIcon,\n  IdentificationIcon,\n  EnvelopeIcon,\n  PhoneIcon,\n  HomeIcon,\n  LinkIcon,\n  DocumentDuplicateIcon,\n  QuestionMarkCircleIcon,\n  CheckCircleIcon,\n} from '@heroicons/react/24/outline'",
  "new_string": "import {\n  ChevronUpIcon,\n  ChevronDownIcon,\n  FunnelIcon,\n  MagnifyingGlassIcon,\n  DocumentTextIcon,\n  UserIcon,\n  BuildingOfficeIcon,\n  MapPinIcon,\n  CalendarIcon,\n  CurrencyDollarIcon,\n  IdentificationIcon,\n  EnvelopeIcon,\n  PhoneIcon,\n  HomeIcon,\n  LinkIcon,\n  DocumentDuplicateIcon,\n  QuestionMarkCircleIcon,\n  CheckCircleIcon,\n  AdjustmentsHorizontalIcon,\n} from '@heroicons/react/24/outline'"
}

Now let me add the confidence level type and configuration:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\entities\\EntityTable.tsx",
  "old_string": "type SortField = 'type' | 'value' | 'confidence'\ntype SortDirection = 'asc' | 'desc'",
  "new_string": "type SortField = 'type' | 'value' | 'confidence'\ntype SortDirection = 'asc' | 'desc'\n\n// Confidence level configuration\ntype ConfidenceLevel = 'high' | 'medium' | 'low'\n\nconst confidenceLevelConfig: Record<ConfidenceLevel, {\n  label: string\n  labelPt: string\n  color: string\n  bgColor: string\n  borderColor: string\n  min: number\n  max: number\n}> = {\n  high: {\n    label: 'High',\n    labelPt: 'Alta',\n    color: 'text-green-600 dark:text-green-400',\n    bgColor: 'bg-green-100 dark:bg-green-900/30',\n    borderColor: 'border-green-200 dark:border-green-800',\n    min: 0.8,\n    max: 1,\n  },\n  medium: {\n    label: 'Medium',\n    labelPt: 'Media',\n    color: 'text-yellow-600 dark:text-yellow-400',\n    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',\n    borderColor: 'border-yellow-200 dark:border-yellow-800',\n    min: 0.6,\n    max: 0.8,\n  },\n  low: {\n    label: 'Low',\n    labelPt: 'Baixa',\n    color: 'text-red-600 dark:text-red-400',\n    bgColor: 'bg-red-100 dark:bg-red-900/30',\n    borderColor: 'border-red-200 dark:border-red-800',\n    min: 0,\n    max: 0.6,\n  },\n}\n\n// Helper function to get confidence level from score\nconst getConfidenceLevel = (confidence: number): ConfidenceLevel => {\n  if (confidence >= 0.8) return 'high'\n  if (confidence >= 0.6) return 'medium'\n  return 'low'\n}"
}

Now let me add the state for confidence filter:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\entities\\EntityTable.tsx",
  "old_string": "const [searchQuery, setSearchQuery] = useState('')\n  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([])\n  const [sortField, setSortField] = useState<SortField>('confidence')\n  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')\n  const [showFilters, setShowFilters] = useState(false)\n  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())\n  const [showBatchConfirmModal, setShowBatchConfirmModal] = useState(false)",
  "new_string": "const [searchQuery, setSearchQuery] = useState('')\n  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([])\n  const [selectedConfidenceLevels, setSelectedConfidenceLevels] = useState<ConfidenceLevel[]>([])\n  const [sortField, setSortField] = useState<SortField>('confidence')\n  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')\n  const [showFilters, setShowFilters] = useState(false)\n  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())\n  const [showBatchConfirmModal, setShowBatchConfirmModal] = useState(false)"
}
