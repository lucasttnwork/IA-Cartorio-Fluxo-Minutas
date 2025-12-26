# Setup Supabase Production - Guia Completo

Este guia fornece instruções passo a passo para migrar do Supabase local para o Supabase em produção (cloud).

## Status Atual ✅

- [x] Credenciais do Supabase configuradas no `.env`
- [x] Migrações consolidadas em arquivo único
- [x] Scripts NPM criados para gerenciar o banco de dados

## Passo 1: Aplicar Migrações ao Banco de Dados

### Opção A: Via Supabase Dashboard (Recomendado)

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new
   ```

2. **Abra o arquivo consolidado:**
   ```
   supabase/consolidated-migration.sql
   ```

3. **Copie todo o conteúdo** do arquivo e cole no SQL Editor

4. **Clique em "Run"** para executar todas as migrações

5. **Verifique se não houve erros** no console de saída

### Opção B: Via linha de comando (Requer PostgreSQL Client)

Se você tiver o `psql` instalado:

```bash
# Obtenha a connection string do Supabase Dashboard
# Em: Settings > Database > Connection String

# Execute:
psql "sua-connection-string-aqui" -f supabase/consolidated-migration.sql
```

## Passo 2: Verificar Migrações Aplicadas

No Supabase Dashboard, verifique se as seguintes tabelas foram criadas:

- `organizations`
- `users`
- `cases`
- `documents`
- `processing_jobs`
- `people`
- `properties`
- `graph_edges`
- `evidence`
- `operations_log`
- `merge_suggestions`

**URL para verificar:**
```
https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/editor
```

## Passo 3: Configurar Storage Buckets

O Supabase Storage precisa de buckets configurados:

1. **Acesse Storage:**
   ```
   https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/storage/buckets
   ```

2. **Crie o bucket `documents`:**
   - Nome: `documents`
   - Público: ❌ (privado)
   - File size limit: 50MB

3. **Configure as políticas de RLS** (Row Level Security):
   - As políticas já estão definidas na migração `00006_production_security.sql`
   - Verifique se foram aplicadas corretamente

## Passo 4: Gerar Tipos TypeScript

Execute o comando para gerar os tipos TypeScript atualizados:

```bash
npm run generate-types
```

Este comando irá:
- Conectar ao banco de dados remoto
- Gerar os tipos baseados no schema atual
- Salvar em `src/types/database.ts`

## Passo 5: Configurar Variáveis de Ambiente do Worker

O worker também precisa usar o Supabase real:

1. **Verifique se o `.env` na raiz já está correto** (já está! ✅)

2. **Copie as mesmas variáveis para o worker:**
   ```bash
   cd worker
   cp ../.env .env
   ```

## Passo 6: Testar Conexão

### Teste Frontend

```bash
npm run dev
```

Acesse `http://localhost:5173` e:
1. Faça login com as credenciais de teste
2. Crie um novo caso
3. Verifique se os dados estão sendo salvos no Supabase remoto

### Teste Worker

```bash
cd worker
npm run dev
```

O worker deve:
1. Conectar ao banco de dados remoto
2. Começar a polling de jobs
3. Processar documentos quando disponíveis

## Passo 7: Configurar Autenticação

Configure as URLs de callback no Supabase Auth:

1. **Acesse Authentication > URL Configuration:**
   ```
   https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/auth/url-configuration
   ```

2. **Configure:**
   - Site URL: `http://localhost:5173` (desenvolvimento)
   - Redirect URLs: Adicione `http://localhost:5173/**`

3. **Para produção**, atualize com sua URL real:
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/**`

## Passo 8: Criar Usuário de Teste

Execute no SQL Editor:

```sql
-- Inserir organização de teste
INSERT INTO organizations (id, name, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Cartório Modelo',
  '{}'::jsonb
);

-- Após criar usuário via Supabase Auth, link à organização:
-- (Substitua USER_ID pelo ID do usuário criado)
INSERT INTO users (id, organization_id, role, full_name)
VALUES (
  'USER_ID_AQUI',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'Usuário Teste'
);
```

Ou crie via interface:
```
https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/auth/users
```

## Verificação Final ✅

Marque os itens concluídos:

- [ ] Migrações aplicadas sem erros
- [ ] Tabelas criadas e visíveis no Dashboard
- [ ] Bucket `documents` criado no Storage
- [ ] Tipos TypeScript gerados (`src/types/database.ts` atualizado)
- [ ] Variáveis de ambiente configuradas (raiz e worker)
- [ ] Frontend conecta ao Supabase remoto
- [ ] Worker conecta ao Supabase remoto
- [ ] Autenticação funcionando
- [ ] Usuário de teste criado

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se as migrações foram aplicadas corretamente
- Confira se não há erros no SQL Editor

### Erro: "permission denied"
- Verifique as políticas RLS
- Confirme que o `SUPABASE_SERVICE_ROLE_KEY` está correto no worker

### Erro: "Invalid API key"
- Verifique se `VITE_SUPABASE_ANON_KEY` está correto
- Regenere as chaves se necessário no Dashboard

### Worker não processa jobs
- Verifique os logs do worker
- Confirme que as credenciais do Google Cloud estão corretas
- Verifique se o `GEMINI_API_KEY` está válido

## Scripts Úteis

```bash
# Consolidar migrações em arquivo único
npm run consolidate-migrations

# Gerar tipos TypeScript do banco de dados
npm run generate-types

# Verificar diferenças no schema (requer configuração)
npm run db:status

# Rodar frontend em desenvolvimento
npm run dev

# Rodar worker em desenvolvimento
cd worker && npm run dev
```

## Próximos Passos

Após concluir o setup:

1. **Remover Supabase local** (opcional):
   ```bash
   npx supabase stop
   ```

2. **Configurar CI/CD** para deploys automáticos

3. **Configurar backups** no Supabase Dashboard

4. **Monitorar uso** e custos no Dashboard

5. **Deploy em produção** (Vercel, Netlify, etc.)

## Suporte

- Documentação Supabase: https://supabase.com/docs
- Documentação do Projeto: Ver `CLAUDE.md`
- Issues: Criar issue no repositório

---

**Data de criação:** 2025-12-25
**Última atualização:** 2025-12-25
