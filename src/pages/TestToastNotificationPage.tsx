import { showToast, toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestToastNotificationPage() {
  const handleSuccess = () => {
    showToast.success('Operação concluída!', 'Seus dados foram salvos com sucesso.')
  }

  const handleError = () => {
    showToast.error('Erro ao processar', 'Não foi possível concluir a operação.')
  }

  const handleWarning = () => {
    showToast.warning('Atenção necessária', 'Este documento precisa de revisão.')
  }

  const handleInfo = () => {
    showToast.info('Informação', 'O processamento foi iniciado.')
  }

  const handleDefault = () => {
    showToast.message('Notificação padrão', 'Esta é uma mensagem simples.')
  }

  const handlePromise = () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 2000)
    })

    showToast.promise(promise, {
      loading: 'Processando documento...',
      success: 'Documento processado com sucesso!',
      error: 'Erro ao processar documento.',
    })
  }

  const handleCustomPosition = (position: any) => {
    toast.success('Toast na posição: ' + position, {
      position,
    })
  }

  const handleRichContent = () => {
    toast.success('Caso criado', {
      description: 'O caso #12345 foi criado com sucesso.',
      action: {
        label: 'Ver caso',
        onClick: () => console.log('Navegando para o caso...'),
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Toast Notifications
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Sistema de notificações toast com glassmorphism e posicionamento configurável
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tipos de Notificação</CardTitle>
            <CardDescription>
              Diferentes variantes de toast para diferentes contextos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button onClick={handleSuccess} variant="default">
              Sucesso
            </Button>
            <Button onClick={handleError} variant="destructive">
              Erro
            </Button>
            <Button onClick={handleWarning} className="bg-amber-600 hover:bg-amber-700">
              Aviso
            </Button>
            <Button onClick={handleInfo} className="bg-blue-600 hover:bg-blue-700">
              Info
            </Button>
            <Button onClick={handleDefault} variant="outline">
              Padrão
            </Button>
            <Button onClick={handlePromise} variant="secondary">
              Promise
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Posicionamento</CardTitle>
            <CardDescription>
              Teste diferentes posições na tela
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button onClick={() => handleCustomPosition('top-left')} variant="outline">
              Top Left
            </Button>
            <Button onClick={() => handleCustomPosition('top-center')} variant="outline">
              Top Center
            </Button>
            <Button onClick={() => handleCustomPosition('top-right')} variant="outline">
              Top Right (Padrão)
            </Button>
            <Button onClick={() => handleCustomPosition('bottom-left')} variant="outline">
              Bottom Left
            </Button>
            <Button onClick={() => handleCustomPosition('bottom-center')} variant="outline">
              Bottom Center
            </Button>
            <Button onClick={() => handleCustomPosition('bottom-right')} variant="outline">
              Bottom Right
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Conteúdo Rico</CardTitle>
            <CardDescription>
              Toast com ações e descrições detalhadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRichContent} className="w-full md:w-auto">
              Toast com Ação
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Posicionamento configurável (padrão: top-right)</li>
              <li>Suporte a dark mode automático</li>
              <li>Glassmorphism styling consistente com o design system</li>
              <li>Variantes: success, error, warning, info, default</li>
              <li>Suporte a Promise para operações assíncronas</li>
              <li>Botão de fechar opcional</li>
              <li>Ações customizáveis</li>
              <li>Animações suaves</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
