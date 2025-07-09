import * as Sentry from '@sentry/nextjs';

export async function GET() {
  // Force capture an error
  try {
    throw new Error('Forced Sentry test error from API route');
  } catch (error) {
    // Explicitly capture the error
    Sentry.captureException(error);
    
    // Also try manual capture
    Sentry.captureMessage('Manual Sentry test message', 'error');
    
    // Flush to ensure it's sent
    await Sentry.flush(2000);
    
    return Response.json({ 
      error: 'Error captured and sent to Sentry',
      sentryEnabled: !!Sentry.getCurrentHub().getClient()
    });
  }
}