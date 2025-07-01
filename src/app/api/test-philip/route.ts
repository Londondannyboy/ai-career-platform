import { NextRequest, NextResponse } from 'next/server'
import { datamagnetGraph } from '@/lib/neo4j/datamagnet-graph'

export async function GET(request: NextRequest) {
  try {
    // Test different URL formats
    const urls = [
      'https://linkedin.com/in/philipaga',
      'https://www.linkedin.com/in/philipaga',
      'https://linkedin.com/in/philipaga/',
      'https://www.linkedin.com/in/philipaga/'
    ]
    
    const results = []
    
    for (const url of urls) {
      try {
        const graphData = await datamagnetGraph.getPersonGraph(url)
        if (graphData) {
          results.push({
            url,
            found: true,
            name: graphData.person.name,
            recommendations: graphData.relationships.recommendations.length,
            networkClusters: graphData.relationships.networkClusters.length
          })
        } else {
          results.push({ url, found: false })
        }
      } catch (error) {
        results.push({ 
          url, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    return NextResponse.json({
      results,
      summary: {
        totalFound: results.filter(r => r.found).length,
        totalUrls: results.length
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}