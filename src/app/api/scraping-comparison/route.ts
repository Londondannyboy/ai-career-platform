import { NextResponse } from 'next/server'
import { getApifyService } from '@/lib/apify'
import { getDataMagnetCompanyService } from '@/lib/datamagnet/company'
import { getDataMagnetPeopleService } from '@/lib/datamagnet/people'

export const runtime = 'nodejs'

/**
 * POST /api/scraping-comparison
 * Compare DataMagnet vs Apify scraping for the same company
 */
export async function POST(request: Request) {
  try {
    const { company, companyUrl, action } = await request.json()
    
    console.log(`🔬 Scraping Comparison API: ${action} for ${company}`)
    
    switch (action) {
      case 'compare_company_data':
        return await handleCompareCompanyData(company, companyUrl)
      
      case 'test_both_connections':
        return await handleTestConnections()
      
      case 'compare_single_profile':
        const { profileUrl } = await request.json()
        return await handleCompareProfileData(profileUrl)
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Scraping Comparison API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * Compare company data from both DataMagnet and Apify
 */
async function handleCompareCompanyData(company: string, companyUrl?: string) {
  const results = {
    company,
    companyUrl,
    dataMagnet: null as any,
    apify: null as any,
    comparison: null as any,
    startTime: new Date().toISOString(),
    endTime: null as any
  }

  try {
    console.log(`🏢 Starting company data comparison for ${company}`)
    
    // Test DataMagnet Company API
    console.log('📊 Testing DataMagnet Company API...')
    try {
      const dataMagnetService = getDataMagnetCompanyService()
      const dmResult = await dataMagnetService.extractCompany(
        companyUrl || `https://www.linkedin.com/company/${company.toLowerCase().replace(/\s/g, '-')}`
      )
      
      results.dataMagnet = {
        success: dmResult.success,
        data: dmResult.company,
        employeeCount: dmResult.employeeCount,
        creditsUsed: dmResult.creditsUsed,
        upgradeRequired: dmResult.upgradeRequired,
        error: dmResult.error,
        dataRichness: dmResult.company ? calculateDataRichness(dmResult.company, 'company') : 0
      }
    } catch (error) {
      results.dataMagnet = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        dataRichness: 0
      }
    }

    // Test Apify (bebity) API
    console.log('🔍 Testing Apify bebity scraper...')
    try {
      const apifyService = getApifyService()
      const apifyResult = await apifyService.scrapeCompanyEmployees(
        company,
        companyUrl || `${company.toLowerCase().replace(/\s/g, '')}.com`,
        25
      )
      
      results.apify = {
        success: true,
        data: apifyResult,
        employeeCount: apifyResult.employees?.length || 0,
        totalEmployeesFound: apifyResult.totalFound,
        confidence: apifyResult.confidence,
        dataRichness: apifyResult ? calculateDataRichness(apifyResult, 'apify') : 0
      }
    } catch (error) {
      results.apify = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        dataRichness: 0
      }
    }

    // Generate comparison analysis
    results.comparison = generateComparisonAnalysis(results.dataMagnet, results.apify)
    results.endTime = new Date().toISOString()

    return NextResponse.json({
      success: true,
      results,
      summary: generateComparisonSummary(results)
    })

  } catch (error) {
    console.error(`❌ Company comparison failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results
    }, { status: 500 })
  }
}

/**
 * Test connections to both services
 */
async function handleTestConnections() {
  const results = {
    dataMagnet: null as any,
    apify: null as any,
    timestamp: new Date().toISOString()
  }

  try {
    // Test DataMagnet
    const dataMagnetService = getDataMagnetCompanyService()
    const dmConnection = await dataMagnetService.testConnection()
    results.dataMagnet = dmConnection

    // Test Apify
    const apifyService = getApifyService()
    const apifyConnection = await apifyService.testConnection()
    results.apify = { connected: apifyConnection }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results
    }, { status: 500 })
  }
}

/**
 * Compare profile data extraction
 */
async function handleCompareProfileData(profileUrl: string) {
  const results = {
    profileUrl,
    dataMagnet: null as any,
    comparison: null as any
  }

  try {
    // Test DataMagnet People API
    const dataMagnetPeopleService = getDataMagnetPeopleService()
    const dmResult = await dataMagnetPeopleService.extractProfile(profileUrl)
    
    results.dataMagnet = {
      success: dmResult.success,
      profile: dmResult.profile,
      creditsUsed: dmResult.creditsUsed,
      error: dmResult.error,
      dataRichness: dmResult.profile ? calculateDataRichness(dmResult.profile, 'profile') : 0
    }

    // Note: Individual profile comparison with Apify would require different approach
    // as bebity is company-focused
    
    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results
    }, { status: 500 })
  }
}

/**
 * Calculate data richness score based on available fields
 */
function calculateDataRichness(data: any, type: 'company' | 'profile' | 'apify'): number {
  if (!data) return 0

  let score = 0
  let maxScore = 0

  if (type === 'company') {
    const fields = [
      'name', 'description', 'industry', 'headquarters', 'website',
      'employees', 'followers', 'founded_year', 'company_size',
      'specialities', 'locations', 'recent_posts', 'logo_url'
    ]
    
    fields.forEach(field => {
      maxScore++
      const value = data[field] || data[field.replace('_', '')]
      if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        score++
      }
    })
  } else if (type === 'profile') {
    const fields = [
      'name', 'headline', 'summary', 'current_position', 'experience',
      'education', 'skills', 'connections', 'recent_posts'
    ]
    
    fields.forEach(field => {
      maxScore++
      if (data[field] && data[field] !== '' && (!Array.isArray(data[field]) || data[field].length > 0)) {
        score++
      }
    })
  }

  return Math.round((score / maxScore) * 100)
}

/**
 * Generate detailed comparison analysis
 */
function generateComparisonAnalysis(dataMagnet: any, apify: any) {
  const analysis = {
    winner: null as any,
    strengths: {
      dataMagnet: [] as string[],
      apify: [] as string[]
    },
    weaknesses: {
      dataMagnet: [] as string[],
      apify: [] as string[]
    },
    recommendations: [] as string[]
  }

  // DataMagnet Analysis
  if (dataMagnet?.success) {
    analysis.strengths.dataMagnet.push('Rich company profile data')
    analysis.strengths.dataMagnet.push('Employee list with profile images')
    analysis.strengths.dataMagnet.push('Recent company posts and activity')
    analysis.strengths.dataMagnet.push('Detailed company metrics (followers, etc.)')
    analysis.strengths.dataMagnet.push('Multiple office locations')
    analysis.strengths.dataMagnet.push('Company specialties and industry data')
  } else if (dataMagnet?.upgradeRequired) {
    analysis.weaknesses.dataMagnet.push('Requires paid plan for company data')
  } else {
    analysis.weaknesses.dataMagnet.push('API connection failed')
  }

  // Apify Analysis
  if (apify?.success) {
    analysis.strengths.apify.push('No account restrictions (works on free tier)')
    analysis.strengths.apify.push('Company-level employee scraping')
    analysis.strengths.apify.push('No cookies/credentials required')
  } else {
    analysis.weaknesses.apify.push('API connection or scraping failed')
  }

  // Determine winner
  if (dataMagnet?.dataRichness > apify?.dataRichness && dataMagnet?.success) {
    analysis.winner = 'DataMagnet'
    analysis.recommendations.push('DataMagnet provides significantly richer data')
  } else if (apify?.success && !dataMagnet?.success) {
    analysis.winner = 'Apify'
    analysis.recommendations.push('Apify is more accessible for testing/development')
  } else {
    analysis.winner = 'Tie'
    analysis.recommendations.push('Both services have different strengths')
  }

  return analysis
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(results: any) {
  const dmSuccess = results.dataMagnet?.success
  const apifySuccess = results.apify?.success
  
  return {
    dataMagnetStatus: dmSuccess ? 'Success' : (results.dataMagnet?.upgradeRequired ? 'Upgrade Required' : 'Failed'),
    apifyStatus: apifySuccess ? 'Success' : 'Failed',
    recommendedService: results.comparison?.winner || 'Unknown',
    dataQualityWinner: results.dataMagnet?.dataRichness > results.apify?.dataRichness ? 'DataMagnet' : 'Apify',
    accessibilityWinner: apifySuccess && !dmSuccess ? 'Apify' : 'DataMagnet'
  }
}

/**
 * GET endpoint for service status
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    services: ['DataMagnet Company API', 'DataMagnet People API', 'Apify bebity Scraper'],
    endpoints: [
      'POST /api/scraping-comparison - Compare services',
      'GET /api/scraping-comparison - Service status'
    ],
    version: '1.0.0'
  })
}