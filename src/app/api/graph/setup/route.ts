import { NextResponse } from 'next/server'
import graphService from '@/lib/graph'

export async function POST() {
  try {
    console.log('🚀 Setting up graph databases...')

    // Get configuration from environment variables
    const config = {
      neo4j: process.env.NEO4J_URI ? {
        uri: process.env.NEO4J_URI!,
        username: process.env.NEO4J_USERNAME!,
        password: process.env.NEO4J_PASSWORD!,
        database: process.env.NEO4J_DATABASE || 'neo4j'
      } : undefined,
      rushdb: process.env.RUSHDB_API_TOKEN ? {
        apiToken: process.env.RUSHDB_API_TOKEN!,
        apiUrl: process.env.RUSHDB_API_URL
      } : undefined
    }

    // Check if we have any valid configuration
    if (!config.neo4j && !config.rushdb) {
      return NextResponse.json({
        success: false,
        error: 'No graph database credentials found in environment variables',
        message: 'Please configure NEO4J_* or RUSHDB_* environment variables'
      }, { status: 400 })
    }

    // Initialize graph services
    await graphService.initializeAll(config)

    // Set up TechFlow test data
    await graphService.setupTechFlowTestData()

    // Get connection status
    const status = graphService.getConnectionStatus()

    return NextResponse.json({
      success: true,
      message: 'Graph databases initialized successfully',
      status,
      setupData: 'TechFlow Solutions test data created',
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ Graph setup error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({
      success: false,
      error: message,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Return current connection status
    const status = graphService.getConnectionStatus()
    
    return NextResponse.json({
      success: true,
      status,
      message: status.anyConnected ? 'Graph services connected' : 'No graph services connected',
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ Graph status error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}