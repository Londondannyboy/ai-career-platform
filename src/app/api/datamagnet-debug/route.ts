import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/datamagnet-debug
 * Debug endpoint to see the raw DataMagnet API response structure
 */
export async function POST(request: Request) {
  try {
    const { profileUrl } = await request.json()
    
    console.log('🔍 DataMagnet Debug - Testing raw API response')
    console.log('📍 Profile URL:', profileUrl)
    
    const apiToken = process.env.DATAMAGNET_API_TOKEN
    
    if (!apiToken) {
      return NextResponse.json({
        success: false,
        error: 'DATAMAGNET_API_TOKEN not configured'
      }, { status: 500 })
    }

    // Make the exact API call
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

    console.log('📡 Response Status:', response.status)
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Raw Response Text Length:', responseText.length)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('❌ Failed to parse response as JSON')
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON response',
        rawResponse: responseText.substring(0, 500)
      })
    }

    // Log the structure of the response
    console.log('🔑 Top-level keys:', Object.keys(data))
    
    // Log specific fields we're looking for
    const fieldsToCheck = [
      'display_name',
      'displayName', 
      'name',
      'full_name',
      'fullName',
      'person_name',
      'personName',
      'profile_headline',
      'profileHeadline',
      'headline',
      'current_company_name',
      'currentCompanyName',
      'company_name',
      'companyName',
      'company',
      'job_title',
      'jobTitle',
      'title'
    ]
    
    console.log('🔍 Checking for common field names:')
    for (const field of fieldsToCheck) {
      if (data[field]) {
        console.log(`  ✅ ${field}: "${data[field]}"`)
      }
    }
    
    // If the data is nested, check common nesting patterns
    if (data.data) {
      console.log('📦 Found nested "data" object with keys:', Object.keys(data.data))
    }
    if (data.result) {
      console.log('📦 Found nested "result" object with keys:', Object.keys(data.result))
    }
    if (data.profile) {
      console.log('📦 Found nested "profile" object with keys:', Object.keys(data.profile))
    }
    
    // Return the full structure for inspection
    return NextResponse.json({
      success: true,
      structure: {
        topLevelKeys: Object.keys(data),
        sampleData: {
          // Show first few fields
          ...Object.fromEntries(
            Object.entries(data).slice(0, 10).map(([key, value]) => [
              key,
              typeof value === 'string' ? value : 
              typeof value === 'object' ? `[${typeof value}]` : value
            ])
          )
        },
        fullResponse: data
      }
    })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}