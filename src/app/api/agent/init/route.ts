import { NextRequest, NextResponse } from 'next/server'
import { neonClient } from '@/lib/vector/neonClient'

/**
 * Initialize Neon.tech database with pgvector
 * POST /api/agent/init
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing Neon.tech database with pgvector...')
    
    // Check if database URL is configured
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json({
        error: 'NEON_DATABASE_URL not configured',
        instructions: 'Please add NEON_DATABASE_URL to your .env.local file. See NEON_SETUP_GUIDE.md for details.'
      }, { status: 500 })
    }
    
    // Initialize database
    await neonClient.initialize()
    
    return NextResponse.json({
      success: true,
      message: 'Neon.tech database initialized successfully',
      tables: [
        'documents (general document storage with vectors)',
        'company_profiles (company-specific data)',
        'person_profiles (person-specific data)'
      ],
      features: [
        'pgvector extension enabled',
        'Full-text search enabled',
        'Optimized indexes created',
        'Ready for hybrid search'
      ]
    })
    
  } catch (error) {
    console.error('Database initialization error:', error)
    
    // Provide helpful error messages
    if (error.message?.includes('connect')) {
      return NextResponse.json({
        error: 'Failed to connect to Neon.tech',
        details: 'Please check your NEON_DATABASE_URL in .env.local',
        help: 'Make sure the connection string is correct and the database is accessible'
      }, { status: 500 })
    }
    
    if (error.message?.includes('permission')) {
      return NextResponse.json({
        error: 'Permission denied',
        details: 'Your database user may not have permission to create extensions',
        help: 'Enable pgvector extension manually in Neon dashboard SQL editor: CREATE EXTENSION vector;'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Check database status
 * GET /api/agent/init
 */
export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json({
        configured: false,
        message: 'NEON_DATABASE_URL not configured'
      })
    }
    
    // Simple connectivity test
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    const client = await pool.connect()
    
    // Check if pgvector is installed
    const vectorCheck = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `)
    
    // Check tables
    const tableCheck = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('documents', 'company_profiles', 'person_profiles')
    `)
    
    client.release()
    await pool.end()
    
    return NextResponse.json({
      configured: true,
      connected: true,
      pgvector: vectorCheck.rows.length > 0,
      tables: tableCheck.rows.map(r => r.tablename),
      status: tableCheck.rows.length === 3 ? 'ready' : 'needs_initialization'
    })
    
  } catch (error) {
    return NextResponse.json({
      configured: !!process.env.NEON_DATABASE_URL,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}