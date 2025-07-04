'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Settings, Users, Brain } from 'lucide-react'
import { useVoice, VoiceReadyState } from '@humeai/voice-react'
import { PlaybookWeightController } from '@/components/PlaybookWeightController'
import { CoachPresenceIndicator, ConversationStateIndicator } from '@/components/CoachPresenceIndicator'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Enhanced Quest
              </h1>
              <p className="mt-2 text-gray-600">
                Multi-agent AI coaching with personalized focus control
              </p>
              <div className="mt-1 text-xs text-gray-400 font-mono">
                🚀 Version: 5.0.0 - Multi-Agent Coaching System
                {!user && <span className="ml-2 text-orange-500">🔧 DEBUG MODE</span>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConversationStateIndicator 
                state={conversationState}
                primaryCoach={coaching.coaches.find(c => c.type === primaryCoach?.type)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversation Area */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Multi-Agent Conversation</span>
                  <div className="flex items-center space-x-4">
                    <CoachPresenceIndicator
                      coaches={coaching.coaches}
                      conversationState={conversationState}
                      layout="horizontal"
                      showDetails={false}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Configure your coaching focus and start your quest</p>
                      <p className="text-sm">AI coaches will adapt to your goals and communication style</p>
                      {totalWeight === 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-700 text-sm">
                            ⚠️ Please set your coaching focus in the settings panel to begin
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                            message.isUser
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white text-gray-900 shadow-sm border'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                            {message.coachName && !message.isUser && (
                              <Badge variant="outline" className="text-xs">
                                {message.coachName}
                              </Badge>
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
                    {getConversationControls()}
                  </div>
                  
                  {/* Coaching Status */}
                  {coaching.isActive && (
                    <div className="mt-4 text-center">
                      <CoachPresenceIndicator
                        coaches={coaching.coaches}
                        conversationState={conversationState}
                        layout="horizontal"
                        showDetails={true}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings & Info Panel */}
          <div className="space-y-6">
            {/* Coaching Focus Control */}
            <PlaybookWeightController
              currentWeights={weights}
              onWeightsChange={updateWeights}
              isActive={!coaching.isActive}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('career_focus')}
                    className="text-xs"
                  >
                    Career
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('productivity_focus')}
                    className="text-xs"
                  >
                    Productivity
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('leadership_focus')}
                    className="text-xs"
                  >
                    Leadership
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('technical_focus')}
                    className="text-xs"
                  >
                    Technical
                  </Button>
                </div>
                
                {recommendations.length > 0 && (
                  <div className="mt-3 text-xs text-gray-600">
                    💡 {recommendations[0]}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Coaches Detail */}
            {coaching.coaches.length > 0 && (
              <CoachPresenceIndicator
                coaches={coaching.coaches}
                conversationState={conversationState}
                layout="vertical"
                showDetails={true}
              />
            )}

            {/* Quest Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messages</span>
                    <span>{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Focus Weight</span>
                    <Badge variant={isBalanced ? "default" : "secondary"}>
                      {totalWeight}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Coaches</span>
                    <span>{coaching.coaches.filter(c => c.isActive).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Previous Quests</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationHistory.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {conversationHistory.map((session, index) => (
                      <div key={session.id} className="border-b pb-2 last:border-b-0">
                        <div className="text-sm font-medium text-gray-900">
                          {index === 0 ? 'Latest' : `${index + 1} sessions ago`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 truncate">
                          {session.title}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No previous sessions yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}