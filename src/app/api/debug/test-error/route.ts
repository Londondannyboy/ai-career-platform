import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";

// Test endpoint to verify Sentry is working
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type') || 'basic';
  
  try {
    switch (errorType) {
      case 'basic':
        throw new Error('Test error from Quest platform - Sentry is working!');
        
      case 'reference':
        // This will cause a reference error
        // @ts-ignore
        return undefinedVariable.someMethod();
        
      case 'async':
        // Unhandled promise rejection
        await Promise.reject(new Error('Async test error - Sentry should catch this'));
        break;
        
      case 'type':
        // Type error at runtime
        const obj: any = null;
        return obj.someProperty.nested;
        
      case 'custom':
        // Custom error with extra context
        const error = new Error('Custom error with context');
        Sentry.withScope((scope) => {
          scope.setTag('error.type', 'test');
          scope.setContext('test_context', {
            endpoint: '/api/debug/test-error',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          });
          Sentry.captureException(error);
        });
        throw error;
        
      default:
        return NextResponse.json({ 
          message: 'Use ?type=basic|reference|async|type|custom to test different errors' 
        });
    }
  } catch (error) {
    // Sentry will automatically capture this
    throw error;
  }
}