import { NextRequest, NextResponse } from 'next/server'

/**
 * Public test endpoint to verify hybrid intelligence APIs are working
 * GET /api/public/synthetic-test
 * 
 * This is a public endpoint that bypasses Clerk authentication
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasDataMagnetToken: !!process.env.DATAMAGNET_API_TOKEN,
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
      usingFallbackToken: !process.env.DATAMAGNET_API_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    },
    tests: {
      datamagnetCompany: { status: 'pending' } as any,
      datamagnetPeople: { status: 'pending' } as any,
      apifyConnection: { status: 'pending' } as any
    }
  }

  // Test DataMagnet Company API
  try {
    const token = process.env.DATAMAGNET_API_TOKEN || '2d7d15e9232a10e31ebb07242e79c4a4218b78ab430371d32ad657264103efe1'
    const response = await fetch('https://api.datamagnet.co/api/v1/linkedin/company', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://linkedin.com/company/ckdelta',
        use_cache: 'if-recent'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('DataMagnet Company Response:', JSON.stringify(data))
      
      // Navigate through nested message structure
      let currentMessage = data.message
      while (currentMessage?.message) {
        currentMessage = currentMessage.message
      }
      
      // Extract company data from the innermost message
      const companyName = currentMessage?.company_name || 'Unknown'
      const employees = currentMessage?.employees || 0
      
      results.tests.datamagnetCompany = {
        status: 'success',
        companyName,
        employees,
        rawDataKeys: Object.keys(data).join(', ')
      }
    } else {
      results.tests.datamagnetCompany = {
        status: 'error',
        code: response.status,
        message: await response.text()
      }
    }
  } catch (error) {
    results.tests.datamagnetCompany = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test DataMagnet People API
  try {
    const token = process.env.DATAMAGNET_API_TOKEN || '2d7d15e9232a10e31ebb07242e79c4a4218b78ab430371d32ad657264103efe1'
    const response = await fetch('https://api.datamagnet.co/api/v1/linkedin/person', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://linkedin.com/in/philipaga'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('DataMagnet People Response:', JSON.stringify(data))
      
      // Extract person data directly from message
      const profileData = data.message || data
      
      const name = profileData.display_name || 
                   profileData.name ||
                   profileData.full_name ||
                   'Unknown'
      
      const title = profileData.job_title || 
                    profileData.profile_headline ||
                    profileData.headline ||
                    'Unknown'
      
      results.tests.datamagnetPeople = {
        status: 'success',
        name,
        title,
        hasRecommendations: !!data.recommendations?.length,
        rawDataKeys: Object.keys(data).join(', ')
      }
    } else {
      results.tests.datamagnetPeople = {
        status: 'error',
        code: response.status,
        message: await response.text()
      }
    }
  } catch (error) {
    results.tests.datamagnetPeople = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test Apify connection
  try {
    if (!process.env.APIFY_API_TOKEN) {
      results.tests.apifyConnection = {
        status: 'skipped',
        message: 'APIFY_API_TOKEN not set'
      }
    } else {
      const { getApifyService } = await import('@/lib/apify')
      const apifyService = getApifyService()
      const connected = await apifyService.testConnection()
      
      results.tests.apifyConnection = {
        status: connected ? 'success' : 'error',
        connected
      }
    }
  } catch (error) {
    results.tests.apifyConnection = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return NextResponse.json(results)
}