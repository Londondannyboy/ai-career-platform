import { NextRequest, NextResponse } from 'next/server'
import { datamagnetGraph } from '@/lib/neo4j/datamagnet-graph'

/**
 * Store DataMagnet data in Neo4j
 * POST /api/datamagnet-to-neo4j
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({
        error: 'Type and data are required'
      }, { status: 400 })
    }

    let result
    
    switch (type) {
      case 'person':
        // Handle nested message structure from DataMagnet
        let personData = data
        if (data.message) {
          personData = data.message
        }
        result = await datamagnetGraph.storePersonProfile(personData)
        break
      
      case 'company':
        // Navigate through nested message structure for company data
        let companyData = data
        if (data.message) {
          let currentMessage = data.message
          while (currentMessage?.message) {
            currentMessage = currentMessage.message
          }
          companyData = currentMessage
        }
        result = await datamagnetGraph.storeCompany(companyData)
        break
      
      default:
        return NextResponse.json({
          error: 'Invalid type. Must be "person" or "company"'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error storing DataMagnet data in Neo4j:', error)
    return NextResponse.json({
      error: 'Failed to store data in Neo4j',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get graph data from Neo4j
 * GET /api/datamagnet-to-neo4j?type=person&url=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const url = searchParams.get('url')

    if (!type || !url) {
      return NextResponse.json({
        error: 'Type and URL are required'
      }, { status: 400 })
    }

    let result
    
    switch (type) {
      case 'person':
        result = await datamagnetGraph.getPersonGraph(url)
        break
      
      case 'company':
        result = await datamagnetGraph.getCompanyGraph(url)
        break
      
      default:
        return NextResponse.json({
          error: 'Invalid type. Must be "person" or "company"'
        }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({
        error: 'No data found in graph'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error fetching graph data:', error)
    return NextResponse.json({
      error: 'Failed to fetch graph data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}