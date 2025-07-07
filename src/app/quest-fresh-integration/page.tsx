'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'
import { getContextualPrompt, defaultCoachPrompts, CoachPrompts } from '@/lib/prompts/quest-coach-prompts'
import { VoiceProvider, useVoice } from '@humeai/voice-react'

// Environment configuration
const HUME_API_KEY = process.env.NEXT_PUBLIC_HUME_API_KEY
const HUME_CONFIG_ID = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '8f16326f-a45d-4433-9a12-890120244ec3'

function QuestFreshIntegrationContent() {
  const { userId, isLoaded } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastResponse, setLastResponse] = useState<string>('')
  const [debugMode, setDebugMode] = useState(false)
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [wasInterrupted, setWasInterrupted] = useState(false)

  // Hume Voice SDK hooks
  const {
    status,
    connect,
    disconnect,
    sendUserInput,
    messages,
    isPlaying,
    isMuted,
    mute,
    unmute,
    micFft,
    error
  } = useVoice()

  useEffect(() => {
    if (isLoaded && userId) {
      checkUserProfile()
    }
  }, [isLoaded, userId])

  // Handle new messages from Hume EVI
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      console.log('📥 Latest Hume message:', latestMessage)
      
      if (latestMessage.type === 'user_message') {
        const userText = (latestMessage as any).content || (latestMessage as any).text || ''
        if (userText) {
          setLastResponse(`You: "${userText}"\n\n🧠 Quest AI is thinking...`)
          // Process through your CLM API for database integration
          processUserInputThroughCLM(userText)
        }
      } else if (latestMessage.type === 'assistant_message') {
        const aiText = (latestMessage as any).content || (latestMessage as any).text || ''
        if (aiText) {
          setLastResponse(prev => {
            const userPart = prev.split('\n\n🧠')[0]
            return `${userPart}\n\nQuest AI: ${aiText}`
          })
        }
      }
    }
  }, [messages])

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

  const processUserInputThroughCLM = async (transcript: string) => {
    try {
      setIsProcessingAI(true)
      
      // Load custom prompts with fresh integration instructions
      const savedPrompts = localStorage.getItem('questCoachPrompts')
      const prompts: CoachPrompts = savedPrompts ? JSON.parse(savedPrompts) : defaultCoachPrompts
      
      const scenario = wasInterrupted ? 'interrupted' : null
      const systemPrompt = getContextualPrompt(
        prompts, 
        scenario, 
        wasInterrupted ? 'User just interrupted you. Acknowledge this naturally and respond to their new input.' : undefined
      ) + `\n\nIMPORTANT: You are using authentic Hume AI voice synthesis. Speak naturally and conversationally as your voice quality is professional and expressive with emotional intelligence.`
      
      console.log('🤖 Processing through CLM API with fresh integration')
      if (wasInterrupted) {
        console.log('🔄 Handling interruption with fresh integration')
        setWasInterrupted(false)
      }
      
      const response = await fetch('/api/hume-clm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript }
          ],
          user_id: userId,
          custom_session_id: `quest_fresh_integration_${userId}_${Date.now()}`,
          emotional_context: { 
            engagement: 0.9, 
            conversation_mode: 'fresh_hume_voice',
            platform: 'quest_fresh_integration',
            wasInterrupted: wasInterrupted,
            voice_quality: 'authentic_hume_evi',
            integration_type: 'hume_react_sdk'
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
      
      console.log('🎯 CLM API response:', result)
      
      // Send the AI response back to Hume EVI for voice synthesis
      if (result && status.value === 'connected') {
        console.log('🎤 Sending AI response to Hume for authentic voice synthesis')
        sendUserInput(result)
      }
      
      setIsProcessingAI(false)
      
    } catch (error) {
      console.error('❌ Error processing through CLM API:', error)
      setIsProcessingAI(false)
    }
  }

  const handleConnect = async () => {
    if (!userProfile) {
      alert('Please create your user profile first')
      return
    }

    try {
      console.log('🎤 Connecting to Hume EVI with fresh integration...')
      await connect()
      setLastResponse('🎤 Connected to authentic Hume EVI! Speak naturally...')
    } catch (error) {
      console.error('❌ Error connecting to Hume EVI:', error)
      setLastResponse('❌ Failed to connect to Hume EVI: ' + error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setLastResponse('')
  }

  const handleInterrupt = () => {
    if (isPlaying) {
      setWasInterrupted(true)
      // Hume SDK handles the interruption automatically
      console.log('🛑 Interrupting Hume EVI conversation')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Fresh Hume Integration</h1>
        <p className="text-muted-foreground">
          Clean integration using official Hume React SDK with authentic voice and database connectivity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fresh Hume Voice Assistant</CardTitle>
            <CardDescription>
              Official Hume React SDK integration with authentic "aura" voice and CLM database connectivity
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
                🎤 Fresh Hume SDK
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

            {/* Voice Controls */}
            <div className="space-y-2">
              <Button 
                onClick={status.value === 'connected' ? handleDisconnect : handleConnect}
                className="w-full"
                variant={status.value === 'connected' ? "destructive" : "default"}
                disabled={!userProfile}
                size="lg"
              >
                {status.value === 'connected' ? '🛑 Stop Fresh Quest AI' : '🎤 Start Fresh Quest AI'}
              </Button>
              
              {status.value === 'connected' && (
                <Button 
                  onClick={handleInterrupt}
                  variant="outline"
                  className="w-full"
                  disabled={status.value !== 'connected'}
                >
                  ⚡ Interrupt & Speak Now
                </Button>
              )}
              
              <Button 
                onClick={() => setDebugMode(!debugMode)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                🔍 {debugMode ? 'Hide' : 'Show'} Debug Info
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

            {/* Fresh Integration Status Display */}
            {status.value === 'connected' && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border">
                <div className="text-sm font-medium mb-2">🎤 Fresh Integration Status</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Integration:</span>
                    <span className="text-green-600 font-medium">🔊 Fresh Hume SDK</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Connection:</span>
                    <span className={status.value === 'connected' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {status.value === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>AI Processing:</span>
                    <span className={isProcessingAI ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                      {isProcessingAI ? '🟡 Thinking...' : '✅ Ready'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hume Speaking:</span>
                    <span className={isPlaying ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                      {isPlaying ? '🔊 Authentic Voice' : '⚪ Silent'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Microphone:</span>
                    <span className={isMuted ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {isMuted ? '🔇 Muted' : '🎤 Active'}
                    </span>
                  </div>
                  {micFft && (
                    <div className="flex justify-between text-sm">
                      <span>Voice Level:</span>
                      <span className="text-blue-600 font-medium">
                        {Math.round(Math.max(...micFft) * 100)} 🎵
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debug Info */}
            {debugMode && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-sm font-medium mb-2">🔍 Fresh Integration Debug</div>
                <div className="space-y-1 text-xs">
                  <div>SDK Status: {status.value}</div>
                  <div>Messages Count: {messages.length}</div>
                  <div>Is Playing: {isPlaying ? '🟢 YES' : '🔴 NO'}</div>
                  <div>Is Muted: {isMuted ? '🔴 YES' : '🟢 NO'}</div>
                  <div>CLM Processing: {isProcessingAI ? '🟡 YES' : '🔴 NO'}</div>
                  <div>Was Interrupted: {wasInterrupted ? '🟡 YES' : '🔴 NO'}</div>
                  {error && <div className="text-red-600">Error: {error.message}</div>}
                </div>
                <div className="mt-2 text-xs text-green-700">
                  Using official Hume React SDK for reliable voice integration
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>Fresh Integration Conversation</CardTitle>
            <CardDescription>
              Real-time conversation with authentic Hume voice and database integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-2">Fresh Integration Output</div>
              <div className="whitespace-pre-wrap text-sm">
                {lastResponse || 'Fresh Quest AI ready to start authentic conversation with Hume voice...'}
              </div>
            </div>

            {/* Message History */}
            {messages.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border">
                <div className="text-sm font-medium mb-2">🎤 Hume Voice Messages ({messages.length})</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {messages.slice(-3).map((msg, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium">
                        {msg.type === 'user_message' ? '👤 You:' : '🤖 Hume:'}
                      </span>
                      <span className="ml-2">{(msg as any).content || (msg as any).text || 'Processing...'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fresh Integration Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🎤 Official Hume SDK</h4>
              <ul className="text-sm space-y-1">
                <li>• Official @humeai/voice-react integration</li>
                <li>• Authentic "aura" voice synthesis</li>
                <li>• Proper audio format handling</li>
                <li>• Built-in interruption support</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🔗 Database Integration</h4>
              <ul className="text-sm space-y-1">
                <li>• CLM API for AI responses</li>
                <li>• User profile and context</li>
                <li>• Interruption handling</li>
                <li>• Custom prompt system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function QuestFreshIntegrationPage() {
  if (!HUME_API_KEY) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              ❌ NEXT_PUBLIC_HUME_API_KEY environment variable is required.
              Please add your Hume API key to continue.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <VoiceProvider
      auth={{
        type: "apiKey",
        value: HUME_API_KEY
      }}
      configId={HUME_CONFIG_ID}
      onMessage={(message) => {
        console.log('🎤 Hume Voice Message:', message)
      }}
      onError={(error) => {
        console.error('❌ Hume Voice Error:', error)
      }}
    >
      <QuestFreshIntegrationContent />
    </VoiceProvider>
  )
}