/**
 * Quest - Web Intelligence Search API
 * Multi-tier web search with Linkup.so and Serper.dev
 */

import { webIntelligenceRouter, WebSearchRequest } from '@/lib/web/webIntelligenceRouter'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, intent, urgency, location, company, maxResults }: WebSearchRequest = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const searchRequest: WebSearchRequest = {
      query: query.trim(),
      intent: intent || 'general',
      urgency: urgency || 'balanced',
      location,
      company,
      maxResults: maxResults || 10
    }

    const startTime = Date.now()
    const result = await webIntelligenceRouter.search(searchRequest)
    
    // Add Quest-specific metadata
    const response = {
      ...result,
      questMetadata: {
        apiVersion: '1.0',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        searchId: `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Web search API error:', error)
    
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        questMetadata: {
          apiVersion: '1.0',
          timestamp: new Date().toISOString(),
          errorType: 'web_search_failure'
        }
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Quest Web Intelligence API',
    version: '1.0',
    endpoints: {
      search: 'POST /api/web-search',
      jobs: 'POST /api/web-search/jobs',
      company: 'POST /api/web-search/company',
      health: 'GET /api/web-search/health'
    },
    providers: ['linkup', 'serper'],
    capabilities: [
      'Job search with location filtering',
      'Company research and intelligence',
      'Salary benchmarking',
      'Person lookup and verification',
      'News monitoring and alerts',
      'Multi-tier search routing'
    ]
  })
}