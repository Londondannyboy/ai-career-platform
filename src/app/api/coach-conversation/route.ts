import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { userInput, conversationHistory, userProfile, recentSessions } = await request.json()
    
    if (!userInput) {
      return NextResponse.json({ error: 'No user input provided' }, { status: 400 })
    }

    // Build context from user profile and repo sessions
    let profileContext = ''
    if (userProfile) {
      profileContext = `
User Profile:
- Name: ${userProfile.name}
- Email: ${userProfile.email}
- LinkedIn Data: ${userProfile.linkedin_data ? JSON.stringify(userProfile.linkedin_data) : 'Not available'}
`
    }

    let repoContext = ''
    if (recentSessions && recentSessions.length > 0) {
      repoContext = `
Recent Career Conversations:
${recentSessions.map((session: any, index: number) => `
${index + 1}. Previous Discussion:
${session.transcript ? session.transcript.substring(0, 500) + '...' : 'No transcript'}

AI Analysis: ${session.ai_analysis ? session.ai_analysis.substring(0, 300) + '...' : 'No analysis'}
`).join('\n')}
`
    }

    // Build conversation history
    let conversationContext = ''
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = `
Current Conversation:
${conversationHistory.map((msg: any) => `${msg.isUser ? 'User' : 'Coach'}: ${msg.text}`).join('\n')}
`
    }

    // Create coaching prompt
    const coachingPrompt = `You are an expert AI career coach having a real-time voice conversation with a professional. Your role is to:

1. Listen actively and ask thoughtful follow-up questions
2. Provide personalized career guidance based on their background
3. Help them explore their goals, challenges, and next steps
4. Be supportive, insightful, and encouraging
5. Keep responses conversational and under 100 words for voice delivery

${profileContext}

${repoContext}

${conversationContext}

User just said: "${userInput}"

Respond as their career coach with empathy and actionable insights. If this is early in the conversation, ask questions to understand their situation better. If you have context from their profile or previous sessions, reference it naturally.`

    console.log('Coaching conversation - User input:', userInput)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional career coach specializing in personalized guidance. Keep responses conversational, empathetic, and under 100 words for voice delivery.'
        },
        {
          role: 'user', 
          content: coachingPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    })
    
    const response = completion.choices[0]?.message?.content || 'I understand. Could you tell me more about what you\'re thinking?'
    
    console.log('Coaching response generated:', response.substring(0, 100) + '...')
    
    return NextResponse.json({
      response: response
    })
    
  } catch (error) {
    console.error('Error in coaching conversation:', error)
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' }, 
          { status: 500 }
        )
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' }, 
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate coaching response' }, 
      { status: 500 }
    )
  }
}