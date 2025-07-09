import { NextRequest, NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// Create Trinity in Deep Repo (new clean architecture)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, quest, service, pledge, type = 'F' } = body;
    
    if (!userId || !quest || !service || !pledge) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['userId', 'quest', 'service', 'pledge']
      }, { status: 400 });
    }
    
    // Create Trinity in Deep Repo
    const trinity = {
      quest,
      service,
      pledge,
      type: type as 'F' | 'L' | 'M',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const success = await DeepRepoService.saveTrinity(userId, trinity);
    
    if (success) {
      // Fetch the complete profile to confirm
      const profile = await DeepRepoService.getUserProfile(userId);
      
      return NextResponse.json({
        success: true,
        message: 'Trinity created in Deep Repo',
        profile: {
          userId: profile?.userId,
          deepRepo: profile?.deepRepo,
          createdAt: profile?.createdAt
        }
      });
    } else {
      throw new Error('Failed to save Trinity');
    }
  } catch (error) {
    console.error('Create Trinity error:', error);
    return NextResponse.json({
      error: 'Failed to create Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET to check if user has Trinity in Deep Repo
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId required',
        usage: 'GET /api/trinity/create-deep-repo?userId=YOUR_USER_ID'
      }, { status: 400 });
    }
    
    const trinity = await DeepRepoService.getTrinity(userId);
    const deepRepo = await DeepRepoService.getDeepRepo(userId);
    
    return NextResponse.json({
      userId,
      hasTrinity: !!trinity,
      trinity,
      deepRepo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get Trinity error:', error);
    return NextResponse.json({
      error: 'Failed to get Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}