import { NextResponse } from 'next/server'
import graphService from '@/lib/graph'

export async function POST() {
  try {
    console.log('🚀 Setting up graph databases...')

    // HARDCODED CREDENTIALS FOR TESTING - REMOVE IN PRODUCTION
    const config = {
      neo4j: {
        uri: 'neo4j+s://20b2ddda.databases.neo4j.io',
        username: 'neo4j',
        password: 'MPfTn0be2NxKxrnM7EZ5bUGrzVb_ZxM4CGnXUWp1ylw',
        database: 'neo4j'
      },
      rushdb: {
        apiToken: '52af6990442d68cb2c1994af0fb1b633DjFdMF5cNkkw+NGtKDsyIJ2RRlGyqn5f98CkP1lX68qMDURf4LT7OfOAdaGWDCZ+',
        apiUrl: 'https://api.rushdb.com/api/v1'
      }
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