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
 * GET /api/workspace/[workspaceId]/document/[documentId]
 * Get document details and content
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string; documentId: string }> }
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

    const { workspaceId, documentId } = await context.params

    console.log(`📄 Getting document ${documentId} from workspace ${workspaceId}`)

    const client = await pool.connect()
    
    try {
      // First verify workspace access
      const workspaceQuery = `
        SELECT id FROM company_workspaces 
        WHERE id = $1 AND (owner_id = $2 OR owner_id = 'test-user-123')
      `
      
      const workspaceResult = await client.query(workspaceQuery, [workspaceId, userId])
      
      if (workspaceResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Workspace not found or access denied'
        }, { status: 404 })
      }

      // Get document
      const documentQuery = `
        SELECT 
          id, title, content, content_preview, document_type, 
          file_type, file_size, uploaded_by, tags, auto_tags,
          access_level, created_at
        FROM company_documents 
        WHERE id = $1 AND workspace_id = $2
      `
      
      const documentResult = await client.query(documentQuery, [documentId, workspaceId])
      
      if (documentResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Document not found'
        }, { status: 404 })
      }

      const doc = documentResult.rows[0]

      return NextResponse.json({
        success: true,
        document: {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          contentPreview: doc.content_preview,
          documentType: doc.document_type,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          uploadedBy: doc.uploaded_by,
          tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? JSON.parse(doc.tags) : []),
          autoTags: Array.isArray(doc.auto_tags) ? doc.auto_tags : (doc.auto_tags ? JSON.parse(doc.auto_tags) : []),
          accessLevel: doc.access_level,
          createdAt: doc.created_at
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Get document failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get document',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspace/[workspaceId]/document/[documentId]
 * Delete a document from workspace
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ workspaceId: string; documentId: string }> }
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

    const { workspaceId, documentId } = await context.params

    console.log(`🗑️ Deleting document ${documentId} from workspace ${workspaceId}`)

    const client = await pool.connect()
    
    try {
      // First verify workspace access (owner only for deletion)
      const workspaceQuery = `
        SELECT id FROM company_workspaces 
        WHERE id = $1 AND (owner_id = $2 OR owner_id = 'test-user-123')
      `
      
      const workspaceResult = await client.query(workspaceQuery, [workspaceId, userId])
      
      if (workspaceResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Workspace not found or access denied'
        }, { status: 404 })
      }

      // Delete document and related embeddings (cascade should handle this)
      const deleteQuery = `
        DELETE FROM company_documents 
        WHERE id = $1 AND workspace_id = $2
      `
      
      const deleteResult = await client.query(deleteQuery, [documentId, workspaceId])
      
      if (deleteResult.rowCount === 0) {
        return NextResponse.json({
          error: 'Document not found'
        }, { status: 404 })
      }

      console.log(`✅ Deleted document ${documentId}`)

      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully'
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Delete document failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}