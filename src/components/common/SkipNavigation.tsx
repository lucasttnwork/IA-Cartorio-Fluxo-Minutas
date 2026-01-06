import React from 'react'

/**
 * SkipNavigation component provides skip links for keyboard users
 * to bypass repetitive navigation and jump to main content.
 *
 * This improves accessibility by allowing screen reader users
 * to quickly navigate to important page sections.
 */
export function SkipNavigation() {
  return (
    <div className="skip-navigation">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Ir para o conteúdo principal
      </a>
      <a
        href="#sidebar-navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Ir para a navegação
      </a>
    </div>
  )
}
