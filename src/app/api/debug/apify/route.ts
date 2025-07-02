/**
 * Debug endpoint to check Apify environment variables
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_HARVEST_ACTOR_ID;

  return NextResponse.json({
    env_check: {
      APIFY_TOKEN: {
        exists: !!token,
        length: token ? token.length : 0,
        preview: token ? `${token.substring(0, 8)}...` : null
      },
      APIFY_HARVEST_ACTOR_ID: {
        exists: !!actorId,
        value: actorId || null
      }
    },
    timestamp: new Date().toISOString()
  });
}