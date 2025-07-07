'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'

export default function QuestHumeDebugPage() {
  const { userId, isLoaded } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastResponse, setLastResponse] = useState<string>('')
  const [debugMode, setDebugMode] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [humeStatus, setHumeStatus] = useState<string>('disconnected')
  const [clmRequests, setClmRequests] = useState<any[]>([])

  // WebSocket refs for direct Hume connection
  const humeSocketRef = useRef<WebSocket | null>(null)
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

  const connectToHume = async () => {
    if (!userProfile) {
      alert('Please create your user profile first')
      return
    }

    try {
      const HUME_API_KEY = process.env.NEXT_PUBLIC_HUME_API_KEY
      const HUME_CONFIG_ID = process.env.NEXT_PUBLIC_HUME_CONFIG_ID

      if (!HUME_API_KEY || !HUME_CONFIG_ID) {
        setLastResponse('❌ Missing Hume configuration. Check environment variables.')
        return
      }

      setHumeStatus('connecting')
      setLastResponse('🔄 Connecting to Hume EVI with CLM configuration...')

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

      // Connect to Hume WebSocket
      const websocketUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${HUME_API_KEY}&config_id=${HUME_CONFIG_ID}`
      
      console.log('🔄 Connecting to Hume WebSocket:', websocketUrl.replace(HUME_API_KEY, '***'))
      const socket = new WebSocket(websocketUrl)
      humeSocketRef.current = socket

      socket.onopen = () => {
        console.log('🎤 Connected to Hume EVI')
        setIsConnected(true)
        setHumeStatus('connected')
        setLastResponse('🎤 Connected to Hume EVI! Your CLM endpoint will be called for AI responses.')
        
        // Configure audio format for Hume
        const sessionSettings = {
          type: 'session_settings',
          audio: {
            encoding: 'linear16',
            sample_rate: 16000,
            channels: 1
          }
        }
        socket.send(JSON.stringify(sessionSettings))
        console.log('🔊 Sent audio format configuration:', sessionSettings)
        
        // Log CLM configuration info
        console.log('🔗 CLM Configuration Active - Hume will call your endpoint for responses')
        setClmRequests(prev => [...prev, {
          timestamp: new Date().toISOString(),
          type: 'connection',
          message: 'Connected to Hume EVI with CLM configuration'
        }])
        
        // Start audio streaming to Hume
        startAudioStreaming(socket, stream)
      }

      socket.onerror = (error) => {
        console.error('❌ Hume WebSocket error:', error)
        setLastResponse('❌ Connection error with Hume EVI. Check API key and config ID.')
        setHumeStatus('error')
        setIsConnected(false)
      }

      socket.onclose = (event) => {
        console.log('🔌 Hume WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setHumeStatus('disconnected')
        setLastResponse('Disconnected from Hume EVI')
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📥 Hume message:', data)
          
          setMessages(prev => [...prev, data])
          
          if (data.type === 'user_message') {
            const userText = data.message?.content || ''
            setLastResponse(`You: "${userText}"\n\n🧠 Hume is calling your CLM endpoint...`)
            
            // Log CLM request
            setClmRequests(prev => [...prev, {
              timestamp: new Date().toISOString(),
              type: 'clm_request',
              message: `CLM called for: "${userText.substring(0, 50)}..."`
            }])
            
          } else if (data.type === 'assistant_message') {
            const aiText = data.message?.content || ''
            setLastResponse(prev => {
              const userPart = prev.split('\n\n🧠')[0]
              return `${userPart}\n\nQuest AI (via CLM): ${aiText}`
            })
            setIsSpeaking(true)
            
            // Log CLM response
            setClmRequests(prev => [...prev, {
              timestamp: new Date().toISOString(),
              type: 'clm_response',
              message: `CLM returned: "${aiText.substring(0, 50)}..."`
            }])
            
            // Auto-stop speaking after reasonable delay
            setTimeout(() => {
              setIsSpeaking(false)
            }, 4000)
            
          } else if (data.type === 'audio_output') {
            console.log('🔊 Hume streaming audio chunk:', data.index)
            // Keep speaking status true while audio chunks are streaming
            
          } else if (data.type === 'user_message' || data.type === 'user_interruption') {
            console.log('👤 User speaking - stopping AI speech')
            setIsSpeaking(false)
          }
          
        } catch (error) {
          console.error('❌ Error parsing Hume message:', error)
        }
      }

      // Audio streaming will be started in onopen handler
      
    } catch (error) {
      console.error('❌ Error connecting to Hume:', error)
      setLastResponse('❌ Failed to connect to Hume: ' + error)
      setHumeStatus('error')
    }
  }

  const startAudioStreaming = (socket: WebSocket, stream: MediaStream) => {
    const audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    
    processor.onaudioprocess = (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        const inputBuffer = event.inputBuffer.getChannelData(0)
        
        // Convert Float32Array to 16-bit PCM for Hume
        const pcmData = new Int16Array(inputBuffer.length)
        for (let i = 0; i < inputBuffer.length; i++) {
          // Convert from -1.0 to 1.0 range to -32768 to 32767 range
          pcmData[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32767))
        }
        
        // Convert to bytes and then to base64
        const audioBytes = new Uint8Array(pcmData.buffer)
        const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(audioBytes)))
        
        // Send audio in Hume's expected format
        const audioData = {
          type: 'audio_input',
          data: base64Audio
        }
        
        socket.send(JSON.stringify(audioData))
        
        // Log audio activity
        if (Math.max(...Array.from(inputBuffer.map(Math.abs))) > 0.01) {
          console.log('🎙️ Audio detected, level:', Math.max(...Array.from(inputBuffer.map(Math.abs))))
        }
      }
    }
    
    source.connect(processor)
    processor.connect(audioContext.destination)
    
    console.log('🎙️ Audio streaming to Hume started with proper 16-bit PCM format')
  }

  const disconnect = () => {
    if (humeSocketRef.current) {
      humeSocketRef.current.close()
      humeSocketRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    setIsConnected(false)
    setHumeStatus('disconnected')
    setIsSpeaking(false)
    setMessages([])
    setLastResponse('')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Hume Debug</h1>
        <p className="text-muted-foreground">
          Debug Hume EVI integration with CLM endpoint monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hume Connection</CardTitle>
            <CardDescription>
              Direct connection to Hume EVI with CLM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={isLoaded ? "default" : "secondary"}>
                {isLoaded ? '✅ Auth Ready' : '⏳ Loading...'}
              </Badge>
              
              <Badge variant={userId ? "default" : "destructive"}>
                {userId ? `👤 ${userId.substring(0, 8)}...` : '❌ No User'}
              </Badge>
              
              <Badge variant={userProfile ? "default" : "secondary"}>
                {userProfile ? `📋 ${userProfile.name}` : '⏳ No Profile'}
              </Badge>

              <Badge variant={humeStatus === 'connected' ? "default" : humeStatus === 'error' ? "destructive" : "secondary"}>
                🎤 {humeStatus}
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

            {/* Connection Controls */}
            <div className="space-y-2">
              <Button 
                onClick={isConnected ? disconnect : connectToHume}
                className="w-full"
                variant={isConnected ? "destructive" : "default"}
                disabled={!userProfile}
                size="lg"
              >
                {isConnected ? '🛑 Disconnect' : '🎤 Connect to Hume'}
              </Button>
            </div>

            {/* Environment Check */}
            <div className="p-4 rounded-lg bg-gray-50 border">
              <div className="text-sm font-medium mb-2">🔧 Environment Check</div>
              <div className="space-y-1 text-xs">
                <div>API Key: {process.env.NEXT_PUBLIC_HUME_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>Config ID: {process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '❌ Missing'}</div>
                <div>CLM Endpoint: /api/hume-clm-sse/chat/completions</div>
              </div>
            </div>

            {/* Status */}
            {isConnected && (
              <div className="p-4 rounded-lg bg-green-50 border">
                <div className="text-sm font-medium mb-2">🎤 Hume Status</div>
                <div className="space-y-1 text-sm">
                  <div>Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
                  <div>Speaking: {isSpeaking ? '🔊 Yes' : '⚪ No'}</div>
                  <div>Messages: {messages.length}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CLM Debug */}
        <Card>
          <CardHeader>
            <CardTitle>CLM Activity</CardTitle>
            <CardDescription>
              Monitor calls to your CLM endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 p-4 rounded-lg bg-muted overflow-y-auto">
              <div className="text-sm font-medium mb-2">🔗 CLM Request Log</div>
              {clmRequests.length > 0 ? (
                <div className="space-y-2">
                  {clmRequests.slice(-10).map((req, idx) => (
                    <div key={idx} className="text-xs p-2 rounded bg-white border">
                      <div className="font-medium text-blue-600">{req.type}</div>
                      <div className="text-gray-600">{req.message}</div>
                      <div className="text-gray-400">{new Date(req.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  No CLM activity yet. Connect and speak to see requests.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Real-time conversation with debug info
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 p-4 rounded-lg bg-muted overflow-y-auto">
              <div className="text-sm font-medium mb-2">💬 Conversation</div>
              <div className="whitespace-pre-wrap text-sm">
                {lastResponse || 'Connect to Hume and start speaking...'}
              </div>
            </div>

            {/* Hume Messages */}
            {messages.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border">
                <div className="text-sm font-medium mb-2">📥 Hume Messages ({messages.length})</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {messages.slice(-5).map((msg, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium text-blue-600">{msg.type}:</span>
                      <span className="ml-2">{JSON.stringify(msg).substring(0, 80)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}