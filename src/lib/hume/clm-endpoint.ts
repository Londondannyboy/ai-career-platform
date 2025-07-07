import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

/**
 * Modular Hume CLM Endpoint Generator
 * 
 * Creates a production-ready Hume Custom Language Model endpoint
 * that can be configured for any application with user context.
 * 
 * @example
 * ```typescript
 * const endpoint = createHumeCLMEndpoint({
 *   userFetcher: async (userId) => await getUserFromDB(userId),
 *   systemPromptBuilder: (user) => `You are coaching ${user.name}...`,
 *   modelConfig: { temperature: 0.7 }
 * })
 * export const POST = endpoint
 * ```
 */

interface HumeVoiceConfig {
  /** Function to fetch user data by ID */
  userFetcher: (userId: string) => Promise<any>
  /** Function to build system prompt with user context */
  systemPromptBuilder: (userContext: any) => string
  /** Optional model configuration */
  modelConfig?: {
    temperature?: number
    maxTokens?: number
    model?: string
  }
  /** Optional debug logging */
  debug?: boolean
}

export function createHumeCLMEndpoint(config: HumeVoiceConfig) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    
    try {
      // Parse Hume request body
      const body = await req.json()
      const userId = body.user_id || body.custom_session_id
      const userMessage = body.messages?.[0]?.content || ''
      
      if (config.debug) {
        console.log('🎤 Hume CLM Request:', {
          userId,
          message: userMessage.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        })
      }

      // Fetch user context using provided function
      let userContext = null
      if (userId) {
        try {
          userContext = await config.userFetcher(userId)
        } catch (error) {
          console.error('Error fetching user context:', error)
        }
      }

      // Build system prompt with user context
      const systemPrompt = config.systemPromptBuilder(userContext)
      
      if (config.debug) {
        console.log('🧠 Generated system prompt:', systemPrompt.substring(0, 200) + '...')
      }

      // Generate AI response
      const { text } = await generateText({
        model: openai(config.modelConfig?.model || 'gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: config.modelConfig?.temperature || 0.7,
        maxTokens: config.modelConfig?.maxTokens || 1000,
      })

      // CRITICAL: Return Server-Sent Events format
      // Hume requires this exact format, not regular JSON
      const responseText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n')
      const stream = `data: {"choices":[{"delta":{"content":"${responseText}"}}]}\n\ndata: [DONE]\n\n`

      if (config.debug) {
        console.log('✅ CLM Response generated:', {
          responseLength: text.length,
          processingTime: Date.now() - startTime + 'ms',
          userId
        })
      }

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })

    } catch (error) {
      console.error('❌ CLM Endpoint Error:', error)
      
      // Return error in SSE format
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStream = `data: {"error":"Failed to generate response: ${errorMessage}"}\n\ndata: [DONE]\n\n`
      
      return new NextResponse(errorStream, {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }
}

/**
 * Default user fetcher that returns null (no user context)
 */
export const noUserContext = async (_userId: string) => null

/**
 * Default system prompt builder for general use
 */
export const defaultSystemPrompt = (userContext: any) => {
  if (!userContext) {
    return "You are a helpful AI assistant. Provide clear, concise, and helpful responses."
  }
  
  return `You are a helpful AI assistant speaking with ${userContext.name || 'the user'}.
  
Provide personalized, helpful responses based on the conversation context.`
}

/**
 * Quest AI specific system prompt builder
 */
export const questSystemPromptBuilder = (userContext: any) => {
  if (!userContext) {
    return `You are Quest AI, a professional career coach and advisor.

You help professionals advance their careers through personalized guidance, skill development recommendations, and strategic career planning.

Keep responses:
- Conversational and encouraging
- Practical and actionable
- Professional but warm
- Concise (2-3 sentences max for voice)`
  }

  const experienceText = userContext.years_experience 
    ? `with ${userContext.years_experience} years of experience` 
    : ''

  return `You are Quest AI, a professional career coach speaking with ${userContext.name}.

User Context:
- Name: ${userContext.name}
- Company: ${userContext.company || 'Not specified'}
- Current Role: ${userContext.current_role || 'Not specified'}
- Experience: ${userContext.years_experience || 'Not specified'} years
- Location: ${userContext.location || 'Not specified'}

As their career coach, provide personalized advice based on their background and goals. Keep responses conversational, encouraging, and actionable. For voice conversations, keep responses concise (2-3 sentences) while being helpful.

Focus on:
- Career advancement strategies
- Skill development recommendations  
- Professional networking guidance
- Interview and job search advice
- Leadership and communication skills`
}

/**
 * Example configuration for Quest AI
 */
export const questHumeConfig: HumeVoiceConfig = {
  userFetcher: async (userId: string) => {
    // This would be replaced with actual database call
    // Example return:
    return {
      id: userId,
      name: 'Professional',
      company: 'TechCorp',
      current_role: 'Software Engineer',
      years_experience: 5,
      location: 'San Francisco, CA'
    }
  },
  systemPromptBuilder: questSystemPromptBuilder,
  modelConfig: {
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gpt-4o-mini'
  },
  debug: process.env.NODE_ENV === 'development'
}