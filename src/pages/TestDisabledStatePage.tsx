import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Checkbox } from '../components/ui/checkbox'
import { Label } from '../components/ui/label'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'

export default function TestDisabledStatePage() {
  const [isFormDisabled, setIsFormDisabled] = useState(true)
  const [selectedOption, setSelectedOption] = useState('option1')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Disabled State Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive demonstration of disabled states across all UI components
          </p>
        </motion.div>

        {/* Toggle Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Interactive Demo</CardTitle>
              <CardDescription>
                Toggle the form state to see disabled styling in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setIsFormDisabled(!isFormDisabled)}
                  variant={isFormDisabled ? 'default' : 'outline'}
                >
                  {isFormDisabled ? 'Enable Form' : 'Disable Form'}
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Form is currently: <strong>{isFormDisabled ? 'Disabled' : 'Enabled'}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Buttons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                All button variants with disabled state styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Enabled vs Disabled Comparison
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Enabled</p>
                    <div className="flex flex-wrap gap-2">
                      <Button>Primary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Danger</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Disabled</p>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled>Primary</Button>
                      <Button variant="outline" disabled>Outline</Button>
                      <Button variant="ghost" disabled>Ghost</Button>
                      <Button variant="destructive" disabled>Danger</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  CSS Utility Classes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Enabled</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-primary">Primary</button>
                      <button className="btn-primary-outline">Outline</button>
                      <button className="btn-primary-ghost">Ghost</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Disabled</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-primary" disabled>Primary</button>
                      <button className="btn-primary-outline" disabled>Outline</button>
                      <button className="btn-primary-ghost" disabled>Ghost</button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form Inputs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
              <CardDescription>
                Text inputs, textareas, and select dropdowns with disabled styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Enabled Column */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Enabled</p>

                  <div className="space-y-2">
                    <Label htmlFor="enabled-input">Text Input</Label>
                    <Input id="enabled-input" placeholder="Type something..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enabled-textarea">Textarea</Label>
                    <Textarea id="enabled-textarea" placeholder="Enter your message..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Dropdown</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Disabled Column */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Disabled</p>

                  <div className="space-y-2">
                    <Label htmlFor="disabled-input" className="text-gray-400 dark:text-gray-500">Text Input</Label>
                    <Input id="disabled-input" placeholder="Type something..." disabled defaultValue="Disabled value" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disabled-textarea" className="text-gray-400 dark:text-gray-500">Textarea</Label>
                    <Textarea id="disabled-textarea" placeholder="Enter your message..." disabled defaultValue="This textarea is disabled" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 dark:text-gray-500">Select Dropdown</Label>
                    <Select disabled>
                      <SelectTrigger disabled>
                        <SelectValue placeholder="Disabled select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Checkboxes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Checkboxes</CardTitle>
              <CardDescription>
                Checkbox components with disabled state styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Enabled Column */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Enabled</p>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="enabled-unchecked" />
                    <Label htmlFor="enabled-unchecked" className="cursor-pointer">
                      Unchecked checkbox
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="enabled-checked" defaultChecked />
                    <Label htmlFor="enabled-checked" className="cursor-pointer">
                      Checked checkbox
                    </Label>
                  </div>
                </div>

                {/* Disabled Column */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Disabled</p>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="disabled-unchecked" disabled />
                    <Label htmlFor="disabled-unchecked" className="text-gray-400 dark:text-gray-500 cursor-not-allowed">
                      Disabled unchecked
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="disabled-checked" defaultChecked disabled />
                    <Label htmlFor="disabled-checked" className="text-gray-400 dark:text-gray-500 cursor-not-allowed">
                      Disabled checked
                    </Label>
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
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Radio Buttons</CardTitle>
              <CardDescription>
                Radio button groups with disabled state styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Enabled Column */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Enabled</p>

                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="enabled-radio-1" />
                      <Label htmlFor="enabled-radio-1" className="cursor-pointer">
                        Option 1
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="enabled-radio-2" />
                      <Label htmlFor="enabled-radio-2" className="cursor-pointer">
                        Option 2
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option3" id="enabled-radio-3" />
                      <Label htmlFor="enabled-radio-3" className="cursor-pointer">
                        Option 3
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Disabled Column */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Disabled</p>

                  <RadioGroup defaultValue="disabled-option1" disabled>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="disabled-option1" id="disabled-radio-1" disabled />
                      <Label htmlFor="disabled-radio-1" className="text-gray-400 dark:text-gray-500 cursor-not-allowed">
                        Disabled selected
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="disabled-option2" id="disabled-radio-2" disabled />
                      <Label htmlFor="disabled-radio-2" className="text-gray-400 dark:text-gray-500 cursor-not-allowed">
                        Disabled option
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="disabled-option3" id="disabled-radio-3" disabled />
                      <Label htmlFor="disabled-radio-3" className="text-gray-400 dark:text-gray-500 cursor-not-allowed">
                        Disabled option
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Interactive Form Demo</CardTitle>
              <CardDescription>
                Use the toggle above to enable/disable this entire form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="demo-name"
                      className={isFormDisabled ? 'text-gray-400 dark:text-gray-500' : ''}
                    >
                      Full Name
                    </Label>
                    <Input
                      id="demo-name"
                      placeholder="John Doe"
                      disabled={isFormDisabled}
                      defaultValue="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="demo-email"
                      className={isFormDisabled ? 'text-gray-400 dark:text-gray-500' : ''}
                    >
                      Email Address
                    </Label>
                    <Input
                      id="demo-email"
                      type="email"
                      placeholder="john@example.com"
                      disabled={isFormDisabled}
                      defaultValue="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="demo-message"
                    className={isFormDisabled ? 'text-gray-400 dark:text-gray-500' : ''}
                  >
                    Message
                  </Label>
                  <Textarea
                    id="demo-message"
                    placeholder="Your message here..."
                    disabled={isFormDisabled}
                    defaultValue="This is a sample message that demonstrates how disabled textareas look."
                  />
                </div>

                <div className="space-y-2">
                  <Label className={isFormDisabled ? 'text-gray-400 dark:text-gray-500' : ''}>
                    Category
                  </Label>
                  <Select disabled={isFormDisabled}>
                    <SelectTrigger disabled={isFormDisabled}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="demo-terms" disabled={isFormDisabled} />
                  <Label
                    htmlFor="demo-terms"
                    className={isFormDisabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
                  >
                    I agree to the terms and conditions
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isFormDisabled}>
                    Submit Form
                  </Button>
                  <Button type="button" variant="outline" disabled={isFormDisabled}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* CSS Classes Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Disabled State CSS Classes</CardTitle>
              <CardDescription>
                Reference for disabled state styling implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Tailwind Utilities Used
                  </h3>
                  <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`/* Base disabled styles */
disabled:opacity-50
disabled:cursor-not-allowed
disabled:pointer-events-none

/* Input specific */
disabled:bg-gray-100 dark:disabled:bg-gray-700
disabled:border-gray-200 dark:disabled:border-gray-600
disabled:text-gray-400 dark:disabled:text-gray-500

/* Label with peer selector */
peer-disabled:cursor-not-allowed
peer-disabled:opacity-50
peer-disabled:text-gray-400 dark:peer-disabled:text-gray-500`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    CSS Utility Class
                  </h3>
                  <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`/* Apply to labels when their input is disabled */
.label-disabled {
  @apply opacity-50 cursor-not-allowed
         text-gray-400 dark:text-gray-500;
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
