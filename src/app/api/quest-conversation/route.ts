import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { 
      userInput, 
      conversationHistory, 
      userProfile, 
      recentSessions, 
      playbook, 
      emotionalContext,
      systemPrompt 
    } = await request.json()

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: systemPrompt || `You are Quest, an empathetic AI career coach powered by advanced emotional intelligence. 

        You help users with:
        - Career coaching and professional development
        - Job search strategies and interview preparation  
        - CV/Resume optimization and skills enhancement
        - Practice conversations and peer feedback

        Key principles:
        - Be empathetic and supportive
        - Provide actionable advice
        - Ask clarifying questions to understand their needs
        - Keep responses conversational and encouraging
        - Adapt your tone based on the user's emotional state
        - Remember their previous conversations for context

        Current session focus: ${playbook || 'general career guidance'}
        ${emotionalContext ? `User's emotional state: Consider they may be feeling ${JSON.stringify(emotionalContext)}` : ''}
        `
      }
    ]

    // Add user profile context if available
    if (userProfile) {
      messages.push({
        role: 'system',
        content: `User profile context: ${JSON.stringify(userProfile)}`
      })
    }

    // Add recent session context
    if (recentSessions && recentSessions.length > 0) {
      const sessionContext = recentSessions.map((session: { ai_analysis?: string; transcript?: string }) => 
        `Previous session: ${session.ai_analysis || session.transcript?.substring(0, 200)}`
      ).join('\n')
      
      messages.push({
        role: 'system',
        content: `Recent conversation context:\n${sessionContext}`
      })
    }

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      // Add last few messages for context
      const recentMessages = conversationHistory.slice(-6) // Last 6 messages
      
      for (const msg of recentMessages) {
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })
      }
    }

    // Add current user input
    messages.push({
      role: 'user',
      content: userInput
    })

    // Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_tokens: 300, // Keep responses concise for voice
      temperature: 0.7,
      presence_penalty: 0.2,
      frequency_penalty: 0.1
    })

    const response = completion.choices[0]?.message?.content || 
      "I'm here to help with your career journey. Could you tell me more about what you'd like to work on?"

    return NextResponse.json({ 
      response,
      playbook: playbook || 'career_coaching',
      emotionalContext: emotionalContext || null
    })

  } catch (error) {
    console.error('Quest conversation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        response: "I'm having trouble right now, but I'm here to help with your career goals. Could you try asking again?"
      },
      { status: 500 }
    )
  }
}