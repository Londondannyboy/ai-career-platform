/**
 * Quest - Simple Tavily Search API
 * Research-grade real-time search following vanilla pattern
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, search_depth = 'basic', include_domains, exclude_domains } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Direct Tavily API call
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query.trim(),
        search_depth: search_depth,
        include_answer: true,
        include_raw_content: false,
        max_results: 10,
        ...(include_domains && { include_domains }),
        ...(exclude_domains && { exclude_domains })
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'Tavily API failed', 
          status: response.status,
          statusText: response.statusText,
          details: errorText
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    // Transform to Quest format like Serper/Linkup
    const results = data.results?.map((result: any, index: number) => ({
      title: result.title,
      url: result.url,
      snippet: result.content || result.snippet,
      domain: new URL(result.url).hostname,
      score: result.score || (data.results.length - index) / data.results.length,
      provider: 'tavily',
      publishedDate: result.published_date
    })) || []

    return NextResponse.json({
      query: query.trim(),
      provider: 'tavily',
      answer: data.answer,
      results,
      searchDepth: search_depth,
      totalResults: data.results?.length || 0,
      followUpQuestions: data.follow_up_questions,
      images: data.images,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Tavily search error:', error)
    
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
    message: 'Quest Tavily Search API',
    usage: 'POST /api/tavily-search with {"query": "your search query"}',
    searchDepths: ['basic', 'advanced'],
    example: {
      query: 'OpenAI latest funding news',
      search_depth: 'advanced'
    }
  })
}