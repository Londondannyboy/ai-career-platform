/**
 * Hume Custom Language Model (CLM) Endpoint - SSE Format
 * Returns responses in Hume's expected SSE format
 */

import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
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

export async function POST(req: NextRequest) {
  try {
    const body: HumeCLMRequest = await req.json()
    
    console.log('🎯 Hume CLM SSE Request:', {
      messageCount: body.messages.length,
      lastMessage: body.messages[body.messages.length - 1]?.content?.substring(0, 50) + '...'
    })

    // Extract user ID (default to Dan's ID for now)
    const userId = body.user_id || 'user_2z5UB58sfZFnapkymfEkFzGIlzK'
    
    // Get Dan's profile from database
    let userContext = null
    try {
      const userQuery = await sql`
        SELECT * FROM users WHERE id = ${userId} LIMIT 1
      `
      if (userQuery.rows.length > 0) {
        userContext = userQuery.rows[0]
      }
    } catch (error) {
      console.error('Database error:', error)
    }
    
    // Extract user message
    const userMessage = body.messages[body.messages.length - 1]?.content || ''
    
    // Build enhanced system prompt with user context
    let systemPrompt = 'You are Quest AI, an empathetic career coach. Keep responses under 150 words for voice synthesis. Be warm and conversational.'
    
    if (userContext) {
      systemPrompt += `\n\nUser Profile:
- Name: ${userContext.name || 'Dan Keegan'}
- Company: ${userContext.company || 'CKDelta'}
- Role: ${userContext.current_role || 'Entrepreneur/Consultant'}
- Experience: ${userContext.years_experience || 15} years

Address them by name and reference their background when relevant.`
    }
    
    const response = await generateText({
      model: openai('gpt-4'),
      messages: [
        { 
          role: 'system', 
          content: systemPrompt
        },
        { 
          role: 'user', 
          content: userMessage 
        }
      ],
      temperature: 0.7,
      maxTokens: 150,
    })

    const aiResponse = response.text

    console.log('✅ Generated response:', aiResponse.substring(0, 100) + '...')

    // Return in Hume's expected SSE format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send the response in SSE format
        const sseMessage = `data: {"id":"chatcmpl-${Date.now()}","object":"chat.completion.chunk","created":${Math.floor(Date.now() / 1000)},"model":"gpt-4","choices":[{"index":0,"delta":{"content":"${aiResponse.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"},"finish_reason":null}]}\n\n`
        
        controller.enqueue(encoder.encode(sseMessage))
        
        // Send the done message
        const doneMessage = `data: {"id":"chatcmpl-${Date.now()}","object":"chat.completion.chunk","created":${Math.floor(Date.now() / 1000)},"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n`
        controller.enqueue(encoder.encode(doneMessage))
        
        // Send [DONE] marker
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('❌ Hume CLM SSE Error:', error)
    
    // Return error in SSE format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const errorMessage = `data: {"error":{"message":"CLM processing error: ${error}","type":"clm_error"}}\n\n`
        controller.enqueue(encoder.encode(errorMessage))
        controller.close()
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
}