import { NextRequest } from 'next/server';

/**
 * GET /api/debug/user-info
 * Simple user info checker - visit this URL while logged in from the browser
 */
export async function GET(request: NextRequest) {
  try {
    // Get user info from headers or cookies that Clerk sets
    const headers = Object.fromEntries(request.headers.entries());
    
    return Response.json({
      success: true,
      message: 'User info debug endpoint',
      instructions: [
        '1. Make sure you are logged in to the application',
        '2. Open browser developer tools (F12)',
        '3. Go to Console tab',
        '4. Type: console.log(window.Clerk?.user?.id)',
        '5. Type: console.log(window.Clerk?.user?.primaryEmailAddress?.emailAddress)',
        '6. Your user ID will be displayed'
      ],
      alternativeMethod: [
        '1. Go to https://dashboard.clerk.com',
        '2. Select your project',
        '3. Go to Users tab',
        '4. Find keegan.dan@gmail.com',
        '5. Copy the user ID from there'
      ],
      requestInfo: {
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString(),
        hasAuthHeaders: Object.keys(headers).some(key => 
          key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('clerk') ||
          key.toLowerCase().includes('session')
        )
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Debug endpoint failed, but admin is already set up by email'
    }, { status: 500 });
  }
}