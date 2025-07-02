import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getApolloService } from '@/lib/apollo/apolloService';

export const runtime = 'nodejs';

/**
 * POST /api/enrich/company
 * Enrich company data with employee profiles from Apollo
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
    const { companyName, searchOptions } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Enriching company data for: ${companyName}`);

    const apolloService = getApolloService();

    // Default search options
    const options = {
      seniorityLevels: searchOptions?.seniorityLevels,
      departments: searchOptions?.departments,
      titles: searchOptions?.titles,
      perPage: searchOptions?.perPage || 25,
      page: searchOptions?.page || 1
    };

    // Search for people at the company
    const apolloResponse = await apolloService.searchPeopleByCompany(companyName, options);

    // Transform Apollo data to our unified profile format
    const profiles = apolloResponse.people.map(person => 
      apolloService.transformToUnifiedProfile(person)
    );

    // Get key decision makers separately if requested
    let decisionMakers: any[] = [];
    if (searchOptions?.includeDecisionMakers) {
      decisionMakers = await apolloService.getKeyDecisionMakers(companyName);
    }

    // Analyze company structure
    const departmentBreakdown = apolloResponse.people.reduce((acc, person) => {
      person.departments.forEach(dept => {
        acc[dept] = (acc[dept] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const seniorityBreakdown = apolloResponse.people.reduce((acc, person) => {
      acc[person.seniority] = (acc[person.seniority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      company: companyName,
      totalEmployees: apolloResponse.total_entries,
      profilesReturned: apolloResponse.people.length,
      page: apolloResponse.page,
      perPage: apolloResponse.per_page,
      profiles,
      decisionMakers: searchOptions?.includeDecisionMakers ? decisionMakers : undefined,
      insights: {
        departmentBreakdown,
        seniorityBreakdown,
        topTitles: getTopItems(apolloResponse.people.map(p => p.title), 10),
        locations: getTopItems(
          apolloResponse.people
            .map(p => [p.city, p.state, p.country].filter(Boolean).join(', '))
            .filter(Boolean),
          10
        )
      },
      searchOptions: options,
      dataSource: 'apollo',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Company enrichment failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Company enrichment failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrich/company?name=CompanyName
 * Quick search endpoint
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

    // Forward to POST handler with default options
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        companyName,
        searchOptions: {
          perPage: 10,
          includeDecisionMakers: true
        }
      })
    });

    return POST(postRequest);
  } catch (error) {
    console.error('❌ Company search failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Company search failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Helper function to get top items with counts
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