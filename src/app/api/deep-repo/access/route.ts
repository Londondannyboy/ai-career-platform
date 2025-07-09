import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// GET /api/deep-repo/access - Check access levels
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target userId is required' },
        { status: 400 }
      );
    }

    const access = await DeepRepoService.checkRepoAccess(targetUserId, userId);

    return NextResponse.json({
      success: true,
      access,
      ownerId: targetUserId,
      viewerId: userId
    });
  } catch (error) {
    console.error('Error checking repo access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}

// POST /api/deep-repo/access - Grant access to another user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      grantedToId, 
      level, 
      relationshipType = 'connection',
      reason,
      expiresDays
    } = body;

    // Validate required fields
    if (!grantedToId || !level) {
      return NextResponse.json(
        { error: 'grantedToId and level are required' },
        { status: 400 }
      );
    }

    // Validate level
    if (!['surface', 'working', 'personal', 'deep'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level. Must be one of: surface, working, personal, deep' },
        { status: 400 }
      );
    }

    // Can't grant access to yourself
    if (grantedToId === userId) {
      return NextResponse.json(
        { error: 'Cannot grant access to yourself' },
        { status: 400 }
      );
    }

    const success = await DeepRepoService.grantRepoAccess(
      userId,
      grantedToId,
      level,
      relationshipType,
      reason,
      expiresDays
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to grant access' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${level} access to user ${grantedToId}`,
      access: {
        ownerId: userId,
        grantedToId,
        level,
        relationshipType,
        reason,
        expiresDays
      }
    });
  } catch (error) {
    console.error('Error granting repo access:', error);
    return NextResponse.json(
      { error: 'Failed to grant access' },
      { status: 500 }
    );
  }
}

// DELETE /api/deep-repo/access - Revoke access
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const revokeFromId = searchParams.get('userId');

    if (!revokeFromId) {
      return NextResponse.json(
        { error: 'userId to revoke is required' },
        { status: 400 }
      );
    }

    // Revoke all access by setting expiration to now
    const success = await DeepRepoService.grantRepoAccess(
      userId,
      revokeFromId,
      'surface', // Downgrade to surface-only
      'revoked',
      'Access revoked by owner',
      0 // Expire immediately
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke access' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully revoked access for user ${revokeFromId}`
    });
  } catch (error) {
    console.error('Error revoking repo access:', error);
    return NextResponse.json(
      { error: 'Failed to revoke access' },
      { status: 500 }
    );
  }
}