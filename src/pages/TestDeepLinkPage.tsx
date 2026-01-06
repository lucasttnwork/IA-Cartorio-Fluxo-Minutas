import { useMemo, useState } from 'react'
import { useDeepLink } from '../hooks/useDeepLink'
import { SectionLinks } from '../components/common/SectionLinks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LinkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

// Define sections for the test page
const TEST_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'usage', label: 'Usage' },
  { id: 'examples', label: 'Examples' },
]

export default function TestDeepLinkPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Convert to mutable array for useDeepLink
  const sections = useMemo(() => [...TEST_SECTIONS], [])

  const { activeSection, scrollToSection, getSectionLink, getSectionRef } = useDeepLink({
    sections,
    offsetTop: 96,
    highlightDuration: 2500,
  })

  const handleCopyLink = async (sectionId: string) => {
    const link = `${window.location.origin}${getSectionLink(sectionId)}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedSection(sectionId)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Deep Link Test Page
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Test deep linking to specific sections
            </p>
          </div>
          <SectionLinks
            sections={sections}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
            variant="dropdown"
          />
        </div>

        {/* Inline Section Navigation */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionLinks
              sections={sections}
              activeSection={activeSection}
              onSectionClick={scrollToSection}
              variant="inline"
            />
          </CardContent>
        </Card>

        {/* Overview Section */}
        <Card
          ref={getSectionRef('overview')}
          id="overview"
          data-section-id="overview"
          className="glass-card scroll-mt-24"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Overview
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink('overview')}
              className="gap-2"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copiedSection === 'overview' ? 'Copied!' : 'Copy Link'}
            </Button>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Deep linking allows users to navigate directly to a specific section of a page
              using URL hash fragments (e.g., <code>/case/123#documents</code>).
            </p>
            <h4>Benefits:</h4>
            <ul>
              <li>Share links to specific content within a page</li>
              <li>Bookmark specific sections for quick access</li>
              <li>Improve navigation in long pages</li>
              <li>Better user experience with smooth scrolling</li>
            </ul>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card
          ref={getSectionRef('features')}
          id="features"
          data-section-id="features"
          className="glass-card scroll-mt-24"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-green-500" />
              Features
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink('features')}
              className="gap-2"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copiedSection === 'features' ? 'Copied!' : 'Copy Link'}
            </Button>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>Implemented Features:</h4>
            <ul>
              <li><strong>URL Hash Navigation:</strong> Sections are linked via URL hash fragments</li>
              <li><strong>Smooth Scrolling:</strong> Animated scroll to target sections</li>
              <li><strong>Visual Highlighting:</strong> Target section is highlighted temporarily</li>
              <li><strong>Copy Link:</strong> One-click copy of section links to clipboard</li>
              <li><strong>Section Navigation:</strong> Dropdown or inline navigation component</li>
              <li><strong>Offset Support:</strong> Accounts for fixed headers</li>
            </ul>
          </CardContent>
        </Card>

        {/* Usage Section */}
        <Card
          ref={getSectionRef('usage')}
          id="usage"
          data-section-id="usage"
          className="glass-card scroll-mt-24"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-purple-500" />
              Usage
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink('usage')}
              className="gap-2"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copiedSection === 'usage' ? 'Copied!' : 'Copy Link'}
            </Button>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h4>How to Use:</h4>
            <ol>
              <li>Import the <code>useDeepLink</code> hook</li>
              <li>Define your sections with <code>id</code> and <code>label</code></li>
              <li>Use <code>getSectionRef</code> to attach refs to section elements</li>
              <li>Add <code>id</code> and <code>data-section-id</code> attributes to sections</li>
              <li>Use <code>SectionLinks</code> component for navigation UI</li>
            </ol>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
{`const sections = [
  { id: 'section-1', label: 'Section 1' },
  { id: 'section-2', label: 'Section 2' },
]

const { scrollToSection, getSectionRef } = useDeepLink({
  sections,
  offsetTop: 96,
})

return (
  <div
    ref={getSectionRef('section-1')}
    id="section-1"
    data-section-id="section-1"
  >
    Content here...
  </div>
)`}
            </pre>
          </CardContent>
        </Card>

        {/* Examples Section */}
        <Card
          ref={getSectionRef('examples')}
          id="examples"
          data-section-id="examples"
          className="glass-card scroll-mt-24"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-orange-500" />
              Examples
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink('examples')}
              className="gap-2"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copiedSection === 'examples' ? 'Copied!' : 'Copy Link'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Try these example links (click to navigate):
              </p>
              <div className="grid gap-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <code className="text-sm text-blue-600 dark:text-blue-400">
                      {`${window.location.pathname}#${section.id}`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => scrollToSection(section.id)}
                    >
                      Go to {section.label}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Section Indicator */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Section:
          </p>
          <p className="font-mono text-lg text-blue-600 dark:text-blue-400">
            {activeSection || 'None'}
          </p>
        </div>
      </div>
    </div>
  )
}
