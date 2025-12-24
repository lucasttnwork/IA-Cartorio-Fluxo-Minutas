# Planning Outline

1. **Goal**: Add CPF (Brazilian tax ID) validation to the person entity in the application.

2. **Approach**: First, explore the codebase to understand the existing structure, particularly the person entity and form validation patterns. Then implement CPF validation logic (which includes checksum validation for the 11-digit Brazilian ID number) on both frontend and backend as appropriate.

3. **Files to Touch**:
   - Person entity/model files - add CPF validation
   - Person form components - add validation UI feedback
   - Validation utilities - add CPF validation function
   - API/backend validation if applicable

4. **Tasks**:
   1. Explore codebase structure to find person entity and existing validation patterns
   2. Create CPF validation utility function
   3. Add CPF validation to person form/entity
   4. Add appropriate error messages for invalid CPF
   5. Test the implementation using Playwright MCP

5. **Risks**:
   - Need to handle CPF formatting (with/without punctuation)
   - Must implement proper checksum validation algorithm
   - Should handle edge cases (all same digits, empty values)

[PLAN_GENERATED] Planning outline complete.

---

Let me start by exploring the codebase structure:

🔧 Tool: Glob
Input: {
  "pattern": "**/*person*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*Person*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/validation*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\canvas\\EditPersonModal.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\components\\entities\\PersonEntityCard.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/types/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/utils/**/*.ts"
}

Let me search for the project's types and lib folder:

🔧 Tool: Glob
Input: {
  "pattern": "src/types/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/lib/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/utils/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\types\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\utils\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\lib\\utils.ts"
}

Now I have a good understanding of the codebase. I'll create a CPF validation utility and integrate it into the EditPersonModal component. Let me create the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create CPF validation utility function",
      "status": "in_progress",
      "activeForm": "Creating CPF validation utility function"
    },
    {
      "content": "Add CPF validation to EditPersonModal form",
      "status": "pending",
      "activeForm": "Adding CPF validation to EditPersonModal form"
    },
    {
      "content": "Add visual error feedback for invalid CPF",
      "status": "pending",
      "activeForm": "Adding visual error feedback for invalid CPF"
    },
    {
      "content": "Verify implementation with Playwright MCP",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright MCP"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\utils\\cpfValidation.ts",
  "content": "// ============================================================================\n// CPF Validation Utility\n// ============================================================================\n// CPF (Cadastro de Pessoas Físicas) is the Brazilian individual taxpayer ID.\n// It consists of 11 digits with 2 check digits at the end.\n\n/**\n * Removes all non-numeric characters from a CPF string\n */\nexport function sanitizeCPF(cpf: string): string {\n  return cpf.replace(/\\D/g, '')\n}\n\n/**\n * Formats a CPF string to the standard format: XXX.XXX.XXX-XX\n */\nexport function formatCPF(cpf: string): string {\n  const cleaned = sanitizeCPF(cpf)\n  if (cleaned.length !== 11) return cpf\n  return cleaned.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4')\n}\n\n/**\n * Validates a CPF number using the checksum algorithm\n *\n * The CPF validation algorithm:\n * 1. First 9 digits are the base number\n * 2. 10th digit is first check digit (calculated from first 9 digits)\n * 3. 11th digit is second check digit (calculated from first 10 digits)\n *\n * @param cpf - CPF string (with or without formatting)\n * @returns true if valid, false otherwise\n */\nexport function isValidCPF(cpf: string): boolean {\n  // Remove non-numeric characters\n  const cleaned = sanitizeCPF(cpf)\n\n  // Must have exactly 11 digits\n  if (cleaned.length !== 11) {\n    return false\n  }\n\n  // Check for known invalid patterns (all same digits)\n  const invalidPatterns = [\n    '00000000000',\n    '11111111111',\n    '22222222222',\n    '33333333333',\n    '44444444444',\n    '55555555555',\n    '66666666666',\n    '77777777777',\n    '88888888888',\n    '99999999999',\n  ]\n\n  if (invalidPatterns.includes(cleaned)) {\n    return false\n  }\n\n  // Validate first check digit\n  let sum = 0\n  for (let i = 0; i < 9; i++) {\n    sum += parseInt(cleaned.charAt(i)) * (10 - i)\n  }\n  let remainder = (sum * 10) % 11\n  if (remainder === 10 || remainder === 11) {\n    remainder = 0\n  }\n  if (remainder !== parseInt(cleaned.charAt(9))) {\n    return false\n  }\n\n  // Validate second check digit\n  sum = 0\n  for (let i = 0; i < 10; i++) {\n    sum += parseInt(cleaned.charAt(i)) * (11 - i)\n  }\n  remainder = (sum * 10) % 11\n  if (remainder === 10 || remainder === 11) {\n    remainder = 0\n  }\n  if (remainder !== parseInt(cleaned.charAt(10))) {\n    return false\n  }\n\n  return true\n}\n\n/**\n * Result of CPF validation with detailed error information\n */\nexport interface CPFValidationResult {\n  isValid: boolean\n  error?: string\n  formattedCPF?: string\n}\n\n/**\n * Validates a CPF and returns detailed validation result\n *\n * @param cpf - CPF string to validate\n * @returns Validation result with error message if invalid\n */\nexport function validateCPF(cpf: string): CPFValidationResult {\n  // Empty CPF is valid (field is optional)\n  if (!cpf || cpf.trim() === '') {\n    return { isValid: true }\n  }\n\n  const cleaned = sanitizeCPF(cpf)\n\n  // Check length\n  if (cleaned.length < 11) {\n    return {\n      isValid: false,\n      error: 'CPF deve conter 11 dígitos',\n    }\n  }\n\n  if (cleaned.length > 11) {\n    return {\n      isValid: false,\n      error: 'CPF deve conter apenas 11 dígitos',\n    }\n  }\n\n  // Check for invalid patterns\n  const allSameDigits = /^(\\d)\\1{10}$/.test(cleaned)\n  if (allSameDigits) {\n    return {\n      isValid: false,\n      error: 'CPF inválido',\n    }\n  }\n\n  // Validate checksum\n  if (!isValidCPF(cleaned)) {\n    return {\n      isValid: false,\n      error: 'CPF inválido',\n    }\n  }\n\n  return {\n    isValid: true,\n    formattedCPF: formatCPF(cleaned),\n  }\n}\n"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Users\\Lucas\\OneDrive\\Documentos\\PROJETOS - CODE\\Claude-Code-Projects\\IA-Cartório-Fluxo-Minutas\\src\\utils\\index.ts"
}
