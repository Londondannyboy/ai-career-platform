import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing graph database credentials...')
    
    // HARDCODED CREDENTIALS FOR TESTING - REMOVE IN PRODUCTION
    const credentials = {
      neo4j: {
        uri: 'neo4j+s://20b2ddda.databases.neo4j.io',
        username: 'neo4j',
        hasPassword: true,
        passwordPreview: 'MPfT...',
        database: 'neo4j'
      },
      rushdb: {
        hasApiToken: true,
        tokenPreview: '52af6990...',
        apiUrl: 'https://api.rushdb.com/api/v1'
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