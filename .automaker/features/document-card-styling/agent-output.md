# Planning Outline

1. **Goal**: Implement visual styling for document cards in the application.

2. **Approach**: First, I'll explore the codebase to understand the existing component structure and styling patterns. Then I'll identify the document card component(s) and implement appropriate visual styling that follows the existing conventions. Finally, I'll verify the changes using Playwright MCP tools.

3. **Files to Touch**:
   - Document card component file(s) - Add/update styling
   - CSS/style files - Add new styles for document cards
   - Possibly shared style utilities if they exist

4. **Tasks**:
   1. Explore codebase structure and find document card components
   2. Understand existing styling patterns and conventions
   3. Implement document card visual styling
   4. Ensure styles are consistent with existing design patterns
   5. Verify implementation using Playwright MCP tools
   6. Take screenshots to document the working feature

5. **Risks**:
   - Need to understand existing styling approach (CSS modules, styled-components, Tailwind, etc.)
   - Must maintain consistency with existing design system
   - Document cards may be used in multiple places requiring careful styling

[PLAN_GENERATED] Planning outline complete.

---

Let me start by exploring the codebase structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/document*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/card*"
}

Let me explore the source folder structure more specifically:

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\ui\\card.tsx"
}

Now let me look for document-related components and understand how documents are displayed:

🔧 Tool: Grep
Input: {
  "pattern": "DocumentCard|document.*card",
  "-i": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\styles\\index.css"
}

Now I have a good understanding of the codebase. The project uses:
- Tailwind CSS with custom component classes
- shadcn/ui components (Card, Badge, Button, etc.)
- Custom glassmorphism utilities
- Framer Motion for animations

Looking at the UploadPage, I can see there are document items displayed as list items (`<motion.li>`) but no dedicated `DocumentCard` component. Let me create a proper styled `DocumentCard` component with enhanced visual styling.

🔧 Tool: Glob
Input: {
  "pattern": "src/components/**/*.tsx"
}

Let me check an existing card component for reference:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\entities\\PersonEntityCard.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

Now I have a complete understanding of the codebase. I'll create a dedicated `DocumentCard` component with enhanced visual styling, following the patterns established in `PersonEntityCard.tsx`. Let me create the component:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx",
  "content": "/**\n * DocumentCard Component\n *\n * A visually styled card component for displaying document information.\n * Features glassmorphism effects, status indicators, and interactive hover states.\n *\n * Features:\n * - Document type icon with colored background\n * - Status badge with icon\n * - Document type detection with confidence indicator\n * - File metadata (size, pages, date)\n * - Action buttons (view, delete)\n * - Smooth hover and focus animations\n * - Dark mode support\n */\n\nimport { motion } from 'framer-motion'\nimport {\n  DocumentIcon,\n  DocumentTextIcon,\n  PhotoIcon,\n  TrashIcon,\n  EyeIcon,\n  CheckCircleIcon,\n  ClockIcon,\n  ExclamationCircleIcon,\n  ArrowPathIcon,\n} from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { Badge } from '@/components/ui/badge'\nimport { cn } from '@/lib/utils'\nimport type { Document, DocumentStatus, DocumentType } from '../../types'\n\nexport interface DocumentCardProps {\n  /** The document data */\n  document: Document\n  /** Callback when the view button is clicked */\n  onView?: (document: Document) => void\n  /** Callback when the delete button is clicked */\n  onDelete?: (documentId: string) => void\n  /** Whether the card is selected */\n  isSelected?: boolean\n  /** Callback when the card is clicked */\n  onClick?: (document: Document) => void\n  /** Animation delay for staggered lists */\n  animationDelay?: number\n  /** Additional class names */\n  className?: string\n}\n\n// Status configuration with styling\nconst statusConfig: Record<DocumentStatus, {\n  label: string\n  className: string\n  bgClass: string\n  icon: typeof CheckCircleIcon\n}> = {\n  uploaded: {\n    label: 'Enviado',\n    className: 'text-blue-700 dark:text-blue-300',\n    bgClass: 'bg-blue-100 dark:bg-blue-900/30',\n    icon: ClockIcon,\n  },\n  processing: {\n    label: 'Processando',\n    className: 'text-amber-700 dark:text-amber-300',\n    bgClass: 'bg-amber-100 dark:bg-amber-900/30',\n    icon: ArrowPathIcon,\n  },\n  processed: {\n    label: 'Processado',\n    className: 'text-green-700 dark:text-green-300',\n    bgClass: 'bg-green-100 dark:bg-green-900/30',\n    icon: CheckCircleIcon,\n  },\n  needs_review: {\n    label: 'Revisao Necessaria',\n    className: 'text-amber-700 dark:text-amber-300',\n    bgClass: 'bg-amber-100 dark:bg-amber-900/30',\n    icon: ExclamationCircleIcon,\n  },\n  approved: {\n    label: 'Aprovado',\n    className: 'text-green-700 dark:text-green-300',\n    bgClass: 'bg-green-100 dark:bg-green-900/30',\n    icon: CheckCircleIcon,\n  },\n  failed: {\n    label: 'Falhou',\n    className: 'text-red-700 dark:text-red-300',\n    bgClass: 'bg-red-100 dark:bg-red-900/30',\n    icon: ExclamationCircleIcon,\n  },\n}\n\n// Document type labels in Portuguese\nconst documentTypeLabels: Record<DocumentType, string> = {\n  cnh: 'CNH',\n  rg: 'RG',\n  marriage_cert: 'Certidao de Casamento',\n  deed: 'Escritura',\n  proxy: 'Procuracao',\n  iptu: 'IPTU',\n  birth_cert: 'Certidao de Nascimento',\n  other: 'Outro',\n}\n\n// Format file size to human readable\nconst formatFileSize = (bytes: number): string => {\n  if (bytes < 1024) return `${bytes} B`\n  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`\n  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`\n}\n\n// Format date to Brazilian format\nconst formatDate = (dateString: string): string => {\n  return new Date(dateString).toLocaleDateString('pt-BR', {\n    month: 'short',\n    day: 'numeric',\n    hour: '2-digit',\n    minute: '2-digit',\n  })\n}\n\n// Format confidence percentage\nconst formatConfidence = (confidence: number | null): string => {\n  if (confidence === null || confidence === undefined) return ''\n  return `${Math.round(confidence * 100)}%`\n}\n\n// Get confidence color class\nconst getConfidenceColor = (confidence: number | null): string => {\n  if (confidence === null || confidence === undefined) return 'text-gray-500'\n  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'\n  if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400'\n  return 'text-red-600 dark:text-red-400'\n}\n\n// Get document type badge styling based on confidence\nconst getDocTypeBadgeClass = (confidence: number | null): string => {\n  if (confidence === null || confidence === undefined) {\n    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'\n  }\n  if (confidence >= 0.8) {\n    return 'bg-gradient-to-br from-green-100 to-green-50 text-green-800 dark:from-green-900/40 dark:to-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800/50'\n  }\n  if (confidence >= 0.5) {\n    return 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-800 dark:from-yellow-900/40 dark:to-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50'\n  }\n  return 'bg-gradient-to-br from-red-100 to-red-50 text-red-800 dark:from-red-900/40 dark:to-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800/50'\n}\n\n// Get document icon component based on mime type\nconst getDocumentIconComponent = (mimeType: string): { icon: typeof DocumentIcon; bgClass: string; iconClass: string } => {\n  if (mimeType === 'application/pdf') {\n    return {\n      icon: DocumentTextIcon,\n      bgClass: 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20',\n      iconClass: 'text-red-600 dark:text-red-400',\n    }\n  }\n  if (mimeType.startsWith('image/')) {\n    return {\n      icon: PhotoIcon,\n      bgClass: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20',\n      iconClass: 'text-blue-600 dark:text-blue-400',\n    }\n  }\n  return {\n    icon: DocumentIcon,\n    bgClass: 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800',\n    iconClass: 'text-gray-600 dark:text-gray-400',\n  }\n}\n\nexport default function DocumentCard({\n  document,\n  onView,\n  onDelete,\n  isSelected = false,\n  onClick,\n  animationDelay = 0,\n  className = '',\n}: DocumentCardProps) {\n  const statusInfo = statusConfig[document.status]\n  const StatusIcon = statusInfo.icon\n  const { icon: DocIcon, bgClass: docIconBg, iconClass: docIconClass } = getDocumentIconComponent(document.mime_type)\n\n  return (\n    <motion.div\n      initial={{ opacity: 0, y: 10, scale: 0.98 }}\n      animate={{ opacity: 1, y: 0, scale: 1 }}\n      exit={{ opacity: 0, x: -20, scale: 0.95 }}\n      transition={{\n        delay: animationDelay,\n        duration: 0.3,\n        ease: [0.4, 0, 0.2, 1]\n      }}\n      whileHover={{ scale: 1.01, y: -2 }}\n      className={cn(\n        // Base card styling with glassmorphism\n        'group relative overflow-hidden rounded-xl',\n        'bg-white/80 dark:bg-gray-800/80',\n        'backdrop-blur-md',\n        'border border-gray-200/50 dark:border-gray-700/50',\n        'shadow-sm hover:shadow-lg',\n        'transition-all duration-300 ease-out',\n        // Selection state\n        isSelected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',\n        // Cursor state\n        onClick && 'cursor-pointer',\n        className\n      )}\n      onClick={() => onClick?.(document)}\n      role={onClick ? 'button' : undefined}\n      tabIndex={onClick ? 0 : undefined}\n      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(document) : undefined}\n    >\n      {/* Decorative gradient overlay on hover */}\n      <div className=\"absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none\" />\n\n      {/* Processing indicator bar */}\n      {document.status === 'processing' && (\n        <div className=\"absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse\" />\n      )}\n\n      <div className=\"relative p-4\">\n        <div className=\"flex items-start gap-4\">\n          {/* Document Icon with styled container */}\n          <div className={cn(\n            'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',\n            'shadow-sm border border-white/20 dark:border-gray-600/30',\n            'transition-transform duration-300 group-hover:scale-105',\n            docIconBg\n          )}>\n            <DocIcon className={cn('w-7 h-7', docIconClass)} />\n          </div>\n\n          {/* Document Info */}\n          <div className=\"flex-1 min-w-0 space-y-2\">\n            {/* Title row with badges */}\n            <div className=\"flex items-start justify-between gap-2\">\n              <div className=\"flex-1 min-w-0\">\n                <h3 className=\"text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors\">\n                  {document.original_name}\n                </h3>\n              </div>\n            </div>\n\n            {/* Badges row */}\n            <div className=\"flex items-center gap-2 flex-wrap\">\n              {/* Status Badge */}\n              <Badge\n                variant=\"outline\"\n                className={cn(\n                  'gap-1.5 px-2.5 py-0.5 font-medium border',\n                  statusInfo.bgClass,\n                  statusInfo.className\n                )}\n              >\n                <StatusIcon className={cn(\n                  'w-3.5 h-3.5',\n                  document.status === 'processing' && 'animate-spin'\n                )} />\n                {statusInfo.label}\n              </Badge>\n\n              {/* Document Type Badge with Confidence */}\n              {document.doc_type && (\n                <Badge\n                  variant=\"outline\"\n                  className={cn(\n                    'gap-1.5 px-2.5 py-0.5 font-medium border shadow-sm',\n                    getDocTypeBadgeClass(document.doc_type_confidence)\n                  )}\n                >\n                  {documentTypeLabels[document.doc_type]}\n                  {document.doc_type_confidence !== null && (\n                    <span className={cn(\n                      'font-bold',\n                      getConfidenceColor(document.doc_type_confidence)\n                    )}>\n                      ({formatConfidence(document.doc_type_confidence)})\n                    </span>\n                  )}\n                </Badge>\n              )}\n            </div>\n\n            {/* Metadata row */}\n            <div className=\"flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400\">\n              <span className=\"inline-flex items-center gap-1\">\n                <svg className=\"w-3.5 h-3.5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4\" />\n                </svg>\n                {formatFileSize(document.file_size)}\n              </span>\n              {document.page_count && (\n                <>\n                  <span className=\"text-gray-300 dark:text-gray-600\">|</span>\n                  <span className=\"inline-flex items-center gap-1\">\n                    <svg className=\"w-3.5 h-3.5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\" />\n                    </svg>\n                    {document.page_count} pagina{document.page_count !== 1 ? 's' : ''}\n                  </span>\n                </>\n              )}\n              <span className=\"text-gray-300 dark:text-gray-600\">|</span>\n              <span className=\"inline-flex items-center gap-1\">\n                <svg className=\"w-3.5 h-3.5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />\n                </svg>\n                {formatDate(document.created_at)}\n              </span>\n            </div>\n          </div>\n\n          {/* Action Buttons */}\n          <div className=\"flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200\">\n            {onView && (\n              <Button\n                variant=\"ghost\"\n                size=\"icon\"\n                onClick={(e) => {\n                  e.stopPropagation()\n                  onView(document)\n                }}\n                className=\"h-9 w-9 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400\"\n                title=\"Ver documento\"\n              >\n                <EyeIcon className=\"w-5 h-5\" />\n              </Button>\n            )}\n            {onDelete && (\n              <Button\n                variant=\"ghost\"\n                size=\"icon\"\n                onClick={(e) => {\n                  e.stopPropagation()\n                  onDelete(document.id)\n                }}\n                className=\"h-9 w-9 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400\"\n                title=\"Remover documento\"\n              >\n                <TrashIcon className=\"w-5 h-5\" />\n              </Button>\n            )}\n          </div>\n        </div>\n      </div>\n\n      {/* Bottom accent line based on status */}\n      <div className={cn(\n        'absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300',\n        'opacity-0 group-hover:opacity-100',\n        document.status === 'processed' && 'bg-gradient-to-r from-green-400 to-green-500',\n        document.status === 'processing' && 'bg-gradient-to-r from-amber-400 to-amber-500',\n        document.status === 'uploaded' && 'bg-gradient-to-r from-blue-400 to-blue-500',\n        document.status === 'failed' && 'bg-gradient-to-r from-red-400 to-red-500',\n        document.status === 'needs_review' && 'bg-gradient-to-r from-amber-400 to-amber-500',\n        document.status === 'approved' && 'bg-gradient-to-r from-green-400 to-green-500'\n      )} />\n    </motion.div>\n  )\n}\n"
}
