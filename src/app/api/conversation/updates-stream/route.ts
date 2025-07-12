import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Store active connections
const connections = new Map<string, WritableStreamDefaultWriter>();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 });
  }

  // Create readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Function to send data to client
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Store connection for this user
      const writer = {
        write: send,
        close: () => controller.close()
      } as any;
      
      connections.set(userId, writer);

      // Send initial connection confirmation
      send({ type: 'connected', timestamp: new Date().toISOString() });

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        connections.delete(userId);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Helper function to broadcast updates to specific user
export function broadcastToUser(userId: string, data: any) {
  const writer = connections.get(userId);
  if (writer) {
    writer.write(data);
  }
}

// Helper function to broadcast analysis status
export function broadcastAnalysisStatus(userId: string, status: 'start' | 'complete') {
  broadcastToUser(userId, {
    type: status === 'start' ? 'analysis_start' : 'analysis_complete',
    timestamp: new Date().toISOString()
  });
}

// Helper function to broadcast profile updates
export function broadcastProfileUpdate(userId: string, update: {
  updateType: string;
  updateData: any;
  confidence: number;
  reason: string;
}) {
  broadcastToUser(userId, {
    type: 'profile_update',
    ...update,
    timestamp: new Date().toISOString()
  });
}