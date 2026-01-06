# Tipos de Autenticação e Organização

## Visão Geral

O Minuta Canvas implementa um sistema de autenticação em dois níveis:
1. **Autenticação Supabase** - Gerenciada pelo Supabase Auth (email/senha)
2. **Modelo de Usuário da App** - Tabela `users` com informações organizacionais

---

## Estrutura de Autenticação

```
┌────────────────────────────────────────────────────────────┐
│                     Supabase Auth                          │
│  (Email/Senha, JWT, Sessions, RLS)                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Session + JWT Token
                     │
┌────────────────────▼─────────────────────────────────────┐
│                 Auth Context (React)                      │
│  • user: User (Supabase Auth)                             │
│  • appUser: AppUser (dados da aplicação)                  │
│  • session: Session (Supabase)                            │
│  • loading: boolean                                        │
│  • signIn, signUp, signOut, resetPassword, etc            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ useAuth() hook
                     │
┌────────────────────▼─────────────────────────────────────┐
│              Componentes da App                           │
│  (LoginPage, DashboardPage, ProtectedRoute, etc)          │
└────────────────────────────────────────────────────────────┘
```

---

## Tipos Principais de Autenticação

### 1. User (Supabase Auth)
```typescript
// De @supabase/supabase-js
interface User {
  id: string                    // UUID gerado pelo Supabase
  email?: string               // Email do usuário
  phone?: string               // Telefone (se aplicável)
  confirmed_at?: string        // ISO timestamp confirma email
  last_sign_in_at?: string     // ISO timestamp último login
  created_at: string           // ISO timestamp criação
  updated_at: string           // ISO timestamp última atualização
  user_metadata?: Record<string, any>  // Dados customizados
  app_metadata?: Record<string, any>   // Dados administrativos
}
```

### 2. Session (Supabase Auth)
```typescript
// De @supabase/supabase-js
interface Session {
  access_token: string         // JWT token (curta duração)
  token_type: string          // Sempre 'Bearer'
  expires_in: number          // Segundos até expiração
  expires_at?: number         // Timestamp UNIX
  refresh_token?: string      // Para renovar access_token
  user: User                  // Objeto User completo
}
```

### 3. AppUser (Modelo Local)
```typescript
// De src/types/index.ts
interface User {
  id: string                           // Mesmo ID do Supabase Auth User
  organization_id: string              // FK para cartório
  role: 'clerk' | 'supervisor' | 'admin'  // Papel na organização
  full_name: string                    // Nome completo
  created_at: string                   // ISO timestamp
}
```

### 4. AuthContextType
```typescript
// De src/hooks/useAuth.tsx
interface AuthContextType {
  // Dados de autenticação
  user: User | null                    // Supabase Auth User
  appUser: AppUser | null              // Dados da aplicação
  session: Session | null              // Sessão Supabase
  loading: boolean                     // Loading state inicial

  // Funções de autenticação
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  changePassword: (newPassword: string) => Promise<{ error: Error | null }>
  updateProfile: (fullName: string) => Promise<{ error: Error | null }>
}
```

---

## Fluxo de Autenticação Detalhado

### 1. Inicialização (useAuth hook)

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Passo 1: Obter sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Passo 2: Se houver usuário, buscar dados da aplicação
      if (session?.user) {
        fetchAppUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Passo 3: Escutar mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchAppUser(session.user.id)
        } else {
          setAppUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Passo 4: Buscar dados do usuário da aplicação
  async function fetchAppUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')              // Tabela local
        .select('*')
        .eq('id', userId)            // Filtrar pelo ID do Supabase Auth
        .single()

      if (error) throw error
      setAppUser(data as AppUser)
    } catch (error) {
      console.error('Erro ao buscar usuário do app:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      appUser,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      changePassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 2. Sign Up (Registro)

```typescript
async function signUp(email: string, password: string, fullName: string) {
  try {
    // Passo 1: Criar usuário no Supabase Auth
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,  // user_metadata
        },
      },
    })

    if (error) throw error

    // Nota: O usuário será criado em 'users' tabela via trigger do Supabase
    // ou via endpoint de função Edge que é chamado após confirmação

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}
```

### 3. Sign In (Login)

```typescript
async function signIn(email: string, password: string) {
  try {
    // Passo 1: Autenticar com Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Passo 2: Sessão é estabelecida automaticamente
    // Passo 3: useEffect captura onAuthStateChange e busca appUser

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}
```

### 4. Sign Out (Logout)

```typescript
async function signOut() {
  try {
    // Passo 1: Fazer logout no Supabase
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Passo 2: State é limpo automaticamente via listener
    // user → null
    // session → null
    // appUser → null
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}
```

### 5. Password Reset

```typescript
async function resetPassword(email: string) {
  try {
    // Passo 1: Solicitar reset de senha
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// No ResetPasswordPage:
// 1. Usuário recebe link por email
// 2. Link contém token no URL (?code=xxxx&type=recovery)
// 3. Página usa supabase.auth.verifyOtp() para validar
// 4. Se válido, chama supabase.auth.updateUser({ password: newPassword })
```

---

## Estrutura de Organização

### Organization
```typescript
interface Organization {
  id: string                      // UUID
  name: string                    // Nome do cartório (ex: "Cartório de São Paulo")
  settings: Record<string, unknown>  // JSON customizável para configurações
  created_at: string              // ISO timestamp
}
```

### Exemplo de Hierarquia

```
Organization (Cartório)
│
├─ name: "Cartório do 1º Tabelião de São Paulo"
├─ settings:
│  ├─ language: "pt-BR"
│  ├─ currency: "BRL"
│  ├─ max_documents_per_case: 50
│  ├─ default_act_type: "purchase_sale"
│  ├─ logo_url: "https://..."
│  ├─ contact_email: "contato@notary.sp.br"
│  └─ [custom fields...]
│
└─ Users (associados)
   ├─ User { id: "uuid1", organization_id: "org-id", role: "admin" }
   ├─ User { id: "uuid2", organization_id: "org-id", role: "supervisor" }
   └─ User { id: "uuid3", organization_id: "org-id", role: "clerk" }
```

### Papéis (Roles)

| Papel | Permissões |
|-------|-----------|
| `admin` | Gestão de usuários, configurações da organização, acesso a todos os casos |
| `supervisor` | Supervisão de casos, aprovação de drafts, gestão de documentos |
| `clerk` | Criação de casos, upload de documentos, edição limitada de drafts |

### RLS (Row Level Security) Supabase

```sql
-- Exemplo: users só veem dados de sua própria organização
CREATE POLICY "Users can see their organization data"
ON cases
FOR SELECT
TO authenticated
USING (organization_id = auth.jwt() ->> 'organization_id');

-- Exemplo: só admins podem deletar
CREATE POLICY "Only admins can delete cases"
ON cases
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

---

## Sincronização User vs AppUser

```
Supabase Auth (Tabela: auth.users - gerenciada por Supabase)
│
├─ id: "abc-123"
├─ email: "joao@example.com"
├─ encrypted_password: "..."
├─ email_confirmed_at: "2024-01-15T10:00:00Z"
├─ user_metadata: { full_name: "João Silva" }
└─ created_at: "2024-01-15T10:00:00Z"
        │
        │ (Trigger ou Function chama)
        ▼
Local Database (Tabela: public.users)
│
├─ id: "abc-123" (mesmo ID!)
├─ organization_id: "org-1"
├─ role: "clerk"
├─ full_name: "João Silva"
└─ created_at: "2024-01-15T10:00:00Z"
```

### Configuração via Supabase Trigger

```sql
-- Trigger automático ao criar usuário em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    full_name,
    organization_id,
    role,
    created_at
  )
  VALUES (
    new.id,
    COALESCE(new.user_metadata->>'full_name', new.email),
    (new.user_metadata->>'organization_id')::uuid,
    COALESCE(new.user_metadata->>'role', 'clerk'),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Implementação em Componentes

### 1. ProtectedRoute (Validação de Acesso)

```typescript
// src/components/common/ProtectedRoute.tsx

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { appUser, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!appUser) {
    return <Navigate to="/login" replace />
  }

  // Validar role
  const roleHierarchy = { admin: 3, supervisor: 2, clerk: 1 }
  const requiredLevel = roleHierarchy[requiredRole]
  const userLevel = roleHierarchy[appUser.role]

  if (userLevel < requiredLevel) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Uso:
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminPage />
  </ProtectedRoute>
} />
```

### 2. Login Page

```typescript
// src/pages/LoginPage.tsx

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin() {
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    }
    // Caso contrário, AuthContext atualiza e redirect acontece
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  )
}
```

### 3. User Profile Dropdown

```typescript
// src/components/common/UserProfileDropdown.tsx

export function UserProfileDropdown() {
  const { appUser, signOut } = useAuth()

  if (!appUser) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Avatar>
            <AvatarImage src={getInitials(appUser.full_name)} />
          </Avatar>
          <span>{appUser.full_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          {appUser.role.toUpperCase()}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Fluxo de Autenticação em Diagrama

```
USER VISITS APP
    │
    ├─→ App.tsx renders AuthProvider
    │   │
    │   ├─→ useAuth hook initializes
    │   │   │
    │   │   ├─→ supabase.auth.getSession()
    │   │   │   ├─ Session exists? YES
    │   │   │   │   └─→ setUser(session.user)
    │   │   │   │       └─→ fetchAppUser(user.id)
    │   │   │   │           └─→ SELECT * FROM users WHERE id = ?
    │   │   │   │               └─→ setAppUser(data)
    │   │   │   │                   └─→ setLoading(false)
    │   │   │   │
    │   │   │   └─ Session exists? NO
    │   │   │       └─→ setLoading(false)
    │   │   │
    │   │   └─→ onAuthStateChange listener
    │   │       └─ Tracks future auth changes
    │   │
    │   └─→ Render children
    │
    ├─→ Router checks routes
    │   │
    │   ├─ Public route? (Login, ForgotPassword)
    │   │   └─→ Render directly
    │   │
    │   └─ Protected route? (Dashboard, Canvas, Draft)
    │       └─→ ProtectedRoute component
    │           ├─ appUser exists?
    │           │   YES → Render component
    │           │   NO → Redirect to /login
    │           │
    │           └─ requiredRole check?
    │               ├─ User role >= required?
    │               │   YES → Render
    │               │   NO → Redirect to /dashboard
    │
    └─→ Component uses useAuth() hook
        ├─ Access: user, appUser, session, signIn, signOut, etc
        └─ Update profile, change password, etc
```

---

## Casos de Uso Comuns

### 1. Criar Nova Organização + Admin User

```typescript
// Via Supabase Admin API ou Edge Function
const { data: org } = await supabase
  .from('organizations')
  .insert({ name: 'Novo Cartório' })
  .select()
  .single()

const { user } = await supabase.auth.admin.createUser({
  email: 'admin@notary.com',
  password: 'TemporaryPassword123',
  user_metadata: {
    full_name: 'Admin do Cartório',
    organization_id: org.id,
    role: 'admin'
  }
})

// Trigger cria registro em public.users automaticamente
```

### 2. Adicionar Usuário Existente a Organização

```typescript
// Admin cria convidado
const inviteLink = `${APP_URL}/invite?code=${generateCode()}`

// Convidado acessa link
// ClaimsForm preenche dados
// SignUp com organization_id no user_metadata

const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      organization_id: extractedFromLink,
      role: 'clerk'
    }
  }
})
```

### 3. Trocar Senha

```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword
})

if (!error) {
  showSuccess('Senha alterada com sucesso')
  // Session mantém-se ativa, não precisa fazer login novamente
}
```

### 4. Reset de Senha (Esqueceu Senha)

```typescript
// Usuário solicita reset
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${APP_URL}/reset-password`
})

// Supabase envia email com link contendo token
// Usuário clica no link (vai para /reset-password?code=token&type=recovery)
// ResetPasswordPage extrai o token e chama updateUser

const { error } = await supabase.auth.verifyOtp({
  email,
  token: codeFromUrl,
  type: 'recovery'
})

// Se verifyOtp suceder, user está "temporariamente autenticado"
// Pode chamar updateUser para nova senha
const { error } = await supabase.auth.updateUser({
  password: newPassword
})
```

---

## Segurança

### 1. Token JWT
- Gerado por Supabase ao login
- Armazenado em cookie HttpOnly (seguro)
- Enviado automaticamente em cada requisição
- Expira em ~1 hora (configurável)
- Refresh token usado para renovação automática

### 2. RLS (Row Level Security)
- Todas as queries têm política
- Supabase valida `auth.uid()` automaticamente
- Usuário só acessa dados de sua organização
- SQL policies fortemente aplicadas

### 3. Melhorias Recomendadas
- Implementar 2FA (Two-Factor Authentication)
- Rate limiting em login attempts
- Audit logging de acessos (já feito via AuditEntry)
- Session timeout com warning (SessionTimeoutWarning implementado)

---

## Arquivo de Referência

**Localização dos Tipos:**
- `src/types/index.ts` - User, Organization
- `src/hooks/useAuth.tsx` - AuthContextType, AuthProvider
- `src/lib/supabase.ts` - Cliente Supabase configurado
- `src/components/common/ProtectedRoute.tsx` - Validação de rotas

**Localização das Páginas:**
- `src/pages/LoginPage.tsx` - Login
- `src/pages/ForgotPasswordPage.tsx` - Solicitar reset
- `src/pages/ResetPasswordPage.tsx` - Redefinir senha
- `src/components/common/UserProfileDropdown.tsx` - Profile menu

**Tabelas no Supabase:**
- `auth.users` - Gerenciada pelo Supabase (criptografada)
- `public.organizations` - Cartórios
- `public.users` - Dados da aplicação (FK para auth.users)

---

Este documento fornece uma visão completa dos sistemas de autenticação e organização do Minuta Canvas.
