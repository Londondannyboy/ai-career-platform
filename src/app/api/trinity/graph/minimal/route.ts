import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return minimal hardcoded data without any database calls
    const minimalData = {
      success: true,
      userId: 'test-user-minimal',
      timestamp: new Date().toISOString(),
      data: {
        nodes: [
          {
            id: 'trinity-core-min',
            label: 'My Trinity',
            type: 'trinity-core',
            val: 30,
            color: '#FFFFFF',
            fx: 0,
            fy: 0,
            fz: 0
          }
        ],
        links: []
      },
      stats: {
        nodeCount: 1,
        linkCount: 0,
        hasTrinity: true,
        goalCount: 0,
        taskCount: 0,
        connectionCount: 0
      }
    };

    return NextResponse.json(minimalData);
  } catch (error) {
    // This should never happen with hardcoded data
    return NextResponse.json(
      { 
        error: 'Minimal endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}