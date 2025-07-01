import { NextRequest, NextResponse } from 'next/server'
import { neonClient } from '@/lib/vector/neonClient'
import { embeddingsService } from '@/lib/vector/embeddings'
import { datamagnetGraph } from '@/lib/neo4j/datamagnet-graph'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow 60 seconds for migration

/**
 * Migrate data from Neo4j to Neon.tech with embeddings
 * POST /api/migrate-to-neon
 */
export async function POST(request: NextRequest) {
  try {
    const { dataType = 'all' } = await request.json()
    
    console.log(`🚀 Starting migration to Neon.tech: ${dataType}`)
    
    const results = {
      companies: { total: 0, migrated: 0, errors: [] as any[] },
      people: { total: 0, migrated: 0, errors: [] as any[] }
    }
    
    // Migrate companies
    if (dataType === 'all' || dataType === 'companies') {
      console.log('📊 Fetching companies from Neo4j...')
      const companies = await datamagnetGraph.getCompanies(100) // Start with 100
      results.companies.total = companies.length
      
      for (const company of companies) {
        try {
          // Generate embedding for the company
          const embedding = await embeddingsService.generateCompanyEmbedding(company)
          
          // Store in Neon with embedding
          await neonClient.storeCompanyProfile(company, embedding)
          results.companies.migrated++
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          results.companies.errors.push({
            company: company.company_name || company.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }
    
    // Migrate people
    if (dataType === 'all' || dataType === 'people') {
      console.log('👥 Fetching people from Neo4j...')
      const people = await datamagnetGraph.getPeople(100) // Start with 100
      results.people.total = people.length
      
      for (const person of people) {
        try {
          // Generate embedding for the person
          const embedding = await embeddingsService.generatePersonEmbedding(person)
          
          // Store in Neon with embedding
          await neonClient.storePersonProfile(person, embedding)
          results.people.migrated++
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          results.people.errors.push({
            person: person.name || person.display_name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
      summary: {
        totalCompanies: results.companies.migrated,
        totalPeople: results.people.migrated,
        totalErrors: results.companies.errors.length + results.people.errors.length
      }
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get migration status
 * GET /api/migrate-to-neon
 */
export async function GET() {
  try {
    // Get counts from PostgreSQL
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    const client = await pool.connect()
    
    const [companies, people, documents] = await Promise.all([
      client.query('SELECT COUNT(*) FROM company_profiles'),
      client.query('SELECT COUNT(*) FROM person_profiles'),
      client.query('SELECT COUNT(*) FROM documents')
    ])
    
    client.release()
    await pool.end()
    
    return NextResponse.json({
      status: 'ready',
      counts: {
        companies: parseInt(companies.rows[0].count),
        people: parseInt(people.rows[0].count),
        documents: parseInt(documents.rows[0].count)
      },
      message: 'Use POST to start migration'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}