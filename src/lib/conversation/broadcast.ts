// Store active connections
const connections = new Map<string, any>();

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

// Function to register a connection
export function registerConnection(userId: string, writer: any) {
  connections.set(userId, writer);
}

// Function to unregister a connection
export function unregisterConnection(userId: string) {
  connections.delete(userId);
}