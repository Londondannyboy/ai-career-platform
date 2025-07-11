'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Briefcase, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

// Dynamically import 3D component to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// Simple error boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Visualization error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function SurfaceRepoVisualization3DPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [surfaceData, setSurfaceData] = useState<any>(null);

  useEffect(() => {
    // Fetch Surface Repo data with user ID
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (user?.id) {
      headers['X-User-Id'] = user.id;
    }
    
    // Use POST to send user ID in body as well
    // Using simple endpoint that doesn't require DeepRepoService
    fetch('/api/surface-repo/visualize-simple', { 
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: user?.id || '' })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Visualization data received:', data);
        if (data.error) {
          setError(data.error);
        } else if (data.visualization) {
          // Ensure we have valid graph data
          if (data.visualization.nodes && data.visualization.nodes.length > 0) {
            setGraphData(data.visualization);
            setSurfaceData(data.surfaceRepo);
          } else {
            setError('No visualization data available. Please add data to your profile.');
          }
        } else {
          setError('Invalid response format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch Surface Repo data:', err);
        setError('Failed to load Surface Repo data: ' + err.message);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Loading Surface Repo visualization...</p>
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
          <p className="text-red-400">{error}</p>
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
              <Briefcase className="w-6 h-6 text-blue-400" />
              Surface Repo (LinkedIn-style) Visualization
            </h1>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      {surfaceData && (
        <div className="bg-gray-800 p-4 m-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">{surfaceData.headline}</h2>
          <p className="text-gray-300 mb-4">{surfaceData.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2 text-red-400">Experience</h3>
              {surfaceData.experience?.map((exp: any, idx: number) => {
                const companyName = typeof exp.company === 'string' 
                  ? exp.company 
                  : (exp.company?.name || 'Unknown Company');
                return (
                  <div key={idx} className="mb-2 text-sm">
                    <div className="font-medium">{exp.title || 'Role'}</div>
                    <div className="text-gray-400">{companyName}</div>
                  </div>
                );
              })}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-cyan-400">Top Skills</h3>
              <div className="flex flex-wrap gap-2">
                {surfaceData.skills?.slice(0, 5).map((skill: any, idx: number) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name;
                  const endorsed = typeof skill === 'object' ? skill.endorsed : (surfaceData.endorsements?.[skillName] || 0);
                  return (
                    <span key={idx} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                      {skillName} ({endorsed})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Visualization */}
      <div className="relative h-[600px] bg-black m-4 rounded-lg overflow-hidden">
        {graphData && graphData.nodes && graphData.nodes.length > 0 ? (
          <ErrorBoundary fallback={<div className="flex items-center justify-center h-full text-red-400">Error loading 3D visualization</div>}>
            <ForceGraph3D
              graphData={graphData}
              nodeLabel={node => {
                const n = node as any;
                return `${n.name || 'Unknown'}: ${n.value || ''}`;
              }}
              nodeVal={node => (node as any).size || 10}
              nodeColor={node => (node as any).color || '#ffffff'}
              linkColor={() => 'rgba(255,255,255,0.3)'}
              linkWidth={2}
              linkOpacity={0.6}
              backgroundColor="#000000"
              showNavInfo={false}
              nodeOpacity={1}
              nodeResolution={16}
              enableNodeDrag={false}
              enableNavigationControls={true}
              controlType="orbit"
              onNodeClick={(node: any) => {
                if (node && node.value) {
                  alert(`${node.name}: ${node.value}`);
                }
              }}
              onNodeHover={(node: any) => {
                if (typeof document !== 'undefined') {
                  document.body.style.cursor = node ? 'pointer' : 'default';
                }
              }}
            />
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No data to visualize. Add some experiences and skills to your profile.</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 text-center text-gray-400 text-sm">
        <p>🖱️ Left-click drag to rotate • Right-click drag to pan • Scroll to zoom • Click nodes for details</p>
      </div>
    </div>
  );
}