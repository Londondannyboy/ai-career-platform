'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Graph3D from '@/components/Graph3D'
import Navigation from '@/components/Navigation'

interface SyntheticResult {
  success: boolean
  company?: string
  domain?: string
  totalEmployees?: number
  dataQuality?: {
    scrapingConfidence: number
    domainValidation: number
    overallQuality: number
  }
  status?: string
  summary?: string
  departments?: Record<string, number>
  verificationRate?: number
  graphData?: {
    nodes: any[]
    links: any[]
  }
  error?: string
  details?: string
}

export default function SyntheticTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyntheticResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<{apifyConnected?: boolean} | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testConnection = async () => {
    setLoading(true)
    addLog('Testing Apify connection...')
    
    try {
      const response = await fetch('/api/synthetic-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company: 'test',
          action: 'test_connection' 
        })
      })
      
      const data = await response.json()
      setConnectionStatus(data)
      
      if (data.apifyConnected) {
        addLog('✅ Apify connection successful!')
      } else {
        addLog('❌ Apify connection failed')
      }
    } catch (error) {
      addLog(`❌ Connection test error: ${error.message}`)
      setConnectionStatus({ apifyConnected: false })
    } finally {
      setLoading(false)
    }
  }

  const createCKDeltaView = async () => {
    setLoading(true)
    setResult(null)
    addLog('🚀 Creating synthetic intelligence view for CK Delta...')
    
    try {
      const response = await fetch('/api/synthetic-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: 'CK Delta',
          action: 'create_synthetic_view',
          maxEmployees: 25
        })
      })
      
      const data: SyntheticResult = await response.json()
      setResult(data)
      
      if (data.success) {
        addLog(`✅ Successfully created synthetic view for ${data.company}`)
        addLog(`📊 Found ${data.totalEmployees} employees`)
        addLog(`🎯 Data quality: ${data.dataQuality?.overallQuality}%`)
        addLog(`💚 Verification rate: ${data.verificationRate}%`)
      } else {
        addLog(`❌ Failed to create synthetic view: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ API Error: ${error.message}`)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quest AI - Synthetic Intelligence Test
          </h1>
          <p className="text-gray-600">
            Test the revolutionary hybrid synthetic + verified organizational intelligence system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧪 Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={testConnection}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Testing...' : '🔌 Test Apify Connection'}
                </Button>
                
                {connectionStatus && (
                  <div className={`text-sm p-2 rounded ${
                    connectionStatus.apifyConnected 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Apify Status: {connectionStatus.apifyConnected ? 'Connected ✅' : 'Disconnected ❌'}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Button 
                  onClick={createCKDeltaView}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? '🔄 Creating...' : '🚀 Create CK Delta Synthetic View'}
                </Button>
                
                <p className="text-sm text-gray-500 mt-2">
                  This will scrape LinkedIn data for CK Delta employees and create a 3D organizational graph
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                result.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Company</div>
                        <div className="text-gray-900">{result.company}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Domain</div>
                        <div className="text-gray-900">{result.domain}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Employees</div>
                        <div className="text-gray-900">{result.totalEmployees}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Data Quality</div>
                        <div className="text-gray-900">{result.dataQuality?.overallQuality}%</div>
                      </div>
                    </div>
                    
                    {result.departments && (
                      <div>
                        <div className="font-medium text-gray-700 mb-2">Departments</div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          {Object.entries(result.departments).map(([dept, count]) => (
                            <div key={dept} className="flex justify-between">
                              <span>{dept}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className={`text-sm p-2 rounded ${
                      result.verificationRate > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Verification Rate: {result.verificationRate}%
                      {result.verificationRate === 0 && ' (No verified employees yet)'}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="font-medium">Error</div>
                    <div className="text-sm">{result.error}</div>
                    {result.details && (
                      <div className="text-xs mt-1 text-gray-500">{result.details}</div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No results yet. Run a test to see synthetic intelligence data.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3D Visualization */}
        {result?.success && result?.graphData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌐 3D Organizational Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <Graph3D 
                  data={result.graphData}
                  width={800}
                  height={500}
                  onNodeClick={(node) => {
                    addLog(`👤 Clicked: ${node.name} (${node.role})`)
                  }}
                />
              </div>
              
              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">Gray Nodes</div>
                  <div className="text-gray-600">Synthetic Data</div>
                </div>
                <div className="text-center p-2 bg-blue-100 rounded">
                  <div className="font-medium">Blue Nodes</div>
                  <div className="text-blue-600">Real Quest Users</div>
                </div>
                <div className="text-center p-2 bg-green-100 rounded">
                  <div className="font-medium">Green Nodes</div>
                  <div className="text-green-600">Verified Employees</div>
                </div>
                <div className="text-center p-2 bg-yellow-100 rounded">
                  <div className="font-medium">Dashed Lines</div>
                  <div className="text-yellow-600">Inferred Relationships</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                📋 Activity Log
              </span>
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
                <div className="text-gray-500">No activity yet...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm">
              <h4>Synthetic + Verified Intelligence System</h4>
              <ol>
                <li><strong>Scrape LinkedIn Data:</strong> Uses Apify to gather public employee profiles from company pages</li>
                <li><strong>Infer Organization:</strong> AI analyzes job titles to create departments, hierarchy, and reporting structures</li>
                <li><strong>Email Verification:</strong> Real Quest users with company email domains (e.g., @ckdelta.ai) can verify/correct the synthetic data</li>
                <li><strong>Self-Improving:</strong> Each verified employee makes the organizational chart more accurate for everyone</li>
                <li><strong>3D Visualization:</strong> Interactive exploration of company networks with gray (synthetic) → blue (real users) → green (verified) progression</li>
              </ol>
              
              <h4>Voice Commands (Quest AI Integration)</h4>
              <ul>
                <li>"Create synthetic view of CK Delta"</li>
                <li>"Show me the organizational structure"</li>
                <li>"Map CK Delta's company intelligence"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}