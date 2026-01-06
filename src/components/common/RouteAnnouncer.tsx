import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LiveRegion, useLiveRegion } from './LiveRegion'

/**
 * RouteAnnouncer component announces page navigation to screen readers.
 * This helps blind users understand when they've navigated to a new page.
 */
export function RouteAnnouncer() {
  const location = useLocation()
  const { message, announce } = useLiveRegion()

  useEffect(() => {
    // Extract page title from pathname
    const pathname = location.pathname
    let pageTitle = 'Página'

    // Map routes to user-friendly titles
    const routeTitles: Record<string, string> = {
      '/dashboard': 'Painel de Controle',
      '/login': 'Login',
      '/forgot-password': 'Recuperar Senha',
      '/reset-password': 'Redefinir Senha',
      '/settings': 'Configurações da Organização',
      '/profile': 'Perfil do Usuário',
      '/purchase-sale-flow': 'Fluxo de Compra e Venda',
    }

    // Check for exact matches first
    if (routeTitles[pathname]) {
      pageTitle = routeTitles[pathname]
    }
    // Handle dynamic routes
    else if (pathname.includes('/case/')) {
      if (pathname.endsWith('/upload')) {
        pageTitle = 'Upload de Documentos'
      } else if (pathname.endsWith('/entities')) {
        pageTitle = 'Entidades Extraídas'
      } else if (pathname.endsWith('/merge-persons')) {
        pageTitle = 'Mesclar Pessoas'
      } else if (pathname.endsWith('/split-persons')) {
        pageTitle = 'Dividir Pessoas'
      } else if (pathname.endsWith('/canvas')) {
        pageTitle = 'Canvas de Relações'
      } else if (pathname.endsWith('/draft')) {
        pageTitle = 'Editor de Minuta'
      } else if (pathname.endsWith('/history')) {
        pageTitle = 'Histórico do Processo'
      } else if (pathname.endsWith('/conflicts')) {
        pageTitle = 'Revisão de Conflitos'
      } else {
        pageTitle = 'Visão Geral do Processo'
      }
    }

    announce(`Navegado para: ${pageTitle}`)
  }, [location.pathname, announce])

  return <LiveRegion message={message} politeness="assertive" />
}
