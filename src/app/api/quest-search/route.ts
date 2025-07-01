/**
 * Quest Unified Search API
 * Intelligent routing between Serper, Linkup, and Tavily
 */

import { questWebAgent, QuestSearchRequest } from '@/lib/agents/questWebAgent'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, userId, urgency }: QuestSearchRequest = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const searchRequest: QuestSearchRequest = {
      query: query.trim(),
      userId: userId || 'anonymous',
      urgency: urgency || 'balanced'
    }

    const startTime = Date.now()
    const result = await questWebAgent.search(searchRequest)
    
    // Add Quest metadata
    const response = {
      ...result,
      questMetadata: {
        apiVersion: '2.0',
        timestamp: new Date().toISOString(),
        totalProcessingTime: Date.now() - startTime,
        searchId: `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        architecture: 'cole-medin-agentic-rag-web-intelligence'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Quest unified search error:', error)
    
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        questMetadata: {
          apiVersion: '2.0',
          timestamp: new Date().toISOString(),
          errorType: 'unified_search_failure'
        }
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Quest Unified Web Intelligence API',
    version: '2.0',
    description: 'Intelligent routing between Serper, Linkup, and Tavily based on query intent',
    providers: {
      serper: 'Fast Google search results',
      linkup: '91% SOTA AI-synthesized answers',
      tavily: 'Research-grade real-time search'
    },
    urgencyLevels: {
      fast: 'Prioritizes speed (Serper)',
      balanced: 'Optimal provider selection',
      comprehensive: 'Deep analysis (Hybrid)'
    },
    architecture: 'Cole Medin Agentic RAG + Web Intelligence',
    example: {
      query: 'Compare Microsoft vs Amazon cloud strategy',
      urgency: 'comprehensive'
    }
  })
}