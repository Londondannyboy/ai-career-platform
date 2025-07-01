import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/neo4j/client'

export async function GET(request: NextRequest) {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    // Direct query for Philip's relationships
    const result = await session.run(`
      MATCH (p:Person {linkedinUrl: 'https://linkedin.com/in/philipaga'})
      OPTIONAL MATCH (p)<-[r1:RECOMMENDS]-(recommender:Person)
      OPTIONAL MATCH (p)-[r2:NETWORK_CLUSTER]->(networked:Person)
      RETURN 
        p.name as name,
        p.linkedinUrl as url,
        COUNT(DISTINCT recommender) as recCount,
        COUNT(DISTINCT networked) as netCount,
        COLLECT(DISTINCT {
          name: recommender.name,
          rel: r1
        })[0..3] as recSample,
        COLLECT(DISTINCT {
          name: networked.name,
          rel: r2
        })[0..3] as netSample
    `)
    
    if (result.records.length === 0) {
      return NextResponse.json({ error: 'Philip not found with that URL' })
    }
    
    const record = result.records[0]
    
    return NextResponse.json({
      person: {
        name: record.get('name'),
        url: record.get('url'),
        recommendations: record.get('recCount').toNumber(),
        networkClusters: record.get('netCount').toNumber(),
        recSample: record.get('recSample'),
        netSample: record.get('netSample')
      }
    })
    
  } catch (error) {
    console.error('Relationships query error:', error)
    return NextResponse.json({
      error: 'Failed to query relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await session.close()
  }
}