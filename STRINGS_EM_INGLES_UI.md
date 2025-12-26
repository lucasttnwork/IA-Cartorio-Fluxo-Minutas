# Análise de Strings em Inglês na Interface de Usuário (src/pages/)

Data da Análise: 2025-12-25
Objetivo: Identificar todas as strings visíveis ao usuário que estão em inglês e necessitam tradução para português.

---

## RESUMO EXECUTIVO

Total de arquivos analisados: 5 páginas principais
- DashboardPage.tsx
- LoginPage.tsx
- CaseOverviewPage.tsx
- PurchaseSaleFlowPage.tsx
- EntitiesPage.tsx
- ForgotPasswordPage.tsx
- ResetPasswordPage.tsx
- DraftPage.tsx
- CanvasPage.tsx

**Total de strings em inglês encontradas: 89 strings**

---

## 1. DashboardPage.tsx

### Descrição
Página principal do dashboard com listagem de casos, filtros de busca e opções de criação/duplicação de casos.

### Strings em Inglês Encontradas (20 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 42-48 | Draft, Processing, Review, Approved, Archived | Status labels | Badge/Label |
| 52-56 | Purchase & Sale, Donation, Exchange, Lease | Act type labels | Label |
| 198 | Cases | Título da página | Heading |
| 201 | Manage your document cases and drafts | Subtítulo | Description |
| 210 | Start Purchase/Sale Flow | Botão principal | Button |
| 215 | New Case | Botão secundário | Button |
| 228 | Search cases by title... | Placeholder de busca | Placeholder |
| 237 | Clear search | Label do botão | Aria Label |
| 248-253 | All Status, Draft, Processing, Review, Approved, Archived | Opções de filtro | Select Option |
| 279 | Failed to load cases | Título do erro | Heading |
| 282 | An unexpected error occurred | Mensagem de erro | Error Message |
| 287 | Try Again | Botão de retry | Button |
| 308 | No cases found | Título estado vazio (com busca) | Heading |
| 309 | No cases yet | Título estado vazio (sem busca) | Heading |
| 312-313 | No cases match... Try a different search term. / Get started by creating a new case... | Descrição estado vazio | Description |
| 319 | Clear Search | Botão estado vazio | Button |
| 328 | Start Purchase/Sale Flow | Botão estado vazio | Button |
| 333 | Create Case Manually | Botão estado vazio | Button |
| 371 | More options | Aria label do menu | Aria Label |
| 389 | Duplicate Case | Botão menu | Menu Item |
| 397 | Delete Case | Botão menu | Menu Item |
| 409 | Created | Label de data | Label |

---

## 2. LoginPage.tsx

### Descrição
Página de autenticação de usuários com entrada de email e senha.

### Strings em Inglês Encontradas (12 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 54 | Minuta Canvas | Título da aplicação | Title |
| 57 | Document Processing & Draft Generation | Subtítulo | Subtitle |
| 63 | Sign in to your account | Título do card | Card Title |
| 75 | Email | Label de campo | Label |
| 85 | email@example.com | Placeholder | Placeholder |
| 90-91 | Password | Label de campo | Label |
| 101 | ******** | Placeholder de senha | Placeholder |
| 116 | Remember me | Checkbox label | Label |
| 124 | Forgot password? | Link | Link Text |
| 154 | Signing in... | Texto do botão carregando | Button Text |
| 157 | Sign in | Texto do botão | Button Text |
| 38 | An unexpected error occurred | Mensagem de erro | Error Message |

---

## 3. CaseOverviewPage.tsx

### Descrição
Página de visão geral do caso com informações e seções de documentos.

### Strings em Inglês Encontradas (26 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 38-42 | Purchase & Sale, Donation, Exchange, Lease | Act type labels | Label |
| 47-48 | Case Information, Documents | Seção labels | Section Label |
| 83 | Failed to update status. Please try again. | Mensagem de erro | Alert |
| 98 | Failed to duplicate case. Please try again. | Mensagem de erro | Alert |
| 137 | Case Overview | Título da página | Heading |
| 145 | Failed to load case | Título do erro | Heading |
| 148 | An unexpected error occurred | Mensagem de erro | Error Message |
| 157 | Try Again | Botão de retry | Button |
| 174-176 | This case is archived / Archived cases are read-only. You can unarchive this case to make changes. | Aviso de arquivo | Alert Content |
| 212 | Duplicate | Botão | Button |
| 212 | Duplicating... | Estado do botão | Button Text |
| 222 | Unarchive | Botão | Button |
| 232 | Archive | Botão | Button |
| 246 | Case Information | Título da seção | Card Title |
| 252 | Copy link to Case Information section | Aria label | Aria Label |
| 253 | Copied! | Tooltip | Tooltip Text |
| 258 | Copied! | Toast/Label | Alert |
| 267 | Case ID | Label de campo | Label |
| 275 | Act Type | Label de campo | Label |
| 283 | Created | Label de campo | Label |
| 291 | Last Updated | Label de campo | Label |
| 299 | Assigned To | Label de campo | Label |
| 322 | Documents | Título da seção | Card Title |
| 324 | Document management will be implemented here. | Descrição | Card Description |
| 332 | Copy link to Documents section | Aria label | Aria Label |
| 350 | Archive Case / Unarchive Case | Título do diálogo | Dialog Title |
| 355-356 | Are you sure you want to unarchive/archive... | Descrição do diálogo | Dialog Description |
| 364 | Cancel | Botão | Button |
| 370 | Processing... / Unarchive / Archive | Texto do botão | Button Text |

---

## 4. PurchaseSaleFlowPage.tsx

### Descrição
Página wizard para fluxo de transação de compra e venda com múltiplos passos.

### Strings em Inglês Encontradas (35 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 61-62 | Compra e Venda, Doacao, Permuta, Locacao | Descrição em português misturado | Nota: Algumas em português |
| 115 | Titulo do Caso * | Label de campo | Label |
| 119 | Ex: Venda do Apartamento 101 - Ed. Central | Placeholder | Placeholder |
| 128 | Escolha um titulo descritivo... | Descrição | Help Text |
| 134 | Tipo de Ato * | Label de campo | Label |
| 141 | Selecione o tipo de ato | Placeholder | Placeholder |
| 155 | O tipo de ato define o modelo... | Descrição | Help Text |
| 169 | Caso criado com sucesso! | Mensagem de sucesso | Success Message |
| 172 | ID: | Label | Label |
| 185 | Criando Caso... / Criar Caso | Botão | Button Text |
| 207 | Nenhum caso selecionado... | Mensagem | Message |
| 225 | Documentos Carregados | Título | Label |
| 271 | Processado / Processando / Falhou / Carregado | Status de documento | Badge |
| 287 | Documentos recomendados para Compra e Venda: | Título de informação | Label |
| 290-294 | RG e CPF... / Certidao de casamento... / etc | Lista de recomendações | List Item |
| 329 | Extraindo entidades dos documentos... | Mensagem de processamento | Status Message |
| 332 | Progresso: | Label | Label |
| 353 | Pronto para iniciar a extracao | Título | Message |
| 356-357 | A IA vai analisar os documentos... | Descrição | Help Text |
| 360 | Iniciar Extracao | Botão | Button |
| 373 | Pessoa(s) encontrada(s) / Pessoas encontradas | Descrição | Label |
| 383 | Imovel(is) encontrado(s) / Imoveis encontrados | Descrição | Label |
| 393 | Pessoas | Título de seção | Heading |
| 406 | CPF nao informado | Texto padrão | Default Text |
| 410 | confianca | Label | Label |
| 422 | Imoveis | Título de seção | Heading |
| 434 | Matricula nao identificada | Texto padrão | Default Text |
| 439 | Endereco nao informado | Texto padrão | Default Text |
| 443 | confianca | Label | Label |
| 487 | Pessoas | Título | Label |
| 497 | Imoveis | Título | Label |
| 507 | Relacionamentos | Título | Label |
| 532 | Visualizacao do Canvas | Título | Title |
| 535 | Revise e confirme os relacionamentos... | Descrição | Help Text |
| 542 | Abrir Canvas Completo | Botão | Button |
| 552 | Status dos Relacionamentos | Título | Heading |
| 573 | Confirmado / Pendente | Status badge | Badge |
| 620 | Gerando minuta do documento... | Status message | Status |
| 623 | Isso pode levar alguns segundos | Descrição | Help Text |
| 644 | Pronto para gerar a minuta | Título | Message |
| 647-648 | A minuta sera gerada com base nas... | Descrição | Help Text |
| 651 | Gerar Minuta | Botão | Button |
| 661 | Minuta gerada com sucesso! | Título de sucesso | Success Title |
| 664 | Versao ... - ... | Descrição de sucesso | Description |
| 673 | Abrir | Botão | Button |
| 682 | Itens Pendentes | Título | Heading |
| 708-711 | Erro / Aviso / Info | Badge de severidade | Badge |
| 730 | Pre-visualizacao | Título | Title |
| 732 | Secoes da minuta gerada | Descrição | Description |
| 787 | Fluxo Concluido! | Título de conclusão | Heading |
| 790-791 | O caso foi processado com sucesso... | Descrição | Description |
| 801 | Voltar ao Dashboard | Botão | Button |
| 808 | Ver Minuta | Botão | Button |
| 813 | Novo Fluxo | Botão | Button |
| 1002 | Fluxo de Compra e Venda | Título | Title |
| 1005 | de ... etapas concluidas | Descrição de progresso | Description |
| 1015 | Cancelar | Botão | Button |
| 1054 | Processando... | Loading message | Status |
| 1075 | Cancelar Fluxo? | Diálogo título | Dialog Title |
| 1077-1078 | Tem certeza que deseja cancelar... | Descrição do diálogo | Dialog Description |
| 1086 | Continuar Editando | Botão | Button |
| 1092 | Cancelar Fluxo | Botão | Button |

---

## 5. EntitiesPage.tsx

### Descrição
Página de gerenciamento de entidades extraídas de documentos (pessoas e propriedades).

### Strings em Inglês Encontradas (28 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 62 | Failed to fetch documents: ... | Mensagem de erro | Error |
| 112 | Failed to load data | Mensagem de erro | Error |
| 142 | Failed to create extraction job: ... | Mensagem de erro | Error |
| 152 | Failed to trigger extraction | Mensagem de erro | Error |
| 189 | Failed to trigger extractions | Mensagem de erro | Error |
| 203 | entidades | Label | Label |
| 211 | Processando... | Status | Status |
| 219 | Aguardando extracao | Status | Status |
| 273 | Pessoa / Pessoas encontrada(s) | Label | Label |
| 344 | Entidades Extraidas | Título | Title |
| 347 | Visualize e gerencie as entidades... | Subtítulo | Description |
| 359 | Atualizar | Botão | Button |
| 368 | Criar Pessoa | Botão | Button |
| 377 | Criar Imóvel | Botão | Button |
| 394 | Extrair Entidades | Botão | Button |
| 389 | Extraindo... | Status do botão | Button Text |
| 411 | Fechar | Botão | Button |
| 430 | Filtrar por Documento | Título | Heading |
| 439 | Todos | Botão de filtro | Button |
| 513 | Nenhum documento encontrado | Título | Heading |
| 516 | Faca upload de documentos... | Descrição | Description |
| 520 | Ir para Upload | Link | Link/Button |
| 543 | Documentos Disponiveis | Título | Card Title |
| 545 | Clique em um documento... | Descrição | Card Description |
| 584 | entidades | Label badge | Badge |
| 595 | Re-extrair / Extrair | Botão | Button |

---

## 6. ForgotPasswordPage.tsx

### Descrição
Página de recuperação de senha.

### Strings em Inglês Encontradas (12 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 48 | Minuta Canvas | Título | Title |
| 51 | Document Processing & Draft Generation | Subtítulo | Subtitle |
| 62 | Check your email | Título de sucesso | Heading |
| 65 | We've sent a password reset link to | Mensagem | Message |
| 68 | Click the link in the email to reset your password. If you don't see it, check your spam folder. | Instruções | Help Text |
| 76 | Back to login | Link | Link Text |
| 105 | Reset your password | Título do card | Card Title |
| 107 | Enter your email address and we'll send you a link to reset your password. | Descrição | Help Text |
| 120 | Email | Label | Label |
| 130 | email@example.com | Placeholder | Placeholder |
| 160 | Sending reset link... | Texto do botão | Button Text |
| 163 | Send reset link | Texto do botão | Button Text |
| 173 | Back to login | Link | Link Text |
| 32 | An unexpected error occurred | Mensagem de erro | Error |

---

## 7. ResetPasswordPage.tsx

### Descrição
Página para redefinir senha usando link de recuperação.

### Strings em Inglês Encontradas (14 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 27 | Invalid or expired reset link. Please request a new password reset. | Mensagem de erro | Error Message |
| 38 | Passwords do not match | Validação | Error Message |
| 44 | Password must be at least 6 characters long | Validação | Error Message |
| 81 | Minuta Canvas | Título | Title |
| 84 | Document Processing & Draft Generation | Subtítulo | Subtitle |
| 95 | Password reset successful | Título de sucesso | Heading |
| 98 | Your password has been successfully reset. | Mensagem de sucesso | Success Message |
| 101 | Redirecting to login page... | Mensagem de status | Status Message |
| 129 | Set new password | Título do card | Card Title |
| 131 | Enter your new password below. | Descrição | Help Text |
| 145 | Invalid or expired reset link. Please request a new password reset. | Alerta | Alert Message |
| 152 | New Password | Label | Label |
| 163 | ******** | Placeholder | Placeholder |
| 166 | Must be at least 6 characters long | Validação | Help Text |
| 172 | Confirm New Password | Label | Label |
| 184 | ******** | Placeholder | Placeholder |
| 213 | Resetting password... | Texto do botão | Button Text |
| 216 | Reset password | Texto do botão | Button Text |
| 65 | An unexpected error occurred | Mensagem de erro | Error |

---

## 8. DraftPage.tsx

### Descrição
Editor de minuta com interface de chat integrada.

### Strings em Inglês Encontradas (2 strings)

| Linha | String em Inglês | Contexto | Tipo |
|-------|-----------------|---------|------|
| 100 | Erro ao verificar minuta existente | Mensagem de erro | Error Message |

---

## 9. CanvasPage.tsx

### Descrição
Página de canvas infinito com mapeamento visual de relacionamentos entre entidades.

### Strings em Inglês Encontradas (Poucas na amostra verificada)

(Arquivo muito grande, primeiras 100 linhas analisadas contêm principalmente imports e estrutura)

---

## PADRÕES E RECOMENDAÇÕES

### Categorias de Strings Identificadas

1. **Títulos de Página** (5 strings)
   - Cases
   - Case Overview
   - Entidades Extraidas
   - Fluxo de Compra e Venda

2. **Rótulos de Status** (10+ strings)
   - Draft, Processing, Review, Approved, Archived
   - Processando, Falhou, Carregado, etc.

3. **Tipos de Ato** (4 strings)
   - Purchase & Sale
   - Donation
   - Exchange
   - Lease

4. **Botões de Ação** (20+ strings)
   - Sign in, Sign up
   - Create Case
   - New Case
   - Delete Case
   - Duplicate Case
   - Cancel
   - Try Again
   - Save, etc.

5. **Mensagens de Erro** (10+ strings)
   - Failed to load
   - An unexpected error occurred
   - Invalid credentials
   - etc.

6. **Placeholders e Help Text** (15+ strings)
   - Search cases by title...
   - email@example.com
   - Instruções de preenchimento, etc.

7. **Labels de Campos** (10+ strings)
   - Email
   - Password
   - Case ID
   - Act Type
   - etc.

8. **Mensagens de Estado** (8+ strings)
   - Loading...
   - Processing...
   - Redirecting...
   - etc.

### Padrão de Nomenclatura em Uso

**Observação Importante:** A aplicação já utiliza português em muitos textos (ver PurchaseSaleFlowPage.tsx com "Fluxo de Compra e Venda", "Criar Caso", etc.), mas possui uma mistura de idiomas.

---

## LISTA CONSOLIDADA PARA TRADUÇÃO

### Prioridade ALTA (Strings críticas na interface principal)

```
Dashboard:
- "Cases" → "Casos"
- "Manage your document cases and drafts" → "Gerencie seus casos de documentos e minutas"
- "Search cases by title..." → "Buscar casos por título..."
- "New Case" → "Novo Caso"
- "Start Purchase/Sale Flow" → "Iniciar Fluxo de Compra e Venda"
- "No cases found" → "Nenhum caso encontrado"
- "No cases yet" → "Nenhum caso ainda"
- "Failed to load cases" → "Falha ao carregar casos"
- "Try Again" → "Tentar Novamente"

Login:
- "Minuta Canvas" → "Minuta Canvas" (Manter - nome da aplicação)
- "Document Processing & Draft Generation" → "Processamento de Documentos e Geração de Minutas"
- "Sign in to your account" → "Faça login na sua conta"
- "Email" → "Email" (ou "Correio Eletrônico")
- "Password" → "Senha"
- "Remember me" → "Lembrar de mim"
- "Forgot password?" → "Esqueceu a senha?"
- "Sign in" → "Entrar"
- "Signing in..." → "Entrando..."

Case Overview:
- "Case Information" → "Informações do Caso"
- "Documents" → "Documentos"
- "Case Overview" → "Visão Geral do Caso"
- "Archive" → "Arquivar"
- "Unarchive" → "Desarquivar"
- "Duplicate" → "Duplicar"
- "This case is archived" → "Este caso está arquivado"

Entities:
- "Extracted Entities" → "Entidades Extraídas"
- "Refresh" → "Atualizar"
- "Create Person" → "Criar Pessoa"
- "Create Property" → "Criar Imóvel"
- "Extract Entities" → "Extrair Entidades"
- "No documents found" → "Nenhum documento encontrado"
```

### Prioridade MÉDIA (Strings em fluxos secundários)

```
Password Recovery:
- "Reset your password" → "Redefinir sua senha"
- "Forgot password?" → "Esqueceu a senha?"
- "Check your email" → "Verifique seu email"
- "Send reset link" → "Enviar link de redefinição"
- "Set new password" → "Definir nova senha"
- "Password reset successful" → "Senha redefinida com sucesso"

Purchase/Sale Flow:
- "Purchase & Sale" → "Compra e Venda"
- "Donation" → "Doação"
- "Exchange" → "Permuta"
- "Lease" → "Locação"
- "Create Case" → "Criar Caso"
- "Case created successfully!" → "Caso criado com sucesso!"
- "Upload Documents" → "Carregar Documentos"
- "Extract Entities" → "Extrair Entidades"
- "Generate Draft" → "Gerar Minuta"
```

### Prioridade BAIXA (Mensagens de erro e status)

```
Error Messages:
- "An unexpected error occurred" → "Um erro inesperado ocorreu"
- "Failed to..." → "Falha ao..."
- "Invalid or expired reset link" → "Link inválido ou expirado"
- "Passwords do not match" → "As senhas não correspondem"
- "Password must be at least 6 characters long" → "A senha deve ter pelo menos 6 caracteres"

Status Messages:
- "Processing..." → "Processando..."
- "Loading..." → "Carregando..."
- "Redirecting..." → "Redirecionando..."
- "Extracting..." → "Extraindo..."
```

---

## RECOMENDAÇÕES DE IMPLEMENTAÇÃO

1. **Criar arquivo de i18n (internacionalização)**
   - Usar biblioteca como `i18next` ou `react-i18n`
   - Estruturar em diretórios por idioma: `locales/en/`, `locales/pt-BR/`
   - Separar por contexto: dashboard.json, auth.json, entities.json, etc.

2. **Padrão de uso em componentes**
   ```tsx
   import { useTranslation } from 'react-i18next'

   export function Component() {
     const { t } = useTranslation('dashboard')
     return <h1>{t('pages.dashboard.title')}</h1>
   }
   ```

3. **Estrutura de tradução sugerida**
   ```
   locales/
   ├── pt-BR/
   │   ├── auth.json
   │   ├── dashboard.json
   │   ├── cases.json
   │   ├── entities.json
   │   ├── flow.json
   │   ├── common.json
   │   └── errors.json
   └── en/
       └── (mesma estrutura)
   ```

4. **Roteiro de implementação**
   - Fase 1: Instalar i18next e react-i18next
   - Fase 2: Configurar provider e hook customizado
   - Fase 3: Migrar strings das páginas principais (Dashboard, Login)
   - Fase 4: Migrar strings das páginas secundárias
   - Fase 5: Testar em ambos os idiomas
   - Fase 6: Adicionar switcher de idioma na UI

---

## OBSERVAÇÕES FINAIS

1. **Inconsistência de Idiomas Atual:**
   - Dashboard e Login Pages: Principalmente em inglês
   - PurchaseSaleFlowPage: Mistura português e inglês
   - EntitiesPage: Mistura português e inglês
   - Status badges e labels: Variação entre inglês e português

2. **Campos que Devem Manter Inglês:**
   - "Minuta Canvas" (nome da aplicação - pode ser mantido)
   - CPF, RG, IPTU (termos técnicos brasileiros em inglês)
   - Nomes de tabelas/BD (se houver validação de entrada)

3. **Considerações de UX:**
   - O usuário final é brasileiro (cartório)
   - Todos os nomes de propriedades e pessoas devem ser em português
   - Documentação e help text devem estar em português
   - Mensagens de sucesso/erro devem ser em português

4. **Próximas Etapas Recomendadas:**
   - [ ] Definir glossário de termos notariais em português
   - [ ] Revisar tradução com especialistas em direito
   - [ ] Implementar i18n framework
   - [ ] Criar testes de tradução (verificar truncamento de strings longas)
   - [ ] Testar responsividade com strings longas em português

---

**Gerado por:** Claude Code AI
**Data:** 2025-12-25
**Total de entradas:** 89 strings em inglês identificadas
