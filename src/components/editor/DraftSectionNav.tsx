/**
 * DraftSectionNav Component
 *
 * Navigation sidebar that displays a table of contents for the draft editor.
 * Extracts headings from the editor content and allows clicking to jump to sections.
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface Section {
  id: string
  text: string
  level: number
}

interface DraftSectionNavProps {
  editorContent: string
  className?: string
}

export function DraftSectionNav({ editorContent, className }: DraftSectionNavProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Extract sections from HTML content
  useEffect(() => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(editorContent, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3')

    const extractedSections: Section[] = []
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1])
      const text = heading.textContent || ''
      const id = heading.id || `section-${index}`

      extractedSections.push({ id, text, level })
    })

    setSections(extractedSections)
  }, [editorContent])

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
    }
  }

  if (sections.length === 0) {
    return (
      <Card className={cn("glass-card p-6 shadow-xl border-0", className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 shadow-md">
            <DocumentTextIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Navegação
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Adicione títulos ao documento para criar a navegação automática
        </p>
      </Card>
    )
  }

  return (
    <Card className={cn("glass-card p-6 shadow-xl border-0", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 shadow-md">
          <DocumentTextIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Navegação
        </h2>
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                activeSection === section.id && "bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30 font-medium shadow-sm",
                section.level === 1 && "text-base font-semibold text-gray-900 dark:text-white",
                section.level === 2 && "text-sm font-medium text-gray-700 dark:text-gray-300 pl-6",
                section.level === 3 && "text-sm text-gray-600 dark:text-gray-400 pl-10"
              )}
            >
              <div className="flex items-center gap-2">
                {section.level === 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                )}
                {section.level === 2 && (
                  <span className="w-1 h-1 rounded-full bg-purple-400 dark:bg-purple-500" />
                )}
                {section.level === 3 && (
                  <span className="w-0.5 h-0.5 rounded-full bg-purple-300 dark:bg-purple-600" />
                )}
                <span className="truncate">{section.text}</span>
              </div>
            </button>
          ))}
        </nav>
      </ScrollArea>
    </Card>
  )
}
