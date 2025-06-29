import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Only allow in development or with special debug header
  const isDev = process.env.NODE_ENV === 'development'
  const debugHeader = req.headers.get('x-debug-auth')
  
  if (!isDev && debugHeader !== 'debug-env-check') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const envStatus = {
    environment: process.env.NODE_ENV,
    humeApiKey: process.env.NEXT_PUBLIC_HUME_API_KEY ? 'SET' : 'MISSING',
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID ? 'SET' : 'MISSING',
    humeApiSecret: process.env.HUME_API_SECRET ? 'SET' : 'MISSING',
    openaiKey: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
    clerkPublishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
    clerkSecret: process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING',
    // Show first few characters for verification (safe)
    humeKeyPreview: process.env.NEXT_PUBLIC_HUME_API_KEY?.substring(0, 10) + '...' || 'MISSING',
    humeConfigPreview: process.env.NEXT_PUBLIC_HUME_CONFIG_ID?.substring(0, 8) + '...' || 'MISSING'
  }

  return NextResponse.json({
    message: 'Environment variable status',
    status: envStatus,
    timestamp: new Date().toISOString()
  })
}