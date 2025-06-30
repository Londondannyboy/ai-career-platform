'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

const NetworkVisualization = dynamic(() => import('@/components/NetworkVisualization'), {
  ssr: false
})

export default function DataMagnetInsightsPage() {
  const [profileUrl, setProfileUrl] = useState('https://linkedin.com/in/philipaga')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/datamagnet-vanilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: profileUrl })
      })
      
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      const data = await response.json()
      setProfileData(data)
    } catch (err) {
      setError('Failed to fetch profile data')
    } finally {
      setLoading(false)
    }
  }

  const extractRelationshipType = (text: string): string => {
    const lower = text?.toLowerCase() || ''
    if (lower.includes('managed directly') || lower.includes('direct report')) return 'Manager'
    if (lower.includes('reported to') || lower.includes('my manager')) return 'Subordinate'
    if (lower.includes('worked with') || lower.includes('collaborated')) return 'Peer'
    if (lower.includes('mentored') || lower.includes('coached')) return 'Mentor'
    if (lower.includes('client') || lower.includes('customer')) return 'Client'
    return 'Colleague'
  }

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      Manager: 'bg-purple-100 text-purple-800',
      Subordinate: 'bg-blue-100 text-blue-800',
      Peer: 'bg-green-100 text-green-800',
      Mentor: 'bg-orange-100 text-orange-800',
      Client: 'bg-pink-100 text-pink-800',
      Colleague: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || colors.Colleague
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataMagnet Insights Explorer
          </h1>
          <p className="text-gray-600">
            Explore verified relationships and network clusters from LinkedIn data
          </p>
        </div>

        {/* Profile Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="LinkedIn profile URL"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={fetchProfile} disabled={loading}>
                {loading ? 'Loading...' : 'Analyze Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {profileData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Profile Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-xl">{profileData.display_name}</h3>
                    <p className="text-gray-600">{profileData.job_title}</p>
                    <p className="text-sm text-gray-500">{profileData.current_company_name}</p>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-gray-500">Location</p>
                    <p>{profileData.location || 'Not specified'}</p>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-gray-500">Industry</p>
                    <p>{profileData.company_industry || 'Not specified'}</p>
                  </div>
                  
                  {profileData.followers && (
                    <div className="text-sm">
                      <p className="text-gray-500">Followers</p>
                      <p>{profileData.followers.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations - Verified Relationships */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🔐 Verified Relationships
                  <span className="text-sm font-normal text-gray-500">
                    from recommendations
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.recommendations && profileData.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {profileData.recommendations.slice(0, 5).map((rec: any, idx: number) => {
                      const relationship = extractRelationshipType(rec.text || rec.recommendation)
                      return (
                        <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{rec.recommender_name || 'Anonymous'}</h4>
                              <p className="text-sm text-gray-600">
                                {rec.recommender_title || 'Title not available'}
                              </p>
                            </div>
                            <Badge className={getRelationshipColor(relationship)}>
                              {relationship}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {rec.text || rec.recommendation || 'No recommendation text available'}
                          </p>
                        </div>
                      )
                    })}
                    {profileData.recommendations.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{profileData.recommendations.length - 5} more recommendations
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No recommendations available for this profile</p>
                )}
              </CardContent>
            </Card>

            {/* Network Visualization */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">🔗 Relationship Network Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-50 rounded-lg overflow-hidden">
                  <NetworkVisualization profileData={profileData} />
                </div>
              </CardContent>
            </Card>

            {/* Also Viewed - Network Clusters */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🌐 Network Clusters
                  <span className="text-sm font-normal text-gray-500">
                    "People Also Viewed" - likely contemporaries
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.also_viewed && profileData.also_viewed.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profileData.also_viewed.map((person: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start gap-3">
                          {person.profile_picture && (
                            <img
                              src={person.profile_picture}
                              alt={person.first_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {person.first_name} {person.last_name}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {person.headline}
                            </p>
                            {person.follower_count && (
                              <p className="text-xs text-gray-500 mt-1">
                                {person.follower_count.toLocaleString()} followers
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Potential connection reason */}
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500">
                            Likely connection: {' '}
                            <span className="font-medium">
                              {person.headline?.toLowerCase().includes(profileData.company_industry?.toLowerCase()) 
                                ? 'Same industry'
                                : person.headline?.toLowerCase().includes(profileData.job_title?.toLowerCase().split(' ')[0])
                                ? 'Similar role'
                                : 'Professional network'}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No network cluster data available</p>
                )}
              </CardContent>
            </Card>

            {/* Raw Insights Summary */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">📊 Insights Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {profileData.recommendations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Verified Relationships</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {profileData.also_viewed?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Network Connections</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {profileData.recommendations?.filter((r: any) => 
                        extractRelationshipType(r.text || r.recommendation) === 'Manager'
                      ).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Management Relationships</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round((profileData.recommendations?.length || 0) * 0.2 + 
                                  (profileData.also_viewed?.length || 0) * 0.8)}
                    </div>
                    <div className="text-sm text-gray-600">Trust Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}