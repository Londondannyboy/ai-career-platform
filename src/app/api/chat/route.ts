import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json()

    // Enhanced career coaching prompt with user context
    const systemPrompt = `You are an empathetic AI career coach with deep expertise in professional development, job search strategies, and career transitions. You provide personalized, actionable advice based on the user's background and goals.

${userContext ? `
User Context:
- Name: ${userContext.name || 'N/A'}
- Current Role: ${userContext.currentRole || 'N/A'}
- Experience Level: ${userContext.experienceLevel || 'N/A'}
- Skills: ${userContext.skills?.join(', ') || 'N/A'}
- Goals: ${userContext.goals || 'N/A'}
- Industry: ${userContext.industry || 'N/A'}
` : ''}

Guidelines:
- Be supportive, encouraging, and practical
- Ask clarifying questions when needed
- Provide specific, actionable advice
- Draw from real-world industry knowledge
- Help users identify opportunities and overcome challenges
- Focus on building confidence and skills
- Offer next steps and resources when appropriate

Remember: You're having a voice conversation, so keep responses conversational and natural while being informative.`

    const result = await streamText({
      model: openai('gpt-4'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('❌ Error in chat API:', error)
    return new Response('Error processing chat request', { status: 500 })
  }
}