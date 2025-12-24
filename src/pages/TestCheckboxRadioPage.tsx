import { useState } from 'react'
import { motion } from 'framer-motion'

export default function TestCheckboxRadioPage() {
  // Checkbox states
  const [defaultChecked, setDefaultChecked] = useState(true)
  const [primaryChecked, setPrimaryChecked] = useState(false)
  const [successChecked, setSuccessChecked] = useState(true)
  const [warningChecked, setWarningChecked] = useState(false)
  const [dangerChecked, setDangerChecked] = useState(false)
  const [customChecked, setCustomChecked] = useState(true)
  const [largeChecked, setLargeChecked] = useState(false)

  // Multi-select checkbox group
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    push: true,
    newsletter: false,
  })

  // Radio states
  const [selectedColor, setSelectedColor] = useState('blue')
  const [selectedSize, setSelectedSize] = useState('medium')
  const [selectedPayment, setSelectedPayment] = useState('credit')
  const [selectedTheme, setSelectedTheme] = useState('light')

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Checkbox & Radio Button Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Custom styled checkbox and radio button components with variants
          </p>
        </motion.div>

        {/* Checkboxes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Checkboxes
          </h2>

          <div className="space-y-8">
            {/* Basic Checkbox */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Checkbox
              </h3>
              <div className="space-y-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={defaultChecked}
                    onChange={(e) => setDefaultChecked(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Default checkbox
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox"
                    disabled
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Disabled checkbox
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked
                    disabled
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Disabled checked
                  </span>
                </label>
              </div>
            </div>

            {/* Color Variants */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Color Variants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-primary"
                    checked={primaryChecked}
                    onChange={(e) => setPrimaryChecked(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Primary (Blue)
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-success"
                    checked={successChecked}
                    onChange={(e) => setSuccessChecked(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Success (Green)
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-warning"
                    checked={warningChecked}
                    onChange={(e) => setWarningChecked(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Warning (Amber)
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-danger"
                    checked={dangerChecked}
                    onChange={(e) => setDangerChecked(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Danger (Red)
                  </span>
                </label>
              </div>
            </div>

            {/* Custom Styled Checkbox */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Custom Styled Checkbox
              </h3>
              <div className="space-y-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={customChecked}
                    onChange={(e) => setCustomChecked(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Custom checkbox with checkmark icon
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    disabled
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Disabled custom checkbox
                  </span>
                </label>
              </div>
            </div>

            {/* Large Checkbox */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Large Checkbox
              </h3>
              <div className="space-y-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-lg"
                    checked={largeChecked}
                    onChange={(e) => setLargeChecked(e.target.checked)}
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Larger checkbox (20px)
                  </span>
                </label>
              </div>
            </div>

            {/* Checkbox Group Example */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Checkbox Group - Notification Preferences
              </h3>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-primary"
                    checked={preferences.email}
                    onChange={() => handlePreferenceChange('email')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Email notifications
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-primary"
                    checked={preferences.sms}
                    onChange={() => handlePreferenceChange('sms')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    SMS notifications
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-primary"
                    checked={preferences.push}
                    onChange={() => handlePreferenceChange('push')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Push notifications
                  </span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-primary"
                    checked={preferences.newsletter}
                    onChange={() => handlePreferenceChange('newsletter')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Newsletter subscription
                  </span>
                </label>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {Object.entries(preferences)
                      .filter(([, value]) => value)
                      .map(([key]) => key)
                      .join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Radio Buttons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Radio Buttons
          </h2>

          <div className="space-y-8">
            {/* Basic Radio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Radio Group
              </h3>
              <div className="space-y-3">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="color"
                    className="radio"
                    value="blue"
                    checked={selectedColor === 'blue'}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Blue
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="color"
                    className="radio"
                    value="green"
                    checked={selectedColor === 'green'}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Green
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="color"
                    className="radio"
                    value="red"
                    checked={selectedColor === 'red'}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Red
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="color"
                    className="radio"
                    disabled
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Disabled option
                  </span>
                </label>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected color: <span className="font-medium">{selectedColor}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Color Variants */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Color Variants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="size"
                    className="radio-primary"
                    value="small"
                    checked={selectedSize === 'small'}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Small (Primary)
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="size"
                    className="radio-success"
                    value="medium"
                    checked={selectedSize === 'medium'}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Medium (Success)
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="size"
                    className="radio-warning"
                    value="large"
                    checked={selectedSize === 'large'}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Large (Warning)
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="size"
                    className="radio-danger"
                    value="xlarge"
                    checked={selectedSize === 'xlarge'}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    X-Large (Danger)
                  </span>
                </label>
              </div>
            </div>

            {/* Custom Styled Radio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Custom Styled Radio
              </h3>
              <div className="space-y-3">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="payment"
                    className="radio-custom"
                    value="credit"
                    checked={selectedPayment === 'credit'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Credit Card
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="payment"
                    className="radio-custom"
                    value="debit"
                    checked={selectedPayment === 'debit'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Debit Card
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="payment"
                    className="radio-custom"
                    value="paypal"
                    checked={selectedPayment === 'paypal'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    PayPal
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="payment"
                    className="radio-custom"
                    disabled
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Disabled payment option
                  </span>
                </label>
              </div>
            </div>

            {/* Large Radio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Large Radio Buttons
              </h3>
              <div className="space-y-3">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="theme"
                    className="radio radio-lg"
                    value="light"
                    checked={selectedTheme === 'light'}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Light Theme
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="theme"
                    className="radio radio-lg"
                    value="dark"
                    checked={selectedTheme === 'dark'}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Dark Theme
                  </span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="theme"
                    className="radio radio-lg"
                    value="auto"
                    checked={selectedTheme === 'auto'}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Auto (System)
                  </span>
                </label>
              </div>
            </div>

            {/* Card-style Radio Group */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Card-Style Radio Group
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Starter', 'Professional', 'Enterprise'].map((plan) => (
                  <label
                    key={plan}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedSize === plan.toLowerCase()
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="plan"
                        className="radio-primary mt-0.5"
                        value={plan.toLowerCase()}
                        checked={selectedSize === plan.toLowerCase()}
                        onChange={(e) => setSelectedSize(e.target.value)}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {plan}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {plan === 'Starter' && 'Perfect for small teams'}
                          {plan === 'Professional' && 'Best for growing businesses'}
                          {plan === 'Enterprise' && 'Advanced features for large organizations'}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Form Example
          </h2>

          <form className="space-y-6">
            {/* Terms and Conditions */}
            <div className="space-y-3">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-primary"
                  required
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    terms and conditions
                  </a>
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I want to receive marketing emails
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Remember me on this device
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="submit" className="btn-primary">
                Submit Form
              </button>
            </div>
          </form>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Usage Examples
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Basic Checkbox
              </h3>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<label className="checkbox-label">
  <input
    type="checkbox"
    className="checkbox"
    checked={isChecked}
    onChange={(e) => setIsChecked(e.target.checked)}
  />
  <span>Label text</span>
</label>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Color Variants
              </h3>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<input type="checkbox" className="checkbox-primary" />
<input type="checkbox" className="checkbox-success" />
<input type="checkbox" className="checkbox-warning" />
<input type="checkbox" className="checkbox-danger" />`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Custom Styled
              </h3>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<input type="checkbox" className="checkbox-custom" />
<input type="radio" className="radio-custom" />`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Large Size
              </h3>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<input type="checkbox" className="checkbox checkbox-lg" />
<input type="radio" className="radio radio-lg" />`}
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
