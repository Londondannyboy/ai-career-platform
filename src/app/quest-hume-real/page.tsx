'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'

export default function QuestHumeRealPage() {
  const { userId, isLoaded } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [lastResponse, setLastResponse] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [humeClient, setHumeClient] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Hume EVI refs
  const humeSocketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

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

  const initializeHumeEVI = async () => {
    try {
      // Check for Hume API key
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY
      if (!apiKey) {
        setLastResponse('❌ Hume API key not configured. Please add NEXT_PUBLIC_HUME_API_KEY to environment variables.')
        return
      }

      setLastResponse('🔄 Connecting to Hume EVI...')

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      mediaStreamRef.current = stream

      // Initialize AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Try different Hume WebSocket URL formats
      const possibleUrls = [
        `wss://api.hume.ai/v0/evi/socket?api_key=${apiKey}`,
        `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}`,
        `wss://ws.hume.ai/v0/evi/socket?api_key=${apiKey}`
      ]

      let socket: WebSocket | null = null
      
      for (const url of possibleUrls) {
        try {
          console.log('🔄 Trying WebSocket URL:', url.replace(apiKey, 'API_KEY'))
          socket = new WebSocket(url)
          humeSocketRef.current = socket
          
          // Wait for connection or error
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'))
            }, 5000)
            
            socket!.onopen = () => {
              clearTimeout(timeout)
              resolve(true)
            }
            
            socket!.onerror = (error) => {
              clearTimeout(timeout)
              reject(error)
            }
          })
          
          // If we get here, connection succeeded
          break
          
        } catch (error) {
          console.log('❌ Failed with URL:', url.replace(apiKey, 'API_KEY'))
          if (socket) {
            socket.close()
            socket = null
          }
        }
      }
      
      if (!socket) {
        throw new Error('Failed to connect to any Hume WebSocket endpoint')
      }

      socket.onopen = () => {
        console.log('🎤 Connected to Hume EVI')
        setIsConnected(true)
        
        // Send configuration with CLM endpoint
        const config = {
          type: 'session_settings',
          custom_language_model: {
            url: 'https://ai-career-platform.vercel.app/api/hume-clm',
            headers: {
              'Content-Type': 'application/json'
            }
          },
          user_context: {
            user_id: userId,
            session_type: 'quest_conversation'
          }
        }
        
        socket.send(JSON.stringify(config))
        setLastResponse('🎤 Hume EVI connected with your personalized context!')
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('📥 Hume response:', data)
        
        if (data.type === 'audio_output') {
          // Play Hume's audio response
          playHumeAudio(data.audio)
        } else if (data.type === 'text_output') {
          setLastResponse(`Hume AI: ${data.text}`)
        }
      }

      socket.onerror = (error) => {
        console.error('❌ Hume WebSocket error:', error)
        setLastResponse('Connection error with Hume EVI')
      }

      socket.onclose = () => {
        console.log('🛑 Hume EVI disconnected')
        setIsConnected(false)
      }

      // Start audio streaming to Hume
      startAudioStreaming(socket, stream, audioContext)
      
    } catch (error) {
      console.error('❌ Error initializing Hume EVI:', error)
      setLastResponse('Failed to initialize Hume EVI: ' + error)
    }
  }

  const startAudioStreaming = (socket: WebSocket, stream: MediaStream, audioContext: AudioContext) => {
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    
    processor.onaudioprocess = (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        const inputBuffer = event.inputBuffer.getChannelData(0)
        
        // Convert to the format Hume expects
        const audioData = {
          type: 'audio_input',
          audio: Array.from(inputBuffer),
          sample_rate: audioContext.sampleRate
        }
        
        socket.send(JSON.stringify(audioData))
      }
    }
    
    source.connect(processor)
    processor.connect(audioContext.destination)
  }

  const playHumeAudio = (audioData: number[]) => {
    if (!audioContextRef.current) return
    
    const audioContext = audioContextRef.current
    const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate)
    const channelData = buffer.getChannelData(0)
    
    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i]
    }
    
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start()
    
    setIsSpeaking(true)
    source.onended = () => {
      setIsSpeaking(false)
    }
  }

  const startHumeConversation = async () => {
    if (!userProfile) {
      alert('Please create your user profile first')
      return
    }

    try {
      setIsRecording(true)
      await initializeHumeEVI()
      
    } catch (error) {
      console.error('❌ Error starting Hume conversation:', error)
      setIsRecording(false)
    }
  }

  const stopHumeConversation = () => {
    setIsRecording(false)
    setIsConnected(false)
    setLastResponse('')
    
    // Close WebSocket
    if (humeSocketRef.current) {
      humeSocketRef.current.close()
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const interruptConversation = () => {
    if (humeSocketRef.current && humeSocketRef.current.readyState === WebSocket.OPEN) {
      const interrupt = {
        type: 'interrupt',
        action: 'stop_speaking'
      }
      humeSocketRef.current.send(JSON.stringify(interrupt))
    }
    setIsSpeaking(false)
    setLastResponse('Conversation interrupted. Listening for new input...')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Real Hume EVI Integration</h1>
        <p className="text-muted-foreground">
          Authentic Hume voice with personalized CLM endpoint
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Real Hume EVI Status</CardTitle>
            <CardDescription>
              Direct WebSocket connection to Hume AI with CLM
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
                {isRecording ? '🛑 Stop Hume EVI' : '🎤 Start Real Hume EVI'}
              </Button>
              
              {isRecording && (
                <Button 
                  onClick={interruptConversation}
                  variant="outline"
                  className="w-full"
                  disabled={!isConnected}
                >
                  ⚡ Interrupt Hume
                </Button>
              )}
            </div>

            {/* Voice Status */}
            {isRecording && (
              <div className="p-3 rounded-lg bg-blue-50">
                <div className="text-sm font-medium mb-1">Hume EVI Status</div>
                <div className="space-y-1">
                  <div className="text-sm">
                    🔗 WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </div>
                  <div className="text-sm">
                    🎤 Listening: {isRecording ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                  <div className="text-sm">
                    🔊 Hume Speaking: {isSpeaking ? '🟢 Active' : '⚪ Silent'}
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-1">Integration Status</div>
              <div className="text-sm">
                CLM Endpoint: 🟢 Ready
              </div>
              <div className="text-sm">
                User Context: {userProfile ? '🟢 Available' : '🔴 Missing'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>Hume EVI Response</CardTitle>
            <CardDescription>
              Real-time response from Hume AI with your context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 p-4 border rounded-lg bg-muted/30">
              {lastResponse ? (
                <div className="text-sm">
                  <div className="font-medium text-blue-600 mb-2">Hume EVI:</div>
                  <p>{lastResponse}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {userProfile 
                    ? 'Ready to start Hume EVI conversation...'
                    : 'Create your profile to begin'
                  }
                </div>
              )}
            </div>

            {userProfile && (
              <div className="mt-4 p-3 rounded-lg bg-green-50">
                <div className="text-sm font-medium mb-1">Your Context (Available to Hume)</div>
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

      {/* Configuration Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Real Hume EVI Configuration</CardTitle>
          <CardDescription>
            Direct WebSocket connection with CLM endpoint integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="font-medium">WebSocket URL:</div>
              <code className="text-sm bg-muted p-2 rounded block">
                wss://api.hume.ai/v0/evi/socket
              </code>
            </div>
            
            <div>
              <div className="font-medium">CLM Integration:</div>
              <code className="text-sm bg-muted p-2 rounded block">
                https://ai-career-platform.vercel.app/api/hume-clm
              </code>
            </div>
            
            <div>
              <div className="font-medium">Features:</div>
              <ul className="text-sm list-disc list-inside mt-1">
                <li>Real Hume voice synthesis</li>
                <li>Personalized responses with your context</li>
                <li>WebSocket streaming for low latency</li>
                <li>Voice interruption capability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}