'use client'

/**
 * Quest Home Page - Conversation First
 * Default to voice conversation with simple circular interface
 * Toggle to dashboard view, colleague suggestions
 */

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageCircle, 
  BarChart3, 
  Users, 
  Plus,
  Building2,
  Mic,
  User,
  Briefcase
} from 'lucide-react'

// Voice circle component
function VoiceCircle({ 
  isListening, 
  isSpeaking, 
  isConnected,
  userName
}: {
  isListening: boolean
  isSpeaking: boolean
  isConnected: boolean
  userName: string
}) {
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main voice circle */}
      <div
        className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full transition-all duration-500 ${
          isConnected 
            ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 shadow-2xl shadow-blue-500/25' 
            : 'bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg'
        } ${
          isSpeaking 
            ? 'animate-pulse scale-110 shadow-2xl shadow-purple-500/40' 
            : isListening 
            ? 'animate-bounce scale-105' 
            : ''
        }`}
      >
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
        </div>
        
        {/* Pulse rings when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 animate-ping delay-100"></div>
            <div className="absolute inset-0 rounded-full bg-blue-300 opacity-10 animate-ping delay-200"></div>
          </>
        )}
        
        {/* Listening indicator */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-white opacity-60 animate-pulse"></div>
        )}
        
        {/* Connection status indicator */}
        <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-white ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
      </div>
      
      {/* Status text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {!isConnected ? `Hi ${userName}!` : 
           isSpeaking ? 'Speaking...' : 
           isListening ? 'Listening...' : 
           'Ready to chat'}
        </h2>
        <p className="text-lg text-gray-300">
          {!isConnected ? 'Ready for your career coaching session' : 
           'Your AI career coach is active'}
        </p>
      </div>
    </div>
  )
}

// Colleague suggestion component
function ColleagueSuggestions({ userName }: { userName: string }) {
  const [colleagues] = useState([
    {
      id: 1,
      name: 'Phil Agafangelo',
      title: 'Senior Developer',
      department: 'Engineering',
      avatar: 'PA'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      title: 'Product Manager', 
      department: 'Product',
      avatar: 'SC'
    },
    {
      id: 3,
      name: 'Marcus Rodriguez',
      title: 'UX Designer',
      department: 'Design',
      avatar: 'MR'
    }
  ])

  const [currentPrompt, setCurrentPrompt] = useState('')

  useEffect(() => {
    const prompts = [
      `Do you know ${colleagues[0].name} from the engineering team?`,
      `Have you connected with ${colleagues[1].name} in product?`,
      `${colleagues[2].name} in design might be good to know for your projects`
    ]
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)])
  }, [colleagues])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-2 mb-6">
        <Building2 className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">CKDelta Team</h3>
      </div>
      
      {/* Conversation prompt */}
      {currentPrompt && (
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-gray-300 text-center">
              <span className="text-blue-400">💬 Try asking:</span> "{currentPrompt}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Colleague cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {colleagues.map((colleague) => (
          <Card 
            key={colleague.id} 
            className="bg-gray-800/70 border-gray-700 hover:bg-gray-800/90 transition-all backdrop-blur-sm"
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {colleague.avatar}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{colleague.name}</p>
                  <p className="text-gray-400 text-xs">{colleague.title}</p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                onClick={() => {
                  console.log(`Ask about ${colleague.name}`)
                }}
              >
                <User className="w-3 h-3 mr-1" />
                Ask about {colleague.name.split(' ')[0]}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const [viewMode, setViewMode] = useState<'conversation' | 'dashboard'>('conversation')
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastResponse, setLastResponse] = useState('')
  
  // WebSocket refs for Hume connection
  const humeSocketRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const startConversation = async () => {
    try {
      setIsConnected(true)
      setIsListening(true)
      
      const HUME_API_KEY = process.env.NEXT_PUBLIC_HUME_API_KEY
      const HUME_CONFIG_ID = process.env.NEXT_PUBLIC_HUME_CONFIG_ID

      if (!HUME_API_KEY || !HUME_CONFIG_ID) {
        setLastResponse('❌ Missing Hume configuration')
        setIsConnected(false)
        return
      }

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
      
      console.log('🔄 Connecting to Hume WebSocket')
      const socket = new WebSocket(websocketUrl)
      humeSocketRef.current = socket

      socket.onopen = () => {
        console.log('🎤 Connected to Hume EVI')
        setLastResponse('🎤 Connected! Start speaking...')
        
        // Start audio streaming to Hume
        startAudioStreaming(socket, stream)
      }

      socket.onerror = (error) => {
        console.error('❌ Hume WebSocket error:', error)
        setLastResponse('❌ Connection error')
        setIsConnected(false)
      }

      socket.onclose = () => {
        console.log('🔌 Hume WebSocket closed')
        setIsConnected(false)
        setIsListening(false)
        setIsSpeaking(false)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📥 Hume message:', data)
          
          if (data.type === 'user_message') {
            const userText = data.message?.content || ''
            setLastResponse(`You: "${userText}"`)
            setIsListening(false)
            
          } else if (data.type === 'assistant_message') {
            const aiText = data.message?.content || ''
            setLastResponse(`Quest: ${aiText}`)
            setIsSpeaking(true)
            
            // Stop speaking indicator after a delay
            setTimeout(() => {
              setIsSpeaking(false)
              setIsListening(true)
            }, 2000)
          }
        } catch (error) {
          console.error('Error parsing Hume message:', error)
        }
      }
      
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setLastResponse('❌ Failed to start: ' + (error instanceof Error ? error.message : String(error)))
      setIsConnected(false)
    }
  }

  const stopConversation = () => {
    // Close WebSocket connection
    if (humeSocketRef.current) {
      humeSocketRef.current.close()
      humeSocketRef.current = null
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    setIsConnected(false)
    setIsListening(false)
    setIsSpeaking(false)
    setLastResponse('')
  }

  const startAudioStreaming = (socket: WebSocket, stream: MediaStream) => {
    try {
      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      
      processor.onaudioprocess = (event) => {
        if (socket.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0)
          
          // Convert Float32Array to base64 for Hume
          const audioArray = new Float32Array(inputBuffer)
          const audioBytes = new Uint8Array(audioArray.buffer)
          const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(audioBytes)))
          
          // Send audio in Hume's expected format
          const audioData = {
            type: 'audio_input',
            data: base64Audio
          }
          
          socket.send(JSON.stringify(audioData))
        }
      }
      
      source.connect(processor)
      processor.connect(audioContext.destination)
      
      console.log('🎤 Audio streaming started')
    } catch (error) {
      console.error('❌ Audio streaming error:', error)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-400">Loading Quest...</p>
        </div>
      </div>
    )
  }

  // If not signed in, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-8 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Welcome to Quest
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Your AI-powered career coach that knows your background and helps you grow through intelligent voice conversations
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
                Start Your Journey
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard view  
  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-between items-center p-6 bg-white shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
            <span className="text-xl font-bold text-gray-900">Quest Dashboard</span>
          </div>
          <Button
            onClick={() => setViewMode('conversation')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Voice Chat
          </Button>
        </div>
        
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'there'}!
            </h1>
            <p className="mt-2 text-gray-600">
              Build your career story, connect with professionals, and discover opportunities.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setViewMode('conversation')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-medium">
                  <div className="rounded-lg bg-blue-100 p-2 mr-3">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  Voice Coaching
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-3">
                  AI-powered career coaching with voice
                </p>
                <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Start Session
                </Button>
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
                  Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-3">
                  AI-powered company intelligence
                </p>
                <Link href="/admin/companies">
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Sessions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Voice Sessions</CardTitle>
                  <CardDescription>
                    Your latest career conversations and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No voice sessions yet</p>
                    <p className="text-sm">Start your first conversation to build your career profile</p>
                    <Button 
                      className="mt-4" 
                      size="sm"
                      onClick={() => setViewMode('conversation')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Start Voice Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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
                      <span className="text-sm text-gray-600">Companies</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Voice Sessions</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Debug Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Debug Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/quest-hume-debug">
                    <Button variant="outline" size="sm" className="w-full">
                      Voice Debug Interface
                    </Button>
                  </Link>
                  <Link href="/test-hume-integration">
                    <Button variant="outline" size="sm" className="w-full">
                      Test CLM Integration
                    </Button>
                  </Link>
                  <Link href="/admin/companies">
                    <Button variant="outline" size="sm" className="w-full">
                      Company Admin
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Main conversation view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold">Quest</span>
        </div>
        <Button
          onClick={() => setViewMode('dashboard')}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Main conversation interface */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center space-y-8">
          <VoiceCircle
            isListening={isListening}
            isSpeaking={isSpeaking}
            isConnected={isConnected}
            userName={user?.firstName || 'there'}
          />
          
          {/* Control buttons */}
          <div className="flex space-x-4">
            {!isConnected ? (
              <Button
                onClick={startConversation}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Conversation
              </Button>
            ) : (
              <div className="flex space-x-3">
                <Button
                  onClick={stopConversation}
                  size="lg"
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10 px-6 py-3"
                >
                  Stop
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Mute/unmute functionality
                    console.log('Toggle mute')
                  }}
                  size="lg"
                  variant="outline"
                  className="border-gray-500 text-gray-300 hover:bg-gray-500/10 px-6 py-3"
                >
                  Mute
                </Button>
              </div>
            )}
          </div>
          
          {/* Conversation display */}
          {lastResponse && (
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm max-w-md">
              <CardContent className="p-4">
                <p className="text-gray-300 text-sm text-center">
                  {lastResponse}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick access to debug interface for testing */}
          {isConnected && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                For advanced debugging and testing
              </p>
              <Link href="/quest-hume-debug">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-300"
                >
                  Open Debug Interface
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Colleague Suggestions */}
      <div className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <ColleagueSuggestions userName={user?.firstName || 'there'} />
        </div>
      </div>
    </div>
  )
}