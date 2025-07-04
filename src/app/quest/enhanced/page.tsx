'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Brain, Zap, Target, Briefcase, MessageSquare, Home, Settings, User } from 'lucide-react'
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
  const [showTranscript, setShowTranscript] = useState(false)
  const [coachingMethodology, setCoachingMethodology] = useState('OKR')
  const [focusPercentages, setFocusPercentages] = useState({
    career: 70,
    productivity: 20,
    leadership: 10
  })
  const [speechIntensity, setSpeechIntensity] = useState(0)
  
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
        // Update speech intensity for animations
        const intensity = Math.random() * 0.8 + 0.2 // Simulate speech intensity
        setSpeechIntensity(intensity)
        setTimeout(() => setSpeechIntensity(0), 100)
      }
    }
  }, [voiceMessages])

  // Animate speech intensity
  useEffect(() => {
    if (conversationState === 'speaking') {
      const interval = setInterval(() => {
        setSpeechIntensity(Math.random() * 0.8 + 0.2)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setSpeechIntensity(0)
    }
  }, [conversationState])

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
      {/* Enhanced header with navigation */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">Quest Enhanced</span>
              </div>
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  showTranscript 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Transcript</span>
              </button>
              {user ? (
                <div className="flex items-center space-x-2">
                  <img 
                    src={user.imageUrl || '/default-avatar.png'} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
                </div>
              ) : (
                <Link href="/sign-in" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main conversation area - Voice-first design */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        
        {/* Enhanced voice visualization bars */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-end space-x-3">
            {Array.from({ length: 7 }).map((_, i) => {
              const isActive = i < Math.min(activeCoaches.length, 7)
              const baseHeight = isActive ? 32 : 16
              const animationHeight = conversationState === 'speaking' && isActive 
                ? baseHeight + (speechIntensity * 40 * Math.sin(Date.now() / (150 + i * 20) + i))
                : baseHeight
              
              return (
                <div
                  key={i}
                  className={`w-6 rounded-full transition-all duration-100 ease-out`}
                  style={{ 
                    height: `${Math.max(animationHeight, 8)}px`,
                    backgroundColor: isActive 
                      ? `hsl(${220 + i * 15}, 70%, ${50 + speechIntensity * 20}%)` 
                      : '#e5e7eb',
                    boxShadow: conversationState === 'speaking' && isActive 
                      ? `0 0 ${speechIntensity * 20}px hsla(${220 + i * 15}, 70%, 60%, 0.6)`
                      : 'none'
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Coaching methodology and focus controls */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Coaching Configuration</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Methodology:</span>
              <select 
                value={coachingMethodology} 
                onChange={(e) => setCoachingMethodology(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OKR">OKR</option>
                <option value="SMART">SMART</option>
                <option value="GROW">GROW</option>
                <option value="CLEAR">CLEAR</option>
                <option value="FAST">FAST</option>
              </select>
            </div>
          </div>
          
          {/* Focus percentage sliders */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Career Growth</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{focusPercentages.career}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={focusPercentages.career}
                onChange={(e) => setFocusPercentages(prev => ({ ...prev, career: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Productivity</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{focusPercentages.productivity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={focusPercentages.productivity}
                onChange={(e) => setFocusPercentages(prev => ({ ...prev, productivity: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Leadership</span>
                </div>
                <span className="text-sm font-semibold text-purple-600">{focusPercentages.leadership}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={focusPercentages.leadership}
                onChange={(e) => setFocusPercentages(prev => ({ ...prev, leadership: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
              />
            </div>
          </div>
        </div>

        {/* Optional transcript view */}
        {showTranscript && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conversation Transcript</h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Conversation transcript will appear here</p>
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
                      <p className="text-sm">{message.text}</p>
                      {message.coachName && !message.isUser && (
                        <p className="text-xs text-gray-500 mt-2">{message.coachName}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
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