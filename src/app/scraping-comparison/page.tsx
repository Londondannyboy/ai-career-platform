'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'

interface ComparisonResult {
  company: string
  dataMagnet: {
    success: boolean
    data?: any
    employeeCount?: number
    creditsUsed?: number
    upgradeRequired?: boolean
    error?: string
    dataRichness: number
  }
  apify: {
    success: boolean
    data?: any
    employeeCount?: number
    error?: string
    dataRichness: number
  }
  comparison: {
    winner: string
    strengths: {
      dataMagnet: string[]
      apify: string[]
    }
    recommendations: string[]
  }
  summary: {
    dataMagnetStatus: string
    apifyStatus: string
    recommendedService: string
  }
}

export default function ScrapingComparisonPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testConnections = async () => {
    setLoading(true)
    addLog('🔌 Testing API connections...')
    
    try {
      const response = await fetch('/api/scraping-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'test_both_connections' 
        })
      })
      
      const data = await response.json()
      setConnectionStatus(data.results)
      
      if (data.results.dataMagnet?.connected) {
        addLog('✅ DataMagnet API connected')
        if (data.results.dataMagnet?.upgradeRequired) {
          addLog('⚠️ DataMagnet requires paid plan for full access')
        }
      } else {
        addLog('❌ DataMagnet API failed')
      }
      
      if (data.results.apify?.connected) {
        addLog('✅ Apify API connected')
      } else {
        addLog('❌ Apify API failed')
      }
    } catch (error) {
      addLog(`❌ Connection test error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const compareCompanyData = async () => {
    setLoading(true)
    setResult(null)
    addLog('🚀 Starting comprehensive company data comparison for CK Delta...')
    
    try {
      const response = await fetch('/api/scraping-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare_company_data',
          company: 'CK Delta',
          companyUrl: 'https://www.linkedin.com/company/ckdelta'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.results)
        addLog(`✅ Comparison complete`)
        addLog(`📊 DataMagnet: ${data.results.dataMagnet?.success ? 'Success' : 'Failed'}`)
        addLog(`🔍 Apify: ${data.results.apify?.success ? 'Success' : 'Failed'}`)
        addLog(`🏆 Winner: ${data.summary.recommendedService}`)
      } else {
        addLog(`❌ Comparison failed: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ API Error: ${error.message}`)
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
            DataMagnet vs Apify Scraping Comparison
          </h1>
          <p className="text-gray-600">
            Compare data quality, richness, and accessibility between DataMagnet's specialized LinkedIn API and Apify's bebity scraper
          </p>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔧 Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testConnections}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Testing...' : '🔌 Test API Connections'}
              </Button>
              
              {connectionStatus && (
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${
                    connectionStatus.dataMagnet?.connected 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    DataMagnet: {connectionStatus.dataMagnet?.connected ? 'Connected' : 'Failed'}
                    {connectionStatus.dataMagnet?.upgradeRequired && ' (Upgrade Required)'}
                  </div>
                  <div className={`p-2 rounded ${
                    connectionStatus.apify?.connected 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Apify: {connectionStatus.apify?.connected ? 'Connected' : 'Failed'}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Button 
                  onClick={compareCompanyData}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? '🔄 Comparing...' : '⚔️ Compare CK Delta Data'}
                </Button>
                
                <p className="text-sm text-gray-500 mt-2">
                  This will test both DataMagnet Company API and Apify bebity scraper on the same target
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Comparison Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result?.summary ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">DataMagnet Status</div>
                      <Badge variant={result.summary.dataMagnetStatus === 'Success' ? 'default' : 'destructive'}>
                        {result.summary.dataMagnetStatus}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Apify Status</div>
                      <Badge variant={result.summary.apifyStatus === 'Success' ? 'default' : 'destructive'}>
                        {result.summary.apifyStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="font-bold text-blue-900">🏆 Recommended Service</div>
                    <div className="text-lg text-blue-800">{result.summary.recommendedService}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Data Richness:</span>
                      <div className="flex gap-1 mt-1">
                        <div className="flex-1 bg-gray-200 rounded">
                          <div 
                            className="bg-blue-500 h-2 rounded" 
                            style={{width: `${result.dataMagnet?.dataRichness || 0}%`}}
                          />
                        </div>
                        <span>{result.dataMagnet?.dataRichness || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Accessibility:</span>
                      <div className="flex gap-1 mt-1">
                        <div className="flex-1 bg-gray-200 rounded">
                          <div 
                            className="bg-green-500 h-2 rounded" 
                            style={{width: `${result.apify?.dataRichness || 0}%`}}
                          />
                        </div>
                        <span>{result.apify?.dataRichness || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No comparison data yet. Run a test to see detailed analysis.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* DataMagnet Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    🧲 DataMagnet Results
                  </span>
                  <Badge variant={result.dataMagnet.success ? 'default' : 'destructive'}>
                    {result.dataMagnet.success ? 'Success' : 'Failed'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.dataMagnet.success && result.dataMagnet.data ? (
                  <div className="space-y-4">
                    {/* Company Basic Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Name:</strong> {result.dataMagnet.data.company_name}</div>
                      <div><strong>Industry:</strong> {result.dataMagnet.data.industry}</div>
                      <div><strong>Employees:</strong> {result.dataMagnet.data.employees}</div>
                      <div><strong>Followers:</strong> {result.dataMagnet.data.followers}</div>
                    </div>
                    
                    {/* Rich Data Preview */}
                    <div className="border-t pt-3">
                      <div className="font-medium text-sm mb-2">🌟 Rich Data Available:</div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {result.dataMagnet.data.employees_data && (
                          <div>✅ Employee profiles: {result.dataMagnet.data.employees_data.length} with photos & titles</div>
                        )}
                        {result.dataMagnet.data.all_locations && (
                          <div>✅ Locations: {result.dataMagnet.data.all_locations.join(', ')}</div>
                        )}
                        {result.dataMagnet.data.specialities && (
                          <div>✅ Specialties: {result.dataMagnet.data.specialities.length} areas</div>
                        )}
                        {result.dataMagnet.data.update_data && (
                          <div>✅ Recent posts: {result.dataMagnet.data.update_data.length} company updates</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Sample Employees */}
                    {result.dataMagnet.data.employees_data && (
                      <div className="border-t pt-3">
                        <div className="font-medium text-sm mb-2">👥 Sample Employees:</div>
                        <div className="space-y-2">
                          {result.dataMagnet.data.employees_data.slice(0, 3).map((emp: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                              <img src={emp.img} alt={emp.title} className="w-6 h-6 rounded-full" />
                              <div>
                                <div className="font-medium">{emp.title}</div>
                                <div className="text-gray-600">{emp.subtitle}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Credits used: {result.dataMagnet.creditsUsed} | Data richness: {result.dataMagnet.dataRichness}%
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    {result.dataMagnet.upgradeRequired ? (
                      <div>
                        <div className="font-medium">Upgrade Required</div>
                        <div className="text-sm">DataMagnet requires a paid plan for company data access</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">Error</div>
                        <div className="text-sm">{result.dataMagnet.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Apify Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    🔍 Apify (bebity) Results
                  </span>
                  <Badge variant={result.apify.success ? 'default' : 'destructive'}>
                    {result.apify.success ? 'Success' : 'Failed'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.apify.success && result.apify.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Company:</strong> {result.apify.data.companyName}</div>
                      <div><strong>Domain:</strong> {result.apify.data.companyDomain}</div>
                      <div><strong>Employees Found:</strong> {result.apify.employeeCount}</div>
                      <div><strong>Method:</strong> No-cookies scraping</div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="font-medium text-sm mb-2">✅ Bebity Advantages:</div>
                      <div className="space-y-1 text-xs">
                        <div>• Works without paid plan</div>
                        <div>• No LinkedIn credentials required</div>
                        <div>• Company-level employee discovery</div>
                        <div>• Account flagging protection</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Data richness: {result.apify.dataRichness}%
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="font-medium">Error</div>
                    <div className="text-sm">{result.apify.error}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comparison Analysis */}
        {result?.comparison && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚔️ Detailed Comparison Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">🚀 DataMagnet Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {result.comparison.strengths.dataMagnet.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">🛡️ Apify Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {result.comparison.strengths.apify.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Recommendations</h4>
                <ul className="text-sm space-y-1">
                  {result.comparison.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-yellow-700">• {rec}</li>
                  ))}
                </ul>
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

        {/* Integration Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Integration Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm">
              <h4>Hybrid Approach Recommendation</h4>
              <ol>
                <li><strong>Development Phase:</strong> Use Apify bebity for testing (free, no restrictions)</li>
                <li><strong>Data Quality Phase:</strong> Upgrade to DataMagnet for rich company insights</li>
                <li><strong>Production:</strong> Implement fallback system - DataMagnet first, Apify backup</li>
                <li><strong>Cost Optimization:</strong> Cache DataMagnet results, use Apify for bulk discovery</li>
              </ol>
              
              <h4>Implementation Options</h4>
              <ul>
                <li><strong>Option A:</strong> DataMagnet for company profiles + employee discovery</li>
                <li><strong>Option B:</strong> Apify for bulk scraping + DataMagnet for key profiles</li>
                <li><strong>Option C:</strong> Hybrid service with intelligent routing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}