import { NextRequest, NextResponse } from 'next/server';
import { broadcastAnalysisStatus } from '../updates-stream/route';

export async function POST(request: NextRequest) {
  try {
    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }

    if (!['start', 'complete'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "start" or "complete"' }, { status: 400 });
    }

    // Broadcast the analysis status to the user's stream
    broadcastAnalysisStatus(userId, status);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error broadcasting status:', error);
    return NextResponse.json({ error: 'Failed to broadcast status' }, { status: 500 });
  }
}