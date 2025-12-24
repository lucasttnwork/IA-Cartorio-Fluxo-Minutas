import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Loader2 } from 'lucide-react'
import {
  PlusIcon,
  CheckIcon,
  ArrowRightIcon,
  DocumentPlusIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function TestButtonPrimaryPage() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Primary Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of primary button variants for main actions and call-to-action elements.
          </p>
        </div>

        {/* Primary Button Variants */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Primary Button Variants</CardTitle>
            <CardDescription>
              Three variants available: solid, outline, and ghost for different levels of visual emphasis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button>
                <PlusIcon className="w-5 h-5 mr-2" />
                Create (Solid)
              </Button>
              <Button variant="outline">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create (Outline)
              </Button>
              <Button variant="ghost">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create (Ghost)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comparison with Other Button Types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Button Type Comparison</CardTitle>
            <CardDescription>
              Side-by-side comparison with other button styles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24">Primary:</span>
                <Button>Primary Action</Button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24">Secondary:</span>
                <Button variant="outline">Secondary Action</Button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24">Danger:</span>
                <Button variant="destructive">Danger Action</Button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24">Ghost:</span>
                <Button variant="ghost">Ghost Action</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Buttons with Icons */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Primary Buttons with Icons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button>
                <PlusIcon className="w-5 h-5 mr-2" />
                New Case
              </Button>
              <Button>
                <DocumentPlusIcon className="w-5 h-5 mr-2" />
                Add Document
              </Button>
              <Button>
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                Submit
              </Button>
              <Button>
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Download
              </Button>
              <Button>
                <CheckIcon className="w-5 h-5 mr-2" />
                Confirm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Disabled States */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Disabled States</CardTitle>
            <CardDescription>
              All button variants have proper disabled styling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button disabled>
                <PlusIcon className="w-5 h-5 mr-2" />
                Disabled (Solid)
              </Button>
              <Button variant="outline" disabled>
                <PlusIcon className="w-5 h-5 mr-2" />
                Disabled (Outline)
              </Button>
              <Button variant="ghost" disabled>
                <PlusIcon className="w-5 h-5 mr-2" />
                Disabled (Ghost)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Loading State</CardTitle>
            <CardDescription>
              Primary button with loading indicator for async operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLoadingDemo} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                  Click to Load
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Use Case: Call to Action */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Call to Action</CardTitle>
            <CardDescription>
              Primary buttons for main call-to-action elements.
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Start Your New Case
            </h3>
            <p className="text-blue-100 mb-6">
              Begin processing documents with AI-powered entity resolution.
            </p>
            <button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors">
              Get Started
              <ArrowRightIcon className="w-5 h-5 inline-block ml-2" />
            </button>
          </div>
          </CardContent>
        </Card>

        {/* Use Case: Modal Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Modal Actions</CardTitle>
            <CardDescription>
              Common pattern for modal confirmation with primary action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowModal(true)}>
              <DocumentPlusIcon className="w-5 h-5 mr-2" />
              Open Modal
            </Button>

            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent className="glass-dialog">
                <DialogHeader>
                  <DialogTitle>Create New Case</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Fill in the details to create a new document case.
                  </p>
                  <div>
                    <Label htmlFor="case-title">Case Title</Label>
                    <Input
                      id="case-title"
                      placeholder="Enter case title..."
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        alert('Case created!')
                        setShowModal(false)
                      }}
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Create Case
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Use Case: Form Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Form Actions</CardTitle>
            <CardDescription>
              Using primary button as the main form action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <div className="mb-4">
                <Label htmlFor="case-title-form">Case Title</Label>
                <Input
                  id="case-title-form"
                  defaultValue="Property Sale - 123 Main Street"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  defaultValue="Standard property sale transaction with single buyer and seller."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Sizes */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Button Sizes (with Tailwind utilities)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Combine with Tailwind utilities for different sizes.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary text-xs py-1 px-2">
              Extra Small
            </button>
            <button className="btn-primary text-sm py-1.5 px-3">
              Small
            </button>
            <button className="btn-primary">
              Default
            </button>
            <button className="btn-primary text-lg py-3 px-6">
              Large
            </button>
          </div>
        </section>

        {/* Icon-Only Buttons */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Icon-Only Buttons
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Primary buttons with icons only for compact UI elements.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary p-2">
              <PlusIcon className="w-5 h-5" />
            </button>
            <button className="btn-primary-outline p-2">
              <PlusIcon className="w-5 h-5" />
            </button>
            <button className="btn-primary-ghost p-2">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Variant Comparison */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Primary Variants Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Variant</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Normal</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">With Icon</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Disabled</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Solid</td>
                  <td className="py-4 px-4"><button className="btn-primary">Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary"><PlusIcon className="w-4 h-4 mr-1" />Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary" disabled>Button</button></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Outline</td>
                  <td className="py-4 px-4"><button className="btn-primary-outline">Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-outline"><PlusIcon className="w-4 h-4 mr-1" />Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-outline" disabled>Button</button></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">Ghost</td>
                  <td className="py-4 px-4"><button className="btn-primary-ghost">Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-ghost"><PlusIcon className="w-4 h-4 mr-1" />Button</button></td>
                  <td className="py-4 px-4"><button className="btn-primary-ghost" disabled>Button</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
