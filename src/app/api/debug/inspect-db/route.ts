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
 * GET /api/debug/inspect-db
 * Inspect database structure to debug column issues
 */
export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Check what columns exist in company_documents table
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'company_documents'
        ORDER BY ordinal_position
      `
      
      const columnsResult = await client.query(columnsQuery)

      // Check if there are any documents
      const countQuery = `SELECT COUNT(*) as count FROM company_documents`
      const countResult = await client.query(countQuery)

      // Get sample document if exists
      let sampleDocument = null
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleQuery = `SELECT * FROM company_documents LIMIT 1`
        const sampleResult = await client.query(sampleQuery)
        sampleDocument = sampleResult.rows[0]
      }

      return NextResponse.json({
        success: true,
        tableExists: columnsResult.rows.length > 0,
        columns: columnsResult.rows,
        documentCount: parseInt(countResult.rows[0].count),
        sampleDocument,
        timestamp: new Date().toISOString()
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Database inspection failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}