import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID - if auth fails, use a test ID
    let userId = 'test-user';
    try {
      const authResult = await auth();
      if (authResult.userId) {
        userId = authResult.userId;
      }
    } catch (e) {
      console.log('Auth failed, using test user');
    }
    
    const result = await sql`
      SELECT surface_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0]?.surface_repo || {} 
    });
  } catch (error: any) {
    console.error('Load error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to load' 
    }, { status: 500 });
  }
}