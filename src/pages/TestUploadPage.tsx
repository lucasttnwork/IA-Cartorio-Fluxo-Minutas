/**
 * Test page for verifying the DocumentDropzone component in isolation.
 * This page bypasses authentication for UI testing purposes.
 *
 * Access at: /test-upload
 *
 * NOTE: This page should only be available in development mode.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import DocumentDropzone, { UploadResult } from '../components/upload/DocumentDropzone'
import type { Document, DocumentStatus, DocumentType } from '../types'

// Status badge styling
const statusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircleIcon }> = {
  uploaded: {
    label: 'Uploaded',
    variant: 'secondary',
    icon: ClockIcon,
  },
  processing: {
    label: 'Processing',
    variant: 'outline',
    icon: ArrowPathIcon,
  },
  processed: {
    label: 'Processed',
    variant: 'default',
    icon: CheckCircleIcon,
  },
  needs_review: {
    label: 'Needs Review',
    variant: 'outline',
    icon: ExclamationCircleIcon,
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    icon: CheckCircleIcon,
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    icon: ExclamationCircleIcon,
  },
}

// Document type labels
const documentTypeLabels: Record<DocumentType, string> = {
  cnh: 'Driver\'s License (CNH)',
  rg: 'ID Card (RG)',
  marriage_cert: 'Marriage Certificate',
  deed: 'Property Deed',
  proxy: 'Power of Attorney',
  iptu: 'Property Tax (IPTU)',
  birth_cert: 'Birth Certificate',
  other: 'Other Document',
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TestUploadPage() {
  const [uploadedDocs, setUploadedDocs] = useState<Document[]>([])
  const testCaseId = 'test-case-123'

  // Handle upload completion
  const handleUploadComplete = useCallback((results: UploadResult[]) => {
    const successfulUploads = results.filter((r) => r.success)

    successfulUploads.forEach((result) => {
      const newDoc: Document = {
        id: result.document_id || `doc_${Date.now()}`,
        case_id: testCaseId,
        storage_path: result.storage_path || '',
        original_name: result.file_name,
        mime_type: result.file_name.endsWith('.pdf')
          ? 'application/pdf'
          : result.file_name.endsWith('.png')
          ? 'image/png'
          : 'image/jpeg',
        file_size: Math.floor(Math.random() * 5000000), // Mock file size
        page_count: Math.floor(Math.random() * 10) + 1,
        status: 'uploaded',
        doc_type: null,
        doc_type_confidence: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setUploadedDocs((prev) => [...prev, newDoc])
    })
  }, [])

  // Remove document
  const handleRemoveDocument = useCallback((docId: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== docId))
  }, [])

  // Get document icon based on mime type
  const getDocumentIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <DocumentIcon className="w-5 h-5 text-red-500" />
        </div>
      )
    }
    if (mimeType.startsWith('image/')) {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <DocumentIcon className="w-5 h-5 text-blue-500" />
        </div>
      )
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <DocumentIcon className="w-5 h-5 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-2">
            Development Test Page
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Upload - UI Test
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Test the bulk document upload feature with drag-and-drop functionality.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentDropzone
              caseId={testCaseId}
              onUploadComplete={handleUploadComplete}
            />
          </CardContent>
        </Card>

        {/* Uploaded Documents List */}
        <Card className="glass-card">
          <CardHeader>
            <div>
              <CardTitle>Uploaded Documents</CardTitle>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {uploadedDocs.length} document{uploadedDocs.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">

          <AnimatePresence mode="popLayout">
            {uploadedDocs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <FolderOpenIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No documents uploaded yet
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Start by dragging and dropping documents into the upload area above, or click to browse files.
                </p>
              </motion.div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {uploadedDocs.map((doc, index) => {
                  const statusInfo = statusConfig[doc.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <motion.li
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Document Icon */}
                        {getDocumentIcon(doc.mime_type)}

                        {/* Document Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {doc.original_name}
                            </p>
                            <Badge variant={statusInfo.variant}>
                              <StatusIcon
                                className={`w-3 h-3 mr-1 ${
                                  doc.status === 'processing' ? 'animate-spin' : ''
                                }`}
                              />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(doc.file_size)}
                            </span>
                            {doc.page_count && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.page_count} page{doc.page_count !== 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(doc.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="View document"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove document"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </AnimatePresence>
          </CardContent>
        </Card>

        {/* Feature Checklist */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Feature Checklist</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              'Drag & drop multiple files',
              'Click to browse files',
              'File type validation (PDF, JPG, PNG, TIFF, WebP)',
              'File size validation (max 10MB)',
              'Upload progress indicators',
              'File queue management',
              'Remove files before upload',
              'Clear all files option',
              'Success/error status display',
              'Uploaded documents list',
              'Animated transitions',
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>

        {/* Supported File Types Info */}
        <Card className="glass-card border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Supported Document Types
            </h3>
          </CardHeader>
          <CardContent>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(documentTypeLabels).map(([type, label]) => (
              <div
                key={type}
                className="text-xs text-blue-700 dark:text-blue-300"
              >
                • {label}
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
