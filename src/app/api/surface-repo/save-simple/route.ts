import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
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

    const { data } = await request.json();
    
    // Check if user profile exists
    const existing = await sql`
      SELECT id FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      // Update existing
      await sql`
        UPDATE user_profiles 
        SET surface_repo = ${JSON.stringify(data)},
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } else {
      // Create new
      await sql`
        INSERT INTO user_profiles (
          user_id, 
          surface_repo, 
          working_repo, 
          personal_repo, 
          deep_repo,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${JSON.stringify(data)},
          '{}',
          '{}',
          '{}',
          NOW(),
          NOW()
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save' 
    }, { status: 500 });
  }
}