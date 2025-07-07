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
  company?: string
  department?: string
  years_experience?: number
  active_goals?: string[]
  colleagues?: any[]
  company_roles?: string[]
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

    // Return streaming response in OpenAI format for Hume
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
 * Fetch comprehensive user context from real database
 */
async function fetchUserContext(userId: string): Promise<UserProfile | null> {
  try {
    console.log('🔍 Fetching real user context for:', userId)
    
    // Query user profile with related data
    const userQuery = await sql`
      SELECT 
        u.*,
        array_agg(DISTINCT ug.title) FILTER (WHERE ug.title IS NOT NULL) as active_goals,
        array_agg(DISTINCT us.skill_name) FILTER (WHERE us.skill_name IS NOT NULL) as skill_list,
        array_agg(DISTINCT ucr.role_at_company) FILTER (WHERE ucr.role_at_company IS NOT NULL) as company_roles
      FROM users u
      LEFT JOIN user_goals ug ON u.id = ug.user_id AND ug.status = 'active'
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN user_company_relationships ucr ON u.id = ucr.user_id AND ucr.is_current = true
      WHERE u.id = ${userId}
      GROUP BY u.id
      LIMIT 1;
    `
    
    if (userQuery.rows.length === 0) {
      console.log('⚠️ User not found in database:', userId)
      return null
    }
    
    const user = userQuery.rows[0]
    
    // Get CKDelta colleagues for enhanced context
    const colleaguesQuery = await sql`
      SELECT 
        ce.enrichment_data->'employees' as colleagues
      FROM company_enrichments ce
      INNER JOIN user_company_relationships ucr ON ce.id = ucr.company_id
      WHERE ucr.user_id = ${userId} AND ucr.is_current = true
      LIMIT 1;
    `
    
    const colleagues = colleaguesQuery.rows[0]?.colleagues || []
    
    const userContext = {
      id: user.id,
      name: user.name || user.full_name || 'there',
      current_role: user.current_role,
      experience_level: user.seniority_level,
      skills: user.skill_list || user.skills || [],
      professional_goals: user.professional_goals,
      industry: user.industry,
      linkedin_data: user.linkedin_data,
      company: user.company,
      department: user.department,
      years_experience: user.years_experience,
      active_goals: user.active_goals || [],
      colleagues: colleagues.slice(0, 5), // First 5 colleagues for context
      company_roles: user.company_roles || []
    }
    
    console.log('✅ Real user context loaded:', {
      name: userContext.name,
      role: userContext.current_role,
      company: userContext.company,
      skillsCount: userContext.skills.length,
      goalsCount: userContext.active_goals.length,
      colleaguesCount: Array.isArray(userContext.colleagues) ? userContext.colleagues.length : 0
    })
    
    return userContext
    
  } catch (error) {
    console.error('❌ Error fetching user context:', error)
    
    // Try fallback to basic mock data if database query fails
    console.log('🔄 Falling back to mock context due to error')
    return {
      id: userId,
      name: 'Quest User',
      current_role: 'Professional',
      experience_level: 'Mid-level',
      skills: ['Leadership', 'Communication'],
      professional_goals: 'Career advancement and skill development',
      industry: 'Technology',
      linkedin_data: null
    }
  }
}

/**
 * Fetch recent conversation history for context
 */
async function fetchConversationHistory(userId: string, sessionId?: string): Promise<ConversationHistory[]> {
  try {
    console.log('🔍 Fetching real conversation history for user:', userId)
    
    // Query conversation sessions from the database
    let query
    if (sessionId) {
      query = await sql`
        SELECT 
          id,
          transcript as content,
          ai_response,
          emotional_context,
          topics_discussed,
          session_type,
          started_at as timestamp,
          duration_seconds
        FROM conversation_sessions 
        WHERE user_id = ${userId}
          AND session_id = ${sessionId}
        ORDER BY started_at DESC
        LIMIT 10
      `
    } else {
      query = await sql`
        SELECT 
          id,
          transcript as content,
          ai_response,
          emotional_context,
          topics_discussed,
          session_type,
          started_at as timestamp,
          duration_seconds
        FROM conversation_sessions 
        WHERE user_id = ${userId}
        ORDER BY started_at DESC
        LIMIT 10
      `
    }
    
    const history = query.rows.map(row => ({
      id: row.id,
      content: row.content || '',
      role: 'user' as const,
      timestamp: row.timestamp,
      emotional_context: row.emotional_context || {},
      ai_response: row.ai_response,
      topics_discussed: row.topics_discussed || [],
      duration_seconds: row.duration_seconds
    }))
    
    console.log('✅ Real conversation history loaded:', {
      sessionsCount: history.length,
      recentTopics: history.slice(0, 3).map(h => h.topics_discussed).flat().slice(0, 5)
    })
    
    return history
    
  } catch (error) {
    console.error('❌ Error fetching conversation history:', error)
    
    // Fallback to empty array if database query fails
    console.log('🔄 No conversation history available yet')
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
    console.log('💾 Storing conversation turn to database:', { 
      userId: userId.substring(0, 8) + '...', 
      sessionId, 
      contentLength: content.length 
    })
    
    // Store conversation in database
    await sql`
      INSERT INTO conversation_sessions (
        user_id,
        session_id,
        session_type,
        transcript,
        emotional_context,
        conversation_metadata,
        topics_discussed,
        platform,
        voice_enabled,
        started_at
      )
      VALUES (
        ${userId},
        ${sessionId},
        'quest_conversation_clm',
        ${content},
        ${JSON.stringify(emotionalContext || {})},
        ${JSON.stringify({ source: 'hume_clm', version: '1.0' })},
        ${JSON.stringify(extractTopicsFromContent(content))},
        'web',
        true,
        NOW()
      )
      ON CONFLICT (user_id, session_id) 
      DO UPDATE SET
        transcript = EXCLUDED.transcript,
        emotional_context = EXCLUDED.emotional_context,
        updated_at = NOW()
    `
    
    console.log('✅ Conversation stored successfully')
    
    // TODO: Add vectorization for semantic search in future iteration
    // await neonClient.storeDocument({
    //   content,
    //   metadata: { userId, sessionId, type: 'conversation', emotionalContext }
    // })
    
  } catch (error) {
    console.error('❌ Error storing conversation turn:', error)
    // Don't throw error - conversation should continue even if storage fails
  }
}

/**
 * Extract topics from conversation content for better context
 */
function extractTopicsFromContent(content: string): string[] {
  const topics: string[] = []
  const lowercaseContent = content.toLowerCase()
  
  // Career-related keywords
  const careerKeywords = {
    'job search': /job.{0,10}search|looking.{0,10}job|find.{0,10}job/,
    'interview': /interview|interviewing/,
    'leadership': /leadership|leading|manage|manager/,
    'skills': /skill|learn|improve|develop/,
    'promotion': /promotion|advance|career.{0,10}growth/,
    'networking': /network|connect|colleague/,
    'goals': /goal|objective|target/,
    'feedback': /feedback|review|evaluation/,
    'mentoring': /mentor|coach|guidance/,
    'work-life balance': /work.{0,5}life|balance|stress/
  }
  
  Object.entries(careerKeywords).forEach(([topic, regex]) => {
    if (regex.test(lowercaseContent)) {
      topics.push(topic)
    }
  })
  
  return topics.slice(0, 5) // Limit to 5 topics
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

  // Add comprehensive user context if available
  if (userContext) {
    prompt += `User Profile - ${userContext.name}:
${userContext.current_role ? `- Role: ${userContext.current_role}` : ''}
${userContext.company ? `- Company: ${userContext.company}` : ''}
${userContext.department ? `- Department: ${userContext.department}` : ''}
${userContext.experience_level ? `- Seniority: ${userContext.experience_level}` : ''}
${userContext.years_experience ? `- Experience: ${userContext.years_experience} years` : ''}
${userContext.industry ? `- Industry: ${userContext.industry}` : ''}
${userContext.skills?.length ? `- Skills: ${userContext.skills.join(', ')}` : ''}
${userContext.professional_goals ? `- Goals: ${userContext.professional_goals}` : ''}

`

    // Add active goals if available
    if (userContext.active_goals && userContext.active_goals.length > 0) {
      prompt += `Active Goals:
${userContext.active_goals.map(goal => `- ${goal}`).join('\n')}

`
    }

    // Add colleagues context if available
    if (userContext.colleagues && Array.isArray(userContext.colleagues) && userContext.colleagues.length > 0) {
      prompt += `Team/Colleagues at ${userContext.company}:
${userContext.colleagues.slice(0, 3).map((colleague: any) => 
  `- ${colleague.name}: ${colleague.title || colleague.headline || 'Team Member'}`
).join('\n')}

`
    }
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

// Handle preflight requests for CORS
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}