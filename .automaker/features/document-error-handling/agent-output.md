# Planning Outline

1. **Goal**: Implement error handling for corrupt/invalid file uploads in the document management system.

2. **Approach**: First, explore the existing file upload implementation to understand how files are processed. Then add validation logic to detect corrupt or invalid files (checking file headers, content validity, etc.) and provide appropriate error messages to users. This will involve both frontend validation and potentially backend error handling.

3. **Files to Touch**:
   - File upload component(s) - Add validation logic and error states
   - API routes for file upload - Add server-side validation
   - UI components - Add error message display

4. **Tasks**:
   1. Explore existing file upload implementation
   2. Add file validation utility functions
   3. Implement frontend validation for corrupt/invalid files
   4. Add backend validation in upload API
   5. Create error UI components/messages
   6. Test with various file types (valid, corrupt, invalid)
   7. Verify with Playwright MCP

5. **Risks**:
   - Different file types need different validation approaches
   - Need to balance thorough validation with performance
   - Must handle large files gracefully

[PLAN_GENERATED] Planning outline complete.

---

Let me start by exploring the codebase to understand the existing file upload structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*upload*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*document*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/api/**/*.{ts,js}"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{tsx,ts}"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/**/*.{tsx,ts}"
}

🔧 Tool: Glob
Input: {
  "pattern": "components/**/*.{tsx,ts}"
}

Let me explore the DocumentDropzone and UploadPage components:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\DocumentDropzone.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\pages\\UploadPage.tsx"
}

Now I have a good understanding of the existing file upload implementation. Let me also check the types file to understand the data structures:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

Now I have a clear understanding. I'll implement corruption/invalid file handling. The current implementation handles type and size rejection, but doesn't validate file content. Let me create a comprehensive solution:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create file validation utility with magic bytes checking",
      "status": "in_progress",
      "activeForm": "Creating file validation utility"
    },
    {
      "content": "Update DocumentDropzone with corruption detection",
      "status": "pending",
      "activeForm": "Updating DocumentDropzone component"
    },
    {
      "content": "Add error UI messages for corrupt/invalid files",
      "status": "pending",
      "activeForm": "Adding error UI messages"
    },
    {
      "content": "Test with Playwright MCP verification",
      "status": "pending",
      "activeForm": "Verifying with Playwright MCP"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\utils\\fileValidation.ts",
  "content": "/**\n * File Validation Utilities\n *\n * Validates uploaded files for corruption and content integrity.\n * Uses magic bytes (file signatures) to verify file types match their content.\n */\n\n// File signature definitions (magic bytes)\nconst FILE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> = {\n  // PDF: %PDF-\n  'application/pdf': [\n    { bytes: [0x25, 0x50, 0x44, 0x46, 0x2D] } // %PDF-\n  ],\n  // JPEG: FFD8FF\n  'image/jpeg': [\n    { bytes: [0xFF, 0xD8, 0xFF] }\n  ],\n  // PNG: 89 50 4E 47 0D 0A 1A 0A\n  'image/png': [\n    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }\n  ],\n  // TIFF: 49 49 2A 00 (little endian) or 4D 4D 00 2A (big endian)\n  'image/tiff': [\n    { bytes: [0x49, 0x49, 0x2A, 0x00] }, // Little endian\n    { bytes: [0x4D, 0x4D, 0x00, 0x2A] }  // Big endian\n  ],\n  // WebP: RIFF....WEBP\n  'image/webp': [\n    { bytes: [0x52, 0x49, 0x46, 0x46] } // RIFF (WEBP signature at offset 8)\n  ],\n}\n\n// WebP has additional signature at offset 8\nconst WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50] // WEBP\n\nexport interface FileValidationResult {\n  isValid: boolean\n  error?: FileValidationError\n}\n\nexport interface FileValidationError {\n  code: 'CORRUPT_FILE' | 'INVALID_SIGNATURE' | 'EMPTY_FILE' | 'TRUNCATED_FILE' | 'READ_ERROR'\n  message: string\n  details?: string\n}\n\n/**\n * Reads the first N bytes of a file as an ArrayBuffer\n */\nasync function readFileHeader(file: File, bytes: number = 32): Promise<Uint8Array | null> {\n  return new Promise((resolve) => {\n    const reader = new FileReader()\n    const blob = file.slice(0, bytes)\n\n    reader.onload = () => {\n      if (reader.result instanceof ArrayBuffer) {\n        resolve(new Uint8Array(reader.result))\n      } else {\n        resolve(null)\n      }\n    }\n\n    reader.onerror = () => {\n      resolve(null)\n    }\n\n    reader.readAsArrayBuffer(blob)\n  })\n}\n\n/**\n * Checks if the file header matches expected magic bytes\n */\nfunction matchesSignature(header: Uint8Array, signature: { bytes: number[]; offset?: number }): boolean {\n  const offset = signature.offset || 0\n  if (header.length < offset + signature.bytes.length) {\n    return false\n  }\n\n  return signature.bytes.every((byte, index) => header[offset + index] === byte)\n}\n\n/**\n * Validates file content integrity by checking magic bytes\n */\nexport async function validateFileContent(file: File): Promise<FileValidationResult> {\n  // Check for empty files\n  if (file.size === 0) {\n    return {\n      isValid: false,\n      error: {\n        code: 'EMPTY_FILE',\n        message: 'O arquivo esta vazio',\n        details: 'O arquivo nao contem nenhum dado. Por favor, selecione um arquivo valido.'\n      }\n    }\n  }\n\n  // Check for suspiciously small files (likely truncated or corrupt)\n  const minimumSizes: Record<string, number> = {\n    'application/pdf': 100,    // A valid PDF needs at least header\n    'image/jpeg': 100,         // JPEG needs headers\n    'image/png': 50,           // PNG needs signature and headers\n    'image/tiff': 50,          // TIFF needs headers\n    'image/webp': 50,          // WebP needs RIFF header\n  }\n\n  const minSize = minimumSizes[file.type] || 10\n  if (file.size < minSize) {\n    return {\n      isValid: false,\n      error: {\n        code: 'TRUNCATED_FILE',\n        message: 'Arquivo parece estar corrompido ou incompleto',\n        details: `O arquivo e muito pequeno (${file.size} bytes) para ser um ${getFileTypeLabel(file.type)} valido.`\n      }\n    }\n  }\n\n  // Read file header for signature validation\n  const header = await readFileHeader(file)\n\n  if (!header) {\n    return {\n      isValid: false,\n      error: {\n        code: 'READ_ERROR',\n        message: 'Erro ao ler o arquivo',\n        details: 'Nao foi possivel ler o conteudo do arquivo. O arquivo pode estar corrompido ou protegido.'\n      }\n    }\n  }\n\n  // Get expected signatures for the declared MIME type\n  const expectedSignatures = FILE_SIGNATURES[file.type]\n\n  if (!expectedSignatures) {\n    // Unknown type, can't validate (but allow it)\n    return { isValid: true }\n  }\n\n  // Check if file matches any expected signature\n  const matchesAnySignature = expectedSignatures.some(sig => matchesSignature(header, sig))\n\n  if (!matchesAnySignature) {\n    return {\n      isValid: false,\n      error: {\n        code: 'INVALID_SIGNATURE',\n        message: 'Tipo de arquivo nao corresponde ao conteudo',\n        details: `O arquivo foi enviado como ${getFileTypeLabel(file.type)}, mas seu conteudo nao corresponde a esse formato. Verifique se o arquivo nao foi renomeado ou corrompido.`\n      }\n    }\n  }\n\n  // Special validation for WebP (needs additional check)\n  if (file.type === 'image/webp') {\n    if (header.length >= 12) {\n      const webpSignatureValid = WEBP_SIGNATURE.every((byte, index) => header[8 + index] === byte)\n      if (!webpSignatureValid) {\n        return {\n          isValid: false,\n          error: {\n            code: 'INVALID_SIGNATURE',\n            message: 'Arquivo WebP invalido',\n            details: 'O arquivo parece ser um container RIFF, mas nao contem dados WebP validos.'\n          }\n        }\n      }\n    }\n  }\n\n  // Additional PDF validation - check for proper structure\n  if (file.type === 'application/pdf') {\n    const pdfValidation = await validatePdfStructure(file)\n    if (!pdfValidation.isValid) {\n      return pdfValidation\n    }\n  }\n\n  // Additional image validation for JPEG\n  if (file.type === 'image/jpeg') {\n    const jpegValidation = await validateJpegStructure(file)\n    if (!jpegValidation.isValid) {\n      return jpegValidation\n    }\n  }\n\n  return { isValid: true }\n}\n\n/**\n * Validates PDF file structure\n */\nasync function validatePdfStructure(file: File): Promise<FileValidationResult> {\n  // Read last 1KB of file to check for %%EOF marker\n  const tailSize = Math.min(1024, file.size)\n  const tailBlob = file.slice(file.size - tailSize)\n\n  return new Promise((resolve) => {\n    const reader = new FileReader()\n\n    reader.onload = () => {\n      const text = reader.result as string\n\n      // Check for %%EOF marker (required for valid PDF)\n      // Some PDFs have %%EOF followed by whitespace or extra data\n      if (!text.includes('%%EOF')) {\n        resolve({\n          isValid: false,\n          error: {\n            code: 'CORRUPT_FILE',\n            message: 'PDF corrompido ou incompleto',\n            details: 'O arquivo PDF nao possui marcador de fim de arquivo (%%EOF). O arquivo pode estar truncado ou corrompido.'\n          }\n        })\n      } else {\n        resolve({ isValid: true })\n      }\n    }\n\n    reader.onerror = () => {\n      resolve({ isValid: true }) // If we can't read, let it pass for now\n    }\n\n    reader.readAsText(tailBlob)\n  })\n}\n\n/**\n * Validates JPEG file structure\n */\nasync function validateJpegStructure(file: File): Promise<FileValidationResult> {\n  // Read last 2 bytes to check for EOI marker (FFD9)\n  const tailBlob = file.slice(file.size - 2)\n\n  return new Promise((resolve) => {\n    const reader = new FileReader()\n\n    reader.onload = () => {\n      if (reader.result instanceof ArrayBuffer) {\n        const tail = new Uint8Array(reader.result)\n        // JPEG should end with FFD9 (End Of Image)\n        if (tail.length >= 2 && tail[0] === 0xFF && tail[1] === 0xD9) {\n          resolve({ isValid: true })\n        } else {\n          resolve({\n            isValid: false,\n            error: {\n              code: 'TRUNCATED_FILE',\n              message: 'Imagem JPEG incompleta',\n              details: 'A imagem JPEG parece estar truncada ou corrompida. O marcador de fim de imagem esta ausente.'\n            }\n          })\n        }\n      } else {\n        resolve({ isValid: true })\n      }\n    }\n\n    reader.onerror = () => {\n      resolve({ isValid: true }) // If we can't read, let it pass for now\n    }\n\n    reader.readAsArrayBuffer(tailBlob)\n  })\n}\n\n/**\n * Gets a human-readable label for file types\n */\nfunction getFileTypeLabel(mimeType: string): string {\n  const labels: Record<string, string> = {\n    'application/pdf': 'PDF',\n    'image/jpeg': 'JPEG',\n    'image/png': 'PNG',\n    'image/tiff': 'TIFF',\n    'image/webp': 'WebP',\n  }\n  return labels[mimeType] || mimeType\n}\n\n/**\n * Validates multiple files and returns validation results for each\n */\nexport async function validateFiles(files: File[]): Promise<Map<string, FileValidationResult>> {\n  const results = new Map<string, FileValidationResult>()\n\n  await Promise.all(\n    files.map(async (file) => {\n      const result = await validateFileContent(file)\n      results.set(file.name, result)\n    })\n  )\n\n  return results\n}\n\n/**\n * Helper to get an error message in Portuguese for display\n */\nexport function getValidationErrorMessage(error: FileValidationError): string {\n  return error.message\n}\n\n/**\n * Helper to get detailed error description\n */\nexport function getValidationErrorDetails(error: FileValidationError): string {\n  return error.details || error.message\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create file validation utility with magic bytes checking",
      "status": "completed",
      "activeForm": "Creating file validation utility"
    },
    {
      "content": "Update DocumentDropzone with corruption detection",
      "status": "in_progress",
      "activeForm": "Updating DocumentDropzone component"
    },
    {
      "content": "Add error UI messages for corrupt/invalid files",
      "status": "pending",
      "activeForm": "Adding error UI messages"
    },
    {
      "content": "Test with Playwright MCP verification",
      "status": "pending",
      "activeForm": "Verifying with Playwright MCP"
    }
  ]
}

Now let's update the DocumentDropzone to use the validation utility:

🔧 Tool: Edit
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\upload\\DocumentDropzone.tsx",
  "old_string": "import { useCallback, useState } from 'react'\nimport { useDropzone, FileRejection } from 'react-dropzone'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  CloudArrowUpIcon,\n  DocumentIcon,\n  XMarkIcon,\n  CheckCircleIcon,\n  ExclamationCircleIcon,\n  ArrowPathIcon,\n} from '@heroicons/react/24/outline'\nimport { Card, CardContent } from '@/components/ui/card'\nimport { Button } from '@/components/ui/button'\nimport { Progress } from '@/components/ui/progress'\nimport { ScrollArea } from '@/components/ui/scroll-area'\nimport { Alert, AlertDescription } from '@/components/ui/alert'\nimport { cn } from '@/lib/utils'\nimport type { UploadProgress, Document } from '../../types'\nimport { supabase, uploadDocument, createProcessingJob } from '../../lib/supabase'",
  "new_string": "import { useCallback, useState } from 'react'\nimport { useDropzone, FileRejection } from 'react-dropzone'\nimport { motion, AnimatePresence } from 'framer-motion'\nimport {\n  CloudArrowUpIcon,\n  DocumentIcon,\n  XMarkIcon,\n  CheckCircleIcon,\n  ExclamationCircleIcon,\n  ArrowPathIcon,\n  ExclamationTriangleIcon,\n} from '@heroicons/react/24/outline'\nimport { Card, CardContent } from '@/components/ui/card'\nimport { Button } from '@/components/ui/button'\nimport { Progress } from '@/components/ui/progress'\nimport { ScrollArea } from '@/components/ui/scroll-area'\nimport { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'\nimport { cn } from '@/lib/utils'\nimport type { UploadProgress, Document } from '../../types'\nimport { supabase, uploadDocument, createProcessingJob } from '../../lib/supabase'\nimport { validateFileContent, FileValidationError } from '../../utils/fileValidation'"
}
