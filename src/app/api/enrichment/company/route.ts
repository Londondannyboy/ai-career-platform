/**
 * Company Enrichment API - Apify-first architecture
 * Supports: company name search, LinkedIn company URL, or direct company identifier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRelationshipEnrichmentService } from '@/lib/enrichment/relationshipEnrichmentService';
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

    // Step 1: Resolve company identifier to LinkedIn employee URLs
    const linkedInUrls = await resolveCompanyToLinkedInUrls(companyIdentifier, searchType, options);

    if (!linkedInUrls || linkedInUrls.length === 0) {
      return NextResponse.json(
        { error: 'No LinkedIn profiles found for company' },
        { status: 404 }
      );
    }

    console.log(`📊 Found ${linkedInUrls.length} LinkedIn profiles to enrich`);

    // Step 2: Run Apify HarvestAPI enrichment
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

    const mockApolloEmployees = linkedInUrls.map((url, index) => ({
      linkedin_url: url.profileUrl,
      name: url.name || `Employee ${index + 1}`,
      title: url.title || 'Unknown',
      company: url.company || companyIdentifier
    }));

    const networkData = await apifyService.enrichWithHarvestAPI(mockApolloEmployees);

    // Step 3: Process with relationship enrichment service
    const enrichmentService = getRelationshipEnrichmentService();
    const enrichedNetwork = await enrichmentService.enrichCompanyNetwork(
      networkData.companyName,
      {
        forceRefresh: options.forceRefresh || false,
        maxEmployeesToEnrich: options.maxEmployees || 25,
        prioritizeDecisionMakers: options.prioritizeDecisionMakers !== false
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        companyName: enrichedNetwork.companyName,
        enrichmentType: 'apify_harvest',
        profilesEnriched: enrichedNetwork.enrichedEmployees.length,
        networkAnalysis: enrichedNetwork.networkAnalysis,
        socialIntelligence: enrichedNetwork.socialIntelligence,
        lastEnriched: enrichedNetwork.lastEnriched,
        // For Neo4j visualization
        employees: enrichedNetwork.enrichedEmployees.map(emp => ({
          name: emp.name,
          title: emp.title,
          linkedin_url: emp.linkedin_url,
          profileImage: emp.linkedInProfile?.profileUrl ? 
            `https://media.licdn.com/dms/image/v2/placeholder/profile-displayphoto-shrink_100_100/0/default.jpg` : 
            null,
          relationships: emp.relationships,
          socialIntelligence: emp.socialIntelligence
        }))
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
 * Scrape LinkedIn company page to get employee profile URLs
 */
async function scrapeLinkedInCompanyPage(
  companyUrl: string,
  options: any
): Promise<Array<{ profileUrl: string; name?: string; title?: string; company?: string }>> {
  
  // TODO: Implement LinkedIn company page scraping
  // This would use another Apify actor that scrapes company pages for employee lists
  
  console.log(`🏢 Scraping LinkedIn company page: ${companyUrl}`);
  
  // Mock implementation for now
  const mockEmployees = [
    {
      profileUrl: 'https://www.linkedin.com/in/dankeegan',
      name: 'Dan Keegan',
      title: 'GTM',
      company: extractCompanyNameFromUrl(companyUrl)
    }
  ];

  return mockEmployees;
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