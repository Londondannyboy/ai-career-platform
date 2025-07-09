import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint for Sentry
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shouldError = searchParams.get('error') === 'true';
  
  if (shouldError) {
    throw new Error('Test error for Sentry - This is working correctly!');
  }
  
  return NextResponse.json({ 
    message: 'Sentry test endpoint working',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'not configured',
    instructions: 'Add ?error=true to trigger an error'
  });
}