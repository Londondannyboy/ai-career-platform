import { NextResponse } from 'next/server'

export async function GET() {
  // Direct environment variable testing endpoint
  
  return NextResponse.json({
    message: 'Direct environment variable test',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    
    // Test all possible ways to access the environment variable
    directAccess: {
      configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
      configIdType: typeof process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
      configIdLength: process.env.NEXT_PUBLIC_HUME_CONFIG_ID?.length,
      configIdUndefined: process.env.NEXT_PUBLIC_HUME_CONFIG_ID === undefined,
      configIdNull: process.env.NEXT_PUBLIC_HUME_CONFIG_ID === null,
      configIdEmpty: process.env.NEXT_PUBLIC_HUME_CONFIG_ID === '',
    },
    
    // Check if it exists in process.env at all
    processEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('HUME') || key.includes('CONFIG')
    ),
    
    // Raw environment dump for debugging (filtered for safety)
    filteredEnv: Object.fromEntries(
      Object.entries(process.env).filter(([key]) => 
        key.startsWith('NEXT_PUBLIC_') && key.includes('HUME')
      )
    ),
    
    // Try different access patterns
    alternativeAccess: {
      viaDestructuring: (() => {
        const { NEXT_PUBLIC_HUME_CONFIG_ID } = process.env;
        return NEXT_PUBLIC_HUME_CONFIG_ID;
      })(),
      viaSquareBrackets: process.env['NEXT_PUBLIC_HUME_CONFIG_ID'],
      viaGetEnv: (() => {
        try {
          return process.env.NEXT_PUBLIC_HUME_CONFIG_ID || 'undefined';
        } catch (e) {
          return `error: ${e}`;
        }
      })()
    },
    
    // Force a cache bust with random value
    cacheBust: Math.random().toString(36),
    buildTime: new Date().toISOString()
  })
}