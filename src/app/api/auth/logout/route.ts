import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Comprehensive logout that clears all session data
 */
export async function POST() {
  try {
    // Get current auth state
    const authResult = await auth();
    
    // Create response to clear any lingering cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Clear any potential Supabase session cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    response.cookies.delete('supabase-auth-token');
    response.cookies.delete('supabase.auth.token');
    
    // Clear any other potential session cookies
    response.cookies.delete('session');
    response.cookies.delete('auth-token');
    
    console.log('🔐 Comprehensive logout completed for user:', authResult?.userId || 'unknown');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}