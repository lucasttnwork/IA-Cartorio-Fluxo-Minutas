import ThemeToggle from '@/components/common/ThemeToggle'
import HighContrastToggle from '@/components/common/HighContrastToggle'
import { Button } from '@/components/ui/button'

export default function TestHighContrastModePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      {/* Header with toggles */}
      <header className="mb-8 pb-4 border-b border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            High Contrast Mode Test
          </h1>
          <div className="flex items-center gap-3">
            <HighContrastToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content sections */}
      <div className="space-y-8 max-w-4xl">
        {/* Text samples */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-300 dark:border-gray-600">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Text Contrast Examples
          </h2>
          <div className="space-y-3">
            <p className="text-gray-900 dark:text-white">
              Primary text: This is the main body text that should have high contrast ratio.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Muted text: This is secondary text with slightly lower contrast.
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Link text: This represents interactive elements like links.
            </p>
          </div>
        </section>

        {/* Button samples */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-300 dark:border-gray-600">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Button Contrast Examples
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default" className="btn-primary">
              Primary Button
            </Button>
            <Button variant="secondary" className="btn-secondary">
              Secondary Button
            </Button>
            <Button variant="destructive" className="btn-danger">
              Danger Button
            </Button>
            <Button variant="outline">
              Outline Button
            </Button>
          </div>
        </section>

        {/* Card with borders */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-300 dark:border-gray-600">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Border Visibility Test
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Card 1</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Borders should be clearly visible in high contrast mode.
              </p>
            </div>
            <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Card 2</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All borders use maximum contrast colors.
              </p>
            </div>
          </div>
        </section>

        {/* Status colors */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-300 dark:border-gray-600">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Status Color Contrast
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium">
                Success
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                Operation completed successfully
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                Warning
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                Please review this information
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium">
                Error
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                An error occurred during processing
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                Info
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                Additional information available
              </span>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Testing Instructions
          </h2>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300">
            <li>1. Click the adjustments icon button to toggle high contrast mode</li>
            <li>2. Observe that all text becomes pure black on white (or white on black in dark mode)</li>
            <li>3. Notice that borders become maximum contrast (black or white)</li>
            <li>4. Verify that status colors maintain WCAG AAA compliance</li>
            <li>5. Test with both light and dark themes for full coverage</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
