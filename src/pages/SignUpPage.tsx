import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import PageTransition from '../components/common/PageTransition'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SignUpPage() {
  const [orgCode, setOrgCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  function validateOrgCode(code: string): boolean {
    return /^[a-zA-Z0-9]{8}$/.test(code)
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validatePassword(pwd: string): boolean {
    return pwd.length >= 6
  }

  function getErrors(): Record<string, string> {
    const errors: Record<string, string> = {}

    if (!orgCode) {
      errors.orgCode = 'Código da organização é obrigatório'
    } else if (!validateOrgCode(orgCode)) {
      errors.orgCode = 'Código deve ter exatamente 8 caracteres alfanuméricos'
    }

    if (!fullName.trim()) {
      errors.fullName = 'Nome completo é obrigatório'
    }

    if (!email) {
      errors.email = 'Email é obrigatório'
    } else if (!validateEmail(email)) {
      errors.email = 'Email inválido'
    }

    if (!password) {
      errors.password = 'Senha é obrigatória'
    } else if (!validatePassword(password)) {
      errors.password = 'Senha deve ter no mínimo 6 caracteres'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Senhas não correspondem'
    }

    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const errors = getErrors()
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0])
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, fullName, orgCode)
      if (error) {
        setError(error.message || 'Erro ao criar conta')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Conta criada com sucesso!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Um email de verificação foi enviado para:
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                  Clique no link no email para verificar sua conta e fazer login.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Ir para Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Minuta Canvas
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Processamento de Documentos e Geração de Minutas
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-center">Criar Conta</CardTitle>
              <CardDescription className="text-center">
                Insira o código da sua organização para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="org-code">
                    Código da Organização
                  </Label>
                  <Input
                    id="org-code"
                    name="org-code"
                    type="text"
                    required
                    maxLength={8}
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC12345"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    8 caracteres alfanuméricos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name">
                    Nome Completo
                  </Label>
                  <Input
                    id="full-name"
                    name="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Silva"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Criando conta...
                    </span>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Já tem conta?{' '}
                  <a
                    href="/login"
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Faça login
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
