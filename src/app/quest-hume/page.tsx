'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'

export default function QuestHumePage() {
  const { userId, isLoaded } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [lastResponse, setLastResponse] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [humeConfig, setHumeConfig] = useState<any>(null)
  
  // Voice recognition refs
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (isLoaded && userId) {
      initializeHumeClient()
      checkUserProfile()
    }
  }, [isLoaded, userId])

  const initializeHumeClient = async () => {
    try {
      // Initialize Hume EVI client with CLM endpoint
      const config = {
        apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY,
        customLLMUrl: 'https://ai-career-platform.vercel.app/api/hume-clm',
        userId: userId,
        sessionConfig: {
          type: 'voice_conversation',
          context: {
            user_id: userId,
            platform: 'quest_web'
          }
        }
      }
      
      setHumeConfig(config)
      console.log('🎤 Hume EVI configured with CLM endpoint')
      
    } catch (error) {
      console.error('❌ Failed to initialize Hume client:', error)
    }
  }

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
            email: 'keegan.dan@gmail.com',
            name: 'Dan Keegan',
            company: 'CKDelta',
            current_role: 'Entrepreneur/Consultant'
          }
        })
      })
      
      const result = await response.json()
      console.log('✅ User profile created:', result)
      
      // Refresh profile
      checkUserProfile()
      
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
    }
  }

  const startHumeConversation = async () => {
    if (!userProfile) {
      alert('Please create your user profile first')
      return
    }

    try {
      setIsRecording(true)
      setIsConnected(true)
      
      // Initialize Web Speech API for voice input
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started')
          setLastResponse('Listening... speak now!')
        }
        
        recognition.onresult = async (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          console.log('🗣️ User said:', transcript)
          
          // Process the voice input through CLM
          await processVoiceInput(transcript)
        }
        
        recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event.error)
          setLastResponse('Voice recognition error: ' + event.error)
        }
        
        recognition.onend = () => {
          console.log('🛑 Voice recognition ended')
          if (isRecording) {
            // Restart if still in conversation mode
            recognition.start()
          }
        }
        
        recognitionRef.current = recognition
        recognition.start()
        
        setLastResponse('🎤 Voice recognition active. Say something!')
      } else {
        setLastResponse('❌ Speech recognition not supported in this browser')
      }
      
    } catch (error) {
      console.error('❌ Error starting voice conversation:', error)
      setIsRecording(false)
      setIsConnected(false)
    }
  }

  const processVoiceInput = async (transcript: string) => {
    try {
      setLastResponse(`You said: "${transcript}"\n\nProcessing...`)
      
      const response = await fetch('/api/hume-clm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Quest, an AI career coach. Respond conversationally and warmly.' },
            { role: 'user', content: transcript }
          ],
          user_id: userId,
          custom_session_id: `quest_voice_${userId}_${Date.now()}`,
          emotional_context: { engagement: 0.8, conversation_mode: 'voice' }
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
      
      setLastResponse(`You: "${transcript}"\n\nQuest AI: ${result}`)
      
      // Speak the response
      if ('speechSynthesis' in window && result) {
        const utterance = new SpeechSynthesisUtterance(result)
        utterance.rate = 0.9
        utterance.pitch = 1
        speechSynthesis.speak(utterance)
      }
      
    } catch (error) {
      console.error('❌ Error processing voice input:', error)
      setLastResponse('Error processing voice input: ' + error)
    }
  }

  const stopHumeConversation = () => {
    setIsRecording(false)
    setIsConnected(false)
    setLastResponse('')
    
    // Stop voice recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
  }

  const testCLMDirectly = async () => {
    if (!userProfile) return
    
    try {
      const response = await fetch('/api/hume-clm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Quest, an AI career coach.' },
            { role: 'user', content: 'Hello, what do you know about me?' }
          ],
          user_id: userId,
          custom_session_id: `quest_${userId}_${Date.now()}`,
          emotional_context: { engagement: 0.8 }
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
      
      setLastResponse(result)
      
    } catch (error) {
      console.error('❌ Error testing CLM:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Hume EVI Integration</h1>
        <p className="text-muted-foreground">
          Real voice conversation with personalized context from your profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Assistant Status</CardTitle>
            <CardDescription>
              Hume EVI with custom language model integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auth Status */}
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

            {/* Hume Controls */}
            <div className="space-y-2">
              <Button 
                onClick={isRecording ? stopHumeConversation : startHumeConversation}
                className="w-full"
                variant={isRecording ? "destructive" : "default"}
                disabled={!userProfile}
              >
                {isRecording ? '🛑 Stop Conversation' : '🎤 Start Hume EVI'}
              </Button>
              
              <Button 
                onClick={testCLMDirectly}
                variant="outline"
                className="w-full"
                disabled={!userProfile}
              >
                🧪 Test CLM Response
              </Button>
            </div>

            {/* Connection Status */}
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-1">Connection Status</div>
              <div className="text-sm">
                Hume EVI: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
              <div className="text-sm">
                CLM Endpoint: {humeConfig ? '🟢 Configured' : '🔴 Not Set'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>AI Response</CardTitle>
            <CardDescription>
              Live response from Quest AI with your personalized context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 p-4 border rounded-lg bg-muted/30">
              {lastResponse ? (
                <div className="text-sm">
                  <div className="font-medium text-green-600 mb-2">Quest AI Response:</div>
                  <p>{lastResponse}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {userProfile 
                    ? 'Ready to start conversation...'
                    : 'Create your profile to begin'
                  }
                </div>
              )}
            </div>

            {userProfile && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50">
                <div className="text-sm font-medium mb-1">Your Profile Context</div>
                <div className="text-sm text-muted-foreground">
                  Name: {userProfile.name}<br/>
                  Company: {userProfile.company}<br/>
                  Role: {userProfile.current_role}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hume EVI Configuration</CardTitle>
          <CardDescription>
            Configure your Hume AI dashboard to use the Quest CLM endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="font-medium">Custom Language Model URL:</div>
              <code className="text-sm bg-muted p-2 rounded block">
                https://ai-career-platform.vercel.app/api/hume-clm
              </code>
            </div>
            
            <div>
              <div className="font-medium">Required Headers:</div>
              <code className="text-sm bg-muted p-2 rounded block">
                Content-Type: application/json
              </code>
            </div>
            
            <div>
              <div className="font-medium">User Context:</div>
              <code className="text-sm bg-muted p-2 rounded block">
                user_id: {userId || 'your_clerk_user_id'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}