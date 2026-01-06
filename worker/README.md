# Minuta Canvas Worker

Worker de processamento em background para o Minuta Canvas. Processa jobs de OCR, extração de entidades e geração de minutas com suporte a **10+ processos simultâneos**.

## Início Rápido

```bash
# Instalar dependências (primeira vez)
npm install

# Iniciar o worker em modo de desenvolvimento
npm run dev

# Ou em modo de produção
npm run build
npm run start
```

## Arquitetura Escalável

O worker foi projetado para processar múltiplos jobs em paralelo de forma eficiente e resiliente:

### Características Principais

- **Processamento Paralelo**: Processa até 10 jobs simultaneamente (configurável via `MAX_CONCURRENT_JOBS`)
- **Controle de Concorrência**: Usa Semaphore para garantir que o limite de jobs seja respeitado
- **Timeout de Jobs**: Jobs que excedem o tempo limite são automaticamente marcados como falhos
- **Recuperação de Zombies**: Jobs travados em "processing" são recuperados automaticamente
- **Realtime + Polling Híbrido**: Detecta novos jobs instantaneamente via Realtime, com fallback de polling
- **Métricas Detalhadas**: Endpoint `/metrics` com estatísticas de performance
- **Graceful Shutdown**: Aguarda jobs ativos antes de encerrar

### Pipeline de Processamento

O worker monitora continuamente a tabela `processing_jobs` no Supabase e processa automaticamente:

1. **OCR** - Extração de texto usando Google Document AI
2. **Extraction** - Análise de documentos com Gemini AI
3. **Entity Extraction** - Identificação de pessoas e propriedades
4. **Entity Resolution** - Deduplicação e mesclagem de entidades
5. **Draft Generation** - Geração de minutas jurídicas

## Endpoints HTTP

### Health Check

```bash
curl http://localhost:3001/health
```

Resposta:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "activeJobs": 7,
  "maxConcurrentJobs": 10,
  "utilizationPercent": 70,
  "jobsProcessedLast60s": 45,
  "averageJobDurationMs": 8200,
  "successRate": 98,
  "zombieJobsRecovered": 2,
  "lastJobProcessedAt": "2025-12-26T12:00:00.000Z",
  "timestamp": "2025-12-26T12:01:00.000Z",
  "environment": "production",
  "config": {
    "jobTimeoutMs": 300000,
    "zombieThresholdMs": 120000,
    "autoRecoveryEnabled": true,
    "activePollIntervalMs": 5000
  }
}
```

### Metrics

```bash
curl http://localhost:3001/metrics
```

Resposta:
```json
{
  "jobsProcessedLast60s": 45,
  "averageJobDurationMs": 8200,
  "successRate": 98,
  "jobsByType": {
    "ocr": 15,
    "extraction": 15,
    "entity_resolution": 10,
    "draft": 5
  },
  "zombieJobsRecovered": 2,
  "lastJobProcessedAt": "2025-12-26T12:00:00.000Z"
}
```

## Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

#### Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase |
| `GOOGLE_AI_API_KEY` | API key do Google AI (Gemini) |
| `GOOGLE_CLOUD_PROJECT_ID` | ID do projeto Google Cloud |
| `GOOGLE_CLOUD_PROCESSOR_ID` | ID do processador Document AI |

#### Worker (Opcionais)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MAX_CONCURRENT_JOBS` | 5 | Número máximo de jobs simultâneos |
| `JOB_TIMEOUT` | 300000 | Timeout por job em ms (5 min) |
| `ZOMBIE_JOB_THRESHOLD_MS` | 120000 | Tempo para considerar job zombie (2 min) |
| `ENABLE_AUTO_RECOVERY` | true | Habilita recuperação automática de zombies |
| `ACTIVE_POLL_INTERVAL_MS` | 5000 | Intervalo de polling ativo (5 seg) |
| `WORKER_HEALTH_PORT` | 3001 | Porta do servidor de health check |

### Configuração para Alta Carga

Para suportar 10+ usuários simultâneos:

```env
# Recomendado para produção
MAX_CONCURRENT_JOBS=10
JOB_TIMEOUT=300000
ZOMBIE_JOB_THRESHOLD_MS=120000
ENABLE_AUTO_RECOVERY=true
ACTIVE_POLL_INTERVAL_MS=5000
```

### Múltiplos Workers

Para escalar horizontalmente, execute múltiplas instâncias do worker:

```bash
# Terminal 1
WORKER_HEALTH_PORT=3001 npm run start

# Terminal 2
WORKER_HEALTH_PORT=3002 npm run start

# Terminal 3
WORKER_HEALTH_PORT=3003 npm run start
```

Cada worker irá:
- Competir por jobs pendentes (sem conflitos via status locking)
- Processar até `MAX_CONCURRENT_JOBS` em paralelo
- Recuperar zombies deixados por outros workers

## Troubleshooting

### Jobs travados em "processing"

Os jobs são automaticamente recuperados após `ZOMBIE_JOB_THRESHOLD_MS` (padrão: 2 minutos). Para recuperação manual:

```sql
UPDATE processing_jobs
SET status = 'pending', started_at = NULL
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '5 minutes';
```

### Worker não processa jobs

1. Verifique se o worker está rodando: `curl http://localhost:3001/health`
2. Verifique os logs do worker no terminal
3. Verifique a conexão com o Supabase
4. Verifique se há jobs pendentes:
   ```sql
   SELECT status, count(*) FROM processing_jobs GROUP BY status;
   ```

### Porta 3001 em uso

Altere via variável `WORKER_HEALTH_PORT`:
```bash
WORKER_HEALTH_PORT=3002 npm run dev
```

### Timeout de jobs

Se jobs estão falhando por timeout:
1. Aumente `JOB_TIMEOUT` (máximo recomendado: 10 minutos)
2. Verifique a latência das APIs Google (Document AI, Gemini)
3. Otimize o tamanho dos documentos sendo processados

## Logs

O worker exibe logs detalhados no console:

| Emoji | Significado |
|-------|-------------|
| `📨` | Novo job detectado |
| `📋` | Jobs pendentes encontrados |
| `🔄` | Polling ativo / retry |
| `✅` | Job completado |
| `❌` | Job falhou |
| `⚠️` | Aviso (slots cheios, etc.) |
| `💀` | Job exauriu tentativas |
| `⏳` | Retry agendado |
| `🧟` | Zombie job recuperado |
| `🛑` | Shutdown iniciado |
| `👋` | Shutdown completo |

## Arquitetura

```
worker/
├── src/
│   ├── index.ts              # Entrada principal + health check + loop principal
│   ├── config/
│   │   └── environment.ts    # Configuração e validação de ambiente
│   ├── utils/
│   │   ├── Semaphore.ts      # Controle de concorrência
│   │   └── WorkerMetrics.ts  # Métricas de performance
│   ├── jobs/
│   │   ├── processor.ts      # Roteador de jobs
│   │   ├── ocr.ts            # Job de OCR (Document AI)
│   │   ├── extraction.ts     # Job de extração (Gemini)
│   │   ├── entityExtraction.ts   # Job de extração de entidades
│   │   ├── entityResolution.ts   # Job de resolução de entidades
│   │   └── draft.ts          # Job de geração de minutas
│   └── services/             # Serviços auxiliares
├── .env.example              # Template de configuração
└── package.json
```

## Desenvolvimento

```bash
# Watch mode (reinicia automaticamente ao alterar código)
npm run dev

# Compilar TypeScript
npm run build

# Executar versão compilada
npm run start
```

## FAQ

**P: O worker precisa estar sempre rodando?**
R: Sim, para desenvolvimento local. Em produção, use um orquestrador (Docker, Kubernetes, PM2, etc.)

**P: Posso rodar múltiplos workers?**
R: Sim! Cada worker compete por jobs. Use health check ports diferentes para cada instância.

**P: Como debugar um job específico?**
R: Ative `DEBUG=true` no `.env` e verifique os logs detalhados.

**P: Qual o throughput esperado?**
R: Com `MAX_CONCURRENT_JOBS=10`:
- OCR: ~7.6s por documento
- Entity Extraction: ~11s por documento
- Throughput: ~50-60 documentos/minuto com 10 workers paralelos

**P: O frontend funciona sem o worker?**
R: O frontend carrega, mas jobs de processamento ficarão pendentes até o worker iniciar.
