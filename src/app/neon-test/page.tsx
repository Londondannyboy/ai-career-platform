'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { Database, Check, X, AlertCircle } from 'lucide-react'

export default function NeonTestPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initResult, setInitResult] = useState<any>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/init')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ error: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  const initializeDb = async () => {
    setLoading(true)
    setInitResult(null)
    try {
      const res = await fetch('/api/agent/init', {
        method: 'POST'
      })
      const data = await res.json()
      setInitResult(data)
      
      // Refresh status after init
      if (data.success) {
        await checkStatus()
      }
    } catch (error) {
      setInitResult({ error: 'Failed to initialize database' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Neon.tech Database Setup
          </h1>
          <p className="text-gray-600">
            Configure and initialize PostgreSQL with pgvector for semantic search
          </p>
        </div>

        {/* Status Check */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkStatus} 
              disabled={loading}
              className="mb-4"
            >
              Check Status
            </Button>
            
            {status && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Environment Variable:</span>
                  {status.configured ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> Configured
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <X className="h-3 w-3" /> Not Configured
                    </Badge>
                  )}
                </div>
                
                {status.configured && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Connection:</span>
                      {status.connected ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> Connected
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <X className="h-3 w-3" /> Failed
                        </Badge>
                      )}
                    </div>
                    
                    {status.connected && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">pgvector Extension:</span>
                          {status.pgvector ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Check className="h-3 w-3" /> Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Not Enabled
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Tables:</span>
                          <div className="flex gap-2">
                            {status.tables?.map((table: string) => (
                              <Badge key={table} variant="outline">
                                {table}
                              </Badge>
                            ))}
                            {status.tables?.length === 0 && (
                              <span className="text-sm text-gray-500">No tables created</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Overall Status:</span>
                          <Badge 
                            variant={status.status === 'ready' ? 'default' : 'secondary'}
                          >
                            {status.status === 'ready' ? 'Ready' : 'Needs Initialization'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </>
                )}
                
                {status.error && (
                  <div className="text-red-600 text-sm mt-2">
                    Error: {status.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Initialize Database */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Initialize Database</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This will create all necessary tables and indexes for vector search.
            </p>
            <Button 
              onClick={initializeDb} 
              disabled={loading || !status?.configured}
              variant="default"
            >
              Initialize Neon.tech Database
            </Button>
            
            {initResult && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50">
                {initResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <Check className="h-5 w-5" />
                      {initResult.message}
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">Tables Created:</div>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        {initResult.tables?.map((table: string) => (
                          <li key={table}>{table}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">Features Enabled:</div>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        {initResult.features?.map((feature: string) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600 font-medium">
                      <X className="h-5 w-5" />
                      {initResult.error}
                    </div>
                    {initResult.details && (
                      <div className="text-sm text-gray-600">{initResult.details}</div>
                    )}
                    {initResult.help && (
                      <div className="text-sm text-blue-600">{initResult.help}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-medium mb-1">1. Create Neon.tech Account</div>
                <div className="text-gray-600">
                  Go to <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">neon.tech</a> and 
                  sign up for a free account
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-1">2. Create a Project</div>
                <div className="text-gray-600">
                  Create a new project in your Neon dashboard (e.g., "quest-ai")
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-1">3. Get Connection String</div>
                <div className="text-gray-600">
                  Copy your connection string from the Neon dashboard
                </div>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                  postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-1">4. Add to Environment</div>
                <div className="text-gray-600">
                  Add to your <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file:
                </div>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                  NEON_DATABASE_URL=your_connection_string_here
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Free Tier Includes:</div>
                <ul className="text-sm text-blue-800 ml-4 list-disc">
                  <li>3GB storage (750,000+ documents)</li>
                  <li>Unlimited compute (with autoscaling)</li>
                  <li>pgvector for semantic search</li>
                  <li>Perfect for MVP development</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}