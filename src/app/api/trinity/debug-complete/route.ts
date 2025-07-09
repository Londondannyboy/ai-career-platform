import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Comprehensive debug endpoint showing ALL user data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || 'keegan.dan@gmail.com'; // Default to Dan's email
    
    // 1. Find user in users table
    const userResult = await sql`
      SELECT * FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = userResult.rows[0];
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        searchedEmail: email
      }, { status: 404 });
    }

    // 2. Find ALL Trinity statements for this user (by exact user_id)
    const trinityByUserId = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    // 3. Find Trinity statements that might be linked by email or partial ID match
    const trinityByEmail = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id LIKE ${'%' + email.split('@')[0] + '%'}
      OR user_id IN (
        SELECT id FROM users WHERE email = ${email}
      )
      ORDER BY created_at DESC
    `;

    // 4. Show ALL Trinity statements in the system (for debugging)
    const allTrinities = await sql`
      SELECT user_id, quest, service, pledge, is_active, created_at
      FROM trinity_statements
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // 5. Check user's other data (goals, etc if tables exist)
    let goals: any[] = [];
    try {
      const goalsResult = await sql`
        SELECT * FROM goals
        WHERE user_id = ${user.id}
        LIMIT 10
      `;
      goals = goalsResult.rows;
    } catch (e) {
      // Goals table might not exist
    }

    // 6. Show user's profile data
    let profile: any = null;
    try {
      const profileResult = await sql`
        SELECT * FROM profiles
        WHERE user_id = ${user.id}
        LIMIT 1
      `;
      profile = profileResult.rows[0];
    } catch (e) {
      // Profile table might not exist
    }

    return NextResponse.json({
      debug: {
        searchedEmail: email,
        timestamp: new Date().toISOString()
      },
      user: {
        ...user,
        hasClerkPrefix: user.id.startsWith('user_'),
        idLength: user.id.length
      },
      trinity: {
        directMatch: {
          count: trinityByUserId.rows.length,
          statements: trinityByUserId.rows,
          hasActive: trinityByUserId.rows.some(t => t.is_active)
        },
        emailMatch: {
          count: trinityByEmail.rows.length,
          statements: trinityByEmail.rows
        }
      },
      profile: profile,
      goals: goals,
      systemInfo: {
        totalTrinityStatements: allTrinities.rows.length,
        allTrinityUserIds: [...new Set(allTrinities.rows.map(t => t.user_id))],
        sampleTrinities: allTrinities.rows.slice(0, 5)
      },
      recommendations: {
        needsMigration: trinityByUserId.rows.length === 0 && allTrinities.rows.some(t => t.user_id.startsWith('test-')),
        suggestedMigration: trinityByUserId.rows.length === 0 ? {
          fromUserId: 'test-user-123',
          toUserId: user.id,
          endpoint: '/api/trinity/migrate-test'
        } : null
      }
    });
  } catch (error) {
    console.error('Complete debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}