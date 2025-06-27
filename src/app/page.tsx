'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User as DatabaseUser } from '@/types/database'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Users, 
  Briefcase, 
  MessageCircle, 
  Plus,
  TrendingUp,
  Shield
} from 'lucide-react'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      if (user?.id) {
        // Get user profile from Supabase
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)
      }
    }

    if (user) {
      getProfile()
    }
  }, [user, supabase])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // If not signed in, show landing page with sign-in option
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Quest
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your AI-powered journey to career success through intelligent conversations
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started - Sign In
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName || profile?.name || 'there'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Build your career story, connect with professionals, and discover opportunities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <div className="rounded-lg bg-blue-100 p-2 mr-3">
                  <Mic className="h-4 w-4 text-blue-600" />
                </div>
                Start Repo Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">
                Record a new career conversation with AI
              </p>
              <Link href="/repo">
                <Button size="sm" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  New Session
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <div className="rounded-lg bg-green-100 p-2 mr-3">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                Find Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">
                Discover and connect with professionals
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Browse Network
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <div className="rounded-lg bg-purple-100 p-2 mr-3">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                </div>
                Search Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">
                Use AI to find your perfect role
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Voice Search
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md border-2 border-purple-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-2 mr-3">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                Start Your Quest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">
                AI-powered career journey with smart playbooks
              </p>
              <Link href="/quest">
                <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Begin Quest
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Repo Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Repo Sessions</span>
                  <Badge variant="secondary" className="flex items-center">
                    <Shield className="mr-1 h-3 w-3" />
                    Private
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your latest career conversations and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Mic className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No repo sessions yet</p>
                    <p className="text-sm">Start your first career conversation to build your repository</p>
                    <Link href="/repo">
                      <Button className="mt-4" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Session
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Career Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Build your repo to unlock AI-powered career insights</p>
                </div>
              </CardContent>
            </Card>

            {/* Network Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Your Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Connections</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shared Repos</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Coaching Sessions</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    </div>
                    <p>Start your first Repo session to build your career story</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="rounded-full bg-gray-100 p-1 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    </div>
                    <p>Connect with colleagues and professionals in your field</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="rounded-full bg-gray-100 p-1 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    </div>
                    <p>Use voice search to find jobs tailored to your experience</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}