/**
 * Worker Environment Configuration
 *
 * This module provides type-safe access to environment variables for the worker process.
 * It validates all required configurations at startup and fails gracefully with clear
 * error messages when required configurations are missing.
 *
 * Note: This is separate from the main app's environment.ts because the worker runs
 * in a Node.js environment (using process.env) rather than Vite (import.meta.env).
 */

import 'dotenv/config'

// ============================================================================
// Environment Detection
// ============================================================================

export type Environment = 'development' | 'production' | 'test'

/**
 * Detect current environment based on NODE_ENV
 */
export function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  if (nodeEnv === 'test') return 'test'
  return 'development'
}

export const ENV = getEnvironment()
export const isDevelopment = ENV === 'development'
export const isProduction = ENV === 'production'
export const isTest = ENV === 'test'

// ============================================================================
// Environment Variable Validation
// ============================================================================

interface EnvValidationError {
  variable: string
  message: string
  required: boolean
}

/**
 * Validates required environment variables and returns validation errors
 */
function validateEnvironmentVariables(): EnvValidationError[] {
  const errors: EnvValidationError[] = []

  // Required Supabase variables
  if (!process.env.SUPABASE_URL) {
    errors.push({
      variable: 'SUPABASE_URL',
      message: 'Supabase URL is required. Get it from your Supabase project settings.',
      required: true,
    })
  } else if (!isValidUrl(process.env.SUPABASE_URL)) {
    errors.push({
      variable: 'SUPABASE_URL',
      message: 'Supabase URL must be a valid URL (e.g., https://your-project.supabase.co)',
      required: true,
    })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push({
      variable: 'SUPABASE_SERVICE_ROLE_KEY',
      message: 'Supabase service role key is required for worker operations. Get it from your Supabase project settings.',
      required: true,
    })
  } else if (
    process.env.SUPABASE_SERVICE_ROLE_KEY.length < 30 &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')
  ) {
    // Accept both legacy JWT format (100+ chars) and new sb_secret_ format (30+ chars)
    errors.push({
      variable: 'SUPABASE_SERVICE_ROLE_KEY',
      message: 'Supabase service role key appears to be invalid (too short).',
      required: true,
    })
  }

  // Google AI API key (required for LLM processing)
  if (!process.env.GOOGLE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
    errors.push({
      variable: 'GOOGLE_AI_API_KEY',
      message: 'Google AI API key is required for LLM processing. Get it from Google AI Studio.',
      required: true,
    })
  }

  // Google Document AI (optional but recommended)
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    errors.push({
      variable: 'GOOGLE_CLOUD_PROJECT_ID',
      message: 'Google Cloud Project ID is recommended for Document AI processing.',
      required: false,
    })
  }

  if (!process.env.GOOGLE_CLOUD_LOCATION) {
    errors.push({
      variable: 'GOOGLE_CLOUD_LOCATION',
      message: 'Google Cloud Location is recommended for Document AI (e.g., us, eu).',
      required: false,
    })
  }

  if (!process.env.GOOGLE_CLOUD_PROCESSOR_ID) {
    errors.push({
      variable: 'GOOGLE_CLOUD_PROCESSOR_ID',
      message: 'Google Cloud Processor ID is REQUIRED for Document AI OCR processing. Create a processor at https://console.cloud.google.com/ai/document-ai',
      required: true,
    })
  }

  return errors
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'https:' || (isDevelopment && url.protocol === 'http:')
  } catch {
    return false
  }
}

// ============================================================================
// Environment Variables Interface
// ============================================================================

export interface WorkerEnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string
    serviceRoleKey: string
  }

  // Google AI Configuration
  googleAI: {
    apiKey: string
    model: string
  }

  // Google Document AI Configuration (optional)
  documentAI: {
    projectId: string | null
    location: string
    processorId: string | null
    credentials: string | null
  }

  // Worker Configuration
  worker: {
    pollInterval: number
    retryBaseDelay: number
    retryMaxDelay: number
    maxConcurrentJobs: number
    jobTimeout: number
    zombieJobThresholdMs: number
    enableAutoRecovery: boolean
    activePollIntervalMs: number
  }

  // Application Configuration
  app: {
    name: string
    environment: Environment
  }

  // Feature Flags
  features: {
    enableDocumentAI: boolean
    enableDebugMode: boolean
    enableMetrics: boolean
  }
}

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Get a required environment variable or throw an error
 */
function getRequiredEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Get an optional environment variable with a default value
 */
function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

/**
 * Get an optional environment variable that may be null
 */
function getOptionalEnvVarNullable(key: string): string | null {
  return process.env[key] || null
}

/**
 * Parse an integer from environment variable with default
 */
function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse a boolean from environment variable with default
 */
function getEnvBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Create the worker environment configuration object
 */
function createWorkerEnvironmentConfig(): WorkerEnvironmentConfig {
  // Get Google AI API key (support both naming conventions)
  const googleAIApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''

  // Check if Document AI is fully configured
  const hasDocumentAI = !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_CLOUD_PROCESSOR_ID
  )

  return {
    supabase: {
      url: getRequiredEnvVar('SUPABASE_URL'),
      serviceRoleKey: getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    },
    googleAI: {
      apiKey: googleAIApiKey,
      model: getOptionalEnvVar('GOOGLE_AI_MODEL', 'gemini-3-flash-preview'),
    },
    documentAI: {
      projectId: getOptionalEnvVarNullable('GOOGLE_CLOUD_PROJECT_ID'),
      location: getOptionalEnvVar('GOOGLE_CLOUD_LOCATION', 'us'),
      processorId: getOptionalEnvVarNullable('GOOGLE_CLOUD_PROCESSOR_ID'),
      credentials: getOptionalEnvVarNullable('GOOGLE_APPLICATION_CREDENTIALS'),
    },
    worker: {
      pollInterval: getEnvInt('POLL_INTERVAL', 5000),
      retryBaseDelay: getEnvInt('RETRY_BASE_DELAY', 10000),
      retryMaxDelay: getEnvInt('RETRY_MAX_DELAY', 300000),
      maxConcurrentJobs: getEnvInt('MAX_CONCURRENT_JOBS', 5), // Process 5 jobs in parallel for better performance
      jobTimeout: getEnvInt('JOB_TIMEOUT', 300000), // 5 minutes default
      zombieJobThresholdMs: getEnvInt('ZOMBIE_JOB_THRESHOLD_MS', 120000), // 2 minutes
      enableAutoRecovery: getEnvBool('ENABLE_AUTO_RECOVERY', true),
      activePollIntervalMs: getEnvInt('ACTIVE_POLL_INTERVAL_MS', 5000), // 5 seconds
    },
    app: {
      name: getOptionalEnvVar('APP_NAME', 'Minuta Canvas Worker'),
      environment: ENV,
    },
    features: {
      enableDocumentAI: hasDocumentAI,
      enableDebugMode: isDevelopment || getEnvBool('DEBUG', false),
      enableMetrics: getEnvBool('ENABLE_METRICS', false),
    },
  }
}

// ============================================================================
// Initialization and Export
// ============================================================================

/**
 * Validate environment on module load and throw comprehensive error if invalid
 */
function initializeWorkerEnvironment(): WorkerEnvironmentConfig {
  const validationErrors = validateEnvironmentVariables()

  // Filter only required errors for failure
  const requiredErrors = validationErrors.filter((err) => err.required)
  const warningErrors = validationErrors.filter((err) => !err.required)

  // Log warnings for optional missing variables
  if (warningErrors.length > 0) {
    const warningMessages = warningErrors
      .map((err) => `  - ${err.variable}: ${err.message}`)
      .join('\n')

    console.warn(`
================================================================================
WORKER CONFIGURATION WARNINGS
================================================================================

The following optional environment variables are not set:

${warningMessages}

Some features may be disabled. See .env.example for documentation.
================================================================================
`)
  }

  // Fail if required variables are missing
  if (requiredErrors.length > 0) {
    const errorMessages = requiredErrors
      .map((err) => `  - ${err.variable}: ${err.message}`)
      .join('\n')

    const fullMessage = `
================================================================================
WORKER ENVIRONMENT CONFIGURATION ERROR
================================================================================

The following required environment variables are missing or invalid:

${errorMessages}

To fix this:
1. Copy .env.example to .env in the worker directory
2. Fill in the required values
3. Restart the worker process

For production deployments, ensure all environment variables are properly set
in your deployment platform.

================================================================================
`

    console.error(fullMessage)
    throw new Error(
      `Missing required environment variables: ${requiredErrors.map((e) => e.variable).join(', ')}`
    )
  }

  return createWorkerEnvironmentConfig()
}

/**
 * The validated worker environment configuration
 * Throws an error if required variables are missing
 */
export const workerConfig = initializeWorkerEnvironment()

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log current worker environment configuration (safe for logging, no secrets)
 */
export function logWorkerEnvironmentInfo(): void {
  console.log('Worker Environment Configuration:', {
    environment: ENV,
    appName: workerConfig.app.name,
    supabaseUrl: workerConfig.supabase.url,
    googleAIModel: workerConfig.googleAI.model,
    documentAI: {
      enabled: workerConfig.features.enableDocumentAI,
      projectId: workerConfig.documentAI.projectId ? '***configured***' : null,
      location: workerConfig.documentAI.location,
    },
    worker: {
      pollInterval: `${workerConfig.worker.pollInterval}ms`,
      retryBaseDelay: `${workerConfig.worker.retryBaseDelay}ms`,
      retryMaxDelay: `${workerConfig.worker.retryMaxDelay}ms`,
      maxConcurrentJobs: workerConfig.worker.maxConcurrentJobs,
      jobTimeout: `${workerConfig.worker.jobTimeout}ms`,
      zombieJobThresholdMs: `${workerConfig.worker.zombieJobThresholdMs}ms`,
      enableAutoRecovery: workerConfig.worker.enableAutoRecovery,
      activePollIntervalMs: `${workerConfig.worker.activePollIntervalMs}ms`,
    },
    features: workerConfig.features,
  })
}

/**
 * Validate that the worker is properly configured to run
 * Returns true if all critical services are available
 */
export function validateWorkerReadiness(): { ready: boolean; issues: string[] } {
  const issues: string[] = []

  // Check Supabase connection
  if (!workerConfig.supabase.url || !workerConfig.supabase.serviceRoleKey) {
    issues.push('Supabase is not configured')
  }

  // Check Google AI
  if (!workerConfig.googleAI.apiKey) {
    issues.push('Google AI API key is not configured')
  }

  // Check Document AI (warning only)
  if (!workerConfig.features.enableDocumentAI) {
    issues.push('Document AI is not configured - OCR features will be limited')
  }

  return {
    ready: issues.filter((i) => !i.includes('warning')).length === 0,
    issues,
  }
}

/**
 * Get Supabase client configuration options for the worker
 */
export function getSupabaseClientOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Worker-specific optimizations
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-worker-version': '1.0.0',
      },
    },
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default workerConfig
