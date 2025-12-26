import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
      } else {
        setError('Link de redefinição inválido ou expirado. Por favor, solicite uma nova redefinição de senha.')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        setPasswordReset(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      setError('Um erro inesperado ocorreu')
    } finally {
      setLoading(false)
    }
  }

  if (passwordReset) {
    return (
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
              Document Processing & Draft Generation
            </p>
          </div>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Senha redefinida com sucesso
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Sua senha foi redefinida com sucesso.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Redirecionando para a página de login...
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
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
            <CardTitle className="text-center">Definir nova senha</CardTitle>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2">
              Digite sua nova senha abaixo.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!validSession && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Link de redefinição inválido ou expirado. Por favor, solicite uma nova redefinição de senha.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  Nova Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={!validSession}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Deve ter pelo menos 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={!validSession}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !validSession}
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
                    Redefinindo senha...
                  </span>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
