# Script de Instalacao do Supabase MCP para Claude Code
# Executa: .\\.claude-code\install-mcp.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Supabase MCP - Instalacao Claude Code" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Caminhos
$projectMcpConfig = Join-Path $PSScriptRoot "mcp.json"
$claudeConfigDir = Join-Path $env:APPDATA "Claude"
$claudeConfigFile = Join-Path $claudeConfigDir "claude_desktop_config.json"

Write-Host "[1/4] Verificando arquivo de configuracao do projeto..." -ForegroundColor Yellow

if (-not (Test-Path $projectMcpConfig)) {
    Write-Host "[X] ERRO: Arquivo mcp.json nao encontrado em .claude-code/" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Arquivo encontrado: $projectMcpConfig" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Verificando diretorio do Claude Code..." -ForegroundColor Yellow

if (-not (Test-Path $claudeConfigDir)) {
    Write-Host "[!] Diretorio do Claude nao existe. Criando..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
    Write-Host "[OK] Diretorio criado: $claudeConfigDir" -ForegroundColor Green
} else {
    Write-Host "[OK] Diretorio encontrado: $claudeConfigDir" -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/4] Instalando configuracao do MCP..." -ForegroundColor Yellow

# Ler a configuracao do projeto
$mcpConfig = Get-Content $projectMcpConfig -Raw | ConvertFrom-Json

# Verificar se ja existe configuracao
if (Test-Path $claudeConfigFile) {
    Write-Host "[!] Arquivo de configuracao existente encontrado" -ForegroundColor Yellow

    # Ler configuracao existente
    $existingConfig = Get-Content $claudeConfigFile -Raw | ConvertFrom-Json

    # Fazer backup
    $backupFile = $claudeConfigFile + ".backup." + (Get-Date -Format "yyyyMMdd-HHmmss")
    Copy-Item $claudeConfigFile $backupFile
    Write-Host "[OK] Backup criado: $backupFile" -ForegroundColor Green

    # Mesclar configuracoes
    if (-not $existingConfig.mcpServers) {
        $existingConfig | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{} -Force
    }

    # Adicionar ou sobrescrever servidor Supabase
    $existingConfig.mcpServers | Add-Member -NotePropertyName "supabase" -NotePropertyValue $mcpConfig.mcpServers.supabase -Force

    # Salvar configuracao mesclada
    $existingConfig | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile
    Write-Host "[OK] Configuracao mesclada com sucesso" -ForegroundColor Green

} else {
    # Criar novo arquivo de configuracao
    $mcpConfig | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile
    Write-Host "[OK] Nova configuracao criada" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/4] Verificando instalacao..." -ForegroundColor Yellow

$finalConfig = Get-Content $claudeConfigFile -Raw | ConvertFrom-Json

if ($finalConfig.mcpServers.supabase) {
    Write-Host "[OK] Supabase MCP instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuracao:" -ForegroundColor Cyan
    Write-Host "  - URL: $($finalConfig.mcpServers.supabase.url)" -ForegroundColor White
    Write-Host "  - Tipo: $($finalConfig.mcpServers.supabase.type)" -ForegroundColor White
    Write-Host "  - Autenticacao: Configurada (Personal Access Token)" -ForegroundColor White
} else {
    Write-Host "[X] ERRO: Falha na instalacao" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Reinicie o Claude Code (feche e abra novamente)" -ForegroundColor Yellow
Write-Host "2. Teste a conexao com:" -ForegroundColor Yellow
Write-Host "   'Liste todas as tabelas do banco de dados'" -ForegroundColor White
Write-Host "   'Mostre a estrutura da tabela cases'" -ForegroundColor White
Write-Host ""
Write-Host "3. Leia a documentacao completa em:" -ForegroundColor Yellow
Write-Host "   SUPABASE_MCP_SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host ""
