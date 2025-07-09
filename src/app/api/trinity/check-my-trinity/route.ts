import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSql } from '@/lib/db';

// Simple endpoint to check current user's Trinity
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sql = await getSql();
    
    // Direct SQL query
    const trinityResult = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        name: `${user.firstName} ${user.lastName}`
      },
      trinityCount: trinityResult.length,
      trinities: trinityResult,
      hasActiveTrinity: trinityResult.some(t => t.is_active),
      debug: {
        clerkUserId: user.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Check my trinity error:', error);
    return NextResponse.json({
      error: 'Failed to check trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}