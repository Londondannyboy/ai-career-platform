import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Try to get auth
    let userId = null;
    let authError = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (e: any) {
      authError = e.message;
    }

    // Check database connection
    let dbStatus = 'not tested';
    let userProfiles = [];
    let dbError = null;
    
    try {
      const result = await sql`SELECT COUNT(*) as count FROM user_profiles`;
      dbStatus = 'connected';
      
      // Get a few user profiles to see what user_ids look like
      const profilesResult = await sql`
        SELECT user_id, 
               CASE 
                 WHEN surface_repo IS NULL THEN 'null'
                 WHEN surface_repo::text = '{}' THEN 'empty'
                 ELSE 'has data'
               END as surface_status,
               CASE 
                 WHEN working_repo IS NULL THEN 'null'
                 WHEN working_repo::text = '{}' THEN 'empty'
                 ELSE 'has data'
               END as working_status
        FROM user_profiles 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      userProfiles = profilesResult.rows;
    } catch (e: any) {
      dbStatus = 'error';
      dbError = e.message;
    }

    // If we have a userId, check their specific data
    let userData = null;
    if (userId && dbStatus === 'connected') {
      try {
        const userResult = await sql`
          SELECT user_id, surface_repo, working_repo 
          FROM user_profiles 
          WHERE user_id = ${userId}
          LIMIT 1
        `;
        
        if (userResult.rows.length > 0) {
          const row = userResult.rows[0];
          userData = {
            found: true,
            hasExperiences: !!(row.surface_repo?.experience?.length > 0),
            experienceCount: row.surface_repo?.experience?.length || 0,
            hasSkills: !!(row.working_repo?.skills?.length > 0),
            skillsCount: row.working_repo?.skills?.length || 0
          };
        } else {
          userData = { found: false };
        }
      } catch (e: any) {
        userData = { error: e.message };
      }
    }

    return NextResponse.json({
      auth: {
        userId,
        error: authError
      },
      database: {
        status: dbStatus,
        error: dbError,
        userProfiles
      },
      currentUser: userData,
      visualization: {
        careerTimelineApiUrl: '/api/surface-repo/load-simple',
        skillsUniverseApiUrl: '/api/deep-repo/working/skills',
        note: 'Both visualization pages fetch data from these endpoints'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}