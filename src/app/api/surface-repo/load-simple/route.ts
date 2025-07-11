import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth
    const { userId } = await auth();
    
    if (!userId) {
      console.error('No authenticated user for load');
      return NextResponse.json({ 
        success: true, 
        data: {},
        message: 'No authenticated user'
      });
    }
    
    console.log('Loading surface repo for user:', userId);
    
    // First check if user profile exists
    const result = await sql`
      SELECT surface_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      // Create profile if it doesn't exist
      await sql`
        INSERT INTO user_profiles (user_id, surface_repo, working_repo, personal_repo, deep_repo)
        VALUES (${userId}, '{}', '{}', '{}', '{}')
        ON CONFLICT (user_id) DO NOTHING
      `;
      
      return NextResponse.json({ 
        success: true, 
        data: {},
        message: 'New profile created'
      });
    }

    const data = result.rows[0]?.surface_repo || {};
    console.log('Loaded surface repo data:', JSON.stringify(data).slice(0, 100) + '...');
    
    return NextResponse.json({ 
      success: true, 
      data,
      userId 
    });
  } catch (error: any) {
    console.error('Load error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to load' 
    }, { status: 500 });
  }
}