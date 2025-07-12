import { NextRequest, NextResponse } from 'next/server';
import { registerConnection, unregisterConnection } from '@/lib/conversation/broadcast';

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
      
      registerConnection(userId, writer);

      // Send initial connection confirmation
      send({ type: 'connected', timestamp: new Date().toISOString() });

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        unregisterConnection(userId);
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