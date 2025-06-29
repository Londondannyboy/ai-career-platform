import { NextRequest, NextResponse } from 'next/server'
import graphService from '@/lib/graph'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const source = searchParams.get('source') as 'neo4j' | 'rushdb' | 'hybrid' || 'hybrid'

    console.log(`📊 Getting visualization data from: ${source}`)

    // Get visualization data
    const data = await graphService.getVisualizationData(source)

    // Add metadata
    const response = {
      success: true,
      source,
      data,
      metadata: {
        nodeCount: data.nodes?.length || 0,
        linkCount: data.links?.length || 0,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('❌ Visualization data error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: message,
      message: 'Failed to get visualization data',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Optional: POST endpoint for custom queries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, source = 'hybrid' } = body

    console.log(`🔍 Custom graph query: ${query}`)

    // This would implement custom query functionality
    // For now, return standard visualization data
    const data = await graphService.getVisualizationData(source)

    return NextResponse.json({
      success: true,
      query,
      source,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ Custom query error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: message,
      message: 'Failed to execute custom query',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}