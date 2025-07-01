/**
 * Quest - Web Intelligence Health Check API
 * Monitor status of Linkup.so and Serper.dev integrations
 */

import { webIntelligenceRouter } from '@/lib/web/webIntelligenceRouter'
import { linkupClient } from '@/lib/web/linkupClient'
import { serperClient } from '@/lib/web/serperClient'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test all providers
    const healthCheck = await webIntelligenceRouter.healthCheck()
    
    // Individual provider tests
    const [linkupTest, serperTest] = await Promise.allSettled([
      testLinkupDetailed(),
      testSerperDetailed()
    ])

    const totalTime = Date.now() - startTime

    return NextResponse.json({
      status: healthCheck.overall ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      totalCheckTime: totalTime,
      providers: {
        linkup: {
          status: healthCheck.linkup ? 'healthy' : 'down',
          details: linkupTest.status === 'fulfilled' ? linkupTest.value : { error: 'Connection failed' }
        },
        serper: {
          status: healthCheck.serper ? 'healthy' : 'down',
          details: serperTest.status === 'fulfilled' ? serperTest.value : { error: 'Connection failed' }
        }
      },
      capabilities: {
        jobSearch: healthCheck.overall,
        companyResearch: healthCheck.linkup, // Primarily uses Linkup
        fastSearch: healthCheck.serper,
        hybridSearch: healthCheck.overall,
        streamingSearch: healthCheck.overall
      },
      questMetadata: {
        apiVersion: '1.0',
        healthCheckId: `health-${Date.now()}`,
        recommendations: generateRecommendations(healthCheck)
      }
    })

  } catch (error) {
    console.error('Web intelligence health check error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        providers: {
          linkup: { status: 'unknown' },
          serper: { status: 'unknown' }
        }
      },
      { status: 500 }
    )
  }
}

async function testLinkupDetailed() {
  try {
    const startTime = Date.now()
    const result = await linkupClient.search({
      query: 'test search',
      depth: 'standard',
      outputType: 'sourcedAnswer'
    })
    
    return {
      responseTime: Date.now() - startTime,
      apiKey: 'configured',
      sourcesReturned: result.sources?.length || 0,
      hasAnswer: !!result.answer,
      lastTested: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Linkup test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function testSerperDetailed() {
  try {
    const startTime = Date.now()
    const result = await serperClient.search({
      query: 'test search',
      type: 'search',
      num: 3
    })
    
    return {
      responseTime: Date.now() - startTime,
      apiKey: 'configured',
      resultsReturned: result.organic?.length || 0,
      totalResults: result.searchInformation?.totalResults || 0,
      lastTested: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Serper test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function generateRecommendations(healthCheck: any) {
  const recommendations = []
  
  if (!healthCheck.linkup && !healthCheck.serper) {
    recommendations.push('Both providers are down - check API keys and network connectivity')
  } else if (!healthCheck.linkup) {
    recommendations.push('Linkup is down - deep research capabilities limited, using Serper fallback')
  } else if (!healthCheck.serper) {
    recommendations.push('Serper is down - fast search capabilities limited, using Linkup for all queries')
  } else {
    recommendations.push('All systems operational - full Quest web intelligence available')
  }
  
  return recommendations
}