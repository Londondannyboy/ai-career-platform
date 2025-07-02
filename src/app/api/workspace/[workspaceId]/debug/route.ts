import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Pool } from 'pg'

export const runtime = 'nodejs'

// Direct PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

/**
 * GET /api/workspace/[workspaceId]/debug
 * Debug workspace loading issues
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    // Use same auth fallback pattern
    let userId = 'test-user-123'
    
    try {
      const authResult = await auth()
      if (authResult?.userId) {
        userId = authResult.userId
      }
    } catch (authError) {
      console.log('🔍 Auth failed, using test user:', authError)
    }

    const { workspaceId } = await context.params

    console.log(`🔍 Debug workspace ${workspaceId} for user ${userId}`)

    const client = await pool.connect()
    
    try {
      // Get workspace details
      const workspaceQuery = `
        SELECT * FROM company_workspaces 
        WHERE id = $1 AND (owner_id = $2 OR owner_id = 'test-user-123')
      `
      
      const workspaceResult = await client.query(workspaceQuery, [workspaceId, userId])
      
      if (workspaceResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Workspace not found',
          workspaceId,
          userId
        }, { status: 404 })
      }

      const workspace = workspaceResult.rows[0]

      // Get documents with safe parsing
      const documentsQuery = `
        SELECT 
          id,
          title,
          document_type,
          file_type,
          uploaded_by,
          tags,
          auto_tags,
          access_level,
          created_at,
          content_preview
        FROM company_documents 
        WHERE workspace_id = $1
        ORDER BY created_at DESC
      `
      
      const documentsResult = await client.query(documentsQuery, [workspaceId])
      
      // Safely parse documents
      const documents = documentsResult.rows.map((row, index) => {
        try {
          return {
            id: row.id,
            title: row.title || 'Untitled',
            documentType: row.document_type || 'unknown',
            fileType: row.file_type || 'unknown',
            uploadedBy: row.uploaded_by || 'unknown',
            uploaderName: row.uploaded_by || 'Unknown User',
            tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags) : []),
            autoTags: Array.isArray(row.auto_tags) ? row.auto_tags : (row.auto_tags ? JSON.parse(row.auto_tags) : []),
            accessLevel: row.access_level || 'team',
            createdAt: new Date(row.created_at).toISOString(),
            contentPreview: (row.content_preview || '').substring(0, 200)
          }
        } catch (docError) {
          console.error(`❌ Error parsing document ${index}:`, docError)
          return {
            id: row.id || `error-${index}`,
            title: `Error loading document ${index}`,
            documentType: 'error',
            fileType: 'unknown',
            uploadedBy: 'error',
            uploaderName: 'Error',
            tags: [],
            autoTags: [],
            accessLevel: 'team',
            createdAt: new Date().toISOString(),
            contentPreview: 'Error loading document data'
          }
        }
      })

      // Get chat history safely
      const chatQuery = `
        SELECT id, user_id, query, response, confidence, processing_time_ms, created_at
        FROM workspace_chats 
        WHERE workspace_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `
      
      const chatResult = await client.query(chatQuery, [workspaceId])
      
      const chatHistory = chatResult.rows.map((row, index) => {
        try {
          return {
            id: row.id,
            userId: row.user_id,
            userName: row.user_id === userId ? 'You' : 'User',
            query: row.query || '',
            response: row.response || '',
            documentsUsed: [],
            confidence: row.confidence || 0,
            processingTimeMs: row.processing_time_ms || 0,
            timestamp: new Date(row.created_at).toISOString()
          }
        } catch (chatError) {
          console.error(`❌ Error parsing chat ${index}:`, chatError)
          return null
        }
      }).filter(chat => chat !== null)

      return NextResponse.json({
        success: true,
        debug: true,
        workspace: {
          id: workspace.id,
          companyName: workspace.company_name,
          displayName: workspace.display_name,
          description: workspace.description,
          ownerId: workspace.owner_id,
          collaborators: Array.isArray(workspace.collaborators) ? workspace.collaborators : [],
          accessLevel: workspace.access_level,
          settings: typeof workspace.settings === 'object' ? workspace.settings : {},
          createdAt: new Date(workspace.created_at).toISOString(),
          updatedAt: new Date(workspace.updated_at).toISOString()
        },
        documents,
        chatHistory,
        stats: {
          totalDocuments: documents.length,
          documentTypes: documents.reduce((acc, doc) => {
            acc[doc.documentType] = (acc[doc.documentType] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          recentActivity: chatHistory.length
        },
        rawCounts: {
          workspaceRows: workspaceResult.rows.length,
          documentRows: documentsResult.rows.length,
          chatRows: chatResult.rows.length
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Debug workspace failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}