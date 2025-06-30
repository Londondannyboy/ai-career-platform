import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/datamagnet-test
 * Vanilla DataMagnet API test following their exact quickstart guide
 */
export async function POST(request: Request) {
  try {
    const { profileUrl, action } = await request.json()
    
    console.log(`🧪 DataMagnet Vanilla Test: ${action}`)
    
    const apiToken = process.env.DATAMAGNET_API_TOKEN
    
    if (!apiToken) {
      return NextResponse.json({
        success: false,
        error: 'DATAMAGNET_API_TOKEN environment variable not set'
      }, { status: 500 })
    }

    switch (action) {
      case 'test_person_extraction':
        return await testPersonExtraction(profileUrl, apiToken)
      
      case 'test_credits':
        return await testCreditsEndpoint(apiToken)
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ DataMagnet vanilla test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Test person extraction exactly as per DataMagnet quickstart
 */
async function testPersonExtraction(profileUrl: string, apiToken: string) {
  try {
    console.log(`🔍 Testing DataMagnet person extraction for: ${profileUrl}`)
    console.log(`🔑 Using token: ${apiToken.substring(0, 10)}...`)
    
    // Exact implementation from DataMagnet quickstart guide
    const response = await fetch('https://api.datamagnet.co/api/v1/linkedin/person', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: profileUrl
      })
    })

    console.log(`📡 DataMagnet response status: ${response.status}`)
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ DataMagnet error response: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `DataMagnet API error: ${response.status}`,
        details: errorText,
        statusCode: response.status
      })
    }

    const data = await response.json()
    console.log(`✅ DataMagnet success - received ${JSON.stringify(data).length} characters`)
    
    // Log key insights
    if (data.display_name) {
      console.log(`👤 Profile name: ${data.display_name}`)
    }
    if (data.current_company_name) {
      console.log(`🏢 Company: ${data.current_company_name}`)
    }
    if (data.recommendations?.length > 0) {
      console.log(`⭐ Found ${data.recommendations.length} recommendations`)
    }

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        profileUrl,
        dataSize: JSON.stringify(data).length,
        hasRecommendations: !!(data.recommendations?.length > 0),
        hasExperience: !!(data.experience?.length > 0),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error(`❌ DataMagnet person extraction failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Test credits endpoint
 */
async function testCreditsEndpoint(apiToken: string) {
  try {
    console.log(`💳 Testing DataMagnet credits endpoint`)
    
    const response = await fetch('https://api.datamagnet.co/api/v1/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 Credits response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Credits error: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `Credits API error: ${response.status}`,
        details: errorText
      })
    }

    const creditsData = await response.json()
    console.log(`✅ Credits data:`, creditsData)

    return NextResponse.json({
      success: true,
      credits: creditsData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`❌ Credits test failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * GET /api/datamagnet-test
 * Get test status and configuration
 */
export async function GET() {
  const hasApiToken = !!process.env.DATAMAGNET_API_TOKEN
  
  return NextResponse.json({
    status: 'operational',
    hasApiToken,
    endpoints: [
      'POST /api/datamagnet-test - Run vanilla API tests',
      'GET /api/datamagnet-test - Get test configuration'
    ],
    testActions: [
      'test_person_extraction',
      'test_credits'
    ],
    version: '1.0.0'
  })
}