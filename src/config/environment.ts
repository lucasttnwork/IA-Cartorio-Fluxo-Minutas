/**
 * Centralized Environment Configuration
 *
 * This module provides type-safe access to environment variables with validation,
 * ensuring the application fails gracefully with clear error messages when
 * required configurations are missing.
 */

// ============================================================================
// Environment Detection
// ============================================================================

export type Environment = 'development' | 'production' | 'test'

/**
 * Detect current environment based on Vite's mode
 */
export function getEnvironment(): Environment {
  const mode = import.meta.env.MODE
  if (mode === 'production') return 'production'
  if (mode === 'test') return 'test'
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
}

/**
 * Validates required environment variables and returns validation errors
 */
function validateEnvironmentVariables(): EnvValidationError[] {
  const errors: EnvValidationError[] = []

  // Required Supabase variables
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push({
      variable: 'VITE_SUPABASE_URL',
      message: 'Supabase URL is required. Get it from your Supabase project settings.',
    })
  } else if (!isValidUrl(import.meta.env.VITE_SUPABASE_URL)) {
    errors.push({
      variable: 'VITE_SUPABASE_URL',
      message: 'Supabase URL must be a valid URL (e.g., https://your-project.supabase.co)',
    })
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push({
      variable: 'VITE_SUPABASE_ANON_KEY',
      message: 'Supabase anonymous key is required. Get it from your Supabase project settings.',
    })
  } else if (import.meta.env.VITE_SUPABASE_ANON_KEY.length < 30) {
    // Relaxed validation for development - production keys are typically 100+ chars
    errors.push({
      variable: 'VITE_SUPABASE_ANON_KEY',
      message: 'Supabase anonymous key appears to be invalid (too short).',
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

export interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string
    anonKey: string
  }

  // Application Configuration
  app: {
    name: string
    url: string
    environment: Environment
  }

  // Feature Flags (can be extended)
  features: {
    enableRealtimeSubscriptions: boolean
    enableDebugMode: boolean
  }
}

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Get a validated environment variable or throw an error
 */
function getRequiredEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] as string | undefined
  if (value) return value
  if (defaultValue !== undefined) return defaultValue
  throw new Error(`Missing required environment variable: ${key}`)
}

/**
 * Get an optional environment variable with a default value
 */
function getOptionalEnvVar(key: string, defaultValue: string): string {
  const value = import.meta.env[key] as string | undefined
  return value || defaultValue
}

/**
 * Create the environment configuration object
 */
function createEnvironmentConfig(): EnvironmentConfig {
  return {
    supabase: {
      url: getRequiredEnvVar('VITE_SUPABASE_URL'),
      anonKey: getRequiredEnvVar('VITE_SUPABASE_ANON_KEY'),
    },
    app: {
      name: getOptionalEnvVar('VITE_APP_NAME', 'Minuta Canvas'),
      url: getOptionalEnvVar('VITE_APP_URL', isDevelopment ? 'http://localhost:5173' : ''),
      environment: ENV,
    },
    features: {
      enableRealtimeSubscriptions: true,
      enableDebugMode: isDevelopment,
    },
  }
}

// ============================================================================
// Initialization and Export
// ============================================================================

/**
 * Validate environment on module load and throw comprehensive error if invalid
 */
function initializeEnvironment(): EnvironmentConfig {
  const validationErrors = validateEnvironmentVariables()

  if (validationErrors.length > 0) {
    const errorMessages = validationErrors
      .map((err) => `  - ${err.variable}: ${err.message}`)
      .join('\n')

    const fullMessage = `
================================================================================
ENVIRONMENT CONFIGURATION ERROR
================================================================================

The following environment variables are missing or invalid:

${errorMessages}

To fix this:
1. Copy .env.example to .env.local
2. Fill in the required values
3. Restart the development server

For production deployments, ensure all environment variables are properly set
in your deployment platform (Vercel, Netlify, etc.).

================================================================================
`

    // In development, log the error but don't throw immediately
    // This allows the app to show a friendly error page
    if (isDevelopment) {
      console.error(fullMessage)
    }

    throw new Error(`Missing required environment variables: ${validationErrors.map((e) => e.variable).join(', ')}`)
  }

  return createEnvironmentConfig()
}

/**
 * The validated environment configuration
 * Throws an error if required variables are missing
 */
export const config = initializeEnvironment()

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get allowed origins for CORS configuration
 * In production, this should match your deployed domains
 */
export function getAllowedOrigins(): string[] {
  if (isDevelopment) {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
  }

  const appUrl = config.app.url
  const origins: string[] = []

  if (appUrl) {
    origins.push(appUrl)
    // Add www variant if not already present
    try {
      const url = new URL(appUrl)
      if (!url.hostname.startsWith('www.')) {
        origins.push(`${url.protocol}//www.${url.hostname}${url.port ? ':' + url.port : ''}`)
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  return origins
}

/**
 * Log current environment configuration (safe for logging, no secrets)
 */
export function logEnvironmentInfo(): void {
  console.log('Environment Configuration:', {
    environment: ENV,
    appName: config.app.name,
    appUrl: config.app.url,
    supabaseUrl: config.supabase.url,
    features: config.features,
  })
}

/**
 * Check if running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if running in a server/worker environment
 */
export function isServer(): boolean {
  return !isBrowser()
}

// ============================================================================
// Default Export
// ============================================================================

export default config
