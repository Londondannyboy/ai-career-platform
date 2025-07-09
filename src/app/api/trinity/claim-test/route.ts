import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Claim a test Trinity and assign it to your real user ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, testUserId } = body;
    
    if (!email || !testUserId) {
      return NextResponse.json({ 
        error: 'Email and testUserId required',
        usage: 'POST with { email: "your-email", testUserId: "test-user-123" }'
      }, { status: 400 });
    }

    // First, find the real user by email
    const userResult = await sql`
      SELECT id, email, name 
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        error: 'User not found with that email',
        email: email
      }, { status: 404 });
    }

    const realUser = userResult.rows[0];

    // Check if the test Trinity exists
    const testTrinityResult = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${testUserId}
      AND is_active = true
      LIMIT 1
    `;

    if (testTrinityResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Test Trinity not found',
        testUserId: testUserId
      }, { status: 404 });
    }

    const testTrinity = testTrinityResult.rows[0];

    // Check if user already has a Trinity
    const existingTrinityResult = await sql`
      SELECT id FROM trinity_statements
      WHERE user_id = ${realUser.id}
      LIMIT 1
    `;

    if (existingTrinityResult.rows.length > 0) {
      return NextResponse.json({
        error: 'User already has a Trinity',
        hint: 'Delete existing Trinity first or use update endpoint'
      }, { status: 409 });
    }

    // Create a new Trinity for the real user with the test data
    const newTrinityResult = await sql`
      INSERT INTO trinity_statements (
        user_id,
        quest,
        service,
        pledge,
        quest_seal,
        type,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${realUser.id},
        ${testTrinity.quest},
        ${testTrinity.service},
        ${testTrinity.pledge},
        ${testTrinity.quest_seal || `F-${Date.now()}`},
        ${testTrinity.type || 'F'},
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: 'Trinity claimed successfully!',
      user: {
        id: realUser.id,
        email: realUser.email,
        name: realUser.name
      },
      trinity: newTrinityResult.rows[0],
      originalTestUserId: testUserId
    });
  } catch (error) {
    console.error('Trinity claim error:', error);
    return NextResponse.json({
      error: 'Failed to claim Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method to check what can be claimed
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        error: 'Email required',
        usage: 'GET /api/trinity/claim-test?email=your-email'
      }, { status: 400 });
    }

    // Find the real user
    const userResult = await sql`
      SELECT id, email, name 
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        email: email
      }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if user already has Trinity
    const existingTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    // Get available test Trinities
    const testTrinities = await sql`
      SELECT user_id, quest, service, pledge, created_at
      FROM trinity_statements
      WHERE user_id LIKE 'test-%'
      AND is_active = true
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      hasExistingTrinity: existingTrinity.rows.length > 0,
      existingTrinity: existingTrinity.rows[0] || null,
      availableTestTrinities: testTrinities.rows,
      instructions: existingTrinity.rows.length === 0 
        ? "You can claim one of these test Trinities by POSTing to this endpoint with { email: 'your-email', testUserId: 'test-user-id' }"
        : "You already have a Trinity. Delete it first if you want to claim a test one."
    });
  } catch (error) {
    console.error('Trinity claim check error:', error);
    return NextResponse.json({
      error: 'Failed to check claimable Trinities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}