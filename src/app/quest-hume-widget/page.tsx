'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'
import Script from 'next/script'

export default function QuestHumeWidgetPage() {
  const { userId, isLoaded } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [widgetReady, setWidgetReady] = useState(false)

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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Hume Voice Widget</h1>
        <p className="text-muted-foreground">
          Official Hume voice widget with your CLM database integration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hume Voice Assistant</CardTitle>
          <CardDescription>
            Using official Hume widget with your configured CLM endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge variant={isLoaded ? "default" : "secondary"}>
              {isLoaded ? '✅ Auth Ready' : '⏳ Loading...'}
            </Badge>
            
            <Badge variant={userId ? "default" : "destructive"}>
              {userId ? `👤 ${userId.substring(0, 12)}...` : '❌ No User'}
            </Badge>
            
            <Badge variant={userProfile ? "default" : "secondary"}>
              {userProfile ? `📋 ${userProfile.name}` : '⏳ No Profile'}
            </Badge>

            <Badge variant={widgetReady ? "default" : "secondary"}>
              {widgetReady ? '🎤 Widget Ready' : '⏳ Loading Widget...'}
            </Badge>
          </div>

          {/* Configuration Info */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border">
            <div className="text-sm font-medium mb-2">🔗 CLM Configuration</div>
            <div className="space-y-1 text-sm">
              <div>✅ Config ID: {process.env.NEXT_PUBLIC_HUME_CONFIG_ID}</div>
              <div>✅ CLM Endpoint: Configured in Hume Console</div>
              <div>✅ Voice: AURA (authentic Hume voice)</div>
              <div>✅ Database: Connected via CLM</div>
            </div>
          </div>

          {/* Hume Widget Container */}
          <div className="p-6 rounded-lg bg-gray-50 border-2 border-dashed border-gray-300">
            <div id="hume-widget-container" className="flex justify-center">
              {process.env.NEXT_PUBLIC_HUME_API_KEY && process.env.NEXT_PUBLIC_HUME_CONFIG_ID ? (
                <>
                  <Script 
                    src="https://unpkg.com/@humeai/voice-widget@0.1.0/dist/index.js"
                    onLoad={() => {
                      console.log('🎤 Hume widget script loaded')
                      setWidgetReady(true)
                    }}
                  />
                  <hume-ai-voice 
                    auth-type="apiKey"
                    api-key={process.env.NEXT_PUBLIC_HUME_API_KEY}
                    config-id={process.env.NEXT_PUBLIC_HUME_CONFIG_ID}
                  />
                </>
              ) : (
                <div className="text-red-600 text-center">
                  <p>❌ Missing Hume configuration</p>
                  <p className="text-sm mt-2">Please set NEXT_PUBLIC_HUME_API_KEY and NEXT_PUBLIC_HUME_CONFIG_ID</p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <h4 className="font-medium mb-2">🎤 How to Use</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Click the microphone button in the widget above</li>
              <li>Speak naturally - Hume will capture your voice</li>
              <li>Hume calls your CLM endpoint with database context</li>
              <li>You'll hear the response in authentic "aura" voice</li>
            </ol>
          </div>

          {userProfile && (
            <div className="p-4 rounded-lg bg-blue-50 border">
              <div className="text-sm font-medium mb-2">📋 Your Database Context</div>
              <div className="space-y-1 text-sm">
                <div><strong>Name:</strong> {userProfile.name}</div>
                <div><strong>Company:</strong> {userProfile.company}</div>
                <div><strong>Role:</strong> {userProfile.current_role}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Add custom element type declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hume-ai-voice': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'auth-type'?: string
        'api-key'?: string
        'config-id'?: string
      }, HTMLElement>
    }
  }
}