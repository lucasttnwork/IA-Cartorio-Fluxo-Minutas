import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  formatCurrency,
  parseCurrency,
  formatCurrencyInput,
  formatCurrencyCompact,
  formatCurrencyRange,
  isValidCurrency
} from '../utils'

export default function TestCurrencyPage() {
  const [inputValue, setInputValue] = useState('')
  const [parsedValue, setParsedValue] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setInputValue(formatted)
    setParsedValue(parseCurrency(formatted))
  }

  // Test values
  const testValues = [
    1234.56,
    1234567.89,
    999.99,
    1000000,
    50.5,
    0.99,
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Currency Formatting Test (BRL)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Testing Brazilian Real (BRL) currency formatting utilities
          </p>
        </div>

        {/* Interactive Input Test */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Interactive Input Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency-input">
                Type a number (auto-formatted as you type)
              </Label>
              <Input
                id="currency-input"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Formatted Input</p>
                <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                  {inputValue || '-'}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Parsed Value</p>
                <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                  {parsedValue !== null ? parsedValue : '-'}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Standard Format</p>
                <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                  {parsedValue !== null ? formatCurrency(parsedValue) : '-'}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Is Valid?</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isValidCurrency(inputValue) ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Format Examples */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Format Examples</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Standard
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Compact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    No Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Integer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {testValues.map((value, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {value}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {formatCurrency(value, 'standard')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {formatCurrency(value, 'compact')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {formatCurrency(value, 'noSymbol')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {formatCurrency(value, 'integer')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        </Card>

        {/* Additional Functions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Additional Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                formatCurrencyCompact()
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1,234</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {formatCurrencyCompact(1234)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1,234,567</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {formatCurrencyCompact(1234567)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1,234,567,890</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {formatCurrencyCompact(1234567890)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                formatCurrencyRange()
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">100,000 - 500,000</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {formatCurrencyRange(100000, 500000)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1,000,000 - 5,000,000 (compact)</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {formatCurrencyRange(1000000, 5000000, 'compact')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                parseCurrency() Examples
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">"R$ 1.234,56"</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    → {parseCurrency('R$ 1.234,56')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">"1.234,56"</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    → {parseCurrency('1.234,56')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">"1234,56"</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    → {parseCurrency('1234,56')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">"invalid"</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    → {parseCurrency('invalid') === null ? 'null' : parseCurrency('invalid')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
