import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/test/apollo-debug
 * Debug Apollo API with hardcoded test
 */
export async function GET() {
  try {
    console.log('🧪 Testing Apollo API with new key...');

    // Hardcode the API key for this test
    const API_KEY = 'hpliscMeBERV33T_WT8LNQ';
    const API_URL = 'https://api.apollo.io/api/v1/mixed_people/search';

    // Simple test with just Microsoft
    const testParams = {
      organization_names: ['Microsoft'],
      per_page: 5,
      page: 1
    };

    console.log('📤 Sending request:', {
      url: API_URL,
      params: testParams,
      keyLength: API_KEY.length
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify(testParams)
    });

    const responseText = await response.text();
    console.log('📥 Raw response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: responseText,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      apiKeyWorking: true,
      endpoint: API_URL,
      requestParams: testParams,
      response: {
        totalPeople: data.total_people || data.total_entries || 0,
        peopleReturned: data.people?.length || 0,
        pagination: {
          page: data.page,
          perPage: data.per_page
        },
        samplePeople: data.people?.slice(0, 3).map((person: any) => ({
          name: person.name,
          title: person.title,
          company: person.organization_name,
          email: person.email,
          linkedin: person.linkedin_url
        })),
        rawFirstPerson: data.people?.[0]
      }
    });

  } catch (error) {
    console.error('❌ Apollo debug test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Apollo debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}