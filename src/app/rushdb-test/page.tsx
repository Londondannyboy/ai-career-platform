'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RushDBTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
  }

  const createTestData = async () => {
    setLoading(true)
    addLog('Creating simple RushDB test data...')
    
    try {
      const response = await fetch('/api/rushdb-simple', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        addLog('✅ Test data created successfully')
      } else {
        addLog(`❌ Failed: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    addLog('Loading visualization data...')
    
    try {
      const response = await fetch('/api/rushdb-simple')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        addLog(`✅ Loaded ${result.metadata.nodeCount} nodes, ${result.metadata.linkCount} links`)
      } else {
        addLog(`❌ Failed: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Simple RushDB Test
          </h1>
          <p className="mt-2 text-gray-600">
            Testing clean RushDB implementation following their documentation exactly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={createTestData}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create Test Data'}
              </Button>
              
              <Button
                onClick={loadData}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Loading...' : 'Load Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-600">
                    {log}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-400">No activity yet...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Display */}
        {data && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Retrieved Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Nodes ({data.nodes?.length || 0}):</h4>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{JSON.stringify(data.nodes, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Links ({data.links?.length || 0}):</h4>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{JSON.stringify(data.links, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Click "Create Test Data" to insert simple employee records into RushDB</li>
              <li>Click "Load Data" to retrieve and transform the data for visualization</li>
              <li>Check the activity log for any errors or issues</li>
              <li>If successful, the retrieved data will be displayed below</li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}