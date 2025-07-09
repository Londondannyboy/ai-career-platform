import { NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';
import { auth } from '@clerk/nextjs/server';

// GET /api/deep-repo/user - Get authenticated user's Deep Repo Trinity
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        requiresAuth: true 
      }, { status: 401 });
    }

    // Get or create user profile
    const profile = await DeepRepoService.getUserProfile(userId);
    
    if (!profile) {
      return NextResponse.json({ 
        error: 'Failed to get user profile',
        userId 
      }, { status: 404 });
    }

    // Get Trinity data from Deep Repo
    const trinity = await DeepRepoService.getTrinity(userId);
    
    // If no Trinity exists, return empty state
    if (!trinity) {
      return NextResponse.json({
        userId,
        trinity: null,
        profile,
        message: 'No Trinity found - please create one first'
      });
    }

    // Return Trinity with visualization data
    return NextResponse.json({
      userId,
      trinity,
      profile,
      visualization: {
        nodes: [
          {
            id: 'trinity-core',
            name: 'My Trinity',
            group: 'trinity',
            color: '#FFD700',
            size: 40,
            x: 0,
            y: 0,
            z: 0
          },
          {
            id: 'quest',
            name: 'Quest',
            group: 'trinity-element',
            color: '#FF6B6B',
            size: 30,
            x: 100,
            y: 0,
            z: 0,
            value: trinity.quest
          },
          {
            id: 'service',
            name: 'Service',
            group: 'trinity-element',
            color: '#4ECDC4',
            size: 30,
            x: -50,
            y: 86,
            z: 0,
            value: trinity.service
          },
          {
            id: 'pledge',
            name: 'Pledge',
            group: 'trinity-element',
            color: '#45B7D1',
            size: 30,
            x: -50,
            y: -86,
            z: 0,
            value: trinity.pledge
          }
        ],
        links: [
          { source: 'trinity-core', target: 'quest' },
          { source: 'trinity-core', target: 'service' },
          { source: 'trinity-core', target: 'pledge' },
          { source: 'quest', target: 'service' },
          { source: 'service', target: 'pledge' },
          { source: 'pledge', target: 'quest' }
        ]
      }
    });
  } catch (error) {
    console.error('Deep Repo user error:', error);
    return NextResponse.json({ 
      error: 'Failed to get user Trinity data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}