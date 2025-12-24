import { useParams } from 'react-router-dom'
import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  addEdge,
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
} from '@heroicons/react/24/outline'
import { PersonNode, PropertyNode, ContextMenu, EditPersonModal, EditPropertyModal, SuggestionsPanel } from '../components/canvas'
import type { PersonNodeData, PropertyNodeData, ContextMenuItem } from '../components/canvas'
import { useCanvasData } from '../hooks/useCanvasData'
import { supabase, createProcessingJob } from '../lib/supabase'
import type { Person, Property, GraphEdge as DBGraphEdge, RelationshipType } from '../types'
import { validateCanvas, type ValidationWarning } from '../utils/canvasValidation'
import { analyzeDocumentsForSuggestions, type CanvasSuggestions, type EntitySuggestion, type RelationshipSuggestion } from '../services/canvasSuggestions'

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  person: PersonNode,
  property: PropertyNode,
}

// Simple auto-layout using a grid/force-directed approach
function calculateNodePositions(
  people: Person[],
  properties: Property[],
  edges: DBGraphEdge[]
): { personPositions: Map<string, { x: number; y: number }>; propertyPositions: Map<string, { x: number; y: number }> } {
  const personPositions = new Map<string, { x: number; y: number }>()
  const propertyPositions = new Map<string, { x: number; y: number }>()

  // Simple grid layout: people on the left, properties on the right
  const horizontalSpacing = 400
  const verticalSpacing = 250
  const leftColumnX = 100
  const rightColumnX = 600

  // Position people in the left column
  people.forEach((person, index) => {
    personPositions.set(person.id, {
      x: leftColumnX,
      y: 100 + index * verticalSpacing,
    })
  })

  // Position properties in the right column
  properties.forEach((property, index) => {
    propertyPositions.set(property.id, {
      x: rightColumnX + (index % 2) * horizontalSpacing,
      y: 100 + Math.floor(index / 2) * verticalSpacing,
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

export default function CanvasPage() {
  const { caseId } = useParams()
  const { data, isLoading, error, reload } = useCanvasData(caseId)
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const [connectionMode, setConnectionMode] = useState(false)
  const [connectionDialog, setConnectionDialog] = useState<ConnectionDialogState>({
    isOpen: false,
    connection: null,
    sourceType: null,
    targetType: null,
  })
  const [isCreatingEdge, setIsCreatingEdge] = useState(false)
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
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
  const initialEdges = useMemo<Edge[]>(() => {
    return data.edges.map((edge) => {
      const sourceId =
        edge.source_type === 'person' ? `person-${edge.source_id}` : `property-${edge.source_id}`
      const targetId =
        edge.target_type === 'person' ? `person-${edge.target_id}` : `property-${edge.target_id}`

      return {
        id: edge.id,
        source: sourceId,
        target: targetId,
        label: getRelationshipLabel(edge.relationship),
        type: 'smoothstep',
        animated: !edge.confirmed,
        style: {
          stroke: edge.confirmed ? '#10b981' : '#f59e0b',
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#374151',
          fontWeight: 500,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
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
    return validateCanvas(data.people, data.properties, data.edges)
  }, [data.people, data.properties, data.edges])

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
      console.error('Error loading suggestions:', err)
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

        const { error } = await supabase.from(tableName).insert(entity)

        if (error) {
          console.error('Error adding entity:', error)
          alert(`Erro ao adicionar ${suggestion.type === 'person' ? 'pessoa' : 'propriedade'}: ` + error.message)
          return
        }

        // Reload canvas and suggestions
        reload()
        loadSuggestions()
      } catch (err) {
        console.error('Error applying entity suggestion:', err)
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
        const { error } = await supabase.from('graph_edges').insert({
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
          console.error('Error adding relationship:', error)
          alert('Erro ao adicionar relacionamento: ' + error.message)
          return
        }

        // Reload canvas and suggestions
        reload()
        loadSuggestions()
      } catch (err) {
        console.error('Error applying relationship suggestion:', err)
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
    async (relationship: RelationshipType) => {
      if (!connectionDialog.connection || !caseId) return

      setIsCreatingEdge(true)

      try {
        const { connection, sourceType, targetType } = connectionDialog

        // Extract IDs from node IDs (format: "person-{id}" or "property-{id}")
        const sourceId = connection.source!.split('-')[1]
        const targetId = connection.target!.split('-')[1]

        // Insert into graph_edges table
        const { data: newEdge, error: insertError } = await supabase
          .from('graph_edges')
          .insert({
            case_id: caseId,
            source_type: sourceType,
            source_id: sourceId,
            target_type: targetType,
            target_id: targetId,
            relationship,
            confidence: 1.0, // Manual connections have high confidence
            confirmed: false, // Require user confirmation
            metadata: {
              created_manually: true,
              created_at: new Date().toISOString(),
            },
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating edge:', insertError)
          alert('Erro ao criar conexão: ' + insertError.message)
          return
        }

        // Close dialog
        setConnectionDialog({
          isOpen: false,
          connection: null,
          sourceType: null,
          targetType: null,
        })

        // Reload canvas data to show new edge
        reload()
      } catch (err) {
        console.error('Error creating edge:', err)
        alert('Erro ao criar conexão')
      } finally {
        setIsCreatingEdge(false)
      }
    },
    [connectionDialog, caseId, reload]
  )

  // Generate draft from graph data
  const handleGenerateDraft = useCallback(async () => {
    if (!caseId) return

    setIsGeneratingDraft(true)

    try {
      // Create a draft generation job
      const { data: job, error } = await createProcessingJob(caseId, null, 'draft')

      if (error || !job) {
        console.error('Error creating draft job:', error)
        alert('Erro ao criar job de geração de minuta: ' + (error?.message || 'Unknown error'))
        return
      }

      console.log('Draft generation job created:', job)
      alert('Minuta sendo gerada! Acompanhe o progresso na página do caso.')
    } catch (err) {
      console.error('Error generating draft:', err)
      alert('Erro ao gerar minuta')
    } finally {
      setIsGeneratingDraft(false)
    }
  }, [caseId])

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
      onNodesChange([{ type: 'reset', item: newNodes }])
    }
  }, [data, nodes, onNodesChange])

  useMemo(() => {
    const newEdges = data.edges.map((edge) => {
      const sourceId =
        edge.source_type === 'person' ? `person-${edge.source_id}` : `property-${edge.source_id}`
      const targetId =
        edge.target_type === 'person' ? `person-${edge.target_id}` : `property-${edge.target_id}`

      return {
        id: edge.id,
        source: sourceId,
        target: targetId,
        label: getRelationshipLabel(edge.relationship),
        type: 'smoothstep',
        animated: !edge.confirmed,
        style: {
          stroke: edge.confirmed ? '#10b981' : '#f59e0b',
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#374151',
          fontWeight: 500,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
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
      onEdgesChange([{ type: 'reset', item: newEdges }])
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
          console.error(`Error deleting ${nodeType}:`, error)
          alert(`Erro ao deletar ${nodeType === 'person' ? 'pessoa' : 'propriedade'}: ` + error.message)
          return
        }

        // Reload canvas data
        reload()
      } catch (err) {
        console.error(`Error deleting ${nodeType}:`, err)
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
          console.error('Error deleting people:', personError)
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
          console.error('Error deleting properties:', propertyError)
          alert('Erro ao deletar propriedades: ' + propertyError.message)
          return
        }
      }

      // Reload canvas data
      reload()
    } catch (err) {
      console.error('Error deleting selected nodes:', err)
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

  // Delete edge handler
  const handleDeleteEdge = useCallback(
    async (edgeId: string) => {
      if (!caseId || !edgeId) return

      try {
        // Delete from database
        const { error } = await supabase.from('graph_edges').delete().eq('id', edgeId)

        if (error) {
          console.error('Error deleting edge:', error)
          alert('Erro ao deletar conexão: ' + error.message)
          return
        }

        // Reload canvas data
        reload()
      } catch (err) {
        console.error('Error deleting edge:', err)
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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-purple-500" />
            Canvas de Entidades
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualização interativa de pessoas, propriedades e relacionamentos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => zoomOut({ duration: 200 })}
              className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Diminuir zoom (ou use Ctrl + scroll)"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <button
              onClick={() => zoomIn({ duration: 200 })}
              className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Aumentar zoom (ou use Ctrl + scroll)"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 300 })}
              className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Ajustar visualização"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showMinimap
                ? 'bg-purple-500 text-white border-purple-600 hover:bg-purple-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            {showMinimap ? 'Ocultar Minimapa' : 'Mostrar Minimapa'}
          </button>
          <button
            onClick={() =>
              setSelectionMode(
                selectionMode === SelectionMode.Partial ? SelectionMode.Full : SelectionMode.Partial
              )
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              selectionMode === SelectionMode.Full
                ? 'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={
              selectionMode === SelectionMode.Full
                ? 'Box Selection: Arraste para selecionar múltiplos nós'
                : 'Clique para ativar seleção em caixa'
            }
          >
            <RectangleGroupIcon className="w-5 h-5" />
            {selectionMode === SelectionMode.Full ? 'Seleção em Caixa Ativa' : 'Ativar Seleção em Caixa'}
          </button>
          <button
            onClick={() => setConnectionMode(!connectionMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              connectionMode
                ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <LinkIcon className="w-5 h-5" />
            {connectionMode ? 'Modo Conexão Ativo' : 'Ativar Modo Conexão'}
          </button>
          <button
            onClick={handleGenerateDraft}
            disabled={isGeneratingDraft}
            className="btn-primary flex items-center gap-2"
          >
            <DocumentTextIcon className={`w-5 h-5 ${isGeneratingDraft ? 'animate-pulse' : ''}`} />
            {isGeneratingDraft ? 'Gerando...' : 'Gerar Minuta'}
          </button>
          <button
            onClick={reload}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
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
            <div
              key={warning.id}
              className={`rounded-lg p-4 border ${
                warning.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    warning.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                />
                <div className="flex-1">
                  <h4
                    className={`text-sm font-semibold ${
                      warning.type === 'error'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {warning.title}
                  </h4>
                  <p
                    className={`mt-1 text-sm ${
                      warning.type === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {warning.description}
                  </p>
                  {warning.affectedEntities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {warning.affectedEntities.map((entity, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            entity.type === 'person'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}
                        >
                          {entity.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Canvas */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneContextMenu={handlePaneContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            className="bg-gray-50 dark:bg-gray-900"
            connectionMode="loose"
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
            <Controls />
            {showMinimap && (
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === 'person') return '#3b82f6'
                  if (node.type === 'property') return '#10b981'
                  return '#6b7280'
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                pannable
                zoomable
              />
            )}
            <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.people.length} Pessoa(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.properties.length} Propriedade(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.edges.filter((e) => e.confirmed).length} Confirmado(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-yellow-500 animate-pulse"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.edges.filter((e) => !e.confirmed).length} Pendente(s)
                  </span>
                </div>
              </div>
            </Panel>

            {/* Selection Info Panel */}
            {selectedNodes.length > 0 && showSelectionPanel && (
              <Panel position="bottom-left" className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-indigo-500">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedNodes.length} {selectedNodes.length === 1 ? 'Item Selecionado' : 'Itens Selecionados'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowSelectionPanel(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Fechar painel"
                    >
                      ×
                    </button>
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

                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleDeleteSelectedNodes}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Deletar
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs font-medium"
                    >
                      Limpar Seleção
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <p>💡 Dica: Use Ctrl + Clique para selecionar múltiplos nós</p>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        )}
      </div>

      {/* Relationship Selection Dialog */}
      {connectionDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Selecionar Tipo de Relacionamento
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Escolha o tipo de relacionamento entre {connectionDialog.sourceType === 'person' ? 'pessoa' : 'propriedade'} e{' '}
              {connectionDialog.targetType === 'person' ? 'pessoa' : 'propriedade'}:
            </p>

            <div className="space-y-2 mb-6">
              {/* Show relevant relationship options based on connection types */}
              {connectionDialog.sourceType === 'person' && connectionDialog.targetType === 'property' && (
                <>
                  <button
                    onClick={() => createGraphEdge('sells')}
                    disabled={isCreatingEdge}
                    className="w-full px-4 py-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Vende</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Pessoa vende a propriedade
                    </div>
                  </button>
                  <button
                    onClick={() => createGraphEdge('buys')}
                    disabled={isCreatingEdge}
                    className="w-full px-4 py-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Compra</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Pessoa compra a propriedade
                    </div>
                  </button>
                  <button
                    onClick={() => createGraphEdge('owns')}
                    disabled={isCreatingEdge}
                    className="w-full px-4 py-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Proprietário</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Pessoa é proprietária da propriedade
                    </div>
                  </button>
                </>
              )}

              {connectionDialog.sourceType === 'person' && connectionDialog.targetType === 'person' && (
                <>
                  <button
                    onClick={() => createGraphEdge('spouse_of')}
                    disabled={isCreatingEdge}
                    className="w-full px-4 py-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Cônjuge de</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Pessoa é cônjuge da outra pessoa
                    </div>
                  </button>
                  <button
                    onClick={() => createGraphEdge('represents')}
                    disabled={isCreatingEdge}
                    className="w-full px-4 py-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Representa</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Pessoa representa a outra pessoa
                    </div>
                  </button>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setConnectionDialog({
                    isOpen: false,
                    connection: null,
                    sourceType: null,
                    targetType: null,
                  })
                }
                disabled={isCreatingEdge}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>

            {isCreatingEdge && (
              <div className="mt-4 flex items-center justify-center">
                <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Criando conexão...</span>
              </div>
            )}
          </motion.div>
        </div>
      )}

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
