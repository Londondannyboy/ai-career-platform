'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/Navigation'

export default function PhilipTestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const runTests = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      // Test 1: Check what's in Neo4j
      const debugResponse = await fetch('/api/neo4j-debug')
      const debugData = await debugResponse.json()
      
      // Test 2: Try different URL formats
      const testResponse = await fetch('/api/test-philip')
      const testData = await testResponse.json()
      
      // Test 3: Fetch fresh from DataMagnet
      const dmResponse = await fetch('/api/datamagnet-vanilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://linkedin.com/in/philipaga' })
      })
      const dmData = await dmResponse.json()
      
      // Test 4: Store in Neo4j
      const storeResponse = await fetch('/api/datamagnet-to-neo4j', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'person',
          data: dmData
        })
      })
      const storeResult = await storeResponse.json()
      
      // Test 5: Fetch graph data
      const storedUrl = dmData.linkedin_url || dmData.url || `https://linkedin.com/in/${dmData.public_identifier}`
      const graphResponse = await fetch(`/api/datamagnet-to-neo4j?type=person&url=${encodeURIComponent(storedUrl)}`)
      const graphData = await graphResponse.json()
      
      setResults({
        debug: debugData,
        urlTests: testData,
        datamagnet: {
          name: dmData.display_name,
          url: dmData.linkedin_url || dmData.url,
          recommendations: dmData.recommendations?.length || 0,
          alsoViewed: dmData.also_viewed?.length || 0
        },
        storeResult,
        graphData,
        storedUrl
      })
      
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Philip Agathangelou Neo4j Test</h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button 
              onClick={runTests} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </CardContent>
        </Card>
        
        {results && (
          <div className="space-y-6">
            {/* Neo4j Debug Info */}
            <Card>
              <CardHeader>
                <CardTitle>Neo4j Database Status</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(results.debug, null, 2)}
                </pre>
              </CardContent>
            </Card>
            
            {/* URL Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>URL Format Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(results.urlTests, null, 2)}
                </pre>
              </CardContent>
            </Card>
            
            {/* DataMagnet Data */}
            <Card>
              <CardHeader>
                <CardTitle>DataMagnet Profile Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {results.datamagnet.name}</p>
                  <p><strong>URL:</strong> {results.datamagnet.url}</p>
                  <p><strong>Recommendations:</strong> {results.datamagnet.recommendations}</p>
                  <p><strong>Also Viewed:</strong> {results.datamagnet.alsoViewed}</p>
                  <p><strong>Stored URL:</strong> {results.storedUrl}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Graph Data */}
            <Card>
              <CardHeader>
                <CardTitle>Graph Query Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(results.graphData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}