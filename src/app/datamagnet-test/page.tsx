'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'

export default function DataMagnetTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [profileUrl, setProfileUrl] = useState('https://linkedin.com/in/philipaga')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testVanillaAPI = async () => {
    setLoading(true)
    setResult(null)
    addLog('🧪 Testing DataMagnet API - Vanilla Quickstart Implementation...')
    addLog(`🌐 Profile URL: ${profileUrl}`)
    
    try {
      // Use server-side API to avoid CORS and token exposure
      const response = await fetch('/api/datamagnet-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileUrl,
          action: 'test_person_extraction'
        })
      })

      const result = await response.json()
      
      addLog(`📡 API Response: ${response.status}`)
      
      if (!result.success) {
        addLog(`❌ Error: ${result.error}`)
        if (result.details) {
          addLog(`📝 Details: ${result.details}`)
        }
        if (result.statusCode) {
          addLog(`🔢 DataMagnet Status: ${result.statusCode}`)
        }
        setResult({ error: result.error, details: result.details })
        return
      }

      const data = result.data
      addLog(`✅ Success! Received ${result.metadata.dataSize} characters`)
      
      setResult(data)
      
      // Log key data points
      if (data.display_name) {
        addLog(`👤 Found profile: ${data.display_name}`)
      }
      if (data.current_company_name) {
        addLog(`🏢 Current company: ${data.current_company_name}`)
      }
      if (data.job_title) {
        addLog(`💼 Job title: ${data.job_title}`)
      }
      if (result.metadata.hasRecommendations) {
        addLog(`⭐ Found ${data.recommendations?.length || 0} recommendations`)
      }
      if (result.metadata.hasExperience) {
        addLog(`📝 Found ${data.experience?.length || 0} experience entries`)
      }

    } catch (error) {
      addLog(`❌ Network Error: ${error.message}`)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testCreditsEndpoint = async () => {
    setLoading(true)
    addLog('💳 Testing DataMagnet credits endpoint...')
    
    try {
      const response = await fetch('/api/datamagnet-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test_credits'
        })
      })

      const result = await response.json()
      
      addLog(`📡 Credits response: ${response.status}`)

      if (!result.success) {
        addLog(`❌ Credits error: ${result.error}`)
        if (result.details) {
          addLog(`📝 Details: ${result.details}`)
        }
        return
      }

      addLog(`✅ Credits retrieved successfully`)
      addLog(`💰 Credits data: ${JSON.stringify(result.credits)}`)
      
    } catch (error) {
      addLog(`❌ Credits Error: ${error.message}`)
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
            Testing DataMagnet API exactly as documented - no custom wrappers
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
              
              <div className="space-y-2">
                <Button 
                  onClick={testCreditsEndpoint}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Testing...' : '💳 Test Credits Endpoint'}
                </Button>
                
                <Button 
                  onClick={testVanillaAPI}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? '🔄 Testing...' : '🚀 Test Person Extraction'}
                </Button>
              </div>

              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                <div>• Following exact DataMagnet documentation</div>
                <div>• Bearer token authentication</div>
                <div>• Standard JSON POST request</div>
                <div>• No custom wrappers or modifications</div>
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
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-green-600 font-medium">✅ API Call Successful!</div>
                    
                    {result.display_name && (
                      <div>
                        <span className="font-medium">Name:</span> {result.display_name}
                      </div>
                    )}
                    
                    {result.profile_headline && (
                      <div>
                        <span className="font-medium">Headline:</span> {result.profile_headline}
                      </div>
                    )}
                    
                    {result.current_company_name && (
                      <div>
                        <span className="font-medium">Company:</span> {result.current_company_name}
                      </div>
                    )}
                    
                    {result.job_title && (
                      <div>
                        <span className="font-medium">Title:</span> {result.job_title}
                      </div>
                    )}
                    
                    {result.location && (
                      <div>
                        <span className="font-medium">Location:</span> {result.location}
                      </div>
                    )}
                    
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div>
                        <span className="font-medium">Recommendations:</span> {result.recommendations.length}
                        <div className="mt-2 text-xs">
                          {result.recommendations.slice(0, 2).map((rec: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 p-2 rounded mb-1">
                              <div className="font-medium">{rec.name}</div>
                              <div className="text-gray-600">{rec.context}</div>
                            </div>
                          ))}
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