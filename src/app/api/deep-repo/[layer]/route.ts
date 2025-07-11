import { NextRequest, NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

type ValidLayer = 'surface' | 'surfacePrivate' | 'personal' | 'deep';

// GET /api/deep-repo/[layer] - Get specific repo layer
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ layer: string }> }
) {
  try {
    const { layer } = await context.params;
    const userId = request.nextUrl.searchParams.get('userId') || 'test-user-123';
    
    if (!['surface', 'surfacePrivate', 'personal', 'deep'].includes(layer)) {
      return NextResponse.json({ error: 'Invalid layer' }, { status: 400 });
    }

    const data = await DeepRepoService.getRepoLayer(userId, layer as ValidLayer);
    
    return NextResponse.json({
      userId,
      layer,
      data: data || {}
    });
  } catch (error) {
    console.error('Get repo layer error:', error);
    return NextResponse.json({ 
      error: 'Failed to get repo layer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/deep-repo/[layer] - Update specific repo layer
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ layer: string }> }
) {
  try {
    const { layer } = await context.params;
    const body = await request.json();
    const { userId = 'test-user-123', data } = body;
    
    if (!['surface', 'surfacePrivate', 'personal', 'deep'].includes(layer)) {
      return NextResponse.json({ error: 'Invalid layer' }, { status: 400 });
    }

    const success = await DeepRepoService.updateRepoLayer(userId, layer as ValidLayer, data);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${layer} repo updated successfully`,
      userId,
      layer
    });
  } catch (error) {
    console.error('Update repo layer error:', error);
    return NextResponse.json({ 
      error: 'Failed to update repo layer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}