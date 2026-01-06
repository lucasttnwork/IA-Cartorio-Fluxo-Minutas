# Como Obter o Supabase Access Token

Para usar comandos do Supabase CLI que precisam de autenticação, você precisa de um **Access Token**.

## Opção 1: Gerar Access Token via Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Vá para Account Settings:**
   - Clique no seu avatar no canto superior direito
   - Selecione "Account Settings"

3. **Gere um Access Token:**
   - Na seção "Access Tokens"
   - Clique em "Generate New Token"
   - Dê um nome (ex: "CLI Access")
   - Copie o token gerado

4. **Configure a variável de ambiente:**

   **Windows (PowerShell):**
   ```powershell
   $env:SUPABASE_ACCESS_TOKEN="seu-token-aqui"
   ```

   **Windows (CMD):**
   ```cmd
   set SUPABASE_ACCESS_TOKEN=seu-token-aqui
   ```

   **Linux/Mac:**
   ```bash
   export SUPABASE_ACCESS_TOKEN=seu-token-aqui
   ```

5. **Ou adicione ao arquivo `.env`:**
   ```
   SUPABASE_ACCESS_TOKEN=seu-token-aqui
   ```

6. **Agora você pode executar:**
   ```bash
   npm run generate-types
   ```

## Opção 2: Login via Browser

Se o ambiente suporta, você pode tentar:

```bash
npx supabase login
```

Isso abrirá o browser para fazer login.

## Opção 3: Usar os Tipos Existentes

Se você não conseguir gerar os tipos, pode usar os tipos que já existem em `src/types/database.ts`. Eles foram gerados do schema e devem estar atualizados se as migrações já foram aplicadas.

## Verificar se os tipos estão atualizados

Execute:
```bash
npm run test-connection
```

Se todas as tabelas aparecerem como OK, os tipos existentes devem funcionar corretamente.

## Troubleshooting

### Erro: "Access token not provided"
- Certifique-se de que a variável de ambiente está definida
- Tente fechar e reabrir o terminal
- Verifique se o token foi copiado corretamente (sem espaços extras)

### Erro: "Invalid access token"
- Gere um novo token no Dashboard
- Verifique se está usando o token da conta correta

### Token expira
- Access tokens não expiram por padrão
- Você pode revogar e gerar novos tokens a qualquer momento

---

**Próximo passo após configurar o token:**
```bash
npm run generate-types
```
