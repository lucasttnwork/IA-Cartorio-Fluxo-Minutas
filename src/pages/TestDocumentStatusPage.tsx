/**
 * Test page for demonstrating real-time document processing status updates.
 * This page simulates the document processing workflow with live status changes.
 *
 * Access at: /test-document-status
 *
 * NOTE: This page should only be available in development mode.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentIcon,
  TrashIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CpuChipIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { DocumentStatusBadge } from '../components/status/DocumentStatusBadge'
import { ProcessingStatusPanel } from '../components/status/ProcessingStatusPanel'
import type { Document, DocumentStatus, ProcessingJob, JobType, JobStatus } from '../types'
import type { ProcessingJobsState } from '../hooks/useProcessingJobsSubscription'

// Mock document for simulation
interface MockDocument extends Document {
  processingJobs: MockProcessingJob[]
}

interface MockProcessingJob extends ProcessingJob {
  simulatedProgress: number
}

// Processing pipeline stages
const PROCESSING_PIPELINE: JobType[] = ['ocr', 'extraction', 'consensus', 'entity_resolution']

// Status transitions based on processing
const getDocumentStatusFromJobs = (jobs: MockProcessingJob[]): DocumentStatus => {
  if (jobs.length === 0) return 'uploaded'

  const allCompleted = jobs.every((j) => j.status === 'completed')
  const anyFailed = jobs.some((j) => j.status === 'failed')
  const anyProcessing = jobs.some((j) => j.status === 'processing' || j.status === 'retrying')

  if (anyFailed) return 'failed'
  if (allCompleted && jobs.length === PROCESSING_PIPELINE.length) return 'processed'
  if (anyProcessing || jobs.length > 0) return 'processing'

  return 'uploaded'
}

// Calculate processing jobs state from mock jobs
const calculateJobsState = (documents: MockDocument[]): ProcessingJobsState => {
  const jobs = new Map<string, ProcessingJob>()
  const jobsByDocument = new Map<string, ProcessingJob[]>()

  let pendingJobs = 0
  let processingJobs = 0
  let completedJobs = 0
  let failedJobs = 0

  documents.forEach((doc) => {
    const docJobs: ProcessingJob[] = []
    doc.processingJobs.forEach((job) => {
      jobs.set(job.id, job)
      docJobs.push(job)

      switch (job.status) {
        case 'pending':
          pendingJobs++
          break
        case 'processing':
        case 'retrying':
          processingJobs++
          break
        case 'completed':
          completedJobs++
          break
        case 'failed':
          failedJobs++
          break
      }
    })
    if (docJobs.length > 0) {
      jobsByDocument.set(doc.id, docJobs)
    }
  })

  const totalJobs = jobs.size
  const finishedJobs = completedJobs + failedJobs
  const overallProgress = totalJobs > 0 ? Math.round((finishedJobs / totalJobs) * 100) : 0
  const isComplete = totalJobs > 0 && finishedJobs === totalJobs
  const isProcessing = processingJobs > 0 || (pendingJobs > 0 && !isComplete)

  return {
    jobs,
    jobsByDocument,
    totalJobs,
    pendingJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    overallProgress,
    isComplete,
    isProcessing,
  }
}

// Generate unique IDs
let idCounter = 0
const generateId = () => `mock_${Date.now()}_${++idCounter}`

export default function TestDocumentStatusPage() {
  const [documents, setDocuments] = useState<MockDocument[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const [failureChance, setFailureChance] = useState(0)
  const [statusHistory, setStatusHistory] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([])
  const simulationRef = useRef<NodeJS.Timeout | null>(null)

  // Add status history entry
  const addHistory = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setStatusHistory((prev) => [
      { timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 49), // Keep last 50 entries
    ])
  }, [])

  // Add a mock document
  const addDocument = useCallback(() => {
    const docNames = [
      'CNH_Vendedor.pdf',
      'RG_Comprador.pdf',
      'Certidao_Casamento.pdf',
      'Escritura_Imovel.pdf',
      'IPTU_2024.pdf',
      'Procuracao.pdf',
      'Certidao_Nascimento.pdf',
      'Contrato_Social.pdf',
    ]

    const newDoc: MockDocument = {
      id: generateId(),
      case_id: 'test-case-123',
      storage_path: '/mock/path/' + generateId(),
      original_name: docNames[Math.floor(Math.random() * docNames.length)],
      mime_type: 'application/pdf',
      file_size: Math.floor(Math.random() * 5000000) + 100000,
      page_count: Math.floor(Math.random() * 10) + 1,
      status: 'uploaded',
      doc_type: null,
      doc_type_confidence: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processingJobs: [],
    }

    setDocuments((prev) => [...prev, newDoc])
    addHistory(`Document added: ${newDoc.original_name}`, 'info')
  }, [addHistory])

  // Remove a document
  const removeDocument = useCallback((docId: string) => {
    setDocuments((prev) => {
      const doc = prev.find((d) => d.id === docId)
      if (doc) {
        addHistory(`Document removed: ${doc.original_name}`, 'warning')
      }
      return prev.filter((d) => d.id !== docId)
    })
  }, [addHistory])

  // Start processing simulation
  const startSimulation = useCallback(() => {
    if (documents.length === 0) {
      addHistory('No documents to process', 'warning')
      return
    }

    setIsSimulating(true)
    addHistory('Processing simulation started', 'info')

    // Initialize processing jobs for all documents
    setDocuments((prev) =>
      prev.map((doc) => ({
        ...doc,
        status: 'processing',
        processingJobs: PROCESSING_PIPELINE.map((jobType, index) => ({
          id: generateId(),
          case_id: doc.case_id,
          document_id: doc.id,
          job_type: jobType,
          status: index === 0 ? 'processing' : 'pending',
          attempts: 0,
          max_attempts: 3,
          error_message: null,
          result: null,
          created_at: new Date().toISOString(),
          started_at: index === 0 ? new Date().toISOString() : null,
          completed_at: null,
          simulatedProgress: 0,
        })),
      }))
    )
  }, [documents.length, addHistory])

  // Stop simulation
  const stopSimulation = useCallback(() => {
    setIsSimulating(false)
    if (simulationRef.current) {
      clearTimeout(simulationRef.current)
      simulationRef.current = null
    }
    addHistory('Processing simulation stopped', 'warning')
  }, [addHistory])

  // Reset simulation
  const resetSimulation = useCallback(() => {
    stopSimulation()
    setDocuments((prev) =>
      prev.map((doc) => ({
        ...doc,
        status: 'uploaded',
        processingJobs: [],
      }))
    )
    setStatusHistory([])
    addHistory('Simulation reset', 'info')
  }, [stopSimulation, addHistory])

  // Simulation tick
  useEffect(() => {
    if (!isSimulating) return

    const speedMs = { slow: 1500, normal: 800, fast: 300 }[simulationSpeed]

    const tick = () => {
      setDocuments((prev) => {

        const updated = prev.map((doc) => {
          // Skip if no processing jobs
          if (doc.processingJobs.length === 0) return doc

          const updatedJobs = doc.processingJobs.map((job, index) => {
            // Skip completed or failed jobs
            if (job.status === 'completed' || job.status === 'failed') {
              return job
            }

            // Check if previous job is complete (for sequential processing)
            if (index > 0) {
              const prevJob = doc.processingJobs[index - 1]
              if (prevJob.status !== 'completed') {
                void 0
                return job
              }
            }

            // Start pending jobs
            if (job.status === 'pending') {
              void 0
              void 0
              addHistory(`${doc.original_name}: Starting ${job.job_type}`, 'info')
              return {
                ...job,
                status: 'processing' as JobStatus,
                started_at: new Date().toISOString(),
                simulatedProgress: 0,
              }
            }

            // Progress processing jobs
            if (job.status === 'processing' || job.status === 'retrying') {
              void 0
              void 0
              const newProgress = Math.min(100, job.simulatedProgress + Math.floor(Math.random() * 30) + 10)

              // Check for completion
              if (newProgress >= 100) {
                // Check for random failure
                const shouldFail = Math.random() * 100 < failureChance

                if (shouldFail && job.attempts < job.max_attempts - 1) {
                  // Retry
                  addHistory(`${doc.original_name}: ${job.job_type} failed, retrying...`, 'warning')
                  return {
                    ...job,
                    status: 'retrying' as JobStatus,
                    attempts: job.attempts + 1,
                    simulatedProgress: 0,
                  }
                } else if (shouldFail) {
                  // Final failure
                  addHistory(`${doc.original_name}: ${job.job_type} failed after ${job.attempts + 1} attempts`, 'error')
                  return {
                    ...job,
                    status: 'failed' as JobStatus,
                    error_message: 'Simulated processing failure',
                    completed_at: new Date().toISOString(),
                    simulatedProgress: 100,
                  }
                } else {
                  // Success
                  addHistory(`${doc.original_name}: ${job.job_type} completed`, 'success')
                  return {
                    ...job,
                    status: 'completed' as JobStatus,
                    completed_at: new Date().toISOString(),
                    simulatedProgress: 100,
                  }
                }
              }

              return {
                ...job,
                simulatedProgress: newProgress,
              }
            }

            return job
          })

          // Update document status based on jobs
          const newStatus = getDocumentStatusFromJobs(updatedJobs)

          return {
            ...doc,
            status: newStatus,
            processingJobs: updatedJobs,
          }
        })

        // Check if all processing is complete
        const allDocsComplete = updated.every(
          (doc) =>
            doc.processingJobs.length === 0 ||
            doc.processingJobs.every((j) => j.status === 'completed' || j.status === 'failed')
        )

        if (allDocsComplete && updated.some((d) => d.processingJobs.length > 0)) {
          addHistory('All processing complete!', 'success')
          setIsSimulating(false)
        }

        return updated
      })
    }

    simulationRef.current = setTimeout(tick, speedMs)

    return () => {
      if (simulationRef.current) {
        clearTimeout(simulationRef.current)
      }
    }
  }, [isSimulating, simulationSpeed, failureChance, addHistory])

  // Calculate jobs state
  const jobsState = calculateJobsState(documents)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
            Real-time Status Demo
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Processing Status - Live Updates
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Demonstrates real-time document processing status updates with simulated backend processing.
          </p>
        </div>

        {/* Controls */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Simulation Controls
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            {/* Add Document */}
            <button
              onClick={addDocument}
              disabled={isSimulating}
              className="btn-secondary flex items-center gap-2"
            >
              <DocumentIcon className="w-5 h-5" />
              Add Document
            </button>

            {/* Start/Stop Processing */}
            {!isSimulating ? (
              <button
                onClick={startSimulation}
                disabled={documents.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Start Processing
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <StopIcon className="w-5 h-5" />
                Stop
              </button>
            )}

            {/* Reset */}
            <button
              onClick={resetSimulation}
              className="btn-ghost flex items-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reset
            </button>

            {/* Speed Control */}
            <div className="flex items-center gap-2 ml-4">
              <BoltIcon className="w-4 h-4 text-gray-400" />
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(e.target.value as 'slow' | 'normal' | 'fast')}
                className="input-field text-sm py-1"
                disabled={isSimulating}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>

            {/* Failure Chance */}
            <div className="flex items-center gap-2">
              <ExclamationCircleIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Failure:</span>
              <input
                type="range"
                min="0"
                max="50"
                value={failureChance}
                onChange={(e) => setFailureChance(Number(e.target.value))}
                className="w-20"
                disabled={isSimulating}
              />
              <span className="text-sm text-gray-500">{failureChance}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Documents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processing Status Panel */}
            {jobsState.totalJobs > 0 && (
              <ProcessingStatusPanel
                jobsState={jobsState}
                documents={documents}
                showDetails={true}
              />
            )}

            {/* Documents List */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Documents
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {documents.length} document{documents.length !== 1 ? 's' : ''}
                </p>
              </div>

              <AnimatePresence mode="popLayout">
                {documents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-12 text-center"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <DocumentIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No documents
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Add documents to start the simulation
                    </p>
                  </motion.div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {documents.map((doc, index) => (
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
                          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <DocumentIcon className="w-5 h-5 text-red-500" />
                          </div>

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {doc.original_name}
                              </p>
                              <DocumentStatusBadge
                                status={doc.status}
                                size="sm"
                                animate={true}
                              />
                            </div>

                            {/* Processing Progress */}
                            {doc.processingJobs.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  {doc.processingJobs.map((job, jobIndex) => {
                                    const Icon =
                                      job.status === 'completed'
                                        ? CheckCircleIcon
                                        : job.status === 'failed'
                                        ? ExclamationCircleIcon
                                        : job.status === 'processing' || job.status === 'retrying'
                                        ? ArrowPathIcon
                                        : ClockIcon

                                    return (
                                      <div
                                        key={job.id}
                                        className="flex items-center gap-1"
                                        title={`${job.job_type}: ${job.status}`}
                                      >
                                        <Icon
                                          className={`w-4 h-4 ${
                                            job.status === 'completed'
                                              ? 'text-green-500'
                                              : job.status === 'failed'
                                              ? 'text-red-500'
                                              : job.status === 'processing' || job.status === 'retrying'
                                              ? 'text-blue-500 animate-spin'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                        {jobIndex < doc.processingJobs.length - 1 && (
                                          <div
                                            className={`w-4 h-0.5 ${
                                              job.status === 'completed'
                                                ? 'bg-green-500'
                                                : 'bg-gray-300'
                                            }`}
                                          />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  {doc.processingJobs.find((j) => j.status === 'processing')?.job_type && (
                                    <span className="flex items-center gap-1">
                                      <CpuChipIcon className="w-3 h-3" />
                                      {doc.processingJobs.find((j) => j.status === 'processing')?.job_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => removeDocument(doc.id)}
                            disabled={isSimulating}
                            className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Remove document"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column - Status History */}
          <div className="space-y-6">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Status Log
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Real-time status updates
                </p>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {statusHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No status updates yet
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {statusHistory.map((entry, index) => (
                        <motion.li
                          key={`${entry.timestamp}-${index}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className={`text-xs p-2 rounded ${
                            entry.type === 'success'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : entry.type === 'error'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : entry.type === 'warning'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <span className="text-gray-400 mr-2">{entry.timestamp}</span>
                          {entry.message}
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Status Badge Demo */}
            <div className="card p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Status Badge Variants
              </h3>
              <div className="space-y-3">
                {(['uploaded', 'processing', 'processed', 'needs_review', 'approved', 'failed'] as DocumentStatus[]).map(
                  (status) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <DocumentStatusBadge status={status} size="sm" />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Info */}
        <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            About This Demo
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>- Real-time status updates using simulated backend processing</li>
            <li>- Documents progress through OCR, Extraction, Consensus, and Entity Resolution</li>
            <li>- Status badges update automatically as processing progresses</li>
            <li>- Processing panel shows overall and per-document progress</li>
            <li>- Configurable simulation speed and failure rate</li>
            <li>- In production, this connects to Supabase Realtime subscriptions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
