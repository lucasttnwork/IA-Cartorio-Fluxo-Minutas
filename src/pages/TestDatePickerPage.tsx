/**
 * Test page for Date Picker Styling
 *
 * Demonstrates the styled date input component in both light and dark modes.
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export default function TestDatePickerPage() {
  const [isDark, setIsDark] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  const [eventDate, setEventDate] = useState('2024-12-25')
  const [disabledDate] = useState('2024-01-15')

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Date Picker Styling Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Testing date input styling in light and dark modes
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Date Picker Examples */}
        <div className="space-y-8">
          {/* Basic Date Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Date Input
            </h2>
            <div className="space-y-2">
              <Label htmlFor="birth-date">Data de Nascimento</Label>
              <Input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="Selecione a data"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Valor selecionado: {birthDate || 'Nenhum'}
              </p>
            </div>
          </div>

          {/* Date Input with Value */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Date Input with Pre-filled Value
            </h2>
            <div className="space-y-2">
              <Label htmlFor="event-date">Data do Evento</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Valor selecionado: {eventDate}
              </p>
            </div>
          </div>

          {/* Disabled Date Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Disabled Date Input
            </h2>
            <div className="space-y-2">
              <Label htmlFor="disabled-date">Data (Desabilitado)</Label>
              <Input
                id="disabled-date"
                type="date"
                value={disabledDate}
                disabled
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Este campo está desabilitado
              </p>
            </div>
          </div>

          {/* Multiple Date Inputs (Form-like) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Form with Multiple Date Inputs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data de Início</Label>
                <Input
                  id="start-date"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Data de Término</Label>
                <Input
                  id="end-date"
                  type="date"
                />
              </div>
            </div>
          </div>

          {/* Glass Card Example */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Date Input in Glass Card
            </h2>
            <div className="space-y-2">
              <Label htmlFor="glass-date">Data de Registro</Label>
              <Input
                id="glass-date"
                type="date"
                className="bg-white/50 dark:bg-gray-800/50"
              />
            </div>
          </div>
        </div>

        {/* Styling Notes */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Styling Features
          </h2>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>Calendar icon styling with hover effect</li>
            <li>Dark mode support with color scheme switching</li>
            <li>Individual date field focus highlighting</li>
            <li>Disabled state styling</li>
            <li>Consistent focus ring styling</li>
            <li>Placeholder text styling for empty inputs</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
