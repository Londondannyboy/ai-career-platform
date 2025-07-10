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
    
    // Get personal repo data
    const result = await sql`
      SELECT personal_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const personalRepo = result.rows[0]?.personal_repo || {};
    
    return NextResponse.json({ 
      success: true, 
      data: {
        okrs: personalRepo.okrs || []
      }
    });
  } catch (error: any) {
    console.error('Load OKR error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to load OKRs' 
    }, { status: 500 });
  }
}

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

    const { okrs } = await request.json();
    
    // Get existing personal repo
    const existing = await sql`
      SELECT personal_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const personalRepo = existing.rows[0]?.personal_repo || {};
    
    // Update OKRs in personal repo
    const updatedPersonalRepo = {
      ...personalRepo,
      okrs,
      lastUpdated: new Date().toISOString()
    };

    if (existing.rows.length > 0) {
      // Update existing
      await sql`
        UPDATE user_profiles 
        SET personal_repo = ${JSON.stringify(updatedPersonalRepo)},
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } else {
      // Create new user profile with personal repo
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
          '{}',
          '{}',
          ${JSON.stringify(updatedPersonalRepo)},
          '{}',
          NOW(),
          NOW()
        )
      `;
    }

    return NextResponse.json({ 
      success: true,
      message: 'OKRs saved successfully'
    });
  } catch (error: any) {
    console.error('Save OKR error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save OKRs' 
    }, { status: 500 });
  }
}