/**
 * Quest - Streaming Web Intelligence Search API
 * Real-time streaming responses from Linkup.so with live results
 */

import { webIntelligenceRouter, WebSearchRequest } from '@/lib/web/webIntelligenceRouter'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, intent, urgency, location, company, maxResults }: WebSearchRequest = await request.json()

    if (!query || query.trim().length === 0) {
      return new Response('Query is required', { status: 400 })
    }

    const searchRequest: WebSearchRequest = {
      query: query.trim(),
      intent: intent || 'general',
      urgency: urgency || 'balanced',
      location,
      company,
      maxResults: maxResults || 10
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Initializing Quest web intelligence search...',
            timestamp: new Date().toISOString()
          })}\n\n`))

          // Send search strategy
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'strategy',
            message: `Analyzing query intent: ${intent}`,
            urgency: urgency,
            timestamp: new Date().toISOString()
          })}\n\n`))

          // Perform the search
          const result = await webIntelligenceRouter.search(searchRequest)

          // Stream the synthesized answer first (if available from Linkup)
          if (result.provider === 'linkup' || result.provider === 'hybrid') {
            // Simulate streaming the answer word by word for better UX
            const answer = (result as any).answer || 'No synthesized answer available'
            const words = answer.split(' ')
            
            for (let i = 0; i < words.length; i++) {
              const chunk = words.slice(0, i + 1).join(' ')
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'answer_chunk',
                content: chunk,
                progress: (i + 1) / words.length,
                timestamp: new Date().toISOString()
              })}\n\n`))
              
              // Small delay for streaming effect
              await new Promise(resolve => setTimeout(resolve, 50))
            }
          }

          // Send sources/results
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'sources',
            sources: result.results.map(r => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet,
              domain: r.domain,
              score: r.score,
              provider: r.provider
            })),
            timestamp: new Date().toISOString()
          })}\n\n`))

          // Send final metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'metadata',
            totalResults: result.totalResults,
            processingTime: result.processingTime,
            provider: result.provider,
            strategy: result.strategy,
            confidence: result.confidence,
            timestamp: new Date().toISOString()
          })}\n\n`))

          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Quest web intelligence search completed',
            timestamp: new Date().toISOString()
          })}\n\n`))

          controller.close()

        } catch (error) {
          console.error('Streaming web search error:', error)
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date().toISOString()
          })}\n\n`))
          
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Web search streaming API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Streaming search failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}