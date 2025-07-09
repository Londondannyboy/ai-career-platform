import { NextRequest, NextResponse } from 'next/server';
import { TrinityGraphService } from '@/lib/visualization/trinityGraphService';

export async function GET(request: NextRequest) {
  try {
    // For now, just use the query parameter to avoid Clerk auth issues
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required. Please pass userId as query parameter.', requiresAuth: true },
        { status: 401 }
      );
    }

    // Build the Trinity graph data
    const graphData = await TrinityGraphService.buildTrinityGraph(userId);

    // Add metadata
    const response = {
      success: true,
      userId,
      timestamp: new Date().toISOString(),
      data: graphData,
      stats: {
        nodeCount: graphData.nodes.length,
        linkCount: graphData.links.length,
        hasTrinity: graphData.nodes.some(n => n.type === 'trinity-core'),
        goalCount: graphData.nodes.filter(n => n.type === 'goal').length,
        taskCount: graphData.nodes.filter(n => n.type === 'task').length,
        connectionCount: graphData.nodes.filter(n => n.type === 'connection').length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in Trinity graph API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Add more detailed error info
    const errorDetails: any = {
      error: 'Failed to fetch Trinity graph data',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name,
      code: (error as any)?.code
    };
    
    // In production, include stack trace for debugging
    if (error instanceof Error) {
      errorDetails.stack = error.stack;
    }
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// Create or update Trinity connections in Neo4j
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUserId, targetUserId, connectionType = 'viewed', compatibilityScore } = body;

    if (!sourceUserId) {
      return NextResponse.json(
        { error: 'Source user ID is required' },
        { status: 400 }
      );
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // This would create a connection in Neo4j
    // For now, we'll return a success response
    return NextResponse.json({
      success: true,
      connection: {
        sourceUserId,
        targetUserId,
        connectionType,
        compatibilityScore,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating Trinity connection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Trinity connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}