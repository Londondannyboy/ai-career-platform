'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function CoachPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  // const audioContextRef = useRef<AudioContext | null>(null) // Future use
  const streamRef = useRef<MediaStream | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startConversation = async () => {
    try {
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition. Please use Chrome, Safari, or Edge.')
        return
      }

      // Request microphone permission
      console.log('Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      
      console.log('Microphone permission granted')
      streamRef.current = stream
      setIsConnected(true)
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: "Hi! I'm your AI career coach. I can hear you now! Tell me what you'd like to discuss about your career.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      
      // Speak welcome message if voice is enabled
      if (isVoiceEnabled) {
        await speakText(welcomeMessage.text)
      }
      
      // Start listening after welcome message
      setTimeout(() => {
        console.log('Starting to listen for speech...')
        startListening()
      }, 1000)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert(`Could not access microphone: ${error}. Please check permissions and try again.`)
    }
  }

  const endConversation = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    setIsConnected(false)
    setConversationState('idle')
    
    // Save conversation to repo
    saveConversationToRepo()
  }

  const startListening = () => {
    if (!streamRef.current) {
      console.log('No audio stream available')
      return
    }
    
    console.log('Setting conversation state to listening...')
    setConversationState('listening')
    
    // Use Web Speech API for real speech recognition
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        console.log('Creating speech recognition instance...')
        const recognition = new SpeechRecognition()
        
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          console.log('Speech recognition started - speak now!')
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          console.log('Speech recognition result:', event)
          const transcript = event.results[0][0].transcript
          console.log('Transcript:', transcript)
          if (event.results[0].isFinal) {
            handleUserInput(transcript)
          }
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error, event)
          setConversationState('idle')
          
          // Show user-friendly error message
          const errorMessage = {
            id: Date.now().toString(),
            text: `Speech recognition error: ${event.error}. Please try speaking again.`,
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          
          // Retry listening after a short delay
          setTimeout(() => {
            if (isConnected) {
              console.log('Retrying speech recognition...')
              startListening()
            }
          }, 2000)
        }
        
        recognition.onend = () => {
          console.log('Speech recognition ended')
          // If still connected and not processing, start listening again
          if (isConnected && conversationState === 'listening') {
            setTimeout(() => {
              console.log('Restarting speech recognition...')
              startListening()
            }, 500)
          }
        }
        
        console.log('Starting speech recognition...')
        recognition.start()
      } else {
        throw new Error('Speech recognition not supported')
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      // Show fallback message
      const fallbackMessage = {
        id: Date.now().toString(),
        text: "Speech recognition isn't working. You can type your response or try refreshing the page.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
      setConversationState('idle')
    }
  }

  const handleUserInput = (transcript: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      isUser: true,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setConversationState('thinking')
    
    // Process with AI
    setTimeout(() => {
      generateAIResponse(transcript)
    }, 1500)
  }

  const simulateUserInput = () => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: "I'm feeling stuck in my current role and not sure what direction to take my career.",
      isUser: true,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setConversationState('thinking')
    
    // Simulate AI processing
    setTimeout(() => {
      generateAIResponse(userMessage.text)
    }, 1500)
  }

  const generateAIResponse = async (userInput: string) => {
    try {
      setConversationState('speaking')
      
      // Get user profile for context
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      // Get recent repo sessions for context
      const { data: recentSessions } = await supabase
        .from('repo_sessions')
        .select('transcript, ai_analysis')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      // Call OpenAI API with context
      const response = await fetch('/api/coach-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          conversationHistory: messages,
          userProfile: profile,
          recentSessions: recentSessions || []
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }
      
      const result = await response.json()
      const aiResponse = result.response
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // Speak AI response if voice is enabled
      if (isVoiceEnabled) {
        await speakText(aiResponse)
      }
      
      // Start listening again
      setTimeout(() => {
        if (isConnected) {
          startListening()
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      // Fallback response
      const fallbackResponse = "I'm having trouble processing that right now. Could you try rephrasing your question?"
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      if (isVoiceEnabled) {
        await speakText(fallbackResponse)
      }
      
      setTimeout(() => {
        if (isConnected) {
          startListening()
        }
      }, 1000)
    }
  }

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isVoiceEnabled || isMuted) {
        resolve()
        return
      }
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onend = () => {
        resolve()
      }
      
      speechSynthesis.speak(utterance)
    })
  }

  const saveConversationToRepo = async () => {
    if (!user || messages.length === 0) return
    
    try {
      const conversation = messages.map(m => `${m.isUser ? 'You' : 'AI Coach'}: ${m.text}`).join('\n\n')
      
      await supabase.from('repo_sessions').insert({
        user_id: user.id,
        title: `Career Coaching Session ${new Date().toLocaleDateString()}`,
        transcript: conversation,
        ai_analysis: 'Real-time coaching conversation completed.',
        session_type: 'voice_coaching',
        privacy_level: 'private'
      })
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }

  const getStateIndicator = () => {
    switch (conversationState) {
      case 'listening':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )
      case 'thinking':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Thinking...</span>
          </div>
        )
      case 'speaking':
        return (
          <div className="flex items-center space-x-2 text-purple-600">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Speaking...</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Ready to start</span>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Career Coach</h1>
          <p className="mt-2 text-gray-600">
            Have a real-time conversation with your AI career coach. Just speak naturally!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Career Coaching Session</span>
                  {getStateIndicator()}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mic className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Click &ldquo;Start Conversation&rdquo; to begin your coaching session</p>
                      <p className="text-sm">Your AI coach will guide you through career discussions</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="border-t pt-4">
                  <div className="flex justify-center space-x-4">
                    {!isConnected ? (
                      <Button 
                        onClick={startConversation}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        Start Conversation
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => setIsMuted(!isMuted)}
                          variant={isMuted ? "destructive" : "outline"}
                          size="lg"
                        >
                          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        
                        <Button
                          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                          variant={!isVoiceEnabled ? "destructive" : "outline"}
                          size="lg"
                        >
                          {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                        
                        <Button 
                          onClick={endConversation}
                          variant="destructive"
                          size="lg"
                        >
                          <PhoneOff className="mr-2 h-5 w-5" />
                          End Session
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${
                      isConnected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-sm font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Voice Output</span>
                    <span className={`text-sm font-medium ${
                      isVoiceEnabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isVoiceEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Speak naturally and clearly</p>
                  <p>• Take your time to think</p>
                  <p>• Be specific about your challenges</p>
                  <p>• Ask follow-up questions</p>
                  <p>• Your conversation is private and saved to your repo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}