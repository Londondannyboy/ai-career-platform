'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'

export default function SyntheticHybridTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [company, setCompany] = useState('CK Delta')
  const [companyDomain, setCompanyDomain] = useState('ckdelta.ai')
  const [strategy, setStrategy] = useState('hybrid')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testHybridIntelligence = async () => {
    setLoading(true)
    setResult(null)
    addLog('🧠 Starting Hybrid Synthetic Intelligence...')
    addLog(`🏢 Company: ${company}`)
    addLog(`🌐 Domain: ${companyDomain}`)
    addLog(`📋 Strategy: ${strategy}`)
    
    try {
      const response = await fetch('/api/synthetic-hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company,
          companyDomain,
          strategy,
          maxEmployees: 50,
          targetRoles: ['engineering', 'product'],
          enrichExecutives: true
        })
      })

      const data = await response.json()
      
      addLog(`📡 API Response: ${response.status}`)
      
      if (!data.success) {
        addLog(`❌ Error: ${data.error}`)
        setResult({ error: data.error })
        return
      }

      setResult(data)
      
      // Log summary statistics
      addLog(`✅ Success! Found ${data.summary.totalEmployees} employees`)
      addLog(`💎 DataMagnet enriched: ${data.summary.datamagnetEnriched}`)
      addLog(`🔍 Apify discovered: ${data.summary.apifyDiscovered}`)
      addLog(`🔗 Verified relationships: ${data.summary.verifiedRelationships}`)
      addLog(`🔮 Network clusters: ${data.summary.networkClusters}`)
      
      // Log cost analysis
      addLog(`💰 Total credits used: ${data.costAnalysis.totalCredits}`)
      addLog(`📊 Cost per employee: $${data.costAnalysis.costPerEmployee}`)

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
            Hybrid Synthetic Intelligence Test
          </h1>
          <p className="text-gray-600">
            Combines DataMagnet (rich profiles) with Apify (bulk discovery) for optimal results
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>🧠 Hybrid Intelligence Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="CK Delta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Domain</label>
                <Input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="ckdelta.ai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Strategy</label>
                <select 
                  value={strategy} 
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hybrid">Hybrid (Recommended)</option>
                  <option value="datamagnet_only">DataMagnet Only (Premium)</option>
                  <option value="apify_first">Apify First (Budget)</option>
                </select>
              </div>
              
              <Button 
                onClick={testHybridIntelligence}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? '🔄 Building Intelligence...' : '🚀 Build Hybrid Intelligence'}
              </Button>

              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                <div className="font-semibold mb-1">Strategy Comparison:</div>
                <div>• <strong>Hybrid</strong>: Apify bulk + DataMagnet for executives</div>
                <div>• <strong>DataMagnet Only</strong>: High quality, higher cost</div>
                <div>• <strong>Apify First</strong>: Fast & cheap, lower quality</div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Intelligence Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                result.error ? (
                  <div className="text-red-600">
                    <div className="font-medium">Error</div>
                    <div className="text-sm">{result.error}</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Total Employees</div>
                        <div className="text-2xl font-bold">{result.summary.totalEmployees}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Verified Relationships</div>
                        <div className="text-2xl font-bold text-green-600">{result.summary.verifiedRelationships}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">DataMagnet Enriched</div>
                        <div className="text-xl font-bold text-blue-600">{result.summary.datamagnetEnriched}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Network Clusters</div>
                        <div className="text-xl font-bold text-purple-600">{result.summary.networkClusters}</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="font-medium text-gray-700 mb-2">Data Quality</div>
                      <div className="bg-gray-200 rounded-full h-4 relative">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full h-4"
                          style={{ width: `${result.dataQuality?.overall || 0}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.dataQuality?.overall || 0}% Complete
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <div>💰 Credits: {result.costAnalysis?.totalCredits}</div>
                      <div>📊 Per Employee: ${result.costAnalysis?.costPerEmployee}</div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No intelligence data yet. Configure and build to see results.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sample Employees */}
        {result?.employees && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>👥 Sample Employee Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {result.employees.slice(0, 5).map((emp: any, idx: number) => (
                  <div key={idx} className="border rounded p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-lg">{emp.name}</div>
                        <div className="text-gray-600">{emp.title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Data Quality</div>
                        <div className={`text-2xl font-bold ${
                          emp.dataQuality >= 80 ? 'text-green-600' : 
                          emp.dataQuality >= 50 ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {emp.dataQuality}%
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {emp.sources?.datamagnet && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">DataMagnet</span>
                      )}
                      {emp.sources?.apify && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Apify</span>
                      )}
                      {emp.sources?.emailVerified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Email Verified</span>
                      )}
                    </div>

                    {emp.recommendations && emp.recommendations.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded mb-2">
                        <div className="font-medium text-sm text-blue-800 mb-1">
                          📝 LinkedIn Recommendations ({emp.recommendations.length})
                        </div>
                        <div className="text-sm text-blue-700">
                          "{emp.recommendations[0].context.substring(0, 100)}..."
                          <div className="text-xs mt-1">
                            — {emp.recommendations[0].recommenderName}, {emp.recommendations[0].relationship}
                          </div>
                        </div>
                      </div>
                    )}

                    {emp.verifiedRelationships && emp.verifiedRelationships.length > 0 && (
                      <div className="text-sm text-gray-600">
                        🔗 {emp.verifiedRelationships.length} verified relationships
                        {emp.verifiedRelationships[0] && (
                          <span className="text-xs ml-2">
                            ({emp.verifiedRelationships[0].relationshipType} - {Math.round(emp.verifiedRelationships[0].confidence * 100)}% confidence)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizational Insights */}
        {result?.insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>🏢 Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(result.insights.departments).map(([dept, count]) => (
                    <div key={dept} className="flex justify-between items-center">
                      <span>{dept}</span>
                      <span className="font-semibold">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎯 Verification Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Manual Verification</span>
                    <span className="font-semibold">{result.insights.verificationBreakdown.manuallyVerified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Verified (@{companyDomain})</span>
                    <span className="font-semibold text-green-600">{result.insights.verificationBreakdown.emailVerified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LinkedIn Recommendations</span>
                    <span className="font-semibold text-blue-600">{result.insights.verificationBreakdown.recommendationVerified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synthetic Only</span>
                    <span className="font-semibold text-gray-600">{result.insights.verificationBreakdown.syntheticOnly}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Activity Log</span>
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
      </div>
    </div>
  )
}