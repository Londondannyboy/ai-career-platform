import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    
    // Check all trinity statements for this user
    const result = await sql`
      SELECT 
        id, 
        user_id, 
        quest, 
        service, 
        pledge, 
        quest_seal,
        is_active,
        created_at, 
        updated_at
      FROM trinity_statements
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    const trinityStatements = result.rows;

    // Check if there are any trinity statements
    const activeTrinity = trinityStatements.find((t: any) => t.is_active);
    
    // Get user details
    const userDetails = {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };

    return NextResponse.json({
      success: true,
      user: userDetails,
      trinityCount: trinityStatements.length,
      hasActiveTrinity: !!activeTrinity,
      activeTrinity: activeTrinity || null,
      allTrinities: trinityStatements,
      debugInfo: {
        clerkUserId: user.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in debug-user endpoint:', error);
    return NextResponse.json({
      error: 'Failed to debug user',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}