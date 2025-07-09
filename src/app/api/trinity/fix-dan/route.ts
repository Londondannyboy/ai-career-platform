import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// One-click fix for Dan's Trinity data
export async function GET(request: NextRequest) {
  try {
    // Dan's actual user ID from the database
    const danUserId = 'user_2z5UB58sfZFnapkymfEkFzGIlzK';
    const testUserId = 'test-user-123';
    
    // Check current state
    const danTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${danUserId}
      LIMIT 1
    `;
    
    if (danTrinity.rows.length > 0) {
      return NextResponse.json({
        message: 'Dan already has a Trinity!',
        trinity: danTrinity.rows[0],
        fixed: true
      });
    }
    
    // Check if test Trinity exists
    const testTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${testUserId}
      AND is_active = true
      LIMIT 1
    `;
    
    if (testTrinity.rows.length === 0) {
      return NextResponse.json({
        error: 'Test Trinity not found',
        testUserId: testUserId
      });
    }
    
    // Do the migration
    const result = await sql`
      UPDATE trinity_statements
      SET user_id = ${danUserId},
          updated_at = NOW()
      WHERE user_id = ${testUserId}
      AND is_active = true
      RETURNING *
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Trinity fixed! Dan can now use "My Trinity"',
      migratedTrinity: result.rows[0],
      migration: {
        from: testUserId,
        to: danUserId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fix Dan Trinity error:', error);
    return NextResponse.json({
      error: 'Failed to fix Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}