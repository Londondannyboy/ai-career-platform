import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Only allow with special debug header
  const debugHeader = req.headers.get('x-debug-auth')
  
  if (debugHeader !== 'debug-env-check') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Check all possible variations of the environment variable
  const envDetails = {
    environment: process.env.NODE_ENV,
    
    // All possible HUME environment variables
    humeApiKey: process.env.NEXT_PUBLIC_HUME_API_KEY,
    humeConfigId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
    humeApiSecret: process.env.HUME_API_SECRET,
    humePublicApiSecret: process.env.NEXT_PUBLIC_HUME_API_SECRET,
    
    // Check if they exist (without revealing values)
    humeApiKeyExists: !!process.env.NEXT_PUBLIC_HUME_API_KEY,
    humeConfigIdExists: !!process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
    humeApiSecretExists: !!process.env.HUME_API_SECRET,
    humePublicApiSecretExists: !!process.env.NEXT_PUBLIC_HUME_API_SECRET,
    
    // Show all environment variables that start with HUME (safe for debugging)
    allHumeEnvVars: Object.keys(process.env)
      .filter(key => key.includes('HUME'))
      .map(key => ({
        name: key,
        hasValue: !!process.env[key],
        preview: process.env[key]?.substring(0, 8) + '...' || 'undefined'
      })),
      
    // Show all environment variables that start with NEXT_PUBLIC (for debugging)
    allPublicEnvVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .map(key => ({
        name: key,
        hasValue: !!process.env[key],
        preview: process.env[key]?.substring(0, 8) + '...' || 'undefined'
      }))
  }

  return NextResponse.json({
    message: 'Detailed environment variable analysis',
    details: envDetails,
    timestamp: new Date().toISOString()
  })
}