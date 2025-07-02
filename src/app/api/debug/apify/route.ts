/**
 * Debug endpoint to check Apify environment variables
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_HARVEST_ACTOR_ID;

  // Force check all environment variables
  const allEnvVars = Object.keys(process.env).filter(key => 
    key.startsWith('APIFY') || key.includes('TOKEN')
  );

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
    all_apify_vars: allEnvVars.reduce((acc, key) => {
      acc[key] = !!process.env[key];
      return acc;
    }, {} as Record<string, boolean>),
    deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    timestamp: new Date().toISOString()
  });
}