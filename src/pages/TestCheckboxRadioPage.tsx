import { useState } from 'react'
import { motion } from 'framer-motion'
import { Checkbox } from '../components/ui/checkbox'
import { Label } from '../components/ui/label'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'

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
  const [selectedPlan, setSelectedPlan] = useState('professional')

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
            ShadCN UI components with glassmorphism styling and dark mode support
          </p>
        </motion.div>

        {/* Checkboxes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Checkboxes</CardTitle>
              <CardDescription>ShadCN Checkbox component with variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Checkbox */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Checkbox
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="default"
                      checked={defaultChecked}
                      onCheckedChange={setDefaultChecked}
                    />
                    <Label
                      htmlFor="default"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Default checkbox
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disabled"
                      disabled
                    />
                    <Label
                      htmlFor="disabled"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Disabled checkbox
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disabled-checked"
                      checked
                      disabled
                    />
                    <Label
                      htmlFor="disabled-checked"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Disabled checked
                    </Label>
                  </div>
                </div>
              </div>

              {/* Color Variants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Color Variants
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="primary"
                      checked={primaryChecked}
                      onCheckedChange={setPrimaryChecked}
                      className="border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label
                      htmlFor="primary"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Primary (Blue)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="success"
                      checked={successChecked}
                      onCheckedChange={setSuccessChecked}
                      className="border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label
                      htmlFor="success"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Success (Green)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="warning"
                      checked={warningChecked}
                      onCheckedChange={setWarningChecked}
                      className="border-amber-500 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <Label
                      htmlFor="warning"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Warning (Amber)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="danger"
                      checked={dangerChecked}
                      onCheckedChange={setDangerChecked}
                      className="border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label
                      htmlFor="danger"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Danger (Red)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Large Checkbox */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Large Checkbox
                </h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="large"
                    checked={largeChecked}
                    onCheckedChange={setLargeChecked}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="large"
                    className="text-base text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Larger checkbox (20px)
                  </Label>
                </div>
              </div>

              {/* Checkbox Group Example */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Checkbox Group - Notification Preferences
                </h3>
                <div className="space-y-3 glass-subtle p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={preferences.email}
                      onCheckedChange={() => handlePreferenceChange('email')}
                    />
                    <Label
                      htmlFor="email"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Email notifications
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms"
                      checked={preferences.sms}
                      onCheckedChange={() => handlePreferenceChange('sms')}
                    />
                    <Label
                      htmlFor="sms"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      SMS notifications
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push"
                      checked={preferences.push}
                      onCheckedChange={() => handlePreferenceChange('push')}
                    />
                    <Label
                      htmlFor="push"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Push notifications
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={preferences.newsletter}
                      onCheckedChange={() => handlePreferenceChange('newsletter')}
                    />
                    <Label
                      htmlFor="newsletter"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Newsletter subscription
                    </Label>
                  </div>

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
            </CardContent>
          </Card>
        </motion.div>

        {/* Radio Buttons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Radio Buttons</CardTitle>
              <CardDescription>ShadCN RadioGroup component with variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Radio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Radio Group
                </h3>
                <RadioGroup value={selectedColor} onValueChange={setSelectedColor}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="blue" id="blue" />
                      <Label htmlFor="blue" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Blue
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="green" id="green" />
                      <Label htmlFor="green" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Green
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="red" id="red" />
                      <Label htmlFor="red" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Red
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="disabled" id="disabled-radio" disabled />
                      <Label htmlFor="disabled-radio" className="text-sm text-gray-700 dark:text-gray-300">
                        Disabled option
                      </Label>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Selected color: <span className="font-medium">{selectedColor}</span>
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Color Variants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Color Variants
                </h3>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="small" className="border-blue-500 text-blue-600" />
                      <Label htmlFor="small" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Small (Primary)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" className="border-green-500 text-green-600" />
                      <Label htmlFor="medium" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Medium (Success)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="large" className="border-amber-500 text-amber-600" />
                      <Label htmlFor="large" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Large (Warning)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="xlarge" id="xlarge" className="border-red-500 text-red-600" />
                      <Label htmlFor="xlarge" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        X-Large (Danger)
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Radio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Methods
                </h3>
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit" id="credit" />
                      <Label htmlFor="credit" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Credit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="debit" id="debit" />
                      <Label htmlFor="debit" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        PayPal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="disabled-payment" id="disabled-payment" disabled />
                      <Label htmlFor="disabled-payment" className="text-sm text-gray-700 dark:text-gray-300">
                        Disabled payment option
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Large Radio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Large Radio Buttons
                </h3>
                <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" className="h-5 w-5" />
                      <Label htmlFor="light" className="text-base text-gray-700 dark:text-gray-300 cursor-pointer">
                        Light Theme
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" className="h-5 w-5" />
                      <Label htmlFor="dark" className="text-base text-gray-700 dark:text-gray-300 cursor-pointer">
                        Dark Theme
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auto" id="auto" className="h-5 w-5" />
                      <Label htmlFor="auto" className="text-base text-gray-700 dark:text-gray-300 cursor-pointer">
                        Auto (System)
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Card-style Radio Group */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Card-Style Radio Group
                </h3>
                <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'starter', label: 'Starter', desc: 'Perfect for small teams' },
                      { value: 'professional', label: 'Professional', desc: 'Best for growing businesses' },
                      { value: 'enterprise', label: 'Enterprise', desc: 'Advanced features for large organizations' }
                    ].map((plan) => (
                      <label
                        key={plan.value}
                        htmlFor={plan.value}
                        className={cn(
                          "cursor-pointer rounded-lg border-2 p-4 transition-all",
                          selectedPlan === plan.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={plan.value} id={plan.value} className="mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {plan.label}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {plan.desc}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Form Example</CardTitle>
              <CardDescription>Practical form with checkboxes</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        terms and conditions
                      </a>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="marketing" />
                    <Label htmlFor="marketing" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      I want to receive marketing emails
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Remember me on this device
                    </Label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button type="submit">
                    Submit Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Usage Examples</CardTitle>
              <CardDescription>Code snippets for reference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Basic Checkbox
                </h3>
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<div className="flex items-center space-x-2">
  <Checkbox
    id="example"
    checked={isChecked}
    onCheckedChange={setIsChecked}
  />
  <Label htmlFor="example">Label text</Label>
</div>`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Color Variants
                </h3>
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<Checkbox className="border-blue-500 data-[state=checked]:bg-blue-600" />
<Checkbox className="border-green-500 data-[state=checked]:bg-green-600" />
<Checkbox className="border-amber-500 data-[state=checked]:bg-amber-600" />
<Checkbox className="border-red-500 data-[state=checked]:bg-red-600" />`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Radio Group
                </h3>
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<RadioGroup value={selected} onValueChange={setSelected}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="opt1" />
    <Label htmlFor="opt1">Option 1</Label>
  </div>
</RadioGroup>`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Large Size
                </h3>
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<Checkbox className="h-5 w-5" />
<RadioGroupItem className="h-5 w-5" />`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
