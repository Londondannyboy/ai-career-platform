import { NextResponse } from 'next/server'

export async function GET() {
  const connectionString = process.env.NEON_DATABASE_URL
  
  if (!connectionString) {
    return NextResponse.json({
      error: 'NEON_DATABASE_URL not found',
      envVars: Object.keys(process.env).filter(key => key.includes('NEON'))
    })
  }
  
  // Parse the connection string safely
  try {
    const url = new URL(connectionString)
    
    return NextResponse.json({
      status: 'Connection string found',
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      username: url.username,
      hasPassword: !!url.password,
      protocol: url.protocol,
      searchParams: Object.fromEntries(url.searchParams),
      // Don't log the full connection string for security
      length: connectionString.length,
      startsWithPostgresql: connectionString.startsWith('postgresql://'),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid connection string format',
      details: error instanceof Error ? error.message : 'Unknown error',
      stringPreview: connectionString.substring(0, 20) + '...',
      length: connectionString.length
    })
  }
}