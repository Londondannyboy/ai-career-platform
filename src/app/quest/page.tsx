'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'
import { useHumeEVI, HumeMessage } from '@/hooks/useHumeEVI'
import { useStreamingChat } from '@/hooks/useStreamingChat'

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'
type PlaybookType = 'career_coaching' | 'job_search' | 'cv_enhancement' | 'peer_feedback'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  emotionalMeasures?: Record<string, unknown>
  playbook?: PlaybookType
}

export default function QuestPage() {
  const { user, isLoaded } = useUser()
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [currentPlaybook, setCurrentPlaybook] = useState<PlaybookType>('career_coaching')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [, setLastSessionId] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<{id: string; title: string; transcript: string; ai_analysis: string; created_at: string}[]>([])
  
  const supabase = createClient()

  const ensureUserExists = useCallback(async () => {
    if (!user?.id) return

    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
        // Create user if doesn't exist
        console.log('📝 Creating new user in database:', user.id)
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            name: user.fullName || user.firstName || 'Quest User',
            email: user.emailAddresses?.[0]?.emailAddress || '',
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error('❌ Error creating user:', error)
        } else {
          console.log('✅ User created successfully')
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring user exists:', error)
    }
  }, [user, supabase])

  // Hume AI EVI integration
  const humeConfig = {
    onMessage: useCallback((humeMessage: HumeMessage) => {
      console.log('📨 Hume message received:', humeMessage.type)
      
      if (humeMessage.type === 'connection_status' && humeMessage.text) {
        // Hume AI connection status update
        const statusMessage: Message = {
          id: Date.now().toString(),
          text: humeMessage.text,
          isUser: false,
          timestamp: humeMessage.timestamp,
          playbook: currentPlaybook
        }
        setMessages(prev => [...prev, statusMessage])
        setConversationState('listening')
        
      } else if (humeMessage.type === 'user_message' && humeMessage.text) {
        // User spoke - Hume AI transcribed it
        const userMessage: Message = {
          id: Date.now().toString(),
          text: humeMessage.text,
          isUser: true,
          timestamp: humeMessage.timestamp,
          emotionalMeasures: humeMessage.emotionalMeasures
        }
        setMessages(prev => [...prev, userMessage])
        setConversationState('thinking')
        
        // Process with our quest logic
        setTimeout(() => {
          generateQuestResponse(humeMessage.text!)
        }, 1500)
        
      } else if (humeMessage.type === 'assistant_message' && humeMessage.text) {
        // AI response received (either from Hume or our fallback)
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: humeMessage.text,
          isUser: false,
          timestamp: humeMessage.timestamp,
          playbook: currentPlaybook
        }
        setMessages(prev => [...prev, aiMessage])
        setConversationState('speaking')
        
      } else if (humeMessage.type === 'user_interruption') {
        // User interrupted - switch back to listening
        console.log('🚨 User interruption detected')
        setConversationState('listening')
      }
    }, [currentPlaybook]), // eslint-disable-line react-hooks/exhaustive-deps
    
    onConnectionChange: useCallback((connected: boolean) => {
      console.log('🔗 Hume connection changed:', connected)
      if (connected) {
        setConversationState('listening')
        // For Hume AI, the welcome message will be sent automatically
        // No need to manually send as Hume handles voice generation
      } else {
        setConversationState('idle')
      }
    }, []),
    
    onError: useCallback((error: string) => {
      console.error('❌ Hume AI error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Connection error: ${error}. Please try reconnecting.`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }, [])
  }

  const hume = useHumeEVI(humeConfig)
  
  // Vercel AI SDK for enhanced streaming conversations
  const streamingChat = useStreamingChat()

  useEffect(() => {
    if (isLoaded && user?.id) {
      // Ensure user exists in our database before loading conversations
      ensureUserExists().then(() => {
        loadPreviousConversation(user.id)
      })
    }
  }, [isLoaded, user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle streaming chat messages from Vercel AI SDK
  useEffect(() => {
    if (streamingChat.messages.length > 0) {
      const latestStreamMessage = streamingChat.messages[streamingChat.messages.length - 1]
      
      // Check if this is a new message we haven't processed yet
      const messageExists = messages.some(msg => 
        msg.text === latestStreamMessage.content && 
        msg.isUser === (latestStreamMessage.role === 'user')
      )
      
      if (!messageExists && latestStreamMessage.content) {
        const newMessage: Message = {
          id: `stream-${Date.now()}`,
          text: latestStreamMessage.content,
          isUser: latestStreamMessage.role === 'user',
          timestamp: new Date(),
          playbook: currentPlaybook
        }
        
        // Only add if not already in messages to avoid duplicates
        setMessages(prev => {
          const exists = prev.some(msg => 
            msg.text === newMessage.text && 
            msg.isUser === newMessage.isUser
          )
          return exists ? prev : [...prev, newMessage]
        })
        
        // Update conversation state based on message type
        if (latestStreamMessage.role === 'assistant') {
          setConversationState('speaking')
          setTimeout(() => setConversationState('listening'), 2000)
        }
      }
    }
  }, [streamingChat.messages, messages, currentPlaybook])

  const loadPreviousConversation = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Loading previous conversations for user:', userId)
      console.log('👤 Current Clerk user info:', {
        id: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        fullName: user?.fullName
      })
      
      // Get the most recent quest session
      const { data: recentSession } = await supabase
        .from('repo_sessions')
        .select('id, title, transcript, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'quest_conversation')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (recentSession) {
        setLastSessionId(recentSession.id)
        console.log('Found previous quest session:', recentSession.title)
      }
      
      // Load conversation history for display  
      console.log('🔍 Loading quest history for user:', userId)
      const { data: allSessions, error } = await supabase
        .from('repo_sessions')
        .select('id, title, transcript, ai_analysis, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'quest_conversation')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) {
        console.error('❌ Database error loading quest history:', error)
      }
      
      if (allSessions && allSessions.length > 0) {
        setConversationHistory(allSessions)
        console.log('✅ Loaded', allSessions.length, 'previous quest sessions')
      } else {
        console.log('ℹ️ No previous quest sessions found for user', userId)
        setConversationHistory([])
      }
    } catch {
      console.log('No previous quest conversation found, starting fresh')
    }
  }, [user, supabase])

  const detectPlaybook = (userInput: string): PlaybookType => {
    const input = userInput.toLowerCase()
    
    // Job search keywords
    if (input.includes('job') || input.includes('hiring') || input.includes('application') || input.includes('interview')) {
      return 'job_search'
    }
    
    // CV/Resume keywords  
    if (input.includes('resume') || input.includes('cv') || input.includes('skills') || input.includes('experience')) {
      return 'cv_enhancement'
    }
    
    // Practice/feedback keywords
    if (input.includes('practice') || input.includes('feedback') || input.includes('mock') || input.includes('rehearse')) {
      return 'peer_feedback'
    }
    
    // Default to career coaching
    return 'career_coaching'
  }

  const generateQuestResponse = async (userInput: string) => {
    try {
      console.log('🤖 Generating enhanced response with streaming AI for:', userInput)
      
      // Detect which playbook to use
      const detectedPlaybook = detectPlaybook(userInput)
      setCurrentPlaybook(detectedPlaybook)
      
      // Use Vercel AI SDK for streaming response
      await streamingChat.sendMessage(userInput)
      
      // The streaming response will be handled by the useStreamingChat hook
      // and will automatically update the conversation
      setConversationState('speaking')
      
    } catch (error) {
      console.error('Error generating Quest response:', error)
      const fallbackResponse = "I'm having trouble processing that right now. Could you try rephrasing your question?"
      
      // Add fallback message to local state
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date(),
        playbook: currentPlaybook
      }
      setMessages(prev => [...prev, fallbackMessage])
      setConversationState('listening')
    }
  }

  // Legacy function - now using Vercel AI SDK for enhanced prompting
  // const getPlaybookPrompt = (playbook: PlaybookType, emotionalMeasures?: Record<string, unknown>): string => {
  //   const basePrompt = "You are Quest, an empathetic AI career coach. "
  //   const emotionalContext = emotionalMeasures ? ` The user's emotional state suggests they are ${getEmotionalState(emotionalMeasures)}.` : ""
  //   
  //   switch (playbook) {
  //     case 'job_search':
  //       return basePrompt + "Focus on job searching strategies, application tips, and interview preparation." + emotionalContext
  //       
  //     case 'cv_enhancement':
  //       return basePrompt + "Help optimize their CV/resume, highlight relevant skills, and improve their professional presentation." + emotionalContext
  //       
  //     case 'peer_feedback':
  //       return basePrompt + "Provide practice opportunities and constructive feedback on their career communication." + emotionalContext
  //       
  //     case 'career_coaching':
  //     default:
  //       return basePrompt + "Provide holistic career guidance, goal setting, and professional development advice." + emotionalContext
  //   }
  // }

  // Legacy function - emotional analysis now handled by Vercel AI SDK
  // const getEmotionalState = (measures: Record<string, unknown>): string => {
  //   // Analyze Hume's emotional measures to provide context
  //   // This is a simplified version - you'd want more sophisticated analysis
  //   if (!measures) return "neutral"
  //   
  //   // Add logic to interpret Hume's emotional measurements
  //   return "engaged and ready to learn"
  // }

  const startQuestConversation = async () => {
    try {
      await hume.connect()
    } catch (error) {
      console.error('Failed to start Quest conversation:', error)
      alert('Could not connect to Quest AI. Please check your connection and try again.')
    }
  }

  const endQuestConversation = () => {
    hume.disconnect()
    saveConversationToRepo()
  }

  const saveConversationToRepo = async () => {
    if (!user || messages.length === 0) {
      console.log('⚠️ Not saving conversation - no user or messages')
      return
    }
    
    try {
      const conversation = messages.map(m => `${m.isUser ? 'You' : 'Quest AI'}: ${m.text}`).join('\n\n')
      
      console.log('💾 Saving Quest conversation to repo')
      
      const { error } = await supabase.from('repo_sessions').insert({
        user_id: user.id,
        title: `Quest Session ${new Date().toLocaleDateString()}`,
        transcript: conversation,
        ai_analysis: `Quest conversation with ${currentPlaybook} playbook focus. Session completed successfully.`,
        session_type: 'quest_conversation',
        privacy_level: 'private'
      })
      
      if (error) {
        console.error('❌ Database error saving Quest conversation:', error)
      } else {
        console.log('✅ Quest conversation saved successfully')
        if (user?.id) {
          loadPreviousConversation(user.id)
        }
      }
    } catch (error) {
      console.error('💥 Error saving Quest conversation:', error)
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
            <span>Ready to start your quest</span>
          </div>
        )
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quest
          </h1>
          <p className="mt-2 text-gray-600">
            Your AI-powered journey to career success. Speak naturally about your goals!
          </p>
          <div className="mt-1 text-xs text-gray-400 font-mono">
            🚀 Version: 3.0.0 - Powered by Hume AI EVI + Smart Playbooks
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quest Conversation</span>
                  {getStateIndicator()}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Phone className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Click &ldquo;Start Quest&rdquo; to begin your journey</p>
                      <p className="text-sm">I will adapt to help with coaching, job search, CV improvement, or practice</p>
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
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white text-gray-900 shadow-sm border'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                            {message.playbook && (
                              <span className="text-xs bg-black bg-opacity-20 px-1 rounded">
                                {message.playbook.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="border-t pt-4">
                  <div className="flex justify-center space-x-4">
                    {!hume.isConnected ? (
                      <Button 
                        onClick={startQuestConversation}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={hume.isLoading}
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        {hume.isLoading ? 'Connecting...' : 'Start Quest'}
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
                          onClick={endQuestConversation}
                          variant="destructive"
                          size="lg"
                        >
                          <PhoneOff className="mr-2 h-5 w-5" />
                          End Quest
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quest Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quest Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${
                      hume.isConnected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {hume.isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-sm font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Focus</span>
                    <span className="text-sm font-medium capitalize">
                      {currentPlaybook.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Voice AI</span>
                    <span className="text-sm font-medium text-purple-600">
                      Hume EVI
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previous Quests</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationHistory.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {conversationHistory.map((session, index) => {
                      const date = new Date(session.created_at).toLocaleDateString()
                      return (
                        <div key={session.id} className="border-b pb-2 last:border-b-0">
                          <div className="text-sm font-medium text-gray-900">
                            {index === 0 ? 'Last quest' : `${index + 1} quests ago`}
                          </div>
                          <div className="text-xs text-gray-500">{date}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {session.title}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 mb-2">
                      No previous quests yet
                    </div>
                    <div className="text-xs text-gray-400">
                      Your quest history will appear here
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quest Playbooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>🎯 <strong>Career Coaching</strong> - Goal setting, development planning</p>
                  <p>💼 <strong>Job Search</strong> - Applications, interviews, networking</p>
                  <p>📄 <strong>CV Enhancement</strong> - Resume optimization, skills highlighting</p>
                  <p>🗣️ <strong>Peer Feedback</strong> - Practice sessions, mock interviews</p>
                  <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                    Quest automatically detects what you need help with and adapts the conversation accordingly.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}