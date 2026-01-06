import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24, 48],
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <nav
      className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6"
      role="navigation"
      aria-label="Pagination"
    >
      {/* Mobile View */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Ir para página anterior"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Ir para próxima página"
        >
          Próximo
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{startItem}</span> a{' '}
            <span className="font-medium">{endItem}</span> de{' '}
            <span className="font-medium">{totalItems}</span> resultados
          </p>

          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300">
                Por página:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className={cn(
                  'rounded-md border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-700',
                  'text-gray-900 dark:text-gray-100',
                  'px-3 py-1 text-sm',
                  'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                )}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Ir para página anterior"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  ...
                </span>
              )
            }

            const pageNumber = page as number
            const isActive = pageNumber === currentPage

            return (
              <Button
                key={pageNumber}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Ir para página ${pageNumber}`}
              >
                {pageNumber}
              </Button>
            )
          })}

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Ir para próxima página"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
