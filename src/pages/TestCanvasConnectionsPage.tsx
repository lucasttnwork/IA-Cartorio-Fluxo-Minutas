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
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  SparklesIcon,
  LinkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowsPointingOutIcon,
  MapIcon,
  RectangleGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { PersonNode, PropertyNode, ContextMenu } from '../components/canvas'
import type { PersonNodeData, PropertyNodeData, ContextMenuItem } from '../components/canvas'
import type { RelationshipType } from '../types'
import { validateCanvas, type ValidationWarning } from '../utils/canvasValidation'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Test data - hardcoded for demo purposes
const testPeople = [
  {
    id: '22222222-2222-2222-2222-222222222221',
    full_name: 'João Silva',
    cpf: '123.456.789-01',
    marital_status: 'married' as const,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Maria Silva',
    cpf: '987.654.321-02',
    marital_status: 'married' as const,
  },
  {
    id: '22222222-2222-2222-2222-222222222223',
    full_name: 'Pedro Santos',
    cpf: '456.789.123-03',
    marital_status: 'single' as const,
  },
]

const testProperties = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    registry_number: 'REG-001',
    address: { street: 'Rua das Flores', number: '123', city: 'São Paulo' },
    area_sqm: 150.0,
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    registry_number: 'REG-002',
    address: { street: 'Av. Paulista', number: '456', city: 'São Paulo' },
    area_sqm: 200.0,
  },
]

const testEdges = [
  {
    id: 'edge-1',
    source_type: 'person' as const,
    source_id: '22222222-2222-2222-2222-222222222221',
    target_type: 'person' as const,
    target_id: '22222222-2222-2222-2222-222222222222',
    relationship: 'spouse_of' as const,
    confidence: 1.0,
    confirmed: true,
  },
  {
    id: 'edge-2',
    source_type: 'person' as const,
    source_id: '22222222-2222-2222-2222-222222222221',
    target_type: 'property' as const,
    target_id: '33333333-3333-3333-3333-333333333331',
    relationship: 'sells' as const,  // Changed from 'owns' to 'sells' to trigger validation
    confidence: 0.8,
    confirmed: false,
  },
]

// Connection dialog state
interface ConnectionDialogState {
  isOpen: boolean
  connection: Connection | null
  sourceType: 'person' | 'property' | null
  targetType: 'person' | 'property' | null
}

export default function TestCanvasConnectionsPage() {
  const [connectionMode, setConnectionMode] = useState(false)
  const [connectionDialog, setConnectionDialog] = useState<ConnectionDialogState>({
    isOpen: false,
    connection: null,
    sourceType: null,
    targetType: null,
  })
  const [isCreatingEdge, setIsCreatingEdge] = useState(false)
  const [manualEdges, setManualEdges] = useState<any[]>([])
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
  const [showMinimap, setShowMinimap] = useState(true)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.Partial)
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [showSelectionPanel, setShowSelectionPanel] = useState(true)

  // Transform data into React Flow nodes
  const initialNodes = useMemo(() => {
    const nodes: Node<PersonNodeData | PropertyNodeData>[] = []

    // Add person nodes
    testPeople.forEach((person, idx) => {
      nodes.push({
        id: `person-${person.id}`,
        type: 'person',
        position: { x: 100, y: idx * 200 },
        data: { person } as PersonNodeData,
      })
    })

    // Add property nodes
    testProperties.forEach((property, idx) => {
      nodes.push({
        id: `property-${property.id}`,
        type: 'property',
        position: { x: 600, y: idx * 250 },
        data: { property } as PropertyNodeData,
      })
    })

    return nodes
  }, [])

  // Transform edges - update whenever manualEdges changes
  const allEdges = useMemo(() => {
    const combined = [...testEdges, ...manualEdges]
    return combined.map((edge) => ({
      id: edge.id,
      source: `${edge.source_type}-${edge.source_id}`,
      target: `${edge.target_type}-${edge.target_id}`,
      label: edge.relationship.replace(/_/g, ' '),
      type: 'default',
      animated: !edge.confirmed,
      style: {
        stroke: edge.confirmed ? '#10b981' : '#f59e0b',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.confirmed ? '#10b981' : '#f59e0b',
      },
    }))
  }, [manualEdges])

  const initialEdges = allEdges

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      person: PersonNode,
      property: PropertyNode,
    }),
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Track selected nodes whenever nodes change
  useEffect(() => {
    const selected = nodes.filter((node) => node.selected)
    setSelectedNodes(selected)
  }, [nodes])

  // Update edges when allEdges changes (when manual edges are added)
  useEffect(() => {
    setEdges(allEdges)
  }, [allEdges, setEdges])

  // Compute validation warnings
  const validationWarnings = useMemo<ValidationWarning[]>(() => {
    const combinedEdges = [...testEdges, ...manualEdges].map(edge => ({
      ...edge,
      case_id: 'test-case',
      metadata: {},
      created_at: new Date().toISOString()
    }))
    const peopleWithDefaults = testPeople.map(p => ({
      ...p,
      case_id: 'test-case',
      rg: null,
      rg_issuer: null,
      birth_date: null,
      nationality: null,
      profession: null,
      address: null,
      email: null,
      phone: null,
      father_name: null,
      mother_name: null,
      confidence: 0.95,
      source_docs: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    const propertiesWithDefaults = testProperties.map(p => ({
      ...p,
      case_id: 'test-case',
      registry_office: null,
      description: null,
      iptu_number: null,
      encumbrances: null,
      confidence: 0.90,
      source_docs: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    return validateCanvas(peopleWithDefaults, propertiesWithDefaults, combinedEdges)
  }, [manualEdges])

  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connectionMode) return

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
    [connectionMode]
  )

  // Create edge
  const createGraphEdge = useCallback(
    async (relationship: RelationshipType) => {
      if (!connectionDialog.connection) return

      setIsCreatingEdge(true)

      try {
        const { connection, sourceType, targetType } = connectionDialog

        // Extract IDs from node IDs
        const sourceId = connection.source!.split('-')[1]
        const targetId = connection.target!.split('-')[1]

        // Create new edge
        const newEdge = {
          id: `edge-manual-${Date.now()}`,
          source_type: sourceType,
          source_id: sourceId,
          target_type: targetType,
          target_id: targetId,
          relationship,
          confidence: 1.0,
          confirmed: false,
        }

        // Add to manual edges
        setManualEdges((prev) => [...prev, newEdge])

        // Close dialog
        setConnectionDialog({
          isOpen: false,
          connection: null,
          sourceType: null,
          targetType: null,
        })

        // Show success message
        alert('Conexão criada com sucesso! (Demo mode - não salvo no banco)')
      } catch (err) {
        console.error('Error creating edge:', err)
        alert('Erro ao criar conexão')
      } finally {
        setIsCreatingEdge(false)
      }
    },
    [connectionDialog]
  )

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

  // Delete node handler (for demo - just shows alert)
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const nodeType = nodeId.startsWith('person-') ? 'person' : 'property'
      alert(`Demo mode: Would delete ${nodeType} with ID ${nodeId}`)
    },
    []
  )

  // Delete selected nodes (bulk delete demo)
  const handleDeleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return

    const personCount = selectedNodes.filter((n) => n.id.startsWith('person-')).length
    const propertyCount = selectedNodes.filter((n) => n.id.startsWith('property-')).length

    alert(`Demo mode: Would delete ${selectedNodes.length} selected nodes\n${personCount} person(s) and ${propertyCount} property(ies)`)
  }, [selectedNodes])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    )
  }, [setNodes])

  // Delete edge handler (for demo)
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      // Remove from manual edges if it's a manual edge
      if (edgeId.startsWith('edge-manual-')) {
        setManualEdges((prev) => prev.filter((edge) => edge.id !== edgeId))
        alert('Conexão removida! (Demo mode)')
      } else {
        alert(`Demo mode: Would delete edge with ID ${edgeId}`)
      }
    },
    []
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
            alert(`Demo mode: View details for ${contextMenu.nodeId}`)
          },
        },
        {
          id: 'edit',
          label: 'Editar',
          icon: PencilIcon,
          onClick: () => {
            alert(`Demo mode: Edit ${contextMenu.nodeId}`)
          },
        },
        {
          id: 'duplicate',
          label: 'Duplicar',
          icon: DocumentDuplicateIcon,
          onClick: () => {
            alert(`Demo mode: Duplicate ${contextMenu.nodeId}`)
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
            alert('Demo mode: Fit view')
          },
        },
        {
          id: 'refresh',
          label: 'Atualizar',
          icon: ArrowPathIcon,
          onClick: () => {
            alert('Demo mode: Refresh canvas')
          },
        },
      ]
    }
  }, [contextMenu.nodeId, contextMenu.nodeType, handleDeleteNode])

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

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <SparklesIcon className="w-7 h-7 text-purple-500" />
              Test Canvas Connections
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Demo da funcionalidade de conexões manuais entre entidades
            </p>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={() => {
                // Simulate a connection from Pedro Santos to REG-002
                const connection = {
                  source: 'person-22222222-2222-2222-2222-222222222223',
                  target: 'property-33333333-3333-3333-3333-333333333332',
                  sourceHandle: null,
                  targetHandle: null,
                }
                setConnectionDialog({
                  isOpen: true,
                  connection,
                  sourceType: 'person',
                  targetType: 'property',
                })
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <SparklesIcon className="w-5 h-5" />
              Testar Conexão
            </button>
          </div>
        </div>

        {connectionMode && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Modo Conexão Ativo:</strong> Clique e arraste de um nó para outro para criar uma conexão.
            </p>
          </div>
        )}
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="px-6 py-4 space-y-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {validationWarnings.map((warning) => (
            <motion.div
              key={warning.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
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
            </motion.div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1">
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
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          )}

          <Panel position="top-left">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Legenda
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Pessoa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Propriedade</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Não confirmado</span>
                </div>
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
                </> )}
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
    </div>
  )
}
