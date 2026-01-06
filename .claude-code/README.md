# Configuração do Supabase MCP

Este diretório contém a configuração do Model Context Protocol (MCP) do Supabase para o Claude Code.

## Arquivos

- **`mcp.json`** - Configuração ativa (NÃO VERSIONADA - contém credenciais)
- **`mcp.json.template`** - Template para novos desenvolvedores
- **`install-mcp.ps1`** - Script de instalação para Windows
- **`install-mcp.sh`** - Script de instalação para Linux/macOS

## Instalação

### Windows (PowerShell)
```powershell
.\\.claude-code\install-mcp.ps1
```

### Linux/macOS (Bash)
```bash
bash .claude-code/install-mcp.sh
```

## Configuração Manual

Se preferir configurar manualmente, copie o conteúdo de `mcp.json` para:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Status da Instalação

✅ **Instalado em**: `C:\Users\Lucas\AppData\Roaming\Claude\claude_desktop_config.json`

**Configuração Atual**:
- Project ID: `kllcbgoqtxedlfbkxpfo`
- URL: `https://kllcbgoqtxedlfbkxpfo.supabase.co`
- Modo: **Leitura e Escrita** (read_only=false)
- Autenticação: Personal Access Token

## Próximos Passos

1. **Reinicie o Claude Code** (feche e abra novamente)
2. **Teste a conexão**:
   - "Liste todas as tabelas do banco de dados"
   - "Mostre a estrutura da tabela cases"
   - "Quantos casos existem no sistema?"

## Documentação

Para informações completas sobre uso, capacidades e segurança, consulte:
**[SUPABASE_MCP_SETUP.md](../SUPABASE_MCP_SETUP.md)**

## Segurança

⚠️ **IMPORTANTE**:
- O arquivo `mcp.json` contém credenciais sensíveis e está no `.gitignore`
- Nunca commite este arquivo ao repositório
- Use apenas em ambiente de desenvolvimento
- Para produção, use `read_only=true` e tokens com permissões restritas
