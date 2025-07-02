/**
 * Debug endpoint to test HarvestAPI directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApifyService } from '@/lib/apify/apifyService';

export async function POST(request: NextRequest) {
  try {
    const { companyUrl = 'https://www.linkedin.com/company/ckdelta/', maxItems = 3 } = await request.json().catch(() => ({}));

    console.log('🔧 Debug HarvestAPI test starting...');
    
    // Step 1: Check Apify service creation
    const apifyService = createApifyService();
    if (!apifyService) {
      return NextResponse.json({
        error: 'Apify service not configured',
        step: 'service_creation'
      }, { status: 500 });
    }

    console.log('✅ Apify service created successfully');

    // Step 2: Test direct API call to HarvestAPI
    const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    const actorId = process.env.APIFY_HARVEST_ACTOR_ID || 'M2FMdjRVeF1HPGFcc';

    const runInput = {
      currentCompanies: [companyUrl],
      maxItems: maxItems,
      profileScraperMode: "Full ($8 per 1k)"
    };

    console.log('🚀 Starting Apify run with input:', runInput);

    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(runInput)
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('❌ Apify run failed:', errorText);
      return NextResponse.json({
        error: 'Apify run failed',
        status: runResponse.status,
        details: errorText,
        step: 'apify_run_start'
      }, { status: 500 });
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log('⏳ Waiting for run completion, ID:', runId);

    // Step 3: Wait for completion (simplified polling)
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes max
    let results = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      console.log(`📊 Run status: ${status} (attempt ${attempts + 1})`);

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data.defaultDatasetId;
        const itemsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        results = await itemsResponse.json();
        break;
      } else if (status === 'FAILED' || status === 'ABORTED') {
        return NextResponse.json({
          error: `Apify run ${status.toLowerCase()}`,
          runId,
          details: statusData.data.statusMessage,
          step: 'apify_run_execution'
        }, { status: 500 });
      }

      attempts++;
    }

    if (!results) {
      return NextResponse.json({
        error: 'Apify run timed out',
        runId,
        step: 'apify_run_timeout'
      }, { status: 500 });
    }

    console.log('✅ Got results:', results.length, 'items');

    return NextResponse.json({
      success: true,
      runId,
      resultCount: results.length,
      sampleResult: results[0] || null,
      allResults: results.slice(0, 3), // First 3 results for debugging
      step: 'completed'
    });

  } catch (error) {
    console.error('💥 Debug test failed:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'catch_block'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}