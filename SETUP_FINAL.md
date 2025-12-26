# 🚀 Setup Final - Minuta Canvas Supabase

## ✅ Status Atual da Migração

**Data:** 2025-12-25
**Projeto:** kllcbgoqtxedlfbkxpfo
**Status:** 95% Completo - Falta apenas criar a tabela `users`

### Tabelas Verificadas

| Tabela | Status |
|--------|--------|
| organizations | ✅ Criada |
| cases | ✅ Criada |
| documents | ✅ Criada |
| people | ✅ Criada |
| properties | ✅ Criada |
| graph_edges | ✅ Criada |
| processing_jobs | ✅ Criada |
| evidence | ✅ Criada |
| operations_log | ✅ Criada |
| merge_suggestions | ✅ Criada |
| chat_sessions | ✅ Criada |
| chat_messages | ✅ Criada |
| **users** | ⚠️  **PRECISA SER CRIADA** |

---

## 🔧 Passo Final: Criar Tabela Users

A tabela `users` não foi criada durante as migrações anteriores. Siga estes passos:

### Opção 1: Via SQL Editor (Recomendado)

1. **Abra o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new
   ```

2. **Copie e cole o conteúdo do arquivo:**
   ```
   scripts/create-users-table.sql
   ```

3. **Clique em "Run"** para executar o SQL

4. **Verifique o resultado** - você deve ver:
   - "users table created successfully"
   - Lista das colunas da tabela

### Opção 2: Reaplicar Todas as Migrações

Se preferir, você pode reaplicar todas as migrações:

1. **Abra o SQL Editor:**
   ```
   https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new
   ```

2. **Copie e cole o conteúdo:**
   ```
   supabase/consolidated-migration.sql
   ```

3. **Execute** - isso recriará todas as tabelas (incluindo users)

---

## 🧪 Verificação Pós-Criação

Depois de criar a tabela users, execute:

```bash
npm run test-connection
```

**Resultado esperado:**
```
✅ Connection successful!
📊 Cases table exists (0 rows)

🔍 Checking other tables...
   ✅ documents: OK
   ✅ people: OK
   ✅ properties: OK
   ✅ processing_jobs: OK
   ✅ graph_edges: OK

✨ Database is ready to use!
```

Ou execute o script específico:

```bash
node scripts/verify-users-table.js
```

**Resultado esperado:**
```
✅ users table exists
📊 Row count: 0
💡 Table is empty - no users yet
```

---

## 📦 Configuração Completa

### Variáveis de Ambiente

#### Frontend (`.env` na raiz)
```env
VITE_SUPABASE_URL=https://kllcbgoqtxedlfbkxpfo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_tAIEYBl2iomL3llx3dUQrA_RGkOTFOJ
SUPABASE_SERVICE_ROLE_KEY=sb_secret_-6dwOTEOWBLlhrOfHmf9jQ_RKoNiDMF
SUPABASE_ACCESS_TOKEN=sbp_1b2f1c81b0a82ca33e5bbaacf9923146a3fe9bb8
```

#### Worker (`worker/.env`)
```env
SUPABASE_URL=https://kllcbgoqtxedlfbkxpfo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_-6dwOTEOWBLlhrOfHmf9jQ_RKoNiDMF
GEMINI_API_KEY=AIzaSyCaMcWubq9quWV0aTJwS_pmfqjzWG6xyKc
```

### Migrações

| Migração | Status |
|----------|--------|
| 00001_initial_schema.sql | ✅ Aplicada |
| 00002_add_entity_extraction_job_type.sql | ✅ Aplicada |
| 00003_add_merge_suggestions.sql | ✅ Aplicada |
| 00004_add_geocoding_fields.sql | ✅ Aplicada |
| 00005_add_retry_tracking.sql | ✅ Aplicada |
| 00006_production_security.sql | ✅ Aplicada |

---

## 🎯 Próximos Passos

### 1. Após criar a tabela users

```bash
# Verificar conexão
npm run test-connection

# Verificar users table especificamente
node scripts/verify-users-table.js

# Gerar tipos TypeScript (opcional)
export SUPABASE_ACCESS_TOKEN=sbp_1b2f1c81b0a82ca33e5bbaacf9923146a3fe9bb8
npm run generate-types
```

### 2. Criar usuário administrativo

**Via Supabase Dashboard:**

1. Acesse: https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/auth/users

2. Clique em "Add User"

3. Crie um usuário com email/senha

4. Copie o User ID

5. Execute no SQL Editor:
   ```sql
   -- Criar organização de teste
   INSERT INTO organizations (id, name, settings)
   VALUES (
     '00000000-0000-0000-0000-000000000001',
     'Cartório Modelo',
     '{}'::jsonb
   );

   -- Linkar usuário à organização
   INSERT INTO users (id, organization_id, role, full_name)
   VALUES (
     'USER_ID_AQUI',  -- Substitua pelo ID do usuário criado
     '00000000-0000-0000-0000-000000000001',
     'admin',
     'Administrador'
   );
   ```

### 3. Testar a aplicação

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Worker
cd worker
npm run dev
```

Acesse: http://localhost:5173

### 4. Configurar Storage

1. Acesse: https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/storage/buckets

2. Crie bucket `documents`:
   - Nome: `documents`
   - Público: ❌ (privado)
   - File size limit: 50MB

3. Configure políticas RLS conforme necessário

---

## 📋 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Test Connection | `npm run test-connection` | Testa conexão com Supabase |
| Consolidate Migrations | `npm run consolidate-migrations` | Gera arquivo único de migrações |
| Generate Types | `npm run generate-types` | Gera tipos TypeScript |
| Check Schema | `node scripts/check-schema.js` | Lista todas as tabelas |
| Verify Users Table | `node scripts/verify-users-table.js` | Verifica tabela users |

---

## 🐛 Troubleshooting

### Problema: users table não foi criada
**Solução:** Execute `scripts/create-users-table.sql` no SQL Editor

### Problema: PGRST205 error
**Causa:** Tabela não existe no schema
**Solução:** Execute `scripts/create-users-table.sql`

### Problema: Permission denied
**Causa:** RLS está bloqueando acesso
**Solução:** Use service_role key ou ajuste políticas RLS

### Problema: Types não são gerados
**Causa:** Precisa de SUPABASE_ACCESS_TOKEN
**Solução:** Configure a variável no .env ou use os tipos existentes

---

## ✅ Checklist Final

Marque quando completar:

- [x] Supabase CLI configurado (via npx)
- [x] Projeto linkado (project-ref: kllcbgoqtxedlfbkxpfo)
- [x] Versão do PostgreSQL atualizada (17)
- [x] Histórico de migrações sincronizado
- [x] Variáveis de ambiente configuradas (frontend + worker)
- [x] 12/13 tabelas criadas e funcionando
- [ ] **Tabela users criada** (execute `scripts/create-users-table.sql`)
- [ ] Bucket documents criado no Storage
- [ ] Usuário admin criado e linkado
- [ ] Frontend rodando e conectando
- [ ] Worker rodando e processando

---

## 📞 Recursos

- **Dashboard:** https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo
- **SQL Editor:** https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new
- **Auth Users:** https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/auth/users
- **Storage:** https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/storage/buckets
- **Docs Supabase:** https://supabase.com/docs
- **Docs do Projeto:** `CLAUDE.md`

---

## 🎉 Status Após Completar

```
✅ Migração 100% completa
✅ Todas as 13 tabelas criadas
✅ RLS configurado e funcionando
✅ Frontend conectado ao Supabase real
✅ Worker conectado ao Supabase real
✅ Tipos TypeScript atualizados
✅ Scripts de gerenciamento prontos

🚀 Projeto pronto para desenvolvimento e produção!
```

---

**Última atualização:** 2025-12-25 12:15 BRT
