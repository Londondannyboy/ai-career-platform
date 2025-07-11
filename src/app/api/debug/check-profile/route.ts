import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID - handle auth failures gracefully
    let userId = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (e) {
      console.log('Auth failed during profile check');
    }

    // Also check for any anonymous saves
    const anonPattern = 'anon-%';

    // Query all profiles
    const result = await sql`
      SELECT 
        user_id, 
        surface_repo,
        created_at,
        updated_at
      FROM user_profiles 
      WHERE user_id = ${userId || 'no-user'} 
         OR user_id LIKE ${anonPattern}
      ORDER BY updated_at DESC
      LIMIT 10
    `;

    // Also check if the table exists and has any data
    const tableCheck = await sql`
      SELECT COUNT(*) as total_profiles FROM user_profiles
    `;

    // Check table schema
    const schemaCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      success: true,
      userId,
      profiles: result.rows,
      totalProfiles: tableCheck.rows[0]?.total_profiles || 0,
      tableSchema: schemaCheck.rows,
      message: `Found ${result.rows.length} profiles for user ${userId || 'anonymous'}`
    });
  } catch (error: any) {
    console.error('Profile check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check profile',
      stack: error.stack
    });
  }
}