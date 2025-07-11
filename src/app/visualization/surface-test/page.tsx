'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

// Dynamically import 3D component to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SurfaceTestPage() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadVisualization = async () => {
    if (!user?.id) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/surface-repo/visualize-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Surface Repo Test Visualization</h1>
      
      <div className="mb-4 space-y-2">
        <p>User loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</p>
      </div>

      <button
        onClick={loadVisualization}
        disabled={!user || loading}
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Loading...' : 'Load Visualization'}
      </button>

      {error && (
        <div className="bg-red-900/50 p-4 rounded mb-4">
          <p className="text-red-300">Error: {error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Data Received</h2>
            <p>Nodes: {data.visualization?.nodes?.length || 0}</p>
            <p>Links: {data.visualization?.links?.length || 0}</p>
          </div>

          {data.visualization && (
            <div className="h-[600px] bg-black rounded">
              <ForceGraph3D
                graphData={data.visualization}
                nodeLabel={(node: any) => node.name}
                nodeVal={(node: any) => node.size || 10}
                nodeColor={(node: any) => node.color || '#ffffff'}
                linkColor={() => 'rgba(255,255,255,0.3)'}
                backgroundColor="#000000"
                showNavInfo={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}