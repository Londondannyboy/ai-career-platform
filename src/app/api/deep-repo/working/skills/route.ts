import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth
    const { userId } = await auth();
    
    if (!userId) {
      // Return empty skills array for unauthenticated users
      return NextResponse.json({ 
        success: true, 
        data: { skills: [] },
        message: 'No authenticated user'
      });
    }
    
    // Try to get working repo data
    const result = await sql`
      SELECT working_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      // User profile doesn't exist yet
      return NextResponse.json({ 
        success: true, 
        data: { skills: [] },
        message: 'No profile found'
      });
    }

    const workingRepo = result.rows[0]?.working_repo || {};
    const skills = workingRepo.skills || [];

    return NextResponse.json({ 
      success: true, 
      data: { skills }
    });
  } catch (error: any) {
    console.error('Skills load error:', error);
    return NextResponse.json({ 
      success: true,
      data: { skills: [] },
      error: error.message
    });
  }
}