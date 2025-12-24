/**
 * File Validation Utilities
 *
 * Validates uploaded files for corruption and content integrity.
 * Uses magic bytes (file signatures) to verify file types match their content.
 */

// File signature definitions (magic bytes)
const FILE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> = {
  // PDF: %PDF-
  'application/pdf': [
    { bytes: [0x25, 0x50, 0x44, 0x46, 0x2D] } // %PDF-
  ],
  // JPEG: FFD8FF
  'image/jpeg': [
    { bytes: [0xFF, 0xD8, 0xFF] }
  ],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  'image/png': [
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
  ],
  // TIFF: 49 49 2A 00 (little endian) or 4D 4D 00 2A (big endian)
  'image/tiff': [
    { bytes: [0x49, 0x49, 0x2A, 0x00] }, // Little endian
    { bytes: [0x4D, 0x4D, 0x00, 0x2A] }  // Big endian
  ],
  // WebP: RIFF....WEBP
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46] } // RIFF (WEBP signature at offset 8)
  ],
}

// WebP has additional signature at offset 8
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50] // WEBP

export interface FileValidationResult {
  isValid: boolean
  error?: FileValidationError
}

export interface FileValidationError {
  code: 'CORRUPT_FILE' | 'INVALID_SIGNATURE' | 'EMPTY_FILE' | 'TRUNCATED_FILE' | 'READ_ERROR'
  message: string
  details?: string
}

/**
 * Reads the first N bytes of a file as an ArrayBuffer
 */
async function readFileHeader(file: File, bytes: number = 32): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    const blob = file.slice(0, bytes)

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result))
      } else {
        resolve(null)
      }
    }

    reader.onerror = () => {
      resolve(null)
    }

    reader.readAsArrayBuffer(blob)
  })
}

/**
 * Checks if the file header matches expected magic bytes
 */
function matchesSignature(header: Uint8Array, signature: { bytes: number[]; offset?: number }): boolean {
  const offset = signature.offset || 0
  if (header.length < offset + signature.bytes.length) {
    return false
  }

  return signature.bytes.every((byte, index) => header[offset + index] === byte)
}

/**
 * Validates file content integrity by checking magic bytes
 */
export async function validateFileContent(file: File): Promise<FileValidationResult> {
  // Check for empty files
  if (file.size === 0) {
    return {
      isValid: false,
      error: {
        code: 'EMPTY_FILE',
        message: 'O arquivo esta vazio',
        details: 'O arquivo nao contem nenhum dado. Por favor, selecione um arquivo valido.'
      }
    }
  }

  // Check for suspiciously small files (likely truncated or corrupt)
  const minimumSizes: Record<string, number> = {
    'application/pdf': 100,    // A valid PDF needs at least header
    'image/jpeg': 100,         // JPEG needs headers
    'image/png': 50,           // PNG needs signature and headers
    'image/tiff': 50,          // TIFF needs headers
    'image/webp': 50,          // WebP needs RIFF header
  }

  const minSize = minimumSizes[file.type] || 10
  if (file.size < minSize) {
    return {
      isValid: false,
      error: {
        code: 'TRUNCATED_FILE',
        message: 'Arquivo parece estar corrompido ou incompleto',
        details: `O arquivo e muito pequeno (${file.size} bytes) para ser um ${getFileTypeLabel(file.type)} valido.`
      }
    }
  }

  // Read file header for signature validation
  const header = await readFileHeader(file)

  if (!header) {
    return {
      isValid: false,
      error: {
        code: 'READ_ERROR',
        message: 'Erro ao ler o arquivo',
        details: 'Nao foi possivel ler o conteudo do arquivo. O arquivo pode estar corrompido ou protegido.'
      }
    }
  }

  // Get expected signatures for the declared MIME type
  const expectedSignatures = FILE_SIGNATURES[file.type]

  if (!expectedSignatures) {
    // Unknown type, can't validate (but allow it)
    return { isValid: true }
  }

  // Check if file matches any expected signature
  const matchesAnySignature = expectedSignatures.some(sig => matchesSignature(header, sig))

  if (!matchesAnySignature) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Tipo de arquivo nao corresponde ao conteudo',
        details: `O arquivo foi enviado como ${getFileTypeLabel(file.type)}, mas seu conteudo nao corresponde a esse formato. Verifique se o arquivo nao foi renomeado ou corrompido.`
      }
    }
  }

  // Special validation for WebP (needs additional check)
  if (file.type === 'image/webp') {
    if (header.length >= 12) {
      const webpSignatureValid = WEBP_SIGNATURE.every((byte, index) => header[8 + index] === byte)
      if (!webpSignatureValid) {
        return {
          isValid: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Arquivo WebP invalido',
            details: 'O arquivo parece ser um container RIFF, mas nao contem dados WebP validos.'
          }
        }
      }
    }
  }

  // Additional PDF validation - check for proper structure
  if (file.type === 'application/pdf') {
    const pdfValidation = await validatePdfStructure(file)
    if (!pdfValidation.isValid) {
      return pdfValidation
    }
  }

  // Additional image validation for JPEG
  if (file.type === 'image/jpeg') {
    const jpegValidation = await validateJpegStructure(file)
    if (!jpegValidation.isValid) {
      return jpegValidation
    }
  }

  return { isValid: true }
}

/**
 * Validates PDF file structure
 */
async function validatePdfStructure(file: File): Promise<FileValidationResult> {
  // Read last 1KB of file to check for %%EOF marker
  const tailSize = Math.min(1024, file.size)
  const tailBlob = file.slice(file.size - tailSize)

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      const text = reader.result as string

      // Check for %%EOF marker (required for valid PDF)
      // Some PDFs have %%EOF followed by whitespace or extra data
      if (!text.includes('%%EOF')) {
        resolve({
          isValid: false,
          error: {
            code: 'CORRUPT_FILE',
            message: 'PDF corrompido ou incompleto',
            details: 'O arquivo PDF nao possui marcador de fim de arquivo (%%EOF). O arquivo pode estar truncado ou corrompido.'
          }
        })
      } else {
        resolve({ isValid: true })
      }
    }

    reader.onerror = () => {
      resolve({ isValid: true }) // If we can't read, let it pass for now
    }

    reader.readAsText(tailBlob)
  })
}

/**
 * Validates JPEG file structure
 */
async function validateJpegStructure(file: File): Promise<FileValidationResult> {
  // Read last 2 bytes to check for EOI marker (FFD9)
  const tailBlob = file.slice(file.size - 2)

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const tail = new Uint8Array(reader.result)
        // JPEG should end with FFD9 (End Of Image)
        if (tail.length >= 2 && tail[0] === 0xFF && tail[1] === 0xD9) {
          resolve({ isValid: true })
        } else {
          resolve({
            isValid: false,
            error: {
              code: 'TRUNCATED_FILE',
              message: 'Imagem JPEG incompleta',
              details: 'A imagem JPEG parece estar truncada ou corrompida. O marcador de fim de imagem esta ausente.'
            }
          })
        }
      } else {
        resolve({ isValid: true })
      }
    }

    reader.onerror = () => {
      resolve({ isValid: true }) // If we can't read, let it pass for now
    }

    reader.readAsArrayBuffer(tailBlob)
  })
}

/**
 * Gets a human-readable label for file types
 */
function getFileTypeLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/tiff': 'TIFF',
    'image/webp': 'WebP',
  }
  return labels[mimeType] || mimeType
}

/**
 * Validates multiple files and returns validation results for each
 */
export async function validateFiles(files: File[]): Promise<Map<string, FileValidationResult>> {
  const results = new Map<string, FileValidationResult>()

  await Promise.all(
    files.map(async (file) => {
      const result = await validateFileContent(file)
      results.set(file.name, result)
    })
  )

  return results
}

/**
 * Helper to get an error message in Portuguese for display
 */
export function getValidationErrorMessage(error: FileValidationError): string {
  return error.message
}

/**
 * Helper to get detailed error description
 */
export function getValidationErrorDetails(error: FileValidationError): string {
  return error.details || error.message
}
