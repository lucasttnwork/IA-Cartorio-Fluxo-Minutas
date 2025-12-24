import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import {
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  XCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'

export default function TestButtonDangerPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Danger Styling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of danger button variants for destructive actions.
          </p>
        </div>

        {/* Danger Button Variants */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Danger Button Variants</CardTitle>
            <CardDescription>
              Three variants available: solid, outline, and ghost for different levels of visual emphasis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive">
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete (Solid)
              </Button>
              <Button variant="outline">
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete (Outline)
              </Button>
              <Button variant="ghost">
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete (Ghost)
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
              <span className="text-sm text-gray-500 w-24">Danger:</span>
              <Button variant="destructive">Danger Action</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">Ghost:</span>
              <Button variant="ghost">Ghost Action</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Buttons with Icons */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Danger Buttons with Icons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive">
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete Item
              </Button>
              <Button variant="destructive">
                <XMarkIcon className="w-5 h-5 mr-2" />
                Cancel Order
              </Button>
              <Button variant="destructive">
                <XCircleIcon className="w-5 h-5 mr-2" />
                Remove User
              </Button>
              <Button variant="destructive">
                <NoSymbolIcon className="w-5 h-5 mr-2" />
                Block Account
              </Button>
              <Button variant="destructive">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Force Reset
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
              <Button variant="destructive" disabled>
                <TrashIcon className="w-5 h-5 mr-2" />
                Disabled (Solid)
              </Button>
              <Button variant="outline" disabled>
                <TrashIcon className="w-5 h-5 mr-2" />
                Disabled (Outline)
              </Button>
              <Button variant="ghost" disabled>
                <TrashIcon className="w-5 h-5 mr-2" />
                Disabled (Ghost)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Use Case: Confirmation Modal */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Confirmation Modal</CardTitle>
            <CardDescription>
              Common pattern for destructive action confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete Case
            </Button>

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
              <DialogContent className="glass-dialog">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <DialogHeader>
                      <DialogTitle>Delete Case</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Are you sure you want to delete this case? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      alert('Case deleted!')
                      setShowDeleteModal(false)
                    }}
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Use Case: Inline Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Inline Actions</CardTitle>
            <CardDescription>
              Ghost and outline variants for less prominent destructive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Document 1.pdf', 'Document 2.pdf', 'Contract.docx'].map((doc) => (
                <div
                  key={doc}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-white">{doc}</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Use Case: Form Cancel */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Use Case: Form Actions</CardTitle>
            <CardDescription>
              Using danger outline for cancel/discard actions in forms.
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
                <XMarkIcon className="w-5 h-5 mr-2" />
                Discard Changes
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Button Sizes (with ShadCN utilities) */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Button Sizes (with ShadCN size prop)</CardTitle>
            <CardDescription>
              Use the size prop for different button dimensions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="destructive" size="sm" className="text-xs">
                Extra Small
              </Button>
              <Button variant="destructive" size="sm">
                Small
              </Button>
              <Button variant="destructive">
                Default
              </Button>
              <Button variant="destructive" size="lg">
                Large
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
