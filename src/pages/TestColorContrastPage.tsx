/**
 * Test Color Contrast Page
 *
 * Demonstrates WCAG AA color contrast compliance across all components
 */

import { useState } from 'react'
import {
  getContrastRatio,
  meetsWCAG_AA,
  formatContrastRatio,
  getWCAGLevel,
  WCAG_COLORS,
} from '../utils/colorContrast'
import DocumentStatusBadge from '../components/status/DocumentStatusBadge'
import type { DocumentStatus } from '../types'

export default function TestColorContrastPage() {
  const [darkMode, setDarkMode] = useState(false)

  // Sample color pairs to test
  const colorPairs = [
    { name: 'Primary Button', bg: '#1E40AF', fg: '#FFFFFF' },
    { name: 'Success Text', bg: '#FFFFFF', fg: '#065F46' },
    { name: 'Warning Text', bg: '#FFFFFF', fg: '#92400E' },
    { name: 'Error Text', bg: '#FFFFFF', fg: '#991B1B' },
    { name: 'Body Text', bg: '#FFFFFF', fg: '#111827' },
    { name: 'Muted Text', bg: '#FFFFFF', fg: '#4B5563' },
    { name: 'Dark Mode Text', bg: '#111827', fg: '#F9FAFB' },
    { name: 'Dark Mode Muted', bg: '#111827', fg: '#D1D5DB' },
    { name: 'Primary Dark', bg: '#111827', fg: '#93C5FD' },
    { name: 'Success Dark', bg: '#111827', fg: '#6EE7B7' },
    { name: 'Warning Dark', bg: '#111827', fg: '#FCD34D' },
    { name: 'Error Dark', bg: '#111827', fg: '#FCA5A5' },
  ]

  const statuses: DocumentStatus[] = [
    'uploaded',
    'processing',
    'processed',
    'needs_review',
    'approved',
    'failed',
  ]

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Color Contrast Accessibility</h1>
              <p className="text-gray-600 dark:text-gray-300">
                WCAG 2.1 AA Compliance Testing (4.5:1 minimum for normal text)
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn-primary"
              aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

          {/* WCAG Standards Reference */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">WCAG 2.1 Standards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Level AA (Required)</h3>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Normal text: <strong>4.5:1</strong> minimum</li>
                  <li>• Large text (18pt+): <strong>3:1</strong> minimum</li>
                  <li>• UI components: <strong>3:1</strong> minimum</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Level AAA (Enhanced)</h3>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Normal text: <strong>7:1</strong> minimum</li>
                  <li>• Large text (18pt+): <strong>4.5:1</strong> minimum</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Color Contrast Checker */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Color Pair Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-3 px-4">Color Pair</th>
                    <th className="text-left py-3 px-4">Foreground</th>
                    <th className="text-left py-3 px-4">Background</th>
                    <th className="text-center py-3 px-4">Contrast Ratio</th>
                    <th className="text-center py-3 px-4">WCAG Level</th>
                    <th className="text-center py-3 px-4">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {colorPairs.map((pair, index) => {
                    const ratio = getContrastRatio(pair.fg, pair.bg)
                    const level = getWCAGLevel(ratio)
                    const passes = meetsWCAG_AA(pair.fg, pair.bg)

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 font-medium">{pair.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: pair.fg }}
                              aria-label={`Color ${pair.fg}`}
                            />
                            <span className="text-xs font-mono">{pair.fg}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: pair.bg }}
                              aria-label={`Color ${pair.bg}`}
                            />
                            <span className="text-xs font-mono">{pair.bg}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {formatContrastRatio(ratio)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`badge ${
                              level === 'AAA'
                                ? 'badge-success'
                                : level === 'AA'
                                ? 'badge-info'
                                : 'badge-error'
                            }`}
                          >
                            {level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div
                            className="inline-block px-3 py-1 rounded"
                            style={{
                              backgroundColor: pair.bg,
                              color: pair.fg,
                            }}
                          >
                            Sample Text
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Badges Test */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Status Badge Components</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {statuses.map((status) => (
                  <DocumentStatusBadge key={status} status={status} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {statuses.map((status) => (
                  <DocumentStatusBadge key={status} status={status} size="lg" />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {statuses.map((status) => (
                  <DocumentStatusBadge key={status} status={status} size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Button Variants Test */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Button Components</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary">Primary Button</button>
                <button className="btn-primary-outline">Primary Outline</button>
                <button className="btn-primary-ghost">Primary Ghost</button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="btn-secondary">Secondary Button</button>
                <button className="btn-secondary-outline">Secondary Outline</button>
                <button className="btn-secondary-ghost">Secondary Ghost</button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="btn-danger">Danger Button</button>
                <button className="btn-danger-outline">Danger Outline</button>
                <button className="btn-danger-ghost">Danger Ghost</button>
              </div>
            </div>
          </div>

          {/* Text Variations */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Text Variations</h2>
            <div className="space-y-3">
              <p className="text-gray-900 dark:text-gray-50">
                <strong>Primary Text:</strong> This is the main body text with maximum
                contrast for readability.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Secondary Text:</strong> This is muted text that still meets WCAG
                AA standards.
              </p>
              <p className="confidence-high">
                <strong>Success/High Confidence:</strong> Positive status indicator with
                green color.
              </p>
              <p className="confidence-medium">
                <strong>Warning/Medium Confidence:</strong> Caution indicator with amber
                color.
              </p>
              <p className="confidence-low">
                <strong>Error/Low Confidence:</strong> Alert indicator with red color.
              </p>
            </div>
          </div>

          {/* WCAG Predefined Colors */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">
              Predefined WCAG-Compliant Colors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(WCAG_COLORS).map(([key, modes]) => (
                <div key={key} className="space-y-2">
                  <h3 className="font-medium capitalize">{key}</h3>
                  <div className="space-y-2">
                    <div
                      className="p-3 rounded"
                      style={{
                        backgroundColor: modes.light.bg,
                        color: modes.light.text,
                      }}
                    >
                      Light Mode Sample
                    </div>
                    <div
                      className="p-3 rounded"
                      style={{
                        backgroundColor: modes.dark.bg,
                        color: modes.dark.text,
                      }}
                    >
                      Dark Mode Sample
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility Features Summary */}
          <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-700 dark:border-blue-400">
            <h2 className="text-xl font-semibold mb-4">
              ✅ Accessibility Features Implemented
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• All text meets WCAG 2.1 AA contrast ratio (4.5:1 minimum)</li>
              <li>• UI components meet 3:1 contrast requirement</li>
              <li>• Dark mode with accessible color palette</li>
              <li>• ARIA labels for interactive elements</li>
              <li>• Screen reader support with sr-only utility class</li>
              <li>• Semantic HTML with proper roles</li>
              <li>• Focus indicators for keyboard navigation</li>
              <li>• Reduced motion support via CSS media queries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
