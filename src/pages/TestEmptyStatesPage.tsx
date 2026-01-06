/**
 * Test page for Empty State Illustrations
 * Displays all empty state variants for visual verification
 */

import EmptyStateIllustration from '../components/common/EmptyStateIllustration'
import { Card, CardContent } from '../components/ui/card'
import { ChatPanel } from '../components/chat/ChatPanel'

export default function TestEmptyStatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Empty State Illustrations
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visual demonstration of all empty state illustration variants
          </p>
        </div>

        {/* Illustration Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Folder Illustration */}
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <EmptyStateIllustration type="folder" className="w-40 h-40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Folder / Cases
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Used when no cases exist
              </p>
            </CardContent>
          </Card>

          {/* Search Illustration */}
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <EmptyStateIllustration type="search" className="w-40 h-40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Used when search returns no results
              </p>
            </CardContent>
          </Card>

          {/* Chat Illustration */}
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <EmptyStateIllustration type="chat" className="w-40 h-40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Used when chat has no messages
              </p>
            </CardContent>
          </Card>

          {/* Upload Illustration */}
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <EmptyStateIllustration type="upload" className="w-40 h-40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload / Document
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Used when no documents uploaded
              </p>
            </CardContent>
          </Card>

          {/* Entity Illustration */}
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <EmptyStateIllustration type="entity" className="w-40 h-40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Entity
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Used when no entities extracted
              </p>
            </CardContent>
          </Card>

          {/* Document Illustration */}
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <EmptyStateIllustration type="document" className="w-40 h-40 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Document
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Generic document illustration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chat Panel Empty State */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Chat Panel Empty State
          </h2>
          <div className="h-[600px]">
            <ChatPanel
              messages={[]}
              onSendMessage={async () => {}}
              isLoading={false}
            />
          </div>
        </div>

        {/* Animation Toggle */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Non-Animated Versions
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div className="text-center">
                <EmptyStateIllustration type="folder" animate={false} className="w-24 h-24 mx-auto" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Folder</p>
              </div>
              <div className="text-center">
                <EmptyStateIllustration type="search" animate={false} className="w-24 h-24 mx-auto" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Search</p>
              </div>
              <div className="text-center">
                <EmptyStateIllustration type="chat" animate={false} className="w-24 h-24 mx-auto" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Chat</p>
              </div>
              <div className="text-center">
                <EmptyStateIllustration type="upload" animate={false} className="w-24 h-24 mx-auto" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Upload</p>
              </div>
              <div className="text-center">
                <EmptyStateIllustration type="entity" animate={false} className="w-24 h-24 mx-auto" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Entity</p>
              </div>
              <div className="text-center">
                <EmptyStateIllustration type="document" animate={false} className="w-24 h-24 mx-auto" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Document</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
