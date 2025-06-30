'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'

export default function DataMagnetDebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [profileUrl, setProfileUrl] = useState('https://linkedin.com/in/philipaga')

  const debugDataMagnet = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/datamagnet-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileUrl
        })
      })

      const data = await response.json()
      setResult(data)
      
    } catch (error) {
      setResult({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataMagnet API Debug
          </h1>
          <p className="text-gray-600">
            Debug tool to inspect the raw DataMagnet API response structure
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test DataMagnet Response Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn Profile URL</label>
              <Input
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            
            <Button 
              onClick={debugDataMagnet}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Debugging...' : 'Debug API Response'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result.error ? (
                <div className="text-red-600">
                  <div className="font-medium">Error</div>
                  <div className="text-sm">{result.error}</div>
                </div>
              ) : result.success ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Top Level Keys:</h3>
                    <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                      {result.structure.topLevelKeys.join(', ')}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Sample Data:</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.structure.sampleData, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Full Response:</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.structure.fullResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No results yet</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}