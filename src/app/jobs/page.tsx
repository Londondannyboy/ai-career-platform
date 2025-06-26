'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Mic, MapPin, DollarSign } from 'lucide-react'

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
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
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Job Search</h1>
          <p className="mt-2 text-gray-600">
            Use voice commands to find jobs that match your skills and career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic className="mr-2 h-5 w-5" />
                Voice Job Search
              </CardTitle>
              <CardDescription>
                Tell us what kind of job you&apos;re looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Button size="lg" disabled className="w-full">
                  <Mic className="mr-2 h-5 w-5" />
                  Start Voice Search (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered job matching based on your repo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  Build your career repo first to get personalized job recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Job Search Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">Location-Based</h3>
                  <p className="text-sm text-gray-600">Find jobs near you or remote opportunities</p>
                </div>
                <div className="text-center p-4">
                  <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">Salary Insights</h3>
                  <p className="text-sm text-gray-600">AI-powered salary predictions and negotiations</p>
                </div>
                <div className="text-center p-4">
                  <Briefcase className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">Career Growth</h3>
                  <p className="text-sm text-gray-600">Jobs that align with your career trajectory</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}