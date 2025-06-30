'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Using native select instead of UI component
import Navigation from '@/components/Navigation'

export default function DataMagnetCompanyVanillaTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [companyUrl, setCompanyUrl] = useState('https://linkedin.com/company/ckdelta')
  const [useCache, setUseCache] = useState('if-recent')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testVanillaCompanyAPI = async () => {
    setLoading(true)
    setResult(null)
    addLog('🏢 Testing DataMagnet Company API - Vanilla Implementation')
    addLog(`🌐 Company URL: ${companyUrl}`)
    addLog(`💾 Cache Setting: ${useCache}`)
    
    try {
      const response = await fetch('/api/datamagnet-company-vanilla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: companyUrl,
          use_cache: useCache
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

      addLog(`✅ Success! Received company data`)
      setResult(data)
      
      // Log key data points from the response
      if (data.message?.company_name) {
        addLog(`🏢 Company: ${data.message.company_name}`)
      }
      if (data.message?.employees) {
        addLog(`👥 Employees: ${data.message.employees}`)
      }
      if (data.message?.industry) {
        addLog(`🏭 Industry: ${data.message.industry}`)
      }
      if (data.message?.location) {
        addLog(`📍 Location: ${data.message.location}`)
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
            DataMagnet Company Vanilla API Test
          </h1>
          <p className="text-gray-600">
            Pure vanilla implementation following DataMagnet's exact company documentation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>🏢 Vanilla Company API Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn Company URL</label>
                <Input
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/company-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cache Setting</label>
                <select 
                  value={useCache} 
                  onChange={(e) => setUseCache(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="if-present">if-present</option>
                  <option value="if-recent">if-recent</option>
                  <option value="never">never</option>
                </select>
              </div>
              
              <Button 
                onClick={testVanillaCompanyAPI}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? '🔄 Testing...' : '🚀 Test Company API'}
              </Button>

              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                <div>• Exact DataMagnet Company API implementation</div>
                <div>• POST to /api/v1/linkedin/company</div>
                <div>• Bearer token authentication</div>
                <div>• 1 credit per successful request</div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Company API Response</CardTitle>
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
                    <div className="text-green-600 font-medium">✅ Company API Success!</div>
                    
                    {result.message?.company_name && (
                      <div>
                        <span className="font-medium">Company:</span> {result.message.company_name}
                      </div>
                    )}
                    
                    {result.message?.company_id && (
                      <div>
                        <span className="font-medium">ID:</span> {result.message.company_id}
                      </div>
                    )}
                    
                    {result.message?.employees && (
                      <div>
                        <span className="font-medium">Employees:</span> {result.message.employees}
                      </div>
                    )}
                    
                    {result.message?.industry && (
                      <div>
                        <span className="font-medium">Industry:</span> {result.message.industry}
                      </div>
                    )}
                    
                    {result.message?.location && (
                      <div>
                        <span className="font-medium">Location:</span> {result.message.location}
                      </div>
                    )}

                    {result.message?.description && (
                      <div>
                        <span className="font-medium">Description:</span> 
                        <div className="text-sm text-gray-600 mt-1">
                          {result.message.description.substring(0, 200)}...
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-4">
                      Raw response size: {JSON.stringify(result).length} characters
                    </div>
                  </div>
                )
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No API response yet. Click test button to try Company API.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Raw Data View */}
        {result && !result.error && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>🔍 Raw Company API Response</CardTitle>
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