import { NextResponse } from 'next/server';
import { getApolloService } from '@/lib/apollo/apolloService';

export const runtime = 'nodejs';

/**
 * GET /api/test/apollo
 * Test Apollo API integration with sample companies
 */
export async function GET() {
  try {
    console.log('🧪 Testing Apollo API integration...');

    const apolloService = getApolloService();

    // Test companies to search
    const testCompanies = [
      'Microsoft',
      'Google',
      'Salesforce'
    ];

    const results = [];

    for (const companyName of testCompanies) {
      try {
        console.log(`🔍 Searching for employees at ${companyName}...`);
        
        // Search with limited results for testing
        const response = await apolloService.searchPeopleByCompany(companyName, {
          perPage: 5,
          page: 1
        });

        // Get decision makers
        const decisionMakers = await apolloService.getKeyDecisionMakers(companyName);

        results.push({
          company: companyName,
          success: true,
          totalEmployees: response.pagination.total_entries,
          samplesReturned: response.people.length,
          decisionMakersFound: decisionMakers.length,
          sampleProfiles: response.people.slice(0, 3).map(person => ({
            name: person.name,
            title: person.title,
            seniority: person.seniority,
            departments: person.departments,
            email: person.email ? '✓ Available' : '✗ Not available',
            linkedin: person.linkedin_url ? '✓ Available' : '✗ Not available'
          })),
          topDecisionMakers: decisionMakers.slice(0, 3).map(person => ({
            name: person.name,
            title: person.title,
            seniority: person.seniority
          }))
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          company: companyName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test specific department search
    let departmentTest;
    try {
      const salesPeople = await apolloService.getPeopleByDepartment('Microsoft', 'sales');
      departmentTest = {
        success: true,
        department: 'sales',
        company: 'Microsoft',
        peopleFound: salesPeople.length,
        sampleTitles: [...new Set(salesPeople.slice(0, 5).map(p => p.title))]
      };
    } catch (error) {
      departmentTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      apiStatus: 'Connected',
      testResults: {
        companySearches: results,
        departmentSearch: departmentTest
      },
      capabilities: {
        peopleSearch: true,
        decisionMakerIdentification: true,
        departmentFiltering: true,
        seniorityFiltering: true,
        emailAvailability: 'Varies by profile',
        linkedinUrlAvailability: 'Varies by profile'
      },
      rateLimits: {
        note: 'Apollo API has rate limits',
        recommendation: 'Add delays between requests',
        currentDelay: '1000ms between company searches'
      },
      nextSteps: [
        'Store enriched profiles in database',
        'Create UI for company search',
        'Implement caching to reduce API calls',
        'Add webhook for profile updates'
      ]
    });

  } catch (error) {
    console.error('❌ Apollo test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Apollo test failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        possibleCauses: [
          'Invalid API key',
          'Rate limiting',
          'Network issues',
          'API service down'
        ]
      },
      { status: 500 }
    );
  }
}