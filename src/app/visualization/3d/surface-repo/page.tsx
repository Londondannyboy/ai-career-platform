'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Briefcase, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

// Dynamically import 3D component to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SurfaceRepoVisualization3DPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [surfaceData, setSurfaceData] = useState<any>(null);

  useEffect(() => {
    // Only load when we have a user
    if (!isLoaded) return;
    if (!user?.id) {
      setError('Please sign in to view your visualization');
      setLoading(false);
      return;
    }
    
    loadVisualization();
  }, [user, isLoaded]);
  
  const loadVisualization = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/surface-repo/visualize-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.visualization && data.visualization.nodes && data.visualization.nodes.length > 0) {
        setGraphData(data.visualization);
        setSurfaceData(data.surfaceRepo);
      } else {
        setError('No visualization data available');
      }
    } catch (err: any) {
      setError('Failed to load: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
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
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
          <p className="text-red-400 text-xl">{error}</p>
          <div className="text-gray-400 text-sm">
            <p>User ID: {user?.id || 'Not available'}</p>
            <p>Signed in: {isSignedIn ? 'Yes' : 'No'}</p>
          </div>
          <Link href="/debug-user" className="text-blue-400 hover:underline">
            Debug User Info
          </Link>
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
          <ForceGraph3D
            graphData={graphData}
            nodeLabel={(node: any) => `${node.name}: ${node.value || ''}`}
            nodeVal={(node: any) => node.size || 10}
            nodeColor={(node: any) => node.color || '#ffffff'}
            linkColor={() => 'rgba(255,255,255,0.3)'}
            linkWidth={2}
            backgroundColor="#000000"
            showNavInfo={false}
            nodeOpacity={1}
            enableNodeDrag={false}
            enableNavigationControls={true}
            controlType="orbit"
          />
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