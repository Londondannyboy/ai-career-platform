import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Get Trinity data for current user using their email from headers
export async function GET(request: NextRequest) {
  try {
    // Try to get user email from various sources
    const headers = request.headers;
    const userEmail = headers.get('x-user-email') || 
                     headers.get('user-email') ||
                     request.nextUrl.searchParams.get('email');
    
    if (!userEmail) {
      return NextResponse.json({ 
        error: 'Unable to identify user',
        hint: 'Pass email as query parameter: ?email=your-email@example.com'
      }, { status: 401 });
    }

    // First find the user by email
    const userResult = await sql`
      SELECT id, email, name 
      FROM users 
      WHERE email = ${userEmail}
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      // Try to find by Clerk ID pattern (if email contains user_)
      const clerkIdMatch = userEmail.match(/user_[a-zA-Z0-9]+/);
      if (clerkIdMatch) {
        const clerkId = clerkIdMatch[0];
        const trinityByClerkId = await sql`
          SELECT * FROM trinity_statements
          WHERE user_id = ${clerkId}
          AND is_active = true
          LIMIT 1
        `;
        
        if (trinityByClerkId.rows.length > 0) {
          const graphData = await buildSimpleGraph(clerkId, trinityByClerkId.rows[0]);
          return NextResponse.json({
            success: true,
            userId: clerkId,
            userName: 'User',
            data: graphData
          });
        }
      }
      
      return NextResponse.json({
        error: 'User not found',
        email: userEmail
      }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get Trinity data
    const trinityResult = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${user.id}
      AND is_active = true
      LIMIT 1
    `;

    if (trinityResult.rows.length === 0) {
      return NextResponse.json({
        error: 'No active Trinity found',
        userId: user.id
      }, { status: 404 });
    }

    const trinity = trinityResult.rows[0];
    const graphData = await buildSimpleGraph(user.id, trinity);

    return NextResponse.json({
      success: true,
      userId: user.id,
      userName: user.name || user.email,
      userEmail: user.email,
      data: graphData,
      stats: {
        nodeCount: graphData.nodes.length,
        linkCount: graphData.links.length
      }
    });
  } catch (error) {
    console.error('My Trinity data error:', error);
    return NextResponse.json({
      error: 'Failed to fetch Trinity data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simple graph builder without external dependencies
async function buildSimpleGraph(userId: string, trinity: any) {
  const nodes: any[] = [];
  const links: any[] = [];

  // Central Trinity node
  nodes.push({
    id: `trinity-core-${userId}`,
    label: 'My Trinity',
    type: 'trinity-core',
    val: 30,
    color: '#FFFFFF',
    fx: 0,
    fy: 0,
    fz: 0
  });

  // Trinity aspects
  const aspects = [
    { id: 'quest', label: 'Quest', value: trinity.quest, angle: 0, color: '#FFD700' },
    { id: 'service', label: 'Service', value: trinity.service, angle: 120, color: '#00CED1' },
    { id: 'pledge', label: 'Pledge', value: trinity.pledge, angle: 240, color: '#9370DB' }
  ];

  const radius = 100;
  aspects.forEach((aspect) => {
    const angleRad = (aspect.angle * Math.PI) / 180;
    nodes.push({
      id: `trinity-${aspect.id}-${userId}`,
      label: aspect.label,
      type: 'trinity-aspect',
      val: 20,
      color: aspect.color,
      x: radius * Math.cos(angleRad),
      y: radius * Math.sin(angleRad),
      z: 0,
      fullText: aspect.value
    });

    links.push({
      source: `trinity-core-${userId}`,
      target: `trinity-${aspect.id}-${userId}`,
      color: aspect.color,
      particles: 2
    });
  });

  // Add sample goals
  const sampleGoals = [
    { id: 'goal-1', title: 'Build Trinity Platform', aspect: 'quest', progress: 85 },
    { id: 'goal-2', title: 'Serve Users', aspect: 'service', progress: 70 },
    { id: 'goal-3', title: 'Maintain Values', aspect: 'pledge', progress: 90 }
  ];

  sampleGoals.forEach((goal, index) => {
    const angle = (index * 120) + 60;
    const angleRad = (angle * Math.PI) / 180;
    nodes.push({
      id: goal.id,
      label: goal.title,
      type: 'goal',
      val: 15,
      color: '#4169E1',
      x: 200 * Math.cos(angleRad),
      y: 200 * Math.sin(angleRad),
      z: 0,
      progress: goal.progress
    });

    links.push({
      source: `trinity-${goal.aspect}-${userId}`,
      target: goal.id,
      color: '#4169E1',
      particles: Math.floor(goal.progress / 20)
    });
  });

  return { nodes, links };
}