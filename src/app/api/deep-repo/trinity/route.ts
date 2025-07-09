import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';
import crypto from 'crypto';

// GET /api/deep-repo/trinity - Get Trinity from Deep Repo
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const trinity = await DeepRepoService.getTrinity(user.id);
    
    return NextResponse.json({
      success: true,
      trinity,
      hasTririty: !!trinity
    });
  } catch (error) {
    console.error('Get Trinity error:', error);
    return NextResponse.json({
      error: 'Failed to get Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/deep-repo/trinity - Create or update Trinity in Deep Repo
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { quest, service, pledge, type = 'L' } = body;
    
    // Validate required fields
    if (!quest || !service || !pledge) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['quest', 'service', 'pledge']
      }, { status: 400 });
    }
    
    // Validate type
    if (!['F', 'L', 'M'].includes(type)) {
      return NextResponse.json({
        error: 'Invalid type',
        validTypes: ['F', 'L', 'M']
      }, { status: 400 });
    }
    
    // Generate Quest Seal
    const sealData = `${user.id}:${quest}:${service}:${pledge}:${type}:${Date.now()}`;
    const questSeal = crypto
      .createHash('sha256')
      .update(sealData)
      .digest('hex');
    
    // Create Trinity object
    const trinity = {
      quest,
      service,
      pledge,
      type: type as 'F' | 'L' | 'M',
      questSeal,
      createdAt: new Date(),
      updatedAt: new Date(),
      focus: body.focus || { quest: 33, service: 33, pledge: 34 },
      coachingPreferences: body.coachingPreferences || {}
    };
    
    // Save to Deep Repo
    const success = await DeepRepoService.saveTrinity(user.id, trinity);
    
    if (!success) {
      return NextResponse.json({
        error: 'Failed to save Trinity'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      trinity,
      message: 'Trinity saved successfully'
    });
  } catch (error) {
    console.error('Save Trinity error:', error);
    return NextResponse.json({
      error: 'Failed to save Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/deep-repo/trinity - Update Trinity preferences
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { focus, coachingPreferences } = body;
    
    // Get existing Trinity
    const existingTrinity = await DeepRepoService.getTrinity(user.id);
    if (!existingTrinity) {
      return NextResponse.json({
        error: 'No Trinity found to update'
      }, { status: 404 });
    }
    
    // Update only the specified fields
    const updatedTrinity = {
      ...existingTrinity,
      updatedAt: new Date(),
      ...(focus && { focus }),
      ...(coachingPreferences && { coachingPreferences })
    };
    
    // Save updated Trinity
    const success = await DeepRepoService.saveTrinity(user.id, updatedTrinity);
    
    if (!success) {
      return NextResponse.json({
        error: 'Failed to update Trinity'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      trinity: updatedTrinity,
      message: 'Trinity preferences updated'
    });
  } catch (error) {
    console.error('Update Trinity error:', error);
    return NextResponse.json({
      error: 'Failed to update Trinity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}