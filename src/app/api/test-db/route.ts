import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// Test database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Test basic connection
      const timeResult = await client.query('SELECT NOW() as current_time')
      
      // Test if our tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('company_workspaces', 'company_documents', 'document_embeddings')
      `)
      
      const existingTables = tablesResult.rows.map(row => row.table_name)
      
      return NextResponse.json({
        success: true,
        timestamp: timeResult.rows[0].current_time,
        database_url_set: !!process.env.NEON_DATABASE_URL,
        existing_tables: existingTables,
        missing_tables: ['company_workspaces', 'company_documents', 'document_embeddings'].filter(
          table => !existingTables.includes(table)
        )
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database_url_set: !!process.env.NEON_DATABASE_URL
    }, { status: 500 })
  }
}