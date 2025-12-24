import { Link, useLocation, useParams } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbProps {
  caseName?: string
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  case: 'Case',
  upload: 'Upload',
  entities: 'Entities',
  canvas: 'Canvas',
  draft: 'Draft',
  history: 'History',
}

export default function Breadcrumb({ caseName }: BreadcrumbProps) {
  const location = useLocation()
  const { caseId } = useParams()

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []

    // Always start with Dashboard
    items.push({
      label: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    })

    // If we're on a case page
    if (pathSegments[0] === 'case' && caseId) {
      // Add the case itself
      items.push({
        label: caseName || `Case ${caseId.slice(0, 8)}...`,
        href: `/case/${caseId}`,
      })

      // If there's a sub-page (upload, entities, etc.)
      if (pathSegments.length > 2) {
        const subPage = pathSegments[2]
        const label = routeLabels[subPage] || subPage
        items.push({
          label,
        })
      }
    } else if (pathSegments[0] === 'dashboard') {
      // Remove the dashboard from items since it's already there
      items.pop()
      items.push({
        label: 'Dashboard',
        icon: HomeIcon,
      })
    }

    return items
  }, [location.pathname, caseId, caseName])

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1
          const Icon = item.icon

          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRightIcon
                  className="w-4 h-4 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                  aria-current="page"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.href!}
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium',
                    'text-blue-600 hover:text-blue-700',
                    'dark:text-blue-400 dark:hover:text-blue-300',
                    'transition-colors'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
