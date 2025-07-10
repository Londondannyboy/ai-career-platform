import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        clerkUser: null
      });
    }

    // Check if user exists in database
    const userProfile = await sql`
      SELECT user_id, created_at, surface_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    // Also check for the email-based user_id
    const emailUserId = user?.emailAddresses[0]?.emailAddress;
    let emailUserProfile = null;
    if (emailUserId) {
      const emailResult = await sql`
        SELECT user_id, created_at, surface_repo 
        FROM user_profiles 
        WHERE user_id = ${emailUserId}
        LIMIT 1
      `;
      emailUserProfile = emailResult.rows[0];
    }

    // Get all user_ids in the database for debugging
    const allUsers = await sql`
      SELECT user_id, created_at 
      FROM user_profiles 
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({ 
      success: true,
      clerkUserId: userId,
      clerkEmail: emailUserId,
      userProfileFound: userProfile.rows.length > 0,
      userProfile: userProfile.rows[0] || null,
      emailUserProfile: emailUserProfile,
      surfaceRepoData: userProfile.rows[0]?.surface_repo || null,
      allUsersInDb: allUsers.rows,
      debug: {
        hasExperiences: !!(userProfile.rows[0]?.surface_repo?.experience?.length > 0),
        experienceCount: userProfile.rows[0]?.surface_repo?.experience?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get debug info',
      stack: error.stack
    }, { status: 500 });
  }
}