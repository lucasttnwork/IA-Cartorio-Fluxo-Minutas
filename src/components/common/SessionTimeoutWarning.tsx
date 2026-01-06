import { useEffect, useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatTimeRemaining } from '../../config/sessionConfig'

interface SessionTimeoutWarningProps {
  open: boolean
  timeRemaining: number
  onExtend: () => void
  onLogout: () => void
}

export function SessionTimeoutWarning({
  open,
  timeRemaining,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const [countdown, setCountdown] = useState(timeRemaining)

  useEffect(() => {
    if (!open) return

    setCountdown(timeRemaining)

    const interval = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1000
        if (next <= 0) {
          clearInterval(interval)
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, timeRemaining])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onExtend()}>
      <DialogContent className="sm:max-w-md" aria-describedby="session-timeout-description">
        <DialogHeader>
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>Aviso de Expiração de Sessão</DialogTitle>
          </div>
          <DialogDescription id="session-timeout-description">
            Sua sessão expirará em breve devido à inatividade.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>{formatTimeRemaining(countdown)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
            Você será desconectado automaticamente quando o tempo chegar a zero.
            Clique em "Continuar Conectado" para manter sua sessão.
          </p>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            Sair Agora
          </Button>
          <Button
            onClick={onExtend}
            className="w-full sm:w-auto"
          >
            Continuar Conectado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
