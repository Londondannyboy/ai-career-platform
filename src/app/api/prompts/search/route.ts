import { NextRequest, NextResponse } from 'next/server'
import { promptRouter } from '@/lib/prompts/promptRouter'

export async function POST(request: NextRequest) {
  try {
    const { query, context, limit = 10, threshold = 0.7 } = await request.json()
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 })
    }
    
    const results = await promptRouter.searchPrompts({
      query,
      context,
      limit,
      threshold
    })
    
    return NextResponse.json({
      success: true,
      results,
      query,
      count: results.length
    })
    
  } catch (error) {
    console.error('Semantic search failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      results: []
    }, { status: 500 })
  }
}