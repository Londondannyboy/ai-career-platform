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
import { MessageCircle, Users, Calendar, Target } from 'lucide-react'

export default function CoachingPage() {
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
          <h1 className="text-3xl font-bold text-gray-900">Career Coaching</h1>
          <p className="mt-2 text-gray-600">
            Connect with mentors, coaches, and peers for collaborative career development.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                AI Career Coach
              </CardTitle>
              <CardDescription>
                Get instant career guidance powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Button size="lg" disabled className="w-full">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Start AI Coaching (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Human Coaches
              </CardTitle>
              <CardDescription>
                Connect with professional career coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Button disabled className="w-full">
                  Find Coaches (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">Scheduled Sessions</h3>
                  <p className="text-sm text-gray-600">Book one-on-one coaching sessions</p>
                </div>
                <div className="text-center p-4">
                  <Target className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">Goal Setting</h3>
                  <p className="text-sm text-gray-600">Set and track career development goals</p>
                </div>
                <div className="text-center p-4">
                  <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">Peer Groups</h3>
                  <p className="text-sm text-gray-600">Join career development communities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}