import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// GET /api/deep-repo/[layer] - Get specific repo layer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layer: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { layer: layerParam } = await params;
    const layer = layerParam as 'surface' | 'working' | 'personal' | 'deep';
    const validLayers = ['surface', 'working', 'personal', 'deep'];
    
    if (!validLayers.includes(layer)) {
      return NextResponse.json({ 
        error: 'Invalid layer',
        validLayers 
      }, { status: 400 });
    }
    
    const data = await DeepRepoService.getRepoLayer(user.id, layer);
    
    return NextResponse.json({
      success: true,
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
  { params }: { params: Promise<{ layer: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { layer: layerParam } = await params;
    const layer = layerParam as 'surface' | 'working' | 'personal' | 'deep';
    const validLayers = ['surface', 'working', 'personal', 'deep'];
    
    if (!validLayers.includes(layer)) {
      return NextResponse.json({ 
        error: 'Invalid layer',
        validLayers 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { data, merge = true } = body;
    
    let success: boolean;
    if (merge) {
      success = await DeepRepoService.mergeRepoLayer(user.id, layer, data);
    } else {
      success = await DeepRepoService.updateRepoLayer(user.id, layer, data);
    }
    
    if (!success) {
      return NextResponse.json({
        error: 'Failed to update repo layer'
      }, { status: 500 });
    }
    
    // Get updated data
    const updatedData = await DeepRepoService.getRepoLayer(user.id, layer);
    
    return NextResponse.json({
      success: true,
      layer,
      data: updatedData
    });
  } catch (error) {
    console.error('Update repo layer error:', error);
    return NextResponse.json({
      error: 'Failed to update repo layer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/deep-repo/[layer] - Clear specific repo layer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ layer: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { layer: layerParam } = await params;
    const layer = layerParam as 'surface' | 'working' | 'personal' | 'deep';
    const validLayers = ['surface', 'working', 'personal', 'deep'];
    
    if (!validLayers.includes(layer)) {
      return NextResponse.json({ 
        error: 'Invalid layer',
        validLayers 
      }, { status: 400 });
    }
    
    const success = await DeepRepoService.updateRepoLayer(user.id, layer, {});
    
    if (!success) {
      return NextResponse.json({
        error: 'Failed to clear repo layer'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `${layer} repo cleared`
    });
  } catch (error) {
    console.error('Clear repo layer error:', error);
    return NextResponse.json({
      error: 'Failed to clear repo layer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}