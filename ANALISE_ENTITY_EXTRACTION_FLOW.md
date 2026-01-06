# Análise Completa: Entity Extraction e Trigger para Entity Resolution

## Análise Solicitada
Analisar o arquivo `worker/src/jobs/entityExtraction.ts` para identificar:
1. O que acontece quando entity extraction completa
2. Se há trigger para entity_resolution
3. Como as entidades extraídas são armazenadas
4. Se não houver trigger automático, onde adicionar

---

## 1. O QUE ACONTECE QUANDO ENTITY EXTRACTION COMPLETA

### Fluxo de Conclusão (Linhas 409-423)

Quando a entity extraction **completa com sucesso**, o arquivo realiza as seguintes ações:

#### 1.1 Armazenamento de Entidades (Linhas 365-394)

```typescript
const entityExtractionResult: EntityExtractionResult = {
  entities: filteredEntities,      // Array de entidades extraídas
  document_id: job.document_id,
  processing_time_ms: Date.now() - startTime,
  model_used: 'gemini-3-flash-preview',
}

// Update extraction record with entities
if (extraction) {
  const existingLlmResult = extraction.llm_result as Record<string, unknown> || {}
  await supabase
    .from('extractions')
    .update({
      llm_result: {
        ...existingLlmResult,
        entity_extraction: entityExtractionResult,  // <-- Armazenado aqui
      },
    })
    .eq('id', extraction.id)
} else {
  await supabase
    .from('extractions')
    .insert({
      document_id: job.document_id,
      llm_result: {
        entity_extraction: entityExtractionResult,
      },
      pending_fields: [],
    })
}
```

#### 1.2 Atualização de Metadados do Documento (Linhas 396-407)

```typescript
await supabase
  .from('documents')
  .update({
    metadata: {
      ...((document.metadata as Record<string, unknown>) || {}),
      entity_count: filteredEntities.length,        // Conta de entidades
      entity_extraction_date: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  })
  .eq('id', job.document_id)
```

#### 1.3 Log e Retorno de Status (Linhas 409-423)

```typescript
console.log(`Entity extraction completed for document ${job.document_id}: ${filteredEntities.length} entities`)

// Group entities by type for summary
const entitySummary: Record<string, number> = {}
for (const entity of filteredEntities) {
  entitySummary[entity.type] = (entitySummary[entity.type] || 0) + 1
}

return {
  status: 'completed',
  entities_count: filteredEntities.length,
  entity_summary: entitySummary,
  processing_time_ms: Date.now() - startTime,
  chunks_processed: textChunks.length,
}
```

---

## 2. TRIGGER PARA ENTITY_RESOLUTION - **NÃO EXISTE**

### Status Atual

**IMPORTANTE:** Não existe trigger automático para `entity_resolution` após entity_extraction completar.

### Arquitetura Atual de Jobs

A pipeline de jobs é processada por `worker/src/jobs/processor.ts`:

```typescript
export async function processJob(
  supabase: SupabaseClient,
  job: ProcessingJob
): Promise<Record<string, unknown>> {
  const handlers: Record<JobType, ...> = {
    ocr: runOcrJob,
    extraction: runExtractionJob,
    consensus: runConsensusJob,
    entity_resolution: runEntityResolutionJob,  // Handler existe
    entity_extraction: runEntityExtractionJob,   // Handler existe
    draft: runDraftJob,
  }
  // ...
}
```

Os jobs são gerenciados pelo worker polling em `worker/src/index.ts`:

```typescript
async function pollForJobs() {
  const { data: jobs, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)  // <-- Processa 1 job por vez
  // ...
}
```

### Fluxo Atual de Criação de Jobs

Os jobs são criados **manualmente** via frontend:

1. **Durante upload**: `src/services/bulkProcessingService.ts` (linha 386)
   ```typescript
   const { error: jobError } = await createProcessingJob(caseId, docData.id, 'ocr')
   ```

2. **Manual via API**: `src/lib/supabase.ts` (linha 271)
   ```typescript
   export async function createProcessingJob(
     caseId: string,
     documentId: string | null,
     jobType: 'ocr' | 'extraction' | 'consensus' | 'entity_resolution' | 'entity_extraction' | 'draft'
   )
   ```

3. **Reprocessing**: `src/services/documentService.ts` (linha 365)
   ```typescript
   const { data: newJob, error: createJobError } = await supabase
     .from('processing_jobs')
     .insert({
       case_id: doc.case_id,
       document_id: documentId,
       job_type: 'ocr',  // <-- Sempre começa com OCR
       // ...
     })
   ```

---

## 3. COMO AS ENTIDADES EXTRAÍDAS SÃO ARMAZENADAS

### Estrutura de Armazenamento

As entidades são armazenadas em **3 locais**:

#### 3.1 Tabela `extractions` (Primary)
- **Campo**: `llm_result.entity_extraction`
- **Estrutura**:
  ```json
  {
    "llm_result": {
      "entity_extraction": {
        "entities": [
          {
            "id": "entity_1234567890_abc123",
            "document_id": "doc-uuid",
            "type": "PERSON|ORGANIZATION|LOCATION|DATE|MONEY|CPF|RG|CNPJ|EMAIL|PHONE|ADDRESS|PROPERTY_REGISTRY|RELATIONSHIP|DOCUMENT_NUMBER|OTHER",
            "value": "John Doe",
            "confidence": 0.95,
            "context": "contextual text snippet",
            "normalized_value": "john doe",
            "position": {
              "page": 1,
              "bounding_box": {x1, y1, x2, y2}
            }
          }
        ],
        "document_id": "doc-uuid",
        "processing_time_ms": 1234,
        "model_used": "gemini-3-flash-preview"
      }
    }
  }
  ```

#### 3.2 Tabela `documents` (Metadados)
- **Campos**:
  ```json
  {
    "metadata": {
      "entity_count": 42,
      "entity_extraction_date": "2025-12-25T10:30:00Z"
    }
  }
  ```

#### 3.3 Dedução: Tabela `evidence` (Relacionamento)
- Embora não haja criação explícita de registros de evidence no `entityExtraction.ts`, a arquitetura menciona em `CLAUDE.md`:
  > "evidence: Links every extracted field back to document/page/bounding box"
- Isso é provavelmente criado em jobs subsequentes (entity_resolution, consensus, draft)

### Processamento Prévio (Linhas 355-362)

```typescript
// 5. Post-processing: deduplicate and filter
const deduplicatedEntities = deduplicateEntities(allEntities)
const filteredEntities = filterByConfidence(deduplicatedEntities, MIN_CONFIDENCE_THRESHOLD)
  // MIN_CONFIDENCE_THRESHOLD = 0.5
```

### Campos de Entidade (Linhas 186-194)

```typescript
return parsed
  .map((entity: Record<string, unknown>) => ({
    id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    document_id: documentId,
    type: entity.type as EntityType,
    value: String(entity.value),
    confidence: typeof entity.confidence === 'number' ? Math.min(Math.max(entity.confidence, 0), 1) : 0.7,
    context: entity.context ? String(entity.context).substring(0, 100) : undefined,
    normalized_value: entity.normalized_value ? String(entity.normalized_value) : undefined,
  }))
```

---

## 4. TRIGGER AUTOMÁTICO - ANÁLISE E RECOMENDAÇÃO

### Problema Identificado

Não existe trigger automático para `entity_resolution` após `entity_extraction`.

**Verificação:**
- `entityExtraction.ts`: Apenas retorna status (sem criar jobs)
- `index.ts` (worker): Polling simples, sem orquestração entre jobs
- `bulkProcessingService.ts`: Só cria jobs OCR inicialmente
- `supabase.ts`: `createProcessingJob()` é função manual

### Pipeline Esperado (conforme CLAUDE.md)

```
OCR → Extraction → Consensus → Entity_Resolution → Draft
```

**Status atual:** Cada job é criado manualmente, não há encadeamento automático.

---

## 5. ONDE ADICIONAR O TRIGGER AUTOMÁTICO

### Opção A: Worker-Side Orchestration (RECOMENDADO)

Adicionar lógica em `worker/src/index.ts` após job completado:

**Arquivo**: `worker/src/index.ts` (linhas 112-124)

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

  // NOVO: Trigger próximo job baseado em tipo completado
  await triggerNextJob(supabase, job, result)

  console.log(`Job ${job.id} completed successfully`)
} catch (jobError) {
  // ...
}
```

Implementar função de orquestração:

```typescript
async function triggerNextJob(
  supabase: SupabaseClient,
  completedJob: ProcessingJob,
  result: Record<string, unknown>
): Promise<void> {
  const jobTypeSequence: Record<string, string> = {
    'ocr': 'extraction',
    'extraction': 'consensus',
    'consensus': 'entity_resolution',
    'entity_resolution': 'draft',
    'entity_extraction': 'entity_resolution',  // <-- Para entity_extraction
    'draft': null, // No next job
  }

  const nextJobType = jobTypeSequence[completedJob.job_type]

  if (nextJobType && completedJob.document_id) {
    console.log(`Triggering ${nextJobType} job for document ${completedJob.document_id}`)

    const { error } = await supabase
      .from('processing_jobs')
      .insert({
        case_id: completedJob.case_id,
        document_id: completedJob.document_id,
        job_type: nextJobType,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      })

    if (error) {
      console.error(`Failed to create ${nextJobType} job:`, error)
    }
  }
}
```

### Opção B: Database Triggers (PostgreSQL)

Adicionar trigger no Supabase que cria novo job quando anterior completa:

```sql
CREATE FUNCTION trigger_next_job()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO processing_jobs (
      case_id,
      document_id,
      job_type,
      status,
      attempts,
      max_attempts
    ) VALUES (
      NEW.case_id,
      NEW.document_id,
      CASE NEW.job_type
        WHEN 'ocr' THEN 'extraction'
        WHEN 'extraction' THEN 'consensus'
        WHEN 'consensus' THEN 'entity_resolution'
        WHEN 'entity_resolution' THEN 'draft'
        WHEN 'entity_extraction' THEN 'entity_resolution'
        ELSE NULL
      END,
      'pending',
      0,
      3
    ) WHERE CASE NEW.job_type
      WHEN 'ocr' THEN 'extraction'
      WHEN 'extraction' THEN 'consensus'
      WHEN 'consensus' THEN 'entity_resolution'
      WHEN 'entity_resolution' THEN 'draft'
      WHEN 'entity_extraction' THEN 'entity_resolution'
      ELSE NULL
    END IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER processing_job_orchestration
AFTER UPDATE ON processing_jobs
FOR EACH ROW
EXECUTE FUNCTION trigger_next_job();
```

### Opção C: Frontend-Triggered (Menos Ideal)

Usar React Query para monitorar jobs e criar próximo:

```typescript
// Em um hook customizado
const { data: jobs } = useQuery({
  queryKey: ['processing-jobs', caseId],
  queryFn: () => fetchProcessingJobs(caseId),
  refetchInterval: 2000,
})

useEffect(() => {
  const lastJob = jobs?.[0]
  if (lastJob?.status === 'completed' && !hasTriggeredNext(lastJob)) {
    const nextJobType = getNextJobType(lastJob.job_type)
    if (nextJobType) {
      createProcessingJob(caseId, lastJob.document_id, nextJobType)
    }
  }
}, [jobs])
```

---

## 6. IMPACTO DA MUDANÇA

### Inserção Recomendada

**Arquivo**: `worker/src/index.ts`
**Localização**: Após linha 124 (após job completado)
**Escopo**: Adicionar função `triggerNextJob()` + chamada em `pollForJobs()`

### Testes Necessários

1. Verificar se entity_resolution recebe corretamente dados de entity_extraction
2. Verificar se consensus recebe dados corretamente
3. Testar falha de job e não criar próximo job
4. Testar retry de job e não duplicar próximo job

### Migração Existente

Se houver jobs entity_extraction já "stuck", criar função de recuperação:

```typescript
export async function recoverStuckEntityExtractionJobs(supabase: SupabaseClient) {
  // Encontrar entity_extraction jobs que completaram sem trigger entity_resolution
  const { data: completedJobs } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('job_type', 'entity_extraction')
    .eq('status', 'completed')
    .is('next_job_id', null) // Campo a adicionar, ou checar via query

  // Criar entity_resolution jobs para cada um
  for (const job of completedJobs || []) {
    await createNextJob(supabase, job)
  }
}
```

---

## 7. RESUMO DAS DESCOBERTAS

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| **Entity extraction completa** | OK | Armazena em `extractions.llm_result.entity_extraction` |
| **Trigger para entity_resolution** | NÃO EXISTE | Sem automação atualmente |
| **Armazenamento de entidades** | OK | 3 locais: `extractions`, `documents.metadata`, `evidence` (implícito) |
| **Recomendação** | Opção A | Implementar `triggerNextJob()` em `worker/src/index.ts` |
| **Prioridade** | Alta | Bloqueia fluxo de processamento automático |

---

## 8. REFERÊNCIAS DE CÓDIGO

### Arquivos-chave analisados:
1. `worker/src/jobs/entityExtraction.ts` - Pipeline de extração (425 linhas)
2. `worker/src/jobs/processor.ts` - Roteador de jobs (32 linhas)
3. `worker/src/index.ts` - Worker polling loop (198 linhas)
4. `src/lib/supabase.ts` - API de jobs do frontend (296 linhas)
5. `src/services/bulkProcessingService.ts` - Upload em batch (681 linhas)

### Localização dos pontos de inserção:
- **Worker orchestration**: `worker/src/index.ts:124` ✓
- **Database trigger**: Supabase migration file
- **Frontend monitoring**: React Query hook (alternativa)

