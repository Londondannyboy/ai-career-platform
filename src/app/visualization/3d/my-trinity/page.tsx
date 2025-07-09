'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, User, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

// Dynamically import 3D component to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function MyTrinityVisualization3DPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [trinityData, setTrinityData] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    // Fetch authenticated user's Deep Repo Trinity
    fetch('/api/deep-repo/user')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else if (data.visualization) {
          setGraphData(data.visualization);
          setTrinityData(data.trinity);
        } else if (!data.trinity) {
          setError('No Trinity found - please create one first');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch user Trinity:', err);
        setError('Failed to load your Trinity data');
        setLoading(false);
      });
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Loading your Trinity visualization...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
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
            <LogIn className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view your Trinity</h2>
            <p className="text-gray-400 mb-4">You need to be signed in to see your personal Trinity visualization</p>
            <Link href="/sign-in" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg inline-block">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !graphData) {
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
            <p className="text-yellow-400 mb-4">{error || 'No Trinity data found'}</p>
            <Link href="/trinity/create" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg inline-block">
              Create Your Trinity
            </Link>
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
              <User className="w-6 h-6 text-blue-400" />
              My Trinity Visualization
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            {user?.firstName || user?.username || 'User'}
          </div>
        </div>
      </div>

      {/* Trinity Info */}
      {trinityData && (
        <div className="bg-gray-800 p-4 m-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Your Trinity Identity</h2>
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
            {trinityData.questSeal && ` • Seal: ${trinityData.questSeal.substring(0, 20)}...`}
          </div>
        </div>
      )}

      {/* 3D Visualization */}
      <div className="relative h-[600px] bg-black m-4 rounded-lg overflow-hidden">
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
          onNodeClick={(node: any) => {
            if (node.value) {
              alert(`${node.name}: ${node.value}`);
            }
          }}
          onNodeHover={(node: any) => {
            document.body.style.cursor = node ? 'pointer' : 'default';
          }}
        />
      </div>

      {/* Instructions */}
      <div className="p-4 text-center text-gray-400 text-sm">
        <p>🖱️ Left-click drag to rotate • Right-click drag to pan • Scroll to zoom • Click nodes for details</p>
      </div>
    </div>
  );
}