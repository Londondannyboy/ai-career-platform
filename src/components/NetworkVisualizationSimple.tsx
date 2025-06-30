'use client'

import React from 'react'

interface NetworkVisualizationProps {
  profileData: any
}

export default function NetworkVisualizationSimple({ profileData }: NetworkVisualizationProps) {
  if (!profileData) return null

  const recommendations = profileData.recommendations || []
  const alsoViewed = profileData.also_viewed || []

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
      Manager: '#9333ea',
      Subordinate: '#7c3aed',
      Peer: '#10b981',
      Mentor: '#f59e0b',
      Client: '#ec4899',
      Colleague: '#6b7280'
    }
    return colors[type] || colors.Colleague
  }

  return (
    <div className="p-6">
      {/* Center Profile */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
          {profileData.display_name?.charAt(0) || '?'}
        </div>
        <div className="text-center">
          <div className="font-semibold">{profileData.display_name}</div>
          <div className="text-sm text-gray-600">{profileData.job_title}</div>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Verified Relationships */}
        <div>
          <h3 className="font-semibold mb-4 text-purple-700">Verified Relationships</h3>
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec: any, idx: number) => {
              const relationship = extractRelationshipType(rec.text || rec.recommendation || '')
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: getRelationshipColor(relationship) }}
                  >
                    {rec.recommender_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rec.recommender_name || 'Anonymous'}</div>
                    <div className="text-xs text-gray-600">{relationship}</div>
                  </div>
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                </div>
              )
            })}
            {recommendations.length === 0 && (
              <p className="text-gray-500 text-sm">No recommendations available</p>
            )}
          </div>
        </div>

        {/* Network Clusters */}
        <div>
          <h3 className="font-semibold mb-4 text-blue-700">Network Clusters</h3>
          <div className="space-y-3">
            {alsoViewed.slice(0, 5).map((person: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {person.first_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {person.first_name} {person.last_name}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {person.headline?.substring(0, 40)}...
                  </div>
                </div>
              </div>
            ))}
            {alsoViewed.length === 0 && (
              <p className="text-gray-500 text-sm">No network data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
          <span>Verified via Recommendations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>"Also Viewed" Network</span>
        </div>
      </div>
    </div>
  )
}