'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import Graph3D from '@/components/Graph3D'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Eye, RefreshCw, Settings } from 'lucide-react'

interface GraphTestData {
  nodes: Array<{
    id: string
    name: string
    role: string
    department: string
    level: string
    color: string
    size: number
  }>
  links: Array<{
    source: string
    target: string
    type: string
    color: string
  }>
}

interface GraphStatus {
  neo4j: boolean
  rushdb: boolean
  anyConnected: boolean
}

export default function GraphTestPage() {
  const [graphData, setGraphData] = useState<GraphTestData | null>(null)
  const [status, setStatus] = useState<GraphStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [selectedSource, setSelectedSource] = useState<'neo4j' | 'rushdb' | 'hybrid'>('hybrid')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }, [])

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/graph/setup')
      const data = await response.json()
      setStatus(data.status)
      setSetupComplete(data.status?.anyConnected || false)
      addLog(`Status check: ${data.status?.anyConnected ? 'Connected' : 'Not connected'}`)
    } catch (error) {
      addLog(`Status check failed: ${error}`)
    }
  }, [addLog])

  const loadVisualizationData = useCallback(async () => {
    setLoading(true)
    addLog(`Loading visualization data from: ${selectedSource}`)
    
    try {
      const response = await fetch(`/api/graph/visualization?source=${selectedSource}`)
      const data = await response.json()
      
      if (data.success) {
        setGraphData(data.data)
        addLog(`✅ Loaded ${data.metadata.nodeCount} nodes, ${data.metadata.linkCount} links`)
      } else {
        addLog(`❌ Failed to load data: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ Data loading error: ${error}`)
    } finally {
      setLoading(false)
    }
  }, [selectedSource, addLog])

  const setupGraphDatabases = useCallback(async () => {
    setLoading(true)
    addLog('Starting graph database setup...')
    
    try {
      const response = await fetch('/api/graph/setup', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.status)
        setSetupComplete(true)
        addLog('✅ Graph databases initialized successfully')
        addLog(`Connected: Neo4j=${data.status.neo4j}, RushDB=${data.status.rushdb}`)
        
        // Automatically load visualization data
        await loadVisualizationData()
      } else {
        addLog(`❌ Setup failed: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ Setup error: ${error}`)
    } finally {
      setLoading(false)
    }
  }, [loadVisualizationData, addLog])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (setupComplete && selectedSource) {
      loadVisualizationData()
    }
  }, [selectedSource, setupComplete, loadVisualizationData])

  const handleNodeClick = (node: { name: string; role: string }) => {
    addLog(`Clicked: ${node.name} (${node.role})`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            3D Graph Visualization Test
          </h1>
          <p className="mt-2 text-gray-600">
            Testing Neo4j + RushDB integration with TechFlow Solutions company data
          </p>
          <div className="mt-1 text-xs text-gray-400 font-mono">
            🧪 Version: HARDCODED CREDENTIALS TEST - Production Ready!
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Database Status */}
                <div className="space-y-2">
                  <h4 className="font-medium">Database Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className={`flex items-center gap-2 ${status?.neo4j ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${status?.neo4j ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      Neo4j
                    </div>
                    <div className={`flex items-center gap-2 ${status?.rushdb ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${status?.rushdb ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      RushDB
                    </div>
                  </div>
                </div>

                {/* Setup Button */}
                <Button
                  onClick={setupGraphDatabases}
                  disabled={loading}
                  className="w-full"
                >
                  <Database className="mr-2 h-4 w-4" />
                  {loading ? 'Setting up...' : 'Setup Databases'}
                </Button>

                {/* Data Source Selection */}
                {setupComplete && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Data Source</h4>
                    <div className="space-y-1">
                      {['hybrid', 'rushdb', 'neo4j'].map((source) => (
                        <label key={source} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="source"
                            value={source}
                            checked={selectedSource === source}
                            onChange={(e) => setSelectedSource(e.target.value as 'neo4j' | 'rushdb' | 'hybrid')}
                            className="rounded"
                          />
                          {source.charAt(0).toUpperCase() + source.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refresh Button */}
                {setupComplete && (
                  <Button
                    onClick={loadVisualizationData}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            {graphData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Graph Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nodes:</span>
                      <span className="font-medium">{graphData.nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Links:</span>
                      <span className="font-medium">{graphData.links.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source:</span>
                      <span className="font-medium capitalize">{selectedSource}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3D Visualization */}
          <div className="lg:col-span-3">
            <Card className="h-[700px]">
              <CardHeader>
                <CardTitle>TechFlow Solutions - 3D Organization Network</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {graphData ? (
                  <Graph3D
                    data={graphData}
                    width={800}
                    height={600}
                    onNodeClick={handleNodeClick}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📊</div>
                      <div>No visualization data available</div>
                      <div className="text-sm mt-2">Set up databases first</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. <strong>Setup Databases:</strong> Click &quot;Setup Databases&quot; to initialize Neo4j and RushDB with TechFlow Solutions test data</p>
                <p>2. <strong>Select Source:</strong> Choose between Neo4j, RushDB, or Hybrid data sources</p>
                <p>3. <strong>Interact:</strong> Click and drag nodes, zoom with mouse wheel, click nodes for details</p>
                <p>4. <strong>Legend:</strong> Blue = Engineering, Green = Product, Yellow = Sales, Red = Marketing</p>
                <p>5. <strong>Links:</strong> Red lines = reporting relationships, Green lines = collaborations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}