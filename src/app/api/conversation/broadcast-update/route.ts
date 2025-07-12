import { NextRequest, NextResponse } from 'next/server';
import { broadcastProfileUpdate } from '@/lib/conversation/broadcast';

export async function POST(request: NextRequest) {
  try {
    const { userId, updateType, updateData, confidence, reason } = await request.json();

    if (!userId || !updateType || !updateData) {
      return NextResponse.json({ error: 'Missing required fields: userId, updateType, updateData' }, { status: 400 });
    }

    const validUpdateTypes = ['skill', 'experience', 'goal', 'achievement'];
    if (!validUpdateTypes.includes(updateType)) {
      return NextResponse.json({ error: `Invalid updateType. Must be one of: ${validUpdateTypes.join(', ')}` }, { status: 400 });
    }

    // Broadcast the profile update to the user's stream
    broadcastProfileUpdate(userId, {
      updateType,
      updateData,
      confidence: confidence || 0.8,
      reason: reason || `Detected ${updateType} during conversation`
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error broadcasting update:', error);
    return NextResponse.json({ error: 'Failed to broadcast update' }, { status: 500 });
  }
}