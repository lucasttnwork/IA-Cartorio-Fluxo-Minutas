# Configuracao do Google Document AI Processor

Este guia explica como criar e configurar um processor do Google Document AI para o sistema Minuta Canvas.

## Pre-requisitos

1. Conta Google Cloud com billing ativado
2. Projeto criado: `ia-cartorio-fluxo-minutas`
3. Arquivo de credenciais JSON (service account)

## Passo 1: Acessar o Console do Google Cloud

1. Acesse: https://console.cloud.google.com
2. Selecione o projeto: `ia-cartorio-fluxo-minutas`
3. No menu lateral, navegue para: **AI Solutions > Document AI**

Ou acesse diretamente:
```
https://console.cloud.google.com/ai/document-ai?project=ia-cartorio-fluxo-minutas
```

## Passo 2: Habilitar a API Document AI

Se ainda nao estiver habilitada:

1. Clique em "Enable Document AI API"
2. Aguarde a ativacao (alguns segundos)

## Passo 3: Criar o Processor

1. Clique em **"Create Processor"**
2. Na lista de processors, selecione **"Document OCR"**
   - Este processor extrai texto de documentos com alta precisao
   - Suporta PDFs, imagens (JPG, PNG), e TIFF
3. Configure:
   - **Nome**: `minuta-canvas-ocr`
   - **Regiao**: `us` (US - recomendado para menor latencia)
4. Clique em **"Create"**

## Passo 4: Obter o Processor ID

Apos criar o processor:

1. Na pagina do processor, localize o **Processor ID**
   - Formato: numeros separados por ponto, ex: `9cf426aa8d961066`
   - Fica visivel no topo da pagina ou na URL

2. O caminho completo do processor sera:
   ```
   projects/ia-cartorio-fluxo-minutas/locations/us/processors/SEU_PROCESSOR_ID
   ```

## Passo 5: Configurar as Variaveis de Ambiente

No arquivo `worker/.env`, configure:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=ia-cartorio-fluxo-minutas
GOOGLE_CLOUD_PROCESSOR_ID=SEU_PROCESSOR_ID_AQUI
GOOGLE_CLOUD_LOCATION=us
GOOGLE_APPLICATION_CREDENTIALS=../credentials/ia-cartorio-fluxo-minutas-XXXXXX.json
```

### Alternativas de Nomenclatura

O sistema tambem aceita:
```env
GOOGLE_PROJECT_ID=ia-cartorio-fluxo-minutas
DOCUMENT_AI_PROCESSOR_ID=SEU_PROCESSOR_ID_AQUI
DOCUMENT_AI_LOCATION=us
```

## Passo 6: Verificar Credenciais

Certifique-se que o arquivo de credenciais (service account JSON) existe e tem as permissoes:

1. **Document AI API User** (`roles/documentai.apiUser`)
2. **Storage Object Viewer** (`roles/storage.objectViewer`) - para acessar arquivos no bucket

### Verificar via gcloud CLI

```bash
# Listar processors disponiveis
gcloud ai document-processors list --project=ia-cartorio-fluxo-minutas --location=us

# Testar processamento de um documento
gcloud ai document-processors process-document \
  --project=ia-cartorio-fluxo-minutas \
  --location=us \
  --processor=SEU_PROCESSOR_ID \
  --input-document=gs://seu-bucket/documento.pdf
```

## Passo 7: Testar a Configuracao

1. Inicie o worker:
   ```bash
   cd worker
   npm run dev
   ```

2. Verifique os logs:
   - Deve mostrar: `Document AI: enabled`
   - NAO deve mostrar: `Document AI: disabled`

3. Se mostrar erro de processor nao encontrado:
   - Verifique se o ID esta correto
   - Verifique se a regiao (location) esta correta
   - Verifique se o processor foi criado com sucesso

## Solucao de Problemas

### Erro: "Processor with id 'XXX' not found"

1. Verifique se o processor foi criado no projeto correto
2. Verifique se a regiao esta correta (us, eu, etc.)
3. Recrie o processor se necessario

### Erro: "Permission denied"

1. Verifique as permissoes da service account
2. Adicione a role `Document AI API User`
3. Aguarde alguns minutos para propagacao

### Erro: "API not enabled"

```bash
gcloud services enable documentai.googleapis.com --project=ia-cartorio-fluxo-minutas
```

## Custos

O Document AI cobra por pagina processada:

| Tipo | Custo (USD) |
|------|-------------|
| Primeiras 1000 paginas/mes | Gratis |
| Paginas adicionais | ~$0.0015/pagina |

Para projetos de teste, o tier gratuito e suficiente.

## Referencias

- [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Pricing](https://cloud.google.com/document-ai/pricing)
- [API Reference](https://cloud.google.com/document-ai/docs/reference/rest)
