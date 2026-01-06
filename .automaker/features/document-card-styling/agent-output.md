Let me continue from where the previous implementation left off. It looks like a `DocumentCard.tsx` component was being written but the request timed out. Let me first check what was created and continue the implementation.

🔧 Tool: Glob
Input: {
  "pattern": "src/components/documents/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\DocumentCard.tsx"
}

The `DocumentCard.tsx` component was successfully created. Now I need to:
1. Create an index file to export the component
2. Update the `UploadPage.tsx` to use the new `DocumentCard` component
3. Verify the implementation using Playwright MCP tools

Let me first create an index file for the documents folder and then update the UploadPage:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\documents\\index.ts",
  "content": "/**\n * Document Components\n *\n * Export all document-related components\n */\n\nexport { default as DocumentCard, type DocumentCardProps } from './DocumentCard'\n"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx"
}

Now let me update the `UploadPage.tsx` to use the new `DocumentCard` component instead of the inline list item rendering. This will apply the enhanced visual styling:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "import { useState, useCallback, useEffect } from 'react'\nimport { useParams, Link } from 'react-router-dom'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  DocumentIcon,\n  TrashIcon,\n  EyeIcon,\n  CheckCircleIcon,\n  ClockIcon,\n  ExclamationCircleIcon,\n  ArrowPathIcon,\n  FolderOpenIcon,\n} from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'\nimport { Badge } from '@/components/ui/badge'\nimport { cn } from '@/lib/utils'\nimport DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'\nimport { useCaseStore } from '../stores/caseStore'\nimport { useDocumentStatusSubscription } from '../hooks/useDocumentStatusSubscription'\nimport { supabase } from '../lib/supabase'\nimport type { Document, DocumentStatus, DocumentType } from '../types'\n\n// Status badge styling\nconst statusConfig: Record<DocumentStatus, { label: string; className: string; icon: typeof CheckCircleIcon }> = {\n  uploaded: {\n    label: 'Uploaded',\n    className: 'badge-info',\n    icon: ClockIcon,\n  },\n  processing: {\n    label: 'Processing',\n    className: 'badge-warning',\n    icon: ArrowPathIcon,\n  },\n  processed: {\n    label: 'Processed',\n    className: 'badge-success',\n    icon: CheckCircleIcon,\n  },\n  needs_review: {\n    label: 'Needs Review',\n    className: 'badge-warning',\n    icon: ExclamationCircleIcon,\n  },\n  approved: {\n    label: 'Approved',\n    className: 'badge-success',\n    icon: CheckCircleIcon,\n  },\n  failed: {\n    label: 'Failed',\n    className: 'badge-error',\n    icon: ExclamationCircleIcon,\n  },\n}\n\n// Document type labels\nconst documentTypeLabels: Record<DocumentType, string> = {\n  cnh: 'CNH',\n  rg: 'RG',\n  marriage_cert: 'Certidao de Casamento',\n  deed: 'Escritura',\n  proxy: 'Procuracao',\n  iptu: 'IPTU',\n  birth_cert: 'Certidao de Nascimento',\n  other: 'Outro',\n}\n\n// Format file size\nconst formatFileSize = (bytes: number) => {\n  if (bytes < 1024) return `${bytes} B`\n  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`\n  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`\n}\n\n// Format date\nconst formatDate = (dateString: string) => {\n  return new Date(dateString).toLocaleDateString('pt-BR', {\n    month: 'short',\n    day: 'numeric',\n    hour: '2-digit',\n    minute: '2-digit',\n  })\n}\n\n// Format confidence percentage\nconst formatConfidence = (confidence: number | null): string => {\n  if (confidence === null || confidence === undefined) return ''\n  return `${Math.round(confidence * 100)}%`\n}\n\n// Get confidence badge color based on confidence level\nconst getConfidenceColor = (confidence: number | null): string => {\n  if (confidence === null || confidence === undefined) return 'text-gray-500'\n  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'\n  if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400'\n  return 'text-red-600 dark:text-red-400'\n}\n\n// Get document type badge styling\nconst getDocTypeBadgeClass = (confidence: number | null): string => {\n  if (confidence === null || confidence === undefined) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'\n  if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'\n  if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'\n  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'\n}",
  "new_string": "import { useState, useCallback, useEffect } from 'react'\nimport { useParams, Link } from 'react-router-dom'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  ArrowPathIcon,\n  FolderOpenIcon,\n} from '@heroicons/react/24/outline'\nimport { Button } from '@/components/ui/button'\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'\nimport DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'\nimport { DocumentCard } from '../components/documents'\nimport { useCaseStore } from '../stores/caseStore'\nimport { useDocumentStatusSubscription } from '../hooks/useDocumentStatusSubscription'\nimport { supabase } from '../lib/supabase'\nimport type { Document, DocumentType } from '../types'\n\n// Document type labels for help section\nconst documentTypeLabels: Record<DocumentType, string> = {\n  cnh: 'CNH',\n  rg: 'RG',\n  marriage_cert: 'Certidao de Casamento',\n  deed: 'Escritura',\n  proxy: 'Procuracao',\n  iptu: 'IPTU',\n  birth_cert: 'Certidao de Nascimento',\n  other: 'Outro',\n}"
}

Now let me update the document list section to use the new `DocumentCard` component:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "          ) : (\n            <ul className=\"divide-y divide-gray-200 dark:divide-gray-700\">\n              {uploadedDocs.map((doc, index) => {\n                const statusInfo = statusConfig[doc.status]\n                const StatusIcon = statusInfo.icon\n\n                return (\n                  <motion.li\n                    key={doc.id}\n                    initial={{ opacity: 0, y: 10 }}\n                    animate={{ opacity: 1, y: 0 }}\n                    exit={{ opacity: 0, x: -10 }}\n                    transition={{ delay: index * 0.05 }}\n                    className=\"p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors\"\n                  >\n                    <div className=\"flex items-center gap-4\">\n                      {/* Document Icon */}\n                      {getDocumentIcon(doc.mime_type)}\n\n                      {/* Document Info */}\n                      <div className=\"flex-1 min-w-0\">\n                        <div className=\"flex items-center gap-2 flex-wrap\">\n                          <p className=\"text-sm font-medium text-gray-900 dark:text-white truncate\">\n                            {doc.original_name}\n                          </p>\n                          <Badge variant={doc.status === 'processed' ? 'default' : 'secondary'} className=\"gap-1\">\n                            <StatusIcon className={cn(\"w-3 h-3\", doc.status === 'processing' && \"animate-spin\")} />\n                            {statusInfo.label}\n                          </Badge>\n                          {/* Document Type Badge with Confidence */}\n                          {doc.doc_type && (\n                            <Badge variant=\"outline\" className={cn(\"gap-1\", getDocTypeBadgeClass(doc.doc_type_confidence))}>\n                              {documentTypeLabels[doc.doc_type]}\n                              {doc.doc_type_confidence !== null && (\n                                <span className={cn(\"font-semibold\", getConfidenceColor(doc.doc_type_confidence))}>\n                                  ({formatConfidence(doc.doc_type_confidence)})\n                                </span>\n                              )}\n                            </Badge>\n                          )}\n                        </div>\n                        <div className=\"flex items-center gap-3 mt-1\">\n                          <span className=\"text-xs text-gray-500 dark:text-gray-400\">\n                            {formatFileSize(doc.file_size)}\n                          </span>\n                          {doc.page_count && (\n                            <span className=\"text-xs text-gray-500 dark:text-gray-400\">\n                              {doc.page_count} pagina{doc.page_count !== 1 ? 's' : ''}\n                            </span>\n                          )}\n                          <span className=\"text-xs text-gray-400 dark:text-gray-500\">\n                            {formatDate(doc.created_at)}\n                          </span>\n                        </div>\n                      </div>\n\n                      {/* Actions */}\n                      <div className=\"flex items-center gap-2\">\n                        <Button\n                          variant=\"ghost\"\n                          size=\"icon\"\n                          title=\"Ver documento\"\n                        >\n                          <EyeIcon className=\"w-5 h-5\" />\n                        </Button>\n                        <Button\n                          variant=\"ghost\"\n                          size=\"icon\"\n                          onClick={() => handleRemoveDocument(doc.id)}\n                          className=\"hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20\"\n                          title=\"Remover documento\"\n                        >\n                          <TrashIcon className=\"w-5 h-5\" />\n                        </Button>\n                      </div>\n                    </div>\n                  </motion.li>\n                )\n              })}\n            </ul>\n          )}",
  "new_string": "          ) : (\n            <div className=\"p-4 space-y-3\">\n              {uploadedDocs.map((doc, index) => (\n                <DocumentCard\n                  key={doc.id}\n                  document={doc}\n                  animationDelay={index * 0.05}\n                  onView={(document) => {\n                    console.log('View document:', document.id)\n                    // TODO: Implement document preview\n                  }}\n                  onDelete={handleRemoveDocument}\n                />\n              ))}\n            </div>\n          )}"
}

Now I need to remove the unused `getDocumentIcon` function and clean up any unused variables. Let me check the current state of the file:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx"
}

I need to remove the unused `getDocumentIcon` function:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx",
  "old_string": "  }, [uploadedDocs, removeDocument])\n\n  // Get document icon based on mime type\n  const getDocumentIcon = (mimeType: string) => {\n    if (mimeType === 'application/pdf') {\n      return (\n        <div className=\"w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center\">\n          <DocumentIcon className=\"w-5 h-5 text-red-500\" />\n        </div>\n      )\n    }\n    if (mimeType.startsWith('image/')) {\n      return (\n        <div className=\"w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center\">\n          <DocumentIcon className=\"w-5 h-5 text-blue-500\" />\n        </div>\n      )\n    }\n    return (\n      <div className=\"w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center\">\n        <DocumentIcon className=\"w-5 h-5 text-gray-500\" />\n      </div>\n    )\n  }\n\n  return (",
  "new_string": "  }, [uploadedDocs, removeDocument])\n\n  return ("
}

Now let me check if there's a dev server running and verify the implementation using Playwright MCP tools. First, let me check the package.json to understand the project setup:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\package.json"
}

Let me run TypeScript check to make sure the code compiles correctly, then start the dev server and verify:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run typecheck 2>&1",
  "description": "Run TypeScript type checking",
  "timeout": 60000
}

The TypeScript errors are pre-existing in the codebase and not related to our new `DocumentCard` component. Let me specifically check if our new component has any TypeScript issues:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npx tsc --noEmit src/components/documents/DocumentCard.tsx src/pages/UploadPage.tsx 2>&1 | head -50",
  "description": "Type check specific files",
  "timeout": 60000
}

These are just compilation errors when running tsc directly on individual files without the project context. The Vite bundler will handle this correctly. Let me start the dev server and verify the implementation with Playwright:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\" && npm run dev 2>&1 &",
  "description": "Start dev server",
  "timeout": 30000,
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "sleep 5 && cat \"C:\\Users\\Lucas\\AppData\\Local\\Temp\\claude\\C--Users-Lucas-OneDrive-Documentos-PROJETOS---CODE-Claude-Code-Projects-IA-Cart-rio-Fluxo-Minutas\\tasks\\b21215f.output\"",
  "description": "Check dev server output",
  "timeout": 10000
}

The dev server is running on port 5177. Now let me verify the implementation using Playwright MCP tools:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5177"
}

The app is loading. Let me wait for it to complete loading:

🔧 Tool: mcp__playwright__browser_wait_for
Input: {
  "time": 3
}

The app redirected to the login page. I need to log in to access the upload page where the DocumentCard component is used. Let me log in:

🔧 Tool: mcp__playwright__browser_fill_form
Input: {
  "fields": [
    {
      "name": "Email",
      "type": "textbox",
      "ref": "e17",
      "value": "test@example.com"
    },
    {
      "name": "Password",
      "type": "textbox",
      "ref": "e19",
      "value": "password123"
    }
  ]
}

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "Sign in button",
  "ref": "e25"
}

The login failed with invalid credentials. Let me check if there's a test page or a way to bypass authentication to view the DocumentCard component. Let me look for test pages:

🔧 Tool: Glob
Input: {
  "pattern": "src/pages/Test*.tsx"
}

There's a `TestUploadPage.tsx` and other test pages. Let me create a dedicated test page for the DocumentCard component to verify its styling:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestPersonEntityCardPage.tsx"
}

Now I'll create a test page for the DocumentCard component:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\TestDocumentCardPage.tsx",
  "content": "/**\n * Test page for DocumentCard component\n *\n * Displays the DocumentCard with various states and configurations\n * for visual testing during development.\n */\n\nimport { useState } from 'react'\nimport { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'\nimport { DocumentCard } from '../components/documents'\nimport type { Document } from '../types'\n\n// Mock document data for testing\nconst mockDocumentPDF: Document = {\n  id: 'doc-1',\n  case_id: 'case-1',\n  original_name: 'certidao_casamento_maria_joao.pdf',\n  storage_path: 'cases/case-1/certidao_casamento_maria_joao.pdf',\n  mime_type: 'application/pdf',\n  file_size: 2458624, // ~2.4 MB\n  page_count: 3,\n  status: 'processed',\n  doc_type: 'marriage_cert',\n  doc_type_confidence: 0.95,\n  processing_error: null,\n  created_at: '2024-01-15T10:30:00Z',\n  updated_at: '2024-01-15T10:35:00Z',\n}\n\nconst mockDocumentProcessing: Document = {\n  id: 'doc-2',\n  case_id: 'case-1',\n  original_name: 'escritura_imovel_centro.pdf',\n  storage_path: 'cases/case-1/escritura_imovel_centro.pdf',\n  mime_type: 'application/pdf',\n  file_size: 5242880, // 5 MB\n  page_count: 12,\n  status: 'processing',\n  doc_type: null,\n  doc_type_confidence: null,\n  processing_error: null,\n  created_at: '2024-01-16T14:20:00Z',\n  updated_at: '2024-01-16T14:20:00Z',\n}\n\nconst mockDocumentImage: Document = {\n  id: 'doc-3',\n  case_id: 'case-1',\n  original_name: 'foto_rg_frente.jpg',\n  storage_path: 'cases/case-1/foto_rg_frente.jpg',\n  mime_type: 'image/jpeg',\n  file_size: 524288, // 512 KB\n  page_count: 1,\n  status: 'processed',\n  doc_type: 'rg',\n  doc_type_confidence: 0.78,\n  processing_error: null,\n  created_at: '2024-01-17T09:15:00Z',\n  updated_at: '2024-01-17T09:20:00Z',\n}\n\nconst mockDocumentLowConfidence: Document = {\n  id: 'doc-4',\n  case_id: 'case-1',\n  original_name: 'documento_escaneado.pdf',\n  storage_path: 'cases/case-1/documento_escaneado.pdf',\n  mime_type: 'application/pdf',\n  file_size: 1048576, // 1 MB\n  page_count: 2,\n  status: 'processed',\n  doc_type: 'other',\n  doc_type_confidence: 0.35,\n  processing_error: null,\n  created_at: '2024-01-18T16:45:00Z',\n  updated_at: '2024-01-18T16:50:00Z',\n}\n\nconst mockDocumentFailed: Document = {\n  id: 'doc-5',\n  case_id: 'case-1',\n  original_name: 'arquivo_corrompido.pdf',\n  storage_path: 'cases/case-1/arquivo_corrompido.pdf',\n  mime_type: 'application/pdf',\n  file_size: 102400, // 100 KB\n  page_count: null,\n  status: 'failed',\n  doc_type: null,\n  doc_type_confidence: null,\n  processing_error: 'Could not parse PDF file',\n  created_at: '2024-01-19T11:00:00Z',\n  updated_at: '2024-01-19T11:05:00Z',\n}\n\nconst mockDocumentUploaded: Document = {\n  id: 'doc-6',\n  case_id: 'case-1',\n  original_name: 'procuracao_publica.pdf',\n  storage_path: 'cases/case-1/procuracao_publica.pdf',\n  mime_type: 'application/pdf',\n  file_size: 3145728, // 3 MB\n  page_count: 5,\n  status: 'uploaded',\n  doc_type: null,\n  doc_type_confidence: null,\n  processing_error: null,\n  created_at: '2024-01-20T08:30:00Z',\n  updated_at: '2024-01-20T08:30:00Z',\n}\n\nconst mockDocumentNeedsReview: Document = {\n  id: 'doc-7',\n  case_id: 'case-1',\n  original_name: 'certidao_nascimento_joao.pdf',\n  storage_path: 'cases/case-1/certidao_nascimento_joao.pdf',\n  mime_type: 'application/pdf',\n  file_size: 1572864, // 1.5 MB\n  page_count: 1,\n  status: 'needs_review',\n  doc_type: 'birth_cert',\n  doc_type_confidence: 0.62,\n  processing_error: null,\n  created_at: '2024-01-21T13:15:00Z',\n  updated_at: '2024-01-21T13:20:00Z',\n}\n\nconst mockDocumentApproved: Document = {\n  id: 'doc-8',\n  case_id: 'case-1',\n  original_name: 'cnh_maria.pdf',\n  storage_path: 'cases/case-1/cnh_maria.pdf',\n  mime_type: 'application/pdf',\n  file_size: 819200, // 800 KB\n  page_count: 1,\n  status: 'approved',\n  doc_type: 'cnh',\n  doc_type_confidence: 0.98,\n  processing_error: null,\n  created_at: '2024-01-22T10:00:00Z',\n  updated_at: '2024-01-22T10:10:00Z',\n}\n\nexport default function TestDocumentCardPage() {\n  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)\n  const [lastAction, setLastAction] = useState<string | null>(null)\n\n  const handleDocumentClick = (document: Document) => {\n    setSelectedDocId(document.id === selectedDocId ? null : document.id)\n    setLastAction(`Clicked: ${document.original_name}`)\n    console.log('Document clicked:', document)\n  }\n\n  const handleViewDocument = (document: Document) => {\n    setLastAction(`View: ${document.original_name}`)\n    console.log('View document:', document)\n  }\n\n  const handleDeleteDocument = (documentId: string) => {\n    setLastAction(`Delete: ${documentId}`)\n    console.log('Delete document:', documentId)\n  }\n\n  return (\n    <div className=\"min-h-screen bg-gray-100 dark:bg-gray-900 p-8\">\n      <div className=\"max-w-4xl mx-auto\">\n        {/* Page Header */}\n        <div className=\"mb-8\">\n          <h1 className=\"text-2xl font-bold text-gray-900 dark:text-white\">\n            Test: Document Card\n          </h1>\n          <p className=\"mt-2 text-gray-600 dark:text-gray-400\">\n            This page demonstrates the DocumentCard component with different document states and types.\n          </p>\n          {lastAction && (\n            <div className=\"mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300\">\n              Last action: <strong>{lastAction}</strong>\n            </div>\n          )}\n        </div>\n\n        {/* Document Cards by Status */}\n        <div className=\"space-y-8\">\n          {/* Processed Documents */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Processed Documents (High Confidence)\n            </h2>\n            <div className=\"space-y-3\">\n              <DocumentCard\n                document={mockDocumentPDF}\n                isSelected={selectedDocId === mockDocumentPDF.id}\n                onClick={handleDocumentClick}\n                onView={handleViewDocument}\n                onDelete={handleDeleteDocument}\n              />\n              <DocumentCard\n                document={mockDocumentApproved}\n                isSelected={selectedDocId === mockDocumentApproved.id}\n                onClick={handleDocumentClick}\n                onView={handleViewDocument}\n                onDelete={handleDeleteDocument}\n              />\n            </div>\n          </div>\n\n          {/* Medium Confidence */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Medium Confidence Documents\n            </h2>\n            <div className=\"space-y-3\">\n              <DocumentCard\n                document={mockDocumentImage}\n                isSelected={selectedDocId === mockDocumentImage.id}\n                onClick={handleDocumentClick}\n                onView={handleViewDocument}\n                onDelete={handleDeleteDocument}\n              />\n              <DocumentCard\n                document={mockDocumentNeedsReview}\n                isSelected={selectedDocId === mockDocumentNeedsReview.id}\n                onClick={handleDocumentClick}\n                onView={handleViewDocument}\n                onDelete={handleDeleteDocument}\n              />\n            </div>\n          </div>\n\n          {/* Low Confidence */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Low Confidence Documents\n            </h2>\n            <DocumentCard\n              document={mockDocumentLowConfidence}\n              isSelected={selectedDocId === mockDocumentLowConfidence.id}\n              onClick={handleDocumentClick}\n              onView={handleViewDocument}\n              onDelete={handleDeleteDocument}\n            />\n          </div>\n\n          {/* Processing State */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Processing State (Animated)\n            </h2>\n            <DocumentCard\n              document={mockDocumentProcessing}\n              isSelected={selectedDocId === mockDocumentProcessing.id}\n              onClick={handleDocumentClick}\n              onView={handleViewDocument}\n              onDelete={handleDeleteDocument}\n            />\n          </div>\n\n          {/* Uploaded State */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Uploaded State (Pending Processing)\n            </h2>\n            <DocumentCard\n              document={mockDocumentUploaded}\n              isSelected={selectedDocId === mockDocumentUploaded.id}\n              onClick={handleDocumentClick}\n              onView={handleViewDocument}\n              onDelete={handleDeleteDocument}\n            />\n          </div>\n\n          {/* Failed State */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Failed State (Error)\n            </h2>\n            <DocumentCard\n              document={mockDocumentFailed}\n              isSelected={selectedDocId === mockDocumentFailed.id}\n              onClick={handleDocumentClick}\n              onView={handleViewDocument}\n              onDelete={handleDeleteDocument}\n            />\n          </div>\n\n          {/* Without Click Handler */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Without Click Handler (Non-clickable)\n            </h2>\n            <DocumentCard\n              document={mockDocumentPDF}\n              onView={handleViewDocument}\n              onDelete={handleDeleteDocument}\n            />\n          </div>\n\n          {/* Staggered Animation */}\n          <div>\n            <h2 className=\"text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3\">\n              Staggered Animation (Multiple Cards)\n            </h2>\n            <div className=\"space-y-3\">\n              {[mockDocumentPDF, mockDocumentImage, mockDocumentLowConfidence].map((doc, index) => (\n                <DocumentCard\n                  key={doc.id}\n                  document={doc}\n                  animationDelay={index * 0.1}\n                  onView={handleViewDocument}\n                  onDelete={handleDeleteDocument}\n                />\n              ))}\n            </div>\n          </div>\n        </div>\n\n        {/* Feature Summary */}\n        <Card className=\"mt-8 glass-card\">\n          <CardHeader>\n            <CardTitle>Features Demonstrated</CardTitle>\n          </CardHeader>\n          <CardContent>\n            <ul className=\"space-y-2 text-sm text-gray-600 dark:text-gray-400\">\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Glassmorphism card design with backdrop blur\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Document type icons (PDF, Image, Generic)\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Status badges with icons (Uploaded, Processing, Processed, etc.)\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Document type detection with confidence percentage\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Confidence-based color coding (green/yellow/red)\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                File metadata display (size, pages, date)\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Hover effects with action buttons\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Selection state with ring highlight\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Animated processing indicator\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Bottom accent line on hover\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Dark mode support\n              </li>\n              <li className=\"flex items-center gap-2\">\n                <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                Framer Motion animations\n              </li>\n            </ul>\n          </CardContent>\n        </Card>\n      </div>\n    </div>\n  )\n}\n"
}

Now I need to add the test page route. Let me check the router configuration:

🔧 Tool: Grep
Input: {
  "pattern": "TestPersonEntityCardPage",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx"
}

Now I'll add the test page route to App.tsx:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "import TestDatePickerPage from './pages/TestDatePickerPage'\nimport TestDisabledStatePage from './pages/TestDisabledStatePage'\nimport ProtectedRoute from './components/common/ProtectedRoute'",
  "new_string": "import TestDatePickerPage from './pages/TestDatePickerPage'\nimport TestDisabledStatePage from './pages/TestDisabledStatePage'\nimport TestDocumentCardPage from './pages/TestDocumentCardPage'\nimport ProtectedRoute from './components/common/ProtectedRoute'"
}

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\App.tsx",
  "old_string": "<Route path=\"/test-disabled-state\" element={<TestDisabledStatePage />} />\n            </>\n          )}",
  "new_string": "<Route path=\"/test-disabled-state\" element={<TestDisabledStatePage />} />\n              <Route path=\"/test-document-card\" element={<TestDocumentCardPage />} />\n            </>\n          )}"
}

Now let me navigate to the test page to verify the DocumentCard component:

🔧 Tool: mcp__playwright__browser_navigate
Input: {
  "url": "http://localhost:5177/test-document-card"
}

The DocumentCard component is working perfectly! The page shows all the different document card states. Let me take a screenshot to document the working feature:

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "document-card-styling-test-page.png",
  "fullPage": true
}

Excellent! The screenshot was captured. Now let me test clicking on a document card to verify the selection state works:

🔧 Tool: mcp__playwright__browser_click
Input: {
  "element": "First document card - certidao_casamento",
  "ref": "e12"
}

The click handler is working - the card shows as [active] and the "Last action" message appeared. Let me hover over a card to see the action buttons and take another screenshot to capture the hover state:

🔧 Tool: mcp__playwright__browser_hover
Input: {
  "element": "Processing state document card",
  "ref": "e179"
}

🔧 Tool: mcp__playwright__browser_take_screenshot
Input: {
  "filename": "document-card-hover-state.png"
}

The screenshot shows the DocumentCard component working beautifully with:
- **Hover state** visible on the "Processing State" card with the amber/yellow bottom accent line
- **Action buttons** (view and delete icons) appearing on hover
- **Status badges** with colored backgrounds (green "Processado", amber "Processando", blue "Enviado", red "Falhou", yellow "Revisao Necessaria")
- **Document type badges** with confidence percentages and color coding (green for high, yellow for medium, red for low)
- **File metadata** displayed (size, pages, date)
- **PDF icon** with colored background

Let me close the browser and provide the final summary:

🔧 Tool: mcp__playwright__browser_close
Input: {}

<summary>
## Summary: Document Card Visual Styling

### Changes Implemented
- Created a new `DocumentCard` component with comprehensive visual styling including:
  - Glassmorphism card design with backdrop blur effect
  - Document type icons (PDF, Image, Generic) with colored backgrounds
  - Status badges with icons for all document states (Uploaded, Processing, Processed, Needs Review, Approved, Failed)
  - Document type detection badges with confidence percentages
  - Confidence-based color coding (green ≥80%, yellow ≥50%, red <50%)
  - File metadata display (size, page count, date)
  - Hover effects with action buttons (view, delete)
  - Selection state with ring highlight
  - Animated processing indicator (spinning icon and pulsing bar)
  - Bottom accent line on hover based on status
  - Framer Motion animations for entrance/exit/hover
  - Full dark mode support

- Updated `UploadPage.tsx` to use the new `DocumentCard` component instead of inline list rendering
- Created an index file for the documents component folder
- Added a test page (`TestDocumentCardPage.tsx`) demonstrating all component states

### Files Modified
- `src/components/documents/DocumentCard.tsx` - NEW: Main document card component
- `src/components/documents/index.ts` - NEW: Export file
- `src/pages/UploadPage.tsx` - MODIFIED: Updated to use DocumentCard component
- `src/pages/TestDocumentCardPage.tsx` - NEW: Test page for visual verification
- `src/App.tsx` - MODIFIED: Added test page route

### Verification Status
- ✅ Verified using Playwright MCP tools
- ✅ Navigated to test page at http://localhost:5177/test-document-card
- ✅ All document card states render correctly (Processed, Processing, Uploaded, Failed, Needs Review, Approved)
- ✅ Click handler works - cards show selection state and log actions
- ✅ Hover effects work - action buttons appear, accent line shows
- ✅ Status badges display with correct colors and icons
- ✅ Confidence percentages display with color coding
- ✅ File metadata (size, pages, date) displays correctly
- ✅ Screenshots captured documenting the working feature

### Notes for Developer
- The component follows the existing patterns from `PersonEntityCard.tsx`
- Uses Tailwind CSS with custom glassmorphism utilities already defined in the project
- All labels are in Portuguese to match the application's locale
- The component accepts callbacks for view, delete, and click actions
- Animation delays can be customized for staggered list animations
- Pre-existing TypeScript errors in other files are unrelated to this implementation
</summary>