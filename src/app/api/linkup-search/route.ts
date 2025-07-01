/**
 * Quest - Simple Linkup.so Search API
 * Clean implementation following Serper pattern
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, depth = 'standard' } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Direct Linkup.so API call
    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 55ae9876-ffe4-4ee3-92b0-cb3c43ba280f',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query.trim(),
        depth: depth,
        output_type: 'sourcedAnswer'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'Linkup API failed', 
          status: response.status,
          statusText: response.statusText,
          details: errorText
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    // Transform sources to results format like Serper
    const results = data.sources?.map((source: any, index: number) => ({
      title: source.name,
      url: source.url,
      snippet: source.snippet,
      domain: new URL(source.url).hostname,
      score: (data.sources.length - index) / data.sources.length,
      provider: 'linkup'
    })) || []

    return NextResponse.json({
      query: query.trim(),
      provider: 'linkup',
      answer: data.answer,
      results,
      sources: data.sources,
      depth: depth,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Linkup search error:', error)
    
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
    message: 'Quest Linkup.so Search API',
    usage: 'POST /api/linkup-search with {"query": "your search query"}',
    depths: ['standard', 'deep'],
    example: {
      query: 'OpenAI latest news',
      depth: 'deep'
    }
  })
}