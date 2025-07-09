import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Direct test without using the service
    const testUserId = 'test-user-123';
    
    // Test 1: Can we use SQL?
    let trinityData = null;
    try {
      const result = await sql`
        SELECT 
          id,
          user_id,
          quest,
          service,
          pledge,
          type
        FROM trinity_statements
        WHERE user_id = ${testUserId} 
        AND is_active = true
        LIMIT 1
      `;
      trinityData = result.rows[0];
    } catch (error) {
      return NextResponse.json({
        error: 'SQL query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code
      }, { status: 500 });
    }

    // Build simple graph data
    const nodes = [];
    const links = [];

    if (trinityData) {
      // Add core
      nodes.push({
        id: 'trinity-core',
        label: 'My Trinity',
        type: 'trinity-core',
        val: 30,
        color: '#FFFFFF',
        fx: 0,
        fy: 0,
        fz: 0
      });

      // Add aspects
      const aspects = [
        { id: 'quest', label: 'Quest', value: trinityData.quest, color: '#FFD700', angle: 0 },
        { id: 'service', label: 'Service', value: trinityData.service, color: '#00CED1', angle: 120 },
        { id: 'pledge', label: 'Pledge', value: trinityData.pledge, color: '#9370DB', angle: 240 }
      ];

      aspects.forEach(aspect => {
        const angleRad = (aspect.angle * Math.PI) / 180;
        nodes.push({
          id: `trinity-${aspect.id}`,
          label: aspect.label,
          type: 'trinity-aspect',
          val: 20,
          color: aspect.color,
          x: 100 * Math.cos(angleRad),
          y: 100 * Math.sin(angleRad),
          z: 0,
          fullText: aspect.value
        });

        links.push({
          source: 'trinity-core',
          target: `trinity-${aspect.id}`,
          color: aspect.color,
          particles: 2
        });
      });
    }

    return NextResponse.json({
      success: true,
      userId: testUserId,
      hasTrinityData: !!trinityData,
      data: { nodes, links },
      stats: {
        nodeCount: nodes.length,
        linkCount: links.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Direct endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}