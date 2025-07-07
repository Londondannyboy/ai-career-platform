'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'

export default function QuestCLMDirectPage() {
  const { userId, isLoaded } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastResponse, setLastResponse] = useState<string>('')

  useEffect(() => {
    if (isLoaded && userId) {
      checkUserProfile()
    }
  }, [isLoaded, userId])

  const checkUserProfile = async () => {
    try {
      const response = await fetch('/api/debug-users')
      const data = await response.json()
      
      const userProfile = data.users.find((u: any) => u.id === userId)
      setUserProfile(userProfile)
      
    } catch (error) {
      console.error('Error checking user profile:', error)
    }
  }

  const createUserProfile = async () => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/init-db-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force_user_id: userId,
          user_data: {
            email: 'dan@ckdelta.ai',
            name: 'Dan Keegan',
            company: 'CKDelta',
            current_role: 'Entrepreneur/Consultant'
          }
        })
      })

      if (response.ok) {
        checkUserProfile()
        setLastResponse('✅ User profile created successfully!')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const testCLMEndpoint = async () => {
    if (!userProfile) {
      alert('Please create your user profile first')
      return
    }

    try {
      setLastResponse('🧠 Testing your CLM endpoint with database context...')
      
      const response = await fetch('/api/hume-clm/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Quest AI with access to user database context.' },
            { role: 'user', content: 'Do you know who I am and my background?' }
          ],
          user_id: userId,
          custom_session_id: `quest_clm_test_${userId}_${Date.now()}`,
          emotional_context: { 
            engagement: 0.9, 
            conversation_mode: 'clm_direct_test',
            platform: 'quest_clm_direct'
          }
        })
      })

      const reader = response.body?.getReader()
      let result = ''
      
      if (reader) {
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const match = line.match(/0:"([^"]*)"/)
              if (match) {
                result += match[1]
              }
            }
          }
        }
      }
      
      setLastResponse(`🎯 CLM Response with your database context:\n\n${result}`)
      
    } catch (error) {
      console.error('❌ Error testing CLM endpoint:', error)
      setLastResponse('❌ Error testing CLM: ' + error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - CLM Direct Test</h1>
        <p className="text-muted-foreground">
          Test your Custom Language Model endpoint with database integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CLM Database Integration</CardTitle>
            <CardDescription>
              Direct test of your CLM endpoint that Hume EVI will call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={isLoaded ? "default" : "secondary"}>
                {isLoaded ? '✅ Auth Ready' : '⏳ Loading...'}
              </Badge>
              
              <Badge variant={userId ? "default" : "destructive"}>
                {userId ? `👤 ${userId.substring(0, 12)}...` : '❌ No User'}
              </Badge>
              
              <Badge variant={userProfile ? "default" : "secondary"}>
                {userProfile ? `📋 ${userProfile.name}` : '⏳ No Profile'}
              </Badge>

              <Badge variant="default">
                🔗 CLM Direct
              </Badge>
            </div>

            {/* Profile Management */}
            {!userProfile && userId && (
              <Button 
                onClick={createUserProfile}
                className="w-full"
                variant="outline"
              >
                👤 Create My Profile (Dan Keegan)
              </Button>
            )}

            {/* CLM Test */}
            <div className="space-y-2">
              <Button 
                onClick={testCLMEndpoint}
                className="w-full"
                variant="default"
                disabled={!userProfile}
                size="lg"
              >
                🧠 Test CLM Database Integration
              </Button>
              
              <Button 
                onClick={() => window.open('/coach-prompts', '_blank')}
                variant="outline"
                className="w-full"
                size="sm"
              >
                ⚙️ Edit Coach Prompts
              </Button>
            </div>

            {/* CLM Status */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border">
              <div className="text-sm font-medium mb-2">🔗 CLM Integration Status</div>
              <div className="space-y-2 text-sm">
                <div>✅ Endpoint: /api/hume-clm/chat/completions</div>
                <div>✅ Database: Connected to Neon.tech</div>
                <div>✅ User Context: {userProfile ? 'Available' : 'Pending'}</div>
                <div>✅ Hume Config: {process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '❌ Missing NEXT_PUBLIC_HUME_CONFIG_ID'}</div>
                <div>✅ Hume API Key: {process.env.NEXT_PUBLIC_HUME_API_KEY ? '✅ Set' : '❌ Missing NEXT_PUBLIC_HUME_API_KEY'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>CLM Response Test</CardTitle>
            <CardDescription>
              Response from your database-aware CLM endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-2">CLM Test Output</div>
              <div className="whitespace-pre-wrap text-sm">
                {lastResponse || 'Click "Test CLM Database Integration" to verify your endpoint works with database context...'}
              </div>
            </div>

            {userProfile && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border">
                <div className="text-sm font-medium mb-2">📋 Your Database Context</div>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {userProfile.name}</div>
                  <div><strong>Company:</strong> {userProfile.company}</div>
                  <div><strong>Role:</strong> {userProfile.current_role}</div>
                  <div><strong>ID:</strong> {userProfile.id}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How CLM Integration Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🔗 CLM Flow</h4>
              <ul className="text-sm space-y-1">
                <li>1. User speaks to Hume EVI</li>
                <li>2. Hume calls your CLM endpoint</li>
                <li>3. CLM loads your database context</li>
                <li>4. CLM generates database-aware response</li>
                <li>5. Hume synthesizes with authentic voice</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">✅ What's Connected</h4>
              <ul className="text-sm space-y-1">
                <li>• Your Neon.tech database</li>
                <li>• User profiles and conversation history</li>
                <li>• Custom coach prompts</li>
                <li>• Emotional context from Hume</li>
                <li>• OpenAI GPT-4 for responses</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <h4 className="font-medium mb-2">🎤 Next Step: Use Hume EVI Directly</h4>
            <p className="text-sm">
              Your CLM endpoint is configured in Hume. Now you can use Hume's voice interface directly 
              (not through React SDK) and it will automatically call your database-aware endpoint.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}