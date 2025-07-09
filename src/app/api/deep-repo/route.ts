import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// GET /api/deep-repo - Get user's Deep Repo profile
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target user ID from query params (for viewing others' profiles)
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('userId') || userId;

    // Get profile with access control
    const profile = await DeepRepoService.getProfileWithAccess(targetUserId, userId);
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      isOwnProfile: targetUserId === userId
    });
  } catch (error) {
    console.error('Error fetching Deep Repo profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST /api/deep-repo - Update user's Deep Repo profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { layer, data, merge = false } = body;

    // Validate layer
    if (!['surface', 'working', 'personal', 'deep'].includes(layer)) {
      return NextResponse.json(
        { error: 'Invalid layer. Must be one of: surface, working, personal, deep' },
        { status: 400 }
      );
    }

    // Update the specified layer
    let success: boolean;
    if (merge) {
      success = await DeepRepoService.mergeRepoLayer(userId, layer, data);
    } else {
      success = await DeepRepoService.updateRepoLayer(userId, layer, data);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Return updated profile
    const updatedProfile = await DeepRepoService.getUserProfile(userId);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: `Successfully updated ${layer} repository`
    });
  } catch (error) {
    console.error('Error updating Deep Repo profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// PUT /api/deep-repo - Update specific field in Deep Repo
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { field, value } = body;

    if (!field) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      );
    }

    // Update the specific field in deep repo
    const success = await DeepRepoService.updateDeepRepo(userId, field, value);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update deep repo field' },
        { status: 500 }
      );
    }

    // Return updated deep repo
    const updatedDeepRepo = await DeepRepoService.getDeepRepo(userId);

    return NextResponse.json({
      success: true,
      deepRepo: updatedDeepRepo,
      message: `Successfully updated ${field} in deep repository`
    });
  } catch (error) {
    console.error('Error updating Deep Repo field:', error);
    return NextResponse.json(
      { error: 'Failed to update deep repo field' },
      { status: 500 }
    );
  }
}