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
 * DELETE /api/workspace/cleanup
 * Clean up duplicate workspaces for current user
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

    console.log(`🧹 Cleaning up workspaces for user: ${userId}`)

    const client = await pool.connect()
    try {
      // Get all workspaces for user
      const getUserWorkspacesQuery = `
        SELECT id, company_name, display_name, created_at 
        FROM company_workspaces 
        WHERE owner_id = $1 
        ORDER BY created_at ASC
      `
      
      const workspaces = await client.query(getUserWorkspacesQuery, [userId])
      console.log(`📊 Found ${workspaces.rows.length} workspaces`)

      if (workspaces.rows.length <= 1) {
        return NextResponse.json({
          success: true,
          message: 'No cleanup needed - user has 1 or fewer workspaces',
          workspacesDeleted: 0
        })
      }

      // Keep the first workspace, delete the rest
      const workspacesToDelete = workspaces.rows.slice(1)
      const workspaceIdsToDelete = workspacesToDelete.map(w => w.id)

      console.log(`🗑️ Deleting ${workspacesToDelete.length} duplicate workspaces:`, 
        workspacesToDelete.map(w => w.display_name))

      // Delete workspaces (cascade will handle related documents)
      const deleteQuery = `
        DELETE FROM company_workspaces 
        WHERE id = ANY($1::text[]) AND owner_id = $2
      `
      
      const deleteResult = await client.query(deleteQuery, [workspaceIdsToDelete, userId])
      
      console.log(`✅ Deleted ${deleteResult.rowCount} workspaces`)

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deleteResult.rowCount} duplicate workspaces`,
        workspacesDeleted: deleteResult.rowCount,
        remainingWorkspace: workspaces.rows[0].display_name
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to cleanup workspaces',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workspace/cleanup
 * Get cleanup status for current user
 */
export async function GET() {
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

    const client = await pool.connect()
    try {
      const query = `
        SELECT id, company_name, display_name, created_at 
        FROM company_workspaces 
        WHERE owner_id = $1 
        ORDER BY created_at ASC
      `
      
      const result = await client.query(query, [userId])
      
      return NextResponse.json({
        success: true,
        workspaces: result.rows,
        totalCount: result.rows.length,
        needsCleanup: result.rows.length > 1
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Get cleanup status failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get cleanup status',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}