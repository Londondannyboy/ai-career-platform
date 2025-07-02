'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User as DatabaseUser } from '@/types/database'
import Navigation from '@/components/Navigation'
import CompanyCard from '@/components/CompanyCard'
import CreateCompanyModal from '@/components/CreateCompanyModal'
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
  Shield,
  Building2,
  Upload
} from 'lucide-react'
import { CompanyWorkspace } from '@/lib/documents/workspaceService'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const [workspaces, setWorkspaces] = useState<(CompanyWorkspace & { stats?: any })[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const supabase = createClient()

  // Load user profile
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

  // Load user workspaces
  const loadWorkspaces = async () => {
    if (!user) return
    
    setIsLoadingWorkspaces(true)
    try {
      const response = await fetch('/api/workspace/list')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data.workspaces || [])
      } else {
        console.error('Failed to load workspaces:', response.status)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setIsLoadingWorkspaces(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadWorkspaces()
    }
  }, [user])

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
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <div className="rounded-lg bg-orange-100 p-2 mr-3">
                  <Building2 className="h-4 w-4 text-orange-600" />
                </div>
                Manage Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">
                Create workspaces and upload documents
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Company
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

        {/* Company Workspaces Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Company Workspaces</h2>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </div>

          {isLoadingWorkspaces ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-gray-200 p-2 w-9 h-9"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : workspaces.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <CompanyCard
                  key={workspace.id}
                  workspace={workspace}
                  onEdit={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit workspace:', workspace.id)
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No company workspaces yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create your first company workspace to start managing documents, collaborating with your team, and leveraging AI-powered insights.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Workspace
                </Button>
              </CardContent>
            </Card>
          )}
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

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCompanyCreated={loadWorkspaces}
      />
    </div>
  )
}