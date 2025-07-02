import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * GET /api/workspace/[workspaceId]
 * Get workspace details and documents
 */
export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { workspaceId } = params

    console.log(`📁 Getting workspace ${workspaceId} for user ${userId}`)

    const workspaceService = getWorkspaceService()
    
    // Get workspace details
    const workspace = await workspaceService.getWorkspace(workspaceId, userId)
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Get workspace documents
    const documents = await workspaceService.getWorkspaceDocuments(workspaceId, userId)

    // Get recent chat history
    const chatHistory = await workspaceService.getChatHistory(workspaceId, userId, 10)

    console.log(`✅ Retrieved workspace with ${documents.length} documents`)

    return NextResponse.json({
      success: true,
      workspace,
      documents,
      chatHistory,
      stats: {
        totalDocuments: documents.length,
        documentTypes: getDocumentTypeStats(documents),
        recentActivity: chatHistory.length
      }
    })

  } catch (error) {
    console.error('❌ Failed to get workspace:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve workspace',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workspace/[workspaceId]
 * Update workspace settings
 */
export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { workspaceId } = params
    const body = await request.json()
    const { settings } = body

    console.log(`⚙️ Updating workspace ${workspaceId} settings`)

    const workspaceService = getWorkspaceService()
    
    await workspaceService.updateWorkspaceSettings(workspaceId, userId, settings)

    console.log(`✅ Updated workspace settings`)

    return NextResponse.json({
      success: true,
      message: 'Workspace settings updated'
    })

  } catch (error) {
    console.error('❌ Failed to update workspace settings:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update workspace settings',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspace/[workspaceId]
 * Delete workspace (owner only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { workspaceId } = params

    console.log(`🗑️ Deleting workspace ${workspaceId}`)

    const workspaceService = getWorkspaceService()
    
    await workspaceService.deleteWorkspace(workspaceId, userId)

    console.log(`✅ Deleted workspace`)

    return NextResponse.json({
      success: true,
      message: 'Workspace deleted successfully'
    })

  } catch (error) {
    console.error('❌ Failed to delete workspace:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete workspace',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to calculate document type statistics
 */
function getDocumentTypeStats(documents: any[]) {
  const stats: Record<string, number> = {}
  
  documents.forEach(doc => {
    const type = doc.documentType || 'unknown'
    stats[type] = (stats[type] || 0) + 1
  })
  
  return stats
}