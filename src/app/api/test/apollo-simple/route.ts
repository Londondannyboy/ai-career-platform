import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/test/apollo-simple
 * Test different parameter formats for Apollo API
 */
export async function GET() {
  try {
    const API_KEY = 'hpliscMeBERV33T_WT8LNQ';
    const API_URL = 'https://api.apollo.io/api/v1/mixed_people/search';

    // Test different parameter formats
    const tests = [
      {
        name: 'Test 1: organization_names as array',
        params: {
          organization_names: ['Microsoft'],
          per_page: 3
        }
      },
      {
        name: 'Test 2: q_organization_name',
        params: {
          q_organization_name: 'Microsoft',
          per_page: 3
        }
      },
      {
        name: 'Test 3: organization_name singular',
        params: {
          organization_name: 'Microsoft',
          per_page: 3
        }
      },
      {
        name: 'Test 4: Combined with organization filter',
        params: {
          q_keywords: 'Microsoft',
          organization_names: ['Microsoft'],
          per_page: 3
        }
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`🧪 Running ${test.name}...`);
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': API_KEY
          },
          body: JSON.stringify(test.params)
        });

        const data = await response.json();
        
        results.push({
          test: test.name,
          params: test.params,
          success: response.ok,
          status: response.status,
          totalPeople: data.total_people || data.pagination?.total_entries || 0,
          peopleReturned: data.people?.length || 0,
          samplePerson: data.people?.[0] ? {
            name: data.people[0].name,
            title: data.people[0].title,
            company: data.people[0].organization?.name || data.people[0].organization_name || 'N/A',
            currentEmployer: data.people[0].employment_history?.[0]?.organization_name
          } : null,
          errorMessage: data.error || data.message
        });

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        results.push({
          test: test.name,
          params: test.params,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Also test the organizations endpoint to verify company exists
    try {
      const orgResponse = await fetch('https://api.apollo.io/api/v1/organizations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': API_KEY
        },
        body: JSON.stringify({
          q_organization_name: 'Microsoft',
          per_page: 1
        })
      });

      const orgData = await orgResponse.json();
      
      results.push({
        test: 'Organization Search',
        endpoint: '/organizations/search',
        success: orgResponse.ok,
        organizationFound: orgData.organizations?.[0]?.name,
        organizationId: orgData.organizations?.[0]?.id,
        organizationDomain: orgData.organizations?.[0]?.primary_domain
      });
    } catch (error) {
      console.error('Organization search failed:', error);
    }

    return NextResponse.json({
      success: true,
      apiKey: 'Using correct key',
      timestamp: new Date().toISOString(),
      results,
      recommendation: 'Check which test returns Microsoft employees'
    });

  } catch (error) {
    console.error('❌ Apollo simple test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Apollo simple test failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}