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

    const token = process.env.DATAMAGNET_API_TOKEN
    if (!token) {
      return NextResponse.json({
        error: 'DataMagnet API token not configured'
      }, { status: 500 })
    }

    console.log('🧪 DataMagnet Vanilla API Test')
    console.log('📍 Endpoint: https://api.datamagnet.co/api/v1/linkedin/person')
    console.log('🌐 URL:', url)
    console.log('🔑 Token:', token.substring(0, 10) + '...')

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