import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/apollo-test
 * Apollo API test for people search and company employee discovery
 */
export async function POST(request: Request) {
  try {
    const { action, companyName, jobTitles, maxResults } = await request.json()
    
    console.log(`🚀 Apollo API Test: ${action}`)
    
    const apiKey = process.env.APOLLO_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'APOLLO_API_KEY environment variable not set'
      }, { status: 500 })
    }

    switch (action) {
      case 'test_health':
        return await testApolloHealth(apiKey)
      
      case 'search_company_employees':
        return await searchCompanyEmployees(companyName, jobTitles, maxResults, apiKey)
      
      case 'search_ck_delta':
        return await searchCKDeltaEmployees(apiKey)
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Apollo API test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Test Apollo API health and authentication
 */
async function testApolloHealth(apiKey: string) {
  try {
    console.log(`🔍 Testing Apollo API health`)
    console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`)
    
    const response = await fetch('https://api.apollo.io/v1/auth/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      }
    })

    console.log(`📡 Apollo health response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Apollo health error: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `Apollo health check failed: ${response.status}`,
        details: errorText
      })
    }

    const healthData = await response.json()
    console.log(`✅ Apollo health data:`, healthData)

    // Check if both values are true (as per Apollo docs)
    const isHealthy = Object.values(healthData).every(value => value === true)

    return NextResponse.json({
      success: true,
      health: healthData,
      isHealthy,
      message: isHealthy ? 'Apollo API is healthy' : 'Apollo API health check indicates issues',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`❌ Apollo health test failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Search for employees at a specific company
 */
async function searchCompanyEmployees(companyName: string, jobTitles: string[] = [], maxResults: number = 25, apiKey: string) {
  try {
    console.log(`👥 Searching for employees at ${companyName}`)
    console.log(`🎯 Job titles filter: ${jobTitles.join(', ') || 'All'}`)
    console.log(`📊 Max results: ${maxResults}`)
    
    const requestBody = {
      // Company filter
      organization_names: [companyName],
      
      // Job title filter (if specified)
      ...(jobTitles.length > 0 && { person_titles: jobTitles }),
      
      // Result limits
      page: 1,
      per_page: Math.min(maxResults, 100), // Apollo max 100 per page
      
      // Additional filters for better results
      person_locations: [], // Can add location filters
      organization_num_employees_ranges: [], // Can filter by company size
    }

    const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`📡 Apollo search response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Apollo search error: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `Apollo people search failed: ${response.status}`,
        details: errorText
      })
    }

    const searchData = await response.json()
    console.log(`✅ Apollo search success - found ${searchData.people?.length || 0} people`)
    
    // Process and structure the response
    const employees = searchData.people?.map((person: any) => ({
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      headline: person.headline,
      email: person.email,
      linkedin_url: person.linkedin_url,
      company: person.organization?.name,
      company_industry: person.organization?.industry,
      company_size: person.organization?.num_employees,
      location: person.city ? `${person.city}, ${person.state || person.country}` : null,
      seniority: person.seniority,
      departments: person.departments,
      functions: person.functions,
      apollo_id: person.id
    })) || []

    return NextResponse.json({
      success: true,
      company: companyName,
      totalFound: searchData.pagination?.total_entries || employees.length,
      employees,
      departments: extractDepartments(employees),
      seniorities: extractSeniorities(employees),
      metadata: {
        searchFilters: requestBody,
        resultsCount: employees.length,
        hasMoreResults: searchData.pagination?.total_entries > employees.length,
        creditsUsed: 1, // Apollo typically uses 1 credit per search
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error(`❌ Apollo company search failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Specific search for CK Delta employees
 */
async function searchCKDeltaEmployees(apiKey: string) {
  console.log(`🎯 Searching for CK Delta employees with targeted filters`)
  
  // Search with multiple variations of CK Delta
  const companyVariations = ['CKDelta', 'CK Delta', 'ckdelta']
  
  for (const companyName of companyVariations) {
    try {
      const result = await searchCompanyEmployees(
        companyName,
        [], // No job title filter for broader results
        50, // Higher limit for CK Delta
        apiKey
      )
      
      // Extract the JSON data from the NextResponse
      const resultData = await result.json()
      if (resultData.success && resultData.employees?.length > 0) {
        console.log(`✅ Found CK Delta employees using company name: ${companyName}`)
        return NextResponse.json(resultData)
      }
    } catch (error) {
      console.log(`⚠️ Failed to find employees for company variation: ${companyName}`)
    }
  }
  
  return NextResponse.json({
    success: false,
    error: 'No CK Delta employees found with any company name variation',
    searchedCompanies: companyVariations
  })
}

/**
 * Extract department breakdown from employee list
 */
function extractDepartments(employees: any[]): Record<string, number> {
  const departments: Record<string, number> = {}
  
  employees.forEach(emp => {
    const dept = emp.departments?.[0] || inferDepartmentFromTitle(emp.title) || 'Other'
    departments[dept] = (departments[dept] || 0) + 1
  })
  
  return departments
}

/**
 * Extract seniority breakdown from employee list
 */
function extractSeniorities(employees: any[]): Record<string, number> {
  const seniorities: Record<string, number> = {}
  
  employees.forEach(emp => {
    const seniority = emp.seniority || 'Unknown'
    seniorities[seniority] = (seniorities[seniority] || 0) + 1
  })
  
  return seniorities
}

/**
 * Infer department from job title if not provided by Apollo
 */
function inferDepartmentFromTitle(title: string): string {
  if (!title) return 'Other'
  
  const titleLower = title.toLowerCase()
  
  if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('technical')) {
    return 'Engineering'
  }
  if (titleLower.includes('product') || titleLower.includes(' pm ')) {
    return 'Product'
  }
  if (titleLower.includes('sales') || titleLower.includes('business development')) {
    return 'Sales'
  }
  if (titleLower.includes('marketing') || titleLower.includes('growth')) {
    return 'Marketing'
  }
  if (titleLower.includes('design') || titleLower.includes('ux') || titleLower.includes('ui')) {
    return 'Design'
  }
  if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('founder')) {
    return 'Executive'
  }
  if (titleLower.includes('data') || titleLower.includes('analytics')) {
    return 'Data'
  }
  
  return 'Other'
}

/**
 * GET /api/apollo-test
 * Get test status and configuration
 */
export async function GET() {
  const hasApiKey = !!process.env.APOLLO_API_KEY
  
  return NextResponse.json({
    status: 'operational',
    hasApiKey,
    endpoints: [
      'POST /api/apollo-test - Run Apollo API tests',
      'GET /api/apollo-test - Get test configuration'
    ],
    testActions: [
      'test_health',
      'search_company_employees', 
      'search_ck_delta'
    ],
    database: '210M+ contacts, 35M companies',
    version: '1.0.0'
  })
}