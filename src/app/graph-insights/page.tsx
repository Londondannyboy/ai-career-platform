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

export default function GraphInsightsPage() {
  const [profileUrl, setProfileUrl] = useState('https://linkedin.com/in/philipaga')
  const [loading, setLoading] = useState(false)
  const [graphData, setGraphData] = useState<any>(null)
  const [error, setError] = useState('')
  const [dataSource, setDataSource] = useState<'neo4j' | 'datamagnet'>('datamagnet')

  const fetchAndStoreProfile = async () => {
    setLoading(true)
    setError('')
    
    try {
      // First fetch from DataMagnet
      const dmResponse = await fetch('/api/datamagnet-vanilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: profileUrl })
      })
      
      if (!dmResponse.ok) throw new Error('Failed to fetch from DataMagnet')
      
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
      
      // Fetch graph data from Neo4j
      const storedUrl = profileData.linkedin_url || profileData.url || `https://linkedin.com/in/${profileData.public_identifier}`
      console.log('Profile data URLs:', {
        linkedin_url: profileData.linkedin_url,
        url: profileData.url,
        public_identifier: profileData.public_identifier,
        computed: storedUrl
      })
      const graphResponse = await fetch(`/api/datamagnet-to-neo4j?type=person&url=${encodeURIComponent(storedUrl)}`)
      
      if (!graphResponse.ok) throw new Error('Failed to fetch graph data')
      
      const graphResult = await graphResponse.json()
      console.log('Graph result:', graphResult)
      
      if (!graphResult.data) {
        throw new Error('No graph data returned from Neo4j')
      }
      
      // Check if we have actual relationships
      const hasRelationships = graphResult.data.relationships && 
        (graphResult.data.relationships.recommendations?.length > 0 || 
         graphResult.data.relationships.networkClusters?.length > 0)
      
      if (!hasRelationships) {
        console.warn('No relationships found in graph data')
      }
      
      setGraphData(graphResult.data)
      setDataSource('neo4j')
      
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to process profile. Using DataMagnet visualization instead.')
      
      // Fallback to DataMagnet direct visualization
      try {
        const dmResponse = await fetch('/api/datamagnet-vanilla', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: profileUrl })
        })
        
        if (dmResponse.ok) {
          const profileData = await dmResponse.json()
          // Convert to graph format
          setGraphData({
            person: profileData,
            relationships: {
              recommendations: profileData.recommendations?.map((rec: any) => ({
                node: { properties: { name: rec.recommender_name, title: rec.recommender_title } },
                relationship: { properties: { relationshipType: 'RECOMMENDS' } }
              })) || [],
              networkClusters: profileData.also_viewed?.map((person: any) => ({
                node: { properties: person },
                relationship: { properties: {} }
              })) || []
            }
          })
          setDataSource('datamagnet')
        }
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyGraph = async () => {
    setLoading(true)
    setError('')
    
    try {
      const companyUrl = profileUrl.includes('/company/') ? profileUrl : 'https://linkedin.com/company/ckdelta'
      
      // First fetch from DataMagnet
      const dmResponse = await fetch('/api/datamagnet-company-vanilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: companyUrl })
      })
      
      if (!dmResponse.ok) throw new Error('Failed to fetch from DataMagnet')
      
      const companyResponse = await dmResponse.json()
      
      // Store in Neo4j
      const storeResponse = await fetch('/api/datamagnet-to-neo4j', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'company',
          data: companyResponse
        })
      })
      
      if (!storeResponse.ok) throw new Error('Failed to store in Neo4j')
      
      // Navigate through nested message structure
      let companyData = companyResponse.message
      while (companyData?.message) {
        companyData = companyData.message
      }
      
      // Fetch graph data from Neo4j
      const graphResponse = await fetch(`/api/datamagnet-to-neo4j?type=company&url=${encodeURIComponent(companyData.formatted_url || companyUrl)}`)
      
      if (!graphResponse.ok) throw new Error('Failed to fetch graph data')
      
      const graphResult = await graphResponse.json()
      setGraphData(graphResult.data)
      setDataSource('neo4j')
      
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to process company graph')
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
            Neo4j Knowledge Graph Explorer
          </h1>
          <p className="text-gray-600">
            Build and visualize relationship graphs from DataMagnet data
          </p>
        </div>

        {/* Input Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="LinkedIn profile or company URL"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={fetchAndStoreProfile} 
                disabled={loading}
                variant="default"
              >
                {loading ? 'Processing...' : 'Analyze Profile'}
              </Button>
              <Button 
                onClick={fetchCompanyGraph} 
                disabled={loading}
                variant="outline"
              >
                Analyze Company
              </Button>
            </div>
            
            {dataSource && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Data source:</span>
                <Badge variant={dataSource === 'neo4j' ? 'default' : 'secondary'}>
                  {dataSource === 'neo4j' ? 'Neo4j Graph Database' : 'DataMagnet Direct'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Graph Visualization */}
        {graphData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🕸️ Relationship Graph</span>
                <div className="text-sm font-normal text-gray-500">
                  Interactive Neo4j visualization
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
                    <span>Main Profile / Verified Relationships</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span>Company / Network Clusters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <span>Employees / Works At</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                    <span>Locations</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use the Graph Explorer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>For People:</strong> Enter a LinkedIn profile URL to visualize their professional network,
                including verified relationships from recommendations and "Also Viewed" network clusters.
              </div>
              <div>
                <strong>For Companies:</strong> Click "Analyze Company" to see the organizational structure,
                key employees, and office locations.
              </div>
              <div>
                <strong>Graph Interaction:</strong> Drag nodes to rearrange, hover for details, and watch the
                physics simulation organize the relationships naturally.
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <strong>💡 Pro Tip:</strong> The graph data is stored in Neo4j, allowing you to run complex
                queries and build comprehensive organizational intelligence over time.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}