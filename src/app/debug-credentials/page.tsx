'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface CredentialCheck {
  success: boolean
  credentials: {
    neo4j: {
      uri: string
      username: string
      hasPassword: boolean
      passwordPreview: string
      database: string
    }
    rushdb: {
      hasApiToken: boolean
      tokenPreview: string
      apiUrl: string
    }
  }
  readinessCheck: {
    neo4jReady: boolean
    rushdbReady: boolean
    overallReady: boolean
  }
  nextSteps: {
    neo4j: string
    rushdb: string
    overall: string
  }
}

export default function DebugCredentialsPage() {
  const [result, setResult] = useState<CredentialCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkCredentials = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/credentials')
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to check credentials')
      }
    } catch {
      setError('Network error checking credentials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkCredentials()
  }, [])

  const StatusIcon = ({ ready }: { ready: boolean }) => {
    if (ready) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Database Credentials Debug
          </h1>
          <p className="mt-2 text-gray-600">
            Testing Neo4j and RushDB connection credentials
          </p>
          <div className="mt-1 text-xs text-gray-400 font-mono">
            🔍 Credential Validation & Connection Testing
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Refresh Button */}
          <div className="lg:col-span-2">
            <Button 
              onClick={checkCredentials} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Checking...' : 'Refresh Credential Check'}
            </Button>
          </div>

          {error && (
            <div className="lg:col-span-2">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Error: {error}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {result && (
            <>
              {/* Neo4j Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon ready={result.readinessCheck.neo4jReady} />
                    Neo4j Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Connection URI</div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {result.credentials.neo4j.uri || 'Not configured'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Username</div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {result.credentials.neo4j.username || 'Not configured'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Password</div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {result.credentials.neo4j.hasPassword ? (
                          <span className="text-green-600">✅ {result.credentials.neo4j.passwordPreview}</span>
                        ) : (
                          <span className="text-red-600">❌ Missing</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-600">
                        {result.nextSteps.neo4j}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* RushDB Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon ready={result.readinessCheck.rushdbReady} />
                    RushDB Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">API URL</div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {result.credentials.rushdb.apiUrl || 'Not configured'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">API Token</div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {result.credentials.rushdb.hasApiToken ? (
                          <span className="text-green-600">✅ {result.credentials.rushdb.tokenPreview}</span>
                        ) : (
                          <span className="text-red-600">❌ Missing</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-600">
                        {result.nextSteps.rushdb}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Status */}
              <div className="lg:col-span-2">
                <Card className={result.readinessCheck.overallReady ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.readinessCheck.overallReady ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-500" />
                      )}
                      Overall Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium mb-2">
                      {result.nextSteps.overall}
                    </div>
                    
                    {result.readinessCheck.overallReady && (
                      <div className="mt-4">
                        <Button asChild className="w-full sm:w-auto">
                          <a href="/graph-test">
                            🚀 Test Graph Visualization
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Neo4j Ready:</div>
                        <div className={result.readinessCheck.neo4jReady ? 'text-green-600' : 'text-red-600'}>
                          {result.readinessCheck.neo4jReady ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">RushDB Ready:</div>
                        <div className={result.readinessCheck.rushdbReady ? 'text-green-600' : 'text-red-600'}>
                          {result.readinessCheck.rushdbReady ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>1. Get Neo4j Password:</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                    <li>• Go to <a href="https://console.neo4j.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">console.neo4j.io</a></li>
                    <li>• Find instance: <code className="bg-gray-100 px-1">ca894f42</code></li>
                    <li>• Copy the connection password</li>
                    <li>• Add to <code className="bg-gray-100 px-1">.env.local</code> as <code className="bg-gray-100 px-1">NEO4J_PASSWORD=your_password</code></li>
                  </ul>
                </div>
                
                <div>
                  <strong>2. Add RushDB Token:</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                    <li>• Go to your RushDB dashboard</li>
                    <li>• Generate API token</li>
                    <li>• Add to <code className="bg-gray-100 px-1">.env.local</code> as <code className="bg-gray-100 px-1">RUSHDB_API_TOKEN=your_token</code></li>
                  </ul>
                </div>
                
                <div>
                  <strong>3. Test Setup:</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                    <li>• Restart your development server: <code className="bg-gray-100 px-1">npm run dev</code></li>
                    <li>• Refresh this page to verify credentials</li>
                    <li>• Go to <a href="/graph-test" className="text-blue-600 hover:underline">/graph-test</a> to see the 3D visualization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}