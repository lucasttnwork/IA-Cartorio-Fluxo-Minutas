import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function TestProgressPage() {
  const [progress1, setProgress1] = useState(0)
  const [progress2, setProgress2] = useState(0)
  const [progress3, setProgress3] = useState(0)
  const [progress4, setProgress4] = useState(0)
  const [progress5, setProgress5] = useState(0)

  useEffect(() => {
    // Animate progress bars
    const interval = setInterval(() => {
      setProgress1((prev) => (prev >= 100 ? 0 : prev + 2))
      setProgress2((prev) => (prev >= 100 ? 0 : prev + 3))
      setProgress3((prev) => (prev >= 100 ? 0 : prev + 4))
      setProgress4((prev) => (prev >= 100 ? 0 : prev + 5))
      setProgress5((prev) => (prev >= 100 ? 0 : prev + 2.5))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Progress Bar Styling Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the enhanced Progress component with gradients, animations, and variants
          </p>
        </div>

        {/* Default Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Default Variant</CardTitle>
            <CardDescription>
              Blue gradient with smooth transitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Small Size</span>
                <span className="text-sm text-gray-500">{Math.round(progress1)}%</span>
              </div>
              <Progress value={progress1} size="sm" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Medium Size (Default)</span>
                <span className="text-sm text-gray-500">{Math.round(progress1)}%</span>
              </div>
              <Progress value={progress1} size="md" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Large Size</span>
                <span className="text-sm text-gray-500">{Math.round(progress1)}%</span>
              </div>
              <Progress value={progress1} size="lg" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">With Glow Effect</span>
                <span className="text-sm text-gray-500">{Math.round(progress1)}%</span>
              </div>
              <Progress value={progress1} showGlow />
            </div>
          </CardContent>
        </Card>

        {/* Success Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Success Variant</CardTitle>
            <CardDescription>
              Green gradient for successful operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Upload Complete</span>
                <span className="text-sm text-green-600 dark:text-green-400">{Math.round(progress2)}%</span>
              </div>
              <Progress value={progress2} variant="success" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">With Glow Effect</span>
                <span className="text-sm text-green-600 dark:text-green-400">{Math.round(progress2)}%</span>
              </div>
              <Progress value={progress2} variant="success" showGlow size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Warning Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Warning Variant</CardTitle>
            <CardDescription>
              Yellow/Amber gradient for warnings and pending states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing...</span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">{Math.round(progress3)}%</span>
              </div>
              <Progress value={progress3} variant="warning" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">With Glow Effect</span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">{Math.round(progress3)}%</span>
              </div>
              <Progress value={progress3} variant="warning" showGlow size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Error Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Error Variant</CardTitle>
            <CardDescription>
              Red gradient for errors and failed operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Upload Failed</span>
                <span className="text-sm text-red-600 dark:text-red-400">{Math.round(progress4)}%</span>
              </div>
              <Progress value={progress4} variant="error" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">With Glow Effect</span>
                <span className="text-sm text-red-600 dark:text-red-400">{Math.round(progress4)}%</span>
              </div>
              <Progress value={progress4} variant="error" showGlow size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Gradient Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Gradient Variant</CardTitle>
            <CardDescription>
              Multi-color gradient (blue → purple → pink) for special effects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Rainbow Progress</span>
                <span className="text-sm text-purple-600 dark:text-purple-400">{Math.round(progress5)}%</span>
              </div>
              <Progress value={progress5} variant="gradient" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">With Glow Effect</span>
                <span className="text-sm text-purple-600 dark:text-purple-400">{Math.round(progress5)}%</span>
              </div>
              <Progress value={progress5} variant="gradient" showGlow size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Static Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Static Progress Values</CardTitle>
            <CardDescription>
              Different progress values to test visual appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">25% Complete</span>
                <span className="text-sm text-gray-500">25%</span>
              </div>
              <Progress value={25} variant="default" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">50% Complete</span>
                <span className="text-sm text-gray-500">50%</span>
              </div>
              <Progress value={50} variant="success" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">75% Complete</span>
                <span className="text-sm text-gray-500">75%</span>
              </div>
              <Progress value={75} variant="warning" showGlow />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">100% Complete</span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
              <Progress value={100} variant="gradient" showGlow size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
