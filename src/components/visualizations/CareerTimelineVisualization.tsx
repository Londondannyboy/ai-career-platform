'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import SafeForceGraph from './SafeForceGraph';

interface Props {
  username: string;
}

export default function CareerTimelineVisualization({ username }: Props) {
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
      
      // Use the career timeline endpoint
      const response = await fetch('/api/visualization/career-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || username })
      });

      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      } else {
        // Fallback to test data
        setGraphData({
          nodes: [
            { id: 'start', name: 'Career Start', type: 'milestone', year: 2010, x: -100, y: 0, z: 0 },
            { id: 'exp1', name: 'Junior Developer', type: 'past', year: 2015, x: -50, y: 20, z: 0 },
            { id: 'exp2', name: 'Senior Engineer', type: 'past', year: 2020, x: 0, y: 30, z: 0 },
            { id: 'current', name: 'Founder @ Quest', type: 'current', year: 2024, x: 50, y: 40, z: 0 },
            { id: 'future1', name: 'Scale to 1M users', type: 'future', year: 2026, x: 100, y: 50, z: 0 },
            { id: 'future2', name: 'IPO / Acquisition', type: 'future', year: 2030, x: 150, y: 60, z: 0 }
          ],
          links: [
            { source: 'start', target: 'exp1' },
            { source: 'exp1', target: 'exp2' },
            { source: 'exp2', target: 'current' },
            { source: 'current', target: 'future1' },
            { source: 'future1', target: 'future2' }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading timeline...</div>;
  }

  return (
    <SafeForceGraph
      graphData={graphData}
      nodeVal={(node: any) => {
        if (node.type === 'milestone') return 15;
        if (node.type === 'current') return 25;
        if (node.type === 'future') return 20;
        return 10;
      }}
      nodeColor={(node: any) => {
        if (node.type === 'milestone') return '#FFD700';
        if (node.type === 'past') return '#6B7280';
        if (node.type === 'current') return '#3B82F6';
        if (node.type === 'future') return '#A855F7';
        return '#666666';
      }}
      linkColor={(link: any) => {
        const target = graphData.nodes.find((n: any) => n.id === link.target);
        return target?.type === 'future' ? '#A855F7' : '#666666';
      }}
      linkWidth={3}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.005}
    />
  );
}