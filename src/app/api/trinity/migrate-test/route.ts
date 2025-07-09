import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Simple migration to reassign test Trinity to real user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId } = body;
    
    if (!fromUserId || !toUserId) {
      return NextResponse.json({ 
        error: 'Both fromUserId and toUserId required',
        usage: 'POST with { fromUserId: "test-user-123", toUserId: "user_2z5UB58sfZFnapkymfEkFzGIlzK" }'
      }, { status: 400 });
    }

    // Update the Trinity user_id directly
    const updateResult = await sql`
      UPDATE trinity_statements
      SET user_id = ${toUserId},
          updated_at = NOW()
      WHERE user_id = ${fromUserId}
      AND is_active = true
      RETURNING *
    `;

    if (updateResult.rows.length === 0) {
      return NextResponse.json({
        error: 'No active Trinity found for the source user',
        fromUserId: fromUserId
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Trinity migrated successfully!',
      migratedTrinity: updateResult.rows[0],
      migration: {
        from: fromUserId,
        to: toUserId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Trinity migration error:', error);
    return NextResponse.json({
      error: 'Failed to migrate Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET to see what would be migrated
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromUserId = searchParams.get('fromUserId');
    const toUserId = searchParams.get('toUserId');
    
    if (!fromUserId || !toUserId) {
      // Show Dan's specific case
      return NextResponse.json({
        message: 'Migration preview - specify both user IDs',
        example: {
          fromUserId: 'test-user-123',
          toUserId: 'user_2z5UB58sfZFnapkymfEkFzGIlzK',
          usage: 'GET /api/trinity/migrate-test?fromUserId=test-user-123&toUserId=user_2z5UB58sfZFnapkymfEkFzGIlzK'
        },
        quickMigration: {
          method: 'POST',
          url: '/api/trinity/migrate-test',
          body: {
            fromUserId: 'test-user-123',
            toUserId: 'user_2z5UB58sfZFnapkymfEkFzGIlzK'
          }
        }
      });
    }

    // Check what would be migrated
    const fromTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${fromUserId}
      AND is_active = true
      LIMIT 1
    `;

    const toTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${toUserId}
      LIMIT 1
    `;

    return NextResponse.json({
      preview: {
        from: {
          userId: fromUserId,
          hasTrinity: fromTrinity.rows.length > 0,
          trinity: fromTrinity.rows[0] || null
        },
        to: {
          userId: toUserId,
          alreadyHasTrinity: toTrinity.rows.length > 0,
          existingTrinity: toTrinity.rows[0] || null
        }
      },
      canMigrate: fromTrinity.rows.length > 0 && toTrinity.rows.length === 0,
      warning: toTrinity.rows.length > 0 ? 'Target user already has a Trinity!' : null,
      action: fromTrinity.rows.length > 0 && toTrinity.rows.length === 0
        ? `POST to this endpoint with { fromUserId: "${fromUserId}", toUserId: "${toUserId}" }`
        : 'Cannot migrate - check the preview data'
    });
  } catch (error) {
    console.error('Migration preview error:', error);
    return NextResponse.json({
      error: 'Failed to preview migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}