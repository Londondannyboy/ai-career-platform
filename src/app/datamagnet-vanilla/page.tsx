'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'

export default function DataMagnetVanillaTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [profileUrl, setProfileUrl] = useState('https://linkedin.com/in/philipaga')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testVanillaDataMagnet = async () => {
    setLoading(true)
    setResult(null)
    addLog('🧪 Testing DataMagnet API - Vanilla Implementation (Exact Documentation)')
    addLog(`🌐 Profile URL: ${profileUrl}`)
    
    try {
      const response = await fetch('/api/datamagnet-vanilla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: profileUrl
        })
      })

      const data = await response.json()
      
      addLog(`📡 API Response: ${response.status}`)
      
      if (!response.ok) {
        addLog(`❌ Error: ${data.error || 'Unknown error'}`)
        if (data.details) {
          addLog(`📝 Details: ${data.details}`)
        }
        setResult({ error: data.error, details: data.details })
        return
      }

      addLog(`✅ Success! Received profile data`)
      setResult(data)
      
      // Log key data points
      if (data.display_name) {
        addLog(`👤 Found profile: ${data.display_name}`)
      }
      if (data.headline) {
        addLog(`💼 Headline: ${data.headline}`)
      }
      if (data.location) {
        addLog(`📍 Location: ${data.location}`)
      }

    } catch (error) {
      addLog(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataMagnet Vanilla API Test
          </h1>
          <p className="text-gray-600">
            Pure vanilla implementation following DataMagnet's exact documentation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>🧪 Vanilla API Test</CardTitle>
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
                onClick={testVanillaDataMagnet}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? '🔄 Testing...' : '🚀 Test DataMagnet API'}
              </Button>

              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                <div>• Exact DataMagnet documentation implementation</div>
                <div>• POST to /api/v1/linkedin/person</div>
                <div>• Bearer token authentication</div>
                <div>• 200 credits available</div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📊 API Response</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                result.error ? (
                  <div className="text-red-600">
                    <div className="font-medium">API Error</div>
                    <div className="text-sm">{result.error}</div>
                    {result.details && (
                      <div className="text-xs mt-1 text-gray-500">{result.details}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-green-600 font-medium">✅ API Call Successful!</div>
                    
                    {result.display_name && (
                      <div>
                        <span className="font-medium">Name:</span> {result.display_name}
                      </div>
                    )}
                    
                    {result.headline && (
                      <div>
                        <span className="font-medium">Headline:</span> {result.headline}
                      </div>
                    )}
                    
                    {result.location && (
                      <div>
                        <span className="font-medium">Location:</span> {result.location}
                      </div>
                    )}
                    
                    {result.industry && (
                      <div>
                        <span className="font-medium">Industry:</span> {result.industry}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-4">
                      Raw response size: {JSON.stringify(result).length} characters
                    </div>
                  </div>
                )
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No API response yet. Click test button to try DataMagnet API.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Raw Data View */}
        {result && !result.error && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>🔍 Raw API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Test Log</span>
              <Button onClick={clearLogs} variant="outline" size="sm">
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No test activity yet...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}