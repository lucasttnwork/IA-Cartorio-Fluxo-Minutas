# Implementação: Trigger Automático para Entity Resolution

## Visão Geral

Este documento fornece a implementação prática do trigger automático para `entity_resolution` após conclusão de `entity_extraction`, conforme recomendado na análise anterior.

---

## Implementação Recomendada: Worker-Side Orchestration

### Passo 1: Modificar `worker/src/index.ts`

Adicionar função de orquestração de jobs e modificar o loop de polling.

**Localização**: Após import de `processJob` (linha 2)

```typescript
// ============================================================================
// Job Orchestration
// ============================================================================

/**
 * Map of job types to their next job in the pipeline.
 * This defines the processing pipeline sequence:
 * OCR → Extraction → Consensus → Entity_Resolution → Draft
 *
 * Special case: entity_extraction can occur independently and should
 * trigger entity_resolution after completion.
 */
const JOB_PIPELINE_SEQUENCE: Record<string, string | null> = {
  'ocr': 'extraction',
  'extraction': 'consensus',
  'consensus': 'entity_resolution',
  'entity_resolution': 'draft',
  'entity_extraction': 'entity_resolution',  // KEY: entity_extraction → entity_resolution
  'draft': null, // No next job
}

/**
 * Trigger the next job in the pipeline after current job completes successfully.
 * This implements automatic job orchestration without manual intervention.
 *
 * @param supabase - Supabase client
 * @param completedJob - The job that just completed
 * @returns void
 */
async function triggerNextJob(
  supabase: SupabaseClient,
  completedJob: ProcessingJob
): Promise<void> {
  // Determine next job type based on completed job
  const nextJobType = JOB_PIPELINE_SEQUENCE[completedJob.job_type]

  // Only trigger next job if:
  // 1. There is a next job in the sequence
  // 2. The current job has a document_id (document-level jobs, not case-level)
  if (!nextJobType || !completedJob.document_id) {
    if (!nextJobType) {
      console.log(`[Orchestration] Job ${completedJob.job_type} is terminal job (no next job)`)
    }
    if (!completedJob.document_id) {
      console.log(`[Orchestration] Job ${completedJob.id} is case-level (no document_id), skipping next job`)
    }
    return
  }

  try {
    console.log(
      `[Orchestration] Creating ${nextJobType} job for document ${completedJob.document_id} ` +
      `(triggered by ${completedJob.job_type})`
    )

    // Check if next job already exists (avoid duplicates)
    const { data: existingJob, error: checkError } = await supabase
      .from('processing_jobs')
      .select('id, status')
      .eq('document_id', completedJob.document_id)
      .eq('job_type', nextJobType)
      .in('status', ['pending', 'processing', 'completed'])
      .maybeSingle() // Returns null if no rows, error if multiple

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.warn(`[Orchestration] Error checking for existing ${nextJobType} job:`, checkError)
      // Continue anyway - duplicate jobs have low impact
    }

    if (existingJob) {
      console.log(
        `[Orchestration] Job ${nextJobType} already exists for document ${completedJob.document_id} ` +
        `with status ${existingJob.status}, skipping creation`
      )
      return
    }

    // Create new job in pipeline
    const { data: newJob, error: createError } = await supabase
      .from('processing_jobs')
      .insert({
        case_id: completedJob.case_id,
        document_id: completedJob.document_id,
        job_type: nextJobType,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (createError) {
      console.error(
        `[Orchestration] Failed to create ${nextJobType} job for document ${completedJob.document_id}:`,
        createError.message
      )
      return
    }

    console.log(
      `[Orchestration] Successfully created ${nextJobType} job ${newJob.id} ` +
      `for document ${completedJob.document_id}`
    )

  } catch (error) {
    console.error(
      `[Orchestration] Unexpected error triggering ${nextJobType} job:`,
      error instanceof Error ? error.message : String(error)
    )
  }
}
```

**Localização**: Dentro de `pollForJobs()` função (substituir linhas 112-124)

```typescript
      try {
        const result = await processJob(supabase, job)

        // Mark job as completed
        await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result,
          })
          .eq('id', job.id)

        // NOVO: Trigger next job in pipeline sequence
        await triggerNextJob(supabase, job)

        console.log(`Job ${job.id} completed successfully`)
      } catch (jobError) {
```

---

## Passo 2: Criar Função de Recuperação de Jobs Stuck

Para lidar com jobs `entity_extraction` que completaram sem trigger anterior.

**Localização**: Adicionar em `worker/src/index.ts` após função `triggerNextJob`

```typescript
/**
 * Recover stuck entity_extraction jobs that didn't trigger entity_resolution.
 * This should be called once at startup or as an admin task.
 *
 * @param supabase - Supabase client
 * @returns Recovery statistics
 */
async function recoverStuckEntityExtractionJobs(
  supabase: SupabaseClient
): Promise<{ recovered: number; errors: number }> {
  console.log('[Recovery] Scanning for stuck entity_extraction jobs...')

  try {
    // Find entity_extraction jobs that completed but don't have a following entity_resolution job
    const { data: completedJobs, error: queryError } = await supabase
      .from('processing_jobs')
      .select('id, case_id, document_id, created_at')
      .eq('job_type', 'entity_extraction')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(100)

    if (queryError) {
      console.error('[Recovery] Error querying completed entity_extraction jobs:', queryError)
      return { recovered: 0, errors: 1 }
    }

    if (!completedJobs || completedJobs.length === 0) {
      console.log('[Recovery] No completed entity_extraction jobs found')
      return { recovered: 0, errors: 0 }
    }

    let recovered = 0
    let errors = 0

    for (const job of completedJobs) {
      try {
        // Check if entity_resolution job exists for this document
        const { data: nextJob, error: checkError } = await supabase
          .from('processing_jobs')
          .select('id, status')
          .eq('document_id', job.document_id)
          .eq('job_type', 'entity_resolution')
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          console.warn(
            `[Recovery] Error checking entity_resolution for document ${job.document_id}:`,
            checkError.message
          )
          errors++
          continue
        }

        // If no entity_resolution job exists, create one
        if (!nextJob) {
          const { error: createError } = await supabase
            .from('processing_jobs')
            .insert({
              case_id: job.case_id,
              document_id: job.document_id,
              job_type: 'entity_resolution',
              status: 'pending',
              attempts: 0,
              max_attempts: 3,
              created_at: new Date().toISOString(),
            })

          if (createError) {
            console.error(
              `[Recovery] Failed to create entity_resolution job for document ${job.document_id}:`,
              createError.message
            )
            errors++
          } else {
            console.log(
              `[Recovery] Created missing entity_resolution job for document ${job.document_id}`
            )
            recovered++
          }
        }
      } catch (error) {
        console.error(
          `[Recovery] Unexpected error processing job ${job.id}:`,
          error instanceof Error ? error.message : String(error)
        )
        errors++
      }
    }

    console.log(`[Recovery] Completed: ${recovered} jobs recovered, ${errors} errors`)
    return { recovered, errors }

  } catch (error) {
    console.error(
      '[Recovery] Unexpected error during recovery:',
      error instanceof Error ? error.message : String(error)
    )
    return { recovered: 0, errors: 1 }
  }
}
```

**Chamar ao iniciar o worker** (após validação de readiness, linha ~45):

```typescript
// Run recovery of stuck jobs on startup
;(async () => {
  const recovery = await recoverStuckEntityExtractionJobs(supabase)
  if (recovery.recovered > 0) {
    console.log(`[Startup] Recovered ${recovery.recovered} stuck jobs`)
  }
})()
```

---

## Passo 3: Adicionar Logging Estruturado

Para melhor observabilidade do pipeline de jobs.

**Localização**: Criar novo arquivo `worker/src/utils/jobOrchestration.ts`

```typescript
/**
 * Job Orchestration Utilities
 *
 * Provides logging and monitoring for the job pipeline sequence.
 */

export interface JobPipelineMetrics {
  jobId: string
  jobType: string
  documentId: string | null
  caseId: string
  completedAt: Date
  nextJobType: string | null
  nextJobCreatedAt?: Date
  processingTimeMs: number
}

/**
 * Log job pipeline transition for monitoring
 */
export function logJobTransition(metrics: JobPipelineMetrics): void {
  const message = metrics.nextJobType
    ? `[Pipeline] ${metrics.jobType} → ${metrics.nextJobType} ` +
      `(doc: ${metrics.documentId}, case: ${metrics.caseId})`
    : `[Pipeline] ${metrics.jobType} is terminal ` +
      `(doc: ${metrics.documentId}, case: ${metrics.caseId})`

  console.log(message, {
    processingTimeMs: metrics.processingTimeMs,
    timestamp: metrics.completedAt.toISOString(),
  })
}

/**
 * Export job metrics for observability/monitoring system
 */
export function exportJobMetrics(metrics: JobPipelineMetrics): Record<string, unknown> {
  return {
    job_type: metrics.jobType,
    next_job_type: metrics.nextJobType || 'none',
    document_id: metrics.documentId,
    case_id: metrics.caseId,
    processing_time_ms: metrics.processingTimeMs,
    has_next_job: !!metrics.nextJobType,
  }
}
```

---

## Passo 4: Testes Unitários

**Localização**: Criar novo arquivo `worker/__tests__/jobOrchestration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import type { ProcessingJob } from '../src/types'

describe('Job Orchestration', () => {
  let supabaseMock: SupabaseClient
  let triggerNextJob: (supabase: SupabaseClient, job: ProcessingJob) => Promise<void>

  beforeEach(() => {
    // Mock Supabase client
    supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'job-123' }, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient
  })

  it('should trigger entity_resolution after entity_extraction completes', async () => {
    const completedJob: ProcessingJob = {
      id: 'entity-ext-job-1',
      case_id: 'case-1',
      document_id: 'doc-1',
      job_type: 'entity_extraction',
      status: 'completed',
      attempts: 1,
      max_attempts: 3,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    // Mock should verify that entity_resolution job is created
    await triggerNextJob(supabaseMock, completedJob)

    // Assert
    expect(supabaseMock.from).toHaveBeenCalledWith('processing_jobs')
  })

  it('should not trigger job for terminal job types', async () => {
    const completedJob: ProcessingJob = {
      id: 'draft-job-1',
      case_id: 'case-1',
      document_id: 'doc-1',
      job_type: 'draft',
      status: 'completed',
      attempts: 1,
      max_attempts: 3,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    await triggerNextJob(supabaseMock, completedJob)

    // Assert: insert should not be called for draft (terminal job)
    expect(supabaseMock.from().insert).not.toHaveBeenCalled()
  })

  it('should not create duplicate next jobs', async () => {
    const completedJob: ProcessingJob = {
      id: 'entity-ext-job-1',
      case_id: 'case-1',
      document_id: 'doc-1',
      job_type: 'entity_extraction',
      status: 'completed',
      attempts: 1,
      max_attempts: 3,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    // Mock existing entity_resolution job
    supabaseMock.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'entity-res-1', status: 'pending' },
              error: null,
            }),
          }),
        }),
      }),
    })

    await triggerNextJob(supabaseMock, completedJob)

    // Assert: insert should not be called (job already exists)
    expect(supabaseMock.from().insert).not.toHaveBeenCalled()
  })
})
```

---

## Passo 5: Verificação de Saúde do Pipeline

**Localização**: Adicionar em `worker/src/index.ts`

```typescript
/**
 * Health check for job pipeline - verifies no jobs are stuck
 */
async function checkPipelineHealth(supabase: SupabaseClient): Promise<void> {
  try {
    const { data: processingJobs, error } = await supabase
      .from('processing_jobs')
      .select('id, job_type, status, created_at, started_at')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('[Health] Error checking pipeline health:', error)
      return
    }

    const now = Date.now()
    const STUCK_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

    let stuckCount = 0
    for (const job of processingJobs || []) {
      const createdAt = new Date(job.created_at).getTime()
      const ageMs = now - createdAt

      if (ageMs > STUCK_THRESHOLD_MS) {
        console.warn(
          `[Health] Stuck job detected: ${job.id} (${job.job_type}) ` +
          `stuck for ${(ageMs / 1000 / 60 / 60).toFixed(1)} hours`
        )
        stuckCount++
      }
    }

    if (stuckCount > 0) {
      console.warn(`[Health] Found ${stuckCount} stuck jobs in pipeline`)
    } else {
      console.log(`[Health] Pipeline health: OK (${processingJobs?.length || 0} jobs in progress)`)
    }

  } catch (error) {
    console.error(
      '[Health] Error during health check:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

// Call health check every 30 minutes
setInterval(() => checkPipelineHealth(supabase), 30 * 60 * 1000)
```

---

## Passo 6: Configuração de Variáveis de Ambiente

**Localização**: Atualizar `.env.example` no diretório worker

```bash
# Job Pipeline Configuration
JOB_PIPELINE_ENABLED=true
JOB_ORCHESTRATION_LOG_LEVEL=info
JOB_DEDUPLICATION_CHECK_ENABLED=true
JOB_RECOVERY_ON_STARTUP=true
JOB_STUCK_THRESHOLD_MS=86400000  # 24 hours
```

---

## Checklist de Implementação

- [ ] Adicionar função `triggerNextJob()` em `worker/src/index.ts`
- [ ] Modificar `pollForJobs()` para chamar `triggerNextJob()`
- [ ] Implementar função `recoverStuckEntityExtractionJobs()`
- [ ] Chamar recovery na inicialização do worker
- [ ] Criar arquivo de utilidades de orchestration
- [ ] Escrever testes unitários
- [ ] Adicionar health check periódico
- [ ] Atualizar `.env.example` com novas variáveis
- [ ] Testar em staging com dados reais
- [ ] Monitorar logs em produção

---

## Teste Manual

### 1. Verificar Trigger Manual

```bash
# Terminal 1: Iniciar worker
cd worker
npm run dev

# Terminal 2: Criar documento teste
npm run test:document:create -- --case-id <case-uuid>

# Observar logs para confirmar:
# [Orchestration] Creating entity_resolution job for document...
```

### 2. Verificar Recuperação

```bash
# Criar manualmente job entity_extraction sem entity_resolution
supabase db push

# Reiniciar worker
npm run dev

# Observar logs para:
# [Recovery] Created missing entity_resolution job for document...
```

---

## Monitoramento em Produção

### Métricas Chave

```typescript
// Número de jobs criados por trigger automático
jobs_created_by_orchestration_total{job_type="entity_resolution"}

// Tempo entre conclusão e criação do próximo job
job_orchestration_delay_ms

// Número de jobs duplicados evitados
duplicate_jobs_prevented_total

// Número de jobs recuperados na inicialização
jobs_recovered_on_startup_total
```

### Alertas Recomendados

- Alerta se `job_orchestration_delay_ms` > 30 segundos
- Alerta se `jobs_recovered_on_startup_total` > 5 (indica problema sistêmico)
- Alerta se jobs ficam presos por > 24 horas

---

## Próximos Passos

1. **Implementar em branch feature**: `feature/entity-extraction-trigger`
2. **Testar com dados reais** em staging
3. **Criar PR com testes** para code review
4. **Deploy gradual** em produção com monitoramento
5. **Coletar métricas** de melhoria de throughput

