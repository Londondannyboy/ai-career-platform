'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { User as DatabaseUser } from '@/types/database'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User as UserIcon, Mail, Calendar, Linkedin } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        setUser(user)
        
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  // Parse LinkedIn data if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedinData = (profile.linkedin_data as Record<string, any>) || {}
  const linkedinPicture = linkedinData.picture || linkedinData.avatar_url || profile.profile_image

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Your professional information and LinkedIn data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your basic profile and authentication details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={linkedinPicture || undefined} 
                      alt={profile.name || 'User'} 
                    />
                    <AvatarFallback className="text-lg">
                      {profile.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{profile.name}</h3>
                    {linkedinData.headline && (
                      <p className="text-gray-600">{linkedinData.headline}</p>
                    )}
                    {linkedinData.location && (
                      <p className="text-sm text-gray-500">{linkedinData.location}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {linkedinData.summary && (
                  <div>
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-sm text-gray-600">{linkedinData.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* LinkedIn Data */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(linkedinData).length > 0 ? (
                  <div className="space-y-3">
                    {linkedinData.given_name && (
                      <div>
                        <span className="text-sm font-medium">First Name:</span>
                        <p className="text-sm text-gray-600">{linkedinData.given_name}</p>
                      </div>
                    )}
                    {linkedinData.family_name && (
                      <div>
                        <span className="text-sm font-medium">Last Name:</span>
                        <p className="text-sm text-gray-600">{linkedinData.family_name}</p>
                      </div>
                    )}
                    {linkedinData.email && (
                      <div>
                        <span className="text-sm font-medium">LinkedIn Email:</span>
                        <p className="text-sm text-gray-600">{linkedinData.email}</p>
                      </div>
                    )}
                    {profile.linkedin_id && (
                      <div>
                        <span className="text-sm font-medium">LinkedIn ID:</span>
                        <p className="text-sm text-gray-600">{profile.linkedin_id}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No LinkedIn data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>🎯 <strong>AI Coaching:</strong> Your profile helps personalize coaching conversations</p>
                  <p>💼 <strong>Job Matching:</strong> LinkedIn data improves job recommendations</p>
                  <p>🗣️ <strong>Career Conversations:</strong> AI references your background in discussions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enhance Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Add detailed career information for better AI coaching and job matching.
                  </p>
                  <Link href="/profile/edit">
                    <Button className="w-full">
                      Edit Profile Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✅ Your data is stored securely</p>
                  <p>✅ Only you can access your profile</p>
                  <p>✅ AI coaching uses this data to help you</p>
                  <p>✅ Data is never shared with third parties</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Raw LinkedIn Data (for debugging) */}
        {Object.keys(linkedinData).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Raw LinkedIn Data</CardTitle>
              <CardDescription>
                Technical view of your LinkedIn authentication data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(linkedinData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}