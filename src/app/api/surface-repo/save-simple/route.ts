import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from auth
    const { userId } = await auth();
    
    if (!userId) {
      console.error('No authenticated user for save');
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    console.log('Saving surface repo for user:', userId);

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

    console.log('Surface repo saved successfully for user:', userId);
    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Save error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save' 
    }, { status: 500 });
  }
}