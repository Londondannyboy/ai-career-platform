import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    // First ensure user profile exists
    await sql`
      INSERT INTO user_profiles (user_id, surface_repo, working_repo, personal_repo, deep_repo)
      VALUES (${userId}, '{}', '{}', '{}', '{}')
      ON CONFLICT (user_id) DO NOTHING
    `;
    
    // Update the surface_repo field in user_profiles
    const result = await sql`
      UPDATE user_profiles
      SET 
        surface_repo = ${JSON.stringify(data)}::jsonb,
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Surface Repo saved successfully'
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Server error' 
    }, { status: 500 });
  }
}