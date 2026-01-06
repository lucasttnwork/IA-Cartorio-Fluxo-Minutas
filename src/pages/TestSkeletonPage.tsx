import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export default function TestSkeletonPage() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Skeleton Loading States Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Testing skeleton loading components with different variants
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => setIsLoading(true)}
          variant={isLoading ? "default" : "outline"}
        >
          Show Loading
        </Button>
        <Button
          onClick={() => setIsLoading(false)}
          variant={!isLoading ? "default" : "outline"}
        >
          Show Content
        </Button>
      </div>

      {/* Case Card Grid */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Case Card Skeletons
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="mt-2 h-4 w-1/3" />
                    <Skeleton className="mt-3 h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
                        Case Title {index + 1}
                      </h3>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Purchase & Sale
                    </p>
                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                      Created 2 days ago
                    </p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Entity Table Skeletons */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Entity Table Skeletons
        </h2>
        {isLoading ? (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-4 w-48" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                      <Skeleton className="h-6 flex-1" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing 5 of 5 entities
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <input type="checkbox" className="h-4 w-4" />
                      <Badge variant="outline">Person</Badge>
                      <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                        Entity {index + 1}
                      </div>
                      <Badge>95%</Badge>
                      <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                        Context information
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skeleton Variants */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Skeleton Variants
        </h2>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Different Skeleton Shapes</CardTitle>
            <CardDescription>
              Testing default, circular, and text skeleton variants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Rectangle
              </h3>
              <Skeleton className="h-12 w-full" />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Circular (Avatar)
              </h3>
              <div className="flex gap-3">
                <Skeleton variant="circular" className="h-12 w-12" />
                <Skeleton variant="circular" className="h-16 w-16" />
                <Skeleton variant="circular" className="h-20 w-20" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Lines
              </h3>
              <div className="space-y-2">
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-5/6" />
                <Skeleton variant="text" className="w-4/6" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Card
              </h3>
              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Skeleton variant="circular" className="h-16 w-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-1/2" />
                  <Skeleton variant="text" className="w-3/4" />
                  <Skeleton className="h-8 w-24 mt-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
