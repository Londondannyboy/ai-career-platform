/**
 * Hume Custom Language Model (CLM) Endpoint - SSE Format
 * Returns responses in Hume's expected SSE format
 */

import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { sql } from '@/lib/db'
import { repoUpdateAgent } from '@/lib/ai/repoUpdateAgent'

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
    
    // Get user's profile and Trinity from database
    let userContext = null
    let trinityContext = null
    try {
      const userQuery = await sql`
        SELECT * FROM users WHERE id = ${userId} LIMIT 1
      `
      if (userQuery.rows.length > 0) {
        userContext = userQuery.rows[0]
      }

      // Get user's Trinity statement and coaching preferences
      const trinityQuery = await sql`
        SELECT 
          ts.quest,
          ts.service,
          ts.pledge,
          ts.trinity_type,
          ts.trinity_type_description,
          tcp.quest_focus,
          tcp.service_focus,
          tcp.pledge_focus,
          tcp.coaching_methodology,
          tcp.coaching_tone
        FROM trinity_statements ts
        LEFT JOIN trinity_coaching_preferences tcp ON ts.id = tcp.trinity_statement_id
        WHERE ts.user_id = ${userId} AND ts.is_active = TRUE
        LIMIT 1
      `
      if (trinityQuery.rows.length > 0) {
        trinityContext = trinityQuery.rows[0]
      }
    } catch (error) {
      console.error('Database error:', error)
    }
    
    // Extract user message
    const userMessage = body.messages[body.messages.length - 1]?.content || ''
    
    // Build enhanced system prompt with user and Trinity context
    let systemPrompt = 'You are Quest AI, an empathetic career coach. Keep responses under 150 words for voice synthesis. Be warm and conversational.'
    
    if (userContext) {
      systemPrompt += `\n\nUser Profile:
- Name: ${userContext.name || 'Dan Keegan'}
- Company: ${userContext.company || 'CKDelta'}
- Role: ${userContext.current_role || 'Entrepreneur/Consultant'}
- Experience: ${userContext.years_experience || 15} years

Address them by name and reference their background when relevant.`
    }

    if (trinityContext) {
      const trinityType = trinityContext.trinity_type === 'F' ? 'Foundation' : 
                        trinityContext.trinity_type === 'L' ? 'Living' : 'Mixed';
      
      systemPrompt += `\n\nUser's Trinity (${trinityType} approach):
- Quest: "${trinityContext.quest}"
- Service: "${trinityContext.service}"
- Pledge: "${trinityContext.pledge}"

Coaching Focus:
- Quest emphasis: ${trinityContext.quest_focus}%
- Service emphasis: ${trinityContext.service_focus}%
- Pledge emphasis: ${trinityContext.pledge_focus}%
- Methodology: ${trinityContext.coaching_methodology}
- Tone: ${trinityContext.coaching_tone}

Adapt your coaching to align with their Trinity. If Quest focus is high, emphasize their mission and purpose. 
If Service focus is high, discuss how they can help others. If Pledge focus is high, reinforce their commitments.
Use a ${trinityContext.coaching_tone} tone and ${trinityContext.coaching_methodology} methodology when appropriate.`
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

    // Check if repository updates are needed
    try {
      // Get current repos
      const repoResult = await sql`
        SELECT 
          surface_repo_data,
          surface_private_repo_data,
          personal_repo_data,
          deep_repo_data
        FROM user_profiles
        WHERE user_id = ${userId}
      `;

      const currentRepos = repoResult.rows[0] ? {
        surface: repoResult.rows[0].surface_repo_data,
        surfacePrivate: repoResult.rows[0].surface_private_repo_data,
        personal: repoResult.rows[0].personal_repo_data,
        deep: repoResult.rows[0].deep_repo_data
      } : {};

      // Analyze conversation for potential updates
      const updateAnalysis = await repoUpdateAgent.analyzeConversation({
        userId,
        messages: body.messages,
        currentRepos
      });

      if (updateAnalysis?.shouldUpdate) {
        console.log('📝 Repository update needed:', updateAnalysis.reason);
        
        // Apply the updates
        const updateResult = await repoUpdateAgent.applyUpdates(
          userId,
          updateAnalysis.layer,
          updateAnalysis.updates
        );
        
        if (updateResult.success) {
          console.log('✅ Repository updated successfully');
        }
      }
    } catch (error) {
      console.error('Repository update error:', error);
      // Continue with response even if update fails
    }

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