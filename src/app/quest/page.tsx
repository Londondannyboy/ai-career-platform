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

// Dynamically import components to avoid SSR issues
const SkillConfirmation = dynamicImport(() => import('@/components/conversation/SkillConfirmation'), { 
  ssr: false,
  loading: () => <div className="h-12 bg-blue-50 rounded animate-pulse" />
})

const Neo4jSkillGraph = dynamicImport(() => import('@/components/conversation/Neo4jSkillGraph'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />
})

const PostgreSQLSkillGraph = dynamicImport(() => import('@/components/conversation/PostgreSQLSkillGraph'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />
})

const AgentHandover = dynamicImport(() => import('@/components/conversation/AgentHandover'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 rounded animate-pulse" />
})

const AgentSidebar = dynamicImport(() => import('@/components/conversation/AgentSidebar'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />
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
  const [showLiveUpdates, setShowLiveUpdates] = useState(true)
  const [pendingSkills, setPendingSkills] = useState<Array<{id: string, name: string, category: string}>>([])
  const [userSkills, setUserSkills] = useState<any[]>([])
  
  // Agent orchestration state
  const [currentAgent, setCurrentAgent] = useState('quest')
  const [handoverSuggestion, setHandoverSuggestion] = useState<any>(null)
  const [availableAgents, setAvailableAgents] = useState<any[]>([])
  const [agentTodos, setAgentTodos] = useState<any[]>([])
  const [graphRefreshKey, setGraphRefreshKey] = useState(0)
  const [useNeo4jFallback, setUseNeo4jFallback] = useState(false)
  
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
        
        // AI-powered skill detection in user messages
        console.log('🔍 Detecting skills in message:', content)
        detectSkillsInMessage(content)
        
        // Analyze for potential agent handover
        console.log('🤖 Analyzing for agent handover:', content)
        analyzeForHandover(content)
        
        // Use Vercel AI SDK for response or specialized agent
        setTimeout(async () => {
          // Check if we should use specialized agent
          const agentResponse = await sendAgentMessage(content)
          if (agentResponse) {
            // Agent handled the message
            const agentMessage: Message = {
              id: Date.now().toString(),
              text: agentResponse,
              isUser: false,
              timestamp: new Date(),
              playbook: currentPlaybook
            }
            setMessages(prev => [...prev, agentMessage])
            setConversationState('listening')
          } else {
            // Use Quest's standard response
            generateQuestResponse(content)
          }
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
          loadUserSkills()
          loadAvailableAgents()
        })
      } else {
        console.log('ℹ️ Running Quest in debug mode without authentication')
        // Load skills even in debug mode
        loadUserSkills()
        loadAvailableAgents()
      }
    }
  }, [isLoaded, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserSkills = async () => {
    const effectiveUserId = user?.id || 'debug-user-001'
    
    try {
      console.log('📚 Loading skills for user:', effectiveUserId)
      const response = await fetch(`/api/skills?userId=${effectiveUserId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📚 Skills loaded:', data.skills)
        setUserSkills(data.skills || [])
      } else {
        console.error('❌ Failed to load skills:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error loading user skills:', error)
    }
  }

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch('/api/agents/orchestrate?action=agents')
      if (response.ok) {
        const data = await response.json()
        setAvailableAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error loading available agents:', error)
    }
  }

  const analyzeForHandover = async (message: string) => {
    if (!user?.id) return

    console.log('🤖 Starting handover analysis for:', message)

    // Simple keyword-based triggers (more reliable)
    const simpleHandoverCheck = checkSimpleHandoverTriggers(message)
    if (simpleHandoverCheck) {
      console.log('🤖 Simple trigger detected:', simpleHandoverCheck)
      setHandoverSuggestion({
        shouldHandover: true,
        targetAgent: simpleHandoverCheck.agentId,
        confidence: simpleHandoverCheck.confidence,
        reason: `Detected ${simpleHandoverCheck.agentId} keywords: ${simpleHandoverCheck.keywords.join(', ')}`,
        suggestedMessage: `I noticed you mentioned ${simpleHandoverCheck.keywords[0]}. Would you like me to connect you with our ${simpleHandoverCheck.agentName}?`,
        urgency: 'medium'
      })
      return
    }

    // Fallback to AI analysis
    try {
      console.log('🤖 Calling AI handover analysis...')
      
      const messageHistory = messages.slice(-3).map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text,
        timestamp: m.timestamp.toISOString()
      }))

      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_handover',
          userId: user.id,
          message,
          currentAgent,
          messageHistory
        })
      })

      console.log('🤖 Handover analysis response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('🤖 Handover analysis result:', data)
        
        if (data.shouldHandover) {
          setHandoverSuggestion(data)
        }
      } else {
        console.error('Handover analysis failed:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error analyzing for handover:', error)
    }
  }

  const checkSimpleHandoverTriggers = (message: string): {
    agentId: string
    agentName: string
    confidence: number
    keywords: string[]
  } | null => {
    const messageLower = message.toLowerCase()
    
    const triggers = [
      {
        agentId: 'productivity',
        agentName: 'Productivity Assistant',
        keywords: ['todo', 'task', 'organize', 'list', 'deadline', 'priority', 'productivity', 'checklist']
      },
      {
        agentId: 'goal',
        agentName: 'Goal Setting Agent',
        keywords: ['goal', 'objective', 'target', 'okr', 'plan', 'aim', 'vision', 'aspiration']
      },
      {
        agentId: 'calendar',
        agentName: 'Calendar Agent',
        keywords: ['meeting', 'schedule', 'calendar', 'appointment', 'time', 'book']
      }
    ]

    for (const trigger of triggers) {
      const matchedKeywords = trigger.keywords.filter(keyword => 
        messageLower.includes(keyword)
      )
      
      if (matchedKeywords.length > 0) {
        return {
          agentId: trigger.agentId,
          agentName: trigger.agentName,
          confidence: Math.min(0.9, matchedKeywords.length * 0.4),
          keywords: matchedKeywords
        }
      }
    }
    
    return null
  }

  const handleAcceptHandover = async (targetAgent: string) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_handover',
          userId: user.id,
          targetAgent,
          message: handoverSuggestion?.reason || 'User requested handover',
          context: {
            currentAgent,
            messageHistory: messages.slice(-5)
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCurrentAgent(targetAgent)
          setHandoverSuggestion(null)
          
          // Add handover message to conversation
          const handoverMessage: Message = {
            id: Date.now().toString(),
            text: data.agentResponse,
            isUser: false,
            timestamp: new Date(),
            playbook: currentPlaybook
          }
          setMessages(prev => [...prev, handoverMessage])
          
          // Store any todos from productivity agent
          if (data.todos) {
            setAgentTodos(data.todos)
          }
        }
      }
    } catch (error) {
      console.error('Error executing handover:', error)
    }
  }

  const handleRejectHandover = () => {
    setHandoverSuggestion(null)
  }

  const handleManualHandover = async (targetAgent: string) => {
    await handleAcceptHandover(targetAgent)
  }

  const sendAgentMessage = async (message: string) => {
    if (!user?.id || currentAgent === 'quest') return null

    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'agent_response',
          userId: user.id,
          message,
          currentAgent
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Handle handback to Quest
        if (data.handedBack) {
          setCurrentAgent('quest')
          if (data.todos) {
            setAgentTodos([])
          }
        }
        
        // Update todos if provided
        if (data.todos) {
          setAgentTodos(prev => [...prev, ...data.todos])
        }
        
        return data.response
      }
    } catch (error) {
      console.error('Error sending agent message:', error)
    }
    
    return null
  }

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

  const detectSkillsInMessage = async (message: string) => {
    if (!user?.id) return

    console.log('🔍 Starting skill detection for:', message)

    // ALWAYS try fallback detection first (more reliable)
    fallbackSkillDetection(message)

    // Use AI to intelligently detect skills from natural conversation
    try {
      console.log('🤖 Calling AI skill detection API...')
      const response = await fetch('/api/skills/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: user.id,
          existingSkills: userSkills.map(s => typeof s === 'string' ? s : s.name),
          pendingSkills: pendingSkills.map(p => p.name)
        })
      })

      console.log('🔍 AI detection response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 AI detected skills:', data)
        
        if (data.skills && data.skills.length > 0) {
          // Add detected skills to pending confirmation
          setPendingSkills(prev => [
            ...prev,
            ...data.skills.map((skill: any) => ({
              id: `skill-${Date.now()}-${Math.random()}`,
              name: skill.name,
              category: skill.category,
              confidence: skill.confidence
            }))
          ])
        }
      } else {
        console.error('AI skill detection failed:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error detecting skills with AI:', error)
    }
  }

  const fallbackSkillDetection = (message: string) => {
    console.log('🔍 Fallback skill detection for:', message)
    
    // Enhanced patterns including "I'm skilled in" type phrases
    const skillIndicators = [
      // Explicit skill mentions
      /\b(?:I'm skilled in|I know|I'm good at|I have experience with|I work with|I use|I'm experienced in)\s+(\w+(?:\s+\w+)?)/gi,
      
      // Technical skills - broader detection
      /\b(development|programming|coding|software|web|frontend|backend|fullstack|devops)\b/gi,
      /\b(JavaScript|React|Node|Python|Java|TypeScript|SQL|HTML|CSS|PHP|Ruby|Go|Rust)\b/gi,
      /\b(AWS|Azure|GCP|cloud|Docker|Kubernetes|Git|database|API|framework)\b/gi,
      
      // Business/Marketing skills
      /\b(marketing|sales|business|strategy|growth|analytics|SEO|social media|advertising)\b/gi,
      /\b(leadership|management|team|project|communication|presentation|negotiation)\b/gi,
      
      // Design skills
      /\b(design|UI|UX|graphics|visual|creative|Figma|Photoshop|brand)\b/gi,
      
      // Data skills
      /\b(data|analytics|science|machine learning|AI|statistics|analysis|visualization)\b/gi
    ]

    const detectedSkills: Array<{name: string, category: string}> = []

    skillIndicators.forEach((pattern, index) => {
      const matches = message.match(pattern)
      if (matches) {
        console.log(`🔍 Pattern ${index} matches:`, matches)
        
        matches.forEach(match => {
          let skillName = match
          
          // For "I'm skilled in X" patterns, extract just the skill name
          if (index === 0) {
            const skillMatch = match.match(/(?:I'm skilled in|I know|I'm good at|I have experience with|I work with|I use|I'm experienced in)\s+(.+)/i)
            if (skillMatch && skillMatch[1]) {
              skillName = skillMatch[1].trim()
            }
          }
          
          skillName = normalizeSkillName(skillName)
          
          // Check if user already has this skill
          const hasSkill = userSkills.some(skill => {
            const existingName = typeof skill === 'string' ? skill : skill.name
            return existingName.toLowerCase() === skillName.toLowerCase()
          })

          // Check if already pending confirmation
          const isPending = pendingSkills.some(pending => 
            pending.name.toLowerCase() === skillName.toLowerCase()
          )

          if (!hasSkill && !isPending && skillName.length > 2) {
            let category = 'technical'
            if (index === 4) category = 'marketing'
            else if (index === 5) category = 'leadership'
            else if (index === 6) category = 'design'
            else if (index === 7) category = 'data'
            
            console.log('🔍 Adding detected skill:', skillName, 'category:', category)
            
            detectedSkills.push({
              name: skillName,
              category
            })
          }
        })
      }
    })

    // Add to pending skills for confirmation
    if (detectedSkills.length > 0) {
      console.log('🔍 Adding skills to pending:', detectedSkills)
      setPendingSkills(prev => [
        ...prev,
        ...detectedSkills.map(skill => ({
          id: `skill-${Date.now()}-${Math.random()}`,
          name: skill.name,
          category: skill.category
        }))
      ])
    } else {
      console.log('🔍 No skills detected in message')
    }
  }

  const normalizeSkillName = (skill: string): string => {
    const skillMap: Record<string, string> = {
      'development': 'Software Development',
      'programming': 'Programming',
      'coding': 'Programming',
      'web': 'Web Development',
      'frontend': 'Frontend Development',
      'backend': 'Backend Development',
      'fullstack': 'Full-Stack Development',
      'devops': 'DevOps',
      'cloud': 'Cloud Computing',
      'database': 'Database Management',
      'api': 'API Development',
      'framework': 'Framework Development'
    }
    
    const normalized = skill.toLowerCase().trim()
    return skillMap[normalized] || skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()
  }

  const generateQuestResponse = async (userInput: string) => {
    try {
      console.log('🤖 Generating enhanced response with streaming AI for:', userInput)
      
      // Use Vercel AI SDK for streaming response
      await streamingChat.sendMessage(userInput)
      
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

  const handleConfirmSkill = async (skillId: string) => {
    const skill = pendingSkills.find(s => s.id === skillId)
    if (!skill) {
      console.error('❌ Skill not found in pending skills:', skillId)
      return
    }

    // Use real user ID or debug user (now that debug user exists in database)
    const effectiveUserId = user?.id || 'debug-user-001'
    console.log('🎯 Adding skill:', skill.name, 'for user:', effectiveUserId)

    if (!user?.id) {
      console.warn('⚠️ Running in debug mode - using fallback user ID:', effectiveUserId)
      console.log('💡 Note: Debug user now exists in database and should work')
    }

    try {
      // Add skill to PostgreSQL database
      console.log('📊 Adding to PostgreSQL...')
      const pgResponse = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          skill: {
            name: skill.name,
            category: skill.category,
            proficiency: 'intermediate'
          }
        })
      })

      if (!pgResponse.ok) {
        console.error('❌ PostgreSQL save failed:', pgResponse.status, await pgResponse.text())
      } else {
        console.log('✅ PostgreSQL save successful')
      }

      // Add skill to Neo4j graph with AI relationship discovery
      console.log('🕸️ Adding to Neo4j graph...')
      const neo4jResponse = await fetch('/api/skills/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          skill: {
            name: skill.name,
            category: skill.category,
            proficiency: 'intermediate'
          },
          action: 'add'
        })
      })

      if (!neo4jResponse.ok) {
        console.error('❌ Neo4j save failed:', neo4jResponse.status, await neo4jResponse.text())
        console.log('🔄 Switching to PostgreSQL fallback for graph visualization')
        setUseNeo4jFallback(true)
      } else {
        console.log('✅ Neo4j save successful')
        const neo4jResult = await neo4jResponse.json()
        console.log('🕸️ Neo4j result:', neo4jResult)
      }

      // Update local state
      setUserSkills(prev => [...prev, {
        name: skill.name,
        category: skill.category,
        proficiency: 'intermediate',
        isNew: true
      }])

      // Remove from pending
      setPendingSkills(prev => prev.filter(s => s.id !== skillId))

      console.log('✅ Skill added to both PostgreSQL and Neo4j with AI relationships:', skill.name)
      
      // Force refresh the Neo4j graph component and reload skills
      setTimeout(() => {
        console.log('🔄 Triggering graph refresh and reloading skills...')
        setGraphRefreshKey(prev => prev + 1)
        loadUserSkills() // Reload skills from database
      }, 1500) // Give more time for Neo4j to process

    } catch (error) {
      console.error('❌ Error adding skill:', error)
    }
  }

  const handleRejectSkill = (skillId: string) => {
    setPendingSkills(prev => prev.filter(s => s.id !== skillId))
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

  // Enable authentication - redirect to sign in if no user
  if (!user && isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to use Quest</p>
          <a 
            href="/sign-in" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <AgentSidebar
                  currentAgent={currentAgent}
                  availableAgents={availableAgents}
                  onRequestHandover={(agentId) => {
                    console.log('🤖 Manual handover requested to:', agentId)
                    setHandoverSuggestion({
                      shouldHandover: true,
                      targetAgent: agentId,
                      confidence: 100,
                      reason: 'Manual handover requested by user',
                      suggestedMessage: `Switching to ${agentId} agent as requested.`,
                      urgency: 'high'
                    })
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Conversation Area */}
          <div className="lg:col-span-2 order-1 lg:order-2">
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

                {/* Agent Handover */}
                <div className="border-t pt-4 pb-4">
                  <AgentHandover
                    handoverSuggestion={handoverSuggestion}
                    currentAgent={currentAgent}
                    onAcceptHandover={handleAcceptHandover}
                    onRejectHandover={handleRejectHandover}
                    onManualHandover={handleManualHandover}
                    availableAgents={availableAgents}
                  />
                </div>

                {/* Skill Confirmation */}
                {pendingSkills.length > 0 && (
                  <div className="border-t pt-4 pb-4">
                    <SkillConfirmation 
                      pendingSkills={pendingSkills}
                      onConfirmSkill={handleConfirmSkill}
                      onRejectSkill={handleRejectSkill}
                    />
                  </div>
                )}

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

            {/* Productivity Agent Todos */}
            {currentAgent === 'productivity' && agentTodos.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📋 Your Tasks</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({agentTodos.length} items)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agentTodos.map((todo, index) => (
                      <div key={todo.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-4 h-4 border border-gray-300 rounded mt-0.5"></div>
                        <div className="flex-1">
                          <div className="font-medium">{todo.title}</div>
                          {todo.description && (
                            <div className="text-sm text-gray-600">{todo.description}</div>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded ${
                              todo.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              todo.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {todo.priority} priority
                            </span>
                            {todo.deadline && <span>Due: {todo.deadline}</span>}
                            {todo.estimatedTime && <span>Est: {todo.estimatedTime}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI-Powered Skills Graph Visualization */}
            {(user?.id || true) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Skills Network</span>
                    <span className="text-sm font-normal text-gray-500">
                      {useNeo4jFallback ? '(PostgreSQL + Smart Relationships)' : '(Neo4j + GPT-4 Relationships)'}
                    </span>
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    Debug: Mode = {useNeo4jFallback ? 'PostgreSQL Fallback' : 'Neo4j'} | Refresh Key = {graphRefreshKey}
                  </div>
                </CardHeader>
                <CardContent>
                  {useNeo4jFallback ? (
                    <PostgreSQLSkillGraph 
                      key={`postgres-${graphRefreshKey}`}
                      userId={user?.id || 'debug-user-001'} 
                      height={400}
                      refreshTrigger={graphRefreshKey}
                    />
                  ) : (
                    <Neo4jSkillGraph 
                      key={`neo4j-${graphRefreshKey}`}
                      userId={user?.id || 'debug-user-001'} 
                      height={400}
                      refreshTrigger={graphRefreshKey}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quest Info */}
          <div className="lg:col-span-1 order-3 space-y-6">
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

            {/* Skills Debug Display */}
            {(user?.id || true) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Your Skills</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({userSkills.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-xs text-gray-500">
                    Debug: User ID = {user?.id || 'debug-user-001'} | Skills Array Length = {userSkills.length}
                  </div>
                  
                  {userSkills.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userSkills.map((skill, index) => {
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        const skillCategory = typeof skill === 'object' ? skill.category : 'unknown';
                        const isNew = typeof skill === 'object' ? skill.isNew : false;
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <span className={isNew ? 'font-semibold text-green-600' : ''}>{skillName}</span>
                              {isNew && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">NEW</span>}
                            </div>
                            <span className="text-xs text-gray-500">{skillCategory}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500 mb-2">
                        No skills loaded from database
                      </div>
                      <div className="text-xs text-gray-400">
                        Use "Test Create Marketing Skill" to add a skill directly
                      </div>
                    </div>
                  )}
                  
                  {/* Refresh Graph Button for Debugging */}
                  <div className="mt-3 space-y-2">
                    <button 
                      onClick={() => {
                        console.log('🔄 Manual graph refresh triggered')
                        setGraphRefreshKey(prev => prev + 1)
                        loadUserSkills()
                      }}
                      className="w-full px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      🔄 Refresh Graph & Skills
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('🔄 Toggling graph mode:', useNeo4jFallback ? 'Neo4j' : 'PostgreSQL')
                        setUseNeo4jFallback(prev => !prev)
                        setGraphRefreshKey(prev => prev + 1)
                      }}
                      className="w-full px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      🔄 {useNeo4jFallback ? 'Try Neo4j' : 'Use PostgreSQL Fallback'}
                    </button>
                    
                    <button 
                      onClick={async () => {
                        const effectiveUserId = user?.id || 'debug-user-001'
                        console.log('🧪 Testing direct skill creation for user:', effectiveUserId)
                        
                        try {
                          const response = await fetch('/api/skills', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: effectiveUserId,
                              skill: {
                                name: 'Marketing Test',
                                category: 'business',
                                proficiency: 'intermediate'
                              }
                            })
                          })
                          
                          const result = await response.json()
                          console.log('🧪 Test skill creation result:', result)
                          
                          if (response.ok) {
                            alert('✅ Test skill created! Check console and refresh.')
                            loadUserSkills()
                            setGraphRefreshKey(prev => prev + 1)
                          } else {
                            alert('❌ Test skill failed: ' + result.error)
                          }
                        } catch (error) {
                          console.error('🧪 Test skill error:', error)
                          alert('❌ Test skill error: ' + error)
                        }
                      }}
                      className="w-full px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      🧪 Test Create Marketing Skill
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

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