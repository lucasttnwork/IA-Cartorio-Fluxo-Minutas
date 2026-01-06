import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import PageTransition from '../components/common/PageTransition'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
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

        <Card className="glass-login">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">Faça login em sua conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  E-mail
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    name="remember-me"
                    aria-label="Lembrar de mim"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm cursor-pointer"
                  >
                    Lembrar de mim
                  </Label>
                </div>

                <a
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Esqueceu a senha?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 btn-primary-gradient rounded-lg text-base"
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
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Não tem conta?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Criar uma conta
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </PageTransition>
  )
}
