import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/neo4j/client'

/**
 * Clean up duplicate profiles and standardize LinkedIn URLs
 * POST /api/neo4j-cleanup
 */
export async function POST(request: NextRequest) {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    const body = await request.json()
    const { action, username } = body
    
    if (action === 'cleanup-duplicates') {
      // Find all profiles for a person (e.g., Philip)
      const duplicates = await session.run(`
        MATCH (p:Person)
        WHERE p.name = $name OR p.linkedinUrl CONTAINS $username
        OPTIONAL MATCH (p)<-[:RECOMMENDS]-(rec:Person)
        OPTIONAL MATCH (p)-[:NETWORK_CLUSTER]->(net:Person)
        WITH p, COUNT(DISTINCT rec) as recCount, COUNT(DISTINCT net) as netCount
        ORDER BY recCount DESC, netCount DESC, p.lastUpdated DESC
        RETURN collect({
          node: p,
          recommendations: recCount,
          networkClusters: netCount
        }) as profiles
      `, { 
        name: 'Philip Agathangelou',
        username
      })
      
      const profiles = duplicates.records[0]?.get('profiles') || []
      
      if (profiles.length > 1) {
        // Keep the profile with most connections (first one)
        const keepProfile = profiles[0].node
        const deleteProfiles = profiles.slice(1)
        
        // Delete duplicate profiles
        for (const profile of deleteProfiles) {
          await session.run(`
            MATCH (p:Person {linkedinUrl: $url})
            DETACH DELETE p
          `, { url: profile.node.properties.linkedinUrl })
        }
        
        // Update the kept profile to have a standardized URL
        const standardUrl = `https://linkedin.com/in/${username}`
        await session.run(`
          MATCH (p:Person {linkedinUrl: $oldUrl})
          SET p.linkedinUrl = $newUrl,
              p.username = $username,
              p.standardized = true
          RETURN p
        `, { 
          oldUrl: keepProfile.properties.linkedinUrl,
          newUrl: standardUrl,
          username
        })
        
        return NextResponse.json({
          success: true,
          kept: keepProfile.properties,
          deleted: deleteProfiles.length,
          newUrl: standardUrl
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'No duplicates found'
        })
      }
    }
    
    if (action === 'standardize-url') {
      // Standardize a specific profile's URL
      const result = await session.run(`
        MATCH (p:Person)
        WHERE p.linkedinUrl CONTAINS $username
        WITH p ORDER BY p.lastUpdated DESC LIMIT 1
        SET p.linkedinUrl = $standardUrl,
            p.username = $username,
            p.standardized = true
        RETURN p
      `, {
        username,
        standardUrl: `https://linkedin.com/in/${username}`
      })
      
      if (result.records.length > 0) {
        return NextResponse.json({
          success: true,
          profile: result.records[0].get('p').properties
        })
      } else {
        return NextResponse.json({
          error: 'Profile not found'
        }, { status: 404 })
      }
    }
    
    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      error: 'Failed to cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await session.close()
  }
}