/**
 * Vanilla test endpoint for HarvestAPI
 * Minimal processing to isolate any issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function GET(request: NextRequest) {
  try {
    // Get company URL from query params
    const searchParams = request.nextUrl.searchParams;
    const companyUrl = searchParams.get('company') || 'https://www.linkedin.com/company/ckdelta/';
    
    // Initialize Apify client
    const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    const actorId = process.env.APIFY_HARVEST_ACTOR_ID || 'harvestapi/linkedin-profile-search';
    
    if (!token) {
      return NextResponse.json({ error: 'No Apify token found' }, { status: 500 });
    }
    
    const client = new ApifyClient({ token });
    
    // Run HarvestAPI with minimal config
    console.log('🚀 Running vanilla HarvestAPI test...');
    const run = await client.actor(actorId).call({
      currentCompanies: [companyUrl],
      maxItems: 5,
      profileScraperMode: "Full ($8 per 1k)"
    });
    
    // Get raw results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    // Return minimal processed data
    const simpleResults = items.map(item => ({
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      title: item.headline || 'No title',
      url: item.linkedinUrl || '#',
      hasRecommendations: item.receivedRecommendations?.length > 0,
      recommendationCount: item.receivedRecommendations?.length || 0
    }));
    
    return NextResponse.json({
      success: true,
      company: companyUrl,
      employeeCount: simpleResults.length,
      employees: simpleResults,
      rawDataSample: items[0] // Include first raw item for debugging
    });
    
  } catch (error) {
    console.error('❌ Vanilla test failed:', error);
    return NextResponse.json({
      error: 'Vanilla test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}