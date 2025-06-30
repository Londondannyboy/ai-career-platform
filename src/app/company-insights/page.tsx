'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'

export default function CompanyInsightsPage() {
  const [companyUrl, setCompanyUrl] = useState('https://linkedin.com/company/ckdelta')
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [error, setError] = useState('')

  const fetchCompany = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/datamagnet-company-vanilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: companyUrl })
      })
      
      if (!response.ok) throw new Error('Failed to fetch company')
      
      const data = await response.json()
      // Navigate through nested message structure
      let currentMessage = data.message
      while (currentMessage?.message) {
        currentMessage = currentMessage.message
      }
      setCompanyData(currentMessage)
    } catch (err) {
      setError('Failed to fetch company data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Company Intelligence Dashboard
          </h1>
          <p className="text-gray-600">
            Extract organizational insights from DataMagnet company data
          </p>
        </div>

        {/* Company Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="LinkedIn company URL"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={fetchCompany} disabled={loading}>
                {loading ? 'Loading...' : 'Analyze Company'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {companyData && (
          <div className="space-y-6">
            {/* Company Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-xl mb-2">{companyData.company_name}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Industry:</span>
                      <p className="font-medium">{companyData.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium">{companyData.company_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Employees:</span>
                      <p className="font-medium">{companyData.employees || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  {companyData.all_locations && companyData.all_locations.length > 0 ? (
                    <div className="space-y-2">
                      {companyData.all_locations.map((location: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-sm">{location}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No locations specified</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {companyData.followers?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">LinkedIn Followers</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {companyData.headcount || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-600">Company Size</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Employees */}
            {companyData.employees_data && companyData.employees_data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Employees on LinkedIn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyData.employees_data.map((employee: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          {employee.img && (
                            <img
                              src={employee.img}
                              alt={employee.title}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{employee.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {employee.subtitle}
                            </p>
                            <a
                              href={employee.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              View Profile →
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Showing {companyData.employees_data.length} of {companyData.employees || 'unknown'} employees
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Company Description */}
            {companyData.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About {companyData.company_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{companyData.description}</p>
                </CardContent>
              </Card>
            )}

            {/* DataMagnet Intelligence Summary */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💡 Intelligence Summary
                  <Badge variant="secondary">DataMagnet Insights</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Organizational Insights</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• {companyData.employees || 0} employees tracked on LinkedIn</li>
                      <li>• Presence in {companyData.all_locations?.length || 0} locations globally</li>
                      <li>• {companyData.company_type} company structure</li>
                      <li>• Active in {companyData.industry || 'technology'} sector</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Next Steps</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Analyze key employees with profile insights</li>
                      <li>• Map organizational relationships</li>
                      <li>• Track company growth via follower trends</li>
                      <li>• Identify decision makers and influencers</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Pro tip:</strong> Use the employee profile URLs to analyze individual relationships
                    and build a comprehensive organizational map using DataMagnet's recommendation data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}