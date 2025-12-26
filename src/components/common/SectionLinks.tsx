import { LinkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DeepLinkSection } from '@/hooks/useDeepLink'

interface SectionLinksProps {
  /** Available sections for navigation */
  sections: DeepLinkSection[]
  /** Currently active section */
  activeSection: string | null
  /** Callback when a section is clicked */
  onSectionClick: (sectionId: string) => void
  /** Optional className for styling */
  className?: string
  /** Display variant */
  variant?: 'dropdown' | 'inline'
}

export function SectionLinks({
  sections,
  activeSection,
  onSectionClick,
  className,
  variant = 'dropdown',
}: SectionLinksProps) {
  if (variant === 'inline') {
    return (
      <nav
        className={cn('flex flex-wrap gap-2', className)}
        aria-label="Navegação de seções"
      >
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSectionClick(section.id)}
            className="gap-2"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {section.label}
          </Button>
        ))}
      </nav>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <LinkIcon className="w-4 h-4" />
          Ir para Seção
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {sections.map((section) => (
          <DropdownMenuItem
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              'cursor-pointer',
              activeSection === section.id && 'bg-accent font-medium'
            )}
          >
            {section.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SectionLinks
