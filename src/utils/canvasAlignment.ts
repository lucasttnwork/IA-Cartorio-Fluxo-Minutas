import type { Node } from '@xyflow/react'

export type AlignmentType = 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical'
export type DistributionType = 'horizontal' | 'vertical'

/**
 * Get the bounding box of a node
 */
function getNodeBounds(node: Node) {
  // Default dimensions for person and property nodes
  const defaultWidths = {
    person: 320, // max-w-[340px] but typically smaller
    property: 300, // max-w-[320px] but typically smaller
  }

  const defaultHeights = {
    person: 280, // Approximate height based on content
    property: 240, // Approximate height based on content
  }

  const nodeType = node.type as 'person' | 'property'
  const width = defaultWidths[nodeType] || 300
  const height = defaultHeights[nodeType] || 250

  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
    centerX: node.position.x + width / 2,
    centerY: node.position.y + height / 2,
    right: node.position.x + width,
    bottom: node.position.y + height,
  }
}

/**
 * Align selected nodes based on the specified alignment type
 */
export function alignNodes(nodes: Node[], alignmentType: AlignmentType): Node[] {
  if (nodes.length < 2) return nodes

  const bounds = nodes.map((node) => ({
    node,
    bounds: getNodeBounds(node),
  }))

  let referenceValue: number

  switch (alignmentType) {
    case 'left':
      // Align all nodes to the leftmost x position
      referenceValue = Math.min(...bounds.map((b) => b.bounds.x))
      return bounds.map(({ node }) => ({
        ...node,
        position: {
          ...node.position,
          x: referenceValue,
        },
      }))

    case 'right':
      // Align all nodes to the rightmost right edge
      referenceValue = Math.max(...bounds.map((b) => b.bounds.right))
      return bounds.map(({ node, bounds: b }) => ({
        ...node,
        position: {
          ...node.position,
          x: referenceValue - b.width,
        },
      }))

    case 'top':
      // Align all nodes to the topmost y position
      referenceValue = Math.min(...bounds.map((b) => b.bounds.y))
      return bounds.map(({ node }) => ({
        ...node,
        position: {
          ...node.position,
          y: referenceValue,
        },
      }))

    case 'bottom':
      // Align all nodes to the bottommost bottom edge
      referenceValue = Math.max(...bounds.map((b) => b.bounds.bottom))
      return bounds.map(({ node, bounds: b }) => ({
        ...node,
        position: {
          ...node.position,
          y: referenceValue - b.height,
        },
      }))

    case 'center-horizontal':
      // Align all nodes to the average center X
      const avgCenterX = bounds.reduce((sum, b) => sum + b.bounds.centerX, 0) / bounds.length
      return bounds.map(({ node, bounds: b }) => ({
        ...node,
        position: {
          ...node.position,
          x: avgCenterX - b.width / 2,
        },
      }))

    case 'center-vertical':
      // Align all nodes to the average center Y
      const avgCenterY = bounds.reduce((sum, b) => sum + b.bounds.centerY, 0) / bounds.length
      return bounds.map(({ node, bounds: b }) => ({
        ...node,
        position: {
          ...node.position,
          y: avgCenterY - b.height / 2,
        },
      }))

    default:
      return nodes
  }
}

/**
 * Distribute nodes evenly based on the specified distribution type
 */
export function distributeNodes(nodes: Node[], distributionType: DistributionType): Node[] {
  if (nodes.length < 3) return nodes

  const bounds = nodes.map((node) => ({
    node,
    bounds: getNodeBounds(node),
  }))

  if (distributionType === 'horizontal') {
    // Sort by x position
    const sorted = [...bounds].sort((a, b) => a.bounds.x - b.bounds.x)

    // Calculate total width and spacing
    const firstX = sorted[0].bounds.x
    const lastX = sorted[sorted.length - 1].bounds.x
    const totalGap = lastX - firstX
    const spacing = totalGap / (sorted.length - 1)

    return sorted.map(({ node }, index) => ({
      ...node,
      position: {
        ...node.position,
        x: firstX + spacing * index,
      },
    }))
  } else {
    // Vertical distribution
    // Sort by y position
    const sorted = [...bounds].sort((a, b) => a.bounds.y - b.bounds.y)

    // Calculate total height and spacing
    const firstY = sorted[0].bounds.y
    const lastY = sorted[sorted.length - 1].bounds.y
    const totalGap = lastY - firstY
    const spacing = totalGap / (sorted.length - 1)

    return sorted.map(({ node }, index) => ({
      ...node,
      position: {
        ...node.position,
        y: firstY + spacing * index,
      },
    }))
  }
}

/**
 * Distribute nodes with equal spacing between them
 */
export function distributeNodesWithSpacing(
  nodes: Node[],
  distributionType: DistributionType,
  spacing: number = 50
): Node[] {
  if (nodes.length < 2) return nodes

  const bounds = nodes.map((node) => ({
    node,
    bounds: getNodeBounds(node),
  }))

  if (distributionType === 'horizontal') {
    // Sort by x position
    const sorted = [...bounds].sort((a, b) => a.bounds.x - b.bounds.x)

    let currentX = sorted[0].bounds.x

    return sorted.map(({ node, bounds: b }, index) => {
      if (index === 0) {
        return node
      }

      currentX += sorted[index - 1].bounds.width + spacing

      return {
        ...node,
        position: {
          ...node.position,
          x: currentX,
        },
      }
    })
  } else {
    // Vertical distribution
    const sorted = [...bounds].sort((a, b) => a.bounds.y - b.bounds.y)

    let currentY = sorted[0].bounds.y

    return sorted.map(({ node, bounds: b }, index) => {
      if (index === 0) {
        return node
      }

      currentY += sorted[index - 1].bounds.height + spacing

      return {
        ...node,
        position: {
          ...node.position,
          y: currentY,
        },
      }
    })
  }
}
