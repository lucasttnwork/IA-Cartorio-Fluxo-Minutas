# 🔧 Google Cloud Setup - Guia Completo

Este guia mostra como obter as credenciais necessárias para usar Document AI e Gemini API.

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### ✅ Já Configurado
- [x] GEMINI_API_KEY configurada
- [x] GOOGLE_PROJECT_ID: `ia-cartorio-fluxo-minutas`
- [x] DOCUMENT_AI_PROCESSOR_ID: `9cf426aa8d961066`
- [x] Variáveis de ambiente em `.env` e `worker/.env`
- [x] Dependências NPM instaladas

### ⚠️ Pendente
- [ ] **Service Account JSON** (crítico para Document AI OCR)
- [ ] Criar diretório `credentials/`
- [ ] Testar chamadas de API

---

## 1️⃣ OBTER SERVICE ACCOUNT JSON (Document AI)

### **Por que é necessário?**
O Google Document AI (OCR) usa autenticação via **Service Account**, diferente do Gemini que usa apenas uma API Key. Você precisa baixar um arquivo JSON com as credenciais.

### **Passos:**

#### **A. Acessar o Google Cloud Console**
1. Abra: https://console.cloud.google.com
2. Certifique-se de estar no projeto: **`ia-cartorio-fluxo-minutas`**
3. No menu lateral, vá em: **IAM & Admin** → **Service Accounts**

#### **B. Localizar ou Criar Service Account**
1. Procure por uma service account existente (nome pode ser `document-ai-sa` ou similar)
2. **Se não existir**, clique em **+ CREATE SERVICE ACCOUNT**:
   - **Nome**: `minuta-canvas-worker`
   - **ID**: `minuta-canvas-worker` (será gerado automaticamente)
   - **Descrição**: `Service account for Minuta Canvas worker to access Document AI`
   - Clique **CREATE AND CONTINUE**

#### **C. Conceder Permissões**
Na etapa de permissões, adicione as seguintes roles:
- ✅ **Document AI API User** (`roles/documentai.apiUser`)
- ✅ **Storage Object Viewer** (`roles/storage.objectViewer`) - se usar Google Cloud Storage

Clique **CONTINUE** → **DONE**

#### **D. Baixar Arquivo JSON**
1. Clique na service account criada/existente
2. Vá na aba **KEYS**
3. Clique **ADD KEY** → **Create new key**
4. Selecione tipo: **JSON**
5. Clique **CREATE**

**Importante**: O arquivo será baixado automaticamente. Ele tem um nome como:
```
ia-cartorio-fluxo-minutas-1234567890ab.json
```

#### **E. Renomear e Mover o Arquivo**

Renomeie o arquivo baixado para:
```
ia-cartorio-fluxo-minutas-7749530005bd.json
```

Ou mantenha o nome original e **atualize** as variáveis de ambiente:
```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=credentials/nome-do-arquivo-baixado.json

# worker/.env
GOOGLE_APPLICATION_CREDENTIALS=../credentials/nome-do-arquivo-baixado.json
```

---

## 2️⃣ CONFIGURAR O ARQUIVO NO PROJETO

### **A. Criar Diretório de Credenciais**

Execute no terminal:
```bash
mkdir credentials
```

Ou crie manualmente a pasta `credentials/` na raiz do projeto.

### **B. Mover o Arquivo JSON**

Mova o arquivo baixado para:
```
C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\Claude-Code-Projects\
IA-Cartório-Fluxo-Minutas\credentials\ia-cartorio-fluxo-minutas-7749530005bd.json
```

### **C. Verificar Permissões**

O arquivo JSON **NÃO DEVE SER COMMITADO** no Git. Verifique que o `.gitignore` contém:
```
credentials/
.env
.env.local
```

✅ **Já está configurado no projeto**

---

## 3️⃣ VERIFICAR CONFIGURAÇÃO DO DOCUMENT AI

### **A. Verificar Processor ID**

Seu processor ID atual: `9cf426aa8d961066`

Para confirmar que ele existe:
1. Acesse: https://console.cloud.google.com/ai/document-ai/processors
2. Selecione o projeto: `ia-cartorio-fluxo-minutas`
3. Verifique se há um processor com ID `9cf426aa8d961066`
4. Confirme a localização: **`us`** (Estados Unidos)

### **B. Tipos de Processor Suportados**
- ✅ **General Document Processor** (recomendado)
- ✅ **OCR Processor**
- ✅ **Form Parser**

### **C. Se o Processor Não Existir**

Crie um novo:
1. Clique **CREATE PROCESSOR**
2. Selecione: **Document OCR** (ou **Form Parser**)
3. Nome: `minuta-canvas-ocr`
4. Região: **us** (deve corresponder ao `DOCUMENT_AI_LOCATION`)
5. Clique **CREATE**
6. **Copie o Processor ID** e atualize as variáveis:
   ```bash
   DOCUMENT_AI_PROCESSOR_ID=novo-processor-id
   ```

---

## 4️⃣ VERIFICAR CONFIGURAÇÃO DO GEMINI

### **Status Atual**
✅ API Key configurada: `AIzaSyCaMcWubq9quWV0aTJwS_pmfqjzWG6xyKc`

### **Verificar se a Key Está Ativa**

Teste a API Key:
```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyCaMcWubq9quWV0aTJwS_pmfqjzWG6xyKc" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Resposta esperada:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{"text": "Hello! How can I help you today?"}]
      }
    }
  ]
}
```

Se retornar erro `403` ou `401`:
- API Key inválida ou desabilitada
- Gere nova key em: https://aistudio.google.com/app/apikey

---

## 5️⃣ HABILITAR APIs NO GOOGLE CLOUD

Certifique-se de que as seguintes APIs estão habilitadas no projeto `ia-cartorio-fluxo-minutas`:

1. **Document AI API**
   - https://console.cloud.google.com/apis/library/documentai.googleapis.com

2. **Cloud Storage API** (se usar GCS)
   - https://console.cloud.google.com/apis/library/storage-api.googleapis.com

**Como habilitar:**
- Acesse o link da API
- Clique em **ENABLE**

---

## 6️⃣ TESTAR A CONFIGURAÇÃO

### **A. Testar Document AI (OCR)**

Crie um script de teste:

```bash
# worker/test-document-ai.js
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
require('dotenv').config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION;
const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID;

async function testDocumentAI() {
  const client = new DocumentProcessorServiceClient();
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  console.log('Testing Document AI...');
  console.log('Processor:', name);
  console.log('Credentials:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

  try {
    // Teste simples: processar um documento vazio (vai falhar mas confirma autenticação)
    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: Buffer.from('Test').toString('base64'),
        mimeType: 'text/plain',
      },
    });
    console.log('✅ Document AI está funcionando!');
  } catch (error) {
    if (error.code === 7) {
      console.log('✅ Autenticação OK (erro esperado para conteúdo inválido)');
    } else if (error.code === 16) {
      console.log('❌ Falha na autenticação - verifique o arquivo JSON');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testDocumentAI();
```

Execute:
```bash
cd worker
node test-document-ai.js
```

### **B. Testar Gemini API**

```bash
# worker/test-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  console.log('Testing Gemini API...');

  try {
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    console.log('✅ Gemini API está funcionando!');
    console.log('Response:', response.text());
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testGemini();
```

Execute:
```bash
cd worker
node test-gemini.js
```

---

## 7️⃣ TROUBLESHOOTING

### **Erro: "Could not load the default credentials"**
**Causa**: Arquivo JSON não encontrado ou path incorreto

**Solução**:
1. Verifique que o arquivo existe em `credentials/`
2. Confirme que a variável `GOOGLE_APPLICATION_CREDENTIALS` está correta
3. Use path absoluto se necessário:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\Lucas\...\credentials\file.json
   ```

### **Erro: "Permission denied" ou "403 Forbidden"**
**Causa**: Service account sem permissões

**Solução**:
1. Vá em IAM & Admin → Service Accounts
2. Edite a service account
3. Adicione role: **Document AI API User**

### **Erro: "Processor not found"**
**Causa**: Processor ID incorreto ou em região diferente

**Solução**:
1. Acesse Document AI Console
2. Copie o Processor ID correto
3. Verifique que `DOCUMENT_AI_LOCATION` corresponde à região do processor

### **Erro: "API not enabled"**
**Causa**: Document AI API não habilitada

**Solução**:
1. Acesse: https://console.cloud.google.com/apis/library/documentai.googleapis.com
2. Clique **ENABLE**

---

## 8️⃣ ESTRUTURA FINAL DE ARQUIVOS

```
IA-Cartório-Fluxo-Minutas/
├── credentials/                                    # ⚠️ CRIAR ESTE DIRETÓRIO
│   └── ia-cartorio-fluxo-minutas-7749530005bd.json # ⚠️ BAIXAR DO GOOGLE CLOUD
├── .env                                            # ✅ Já existe
├── worker/
│   ├── .env                                        # ✅ Já existe
│   └── src/
│       ├── config/
│       │   └── environment.ts                      # ✅ Validação de env vars
│       └── jobs/
│           ├── ocr.ts                              # 🔴 Precisa do JSON
│           ├── extraction.ts                       # ✅ Usa apenas Gemini
│           └── draft.ts                            # ✅ Usa apenas Gemini
└── .gitignore                                      # ✅ credentials/ já ignorado
```

---

## 9️⃣ CUSTOS ESTIMADOS

### **Document AI (OCR)**
- **Preço**: $1.50 por 1000 páginas (primeiras 1000/mês grátis)
- **Uso estimado**: 500 docs/mês × 3 pág/doc = 1500 páginas
- **Custo**: ~$2.25/mês (após free tier)

### **Gemini API**
- **Flash (extraction)**: Grátis até 15 RPM
- **Pro (draft)**: Grátis até 2 RPM
- **Context Caching**: Reduz 90% dos tokens (economia significativa)

---

## 🎯 PRÓXIMOS PASSOS

1. [ ] Baixar arquivo JSON do Google Cloud Console
2. [ ] Criar diretório `credentials/`
3. [ ] Mover arquivo JSON para `credentials/`
4. [ ] Executar testes de Document AI e Gemini
5. [ ] Iniciar worker: `cd worker && npm run dev`
6. [ ] Fazer upload de documento teste no frontend
7. [ ] Monitorar logs do worker para verificar processamento

---

## 📞 RECURSOS ADICIONAIS

- **Document AI Console**: https://console.cloud.google.com/ai/document-ai
- **Google Cloud Console**: https://console.cloud.google.com
- **Gemini API Keys**: https://aistudio.google.com/app/apikey
- **Document AI Pricing**: https://cloud.google.com/document-ai/pricing
- **Gemini API Limits**: https://ai.google.dev/pricing

---

**Status**: ⚠️ **QUASE PRONTO** - Falta apenas o arquivo JSON do Service Account
