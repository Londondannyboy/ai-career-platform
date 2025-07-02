import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/workspace/[workspaceId]/document/test
 * Test endpoint to verify document API routing works
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await context.params

    return NextResponse.json({
      success: true,
      message: 'Document API routing is working',
      workspaceId,
      timestamp: new Date().toISOString(),
      testUrl: `/api/workspace/${workspaceId}/document/test`
    })

  } catch (error) {
    console.error('❌ Document API test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Document API test failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}