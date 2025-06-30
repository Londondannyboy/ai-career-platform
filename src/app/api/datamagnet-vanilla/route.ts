import { NextRequest, NextResponse } from 'next/server'

/**
 * DataMagnet Vanilla API Test
 * Following their exact documentation: https://docs.datamagnet.co/people/
 * 
 * Exact implementation from their docs:
 * curl -X POST 'https://api.datamagnet.co/api/v1/linkedin/person' \
 * --header 'Authorization: Bearer {token}' \
 * --data '{"url": "https://linkedin.com/in/pratik-dani"}'
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({
        error: 'LinkedIn profile URL is required'
      }, { status: 400 })
    }

    // Try environment variables first, fallback to hardcoded for testing
    let token = process.env.DATAMAGNET_API_TOKEN || 
                process.env.NEXT_PUBLIC_DATAMAGNET_TOKEN ||
                process.env.datamagnet_api_token
    
    // Temporary fallback while debugging Vercel environment variables
    if (!token) {
      console.log('⚠️ Environment variables not found, using hardcoded token for testing')
      token = '2d7d15e9232a10e31ebb07242e79c4a4218b78ab430371d32ad657264103efe1'
    }
    
    console.log('🔍 Environment check:')
    console.log('- DATAMAGNET_API_TOKEN:', !!process.env.DATAMAGNET_API_TOKEN)
    console.log('- NEXT_PUBLIC_DATAMAGNET_TOKEN:', !!process.env.NEXT_PUBLIC_DATAMAGNET_TOKEN)
    console.log('- Using hardcoded fallback:', !process.env.DATAMAGNET_API_TOKEN)
    console.log('- Final token found:', !!token)

    console.log('🧪 DataMagnet Vanilla API Test - v2 with hardcoded fallback')
    console.log('📍 Endpoint: https://api.datamagnet.co/api/v1/linkedin/person')
    console.log('🌐 URL:', url)
    console.log('🔑 Token configured:', !!token)
    console.log('🔑 Token preview:', token ? token.substring(0, 10) + '...' : 'NOT_SET')

    // Exact implementation from DataMagnet documentation
    const response = await fetch('https://api.datamagnet.co/api/v1/linkedin/person', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url
      })
    })

    console.log('📡 DataMagnet Response Status:', response.status)
    console.log('📡 DataMagnet Response Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Raw Response:', responseText)

    if (!response.ok) {
      console.error('❌ DataMagnet API Error:', response.status, responseText)
      return NextResponse.json({
        error: `DataMagnet API error: ${response.status}`,
        details: responseText,
        statusCode: response.status
      }, { status: response.status })
    }

    // Parse the response
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse DataMagnet response:', parseError)
      return NextResponse.json({
        error: 'Failed to parse DataMagnet response',
        details: responseText
      }, { status: 500 })
    }

    console.log('✅ DataMagnet API Success!')
    console.log('📊 Response Data Keys:', Object.keys(data))

    // Return the exact response from DataMagnet
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ DataMagnet vanilla API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * GET endpoint for API status
 */
export async function GET() {
  const hasToken = !!process.env.DATAMAGNET_API_TOKEN
  
  return NextResponse.json({
    status: 'operational',
    hasToken,
    endpoint: 'https://api.datamagnet.co/api/v1/linkedin/person',
    method: 'POST',
    documentation: 'https://docs.datamagnet.co/people/',
    implementation: 'vanilla',
    version: '1.0.0'
  })
}