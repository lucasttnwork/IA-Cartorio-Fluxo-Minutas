# Solução para Problemas de Upload de Documentos

## ✅ Problemas Identificados e Soluções

### 1. ✅ CORRIGIDO: Erro de Rota Incorreta
**Problema:** O fluxo redirecionava para `/flow/purchase-sale` (rota inexistente)
**Solução:** Corrigido em [src/hooks/usePurchaseSaleFlow.ts](src/hooks/usePurchaseSaleFlow.ts)
- Linha 337: `/flow/purchase-sale` → `/purchase-sale-flow`
- Linha 353: `/flow/purchase-sale` → `/purchase-sale-flow`

### 2. ✅ CORRIGIDO: Variável `index` Não Definida
**Problema:** Erro `ReferenceError: index is not defined` ao adicionar arquivos
**Solução:** Corrigido em [src/components/upload/DocumentDropzone.tsx](src/components/upload/DocumentDropzone.tsx#L648)
- Adicionado parâmetro `index` no `.map()`: `.map((file, index) => {`

### 3. ⚠️ REQUER AÇÃO: Erro de Row-Level Security (RLS)
**Problema:** `new row violates row-level security policy`
**Causa:** O usuário de teste não tem `organization_id` configurado corretamente no Supabase

**Solução:**
1. Abra o Supabase Dashboard: https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo
2. Vá em **SQL Editor**
3. Execute o script: [supabase/fix_test_user_rls.sql](supabase/fix_test_user_rls.sql)

Este script irá:
- Verificar se o usuário `test@cartorio.com` existe
- Criar/atualizar a organização de teste
- Associar o usuário à organização
- Verificar que tudo está configurado corretamente

### 4. ℹ️ INFO: Clique no Upload (Comportamento Normal)
**Observação:** O clique na área de upload funciona corretamente via Playwright.

Se o explorador de arquivos não estiver abrindo ao clicar manualmente:
1. **Teste em navegador incógnito** (extensões podem bloquear)
2. **Verifique configurações do browser** (pop-ups bloqueados)
3. **Tente usar drag-and-drop** como alternativa

O componente está funcionando corretamente - o input file invisível é um padrão do `react-dropzone`.

## 🧪 Testes Realizados

✅ Navegação para o fluxo
✅ Criação de caso
✅ Seleção de arquivo via clique
✅ Arquivo adicionado à fila (4.0 KB detectado)
✅ Botão "Enviar 1 arquivo" disponível
❌ Upload falhou devido a RLS policy (aguardando execução do script SQL)

## 📋 Próximos Passos

1. Execute o script `supabase/fix_test_user_rls.sql` no Supabase Dashboard
2. Faça logout e login novamente na aplicação
3. Teste o upload novamente
4. O upload deve funcionar corretamente após a configuração do RLS

## 📸 Screenshots

- Arquivo selecionado: [.playwright-mcp/upload-file-ready.png](.playwright-mcp/.playwright-mcp/upload-file-ready.png)
- Upload funcionando antes do RLS: [.playwright-mcp/upload-fix-success.png](.playwright-mcp/.playwright-mcp/upload-fix-success.png)
