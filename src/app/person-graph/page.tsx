'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

const Neo4jGraphVisualization = dynamic(() => import('@/components/Neo4jGraphVisualization'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading graph...</div>
})

export default function PersonGraphPage() {
  const [identifier, setIdentifier] = useState('philipaga') // Default to username
  const [loading, setLoading] = useState(false)
  const [graphData, setGraphData] = useState<any>(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)

  const refreshFromDataMagnet = async () => {
    setLoading(true)
    setError('')
    
    try {
      let username = identifier
      if (identifier.includes('linkedin.com')) {
        const match = identifier.match(/\/in\/([^\/\?]+)/i)
        if (match) username = match[1]
      }
      
      // Fetch fresh data from DataMagnet
      const dmResponse = await fetch('/api/datamagnet-vanilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://linkedin.com/in/${username}` })
      })
      
      if (!dmResponse.ok) {
        throw new Error('Failed to fetch from DataMagnet - check API token in Vercel environment variables')
      }
      
      const profileData = await dmResponse.json()
      
      // Store in Neo4j
      const storeResponse = await fetch('/api/datamagnet-to-neo4j', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'person',
          data: profileData
        })
      })
      
      if (!storeResponse.ok) throw new Error('Failed to store in Neo4j')
      
      // Now visualize
      await visualizeFromNeo4j()
      
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh from DataMagnet')
    } finally {
      setLoading(false)
    }
  }

  const visualizeFromNeo4j = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Extract username from URL if needed
      let username = identifier
      if (identifier.includes('linkedin.com')) {
        const match = identifier.match(/\/in\/([^\/\?]+)/i)
        if (match) username = match[1]
      }
      
      // Step 1: Clean up duplicates
      const cleanupResponse = await fetch('/api/neo4j-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cleanup-duplicates',
          username 
        })
      })
      
      const cleanupResult = await cleanupResponse.json()
      console.log('Cleanup result:', cleanupResult)
      
      // Step 2: Fetch graph data directly from Neo4j (data already stored)
      // Skip DataMagnet API call since we already have the data
      const graphResponse = await fetch(`/api/datamagnet-to-neo4j?type=person&url=${encodeURIComponent(username)}`)
      
      if (!graphResponse.ok) throw new Error('Failed to fetch graph data')
      
      const graphResult = await graphResponse.json()
      setGraphData(graphResult.data)
      
      // Set stats
      if (graphResult.data) {
        setStats({
          recommendations: graphResult.data.relationships?.recommendations?.length || 0,
          networkClusters: graphResult.data.relationships?.networkClusters?.length || 0,
          cleanup: cleanupResult
        })
      }
      
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Person Network Graph
          </h1>
          <p className="text-gray-600">
            Visualize professional networks with clean, deduplicated data
          </p>
        </div>

        {/* Input Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="LinkedIn username (e.g., philipaga) or full URL"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={visualizeFromNeo4j} 
                  disabled={loading}
                  variant="default"
                >
                  {loading ? 'Processing...' : 'Visualize from Neo4j'}
                </Button>
                <Button 
                  onClick={refreshFromDataMagnet} 
                  disabled={loading}
                  variant="outline"
                  title="Requires DataMagnet API token in Vercel environment"
                >
                  Refresh from API
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                ℹ️ Visualizes existing data from Neo4j database. Use "Refresh from API" only if you need updated data.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.recommendations}</div>
                  <div className="text-sm text-gray-500">Recommendations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.networkClusters}</div>
                  <div className="text-sm text-gray-500">Network Connections</div>
                </div>
                {stats.cleanup?.deleted !== undefined && (
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.cleanup.deleted}</div>
                    <div className="text-sm text-gray-500">Duplicates Removed</div>
                  </div>
                )}
                {stats.cleanup?.newUrl && (
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {stats.cleanup.newUrl}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Graph Visualization */}
        {graphData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🕸️ Professional Network</span>
                <div className="text-sm font-normal text-gray-500">
                  {graphData.person?.name || 'Unknown'}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Neo4jGraphVisualization data={graphData} height="600px" />
              
              {/* Graph Legend */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">Graph Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    <span>Recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span>Also Viewed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <span>Current Company</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span>Main Profile</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How This Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>1. Unique Identification:</strong> We use the LinkedIn username (e.g., "philipaga") 
                as the unique identifier to prevent duplicates.
              </div>
              <div>
                <strong>2. Automatic Cleanup:</strong> Before fetching new data, we automatically remove 
                any duplicate profiles, keeping the one with the most connections.
              </div>
              <div>
                <strong>3. Neo4j Query:</strong> We query existing data from Neo4j database - 
                no need to call external APIs.
              </div>
              <div>
                <strong>4. Rich Visualization:</strong> The graph shows verified recommendations 
                and "Also Viewed" network connections.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}