// Worker Health Check Utility
//
// This module provides utilities to check if the background worker is running
// and healthy before creating processing jobs.

export interface WorkerHealthStatus {
  isHealthy: boolean
  status?: 'healthy' | 'starting' | 'offline'
  uptime?: number
  activeJobs?: number
  maxConcurrentJobs?: number
  timestamp?: string
  environment?: string
  error?: string
}

const WORKER_HEALTH_URL = 'http://localhost:3001/health'
const HEALTH_CHECK_TIMEOUT = 3000 // 3 seconds

/**
 * Check if the background worker is running and healthy
 *
 * @returns Promise<WorkerHealthStatus> - Health status information
 */
export async function checkWorkerHealth(): Promise<WorkerHealthStatus> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)

    const response = await fetch(WORKER_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return {
        isHealthy: false,
        status: 'offline',
        error: `Worker returned status ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      isHealthy: data.status === 'healthy',
      status: data.status,
      uptime: data.uptime,
      activeJobs: data.activeJobs,
      maxConcurrentJobs: data.maxConcurrentJobs,
      timestamp: data.timestamp,
      environment: data.environment,
    }
  } catch (error) {
    // Worker is offline or not responding
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      isHealthy: false,
      status: 'offline',
      error: errorMessage,
    }
  }
}

/**
 * Get a user-friendly message about worker status
 */
export function getWorkerStatusMessage(health: WorkerHealthStatus): string {
  if (health.isHealthy) {
    return 'Worker está online e pronto para processar jobs'
  }

  if (health.status === 'starting') {
    return 'Worker está iniciando...'
  }

  // Offline
  return `Worker offline. Inicie o worker executando: cd worker && npm run dev`
}

/**
 * Get instructions for starting the worker
 */
export function getWorkerStartInstructions(): string {
  return `
O worker de processamento não está rodando. Para iniciar o worker:

1. Abra um novo terminal
2. Execute os seguintes comandos:
   cd worker
   npm run dev

3. Aguarde até ver a mensagem "Worker is running and listening for jobs..."
4. Tente novamente

O worker precisa estar rodando para processar documentos e extrair entidades.
`.trim()
}
