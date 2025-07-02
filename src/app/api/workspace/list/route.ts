import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * GET /api/workspace/list
 * Get all workspaces for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`📁 Getting all workspaces for user ${userId}`)

    const workspaceService = getWorkspaceService()
    const workspaces = await workspaceService.getUserWorkspaces(userId)

    // Get document counts for each workspace
    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const documents = await workspaceService.getWorkspaceDocuments(workspace.id, userId)
          const recentChats = await workspaceService.getChatHistory(workspace.id, userId, 5)
          
          // Calculate document type distribution
          const documentTypes: Record<string, number> = {}
          documents.forEach(doc => {
            documentTypes[doc.documentType] = (documentTypes[doc.documentType] || 0) + 1
          })

          return {
            ...workspace,
            stats: {
              totalDocuments: documents.length,
              documentTypes,
              recentActivity: recentChats.length,
              lastActivity: recentChats.length > 0 ? recentChats[0].timestamp : workspace.updatedAt
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get stats for workspace ${workspace.id}:`, error)
          return {
            ...workspace,
            stats: {
              totalDocuments: 0,
              documentTypes: {},
              recentActivity: 0,
              lastActivity: workspace.updatedAt
            }
          }
        }
      })
    )

    // Sort by last activity (most recent first)
    workspacesWithStats.sort((a, b) => 
      new Date(b.stats.lastActivity).getTime() - new Date(a.stats.lastActivity).getTime()
    )

    console.log(`✅ Retrieved ${workspaces.length} workspaces with stats`)

    return NextResponse.json({
      success: true,
      workspaces: workspacesWithStats,
      metadata: {
        total: workspaces.length,
        totalDocuments: workspacesWithStats.reduce((sum, ws) => sum + ws.stats.totalDocuments, 0),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Failed to get user workspaces:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve workspaces',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}