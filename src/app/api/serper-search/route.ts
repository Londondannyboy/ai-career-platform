/**
 * Quest - Simple Serper.dev Search API
 * Focus on getting Serper working first
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, type = 'search' } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Direct Serper.dev API call
    const response = await fetch(`https://google.serper.dev/${type}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': '283930ae73689a0190bec03233e3178be7ce3c82',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query.trim(),
        num: 10
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Serper API failed', 
          status: response.status,
          statusText: response.statusText 
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    // Transform to Quest format
    const results = data.organic?.map((result: any, index: number) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      domain: new URL(result.link).hostname,
      score: (data.organic.length - index) / data.organic.length,
      provider: 'serper',
      position: result.position
    })) || []

    return NextResponse.json({
      query: query.trim(),
      provider: 'serper',
      results,
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      processingTime: data.searchInformation?.timeTaken || 0,
      answerBox: data.answerBox,
      knowledgeGraph: data.knowledgeGraph,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Serper search error:', error)
    
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Quest Serper.dev Search API',
    usage: 'POST /api/serper-search with {"query": "your search query"}',
    types: ['search', 'news', 'images'],
    example: {
      query: 'OpenAI latest news',
      type: 'search'
    }
  })
}