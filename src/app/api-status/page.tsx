'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/Navigation'

export default function ApiStatusPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkApiStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/synthetic-hybrid-test')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({ error: 'Failed to check API status' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      case 'skipped': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      case 'skipped': return '⏭️'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            API Status Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor the status of DataMagnet and Apify APIs for hybrid intelligence
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Environment variables updated - Apify integration ready
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🔌 API Connection Status</span>
              <Button onClick={checkApiStatus} variant="outline" size="sm">
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Checking API status...</div>
              </div>
            ) : status?.error ? (
              <div className="text-red-600 text-center py-8">
                {status.error}
              </div>
            ) : status ? (
              <div className="space-y-6">
                {/* Environment Check */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Environment Variables</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                      <span>DataMagnet Token</span>
                      <span className={status.environment?.hasDataMagnetToken ? 'text-green-600' : 'text-red-600'}>
                        {status.environment?.hasDataMagnetToken ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                      <span>Apify Token</span>
                      <span className={status.environment?.hasApifyToken ? 'text-green-600' : 'text-red-600'}>
                        {status.environment?.hasApifyToken ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* API Tests */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">API Tests</h3>
                  <div className="space-y-4">
                    {/* DataMagnet Company API */}
                    <div className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">DataMagnet Company API</span>
                        <span className={`${getStatusColor(status.tests?.datamagnetCompany?.status || 'pending')} font-semibold`}>
                          {getStatusIcon(status.tests?.datamagnetCompany?.status || 'pending')} {status.tests?.datamagnetCompany?.status || 'pending'}
                        </span>
                      </div>
                      {status.tests?.datamagnetCompany?.status === 'success' && (
                        <div className="text-sm text-gray-600">
                          <div>Company: {status.tests.datamagnetCompany.companyName}</div>
                          <div>Employees: {status.tests.datamagnetCompany.employees}</div>
                        </div>
                      )}
                      {status.tests?.datamagnetCompany?.status === 'error' && (
                        <div className="text-sm text-red-600">
                          <div>Error Code: {status.tests.datamagnetCompany.code}</div>
                          <div className="truncate">Message: {status.tests.datamagnetCompany.message}</div>
                        </div>
                      )}
                    </div>

                    {/* DataMagnet People API */}
                    <div className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">DataMagnet People API</span>
                        <span className={`${getStatusColor(status.tests?.datamagnetPeople?.status || 'pending')} font-semibold`}>
                          {getStatusIcon(status.tests?.datamagnetPeople?.status || 'pending')} {status.tests?.datamagnetPeople?.status || 'pending'}
                        </span>
                      </div>
                      {status.tests?.datamagnetPeople?.status === 'success' && (
                        <div className="text-sm text-gray-600">
                          <div>Name: {status.tests.datamagnetPeople.name}</div>
                          <div>Title: {status.tests.datamagnetPeople.title}</div>
                          <div>Has Recommendations: {status.tests.datamagnetPeople.hasRecommendations ? 'Yes' : 'No'}</div>
                        </div>
                      )}
                      {status.tests?.datamagnetPeople?.status === 'error' && (
                        <div className="text-sm text-red-600">
                          <div>Error Code: {status.tests.datamagnetPeople.code}</div>
                          <div className="truncate">Message: {status.tests.datamagnetPeople.message}</div>
                        </div>
                      )}
                    </div>

                    {/* Apify Connection */}
                    <div className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Apify Connection</span>
                        <span className={`${getStatusColor(status.tests?.apifyConnection?.status || 'pending')} font-semibold`}>
                          {getStatusIcon(status.tests?.apifyConnection?.status || 'pending')} {status.tests?.apifyConnection?.status || 'pending'}
                        </span>
                      </div>
                      {status.tests?.apifyConnection?.message && (
                        <div className="text-sm text-gray-600">
                          {status.tests.apifyConnection.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-sm text-gray-500 text-center">
                  Last checked: {new Date(status.timestamp).toLocaleString()}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🚀 Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>DataMagnet APIs are connected and working</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Hybrid intelligence system implemented</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">→</span>
                <span>Test hybrid system at <a href="/synthetic-hybrid-test" className="text-blue-600 hover:underline">/synthetic-hybrid-test</a></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">→</span>
                <span>Apify integration will work once APIFY_API_TOKEN is set in Vercel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}