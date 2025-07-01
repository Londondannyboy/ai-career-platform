/**
 * Update Recommendation Direction Types
 * Add direction field to distinguish given vs received recommendations
 */

import { neo4jClient } from '@/lib/neo4j/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { analyze = false } = await request.json()

    if (analyze) {
      // Analyze current recommendations
      const analysis = await analyzeRecommendations()
      return NextResponse.json({
        message: 'Recommendation direction analysis',
        ...analysis
      })
    }

    // Update all recommendations with direction
    const result = await updateRecommendationDirections()
    
    return NextResponse.json({
      message: 'Recommendation directions updated successfully',
      ...result
    })

  } catch (error) {
    console.error('Recommendation direction update error:', error)
    return NextResponse.json(
      { error: 'Direction update failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function analyzeRecommendations() {
  const session = neo4jClient.session()
  
  try {
    // Get all recommendation relationships
    const query = `
      MATCH (recommender:Person)-[r:RECOMMENDED]->(recommended:Person)
      RETURN recommender.name as recommenderName, 
             recommended.name as recommendedName,
             r.text as text,
             r.direction as currentDirection
      LIMIT 20
    `
    
    const result = await session.run(query)
    
    const recommendations = result.records.map(record => ({
      recommender: record.get('recommenderName'),
      recommended: record.get('recommendedName'),
      text: record.get('text'),
      currentDirection: record.get('currentDirection')
    }))
    
    const totalQuery = `
      MATCH ()-[r:RECOMMENDED]->()
      RETURN count(r) as total
    `
    
    const totalResult = await session.run(totalQuery)
    const total = totalResult.records[0].get('total').toNumber()
    
    return {
      totalRecommendations: total,
      sampleRecommendations: recommendations,
      needsUpdate: recommendations.every(r => !r.currentDirection)
    }
    
  } finally {
    await session.close()
  }
}

async function updateRecommendationDirections() {
  const session = neo4jClient.session()
  
  try {
    // Update all RECOMMENDED relationships to have direction
    // The direction is from the perspective of the recommender
    // recommender GIVES recommendation TO recommended person
    const updateQuery = `
      MATCH (recommender:Person)-[r:RECOMMENDED]->(recommended:Person)
      WHERE r.direction IS NULL
      SET r.direction = 'given',
           r.directionFrom = recommender.name,
           r.directionTo = recommended.name
      RETURN count(r) as updated
    `
    
    const result = await session.run(updateQuery)
    const updated = result.records[0].get('updated').toNumber()
    
    // Create reverse relationships for "received" perspective
    const reverseQuery = `
      MATCH (recommender:Person)-[r:RECOMMENDED]->(recommended:Person)
      WHERE r.direction = 'given'
      CREATE (recommended)-[:RECEIVED_RECOMMENDATION {
        text: r.text,
        direction: 'received',
        directionFrom: recommender.name,
        directionTo: recommended.name,
        originalRecommendation: true,
        date: r.date
      }]->(recommender)
      RETURN count(*) as created
    `
    
    const reverseResult = await session.run(reverseQuery)
    const created = reverseResult.records[0].get('created').toNumber()
    
    return {
      recommendationsUpdated: updated,
      reverseRelationshipsCreated: created,
      totalProcessed: updated + created
    }
    
  } finally {
    await session.close()
  }
}

export async function GET() {
  const session = neo4jClient.session()
  
  try {
    // Show current recommendation statistics
    const statsQuery = `
      MATCH ()-[r:RECOMMENDED]->()
      WITH count(r) as givenCount
      MATCH ()-[r2:RECEIVED_RECOMMENDATION]->()
      RETURN givenCount, count(r2) as receivedCount
    `
    
    const result = await session.run(statsQuery)
    const stats = result.records[0]
    
    return NextResponse.json({
      message: 'Recommendation Direction Status',
      statistics: {
        givenRecommendations: stats ? stats.get('givenCount').toNumber() : 0,
        receivedRecommendations: stats ? stats.get('receivedCount').toNumber() : 0
      },
      colorCoding: {
        given: 'Green - Recommendations this person gave to others',
        received: 'Blue - Recommendations this person received from others'
      },
      usage: 'POST /api/recommendations/update-direction with {"analyze": true} to analyze first'
    })
    
  } finally {
    await session.close()
  }
}