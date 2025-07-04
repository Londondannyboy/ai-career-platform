'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Brain, Zap, Target, Briefcase } from 'lucide-react'
import { useVoice, VoiceReadyState } from '@humeai/voice-react'
import { usePlaybookWeights, useCoachingSession } from '@/hooks/usePlaybookWeights'
import { multiAgentCoachingEngine, CoachWeights, CoachAgent } from '@/lib/coaching/multiAgentEngine'

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  emotionalMeasures?: Record<string, unknown>
  coachType?: string
  coachName?: string
}

export default function EnhancedQuestPage() {
  const { user, isLoaded } = useUser()
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  
  const supabase = createClient()

  // Multi-agent coaching system
  const {
    weights,
    updateWeights,
    applyPreset,
    resetWeights,
    activeCoaches,
    primaryCoach,
    isBalanced,
    recommendations,
    totalWeight
  } = usePlaybookWeights({
    userId: user?.id || 'anonymous',
    defaultWeights: { career_coaching: 60, communication_coach: 25, productivity_coach: 15 },
    autoSave: true,
    onWeightsChange: (newWeights) => {
      if (coaching.isActive) {
        coaching.updateSessionWeights(newWeights)
      }
    }
  })

  const coaching = useCoachingSession(user?.id || 'anonymous')

  // 🎉 OFFICIAL HUME AI SDK
  const { connect, disconnect, readyState, messages: voiceMessages } = useVoice()
  
  const isConnected = readyState === VoiceReadyState.OPEN
  const isConnecting = readyState === VoiceReadyState.CONNECTING

  // Handle voice messages from official SDK
  useEffect(() => {
    if (voiceMessages && voiceMessages.length > 0) {
      const latestMessage = voiceMessages[voiceMessages.length - 1]
      console.log('📨 Hume AI message:', latestMessage)
      
      if (latestMessage.type === 'user_message' && latestMessage.message?.content) {
        handleUserMessage(latestMessage.message.content, latestMessage.models?.prosody?.scores)
      } else if (latestMessage.type === 'assistant_message' && latestMessage.message?.content) {
        handleAssistantMessage(latestMessage.message.content)
      }
    }
  }, [voiceMessages])

  const handleUserMessage = async (content: string, emotionalMeasures?: any) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: content,
      isUser: true,
      timestamp: new Date(),
      emotionalMeasures: emotionalMeasures as Record<string, unknown> || undefined
    }
    
    setMessages(prev => {
      const exists = prev.some(m => m.text === content && m.isUser === true)
      if (exists) return prev
      return [...prev, userMessage]
    })
    
    // Process with multi-agent coaching system
    if (coaching.isActive) {
      setConversationState('thinking')
      coaching.setConversationState('thinking')
      
      try {
        const responseStream = await coaching.processInput(content)
        if (responseStream) {
          setConversationState('speaking')
          coaching.setConversationState('speaking')
          
          let fullResponse = ''
          for await (const chunk of responseStream) {
            fullResponse += chunk
          }
          
          // Create AI message with coach info
          const primaryCoachInfo = coaching.coaches.find(c => c.isActive && c.weight === Math.max(...coaching.coaches.filter(c => c.isActive).map(c => c.weight)))
          
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: fullResponse,
            isUser: false,
            timestamp: new Date(),
            coachType: primaryCoachInfo?.type,
            coachName: primaryCoachInfo?.name
          }
          
          setMessages(prev => [...prev, aiMessage])
          setConversationState('listening')
          coaching.setConversationState('listening')
        }
      } catch (error) {
        console.error('Error processing with coaching engine:', error)
        setConversationState('idle')
        coaching.setConversationState('idle')
      }
    }
  }

  const handleAssistantMessage = (content: string) => {
    // Handle Hume AI direct responses (fallback)
    const aiMessage: Message = {
      id: Date.now().toString(),
      text: content,
      isUser: false,
      timestamp: new Date(),
      coachType: 'hume_ai',
      coachName: 'Hume AI'
    }
    
    setMessages(prev => {
      const exists = prev.some(m => m.text === content && m.isUser === false)
      if (exists) return prev
      return [...prev, aiMessage]
    })
    
    setConversationState('listening')
  }

  // Initialize user and load conversation history
  useEffect(() => {
    if (isLoaded) {
      if (user?.id) {
        ensureUserExists().then(() => {
          loadPreviousConversation(user.id)
        })
      } else {
        console.log('ℹ️ Running Quest in debug mode without authentication')
      }
    }
  }, [isLoaded, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const ensureUserExists = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
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
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring user exists:', error)
    }
  }, [user, supabase])

  const loadPreviousConversation = useCallback(async (userId: string) => {
    try {
      const { data: allSessions, error } = await supabase
        .from('repo_sessions')
        .select('id, title, transcript, ai_analysis, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'quest_conversation')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!error && allSessions) {
        setConversationHistory(allSessions)
      }
    } catch {
      console.log('No previous quest conversation found, starting fresh')
    }
  }, [supabase])

  const startQuestConversation = async () => {
    try {
      console.log('🔗 Starting Enhanced Quest with Multi-Agent Coaching...')
      
      // Start coaching session
      const context = {
        userId: user?.id || 'anonymous',
        userProfile: user,
        conversationHistory: [],
        currentGoals: ['career_development'],
        relationshipType: 'self_coaching' as const,
        urgencyLevel: 'medium' as const
      }
      
      await coaching.startSession(context, weights)
      
      // Connect to Hume AI
      await connect()
      
      setConversationState('listening')
    } catch (error) {
      console.error('Failed to start Quest conversation:', error)
      alert('Could not connect to Quest AI. Please check your connection and try again.')
    }
  }

  const endQuestConversation = async () => {
    console.log('🔌 Ending Enhanced Quest...')
    
    // End coaching session
    await coaching.endSession()
    
    // Disconnect from Hume AI
    disconnect()
    
    // Save conversation
    await saveConversationToRepo()
    
    setConversationState('idle')
  }

  const saveConversationToRepo = async () => {
    if (!user || messages.length === 0) return
    
    try {
      const conversation = messages.map(m => {
        const speaker = m.isUser ? 'You' : (m.coachName || 'Quest AI')
        return `${speaker}: ${m.text}`
      }).join('\n\n')
      
      const { error } = await supabase.from('repo_sessions').insert({
        user_id: user.id,
        title: `Enhanced Quest Session ${new Date().toLocaleDateString()}`,
        transcript: conversation,
        ai_analysis: `Multi-agent coaching session with focus: ${activeCoaches.map(c => c.type).join(', ')}`,
        session_type: 'quest_conversation',
        privacy_level: 'private'
      })
      
      if (!error && user?.id) {
        loadPreviousConversation(user.id)
      }
    } catch (error) {
      console.error('💥 Error saving Quest conversation:', error)
    }
  }

  const getConversationControls = () => {
    if (!isConnected) {
      return (
        <Button 
          onClick={startQuestConversation}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          disabled={isConnecting || totalWeight === 0}
        >
          <Phone className="mr-2 h-5 w-5" />
          {isConnecting ? 'Connecting...' : 'Start Enhanced Quest'}
        </Button>
      )
    }

    return (
      <div className="flex items-center space-x-4">
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">Quest</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user?.imageUrl && (
                <img 
                  src={user.imageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main conversation area - Jack & Jill style */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        
        {/* Coach presence indicators - like sound bars */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const isActive = i < Math.min(activeCoaches.length, 5)
              const height = isActive ? 'h-16' : 'h-8'
              const opacity = conversationState === 'thinking' || conversationState === 'speaking' ? 'animate-pulse' : ''
              return (
                <div
                  key={i}
                  className={`w-8 ${height} bg-gray-800 rounded-full transition-all duration-300 ${opacity}`}
                  style={{ 
                    backgroundColor: isActive ? '#1f2937' : '#d1d5db',
                    transform: conversationState === 'speaking' && isActive ? `scaleY(${1 + Math.sin(Date.now() / 200 + i) * 0.3})` : 'scaleY(1)'
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="mb-8 min-h-[300px] space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">Ready to start your coaching session?</p>
              <p className="text-sm">Choose your focus below and begin</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.coachName && !message.isUser && (
                    <p className="text-xs text-gray-500 mt-2">{message.coachName}</p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick focus buttons */}
        {!isConnected && (
          <div className="mb-6">
            <p className="text-center text-sm text-gray-600 mb-4">Choose your coaching focus:</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  console.log('Career focus clicked')
                  applyPreset('career_focus')
                }}
                className="bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-full text-sm font-medium text-blue-800 transition-colors"
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Career Growth
              </button>
              <button
                onClick={() => {
                  console.log('Productivity focus clicked')
                  applyPreset('productivity_focus')
                }}
                className="bg-green-100 hover:bg-green-200 px-4 py-2 rounded-full text-sm font-medium text-green-800 transition-colors"
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Productivity
              </button>
              <button
                onClick={() => {
                  console.log('Leadership focus clicked')
                  applyPreset('leadership_focus')
                }}
                className="bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-full text-sm font-medium text-purple-800 transition-colors"
              >
                <Target className="w-4 h-4 inline mr-2" />
                Leadership
              </button>
            </div>
          </div>
        )}

        {/* Voice controls */}
        <div className="flex justify-center space-x-4 mb-4">
          {getConversationControls()}
        </div>
        
        {/* Simple status */}
        {isConnected && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {conversationState === 'listening' && 'Listening...'}
              {conversationState === 'thinking' && 'Processing...'}
              {conversationState === 'speaking' && 'Responding...'}
            </p>
            {primaryCoach && (
              <p className="text-xs text-gray-500 mt-1">
                Active coach: {primaryCoach.type.replace('_', ' ')}
              </p>
            )}
          </div>
        )}
        
        {/* Troubleshooting */}
        {isConnected && (
          <div className="mt-8 text-center">
            <button className="text-blue-600 text-sm underline">
              Having trouble speaking with Quest?
            </button>
            <p className="text-xs text-gray-500 mt-2">
              You can log off and rejoin your call at any time - your conversation will be saved.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}