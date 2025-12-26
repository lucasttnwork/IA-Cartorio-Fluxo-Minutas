import { useParams } from 'react-router-dom'
import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Panel,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  useReactFlow,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LinkIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowsPointingOutIcon,
  MapIcon,
  RectangleGroupIcon,
  CheckCircleIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars3Icon,
  ArrowsUpDownIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { PersonNode, PropertyNode, ContextMenu, EditPersonModal, EditPropertyModal, SuggestionsPanel, CustomEdge, PresenceOverlay, AttachProxyDialog } from '../components/canvas'
import type { PersonNodeData, PropertyNodeData, ContextMenuItem, CustomEdgeData } from '../components/canvas'
import { useCanvasData } from '../hooks/useCanvasData'
import { useCanvasPresence } from '../hooks/useCanvasPresence'
import { supabase, createProcessingJob, retryProcessingJob, getFailedJobsForCase } from '../lib/supabase'
import type { Person, Property, GraphEdge as DBGraphEdge, RelationshipType } from '../types'
import { validateCanvas, type ValidationWarning } from '../utils/canvasValidation'
import { analyzeDocumentsForSuggestions, type CanvasSuggestions, type EntitySuggestion, type RelationshipSuggestion } from '../services/canvasSuggestions'
import { alignNodes, distributeNodes, type AlignmentType, type DistributionType } from '../utils/canvasAlignment'

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  person: PersonNode,
  property: PropertyNode,
}

// Define edge types for React Flow
const edgeTypes = {
  custom: CustomEdge,
}

// Simple auto-layout using a grid/force-directed approach
function calculateNodePositions(
  people: Person[],
  properties: Property[],
  edges: DBGraphEdge[]
): { personPositions: Map<string, { x: number; y: number }>; propertyPositions: Map<string, { x: number; y: number }> } {
  const personPositions = new Map<string, { x: number; y: number }>()
  const propertyPositions = new Map<string, { x: number; y: number }>()

  // Improved grid layout: people on the left, properties on the right
  // Larger spacing to prevent overlap
  const horizontalSpacing = 450
  const verticalSpacing = 320  // Increased for taller cards
  const leftColumnX = 150
  const rightColumnX = 700

  // Calculate columns needed for people (max 4 per column for better visibility)
  const maxPeoplePerColumn = 4

  // Position people with multi-column support
  people.forEach((person, index) => {
    const column = Math.floor(index / maxPeoplePerColumn)
    const row = index % maxPeoplePerColumn
    personPositions.set(person.id, {
      x: leftColumnX + column * horizontalSpacing,
      y: 80 + row * verticalSpacing,
    })
  })

  // Position properties in the right column
  properties.forEach((property, index) => {
    propertyPositions.set(property.id, {
      x: rightColumnX + (index % 2) * horizontalSpacing,
      y: 80 + Math.floor(index / 2) * verticalSpacing,
    })
  })

  return { personPositions, propertyPositions }
}

// Map relationship type to label
function getRelationshipLabel(relationship: RelationshipType): string {
  const labels: Record<RelationshipType, string> = {
    spouse_of: 'Cônjuge de',
    represents: 'Representa',
    owns: 'Proprietário',
    sells: 'Vende',
    buys: 'Compra',
    guarantor_of: 'Fiador de',
    witness_for: 'Testemunha de',
  }
  return labels[relationship] || relationship
}

// Connection dialog state
interface ConnectionDialogState {
  isOpen: boolean
  connection: Connection | null
  sourceType: 'person' | 'property' | null
  targetType: 'person' | 'property' | null
}

function CanvasPageContent() {
  const { caseId } = useParams()
  const { data, isLoading, error, reload } = useCanvasData(caseId)
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const { presenceState, broadcastCursor } = useCanvasPresence({ caseId })
  const [connectionMode, setConnectionMode] = useState(false)
  const [connectionDialog, setConnectionDialog] = useState<ConnectionDialogState>({
    isOpen: false,
    connection: null,
    sourceType: null,
    targetType: null,
  })
  const [isCreatingEdge, setIsCreatingEdge] = useState(false)
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [failedDraftJobs, setFailedDraftJobs] = useState<any[]>([])
  const [isRetrying, setIsRetrying] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    nodeId: string | null
    nodeType: 'person' | 'property' | null
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    nodeType: null,
  })
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    edgeId: string | null
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    edgeId: null,
  })
  const [editPersonModal, setEditPersonModal] = useState<{
    isOpen: boolean
    person: Person | null
  }>({
    isOpen: false,
    person: null,
  })
  const [editPropertyModal, setEditPropertyModal] = useState<{
    isOpen: boolean
    property: Property | null
  }>({
    isOpen: false,
    property: null,
  })
  const [showMinimap, setShowMinimap] = useState(true)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.Partial)
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [showSelectionPanel, setShowSelectionPanel] = useState(true)
  const [suggestions, setSuggestions] = useState<CanvasSuggestions>({
    entities: [],
    relationships: [],
    dataQuality: [],
    summary: {
      totalSuggestions: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    },
  })
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [proxyDialog, setProxyDialog] = useState<{
    isOpen: boolean
    pendingRelationship: RelationshipType | null
  }>({
    isOpen: false,
    pendingRelationship: null,
  })

  // Convert database entities to React Flow nodes
  const initialNodes = useMemo<Node[]>(() => {
    const { people, properties } = data
    const { personPositions, propertyPositions } = calculateNodePositions(
      people,
      properties,
      data.edges
    )

    const personNodes: Node<PersonNodeData>[] = people.map((person) => ({
      id: `person-${person.id}`,
      type: 'person',
      position: personPositions.get(person.id) || { x: 0, y: 0 },
      data: { person },
    }))

    const propertyNodes: Node<PropertyNodeData>[] = properties.map((property) => ({
      id: `property-${property.id}`,
      type: 'property',
      position: propertyPositions.get(property.id) || { x: 0, y: 0 },
      data: { property },
    }))

    return [...personNodes, ...propertyNodes]
  }, [data])

  // Convert database edges to React Flow edges
  const initialEdges = useMemo<Edge<CustomEdgeData>[]>(() => {
    return data.edges.map((edge) => {
      const sourceId =
        edge.source_type === 'person' ? `person-${edge.source_id}` : `property-${edge.source_id}`
      const targetId =
        edge.target_type === 'person' ? `person-${edge.target_id}` : `property-${edge.target_id}`

      return {
        id: edge.id,
        source: sourceId,
        target: targetId,
        type: 'custom',
        data: {
          label: getRelationshipLabel(edge.relationship),
          confirmed: edge.confirmed,
          confidence: edge.confidence,
          animated: !edge.confirmed,
          strokeColor: edge.confirmed ? '#10b981' : '#f59e0b',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edge.confirmed ? '#10b981' : '#f59e0b',
        },
      }
    })
  }, [data.edges])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Track selected nodes whenever nodes change
  useEffect(() => {
    const selected = nodes.filter((node) => node.selected)
    setSelectedNodes(selected)
  }, [nodes])

  // Compute validation warnings
  const validationWarnings = useMemo<ValidationWarning[]>(() => {
    return validateCanvas(data.people, data.properties, data.edges, data.documents)
  }, [data.people, data.properties, data.edges, data.documents])

  // Load suggestions based on document analysis
  const loadSuggestions = useCallback(async () => {
    if (!caseId) return

    setIsLoadingSuggestions(true)

    try {
      const canvasSuggestions = await analyzeDocumentsForSuggestions(
        caseId,
        data.people,
        data.properties,
        data.edges
      )

      setSuggestions(canvasSuggestions)
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [caseId, data.people, data.properties, data.edges])

  // Load suggestions when data changes
  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  // Apply entity suggestion
  const handleApplyEntitySuggestion = useCallback(
    async (suggestion: EntitySuggestion) => {
      if (!caseId) return

      try {
        const tableName = suggestion.type === 'person' ? 'people' : 'properties'
        const entity = {
          ...suggestion.entity,
          case_id: caseId,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from(tableName).insert(entity)

        if (error) {
          console.error('Erro ao adicionar entidade:', error)
          alert(`Erro ao adicionar ${suggestion.type === 'person' ? 'pessoa' : 'propriedade'}: ` + error.message)
          return
        }

        // Reload canvas and suggestions
        reload()
        loadSuggestions()
      } catch (err) {
        console.error('Erro ao aplicar sugestão de entidade:', err)
        alert('Erro ao aplicar sugestão')
      }
    },
    [caseId, reload, loadSuggestions]
  )

  // Apply relationship suggestion
  const handleApplyRelationshipSuggestion = useCallback(
    async (suggestion: RelationshipSuggestion) => {
      if (!caseId) return

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('graphedges').insert({
          case_id: caseId,
          source_type: suggestion.sourceType,
          source_id: suggestion.sourceId,
          target_type: suggestion.targetType,
          target_id: suggestion.targetId,
          relationship: suggestion.relationship,
          confidence: suggestion.confidence,
          confirmed: false,
          metadata: {
            suggested: true,
            source_document: suggestion.source.documentId,
          },
        })

        if (error) {
          console.error('Erro ao adicionar relacionamento:', error)
          alert('Erro ao adicionar relacionamento: ' + error.message)
          return
        }

        // Reload canvas and suggestions
        reload()
        loadSuggestions()
      } catch (err) {
        console.error('Erro ao aplicar sugestão de relacionamento:', err)
        alert('Erro ao aplicar sugestão')
      }
    },
    [caseId, reload, loadSuggestions]
  )

  // Dismiss suggestion
  const handleDismissSuggestion = useCallback(
    (suggestionId: string, type: 'entity' | 'relationship' | 'quality') => {
      setSuggestions(prev => ({
        ...prev,
        entities: type === 'entity' ? prev.entities.filter(s => s.id !== suggestionId) : prev.entities,
        relationships: type === 'relationship' ? prev.relationships.filter(s => s.id !== suggestionId) : prev.relationships,
        dataQuality: type === 'quality' ? prev.dataQuality.filter(s => s.id !== suggestionId) : prev.dataQuality,
      }))
    },
    []
  )

  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connectionMode || !caseId) return

      // Determine source and target types
      const sourceType = connection.source?.startsWith('person-') ? 'person' : 'property'
      const targetType = connection.target?.startsWith('person-') ? 'person' : 'property'

      // Open dialog to select relationship type
      setConnectionDialog({
        isOpen: true,
        connection,
        sourceType,
        targetType,
      })
    },
    [connectionMode, caseId]
  )

  // Create edge in database
  const createGraphEdge = useCallback(
    async (relationship: RelationshipType, proxyDocumentId?: string) => {
      if (!connectionDialog.connection || !caseId) return

      // If this is a "represents" relationship and no proxy document provided, show proxy dialog
      if (relationship === 'represents' && proxyDocumentId === undefined) {
        setProxyDialog({
          isOpen: true,
          pendingRelationship: relationship,
        })
        return
      }

      setIsCreatingEdge(true)

      try {
        const { connection, sourceType, targetType } = connectionDialog

        // Extract IDs from node IDs (format: "person-{id}" or "property-{id}")
        const sourceId = connection.source!.split('-')[1]
        const targetId = connection.target!.split('-')[1]

        // Build metadata
        const metadata: Record<string, unknown> = {
          created_manually: true,
          created_at: new Date().toISOString(),
        }

        // Add proxy document if provided
        if (proxyDocumentId) {
          metadata.proxy_document_id = proxyDocumentId
          metadata.proxy_attached_at = new Date().toISOString()
        }

        // Insert into graphedges table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('graphedges')
          .insert({
            case_id: caseId,
            source_type: sourceType,
            source_id: sourceId,
            target_type: targetType,
            target_id: targetId,
            relationship,
            confidence: 1.0, // Manual connections have high confidence
            confirmed: false, // Require user confirmation
            metadata,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Erro ao criar aresta:', insertError)
          alert('Erro ao criar conexão: ' + insertError.message)
          return
        }

        // Close dialogs
        setConnectionDialog({
          isOpen: false,
          connection: null,
          sourceType: null,
          targetType: null,
        })
        setProxyDialog({
          isOpen: false,
          pendingRelationship: null,
        })

        // Reload canvas data to show new edge
        reload()
      } catch (err) {
        console.error('Erro ao criar aresta:', err)
        alert('Erro ao criar conexão')
      } finally {
        setIsCreatingEdge(false)
      }
    },
    [connectionDialog, caseId, reload]
  )

  // Handle proxy attachment from dialog
  const handleAttachProxy = useCallback(
    (documentId: string) => {
      if (proxyDialog.pendingRelationship) {
        createGraphEdge(proxyDialog.pendingRelationship, documentId || undefined)
      }
    },
    [proxyDialog.pendingRelationship, createGraphEdge]
  )

  // Load failed draft jobs
  const loadFailedJobs = useCallback(async () => {
    if (!caseId) return

    try {
      const { data: jobs, error } = await getFailedJobsForCase(caseId)
      if (!error && jobs) {
        const draftJobs = jobs.filter(job => job.job_type === 'draft')
        setFailedDraftJobs(draftJobs)
      }
    } catch (err) {
      console.error('Erro ao carregar jobs falhos:', err)
    }
  }, [caseId])

  // Load failed jobs on mount and when data reloads
  useEffect(() => {
    loadFailedJobs()
  }, [loadFailedJobs])

  // Generate draft from graph data
  const handleGenerateDraft = useCallback(async () => {
    if (!caseId) return

    setIsGeneratingDraft(true)

    try {
      // Create a draft generation job
      const { data: job, error } = await createProcessingJob(caseId, null, 'draft')

      if (error || !job) {
        console.error('Erro ao criar job de minuta:', error)
        alert('Erro ao criar job de geração de minuta: ' + (error?.message || 'Erro desconhecido'))
        return
      }

      console.log('Draft generation job created:', job)
      alert('Minuta sendo gerada! Acompanhe o progresso na página do caso.')

      // Reload failed jobs to clear any previous failures
      loadFailedJobs()
    } catch (err) {
      console.error('Erro ao gerar minuta:', err)
      alert('Erro ao gerar minuta')
    } finally {
      setIsGeneratingDraft(false)
    }
  }, [caseId, loadFailedJobs])

  // Retry failed draft job
  const handleRetryDraft = useCallback(async (jobId: string) => {
    if (!jobId) return

    setIsRetrying(true)

    try {
      const { data: retriedJob, error } = await retryProcessingJob(jobId)

      if (error) {
        console.error('Erro ao retentar job de minuta:', error)
        alert('Erro ao tentar novamente: ' + error.message)
        return
      }

      console.log('Draft job retry initiated:', retriedJob)
      alert('Tentando gerar a minuta novamente. Acompanhe o progresso.')

      // Reload failed jobs
      loadFailedJobs()
    } catch (err) {
      console.error('Erro ao retentar minuta:', err)
      alert('Erro ao tentar novamente')
    } finally {
      setIsRetrying(false)
    }
  }, [loadFailedJobs])

  // Update nodes and edges when data changes
  useMemo(() => {
    const { people, properties } = data
    const { personPositions, propertyPositions } = calculateNodePositions(
      people,
      properties,
      data.edges
    )

    const personNodes: Node<PersonNodeData>[] = people.map((person) => ({
      id: `person-${person.id}`,
      type: 'person',
      position: personPositions.get(person.id) || { x: 0, y: 0 },
      data: { person },
    }))

    const propertyNodes: Node<PropertyNodeData>[] = properties.map((property) => ({
      id: `property-${property.id}`,
      type: 'property',
      position: propertyPositions.get(property.id) || { x: 0, y: 0 },
      data: { property },
    }))

    // Only update if nodes actually changed
    const newNodes = [...personNodes, ...propertyNodes]
    if (JSON.stringify(newNodes) !== JSON.stringify(nodes)) {
      setNodes(newNodes)
    }
  }, [data, nodes, onNodesChange])

  useMemo(() => {
    const newEdges = data.edges.map((edge) => {
      const sourceId =
        edge.source_type === 'person' ? `person-${edge.source_id}` : `property-${edge.source_id}`
      const targetId =
        edge.target_type === 'person' ? `person-${edge.target_id}` : `property-${edge.target_id}`

      // Check if this is a represents relationship with proxy document
      const hasProxy = edge.relationship === 'represents' && !!edge.metadata?.proxy_document_id

      return {
        id: edge.id,
        source: sourceId,
        target: targetId,
        type: 'custom',
        data: {
          label: getRelationshipLabel(edge.relationship),
          confirmed: edge.confirmed,
          confidence: edge.confidence,
          animated: !edge.confirmed,
          strokeColor: edge.confirmed ? '#10b981' : '#f59e0b',
          strokeWidth: 2,
          hasProxy,
          relationship: edge.relationship,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edge.confirmed ? '#10b981' : '#f59e0b',
        },
      }
    })

    // Only update if edges actually changed
    if (JSON.stringify(newEdges) !== JSON.stringify(edges)) {
      setEdges(newEdges)
    }
  }, [data.edges, edges, onEdgesChange])

  // Handle node context menu (right-click on node)
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()

      const nodeType = node.id.startsWith('person-') ? 'person' : 'property'

      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
        nodeType,
      })
    },
    []
  )

  // Handle pane context menu (right-click on canvas background)
  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      nodeId: null,
      nodeType: null,
    })
  }, [])

  // Handle edge context menu (right-click on edge)
  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()

    setEdgeContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      edgeId: edge.id,
    })
  }, [])

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      nodeId: null,
      nodeType: null,
    })
  }, [])

  // Close edge context menu
  const closeEdgeContextMenu = useCallback(() => {
    setEdgeContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      edgeId: null,
    })
  }, [])

  // Delete node handler
  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      if (!caseId || !nodeId) return

      const nodeType = nodeId.startsWith('person-') ? 'person' : 'property'
      const entityId = nodeId.split('-')[1]

      try {
        // Delete from database
        const tableName = nodeType === 'person' ? 'people' : 'properties'
        const { error } = await supabase.from(tableName).delete().eq('id', entityId)

        if (error) {
          console.error(`Erro ao excluir ${nodeType}:`, error)
          alert(`Erro ao deletar ${nodeType === 'person' ? 'pessoa' : 'propriedade'}: ` + error.message)
          return
        }

        // Reload canvas data
        reload()
      } catch (err) {
        console.error(`Erro ao excluir ${nodeType}:`, err)
        alert(`Erro ao deletar ${nodeType === 'person' ? 'pessoa' : 'propriedade'}`)
      }
    },
    [caseId, reload]
  )

  // Delete selected nodes (bulk delete)
  const handleDeleteSelectedNodes = useCallback(async () => {
    if (!caseId || selectedNodes.length === 0) return

    const personCount = selectedNodes.filter((n) => n.id.startsWith('person-')).length
    const propertyCount = selectedNodes.filter((n) => n.id.startsWith('property-')).length

    const confirmMessage = `Tem certeza que deseja deletar ${selectedNodes.length} item(ns) selecionado(s)?\n${personCount} pessoa(s) e ${propertyCount} propriedade(s)`

    if (!confirm(confirmMessage)) return

    try {
      // Delete persons
      const personIds = selectedNodes
        .filter((n) => n.id.startsWith('person-'))
        .map((n) => n.id.split('-')[1])

      if (personIds.length > 0) {
        const { error: personError } = await supabase
          .from('people')
          .delete()
          .in('id', personIds)

        if (personError) {
          console.error('Erro ao excluir pessoas:', personError)
          alert('Erro ao deletar pessoas: ' + personError.message)
          return
        }
      }

      // Delete properties
      const propertyIds = selectedNodes
        .filter((n) => n.id.startsWith('property-'))
        .map((n) => n.id.split('-')[1])

      if (propertyIds.length > 0) {
        const { error: propertyError } = await supabase
          .from('properties')
          .delete()
          .in('id', propertyIds)

        if (propertyError) {
          console.error('Erro ao excluir imóveis:', propertyError)
          alert('Erro ao deletar propriedades: ' + propertyError.message)
          return
        }
      }

      // Reload canvas data
      reload()
    } catch (err) {
      console.error('Erro ao excluir nós selecionados:', err)
      alert('Erro ao deletar itens selecionados')
    }
  }, [caseId, selectedNodes, reload])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    )
  }, [setNodes])

  // Handle node alignment
  const handleAlignNodes = useCallback((alignmentType: AlignmentType) => {
    if (selectedNodes.length < 2) return

    const alignedNodes = alignNodes(selectedNodes, alignmentType)

    // Update node positions
    setNodes((nds) =>
      nds.map((node) => {
        const alignedNode = alignedNodes.find((n) => n.id === node.id)
        return alignedNode || node
      })
    )
  }, [selectedNodes, setNodes])

  // Handle node distribution
  const handleDistributeNodes = useCallback((distributionType: DistributionType) => {
    if (selectedNodes.length < 3) return

    const distributedNodes = distributeNodes(selectedNodes, distributionType)

    // Update node positions
    setNodes((nds) =>
      nds.map((node) => {
        const distributedNode = distributedNodes.find((n) => n.id === node.id)
        return distributedNode || node
      })
    )
  }, [selectedNodes, setNodes])

  // Delete edge handler
  const handleDeleteEdge = useCallback(
    async (edgeId: string) => {
      if (!caseId || !edgeId) return

      try {
        // Delete from database
        const { error } = await supabase.from('graphedges').delete().eq('id', edgeId)

        if (error) {
          console.error('Erro ao excluir aresta:', error)
          alert('Erro ao deletar conexão: ' + error.message)
          return
        }

        // Reload canvas data
        reload()
      } catch (err) {
        console.error('Erro ao excluir aresta:', err)
        alert('Erro ao deletar conexão')
      }
    },
    [caseId, reload]
  )

  // Build context menu items based on what was clicked
  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (contextMenu.nodeId) {
      // Node context menu
      const nodeType = contextMenu.nodeType
      const isPersonNode = nodeType === 'person'

      return [
        {
          id: 'view',
          label: 'Ver Detalhes',
          icon: EyeIcon,
          onClick: () => {
            // TODO: Implement view details modal
            console.log('View details for', contextMenu.nodeId)
          },
        },
        {
          id: 'edit',
          label: 'Editar',
          icon: PencilIcon,
          onClick: () => {
            if (!contextMenu.nodeId) return

            const nodeType = contextMenu.nodeType
            const entityId = contextMenu.nodeId.split('-')[1]

            if (nodeType === 'person') {
              const person = data.people.find((p) => p.id === entityId)
              if (person) {
                setEditPersonModal({ isOpen: true, person })
                closeContextMenu()
              }
            } else if (nodeType === 'property') {
              const property = data.properties.find((p) => p.id === entityId)
              if (property) {
                setEditPropertyModal({ isOpen: true, property })
                closeContextMenu()
              }
            }
          },
        },
        {
          id: 'duplicate',
          label: 'Duplicar',
          icon: DocumentDuplicateIcon,
          onClick: () => {
            // TODO: Implement duplicate functionality
            console.log('Duplicate', contextMenu.nodeId)
          },
        },
        {
          id: 'delete',
          label: isPersonNode ? 'Deletar Pessoa' : 'Deletar Propriedade',
          icon: TrashIcon,
          onClick: () => {
            if (confirm(`Tem certeza que deseja deletar ${isPersonNode ? 'esta pessoa' : 'esta propriedade'}?`)) {
              handleDeleteNode(contextMenu.nodeId!)
            }
          },
          danger: true,
        },
      ]
    } else {
      // Canvas background context menu
      return [
        {
          id: 'fit-view',
          label: 'Ajustar Visualização',
          icon: ArrowsPointingOutIcon,
          onClick: () => {
            fitView({ padding: 0.2, duration: 300 })
            closeContextMenu()
          },
        },
        {
          id: 'refresh',
          label: 'Atualizar',
          icon: ArrowPathIcon,
          onClick: () => {
            reload()
          },
        },
      ]
    }
  }, [contextMenu.nodeId, contextMenu.nodeType, handleDeleteNode, reload, fitView, closeContextMenu, data.people, data.properties])

  // Build edge context menu items
  const edgeContextMenuItems = useMemo<ContextMenuItem[]>(() => {
    return [
      {
        id: 'delete',
        label: 'Deletar Conexão',
        icon: TrashIcon,
        onClick: () => {
          if (confirm('Tem certeza que deseja deletar esta conexão?')) {
            handleDeleteEdge(edgeContextMenu.edgeId!)
            closeEdgeContextMenu()
          }
        },
        danger: true,
      },
    ]
  }, [edgeContextMenu.edgeId, handleDeleteEdge, closeEdgeContextMenu])

  const totalEntities = data.people.length + data.properties.length

  // Handle mouse move on canvas for presence broadcasting
  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Broadcast cursor position relative to the canvas container
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      broadcastCursor(x, y)
    },
    [broadcastCursor]
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 space-y-3">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <SparklesIcon className="w-7 h-7 text-purple-500" />
              Canvas de Entidades
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Visualização interativa de pessoas, propriedades e relacionamentos.
            </p>
          </div>

          {/* Primary Actions - always visible */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="gap-2"
            >
              <DocumentTextIcon className={cn("w-5 h-5", isGeneratingDraft && "animate-pulse")} />
              <span className="hidden sm:inline">{isGeneratingDraft ? 'Gerando...' : 'Gerar Minuta'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={reload}
              disabled={isLoading}
              className="gap-2"
            >
              <ArrowPathIcon className={cn("w-5 h-5", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 glass-subtle rounded-lg overflow-hidden p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => zoomOut({ duration: 200 })}
              title="Diminuir zoom (ou use Ctrl + scroll)"
              className="h-8 w-8 p-0"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => zoomIn({ duration: 200 })}
              title="Aumentar zoom (ou use Ctrl + scroll)"
              className="h-8 w-8 p-0"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fitView({ padding: 0.2, duration: 300 })}
              title="Ajustar visualização"
              className="h-8 w-8 p-0"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

          <Button
            variant={showMinimap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMinimap(!showMinimap)}
            className={cn(
              "gap-1.5",
              showMinimap && "bg-purple-500 hover:bg-purple-600"
            )}
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden lg:inline">{showMinimap ? 'Ocultar' : 'Mostrar'} Minimapa</span>
          </Button>
          <Button
            variant={selectionMode === SelectionMode.Full ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setSelectionMode(
                selectionMode === SelectionMode.Partial ? SelectionMode.Full : SelectionMode.Partial
              )
            }
            className={cn(
              "gap-1.5",
              selectionMode === SelectionMode.Full && "bg-indigo-500 hover:bg-indigo-600"
            )}
            title={
              selectionMode === SelectionMode.Full
                ? 'Box Selection: Arraste para selecionar múltiplos nós'
                : 'Clique para ativar seleção em caixa'
            }
          >
            <RectangleGroupIcon className="w-4 h-4" />
            <span className="hidden lg:inline">{selectionMode === SelectionMode.Full ? 'Seleção Ativa' : 'Seleção em Caixa'}</span>
          </Button>
          <Button
            variant={connectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => setConnectionMode(!connectionMode)}
            className={cn(
              "gap-1.5",
              connectionMode && "bg-blue-500 hover:bg-blue-600"
            )}
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden lg:inline">{connectionMode ? 'Conexão Ativa' : 'Modo Conexão'}</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive" className="mb-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Failed Draft Jobs Alert */}
      {failedDraftJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {failedDraftJobs.map((job) => (
            <Alert key={job.id} variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">
                  Falha na Geração de Minuta
                </h4>
                <AlertDescription className="mb-2">
                  {job.error_message || 'Erro desconhecido ao gerar a minuta. Por favor, tente novamente.'}
                </AlertDescription>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetryDraft(job.id)}
                    disabled={isRetrying || job.attempts >= job.max_attempts}
                    className="gap-2 bg-white hover:bg-gray-50"
                  >
                    <ArrowPathIcon className={cn("w-4 h-4", isRetrying && "animate-spin")} />
                    {isRetrying ? 'Tentando...' : 'Tentar Novamente'}
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    Tentativa {job.attempts}/{job.max_attempts}
                  </Badge>
                  {job.attempts >= job.max_attempts && (
                    <Badge variant="destructive" className="text-xs">
                      Máximo de tentativas atingido
                    </Badge>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </motion.div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 space-y-2"
        >
          {validationWarnings.map((warning) => (
            <Alert
              key={warning.id}
              variant={warning.type === 'error' ? 'destructive' : 'default'}
              className={cn(
                warning.type === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              )}
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">
                  {warning.title}
                </h4>
                <AlertDescription className="mb-2">
                  {warning.description}
                </AlertDescription>
                {warning.affectedEntities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {warning.affectedEntities.map((entity, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn(
                          entity.type === 'person'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        )}
                      >
                        {entity.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Alert>
          ))}
        </motion.div>
      )}

      {/* Canvas - with right margin for suggestions panel */}
      <Card className="flex-1 glass-card overflow-hidden p-0 border-0 relative mr-0 xl:mr-[26rem] transition-all duration-300">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ArrowPathIcon className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando canvas...</p>
            </div>
          </div>
        ) : totalEntities === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Nenhuma entidade encontrada
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                As entidades (pessoas e propriedades) serão exibidas aqui após serem resolvidas a
                partir dos documentos extraídos.
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Aguarde o processamento dos documentos ou execute a resolução de entidades.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative" onMouseMove={handleCanvasMouseMove}>
            {/* Presence Overlay */}
            <PresenceOverlay presenceState={presenceState} />

            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneContextMenu={handlePaneContextMenu as any}
            onEdgeContextMenu={handleEdgeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            className="bg-gray-50 dark:bg-gray-900"
            connectionMode={'loose' as any}
            connectOnClick={connectionMode}
            selectionMode={selectionMode}
            panOnDrag={selectionMode !== SelectionMode.Full}
            selectionOnDrag={selectionMode === SelectionMode.Full}
            multiSelectionKeyCode="Control"
            // Pan/Zoom smoothness improvements
            panOnScroll={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
            panActivationKeyCode="Space"
            preventScrolling={true}
            zoomActivationKeyCode="Control"
            // Enable smooth transitions for better UX
            nodesDraggable={true}
            nodesConnectable={connectionMode}
            nodesFocusable={true}
            edgesFocusable={true}
            elementsSelectable={true}
            // Improve performance with these settings
            autoPanOnNodeDrag={true}
            autoPanOnConnect={true}
          >
            <Background />
            {showMinimap && (
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === 'person') return '#3b82f6'
                  if (node.type === 'property') return '#10b981'
                  return '#6b7280'
                }}
                maskColor="rgba(100, 100, 100, 0.15)"
                className="!bg-white/90 dark:!bg-gray-800/90 !border-2 !border-gray-200 dark:!border-gray-700 !rounded-lg !shadow-lg"
                pannable
                zoomable
              />
            )}
            <Panel position="top-left" className="glass-card p-3 rounded-lg shadow-lg ml-2 mt-2">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {data.people.length} Pessoa(s)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {data.properties.length} Propriedade(s)
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-green-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.edges.filter((e) => e.confirmed).length} Confirmado(s)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-yellow-500 rounded animate-pulse"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.edges.filter((e) => !e.confirmed).length} Pendente(s)
                  </span>
                </div>
              </div>
            </Panel>

            {/* Selection Info Panel */}
            {selectedNodes.length > 0 && showSelectionPanel && (
              <Panel position="bottom-left" className="glass-elevated p-4 rounded-lg shadow-lg border-2 border-indigo-500">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedNodes.length} {selectedNodes.length === 1 ? 'Item Selecionado' : 'Itens Selecionados'}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSelectionPanel(false)}
                      className="h-6 w-6 p-0"
                      title="Fechar painel"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedNodes.filter((n) => n.id.startsWith('person-')).length} Pessoa(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedNodes.filter((n) => n.id.startsWith('property-')).length} Propriedade(s)
                      </span>
                    </div>
                  </div>

                  {/* Alignment Controls - only show when 2+ nodes selected */}
                  {selectedNodes.length >= 2 && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Alinhar</h4>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlignNodes('left')}
                          className="h-8 px-2"
                          title="Alinhar à esquerda"
                        >
                          <Bars3BottomLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlignNodes('center-horizontal')}
                          className="h-8 px-2"
                          title="Centralizar horizontalmente"
                        >
                          <Bars3Icon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlignNodes('right')}
                          className="h-8 px-2"
                          title="Alinhar à direita"
                        >
                          <Bars3BottomRightIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlignNodes('top')}
                          className="h-8 px-2"
                          title="Alinhar ao topo"
                        >
                          <ArrowsUpDownIcon className="w-4 h-4 rotate-180" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlignNodes('center-vertical')}
                          className="h-8 px-2"
                          title="Centralizar verticalmente"
                        >
                          <ArrowsUpDownIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlignNodes('bottom')}
                          className="h-8 px-2"
                          title="Alinhar à base"
                        >
                          <ArrowsUpDownIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Distribution Controls - only show when 3+ nodes selected */}
                  {selectedNodes.length >= 3 && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Distribuir</h4>
                      <div className="grid grid-cols-2 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDistributeNodes('horizontal')}
                          className="h-8 gap-1.5"
                          title="Distribuir horizontalmente"
                        >
                          <ArrowsRightLeftIcon className="w-4 h-4" />
                          <span className="text-xs">Horiz.</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDistributeNodes('vertical')}
                          className="h-8 gap-1.5"
                          title="Distribuir verticalmente"
                        >
                          <ArrowsUpDownIcon className="w-4 h-4" />
                          <span className="text-xs">Vert.</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelectedNodes}
                      className="flex-1 gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Deletar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      className="flex-1"
                    >
                      Limpar Seleção
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <p>💡 Dica: Use Ctrl + Clique para selecionar múltiplos nós</p>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
          </div>
        )}
      </Card>

      {/* Relationship Selection Dialog */}
      <Dialog open={connectionDialog.isOpen} onOpenChange={(open) => !open && setConnectionDialog({
        isOpen: false,
        connection: null,
        sourceType: null,
        targetType: null,
      })}>
        <DialogContent className="glass-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Tipo de Relacionamento</DialogTitle>
            <DialogDescription>
              Escolha o tipo de relacionamento entre {connectionDialog.sourceType === 'person' ? 'pessoa' : 'propriedade'} e{' '}
              {connectionDialog.targetType === 'person' ? 'pessoa' : 'propriedade'}:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            {/* Show relevant relationship options based on connection types */}
            {connectionDialog.sourceType === 'person' && connectionDialog.targetType === 'property' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => createGraphEdge('sells')}
                  disabled={isCreatingEdge}
                  className="w-full justify-start h-auto py-3 flex-col items-start"
                >
                  <div className="font-medium">Vende</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Pessoa vende a propriedade
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => createGraphEdge('buys')}
                  disabled={isCreatingEdge}
                  className="w-full justify-start h-auto py-3 flex-col items-start"
                >
                  <div className="font-medium">Compra</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Pessoa compra a propriedade
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => createGraphEdge('owns')}
                  disabled={isCreatingEdge}
                  className="w-full justify-start h-auto py-3 flex-col items-start"
                >
                  <div className="font-medium">Proprietário</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Pessoa é proprietária da propriedade
                  </div>
                </Button>
              </>
            )}

            {connectionDialog.sourceType === 'person' && connectionDialog.targetType === 'person' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => createGraphEdge('spouse_of')}
                  disabled={isCreatingEdge}
                  className="w-full justify-start h-auto py-3 flex-col items-start"
                >
                  <div className="font-medium">Cônjuge de</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Pessoa é cônjuge da outra pessoa
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => createGraphEdge('represents')}
                  disabled={isCreatingEdge}
                  className="w-full justify-start h-auto py-3 flex-col items-start"
                >
                  <div className="font-medium">Representa</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Pessoa representa a outra pessoa
                  </div>
                </Button>
              </>
            )}
          </div>

          {isCreatingEdge && (
            <div className="flex items-center justify-center py-2">
              <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Criando conexão...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Proxy Attachment Dialog */}
      <AttachProxyDialog
        isOpen={proxyDialog.isOpen}
        caseId={caseId || ''}
        onClose={() => setProxyDialog({ isOpen: false, pendingRelationship: null })}
        onAttach={handleAttachProxy}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />

      {/* Edge Context Menu */}
      <ContextMenu
        isOpen={edgeContextMenu.isOpen}
        position={edgeContextMenu.position}
        items={edgeContextMenuItems}
        onClose={closeEdgeContextMenu}
      />

      {/* Edit Person Modal */}
      {editPersonModal.person && (
        <EditPersonModal
          isOpen={editPersonModal.isOpen}
          person={editPersonModal.person}
          onClose={() => setEditPersonModal({ isOpen: false, person: null })}
          onSave={() => {
            reload()
          }}
        />
      )}

      {/* Edit Property Modal */}
      {editPropertyModal.property && (
        <EditPropertyModal
          isOpen={editPropertyModal.isOpen}
          property={editPropertyModal.property}
          onClose={() => setEditPropertyModal({ isOpen: false, property: null })}
          onSave={() => {
            reload()
          }}
        />
      )}

      {/* Suggestions Panel */}
      <SuggestionsPanel
        suggestions={suggestions}
        isLoading={isLoadingSuggestions}
        onApplyEntitySuggestion={handleApplyEntitySuggestion}
        onApplyRelationshipSuggestion={handleApplyRelationshipSuggestion}
        onDismissSuggestion={handleDismissSuggestion}
        onRefresh={loadSuggestions}
      />
    </div>
  )
}

// Wrapper component with ReactFlowProvider context
export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasPageContent />
    </ReactFlowProvider>
  )
}
