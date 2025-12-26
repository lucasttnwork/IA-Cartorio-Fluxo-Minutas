#!/bin/bash
# Script de Instalação do Supabase MCP para Claude Code
# Executa: bash .claude-code/install-mcp.sh

set -e

# Cores
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Supabase MCP - Instalação Claude Code${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Detectar sistema operacional
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
else
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
fi

CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
PROJECT_MCP_CONFIG="$(dirname "$0")/mcp.json"

echo -e "${YELLOW}[1/4] Verificando arquivo de configuração do projeto...${NC}"

if [ ! -f "$PROJECT_MCP_CONFIG" ]; then
    echo -e "${RED}❌ ERRO: Arquivo mcp.json não encontrado em .claude-code/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo encontrado: $PROJECT_MCP_CONFIG${NC}"
echo ""

echo -e "${YELLOW}[2/4] Verificando diretório do Claude Code...${NC}"

if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo -e "${YELLOW}⚠️  Diretório do Claude não existe. Criando...${NC}"
    mkdir -p "$CLAUDE_CONFIG_DIR"
    echo -e "${GREEN}✅ Diretório criado: $CLAUDE_CONFIG_DIR${NC}"
else
    echo -e "${GREEN}✅ Diretório encontrado: $CLAUDE_CONFIG_DIR${NC}"
fi
echo ""

echo -e "${YELLOW}[3/4] Instalando configuração do MCP...${NC}"

# Verificar se já existe configuração
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  Arquivo de configuração existente encontrado${NC}"

    # Fazer backup
    BACKUP_FILE="${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$CLAUDE_CONFIG_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"

    # Mesclar usando jq se disponível
    if command -v jq &> /dev/null; then
        MCP_CONFIG=$(cat "$PROJECT_MCP_CONFIG")
        EXISTING_CONFIG=$(cat "$CLAUDE_CONFIG_FILE")

        # Mesclar mcpServers
        echo "$EXISTING_CONFIG" | jq --argjson mcp "$MCP_CONFIG" \
            '.mcpServers.supabase = $mcp.mcpServers.supabase' \
            > "$CLAUDE_CONFIG_FILE"

        echo -e "${GREEN}✅ Configuração mesclada com sucesso${NC}"
    else
        echo -e "${YELLOW}⚠️  jq não encontrado. Sobrescrevendo configuração...${NC}"
        cp "$PROJECT_MCP_CONFIG" "$CLAUDE_CONFIG_FILE"
        echo -e "${GREEN}✅ Configuração instalada${NC}"
    fi

else
    # Criar novo arquivo de configuração
    cp "$PROJECT_MCP_CONFIG" "$CLAUDE_CONFIG_FILE"
    echo -e "${GREEN}✅ Nova configuração criada${NC}"
fi

echo ""
echo -e "${YELLOW}[4/4] Verificando instalação...${NC}"

if command -v jq &> /dev/null; then
    if jq -e '.mcpServers.supabase' "$CLAUDE_CONFIG_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Supabase MCP instalado com sucesso!${NC}"
        echo ""
        echo -e "${CYAN}Configuração:${NC}"
        echo -e "  ${WHITE}• URL: $(jq -r '.mcpServers.supabase.url' "$CLAUDE_CONFIG_FILE")${NC}"
        echo -e "  ${WHITE}• Tipo: $(jq -r '.mcpServers.supabase.type' "$CLAUDE_CONFIG_FILE")${NC}"
        echo -e "  ${WHITE}• Autenticação: Configurada (Personal Access Token)${NC}"
    else
        echo -e "${RED}❌ ERRO: Falha na instalação${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Configuração instalada (instale 'jq' para validação detalhada)${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PRÓXIMOS PASSOS${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}1. Reinicie o Claude Code (feche e abra novamente)${NC}"
echo -e "${YELLOW}2. Teste a conexão com:${NC}"
echo -e "   ${WHITE}'Liste todas as tabelas do banco de dados'${NC}"
echo -e "   ${WHITE}'Mostre a estrutura da tabela cases'${NC}"
echo ""
echo -e "${YELLOW}3. Leia a documentação completa em:${NC}"
echo -e "   ${WHITE}SUPABASE_MCP_SETUP.md${NC}"
echo ""
echo -e "${GREEN}✨ Configuração concluída!${NC}"
echo ""
