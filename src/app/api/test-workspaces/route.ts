import { NextResponse } from 'next/server'
import { Pool } from 'pg'

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
      // Simple query to see what workspaces exist
      const result = await client.query(`
        SELECT id, company_name, display_name, owner_id, created_at 
        FROM company_workspaces 
        ORDER BY created_at DESC
      `)
      
      return NextResponse.json({
        success: true,
        workspaces: result.rows,
        count: result.rows.length
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}