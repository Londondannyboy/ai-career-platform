import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/neo4j/client'

export async function GET(request: NextRequest) {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    // Get all Philip profiles
    const allPhilips = await session.run(`
      MATCH (p:Person)
      WHERE p.name = 'Philip Agathangelou' OR p.linkedinUrl CONTAINS 'philipaga'
      OPTIONAL MATCH (p)<-[r:RECOMMENDS]-(rec:Person)
      OPTIONAL MATCH (p)-[n:NETWORK_CLUSTER]->(net:Person)
      RETURN 
        p.linkedinUrl as url,
        p.name as name,
        p.lastUpdated as lastUpdated,
        COUNT(DISTINCT rec) as recs,
        COUNT(DISTINCT net) as nets,
        COLLECT(DISTINCT rec.name)[0..3] as recSample,
        COLLECT(DISTINCT net.name)[0..3] as netSample
      ORDER BY p.lastUpdated DESC
    `)
    
    return NextResponse.json({
      profiles: allPhilips.records.map(r => ({
        url: r.get('url'),
        name: r.get('name'),
        lastUpdated: r.get('lastUpdated'),
        recommendations: r.get('recs').toNumber(),
        networkClusters: r.get('nets').toNumber(),
        recSample: r.get('recSample'),
        netSample: r.get('netSample')
      }))
    })
    
  } catch (error) {
    console.error('Philip profiles error:', error)
    return NextResponse.json({
      error: 'Failed to query profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await session.close()
  }
}