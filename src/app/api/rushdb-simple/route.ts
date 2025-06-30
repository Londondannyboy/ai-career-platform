import { NextRequest, NextResponse } from 'next/server'
import simpleRushDBService from '@/lib/graph/rushdb-simple'

export async function POST() {
  try {
    console.log('🧪 Testing simple RushDB implementation...')
    
    // Create test data
    await simpleRushDBService.createTestData()
    
    return NextResponse.json({
      success: true,
      message: 'Simple RushDB test data created',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Simple RushDB test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('📊 Getting simple RushDB visualization data...')
    
    const data = await simpleRushDBService.getVisualizationData()
    
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        nodeCount: data.nodes.length,
        linkCount: data.links.length
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Simple RushDB query failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { nodes: [], links: [] },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}