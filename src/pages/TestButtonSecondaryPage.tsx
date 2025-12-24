import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import {
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

export default function TestButtonSecondaryPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Secondary Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of secondary button variants for non-primary actions.
          </p>
        </div>

        {/* Secondary Button Variants */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Secondary Button Variants</CardTitle>
            <CardDescription>
              Three variants available: solid, outline, and ghost for different levels of visual emphasis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary">
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Settings (Solid)
              </Button>
              <Button variant="outline">
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Settings (Outline)
              </Button>
              <Button variant="ghost">
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Settings (Ghost)
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
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Primary:</span>
              <Button>Primary Action</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Secondary:</span>
              <Button variant="secondary">Secondary Action</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Sec. Outline:</span>
              <Button variant="outline">Secondary Outline</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Sec. Ghost:</span>
              <Button variant="ghost">Secondary Ghost</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Danger:</span>
              <Button variant="destructive">Danger Action</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Ghost:</span>
              <Button variant="ghost">Ghost Action</Button>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Buttons with Icons */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Secondary Buttons with Icons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary">
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Download
              </Button>
              <Button variant="secondary">
                <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
                Duplicate
              </Button>
              <Button variant="secondary">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Refresh
              </Button>
              <Button variant="secondary">
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filter
              </Button>
              <Button variant="secondary">
                <EllipsisHorizontalIcon className="w-5 h-5 mr-2" />
                More Options
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
              <Button variant="secondary" disabled>
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Disabled (Solid)
              </Button>
              <Button variant="outline" disabled>
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Disabled (Outline)
              </Button>
              <Button variant="ghost" disabled>
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Disabled (Ghost)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Use Case: Modal Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Modal Actions</CardTitle>
            <CardDescription>
              Common pattern for secondary actions alongside primary actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setShowModal(true)}>
              Open Modal
            </Button>

            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent className="glass-dialog">
                <DialogHeader>
                  <DialogTitle>Confirm Action</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Would you like to proceed with this action?
                </p>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      alert('Action confirmed!')
                      setShowModal(false)
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Use Case: Toolbar Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Toolbar Actions</CardTitle>
            <CardDescription>
              Secondary buttons work great in toolbars for auxiliary actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg flex flex-wrap items-center gap-2">
              <Button>
                Save Document
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              <Button variant="ghost">
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Export
              </Button>
              <Button variant="ghost">
                <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
                Duplicate
              </Button>
              <Button variant="ghost">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Use Case: Inline Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Inline Actions</CardTitle>
            <CardDescription>
              Ghost and outline variants for less prominent actions in lists.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Document 1.pdf', 'Document 2.pdf', 'Contract.docx'].map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <span className="text-gray-900 dark:text-white">{doc}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm">
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Use Case: Form Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Form Actions</CardTitle>
            <CardDescription>
              Using secondary outline for cancel actions in forms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="case-title">Case Title</Label>
              <Input
                id="case-title"
                type="text"
                defaultValue="Property Sale - 123 Main Street"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline">
                Cancel
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Button Sizes */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Button Sizes (with Tailwind utilities)</CardTitle>
            <CardDescription>
              Combine with Tailwind utilities for different sizes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" size="sm" className="text-xs">
                Extra Small
              </Button>
              <Button variant="secondary" size="sm">
                Small
              </Button>
              <Button variant="secondary">
                Default
              </Button>
              <Button variant="secondary" size="lg">
                Large
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Icon-only Buttons */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Icon-only Buttons</CardTitle>
            <CardDescription>
              Secondary buttons can be used for icon-only actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="icon">
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <ArrowPathIcon className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
