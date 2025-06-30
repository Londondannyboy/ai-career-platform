'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'

interface ApolloEmployee {
  name: string
  title: string
  headline: string
  email: string
  linkedin_url: string
  company: string
  location: string
  seniority: string
  departments: string[]
  functions: string[]
}

interface ApolloResult {
  success: boolean
  company?: string
  totalFound?: number
  employees?: ApolloEmployee[]
  departments?: Record<string, number>
  seniorities?: Record<string, number>
  metadata?: any
  error?: string
  details?: string
}

export default function ApolloTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApolloResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [companyName, setCompanyName] = useState('CKDelta')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testApolloHealth = async () => {
    setLoading(true)
    addLog('🔍 Testing Apollo API health and authentication...')
    
    try {
      const response = await fetch('/api/apollo-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test_health'
        })
      })

      const result = await response.json()
      
      addLog(`📡 Health check response: ${response.status}`)
      
      if (!result.success) {
        addLog(`❌ Health check failed: ${result.error}`)
        if (result.details) {
          addLog(`📝 Details: ${result.details}`)
        }
        setHealthStatus({ success: false, error: result.error })
        return
      }

      setHealthStatus(result)
      
      if (result.isHealthy) {
        addLog(`✅ Apollo API is healthy and authenticated`)
        addLog(`🔑 Authentication successful`)
      } else {
        addLog(`⚠️ Apollo API responded but health check indicates issues`)
      }
      
      addLog(`📊 Health data: ${JSON.stringify(result.health)}`)

    } catch (error) {
      addLog(`❌ Health check error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      setHealthStatus({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const searchCKDelta = async () => {
    setLoading(true)
    setResult(null)
    addLog('🎯 Searching for CK Delta employees with Apollo...')
    
    try {
      const response = await fetch('/api/apollo-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'search_ck_delta'
        })
      })

      const result = await response.json()
      
      addLog(`📡 CK Delta search response: ${response.status}`)
      
      if (!result.success) {
        addLog(`❌ Search failed: ${result.error}`)
        if (result.searchedCompanies) {
          addLog(`🔍 Searched company variations: ${result.searchedCompanies.join(', ')}`)
        }
        setResult({ success: false, error: result.error })
        return
      }

      setResult(result)
      
      addLog(`✅ Found ${result.employees?.length || 0} CK Delta employees`)
      addLog(`📊 Total in database: ${result.totalFound || 0}`)
      addLog(`🏢 Company: ${result.company}`)
      
      if (result.departments) {
        addLog(`🎯 Departments: ${Object.keys(result.departments).join(', ')}`)
      }

    } catch (error) {
      addLog(`❌ Search error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const searchCustomCompany = async () => {
    setLoading(true)
    setResult(null)
    addLog(`🔍 Searching for employees at ${companyName}...`)
    
    try {
      const response = await fetch('/api/apollo-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'search_company_employees',
          companyName: companyName,
          maxResults: 25
        })
      })

      const result = await response.json()
      
      addLog(`📡 Company search response: ${response.status}`)
      
      if (!result.success) {
        addLog(`❌ Search failed: ${result.error}`)
        setResult({ success: false, error: result.error })
        return
      }

      setResult(result)
      
      addLog(`✅ Found ${result.employees?.length || 0} employees at ${companyName}`)
      addLog(`📊 Total in Apollo database: ${result.totalFound || 0}`)

    } catch (error) {
      addLog(`❌ Search error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
    setResult(null)
    setHealthStatus(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Apollo.io API Test
          </h1>
          <p className="text-gray-600">
            Test Apollo's 210M+ contact database for company employee discovery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>🚀 Apollo API Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={testApolloHealth}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Testing...' : '🔍 Test API Health'}
                </Button>
                
                {healthStatus && (
                  <div className={`text-sm p-2 rounded ${
                    healthStatus.isHealthy 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Apollo API: {healthStatus.isHealthy ? 'Healthy ✅' : 'Issues ❌'}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Button 
                  onClick={searchCKDelta}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
                >
                  {loading ? '🔄 Searching...' : '🎯 Search CK Delta Employees'}
                </Button>
                
                <div className="space-y-2">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                  />
                  <Button 
                    onClick={searchCustomCompany}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? 'Searching...' : '🔍 Search Custom Company'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                <div>• Apollo.io 210M+ contact database</div>
                <div>• Professional B2B data with verified emails</div>
                <div>• Department and seniority breakdowns</div>
                <div>• No LinkedIn scraping required</div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Apollo Results</CardTitle>
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
                        <div className="font-medium text-gray-700">Found</div>
                        <div className="text-gray-900">{result.employees?.length || 0}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Total Available</div>
                        <div className="text-gray-900">{result.totalFound || 0}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Departments</div>
                        <div className="text-gray-900">{Object.keys(result.departments || {}).length}</div>
                      </div>
                    </div>
                    
                    {result.departments && (
                      <div>
                        <div className="font-medium text-gray-700 mb-2">Department Breakdown</div>
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
                    
                    {result.seniorities && (
                      <div>
                        <div className="font-medium text-gray-700 mb-2">Seniority Levels</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(result.seniorities).map(([level, count]) => (
                            <span key={level} className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                              {level}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                  No search results yet. Test Apollo API to see employee data.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Results */}
        {result?.success && result?.employees && result.employees.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 Found Employees ({result.employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {result.employees.slice(0, 10).map((emp, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-gray-600">{emp.title}</div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {emp.seniority && <span className="inline-block border border-gray-300 text-gray-700 text-xs px-2 py-1 rounded">{emp.seniority}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {emp.company} • {emp.location}
                    </div>
                    {emp.email && (
                      <div className="text-xs text-blue-600 mt-1">{emp.email}</div>
                    )}
                    {emp.linkedin_url && (
                      <div className="text-xs text-blue-600 mt-1">
                        <a href={emp.linkedin_url} target="_blank" rel="noopener noreferrer">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {result.employees.length > 10 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {result.employees.length - 10} more employees
                  </div>
                )}
              </div>
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

        {/* Comparison Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🔄 Apollo vs DataMagnet Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-700 mb-2">🚀 Apollo Strengths</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 210M+ verified contact database</li>
                  <li>• No LinkedIn scraping required</li>
                  <li>• Department and seniority data included</li>
                  <li>• Bulk company employee discovery</li>
                  <li>• Professional B2B data quality</li>
                  <li>• Email addresses included</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-700 mb-2">🧲 DataMagnet Strengths</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• LinkedIn recommendation context</li>
                  <li>• "Also viewed" network insights</li>
                  <li>• Rich profile experience data</li>
                  <li>• Relationship validation</li>
                  <li>• Real-time LinkedIn data</li>
                  <li>• Impossible to game recommendations</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Hybrid Strategy</h4>
              <p className="text-yellow-700 text-sm">
                Use Apollo for bulk employee discovery and department mapping, then enhance key decision makers with DataMagnet's rich relationship context.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}