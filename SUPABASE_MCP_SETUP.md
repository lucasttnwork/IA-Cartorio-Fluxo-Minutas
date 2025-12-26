# Configuração do Supabase MCP para Claude Code

## ✅ Status: Configurado

O MCP do Supabase foi configurado com sucesso para este projeto.

## 📁 Arquivo de Configuração

**Local**: `.claude-code/mcp.json`

**Configuração Atual**:
- **Project ID**: `kllcbgoqtxedlfbkxpfo`
- **URL Supabase**: `https://kllcbgoqtxedlfbkxpfo.supabase.co`
- **Modo**: Leitura e Escrita (read_only=false)
- **Autenticação**: Personal Access Token (pré-configurado)
- **Recursos**: Todos habilitados (database, docs, functions, storage, debugging, development, account, branching)

## 🚀 Como Usar

### Opção 1: Usar Configuração do Projeto (Recomendado)

A configuração já está criada em `.claude-code/mcp.json`. Para ativá-la:

1. **Copie o arquivo para a configuração global do Claude Code**:

   **No Windows (PowerShell)**:
   ```powershell
   $env:APPDATA\Claude\claude_desktop_config.json
   ```

   **Copie o conteúdo de** `.claude-code/mcp.json` **para este arquivo**.

2. **Reinicie o Claude Code**

3. **Teste a conexão**:
   ```
   "Liste todas as tabelas do banco de dados"
   "Mostre a estrutura da tabela cases"
   "Execute: SELECT COUNT(*) FROM cases"
   ```

### Opção 2: Configuração Manual Global

Se preferir configurar manualmente:

1. **Localize o arquivo de configuração**:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Adicione a configuração**:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "type": "http",
         "url": "https://mcp.supabase.com/mcp?project_ref=kllcbgoqtxedlfbkxpfo&read_only=false",
         "headers": {
           "Authorization": "Bearer sbp_1b2f1c81b0a82ca33e5bbaacf9923146a3fe9bb8"
         }
       }
     }
   }
   ```

3. **Reinicie o Claude Code**

## 🎯 Capacidades Habilitadas

Com o MCP configurado, você pode usar linguagem natural para:

### Database Operations
- ✅ Executar queries SQL
- ✅ Criar, modificar e deletar tabelas
- ✅ Gerar migrações
- ✅ Inserir, atualizar e deletar dados
- ✅ Criar índices e constraints
- ✅ Gerar tipos TypeScript das tabelas

### Functions & Storage
- ✅ Listar e executar Edge Functions
- ✅ Ver logs de funções
- ✅ Gerenciar Storage buckets
- ✅ Upload e download de arquivos

### Development Tools
- ✅ Visualizar logs e métricas
- ✅ Debug de queries lentas
- ✅ Análise de performance
- ✅ Gerenciar branches do projeto

### Documentation
- ✅ Buscar documentação oficial
- ✅ Exemplos de código
- ✅ Melhores práticas

## 📝 Exemplos de Uso

### Queries e Dados
```
"Mostre todos os documentos do case com ID X"
"Quantos casos existem no sistema?"
"Liste os últimos 10 usuários cadastrados"
"Conte documentos agrupados por tipo"
```

### Schema Management
```
"Mostre a estrutura completa da tabela cases"
"Crie uma nova tabela para armazenar notificações"
"Adicione uma coluna 'archived_at' na tabela documents"
"Gere uma migração para criar índice em cases.created_at"
```

### TypeScript Integration
```
"Gere os tipos TypeScript de todas as tabelas"
"Atualize os tipos em src/types/database.generated.ts"
"Mostre o tipo da tabela graph_edges"
```

### Debugging
```
"Mostre os logs recentes das Edge Functions"
"Quais queries estão mais lentas?"
"Mostre erros recentes no banco de dados"
```

## ⚙️ Configuração de Segurança

### Permissões Atuais
- **Read**: ✅ Habilitado
- **Write**: ✅ Habilitado (inserir, atualizar, deletar)
- **Schema Changes**: ✅ Habilitado (criar/alterar tabelas)
- **Migrations**: ✅ Habilitado

### ⚠️ Avisos Importantes

1. **Ambiente de Desenvolvimento**: Esta configuração é apropriada apenas para desenvolvimento
2. **Backup Regular**: Faça backup antes de operações destrutivas
3. **Review Changes**: Sempre revise queries de UPDATE/DELETE antes de executar
4. **Produção**: NUNCA use esta configuração em produção

### 🔒 Para Restringir Permissões (Futuro)

Se quiser mudar para modo somente leitura:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=kllcbgoqtxedlfbkxpfo&read_only=true",
      "headers": {
        "Authorization": "Bearer sbp_1b2f1c81b0a82ca33e5bbaacf9923146a3fe9bb8"
      }
    }
  }
}
```

## 🔧 Troubleshooting

### MCP não aparece disponível
1. Verifique se o arquivo de configuração está no local correto
2. Reinicie completamente o Claude Code
3. Verifique se o formato JSON está correto

### Erro de autenticação
1. Verifique se o SUPABASE_ACCESS_TOKEN está correto no `.env`
2. Tente remover o header `Authorization` para usar OAuth flow
3. Verifique se o token não expirou

### Permissões negadas
1. Verifique se o token tem as permissões necessárias
2. Confira as permissões no dashboard do Supabase
3. Tente regenerar o Access Token

## 📚 Recursos Adicionais

- [Documentação Oficial Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub: supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)

## 🔄 Atualização do Token

Se precisar atualizar o token de acesso:

1. **Gere novo token** no Supabase Dashboard:
   - Acesse: Account Settings > Access Tokens
   - Crie novo token com permissões adequadas
   - Copie o token

2. **Atualize o `.env`**:
   ```bash
   SUPABASE_ACCESS_TOKEN=seu_novo_token_aqui
   ```

3. **Atualize o `.claude-code/mcp.json`**:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "headers": {
           "Authorization": "Bearer seu_novo_token_aqui"
         }
       }
     }
   }
   ```

## 📊 Monitoramento

Para monitorar o uso do MCP:
- Verifique logs no Supabase Dashboard
- Monitore queries no SQL Editor > History
- Acompanhe mudanças de schema em Database > Migrations

---

**Configurado em**: 2025-12-25
**Project Ref**: kllcbgoqtxedlfbkxpfo
**Modo**: Full Access (Read + Write)
