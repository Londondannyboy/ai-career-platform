import { NextRequest, NextResponse } from 'next/server'
import { temporalQuestAgent } from '@/lib/agents/temporalQuestAgent'

export const runtime = 'nodejs'

/**
 * Temporal search endpoint with Graphiti integration
 * POST /api/temporal-search
 */
export async function POST(request: NextRequest) {
  try {
    const { query, userId = 'anonymous' } = await request.json()
    
    if (!query) {
      return NextResponse.json({
        error: 'Query is required'
      }, { status: 400 })
    }
    
    console.log(`🕐 Processing temporal query: "${query}" for user: ${userId}`)
    
    // Process query through Temporal Quest Agent
    const responseStream = await temporalQuestAgent.processTemporalQuery(query, userId)
    
    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          console.error('Temporal search streaming error:', error)
          controller.error(error)
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
    
  } catch (error) {
    console.error('Temporal search error:', error)
    return NextResponse.json({
      error: 'Failed to process temporal search query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get temporal search capabilities
 * GET /api/temporal-search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    if (action === 'capabilities') {
      return NextResponse.json({
        features: [
          'Temporal fact tracking',
          'Episodic memory',
          'Entity resolution',
          'Confidence scoring',
          'Time-aware search',
          'Relationship evolution'
        ],
        supported_queries: [
          'What has changed about [entity] recently?',
          'Show me the history of [entity]',
          'Who is currently working at [company]?',
          'What skills did [person] have in 2023?',
          'How has [company] evolved over time?'
        ]
      })
    }
    
    return NextResponse.json({
      status: 'Temporal search ready',
      message: 'Use POST to submit queries, GET with ?action=capabilities for features'
    })
    
  } catch (error) {
    console.error('Temporal search GET error:', error)
    return NextResponse.json({
      error: 'Failed to get temporal search info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}