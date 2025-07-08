import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check all Trinity statements in the database
    const trinityStatements = await sql`
      SELECT 
        id,
        user_id,
        quest,
        service,
        pledge,
        trinity_type,
        is_active,
        created_at
      FROM trinity_statements
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Count total Trinity statements
    const countResult = await sql`
      SELECT COUNT(*) as total FROM trinity_statements
    `;

    // Check test user specifically
    const testUserTrinity = await sql`
      SELECT * FROM trinity_statements 
      WHERE user_id = 'test-user-123'
    `;

    return NextResponse.json({
      success: true,
      totalCount: countResult.rows[0]?.total || 0,
      recentStatements: trinityStatements.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        quest: row.quest?.substring(0, 50) + '...',
        service: row.service?.substring(0, 50) + '...',
        pledge: row.pledge?.substring(0, 50) + '...',
        trinity_type: row.trinity_type,
        is_active: row.is_active,
        created_at: row.created_at
      })),
      testUserHasTrinity: testUserTrinity.rows.length > 0,
      testUserTrinityId: testUserTrinity.rows[0]?.id
    });

  } catch (error) {
    console.error('Trinity check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check Trinity statements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Clean up test Trinity statements
export async function DELETE(req: NextRequest) {
  try {
    // Delete test user Trinity statements
    const deleteResult = await sql`
      DELETE FROM trinity_statements 
      WHERE user_id = 'test-user-123'
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: 'Test Trinity statements cleaned up',
      deletedCount: deleteResult.rows.length,
      deletedIds: deleteResult.rows.map(r => r.id)
    });

  } catch (error) {
    console.error('Trinity cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up Trinity statements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}