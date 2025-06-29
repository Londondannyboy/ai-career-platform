import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing graph database credentials...')
    
    // Test environment variable availability
    const credentials = {
      neo4j: {
        uri: process.env.NEO4J_URI,
        username: process.env.NEO4J_USERNAME,
        hasPassword: !!process.env.NEO4J_PASSWORD,
        passwordPreview: process.env.NEO4J_PASSWORD ? 
          process.env.NEO4J_PASSWORD.substring(0, 4) + '...' : 'MISSING',
        database: process.env.NEO4J_DATABASE
      },
      rushdb: {
        hasApiToken: !!process.env.RUSHDB_API_TOKEN,
        tokenPreview: process.env.RUSHDB_API_TOKEN ? 
          process.env.RUSHDB_API_TOKEN.substring(0, 8) + '...' : 'MISSING',
        apiUrl: process.env.RUSHDB_API_URL
      }
    }

    // Check if we have basic connectivity requirements
    const readinessCheck = {
      neo4jReady: !!(credentials.neo4j.uri && credentials.neo4j.username && credentials.neo4j.hasPassword),
      rushdbReady: !!credentials.rushdb.hasApiToken,
      overallReady: false
    }
    
    readinessCheck.overallReady = readinessCheck.neo4jReady || readinessCheck.rushdbReady

    console.log('📊 Credential check results:', {
      neo4jReady: readinessCheck.neo4jReady,
      rushdbReady: readinessCheck.rushdbReady
    })

    return NextResponse.json({
      success: true,
      message: 'Credential check complete',
      credentials,
      readinessCheck,
      nextSteps: {
        neo4j: readinessCheck.neo4jReady ? 
          '✅ Neo4j credentials look good' : 
          '❌ Missing Neo4j password - get from console.neo4j.io',
        rushdb: readinessCheck.rushdbReady ? 
          '✅ RushDB token looks good' : 
          '❌ Missing RushDB API token - get from dashboard',
        overall: readinessCheck.overallReady ? 
          '🎉 Ready to test graph setup!' : 
          '⚠️ Need at least one database configured'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Credential check error:', error)
    
    return NextResponse.json({
      success: false,
      error: message,
      message: 'Failed to check credentials',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}