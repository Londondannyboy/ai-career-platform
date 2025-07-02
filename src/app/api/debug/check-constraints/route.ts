import { NextResponse } from 'next/server'
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
 * GET /api/debug/check-constraints
 * Check database constraints that might prevent multiple uploads
 */
export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Check constraints on company_documents table
      const constraintsQuery = `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = 'company_documents'
        ORDER BY tc.constraint_type, tc.constraint_name
      `
      
      const constraintsResult = await client.query(constraintsQuery)

      // Check indexes
      const indexesQuery = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'company_documents'
        ORDER BY indexname
      `
      
      const indexesResult = await client.query(indexesQuery)

      // Get document count per workspace
      const workspaceCountsQuery = `
        SELECT 
          workspace_id,
          COUNT(*) as document_count
        FROM company_documents 
        GROUP BY workspace_id
        ORDER BY document_count DESC
      `
      
      const workspaceCountsResult = await client.query(workspaceCountsQuery)

      return NextResponse.json({
        success: true,
        constraints: constraintsResult.rows,
        indexes: indexesResult.rows,
        workspaceCounts: workspaceCountsResult.rows,
        timestamp: new Date().toISOString()
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Constraints check failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Constraints check failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}