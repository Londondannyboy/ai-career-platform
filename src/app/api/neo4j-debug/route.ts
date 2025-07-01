import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/neo4j/client'

/**
 * Debug Neo4j data
 * GET /api/neo4j-debug
 */
export async function GET(request: NextRequest) {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    // Count all nodes and relationships
    const counts = await session.run(`
      MATCH (p:Person)
      OPTIONAL MATCH (p)-[r:RECOMMENDS]->()
      OPTIONAL MATCH (p)-[n:NETWORK_CLUSTER]->()
      OPTIONAL MATCH (p)-[w:WORKS_AT]->()
      RETURN 
        COUNT(DISTINCT p) as personCount,
        COUNT(DISTINCT r) as recommendsCount,
        COUNT(DISTINCT n) as networkCount,
        COUNT(DISTINCT w) as worksAtCount
    `)
    
    // Get Philip's specific data - find the most recent Philip profile
    const philipData = await session.run(`
      MATCH (p:Person)
      WHERE p.name = 'Philip Agathangelou' OR p.linkedinUrl CONTAINS 'philipaga'
      WITH p ORDER BY p.lastUpdated DESC LIMIT 1
      OPTIONAL MATCH (p)<-[r:RECOMMENDS]-(recommender:Person)
      OPTIONAL MATCH (p)-[n:NETWORK_CLUSTER]->(networked:Person)
      RETURN 
        p.linkedinUrl as url,
        p.name as name,
        COUNT(DISTINCT recommender) as recommenderCount,
        COUNT(DISTINCT networked) as networkedCount,
        COLLECT(DISTINCT recommender.name)[0..5] as sampleRecommenders,
        COLLECT(DISTINCT networked.name)[0..5] as sampleNetworked
    `)
    
    // Get all person nodes
    const allPersons = await session.run(`
      MATCH (p:Person)
      RETURN p.name as name, p.linkedinUrl as url
      LIMIT 20
    `)
    
    const countsRecord = counts.records[0]
    const philipRecord = philipData.records[0]
    
    return NextResponse.json({
      counts: {
        persons: countsRecord?.get('personCount')?.toNumber() || 0,
        recommendations: countsRecord?.get('recommendsCount')?.toNumber() || 0,
        networkClusters: countsRecord?.get('networkCount')?.toNumber() || 0,
        worksAt: countsRecord?.get('worksAtCount')?.toNumber() || 0
      },
      philip: philipRecord ? {
        url: philipRecord.get('url'),
        name: philipRecord.get('name'),
        recommenders: philipRecord.get('recommenderCount')?.toNumber() || 0,
        networked: philipRecord.get('networkedCount')?.toNumber() || 0,
        sampleRecommenders: philipRecord.get('sampleRecommenders'),
        sampleNetworked: philipRecord.get('sampleNetworked')
      } : null,
      samplePersons: allPersons.records.map(r => ({
        name: r.get('name'),
        url: r.get('url')
      }))
    })
    
  } catch (error) {
    console.error('Neo4j debug error:', error)
    return NextResponse.json({
      error: 'Failed to query Neo4j',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await session.close()
  }
}