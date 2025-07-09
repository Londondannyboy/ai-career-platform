'use client';

import React, { useState, useEffect } from 'react';
import ForceGraph3DWrapper from './ForceGraph3DWrapper';
import { useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface TrinityGraph3DLiveProps {
  onNodeClick?: (node: any) => void;
  mode?: 'trinity' | 'goals' | 'full';
  testUserId?: string; // For testing without auth
  entityType?: 'person' | 'company' | 'industry';
  entityName?: string;
  onEntityNameUpdate?: (name: string) => void; // Callback to update parent's entity name
}

const TrinityGraph3DLive: React.FC<TrinityGraph3DLiveProps> = ({
  onNodeClick,
  mode = 'full',
  testUserId,
  entityType = 'person',
  entityName = 'User',
  onEntityNameUpdate
}) => {
  const { user, isLoaded } = useUser();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!isLoaded) return;
      
      const userId = testUserId || user?.id;
      if (!userId && !testUserId) {
        setError('No user ID available');
        setLoading(false);
        return;
      }
      
      console.log('[TrinityGraph3DLive] Fetching data for:', {
        testUserId,
        clerkUserId: user?.id,
        userEmail: user?.emailAddresses?.[0]?.emailAddress,
        entityType,
        entityName
      });

      try {
        setLoading(true);
        setError(null);
        
        // Handle special "current-user" case
        let url: string;
        if (testUserId === 'current-user') {
          // Try the my-data endpoint which bypasses Clerk auth issues
          const userEmail = user?.emailAddresses?.[0]?.emailAddress;
          url = userEmail 
            ? `/api/trinity/my-data?email=${encodeURIComponent(userEmail)}`
            : '/api/trinity/my-data';
        } else if (testUserId) {
          url = `/api/trinity/graph?userId=${testUserId}`;
        } else {
          url = '/api/trinity/graph';
        }
          
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          console.error('API Error Response:', result);
          // Check if it's a "no Trinity found" error vs actual error
          if (response.status === 404 && result.error?.includes('No active Trinity found')) {
            // This is expected for new users - show empty state
            setGraphData({ nodes: [], links: [] });
            setLoading(false);
            return;
          }
          throw new Error(result.error || 'Failed to fetch graph data');
        }

        if (result.success && result.data) {
          // Filter data based on mode
          let filteredData = { ...result.data };
          
          if (mode === 'trinity') {
            // Only show trinity core and aspects
            filteredData.nodes = result.data.nodes.filter((n: any) => 
              n.type === 'trinity-core' || n.type === 'trinity-aspect'
            );
            filteredData.links = result.data.links.filter((l: any) => {
              const sourceNode = filteredData.nodes.find((n: any) => n.id === l.source);
              const targetNode = filteredData.nodes.find((n: any) => n.id === l.target);
              return sourceNode && targetNode;
            });
          } else if (mode === 'goals') {
            // Show trinity and goals, but not tasks
            filteredData.nodes = result.data.nodes.filter((n: any) => 
              n.type !== 'task' && n.type !== 'connection'
            );
            filteredData.links = result.data.links.filter((l: any) => {
              const sourceNode = filteredData.nodes.find((n: any) => n.id === l.source);
              const targetNode = filteredData.nodes.find((n: any) => n.id === l.target);
              return sourceNode && targetNode;
            });
          }
          // mode === 'full' shows everything

          setGraphData(filteredData);
          setStats(result.stats);
          
          // Update entity name if we got user data from /me endpoint
          if (testUserId === 'current-user' && result.userName && onEntityNameUpdate) {
            onEntityNameUpdate(result.userName);
          } else if (testUserId === 'current-user' && user && onEntityNameUpdate) {
            // If we don't get a userName from the API, use the Clerk user data
            const displayName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.emailAddresses?.[0]?.emailAddress || 'My Trinity';
            onEntityNameUpdate(displayName);
          }
        } else {
          throw new Error('Invalid data format received');
        }
      } catch (err) {
        console.error('Error fetching Trinity graph:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [user, isLoaded, mode, testUserId]);

  // Custom node label
  const nodeLabel = (node: any) => {
    if (node.type === 'trinity-aspect' && node.fullText) {
      return `${node.label}: "${node.fullText.substring(0, 50)}..."`;
    }
    if (node.type === 'goal' && node.progress !== undefined) {
      return `${node.label} (${node.progress}% complete)`;
    }
    if (node.type === 'task') {
      return `${node.label} ${node.completed ? '✓' : `(${node.priority})`}`;
    }
    if (node.type === 'connection') {
      return `${node.label} (${Math.round(node.compatibilityScore * 100)}% match)`;
    }
    return node.label;
  };

  // Handle node click
  const handleNodeClick = (node: any) => {
    console.log('Node clicked:', node);
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Show details based on node type
    if (node.type === 'trinity-aspect' && node.fullText) {
      console.log(`${node.label}: ${node.fullText}`);
    } else if (node.type === 'goal') {
      console.log(`Goal: ${node.label}, Progress: ${node.progress}%`);
    } else if (node.type === 'task') {
      console.log(`Task: ${node.label}, Status: ${node.completed ? 'Completed' : 'Pending'}`);
    } else if (node.type === 'connection') {
      console.log(`Connection: ${node.label}, Compatibility: ${Math.round(node.compatibilityScore * 100)}%`);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading Trinity Universe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p className="text-red-400 mb-2">Error loading Trinity data</p>
          <p className="text-sm text-gray-400">{error}</p>
          {!user && !testUserId && (
            <p className="text-sm text-gray-400 mt-2">Please sign in to view your Trinity</p>
          )}
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md">
          <h2 className="text-2xl font-bold mb-4">Your Trinity Universe Awaits</h2>
          <p className="mb-6 text-gray-300">
            Create your Trinity to see your professional identity visualized in 3D space.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg text-left">
              <h3 className="font-semibold text-yellow-400 mb-2">🎯 Quest</h3>
              <p className="text-sm text-gray-400">What drives you? Your mission and purpose.</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg text-left">
              <h3 className="font-semibold text-cyan-400 mb-2">🤝 Service</h3>
              <p className="text-sm text-gray-400">How do you serve? Your unique value and contribution.</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg text-left">
              <h3 className="font-semibold text-purple-400 mb-2">🛡️ Pledge</h3>
              <p className="text-sm text-gray-400">What do you commit to? Your values and accountability.</p>
            </div>
          </div>
          <Link href="/trinity/create" className="inline-block mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
            Create Your Trinity
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ForceGraph3DWrapper
        graphData={graphData}
        backgroundColor="#000033"
        nodeLabel={nodeLabel}
        nodeAutoColorBy="type"
        linkDirectionalParticles="particles"
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        enableNodeDrag={true}
        nodeOpacity={0.9}
        linkOpacity={0.6}
        linkWidth={2}
        cooldownTicks={50}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-4 rounded-lg text-sm">
        <h3 className="font-bold mb-2">Trinity Universe</h3>
        
        {/* Profile Details */}
        <div className="mb-3 pb-3 border-b border-gray-600 text-xs">
          <p><span className="text-gray-400">User:</span> {entityName || 'Unknown'}</p>
          <p><span className="text-gray-400">ID:</span> {testUserId || user?.id || 'No ID'}</p>
          <p><span className="text-gray-400">Source:</span> {testUserId === 'current-user' ? 'Deep Repo' : 'Trinity Table'}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <span>Trinity Core</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Quest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <span>Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span>Pledge</span>
          </div>
          {(mode === 'goals' || mode === 'full') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Goals ({stats?.goalCount || 0})</span>
              </div>
              {mode === 'full' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span>Tasks ({stats?.taskCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    <span>Connections ({stats?.connectionCount || 0})</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {stats && (
          <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-300">
            <p>Total nodes: {stats.nodeCount}</p>
            <p>Total links: {stats.linkCount}</p>
            {graphData.nodes.length > 0 && (
              <div className="mt-1">
                <p className="text-yellow-400">Trinity Data:</p>
                <p className="text-[10px] break-all">
                  Q: {graphData.nodes.find(n => n.type === 'trinity-aspect' && n.label === 'Quest')?.fullText?.substring(0, 30)}...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrinityGraph3DLive;