'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Edit3 } from 'lucide-react'

export default function SurfaceRepoPage() {
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false)
    }
  }, [isLoaded])

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surface Repo</h1>
            <p className="mt-2 text-gray-600">
              Your public professional profile - LinkedIn style with PDF export
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </Button>
            
            <Button
              variant="default"
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Coming Soon Notice */}
          <Card>
            <CardHeader>
              <CardTitle>Surface Repo - Coming Soon!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📄</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Professional Profile Repository
                </h3>
                <p className="text-gray-600 mb-4">
                  Your Surface Repo will be your public LinkedIn-style professional profile with:
                </p>
                <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
                  <li>✅ Professional headline and summary</li>
                  <li>✅ Work experience with achievements</li>
                  <li>✅ Education and certifications</li>
                  <li>✅ Core skills and endorsements</li>
                  <li>✅ Portfolio items and projects</li>
                  <li>✅ PDF export in multiple formats</li>
                  <li>✅ Job-optimized resume generation</li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Database Setup Required:</strong> The Surface Repo functionality requires 
                    database schema updates that will be applied soon. This will enable the full 
                    tiered repository system (Surface, Mid, Deep, Full).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tiered System Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Quest's Revolutionary Tiered Repository System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="text-2xl mb-2">📄</div>
                  <h4 className="font-semibold text-green-800">Surface Repo</h4>
                  <p className="text-sm text-green-600">Public LinkedIn-style profile</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="text-2xl mb-2">💼</div>
                  <h4 className="font-semibold text-blue-800">Mid Repo</h4>
                  <p className="text-sm text-blue-600">Detailed achievements for recruiters</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-purple-50 border-purple-200">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold text-purple-800">Deep Repo</h4>
                  <p className="text-sm text-purple-600">Authentic peer/coach feedback</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="text-2xl mb-2">🌟</div>
                  <h4 className="font-semibold text-orange-800">Full Repo</h4>
                  <p className="text-sm text-orange-600">Life goals and personal mission</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Quest Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="font-medium">{user.fullName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="font-medium">{user.emailAddresses?.[0]?.emailAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="font-medium font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Repository Status</span>
                  <span className="text-sm text-orange-600 font-medium">Setting up database...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}