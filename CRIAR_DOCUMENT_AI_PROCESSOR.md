# 🔧 Como Criar um Document AI Processor

O processor do Document AI é necessário para fazer OCR de documentos (CNH, RG, Escrituras, etc.).

---

## ⚠️ SITUAÇÃO ATUAL

- ✅ Service Account JSON: Configurado
- ✅ Gemini API: Funcionando
- ❌ **Document AI Processor: NÃO EXISTE**

O ID `9cf426aa8d961066` que está no `.env` não foi encontrado no projeto.

---

## 📝 PASSOS PARA CRIAR O PROCESSOR

### **1. Acessar o Google Cloud Console**

1. Abra: https://console.cloud.google.com/ai/document-ai/processors
2. **Selecione o projeto**: `ia-cartorio-fluxo-minutas`
3. **Selecione a região**: `us` (United States)

### **2. Habilitar a API (se necessário)**

Se aparecer uma mensagem para habilitar a API:
1. Clique em **ENABLE API**
2. Aguarde alguns segundos

### **3. Criar um Novo Processor**

1. Clique no botão **CREATE PROCESSOR** ou **+ CREATE**

2. **Escolha o tipo de processor:**

   **Opção A (Recomendada): Document OCR**
   - Nome: `Document OCR`
   - Descrição: OCR de documentos gerais (CNH, RG, escrituras, etc.)
   - Melhor para documentos variados

   **Opção B: Form Parser**
   - Nome: `Form Parser`
   - Descrição: Análise de formulários estruturados
   - Melhor para documentos com layout fixo

   **Opção C: General Processor**
   - Nome: `General Processor`
   - Descrição: Processamento genérico de documentos
   - Mais flexível

3. **Configurações:**
   - **Processor name**: `minuta-canvas-ocr` (ou qualquer nome descritivo)
   - **Region**: Selecione `us` (United States)
   - **Type**: Escolha uma das opções acima

4. Clique em **CREATE**

### **4. Copiar o Processor ID**

Após criar:
1. O processor aparecerá na lista
2. Clique no processor criado
3. Na página de detalhes, você verá:
   ```
   Processor ID: abc123def456
   ```
4. **Copie esse ID**

### **5. Atualizar as Variáveis de Ambiente**

Atualize os arquivos `.env` e `worker/.env` com o novo ID:

**Arquivo: `.env` (raiz)**
```bash
DOCUMENT_AI_PROCESSOR_ID=abc123def456  # Substitua pelo ID copiado
DOCUMENT_AI_LOCATION=us
```

**Arquivo: `worker/.env`**
```bash
GOOGLE_CLOUD_PROCESSOR_ID=abc123def456  # Substitua pelo ID copiado
GOOGLE_CLOUD_LOCATION=us
```

---

## 🧪 TESTAR A CONFIGURAÇÃO

Após criar o processor e atualizar os `.env`:

```bash
cd worker
node check-document-ai.cjs
```

**Resultado esperado:**
```
✅ Encontrados 1 processor(s):

1. minuta-canvas-ocr
   ID: abc123def456
   Tipo: OCR_PROCESSOR
   Estado: ENABLED
```

Depois execute o teste completo:
```bash
npm run test:apis
```

**Resultado esperado:**
```
✅ Variáveis de Ambiente
✅ Service Account JSON
✅ Gemini API
✅ Document AI
```

---

## 💡 ALTERNATIVA: USAR SEM DOCUMENT AI (Temporário)

Se você quiser testar o sistema antes de configurar o Document AI:

1. **O worker vai funcionar**, mas:
   - ❌ Job de OCR vai falhar
   - ✅ Jobs do Gemini funcionarão (extraction, draft, chat)

2. **Documentos precisarão de classificação manual** ou:
   - Use o **pattern matching** (análise de keywords sem OCR)
   - Upload direto do tipo de documento

3. **Para iniciar neste modo**:
   ```bash
   cd worker
   npm run dev
   ```

   O worker vai iniciar com warning:
   ```
   ⚠️  Document AI não configurado - OCR desabilitado
   ```

---

## 🎯 CUSTOS DO DOCUMENT AI

### **Free Tier**
- **1000 páginas/mês GRÁTIS**
- Renovado mensalmente

### **Após Free Tier**
- **$1.50 por 1000 páginas**
- Uso típico: 500 docs × 3 pág = 1500 páginas/mês
- Custo estimado: **$2.25/mês**

---

## 🔒 PERMISSÕES NECESSÁRIAS

A service account já configurada precisa ter:
- ✅ **Document AI API User** (role: `roles/documentai.apiUser`)

Para verificar/adicionar:
1. Acesse: https://console.cloud.google.com/iam-admin/iam
2. Encontre: `minuta-canvas-worker@ia-cartorio-fluxo-minutas.iam.gserviceaccount.com`
3. Verifique se tem a role **Document AI API User**
4. Se não tiver, clique em **EDIT** → **ADD ANOTHER ROLE** → Selecione a role

---

## 🐛 TROUBLESHOOTING

### **Erro: "API not enabled"**
**Solução:**
1. Acesse: https://console.cloud.google.com/apis/library/documentai.googleapis.com
2. Clique **ENABLE**

### **Erro: "Permission denied"**
**Solução:**
1. Verifique que a service account tem role "Document AI API User"
2. Aguarde 1-2 minutos para propagação de permissões

### **Processor não aparece na lista**
**Solução:**
1. Verifique que está na região certa (us, eu, etc.)
2. Tente listar em outras regiões: `eu`, `asia-northeast1`

---

## ✅ CHECKLIST

- [ ] Acessar Google Cloud Console
- [ ] Selecionar projeto `ia-cartorio-fluxo-minutas`
- [ ] Habilitar Document AI API (se necessário)
- [ ] Criar processor (tipo: Document OCR)
- [ ] Copiar Processor ID
- [ ] Atualizar `.env` e `worker/.env`
- [ ] Executar `node check-document-ai.cjs`
- [ ] Executar `npm run test:apis`
- [ ] Verificar que todos os testes passam (✅ ✅ ✅ ✅)

---

**Próximo passo**: Após configurar, execute `npm run dev` no worker para iniciar o processamento!
