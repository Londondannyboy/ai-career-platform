import { NextRequest, NextResponse } from 'next/server';

// Test endpoint that returns sample Trinity graph data without authentication
export async function GET(request: NextRequest) {
  const sampleData = {
    nodes: [
      {
        id: 'trinity-core-test',
        label: 'Test Trinity',
        type: 'trinity-core',
        val: 30,
        color: '#FFFFFF',
        fx: 0,
        fy: 0,
        fz: 0
      },
      {
        id: 'trinity-quest-test',
        label: 'Quest',
        type: 'trinity-aspect',
        val: 20,
        color: '#FFD700',
        x: 100,
        y: 0,
        z: 0,
        fullText: 'To revolutionize professional networking through authentic connections'
      },
      {
        id: 'trinity-service-test',
        label: 'Service',
        type: 'trinity-aspect',
        val: 20,
        color: '#00CED1',
        x: -50,
        y: 86.6,
        z: 0,
        fullText: 'Creating technology that empowers individuals to find their purpose'
      },
      {
        id: 'trinity-pledge-test',
        label: 'Pledge',
        type: 'trinity-aspect',
        val: 20,
        color: '#9370DB',
        x: -50,
        y: -86.6,
        z: 0,
        fullText: 'Committed to privacy, authenticity, and meaningful human connection'
      },
      {
        id: 'goal-1',
        label: 'Launch Platform',
        type: 'goal',
        val: 15,
        color: '#4169E1',
        x: 150,
        y: 50,
        z: 25,
        progress: 75,
        trinityAspect: 'quest'
      },
      {
        id: 'goal-2',
        label: 'Build Community',
        type: 'goal',
        val: 15,
        color: '#4169E1',
        x: -100,
        y: 150,
        z: -25,
        progress: 60,
        trinityAspect: 'service'
      }
    ],
    links: [
      {
        source: 'trinity-core-test',
        target: 'trinity-quest-test',
        color: '#FFD700',
        particles: 2
      },
      {
        source: 'trinity-core-test',
        target: 'trinity-service-test',
        color: '#00CED1',
        particles: 2
      },
      {
        source: 'trinity-core-test',
        target: 'trinity-pledge-test',
        color: '#9370DB',
        particles: 2
      },
      {
        source: 'trinity-quest-test',
        target: 'goal-1',
        color: '#FFD700',
        particles: 3
      },
      {
        source: 'trinity-service-test',
        target: 'goal-2',
        color: '#00CED1',
        particles: 3
      }
    ]
  };

  return NextResponse.json({
    success: true,
    userId: 'test-user',
    timestamp: new Date().toISOString(),
    data: sampleData,
    stats: {
      nodeCount: sampleData.nodes.length,
      linkCount: sampleData.links.length,
      hasTrinity: true,
      goalCount: 2,
      taskCount: 0,
      connectionCount: 0
    },
    message: 'This is test data for debugging purposes'
  });
}