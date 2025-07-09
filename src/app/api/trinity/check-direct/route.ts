import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Direct Trinity check - no auth, just query by user ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      // List all Trinity statements (for debugging)
      const allTrinities = await sql`
        SELECT 
          user_id,
          quest,
          service,
          pledge,
          is_active,
          created_at
        FROM trinity_statements
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      return NextResponse.json({
        message: 'No userId provided. Showing recent Trinity statements:',
        trinities: allTrinities.rows,
        usage: 'Add ?userId=YOUR_USER_ID to check specific user'
      });
    }

    // Check Trinity for specific user
    const trinityResult = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      userId: userId,
      trinityCount: trinityResult.rows.length,
      trinities: trinityResult.rows,
      hasActiveTrinity: trinityResult.rows.some(t => t.is_active),
      activeTrinity: trinityResult.rows.find(t => t.is_active) || null
    });
  } catch (error) {
    console.error('Direct Trinity check error:', error);
    return NextResponse.json({
      error: 'Failed to check Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}