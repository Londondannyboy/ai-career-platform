import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { TrinityGraphService } from '@/lib/visualization/trinityGraphService';

// Direct test for Dan's Trinity after migration
export async function GET(request: NextRequest) {
  try {
    const danUserId = 'user_2z5UB58sfZFnapkymfEkFzGIlzK';
    
    // Check Trinity directly
    const trinityResult = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${danUserId}
      AND is_active = true
      LIMIT 1
    `;
    
    if (trinityResult.rows.length === 0) {
      return NextResponse.json({
        error: 'No Trinity found for Dan',
        userId: danUserId,
        checked: new Date().toISOString()
      });
    }
    
    const trinity = trinityResult.rows[0];
    
    // Build graph data
    const graphData = await TrinityGraphService.buildTrinityGraph(danUserId);
    
    return NextResponse.json({
      success: true,
      message: 'Dan\'s Trinity found and graph built successfully!',
      userId: danUserId,
      trinity: {
        quest: trinity.quest,
        service: trinity.service,
        pledge: trinity.pledge,
        created: trinity.created_at,
        isActive: trinity.is_active
      },
      graphStats: {
        nodes: graphData.nodes.length,
        links: graphData.links.length,
        hasCoreNode: graphData.nodes.some(n => n.type === 'trinity-core')
      },
      graphData: graphData,
      directUrl: `/api/trinity/graph?userId=${danUserId}`
    });
  } catch (error) {
    console.error('Test Dan error:', error);
    return NextResponse.json({
      error: 'Failed to test Dan\'s Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}