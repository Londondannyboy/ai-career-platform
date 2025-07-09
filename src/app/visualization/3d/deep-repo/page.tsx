'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Database, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Dynamically import 3D component to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface TrinityNode {
  id: string;
  name: string;
  group: string;
  color: string;
  size: number;
  x?: number;
  y?: number;
  z?: number;
  value?: string;
}

interface TrinityLink {
  source: string;
  target: string;
}

export default function DeepRepoVisualization3DPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: TrinityNode[], links: TrinityLink[] } | null>(null);
  const [trinityData, setTrinityData] = useState<any>(null);

  useEffect(() => {
    // Fetch Deep Repo Trinity data
    fetch('/api/deep-repo/visualize')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else if (data.visualization) {
          setGraphData(data.visualization);
          setTrinityData(data.trinity);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch Deep Repo data:', err);
        setError('Failed to load Trinity data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Loading Deep Repo Trinity visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <p className="text-red-400 mb-2">Error: {error}</p>
            <p className="text-gray-400">Please check the console for more details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/visualization" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-400" />
              Deep Repo Trinity Visualization
            </h1>
          </div>
        </div>
      </div>

      {/* Trinity Info */}
      {trinityData && (
        <div className="bg-gray-800 p-4 m-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Trinity Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="text-red-400 font-medium mb-1">Quest</h3>
              <p className="text-sm">{trinityData.quest}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="text-cyan-400 font-medium mb-1">Service</h3>
              <p className="text-sm">{trinityData.service}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="text-blue-400 font-medium mb-1">Pledge</h3>
              <p className="text-sm">{trinityData.pledge}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            Type: {trinityData.type === 'F' ? 'Foundation' : trinityData.type === 'L' ? 'Living' : 'Mixed'} Trinity
          </div>
        </div>
      )}

      {/* 3D Visualization */}
      <div className="relative h-[600px] bg-black m-4 rounded-lg overflow-hidden">
        {graphData && (
          <ForceGraph3D
            graphData={graphData}
            nodeLabel={node => `${(node as any).name}: ${(node as any).value || ''}`}
            nodeVal={node => (node as any).size || 10}
            nodeColor={node => (node as any).color || '#ffffff'}
            linkColor={() => 'rgba(255,255,255,0.3)'}
            linkWidth={3}
            linkOpacity={0.8}
            backgroundColor="#000000"
            showNavInfo={false}
            nodeOpacity={1}
            nodeResolution={32}
            enableNodeDrag={false}
            enableNavigationControls={true}
            controlType="orbit"
            cameraPosition={{ x: 0, y: 0, z: 400 }}
            onEngineStop={() => {
              // Center camera on Trinity after initial render
              const cameraDistance = 350;
              const angle = Math.PI / 4;
              return {
                x: cameraDistance * Math.sin(angle),
                y: cameraDistance * 0.3,
                z: cameraDistance * Math.cos(angle)
              };
            }}
            onNodeClick={(node: any) => {
              if (node.value) {
                alert(`${node.name}: ${node.value}`);
              }
            }}
            onNodeHover={(node: any) => {
              document.body.style.cursor = node ? 'pointer' : 'default';
            }}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 text-center text-gray-400 text-sm">
        <p>🖱️ Left-click drag to rotate • Right-click drag to pan • Scroll to zoom • Click nodes for details</p>
      </div>
    </div>
  );
}