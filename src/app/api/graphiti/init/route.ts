import { NextRequest, NextResponse } from 'next/server'
import { graphitiService } from '@/lib/temporal/graphiti'

export const runtime = 'nodejs'

/**
 * Initialize Graphiti temporal knowledge graph
 * POST /api/graphiti/init
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🕐 Initializing Graphiti temporal knowledge graph...')
    
    await graphitiService.initialize()
    
    // Create some example temporal facts for testing
    const exampleFacts = [
      {
        subject: 'philip-aga',
        predicate: 'works_at',
        object: 'ck-delta',
        confidence: 0.95,
        validFrom: new Date('2023-01-01'),
        source: 'linkedin'
      },
      {
        subject: 'philip-aga',
        predicate: 'has_skill',
        object: 'artificial-intelligence',
        confidence: 0.9,
        validFrom: new Date('2020-01-01'),
        source: 'profile'
      },
      {
        subject: 'ck-delta',
        predicate: 'industry',
        object: 'technology',
        confidence: 1.0,
        validFrom: new Date('2015-01-01'),
        source: 'company-info'
      }
    ]
    
    const factIds = []
    for (const fact of exampleFacts) {
      const id = await graphitiService.storeFact(fact)
      factIds.push(id)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Graphiti initialized successfully',
      exampleFacts: factIds.length,
      features: [
        'Temporal fact tracking',
        'Entity resolution',
        'Episode memory',
        'Confidence decay',
        'Time-aware queries'
      ]
    })
    
  } catch (error) {
    console.error('Graphiti initialization error:', error)
    return NextResponse.json({
      error: 'Failed to initialize Graphiti',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get Graphiti status
 * GET /api/graphiti/init
 */
export async function GET() {
  try {
    // Check if temporal schema exists
    const testFacts = await graphitiService.getCurrentFacts('test-entity')
    
    return NextResponse.json({
      initialized: true,
      message: 'Graphiti is ready',
      capabilities: {
        temporalFacts: true,
        entityResolution: true,
        episodeTracking: true,
        confidenceDecay: true
      }
    })
  } catch (error) {
    return NextResponse.json({
      initialized: false,
      error: 'Graphiti not initialized',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}