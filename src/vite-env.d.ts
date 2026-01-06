/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  // Application Configuration
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_URL?: string

  // Vite built-in
  readonly MODE: 'development' | 'production' | 'test'
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
