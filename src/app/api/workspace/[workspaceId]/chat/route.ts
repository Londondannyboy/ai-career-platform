import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * POST /api/workspace/[workspaceId]/chat
 * Chat with workspace documents using AI
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { workspaceId } = await context.params
    const body = await request.json()
    const { query } = body

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (query.length > 1000) {
      return NextResponse.json(
        { error: 'Query too long. Maximum 1000 characters allowed.' },
        { status: 400 }
      )
    }

    console.log(`💬 Processing chat query in workspace ${workspaceId}: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`)

    const workspaceService = getWorkspaceService()
    
    // Process the chat query
    const chatResponse = await workspaceService.chatWithDocuments(
      workspaceId,
      userId,
      query.trim()
    )

    console.log(`✅ Chat processed in ${chatResponse.processingTime}ms with ${chatResponse.confidence}% confidence`)

    return NextResponse.json({
      success: true,
      ...chatResponse,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: chatResponse.processingTime,
        documentsSearched: chatResponse.documentsUsed.length
      }
    })

  } catch (error) {
    console.error('❌ Chat processing failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat query',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workspace/[workspaceId]/chat
 * Get chat history for workspace
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { workspaceId } = await context.params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      )
    }

    console.log(`📜 Getting chat history for workspace ${workspaceId} (limit: ${limit})`)

    const workspaceService = getWorkspaceService()
    const chatHistory = await workspaceService.getChatHistory(workspaceId, userId, limit)

    console.log(`✅ Retrieved ${chatHistory.length} chat messages`)

    return NextResponse.json({
      success: true,
      chatHistory,
      metadata: {
        total: chatHistory.length,
        limit,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Failed to get chat history:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve chat history',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}