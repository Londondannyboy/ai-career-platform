/**
 * Company Enrichment API - Apify-first architecture
 * Supports: company name search, LinkedIn company URL, or direct company identifier
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApifyService } from '@/lib/apify/apifyService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyIdentifier, // Company name, LinkedIn URL, or company ID
      searchType = 'auto', // 'auto', 'name', 'linkedin_url', 'company_id'
      options = {}
    } = body;

    if (!companyIdentifier) {
      return NextResponse.json(
        { error: 'Company identifier is required' },
        { status: 400 }
      );
    }

    console.log(`🔥 Starting Apify-first enrichment for: ${companyIdentifier}`);

    // Step 1: Create Apify service
    const apifyService = createApifyService();
    if (!apifyService) {
      // Debug environment variables
      const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
      const debugInfo = {
        APIFY_TOKEN: !!process.env.APIFY_TOKEN,
        APIFY_API_KEY: !!process.env.APIFY_API_KEY,
        APIFY_HARVEST_ACTOR_ID: process.env.APIFY_HARVEST_ACTOR_ID || 'missing',
        tokenLength: token ? token.length : 0,
        usingApiKey: !!process.env.APIFY_API_KEY && !process.env.APIFY_TOKEN
      };
      
      console.error('❌ Apify service not configured:', debugInfo);
      
      return NextResponse.json(
        { 
          error: 'Apify service not configured',
          debug: debugInfo,
          help: 'Check environment variables: APIFY_TOKEN and APIFY_HARVEST_ACTOR_ID'
        },
        { status: 500 }
      );
    }

    // Step 2: Run HarvestAPI company enrichment directly (no URL resolution needed)
    console.log(`📊 Running HarvestAPI enrichment for company: ${companyIdentifier}`);
    
    let networkData;
    try {
      networkData = await apifyService.enrichWithHarvestAPI(companyIdentifier, {
        maxEmployees: options.maxEmployees || 25
      });
      console.log(`✅ HarvestAPI returned data:`, JSON.stringify(networkData, null, 2));
    } catch (harvestError) {
      console.error('❌ HarvestAPI enrichment failed:', harvestError);
      return NextResponse.json({
        error: 'HarvestAPI enrichment failed',
        details: harvestError instanceof Error ? harvestError.message : 'Unknown HarvestAPI error'
      }, { status: 500 });
    }

    // Step 3: Transform to Neo4j format directly from HarvestAPI data
    let employees;
    try {
      if (!networkData.employees || !Array.isArray(networkData.employees)) {
        const dataType = typeof networkData.employees;
        const dataLength = Array.isArray(networkData.employees) ? networkData.employees.length : 'N/A';
        throw new Error(`Invalid employees data: ${dataType}, length: ${dataLength}`);
      }
      
      employees = networkData.employees.map((emp, index) => {
        console.log(`🔄 Transforming employee ${index}:`, JSON.stringify(emp, null, 2));
        return {
          name: emp.name || 'Unknown',
          title: emp.headline || emp.title || '',
          linkedin_url: emp.profileUrl || '',
          profileImage: null, // HarvestAPI doesn't provide profile images
          summary: emp.summary || '',
          experience: emp.experience || [],
          education: emp.education || [],
          skills: emp.skills || [],
          recommendations: emp.recommendations || [],
          connections: emp.connections || []
        };
      });
      console.log(`✅ Transformed ${employees.length} employees successfully`);
    } catch (transformError) {
      console.error('❌ Data transformation failed:', transformError);
      return NextResponse.json({
        error: 'Data transformation failed',
        details: transformError instanceof Error ? transformError.message : 'Unknown transformation error',
        rawData: networkData
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        companyName: networkData.companyName,
        enrichmentType: 'apify_harvest',
        profilesEnriched: networkData.employees.length,
        networkAnalysis: {
          internalConnections: networkData.internalConnections,
          externalInfluencers: networkData.externalInfluencers,
          connectionStrength: networkData.internalConnections.length > 0 ? 'strong' : 'weak'
        },
        socialIntelligence: networkData.socialIntelligence,
        lastEnriched: new Date().toISOString(),
        // For Neo4j visualization
        employees: employees
      }
    });

  } catch (error) {
    console.error('Company enrichment failed:', error);
    return NextResponse.json(
      { 
        error: 'Enrichment failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Resolve company identifier to LinkedIn employee profile URLs
 */
async function resolveCompanyToLinkedInUrls(
  identifier: string, 
  searchType: string,
  options: any
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  console.log(`🔍 Resolving company identifier: ${identifier} (type: ${searchType})`);

  // Method 1: Direct LinkedIn company URL
  if (searchType === 'linkedin_url' || identifier.includes('linkedin.com/company/')) {
    return await scrapeLinkedInCompanyPage(identifier, options);
  }

  // Method 2: Company name search + LinkedIn discovery
  if (searchType === 'name' || searchType === 'auto') {
    return await searchCompanyEmployees(identifier, options);
  }

  // Method 3: Direct company ID lookup
  if (searchType === 'company_id') {
    return await lookupCompanyById(identifier, options);
  }

  throw new Error(`Unsupported search type: ${searchType}`);
}

/**
 * Scrape LinkedIn company page to get employee profile URLs using Apify
 */
async function scrapeLinkedInCompanyPage(
  companyUrl: string,
  options: any
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  console.log(`🏢 Scraping LinkedIn company page: ${companyUrl}`);
  
  try {
    // Use Apify's LinkedIn Company Scraper to get employee list first
    const companyScraperActorId = 'misceres/linkedin-company-employees-scraper'; // Popular company scraper
    const apifyToken = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    
    if (!apifyToken) {
      throw new Error('Apify token not available for company scraping');
    }

    const runInput = {
      companyUrls: [companyUrl],
      maxEmployees: options.maxEmployees || 25,
      proxyConfiguration: {
        useApifyProxy: true
      }
    };

    // Start company scraper run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${companyScraperActorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyToken}`
      },
      body: JSON.stringify(runInput)
    });

    if (!runResponse.ok) {
      console.warn('Company scraper failed, using fallback method');
      return await fallbackEmployeeDiscovery(companyUrl, options);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for completion (shorter timeout for company scraping)
    const results = await waitForApifyRun(runId, apifyToken, 120000); // 2 minutes
    
    if (!results || results.length === 0) {
      console.warn('No employees found, using fallback method');
      return await fallbackEmployeeDiscovery(companyUrl, options);
    }

    // Transform company scraper results to profile URLs
    const employees = results.flatMap((result: any) => 
      (result.employees || []).map((emp: any) => ({
        profileUrl: emp.profileUrl || emp.linkedinUrl,
        name: emp.name || emp.fullName,
        title: emp.position || emp.title,
        company: extractCompanyNameFromUrl(companyUrl)
      }))
    ).filter((emp: any) => emp.profileUrl);

    console.log(`✅ Found ${employees.length} employee profiles from company scraper`);
    return employees.slice(0, options.maxEmployees || 25);

  } catch (error) {
    console.error('Company scraping failed:', error);
    return await fallbackEmployeeDiscovery(companyUrl, options);
  }
}

/**
 * Fallback method when company scraping fails
 */
async function fallbackEmployeeDiscovery(
  companyUrl: string,
  options: any
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  console.log(`🔄 Using fallback discovery for: ${companyUrl}`);
  
  // For demo purposes, return known working profiles
  const knownProfiles = [
    {
      profileUrl: 'https://www.linkedin.com/in/dankeegan',
      name: 'Dan Keegan',
      title: 'GTM',
      company: extractCompanyNameFromUrl(companyUrl)
    }
  ];

  return knownProfiles;
}

/**
 * Wait for Apify run completion
 */
async function waitForApifyRun(runId: string, token: string, maxWaitTime: number = 120000): Promise<any[]> {
  const pollInterval = 5000; // 5 seconds
  const maxPolls = maxWaitTime / pollInterval;
  let polls = 0;

  while (polls < maxPolls) {
    try {
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        // Get dataset items
        const datasetId = statusData.data.defaultDatasetId;
        const itemsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        return await itemsResponse.json();
      } else if (status === 'FAILED' || status === 'ABORTED') {
        throw new Error(`Apify run ${status.toLowerCase()}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      polls++;

    } catch (error) {
      console.error('Error polling Apify run status:', error);
      throw error;
    }
  }

  throw new Error(`Apify run timed out after ${maxWaitTime}ms`);
}

/**
 * Search for company employees using various discovery methods
 */
async function searchCompanyEmployees(
  companyName: string,
  options: any
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  console.log(`👥 Searching employees for company: ${companyName}`);

  // Method 1: Use Google Search + LinkedIn site operator
  const googleResults = await searchGoogleForLinkedInProfiles(companyName);
  
  // Method 2: Use LinkedIn search (if we have a LinkedIn scraper)
  // const linkedInResults = await searchLinkedInDirectly(companyName);
  
  // Method 3: Check our existing database for known employees
  const existingProfiles = await getExistingCompanyProfiles(companyName);

  // Combine and deduplicate results
  const allResults = [
    ...googleResults,
    ...existingProfiles
  ];

  // Remove duplicates and limit results
  const uniqueResults = Array.from(
    new Map(allResults.map(emp => [emp.profileUrl, emp])).values()
  );

  return uniqueResults.slice(0, options.maxEmployees || 25);
}

/**
 * Lookup company by internal ID
 */
async function lookupCompanyById(
  companyId: string,
  options: any
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  console.log(`🆔 Looking up company by ID: ${companyId}`);
  
  // TODO: Implement database lookup by company ID
  // This would query our Neon.tech database for existing company data
  
  return [];
}

/**
 * Search Google for LinkedIn profiles at company
 */
async function searchGoogleForLinkedInProfiles(
  companyName: string
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  try {
    const query = `site:linkedin.com/in/ "${companyName}"`;
    
    // TODO: Implement Google Custom Search API or web scraping
    // For now, return mock data
    
    console.log(`🔎 Google search query: ${query}`);
    
    return [
      {
        profileUrl: 'https://www.linkedin.com/in/example1',
        name: 'Employee 1',
        title: 'Software Engineer',
        company: companyName
      },
      {
        profileUrl: 'https://www.linkedin.com/in/example2',
        name: 'Employee 2', 
        title: 'Product Manager',
        company: companyName
      }
    ];
    
  } catch (error) {
    console.error('Google search failed:', error);
    return [];
  }
}

/**
 * Get existing company profiles from database
 */
async function getExistingCompanyProfiles(
  companyName: string
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  try {
    // TODO: Query Neon.tech database for existing company profiles
    // This would check our Apollo enrichment data or previous Apify results
    
    console.log(`💾 Checking database for existing profiles: ${companyName}`);
    
    return [];
    
  } catch (error) {
    console.error('Database lookup failed:', error);
    return [];
  }
}

/**
 * Extract company name from LinkedIn company URL
 */
function extractCompanyNameFromUrl(url: string): string {
  try {
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
    return match ? match[1].replace(/-/g, ' ') : 'Unknown Company';
  } catch {
    return 'Unknown Company';
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company = searchParams.get('company');
  
  if (!company) {
    return NextResponse.json(
      { error: 'Company parameter is required' },
      { status: 400 }
    );
  }

  // GET method for simple company lookup
  return POST(request);
}