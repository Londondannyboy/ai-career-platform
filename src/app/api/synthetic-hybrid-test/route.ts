import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to verify hybrid intelligence APIs are working
 * GET /api/synthetic-hybrid-test
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasDataMagnetToken: !!process.env.DATAMAGNET_API_TOKEN,
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
    },
    tests: {
      datamagnetCompany: { status: 'pending' },
      datamagnetPeople: { status: 'pending' },
      apifyConnection: { status: 'pending' }
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
      results.tests.datamagnetCompany = {
        status: 'success',
        companyName: data.message?.company_name || 'Unknown',
        employees: data.message?.employees || 0
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
      results.tests.datamagnetPeople = {
        status: 'success',
        name: data.display_name || data.name || 'Unknown',
        title: data.job_title || data.headline || 'Unknown',
        hasRecommendations: !!data.recommendations?.length
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