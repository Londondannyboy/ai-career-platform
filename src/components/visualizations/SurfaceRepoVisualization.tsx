'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import SafeForceGraph from './SafeForceGraph';

interface Props {
  username: string;
}

export default function SurfaceRepoVisualization({ username }: Props) {
  const { user, isLoaded } = useUser();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      loadVisualizationData();
    }
  }, [username, isLoaded]);

  const loadVisualizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the same endpoint we fixed yesterday
      const response = await fetch('/api/surface-repo/visualize-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || username })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nodes && data.nodes.length > 0) {
          setGraphData(data);
        } else {
          // Use test data if no real data
          setGraphData({
            nodes: [
              { id: 'profile', name: username, type: 'profile', color: '#3B82F6' },
              { id: 'skill1', name: 'React', type: 'skill', color: '#10B981' },
              { id: 'skill2', name: 'TypeScript', type: 'skill', color: '#10B981' },
              { id: 'exp1', name: 'Quest', type: 'experience', color: '#F59E0B' }
            ],
            links: [
              { source: 'profile', target: 'skill1' },
              { source: 'profile', target: 'skill2' },
              { source: 'profile', target: 'exp1' }
            ]
          });
        }
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading visualization:', error);
      setError('Failed to load network data');
      // Use fallback data
      setGraphData({
        nodes: [
          { id: 'profile', name: username, type: 'profile', color: '#3B82F6' }
        ],
        links: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading network...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  }

  if (!graphData || graphData.nodes.length === 0) {
    return <div className="flex items-center justify-center h-full">No data to display</div>;
  }

  return (
    <SafeForceGraph
      graphData={graphData}
      nodeVal={(node: any) => node.type === 'profile' ? 20 : 10}
      nodeColor={(node: any) => node.color || '#3B82F6'}
      linkWidth={2}
    />
  );
}