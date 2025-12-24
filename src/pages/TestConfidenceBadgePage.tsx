/**
 * Test page for Confidence Badge Styling
 *
 * This page demonstrates the new enhanced confidence badge styles
 * across different components and contexts.
 */

import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function TestConfidenceBadgePage() {
  const confidenceLevels = [
    { value: 0.95, label: '95%' },
    { value: 0.85, label: '85%' },
    { value: 0.75, label: '75%' },
    { value: 0.65, label: '65%' },
    { value: 0.55, label: '55%' },
    { value: 0.45, label: '45%' },
  ]

  const getConfidenceBadgeClass = (confidence: number): string => {
    if (confidence >= 0.8) return 'confidence-badge-high'
    if (confidence >= 0.6) return 'confidence-badge-medium'
    return 'confidence-badge-low'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Confidence Badge Styling
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enhanced visual design with gradients, borders, and shadows
          </p>
        </div>

        {/* Basic Badge Showcase */}
        <section className="card p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Basic Badge Styles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* High Confidence */}
            <div className="text-center space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                High Confidence (≥80%)
              </h3>
              <div className="flex flex-col items-center gap-3">
                <span className="confidence-badge-high">
                  <CheckCircleIcon className="confidence-badge-icon" />
                  95%
                </span>
                <span className="confidence-badge-high">
                  <CheckCircleIcon className="confidence-badge-icon" />
                  85%
                </span>
                <span className="confidence-badge-high">80%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Green gradient with border and subtle shadow
              </p>
            </div>

            {/* Medium Confidence */}
            <div className="text-center space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Medium Confidence (60-79%)
              </h3>
              <div className="flex flex-col items-center gap-3">
                <span className="confidence-badge-medium">
                  <ExclamationCircleIcon className="confidence-badge-icon" />
                  75%
                </span>
                <span className="confidence-badge-medium">
                  <ExclamationCircleIcon className="confidence-badge-icon" />
                  65%
                </span>
                <span className="confidence-badge-medium">60%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Amber gradient with border and subtle shadow
              </p>
            </div>

            {/* Low Confidence */}
            <div className="text-center space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Low Confidence (&lt;60%)
              </h3>
              <div className="flex flex-col items-center gap-3">
                <span className="confidence-badge-low">
                  <ExclamationCircleIcon className="confidence-badge-icon" />
                  55%
                </span>
                <span className="confidence-badge-low">
                  <ExclamationCircleIcon className="confidence-badge-icon" />
                  45%
                </span>
                <span className="confidence-badge-low">30%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Red gradient with border and subtle shadow
              </p>
            </div>
          </div>
        </section>

        {/* Badge Spectrum */}
        <section className="card p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Confidence Spectrum
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {confidenceLevels.map((level) => (
              <div key={level.value} className="text-center">
                <span className={getConfidenceBadgeClass(level.value)}>
                  {level.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
            Seamless transitions between confidence levels
          </p>
        </section>

        {/* In Context - Entity Table Row */}
        <section className="card overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Entity Table Context
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">João Silva</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">PERSON</td>
                  <td className="px-4 py-3">
                    <span className="confidence-badge-high">95%</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Maria Santos</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">PERSON</td>
                  <td className="px-4 py-3">
                    <span className="confidence-badge-medium">72%</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Rua das Flores, 123</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">ADDRESS</td>
                  <td className="px-4 py-3">
                    <span className="confidence-badge-low">48%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* In Context - Entity Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Entity Card Context
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* High Confidence Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  João Silva
                </h3>
                <span className="confidence-badge-high">
                  <CheckCircleIcon className="confidence-badge-icon" />
                  95%
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500 dark:text-gray-400">CPF: 123.456.789-00</p>
                <p className="text-gray-500 dark:text-gray-400">RG: 12.345.678-9</p>
              </div>
            </div>

            {/* Medium Confidence Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Maria Santos
                </h3>
                <span className="confidence-badge-medium">
                  <ExclamationCircleIcon className="confidence-badge-icon" />
                  68%
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500 dark:text-gray-400">CPF: 987.654.321-00</p>
                <p className="text-gray-500 dark:text-gray-400">RG: Pending</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dark Mode Toggle */}
        <section className="card p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Design Features
          </h2>
          <ul className="text-left max-w-2xl mx-auto space-y-3 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Gradient backgrounds for depth and visual interest</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Subtle borders for definition and clarity</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Consistent sizing with icon support</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>WCAG AA compliant color contrast in both modes</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Smooth transitions and hover effects</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Full dark mode support with adapted shadows</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
