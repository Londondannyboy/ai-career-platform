import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { TrinityGraphService } from '@/lib/visualization/trinityGraphService';

// This endpoint uses Clerk authentication to get the current user's Trinity
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in to view your Trinity.', requiresAuth: true },
        { status: 401 }
      );
    }

    // Build the Trinity graph data for the authenticated user
    const graphData = await TrinityGraphService.buildTrinityGraph(user.id);

    // Add metadata
    const response = {
      success: true,
      userId: user.id,
      userName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.emailAddresses?.[0]?.emailAddress || 'User',
      userEmail: user.emailAddresses?.[0]?.emailAddress,
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
    console.error('Error in Trinity graph /me API:', error);
    
    const errorDetails: any = {
      error: 'Failed to fetch your Trinity data',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name,
      code: (error as any)?.code
    };
    
    // Include stack trace for debugging
    if (error instanceof Error && process.env.NODE_ENV === 'development') {
      errorDetails.stack = error.stack;
    }
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}