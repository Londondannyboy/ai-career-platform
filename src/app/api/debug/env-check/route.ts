import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment variables in production
 * This will help us see what's actually available in Vercel
 */

export async function GET() {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDataMagnetToken: !!process.env.DATAMAGNET_API_TOKEN,
      datamagnetTokenLength: process.env.DATAMAGNET_API_TOKEN?.length || 0,
      datamagnetTokenPreview: process.env.DATAMAGNET_API_TOKEN?.substring(0, 10) + '...' || 'NOT_SET',
      
      // Check all possible variations
      DATAMAGNET_API_TOKEN: !!process.env.DATAMAGNET_API_TOKEN,
      datamagnet_api_token: !!process.env.datamagnet_api_token,
      
      // Check other related env vars
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
      hasApolloKey: !!process.env.APOLLO_API_KEY,
      
      // Environment info
      timestamp: new Date().toISOString(),
      platform: process.platform
    }

    console.log('🔍 Environment Check:', envCheck)

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variable check complete'
    })

  } catch (error) {
    console.error('❌ Environment check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}