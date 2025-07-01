import { NextRequest, NextResponse } from 'next/server'
import { questAgent } from '@/lib/agents/questAgent'

export const runtime = 'edge'

/**
 * Intelligent search endpoint using Quest Agent
 * POST /api/agent/search
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json({
        error: 'Query is required'
      }, { status: 400 })
    }
    
    // Process query through Quest Agent
    const responseStream = await questAgent.processQuery(query)
    
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
    console.error('Agent search error:', error)
    return NextResponse.json({
      error: 'Failed to process search query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get search strategy for a query
 * GET /api/agent/search?q=query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({
        error: 'Query parameter q is required'
      }, { status: 400 })
    }
    
    // Determine search strategy
    const strategy = await questAgent.determineSearchStrategy(query)
    
    return NextResponse.json({
      query,
      strategy,
      strategies: {
        vector: 'Semantic similarity search across documents and profiles',
        graph: 'Relationship and connection search in knowledge graph',
        hybrid: 'Combined vector and graph search for comprehensive results'
      }
    })
    
  } catch (error) {
    console.error('Strategy determination error:', error)
    return NextResponse.json({
      error: 'Failed to determine search strategy',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}