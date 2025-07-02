import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getApolloService } from '@/lib/apollo/apolloService';
import { getApolloStorageService } from '@/lib/apollo/apolloStorageService';

export const runtime = 'nodejs';

/**
 * POST /api/enrich/company-smart
 * Smart company enrichment with caching and admin controls
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check with fallback
    let userId = 'test-user-123';
    try {
      const authResult = await auth();
      if (authResult?.userId) {
        userId = authResult.userId;
      }
    } catch (authError) {
      console.log('🔍 Auth failed, using test user:', authError);
    }

    const body = await request.json();
    const { companyName, forceRefresh = false, searchOptions } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Check admin permissions for force refresh
    if (forceRefresh && !isAdminUser(userId)) {
      return NextResponse.json(
        { error: 'Admin permissions required for force refresh' },
        { status: 403 }
      );
    }

    console.log(`🔍 Smart enrichment for: ${companyName} (user: ${userId}, force: ${forceRefresh})`);

    const apolloStorage = getApolloStorageService();

    // Check existing data status
    const status = await apolloStorage.getCompanyEnrichmentStatus(companyName);
    
    let apolloData;
    let fromCache = false;
    let cacheInfo = null;

    // Decide whether to fetch new data
    if (!status.exists || status.isStale || forceRefresh) {
      console.log(`📡 Fetching fresh data from Apollo for ${companyName}`);
      
      const apolloService = getApolloService();
      const options = {
        seniorityLevels: searchOptions?.seniorityLevels,
        departments: searchOptions?.departments,
        titles: searchOptions?.titles,
        perPage: searchOptions?.perPage || 50, // Get more data for storage
        page: 1
      };

      apolloData = await apolloService.searchPeopleByCompany(companyName, options);

      // Store the new data
      const storeResult = await apolloStorage.storeEnrichmentData(companyName, apolloData, userId);
      
      if (!storeResult.success) {
        console.error('Failed to store Apollo data:', storeResult.error);
        // Continue anyway, return the data even if storage failed
      }

      fromCache = false;
    } else {
      console.log(`💾 Using cached data for ${companyName}`);
      
      // Get data from cache
      const cachedData = await apolloStorage.getCompanyProfiles(companyName, {
        seniority: searchOptions?.seniorityLevels,
        departments: searchOptions?.departments,
        limit: searchOptions?.perPage || 25
      });

      // Transform cached data to Apollo format
      apolloData = {
        people: cachedData.profiles.map(profile => ({
          id: profile.apollo_id,
          name: profile.full_name,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          title: profile.title || '',
          headline: profile.headline || '',
          organization_name: profile.organization_name || '',
          organization_id: profile.organization_id || '',
          departments: profile.departments || [],
          seniority: profile.seniority || '',
          email: profile.email || null,
          linkedin_url: profile.linkedin_url || null,
          phone_numbers: [], // Not stored separately, get from raw_data if needed
          city: profile.city || null,
          state: profile.state || null,
          country: profile.country || null,
          employment_history: profile.employment_history || []
        })),
        pagination: {
          page: 1,
          per_page: cachedData.profiles.length,
          total_entries: cachedData.companyInfo?.total_employees || cachedData.total,
          total_pages: Math.ceil((cachedData.companyInfo?.total_employees || cachedData.total) / 25)
        }
      };

      fromCache = true;
      cacheInfo = {
        lastCrawled: status.lastCrawled,
        daysSinceCrawl: status.daysSinceCrawl,
        profileCount: status.profileCount,
        isStale: status.isStale
      };
    }

    // Transform Apollo data to our unified profile format
    const apolloService = getApolloService();
    const profiles = apolloData.people.map(person => 
      apolloService.transformToUnifiedProfile(person)
    );

    // Analyze company structure
    const departmentBreakdown = apolloData.people.reduce((acc, person) => {
      person.departments.forEach(dept => {
        acc[dept] = (acc[dept] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const seniorityBreakdown = apolloData.people.reduce((acc, person) => {
      acc[person.seniority] = (acc[person.seniority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      company: companyName,
      totalEmployees: apolloData.pagination.total_entries,
      profilesReturned: apolloData.people.length,
      profiles,
      
      // Cache information
      fromCache,
      cacheInfo,
      
      // Insights
      insights: {
        departmentBreakdown,
        seniorityBreakdown,
        topTitles: getTopItems(apolloData.people.map(p => p.title), 10),
        locations: getTopItems(
          apolloData.people
            .map(p => [p.city, p.state, p.country].filter(Boolean).join(', '))
            .filter(Boolean),
          10
        ),
        linkedinUrls: apolloData.people.filter(p => p.linkedin_url).length,
        emailsAvailable: apolloData.people.filter(p => p.email && p.email !== 'email_not_unlocked@domain.com').length
      },
      
      // Admin info
      adminInfo: {
        canRefresh: isAdminUser(userId),
        apiCreditsUsed: fromCache ? 0 : apolloData.people.length
      },
      
      searchOptions,
      dataSource: 'apollo',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Smart company enrichment failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Smart company enrichment failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrich/company-smart?name=CompanyName
 * Quick check for cached data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyName = searchParams.get('name');

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name parameter is required' },
        { status: 400 }
      );
    }

    const apolloStorage = getApolloStorageService();
    const status = await apolloStorage.getCompanyEnrichmentStatus(companyName);

    return NextResponse.json({
      success: true,
      company: companyName,
      cached: status.exists,
      isStale: status.isStale,
      lastCrawled: status.lastCrawled,
      daysSinceCrawl: status.daysSinceCrawl,
      profileCount: status.profileCount,
      needsRefresh: !status.exists || status.isStale
    });

  } catch (error) {
    console.error('❌ Company status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Company status check failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function isAdminUser(userId: string): boolean {
  // For now, simple admin check - extend this with your admin logic
  return userId === 'test-user-123' || userId.startsWith('admin_');
}

function getTopItems(items: string[], limit: number): Array<{ value: string; count: number }> {
  const counts = items.reduce((acc, item) => {
    if (item) {
      acc[item] = (acc[item] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}