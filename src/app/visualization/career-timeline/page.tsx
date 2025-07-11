'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';
import { Loader2, Play, Pause, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function CareerTimelinePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasData, setHasData] = useState(false);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load user's work experience data
    const headers: HeadersInit = {};
    if (user?.id) {
      headers['X-User-Id'] = user.id;
    }
    
    fetch('/api/surface-repo/load-simple', { headers })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.experience && data.data.experience.length > 0) {
          const experiences = data.data.experience;
          const nodes: any[] = [];
          const links: any[] = [];
          
          // Sort experiences by date
          const sorted = [...experiences].sort((a, b) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
          
          // Create nodes for each experience
          sorted.forEach((exp, index) => {
            const isFuture = exp.isFuture;
            const isCurrent = exp.isCurrent;
            const startYear = new Date(exp.startDate).getFullYear();
            
            nodes.push({
              id: exp.id || `exp-${index}`,
              name: exp.title,
              company: typeof exp.company === 'string' ? exp.company : exp.company.name,
              year: startYear,
              isFuture,
              isCurrent,
              progress: exp.progress || 0,
              // Position along timeline
              x: (startYear - 2015) * 50,
              y: isFuture ? 100 : (isCurrent ? 50 : 0),
              z: index * 30,
              // Visual properties
              color: isFuture ? '#8B5CF6' : (isCurrent ? '#3B82F6' : '#10B981'),
              opacity: isFuture ? 0.6 : 1,
              size: isCurrent ? 20 : 15,
              // Data
              skills: exp.skills || [],
              achievements: exp.achievements || [],
              whyThisRole: exp.whyThisRole,
              requiredSteps: exp.requiredSteps
            });
            
            // Create links between consecutive experiences
            if (index > 0) {
              links.push({
                source: sorted[index - 1].id || `exp-${index - 1}`,
                target: exp.id || `exp-${index}`,
                color: isFuture ? '#8B5CF680' : '#10B98180',
                width: isFuture ? 2 : 3
              });
            }
          });
          
          // Add skill connections
          nodes.forEach((node, i) => {
            nodes.forEach((otherNode, j) => {
              if (i < j && node.skills && otherNode.skills) {
                const sharedSkills = node.skills.filter((s: string) => 
                  otherNode.skills.includes(s)
                );
                if (sharedSkills.length > 0) {
                  links.push({
                    source: node.id,
                    target: otherNode.id,
                    color: '#FFD70040',
                    width: sharedSkills.length,
                    curvature: 0.3,
                    type: 'skill'
                  });
                }
              }
            });
          });
          
          setGraphData({ nodes, links });
          setHasData(true);
        } else {
          setHasData(false);
          // Set a minimal graph with a welcome node
          setGraphData({
            nodes: [{
              id: 'welcome',
              name: 'Add Your First Experience',
              company: 'Get Started',
              year: new Date().getFullYear(),
              x: 0,
              y: 0,
              z: 0,
              color: '#6B7280',
              size: 20
            }],
            links: []
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load timeline data:', err);
        setLoading(false);
      });
  }, [isLoaded, user]);

  const handleNodeClick = (node: any) => {
    // Center camera on node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, node.z, 1000);
    }
  };

  const resetView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check if there's no data
  if (graphData.nodes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Career Data Yet</h2>
          <p className="text-gray-400 mb-6">
            Your career timeline will appear here once you add experience data to your profile.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg text-left">
            <p className="text-sm text-gray-300 mb-2">To get started:</p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Go to your profile settings</li>
              <li>Add your work experiences</li>
              <li>Include skills and achievements</li>
              <li>Return here to see your 3D timeline</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <h1 className="text-2xl font-bold">Career Timeline</h1>
        <p className="text-gray-400">Your professional journey: past, present, and future</p>
      </div>

      {/* Legend */}
      <div className="absolute top-20 left-4 z-10 bg-gray-800/80 backdrop-blur p-4 rounded-lg">
        <h3 className="font-medium mb-2">Legend</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span>Past Experience</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
            <span>Current Role</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full opacity-60" />
            <span>Future Aspiration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-yellow-500/40" />
            <span>Shared Skills</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800/80 backdrop-blur p-2 rounded-lg flex gap-2">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={resetView}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Empty State Overlay */}
      {!hasData && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="bg-gray-800/90 backdrop-blur p-8 rounded-lg text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Career Timeline</h2>
            <p className="text-gray-400 mb-6">
              Add your work experiences to see your professional journey visualized in 3D.
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/profile/quick-setup"
                className="inline-block px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Quick Setup (Recommended)
              </a>
              <a
                href="/repo/surface/edit"
                className="inline-block px-6 py-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                Manual Entry
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3D Graph */}
      <div className="w-full h-screen">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel={node => `
            <div class="bg-gray-900 p-3 rounded shadow-lg">
              <div class="font-bold">${node.name}</div>
              <div class="text-sm text-gray-400">${node.company}</div>
              <div class="text-xs text-gray-500">${node.year}</div>
              ${node.isFuture ? `<div class="text-xs text-purple-400 mt-1">Progress: ${node.progress}%</div>` : ''}
            </div>
          `}
          nodeColor={node => node.color}
          nodeOpacity={0.9}
          nodeRelSize={10}
          linkColor={link => link.color}
          linkWidth={link => link.width}
          linkCurvature={link => link.curvature || 0}
          linkOpacity={0.6}
          backgroundColor="#111827"
          showNavInfo={false}
          onNodeClick={handleNodeClick}
          enableNodeDrag={false}
          enableNavigationControls={true}
          controlType="orbit"
          // Animation
          cooldownTicks={isAnimating ? Infinity : 0}
          nodeThreeObject={node => {
            if (node.isCurrent) {
              // Create pulsing effect for current role
              const geometry = new (window as any).THREE.SphereGeometry(node.size);
              const material = new (window as any).THREE.MeshBasicMaterial({
                color: node.color,
                transparent: true,
                opacity: 0.8
              });
              const sphere = new (window as any).THREE.Mesh(geometry, material);
              
              // Pulse animation
              const clock = new (window as any).THREE.Clock();
              sphere.onBeforeRender = () => {
                const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
                sphere.scale.set(scale, scale, scale);
              };
              
              return sphere;
            }
            return undefined;
          }}
        />
      </div>
    </div>
  );
}