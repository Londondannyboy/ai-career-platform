/**
 * Hume Custom Language Model (CLM) Endpoint
 * Integrates user context from Neon.tech with Hume EVI
 * Follows OpenAI chat completions format with Server-Sent Events
 */

import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { neonClient } from '@/lib/vector/neonClient'
import { sql } from '@/lib/db'

interface HumeCLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  custom_session_id?: string
  user_id?: string
  emotional_context?: Record<string, any>
  metadata?: Record<string, any>
}

interface UserProfile {
  id: string
  name: string
  current_role?: string
  experience_level?: string
  skills?: string[]
  professional_goals?: string
  industry?: string
  linkedin_data?: any
}

interface ConversationHistory {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  emotional_context?: any
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      custom_session_id,
      user_id,
      emotional_context,
      metadata
    }: HumeCLMRequest = await req.json()

    console.log('🎯 Hume CLM Request:', {
      messageCount: messages.length,
      custom_session_id,
      user_id: user_id ? `${user_id.substring(0, 8)}...` : 'none',
      hasEmotionalContext: !!emotional_context
    })

    // Extract user ID from custom_session_id if not provided directly
    const extractedUserId = user_id || extractUserIdFromSessionId(custom_session_id)
    
    if (!extractedUserId) {
      return createFallbackResponse(messages, 'No user context available')
    }

    // Fetch user context from Neon.tech
    const userContext = await fetchUserContext(extractedUserId)
    
    // Get conversation history for context
    const conversationHistory = await fetchConversationHistory(extractedUserId, custom_session_id)
    
    // Store current conversation turn for future context
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'user') {
        await storeConversationTurn(extractedUserId, custom_session_id || '', lastMessage.content, emotional_context)
      }
    }

    // Build enhanced system prompt with user context
    const enhancedSystemPrompt = buildSystemPrompt(userContext, conversationHistory, emotional_context)

    // Create messages array with enhanced context
    const enhancedMessages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...messages.slice(1) // Exclude original system message
    ]

    console.log('✅ Context loaded:', {
      userName: userContext?.name || 'Unknown',
      role: userContext?.current_role || 'N/A',
      historyLength: conversationHistory.length,
      hasSkills: !!userContext?.skills?.length
    })

    // Generate response using OpenAI with full context
    const result = await streamText({
      model: openai('gpt-4'),
      messages: enhancedMessages,
      temperature: 0.7,
      maxTokens: 300, // Keep concise for voice
      frequencyPenalty: 0.1,
      presencePenalty: 0.2,
    })

    // Return streaming response in OpenAI format
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('❌ Hume CLM Error:', error)
    
    // Fallback response if context loading fails
    const { messages } = await req.json()
    return createFallbackResponse(messages, 'Context loading failed')
  }
}

/**
 * Extract user ID from Hume custom_session_id
 * Expected format: "user_<userid>_<timestamp>" or similar
 */
function extractUserIdFromSessionId(sessionId?: string): string | null {
  if (!sessionId) return null
  
  // Try to extract user ID from session ID patterns
  const patterns = [
    /user[_-]([^_-]+)/i,     // user_abc123
    /([^_-]+)[_-]session/i,  // abc123_session
    /^([^_-]+)/              // Just use first part
  ]
  
  for (const pattern of patterns) {
    const match = sessionId.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Fetch comprehensive user context from actual database structure
 */
async function fetchUserContext(userId: string): Promise<UserProfile | null> {
  try {
    // Try Clerk user ID first (most likely case)
    console.log('🔍 Fetching user context for:', userId)
    
    // For now, use Clerk authentication to get basic user info
    // In production, we'd query from the actual users table once it's set up properly
    
    // Mock user context based on Clerk user ID
    // This will be replaced with real database queries once schema is aligned
    const mockUserContext = {
      id: userId,
      name: 'Quest User', // Would come from Clerk user.fullName
      current_role: 'Software Engineer', // Would come from user profile
      experience_level: 'Mid-level',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      professional_goals: 'Looking to advance to senior engineering role',
      industry: 'Technology',
      linkedin_data: null
    }
    
    console.log('✅ User context (mock):', {
      name: mockUserContext.name,
      role: mockUserContext.current_role,
      skillsCount: mockUserContext.skills.length
    })
    
    return mockUserContext
    
    /* TODO: Replace with real database queries once schema is aligned
    // This is what the query should look like with the actual schema:
    const userQuery = await sql`
      SELECT 
        id,
        email,
        name,
        headline,
        company,
        skills,
        experience,
        linkedin_data
      FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `
    
    if (userQuery.rows.length === 0) {
      console.log('⚠️ User not found:', userId)
      return null
    }
    
    const user = userQuery.rows[0]
    
    return {
      id: user.id,
      name: user.name || 'there',
      current_role: user.headline,
      experience_level: user.experience?.level,
      skills: user.skills || [],
      professional_goals: user.experience?.goals,
      industry: user.company,
      linkedin_data: user.linkedin_data
    }
    */
    
  } catch (error) {
    console.error('❌ Error fetching user context:', error)
    
    // Fallback to basic context
    return {
      id: userId,
      name: 'there',
      current_role: undefined,
      experience_level: undefined,
      skills: [],
      professional_goals: undefined,
      industry: undefined,
      linkedin_data: null
    }
  }
}

/**
 * Fetch recent conversation history for context
 */
async function fetchConversationHistory(userId: string, sessionId?: string): Promise<ConversationHistory[]> {
  try {
    console.log('🔍 Fetching conversation history for user:', userId)
    
    // For now, return mock conversation history
    // This will be replaced with real database queries once schema is aligned
    const mockHistory: ConversationHistory[] = [
      {
        id: '1',
        content: 'I want to improve my leadership skills',
        role: 'user',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        emotional_context: { engagement: 0.8, confidence: 0.6 }
      },
      {
        id: '2',
        content: 'How can I prepare for a senior engineering interview?',
        role: 'user', 
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        emotional_context: { anxiety: 0.4, determination: 0.9 }
      }
    ]
    
    console.log('✅ Conversation history (mock):', mockHistory.length, 'turns')
    return mockHistory
    
    /* TODO: Replace with real database queries once schema is aligned
    // This is what the query should look like:
    const query = await sql`
      SELECT 
        id,
        transcript as content,
        'user' as role,
        created_at as timestamp,
        emotional_context
      FROM repo_sessions 
      WHERE user_id = ${userId}
        AND type = 'quest_conversation'
        ${sessionId ? sql`AND session_id = ${sessionId}` : sql``}
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    return query.rows.map(row => ({
      id: row.id,
      content: row.content || '',
      role: row.role,
      timestamp: row.timestamp,
      emotional_context: row.emotional_context
    }))
    */
    
  } catch (error) {
    console.error('❌ Error fetching conversation history:', error)
    return []
  }
}

/**
 * Store conversation turn for future context and vectorization
 */
async function storeConversationTurn(
  userId: string, 
  sessionId: string, 
  content: string, 
  emotionalContext?: any
): Promise<void> {
  try {
    console.log('💾 Storing conversation turn:', { 
      userId: userId.substring(0, 8) + '...', 
      sessionId, 
      contentLength: content.length 
    })
    
    // For now, just log the conversation turn
    // This will be replaced with real database storage once schema is aligned
    console.log('📝 Conversation content:', content.substring(0, 100) + '...')
    console.log('🎭 Emotional context:', emotionalContext)
    
    /* TODO: Replace with real database storage once schema is aligned
    // This is what the storage should look like:
    await sql`
      INSERT INTO repo_sessions (
        user_id,
        session_id,
        type,
        transcript,
        emotional_context,
        created_at
      )
      VALUES (
        ${userId},
        ${sessionId},
        'quest_conversation_clm',
        ${content},
        ${JSON.stringify(emotionalContext || {})},
        NOW()
      )
    `
    
    // Add vectorization for semantic search
    await neonClient.storeDocument({
      content,
      metadata: { userId, sessionId, type: 'conversation', emotionalContext }
    })
    */
    
  } catch (error) {
    console.error('❌ Error storing conversation turn:', error)
  }
}

/**
 * Build enhanced system prompt with user context
 */
function buildSystemPrompt(
  userContext: UserProfile | null,
  conversationHistory: ConversationHistory[],
  emotionalContext?: any
): string {
  let prompt = `You are Quest, an empathetic AI career coach with access to the user's profile and conversation history. You provide personalized, contextual guidance.

Key Capabilities:
- Remember user's background, goals, and previous conversations
- Adapt responses based on emotional context from voice analysis
- Provide specific, actionable career advice
- Ask follow-up questions to better understand their needs
- Be conversational and supportive (this is a voice conversation)

`

  // Add user context if available
  if (userContext) {
    prompt += `User Profile:
- Name: ${userContext.name}
${userContext.current_role ? `- Current Role: ${userContext.current_role}` : ''}
${userContext.experience_level ? `- Experience: ${userContext.experience_level}` : ''}
${userContext.industry ? `- Industry: ${userContext.industry}` : ''}
${userContext.professional_goals ? `- Goals: ${userContext.professional_goals}` : ''}
${userContext.skills?.length ? `- Skills: ${userContext.skills.join(', ')}` : ''}

`
  }

  // Add conversation context
  if (conversationHistory.length > 0) {
    prompt += `Recent Conversation Context:
${conversationHistory.slice(0, 3).map(h => `- ${h.content.substring(0, 100)}...`).join('\n')}

`
  }

  // Add emotional context
  if (emotionalContext) {
    prompt += `Current Emotional Context:
The user's voice shows: ${JSON.stringify(emotionalContext)}
Adapt your tone and approach accordingly.

`
  }

  prompt += `Guidelines:
- Keep responses under 300 words (voice conversation)
- Be warm, supportive, and encouraging
- Reference their background when relevant
- Ask clarifying questions to provide better guidance
- Provide specific next steps when possible

Remember: You know this user and their journey. Be personal and contextual.`

  return prompt
}

/**
 * Create fallback response when context fails to load
 */
async function createFallbackResponse(messages: any[], reason: string) {
  console.log('⚠️ Using fallback response:', reason)
  
  const fallbackPrompt = `You are Quest, an AI career coach. You're having a voice conversation with someone seeking career guidance. Be warm, supportive, and helpful even though you don't have their full context right now.`
  
  const result = await streamText({
    model: openai('gpt-4'),
    messages: [
      { role: 'system', content: fallbackPrompt },
      ...messages.slice(1)
    ],
    temperature: 0.7,
    maxTokens: 200,
  })

  return result.toDataStreamResponse()
}