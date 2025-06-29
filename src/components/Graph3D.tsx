'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
})

interface Node {
  id: string
  name: string
  role: string
  department: string
  level: string
  color: string
  size: number
  x?: number
  y?: number
  z?: number
}

interface Link {
  source: string
  target: string
  type: string
  color: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}


interface Graph3DProps {
  data?: GraphData
  width?: number
  height?: number
  onNodeClick?: (node: Node) => void
  onNodeHover?: (node: Node | null) => void
}

export default function Graph3D({ 
  data, 
  width = 800, 
  height = 600,
  onNodeClick,
  onNodeHover 
}: Graph3DProps) {
  const graphRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (graphRef.current && data?.nodes) {
      // Center the graph
      graphRef.current.centerAt(0, 0, 200)
      graphRef.current.cameraPosition({ z: 400 })
      
      // Add some initial force
      graphRef.current.d3Force('charge').strength(-300)
      graphRef.current.d3Force('link').distance(100)
    }
  }, [data])

  const handleNodeClick = (node: any) => {
    setSelectedNode(node as Node)
    if (onNodeClick) {
      onNodeClick(node as Node)
    }
    
    // Focus camera on clicked node
    if (graphRef.current && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      const distance = 200
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z)
      graphRef.current.cameraPosition(
        { 
          x: node.x * distRatio, 
          y: node.y * distRatio, 
          z: node.z * distRatio 
        },
        node, // lookAt
        1000  // duration
      )
    }
  }

  const handleNodeHover = (node: any) => {
    if (onNodeHover) {
      onNodeHover(node as Node | null)
    }
  }

  // Simplified node styling (no custom 3D objects for now)
  const nodeColor = (node: any) => node.color || '#3B82F6'
  const nodeSize = (node: any) => node.size || 10
  const linkColor = (link: any) => link.color || '#999999'

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="mb-4 text-4xl">📊</div>
        <div className="font-medium">No graph data available</div>
        <div className="text-sm mt-2">Click "Setup Databases" to load TechFlow Solutions data</div>
        <div className="text-xs mt-2 text-gray-400">Expected: 12 employees across 4 departments</div>
      </div>
    )
  }

  return (
    <div className="relative">
      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        width={width}
        height={height}
        nodeLabel="name"
        nodeColor={nodeColor}
        nodeVal={nodeSize}
        linkColor={linkColor}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        backgroundColor="rgba(0,0,0,0)"
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={true}
      />
      
      {/* Node info panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
          <h3 className="font-bold text-lg mb-2">{selectedNode.name}</h3>
          <div className="space-y-1 text-sm">
            <div><strong>Role:</strong> {selectedNode.role}</div>
            <div><strong>Department:</strong> {selectedNode.department}</div>
            <div><strong>Level:</strong> {selectedNode.level}</div>
          </div>
          <button 
            onClick={() => setSelectedNode(null)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  )
}