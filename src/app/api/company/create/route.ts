import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Import enrichment services
import { DataMagnetCompanyService } from '@/lib/datamagnet/company';
import { TavilySearchService } from '@/lib/tavily/search';
import { LinkupSearchService } from '@/lib/linkup/search';

interface EnrichmentResult {
  source: 'datamagnet' | 'tavily' | 'linkup';
  success: boolean;
  duration: number;
  data?: {
    name?: string;
    description?: string;
    logo?: string;
    industry?: string;
    employeeCount?: string;
    headquarters?: string;
    website?: string;
    linkedInUrl?: string;
    founded?: string;
  };
  error?: string;
}

async function enrichWithDataMagnet(companyName: string, website: string): Promise<EnrichmentResult> {
  const start = Date.now();
  try {
    const service = new DataMagnetCompanyService({
      apiToken: process.env.DATAMAGNET_API_TOKEN || ''
    });
    const result = await service.enrichCompany(companyName, website);
    
    return {
      source: 'datamagnet',
      success: true,
      duration: Date.now() - start,
      data: {
        name: result.name,
        description: result.description,
        logo: result.logo,
        industry: result.industry,
        employeeCount: result.employee_count_text,
        headquarters: result.headquarters,
        website: result.domain,
        linkedInUrl: result.linkedin_url,
        founded: result.founded_year
      }
    };
  } catch (error) {
    return {
      source: 'datamagnet',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function enrichWithTavily(companyName: string, website: string): Promise<EnrichmentResult> {
  const start = Date.now();
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${companyName} company description logo headquarters`,
        search_depth: 'basic',
        max_results: 5,
        include_domains: [website.replace(/^https?:\/\//, '')],
        include_raw_content: false
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract company info from search results
    const companyInfo: any = {
      name: companyName,
      website: website
    };

    // Parse results for company information
    if (data.results && data.results.length > 0) {
      const content = data.results.map((r: any) => r.content).join(' ');
      
      // Simple extraction (could be improved with AI)
      if (content.includes('headquartered in') || content.includes('based in')) {
        const hqMatch = content.match(/(?:headquartered|based) in ([^,.]+)/i);
        if (hqMatch) companyInfo.headquarters = hqMatch[1].trim();
      }
      
      // Use first result's content as description
      companyInfo.description = data.results[0].content.slice(0, 200) + '...';
    }

    return {
      source: 'tavily',
      success: true,
      duration: Date.now() - start,
      data: companyInfo
    };
  } catch (error) {
    return {
      source: 'tavily',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function enrichWithLinkup(companyName: string, website: string): Promise<EnrichmentResult> {
  const start = Date.now();
  try {
    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LINKUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${companyName} site:${website.replace(/^https?:\/\//, '')} about company`,
        depth: 'standard',
        outputType: 'searchResults'
      })
    });

    if (!response.ok) {
      throw new Error(`Linkup API error: ${response.status}`);
    }

    const data = await response.json();
    
    const companyInfo: any = {
      name: companyName,
      website: website
    };

    // Extract info from search results
    if (data.results && data.results.length > 0) {
      // Use snippets to build description
      const snippets = data.results.map((r: any) => r.snippet).filter(Boolean);
      if (snippets.length > 0) {
        companyInfo.description = snippets[0];
      }
    }

    return {
      source: 'linkup',
      success: true,
      duration: Date.now() - start,
      data: companyInfo
    };
  } catch (error) {
    return {
      source: 'linkup',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper to extract favicon/logo
async function extractLogoFromWebsite(website: string): Promise<string | null> {
  try {
    const domain = new URL(website).hostname;
    // Try common favicon locations
    const faviconUrls = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `${website}/favicon.ico`,
      `${website}/apple-touch-icon.png`
    ];
    
    // Return Google's favicon service as it's most reliable
    return faviconUrls[0];
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, website, country } = await request.json();

    if (!name || !website) {
      return NextResponse.json(
        { error: 'Company name and website are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('company_enrichments')
      .select('*')
      .eq('domain', new URL(website).hostname)
      .single();

    if (existingCompany) {
      return NextResponse.json({
        company: {
          id: existingCompany.id,
          name: existingCompany.name,
          isValidated: true,
          validatedBy: 'enrichment',
          location: existingCompany.headquarters,
          linkedInUrl: existingCompany.linkedin_url,
          domain: existingCompany.domain,
          description: existingCompany.description,
          logo: existingCompany.logo_url
        },
        enrichmentResults: [],
        message: 'Company already exists in our database'
      });
    }

    // Run all enrichment APIs in parallel
    const enrichmentPromises = [
      enrichWithDataMagnet(name, website),
      enrichWithTavily(name, website),
      enrichWithLinkup(name, website)
    ];

    const enrichmentResults = await Promise.all(enrichmentPromises);

    // Try to get logo from website if not found in enrichments
    let logo = enrichmentResults.find(r => r.success && r.data?.logo)?.data?.logo;
    if (!logo) {
      logo = await extractLogoFromWebsite(website) || undefined;
    }

    // Merge results prioritizing DataMagnet, then Tavily, then Linkup
    const mergedData = enrichmentResults.reduce((acc, result) => {
      if (result.success && result.data) {
        return {
          ...acc,
          ...Object.fromEntries(
            Object.entries(result.data).filter(([_, v]) => v !== undefined)
          )
        };
      }
      return acc;
    }, {
      name,
      domain: new URL(website).hostname,
      website,
      logo_url: logo,
      headquarters: country ? (await import('@/lib/constants/countries')).getCountryByCode(country)?.name : undefined
    });

    // Save to database
    const { data: newCompany, error: insertError } = await supabase
      .from('company_enrichments')
      .insert({
        ...mergedData,
        enrichment_sources: enrichmentResults
          .filter(r => r.success)
          .map(r => r.source),
        enrichment_data: enrichmentResults,
        created_by_user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save company:', insertError);
      return NextResponse.json(
        { error: 'Failed to save company data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      company: {
        id: newCompany.id,
        name: newCompany.name,
        isValidated: true,
        validatedBy: 'enrichment',
        location: newCompany.headquarters,
        linkedInUrl: newCompany.linkedin_url,
        domain: newCompany.domain,
        description: newCompany.description,
        logo: newCompany.logo_url
      },
      enrichmentResults,
      message: 'Company created and enriched successfully'
    });
  } catch (error) {
    console.error('Company creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}