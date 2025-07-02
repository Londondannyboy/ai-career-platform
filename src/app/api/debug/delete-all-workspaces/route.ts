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
 * DELETE /api/debug/delete-all-workspaces
 * Delete ALL workspaces for current user (nuclear option)
 */
export async function DELETE() {
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

    console.log(`🧹 NUCLEAR CLEANUP: Deleting ALL workspaces for user: ${userId}`)

    const client = await pool.connect()
    try {
      // Get all workspaces for user first
      const getWorkspacesQuery = `
        SELECT id, company_name, display_name, created_at 
        FROM company_workspaces 
        WHERE owner_id = $1 
        ORDER BY created_at DESC
      `
      
      const workspaces = await client.query(getWorkspacesQuery, [userId])
      console.log(`📊 Found ${workspaces.rows.length} workspaces to delete`)

      if (workspaces.rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No workspaces found to delete',
          deletedCount: 0
        })
      }

      // Delete all documents first (though cascade should handle this)
      const deleteDocsQuery = `
        DELETE FROM company_documents 
        WHERE workspace_id IN (
          SELECT id FROM company_workspaces WHERE owner_id = $1
        )
      `
      const docsResult = await client.query(deleteDocsQuery, [userId])
      console.log(`🗑️ Deleted ${docsResult.rowCount} documents`)

      // Delete all workspaces
      const deleteWorkspacesQuery = `
        DELETE FROM company_workspaces 
        WHERE owner_id = $1
      `
      
      const workspacesResult = await client.query(deleteWorkspacesQuery, [userId])
      
      console.log(`✅ NUCLEAR CLEANUP COMPLETE: Deleted ${workspacesResult.rowCount} workspaces`)

      return NextResponse.json({
        success: true,
        message: `Nuclear cleanup completed: deleted ${workspacesResult.rowCount} workspaces and ${docsResult.rowCount} documents`,
        deletedWorkspaces: workspacesResult.rowCount,
        deletedDocuments: docsResult.rowCount,
        workspaceList: workspaces.rows.map(w => ({
          id: w.id,
          name: w.display_name,
          created: w.created_at
        }))
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Nuclear cleanup failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Nuclear cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}