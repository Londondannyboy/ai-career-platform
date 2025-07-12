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
import { useVoice, VoiceReadyState } from '@humeai/voice-react'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import dynamicImport from 'next/dynamic'
import { repoUpdateAgent } from '@/lib/ai/repoUpdateAgent'

// Dynamically import the realtime updates component to avoid SSR issues
const RealtimeProfileUpdates = dynamicImport(() => import('@/components/conversation/RealtimeProfileUpdates'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-800 rounded animate-pulse" />
})

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'
type PlaybookType = 'career_coaching' | 'job_search' | 'cv_enhancement' | 'peer_feedback' | 'synthetic_intelligence'

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
  const [showLiveUpdates, setShowLiveUpdates] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversationHistory, setConversationHistory] = useState<{id: string; title: string; transcript: string; ai_analysis: string; created_at: string}[]>([])
  
  const supabase = createClient()

  // 🎉 OFFICIAL HUME AI SDK - This is what works!
  const { connect, disconnect, readyState, messages: voiceMessages } = useVoice()
  
  const isConnected = readyState === VoiceReadyState.OPEN
  const isConnecting = readyState === VoiceReadyState.CONNECTING
  
  // Vercel AI SDK for enhanced streaming conversations
  const streamingChat = useStreamingChat()

  // Handle voice messages from official SDK
  useEffect(() => {
    if (voiceMessages && voiceMessages.length > 0) {
      const latestMessage = voiceMessages[voiceMessages.length - 1]
      console.log('📨 Hume AI message:', latestMessage)
      
      if (latestMessage.type === 'user_message' && latestMessage.message?.content) {
        // User spoke - Hume AI transcribed it
        const content = latestMessage.message.content
        const userMessage: Message = {
          id: Date.now().toString(),
          text: content,
          isUser: true,
          timestamp: new Date(),
          emotionalMeasures: (latestMessage.models?.prosody?.scores as unknown) as Record<string, unknown> || undefined
        }
        
        setMessages(prev => {
          const exists = prev.some(m => m.text === content && m.isUser === true)
          if (exists) return prev
          return [...prev, userMessage]
        })
        
        setConversationState('thinking')
        
        // Detect playbook and process with streaming AI
        const detectedPlaybook = detectPlaybook(content)
        setCurrentPlaybook(detectedPlaybook)
        
        // Use Vercel AI SDK for response
        setTimeout(() => {
          generateQuestResponse(content)
        }, 1000)
        
      } else if (latestMessage.type === 'assistant_message' && latestMessage.message?.content) {
        // AI response received
        const content = latestMessage.message.content
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: content,
          isUser: false,
          timestamp: new Date(),
          playbook: currentPlaybook
        }
        
        setMessages(prev => {
          const exists = prev.some(m => m.text === content && m.isUser === false)
          if (exists) return prev
          return [...prev, aiMessage]
        })
        
        setConversationState('speaking')
        setTimeout(() => setConversationState('listening'), 3000)
      }
    }
  }, [voiceMessages, currentPlaybook])

  const ensureUserExists = useCallback(async () => {
    if (!user?.id) {
      console.log('ℹ️ No user authenticated - running in debug mode')
      return
    }

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

  useEffect(() => {
    if (isLoaded) {
      if (user?.id) {
        // Ensure user exists in our database before loading conversations
        ensureUserExists().then(() => {
          loadPreviousConversation(user.id)
        })
      } else {
        console.log('ℹ️ Running Quest in debug mode without authentication')
      }
    }
  }, [isLoaded, user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadPreviousConversation = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Loading previous conversations for user:', userId)
      
      // Load conversation history for display  
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
    
    // Synthetic intelligence keywords
    if (input.includes('create synthetic') || input.includes('synthetic view') || 
        input.includes('company intelligence') || input.includes('organizational structure') ||
        input.includes('competitor analysis') || input.includes('map company') ||
        input.includes('ck delta') || input.includes('company org chart')) {
      return 'synthetic_intelligence'
    }
    
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
      
      // Use Vercel AI SDK for streaming response
      await streamingChat.sendMessage(userInput)
      
      // Trigger profile analysis if user is authenticated
      if (user?.id && showLiveUpdates) {
        await analyzeConversationForProfileUpdates(userInput)
      }
      
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

  const analyzeConversationForProfileUpdates = async (userInput: string) => {
    if (!user?.id) return

    try {
      // Broadcast analysis start
      await fetch('/api/conversation/broadcast-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'start' })
      })

      // Get current repos for context
      const repoResponse = await fetch(`/api/deep-repo?userId=${user.id}`)
      const repoData = repoResponse.ok ? await repoResponse.json() : {}

      // Analyze conversation with recent messages
      const conversationContext = {
        userId: user.id,
        messages: [
          ...messages.slice(-3).map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: userInput }
        ],
        currentRepos: repoData.profile || {}
      }

      const analysis = await repoUpdateAgent.analyzeConversation(conversationContext)

      if (analysis?.shouldUpdate && analysis.updates) {
        // Broadcast detected updates
        await broadcastDetectedUpdates(user.id, analysis)
      }

      // Broadcast analysis complete
      await fetch('/api/conversation/broadcast-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'complete' })
      })

    } catch (error) {
      console.error('Error analyzing conversation for profile updates:', error)
    }
  }

  const broadcastDetectedUpdates = async (userId: string, analysis: any) => {
    // Extract individual updates and broadcast them
    const { updates, reason, layer } = analysis

    // Skills updates
    if (updates.skills && updates.skills.length > 0) {
      for (const skill of updates.skills) {
        await fetch('/api/conversation/broadcast-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            updateType: 'skill',
            updateData: skill,
            confidence: 0.85, // Could make this dynamic based on context
            reason: `Detected skill: ${skill.name} during conversation`
          })
        })
      }
    }

    // Experience updates
    if (updates.experiences && updates.experiences.length > 0) {
      for (const experience of updates.experiences) {
        await fetch('/api/conversation/broadcast-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            updateType: 'experience',
            updateData: experience,
            confidence: 0.8,
            reason: `Detected experience: ${experience.title} at ${experience.company}`
          })
        })
      }
    }

    // Goals updates
    if (updates.goals && updates.goals.length > 0) {
      for (const goal of updates.goals) {
        await fetch('/api/conversation/broadcast-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            updateType: 'goal',
            updateData: goal,
            confidence: 0.9,
            reason: `Detected goal: ${goal.description}`
          })
        })
      }
    }

    // Achievements updates
    if (updates.achievements && updates.achievements.length > 0) {
      for (const achievement of updates.achievements) {
        await fetch('/api/conversation/broadcast-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            updateType: 'achievement',
            updateData: achievement,
            confidence: 0.85,
            reason: `Detected achievement: ${achievement.title}`
          })
        })
      }
    }
  }

  // 🎉 OFFICIAL SDK CONNECTION FUNCTIONS
  const startQuestConversation = async () => {
    try {
      console.log('🔗 Starting Quest with official Hume AI SDK...')
      await connect()
    } catch (error) {
      console.error('Failed to start Quest conversation:', error)
      alert('Could not connect to Quest AI. Please check your connection and try again.')
    }
  }

  const endQuestConversation = () => {
    console.log('🔌 Ending Quest with official SDK...')
    disconnect()
    saveConversationToRepo()
  }

  const saveConversationToRepo = async () => {
    if (!user || messages.length === 0) {
      console.log('ℹ️ Not saving conversation - running in debug mode or no messages')
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
    if (isConnecting) {
      return (
        <div className="flex items-center space-x-2 text-yellow-600">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span>Connecting...</span>
        </div>
      )
    }
    
    if (isConnected) {
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
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connected & Ready</span>
            </div>
          )
      }
    }
    
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <span>Ready to start your quest</span>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // TEMPORARY: Remove authentication requirement for debugging
  // if (!user) return null

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
            🚀 Version: 4.0.0 - Official Hume AI SDK Integration (WORKING!)
            {!user && <span className="ml-2 text-orange-500">🔧 DEBUG MODE (No Auth Required)</span>}
          </div>
        </div>

        <div className={`grid gap-6 ${showLiveUpdates ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Conversation Area */}
          <div className={showLiveUpdates ? 'xl:col-span-2' : 'lg:col-span-2'}>
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
                    {!isConnected ? (
                      <Button 
                        onClick={startQuestConversation}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isConnecting}
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        {isConnecting ? 'Connecting...' : 'Start Quest'}
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

          {/* Live Profile Updates */}
          {showLiveUpdates && user?.id && (
            <div className="xl:col-span-1">
              <RealtimeProfileUpdates 
                userId={user.id}
                isVisible={showLiveUpdates}
                onToggleVisibility={() => setShowLiveUpdates(!showLiveUpdates)}
                className="h-[600px] overflow-y-auto"
              />
            </div>
          )}

          {/* Quest Info */}
          <div className={`space-y-6 ${showLiveUpdates ? 'xl:col-span-1' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle>Quest Status</CardTitle>
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
                    <span className="text-sm text-gray-600">Current Focus</span>
                    <span className="text-sm font-medium capitalize">
                      {currentPlaybook.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Voice AI</span>
                    <span className="text-sm font-medium text-green-600">
                      Official Hume SDK
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

        {/* Floating Live Updates Toggle (when hidden) */}
        {!showLiveUpdates && user?.id && (
          <RealtimeProfileUpdates 
            userId={user.id}
            isVisible={showLiveUpdates}
            onToggleVisibility={() => setShowLiveUpdates(!showLiveUpdates)}
          />
        )}
      </main>
    </div>
  )
}