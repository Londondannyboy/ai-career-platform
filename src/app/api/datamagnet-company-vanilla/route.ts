import { NextRequest, NextResponse } from 'next/server'

/**
 * DataMagnet Company Vanilla API Test
 * Following their exact documentation: https://docs.datamagnet.co/company/
 * 
 * Exact implementation from their docs:
 * curl --location --request POST 'https://api.datamagnet.co/api/v1/linkedin/company' \
 * --header 'Authorization: Bearer {token}' \
 * --header 'Content-Type: application/json' \
 * --data-raw '{
 *     "url": "https://linkedin.com/company/apple"
 * }'
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, use_cache = 'if-recent' } = body

    if (!url) {
      return NextResponse.json({
        error: 'LinkedIn company URL is required'
      }, { status: 400 })
    }

    // Try multiple possible environment variable names
    const token = process.env.DATAMAGNET_API_TOKEN || 
                  process.env.NEXT_PUBLIC_DATAMAGNET_TOKEN ||
                  process.env.datamagnet_api_token
    
    console.log('🔍 Company API Environment check:')
    console.log('- DATAMAGNET_API_TOKEN:', !!process.env.DATAMAGNET_API_TOKEN)
    console.log('- NEXT_PUBLIC_DATAMAGNET_TOKEN:', !!process.env.NEXT_PUBLIC_DATAMAGNET_TOKEN)
    console.log('- Final token found:', !!token)
    
    if (!token) {
      return NextResponse.json({
        error: 'DataMagnet API token not configured in any environment variable',
        debug: {
          DATAMAGNET_API_TOKEN: !!process.env.DATAMAGNET_API_TOKEN,
          NEXT_PUBLIC_DATAMAGNET_TOKEN: !!process.env.NEXT_PUBLIC_DATAMAGNET_TOKEN,
          NODE_ENV: process.env.NODE_ENV
        }
      }, { status: 500 })
    }

    console.log('🏢 DataMagnet Company Vanilla API Test')
    console.log('📍 Endpoint: https://api.datamagnet.co/api/v1/linkedin/company')
    console.log('🌐 URL:', url)
    console.log('💾 Cache:', use_cache)
    console.log('🔑 Token:', token.substring(0, 10) + '...')

    // Exact implementation from DataMagnet Company documentation
    const response = await fetch('https://api.datamagnet.co/api/v1/linkedin/company', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        use_cache: use_cache
      })
    })

    console.log('📡 DataMagnet Company Response Status:', response.status)
    console.log('📡 DataMagnet Company Response Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Raw Company Response:', responseText)

    if (!response.ok) {
      console.error('❌ DataMagnet Company API Error:', response.status, responseText)
      return NextResponse.json({
        error: `DataMagnet Company API error: ${response.status}`,
        details: responseText,
        statusCode: response.status
      }, { status: response.status })
    }

    // Parse the response
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse DataMagnet Company response:', parseError)
      return NextResponse.json({
        error: 'Failed to parse DataMagnet Company response',
        details: responseText
      }, { status: 500 })
    }

    console.log('✅ DataMagnet Company API Success!')
    console.log('📊 Company Response Data Keys:', Object.keys(data))
    
    // Log company details if available
    if (data.message) {
      console.log('🏢 Company Name:', data.message.company_name)
      console.log('👥 Employees:', data.message.employees)
      console.log('🏭 Industry:', data.message.industry)
      console.log('📍 Location:', data.message.location)
    }

    // Return the exact response from DataMagnet
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ DataMagnet Company vanilla API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * GET endpoint for Company API status
 */
export async function GET() {
  const hasToken = !!process.env.DATAMAGNET_API_TOKEN
  
  return NextResponse.json({
    status: 'operational',
    hasToken,
    endpoint: 'https://api.datamagnet.co/api/v1/linkedin/company',
    method: 'POST',
    documentation: 'https://docs.datamagnet.co/company/',
    implementation: 'vanilla',
    cacheOptions: ['if-present', 'if-recent', 'never'],
    cost: '1 credit per successful request',
    version: '1.0.0'
  })
}