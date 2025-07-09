'use client';

import React, { useState } from 'react';
import TrinityGraph3D from '@/components/visualization/3d/TrinityGraph3D';
import TrinityGraph3DLive from '@/components/visualization/3d/TrinityGraph3DLive';
import { ArrowLeft, Maximize2, Minimize2, Database, FlaskConical } from 'lucide-react';
import Link from 'next/link';

// Sample data for demonstration
const sampleTrinityData = {
  quest: "To revolutionize how professionals discover their true purpose and build meaningful connections through authentic self-expression",
  service: "I serve by creating innovative technology platforms that empower individuals to articulate their professional identity and find their tribe",
  pledge: "I commit to always prioritizing user empowerment, privacy, and authentic human connection over profit or growth metrics",
  type: 'F' as const,
  createdAt: new Date(),
};

const sampleGoals = [
  {
    id: '1',
    title: 'Launch Trinity Platform',
    description: 'Complete the Trinity identity system',
    progress: 75,
    trinityAspect: 'quest' as const,
  },
  {
    id: '2',
    title: 'Build Voice AI Coach',
    description: 'Implement Hume EVI integration',
    progress: 90,
    trinityAspect: 'service' as const,
  },
  {
    id: '3',
    title: 'Create 3D Visualizations',
    description: 'Implement interactive 3D graphs',
    progress: 15,
    trinityAspect: 'service' as const,
  },
  {
    id: '4',
    title: 'Ensure Data Privacy',
    description: 'Implement four-layer privacy architecture',
    progress: 60,
    trinityAspect: 'pledge' as const,
  },
];

const sampleTasks = [
  { id: '1', title: 'Design Trinity UI', goalId: '1', completed: true, priority: 'high' as const },
  { id: '2', title: 'Implement database schema', goalId: '1', completed: true, priority: 'high' as const },
  { id: '3', title: 'Create ritual interface', goalId: '1', completed: false, priority: 'medium' as const },
  { id: '4', title: 'Integrate Hume API', goalId: '2', completed: true, priority: 'high' as const },
  { id: '5', title: 'Test voice interactions', goalId: '2', completed: true, priority: 'medium' as const },
  { id: '6', title: 'Add coaching preferences', goalId: '2', completed: false, priority: 'low' as const },
  { id: '7', title: 'Install react-force-graph', goalId: '3', completed: true, priority: 'high' as const },
  { id: '8', title: 'Create base components', goalId: '3', completed: false, priority: 'high' as const },
  { id: '9', title: 'Design privacy layers', goalId: '4', completed: true, priority: 'high' as const },
  { id: '10', title: 'Implement access controls', goalId: '4', completed: false, priority: 'medium' as const },
];

export default function Visualization3DPage() {
  const [viewMode, setViewMode] = useState<'trinity' | 'goals' | 'full'>('full');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('live');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-2xl font-bold">Trinity 3D Visualization</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Data source toggle */}
            <div className="flex gap-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setDataSource('live')}
                className={`px-3 py-1 rounded flex items-center gap-2 ${
                  dataSource === 'live' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" />
                Live Data
              </button>
              <button
                onClick={() => setDataSource('sample')}
                className={`px-3 py-1 rounded flex items-center gap-2 ${
                  dataSource === 'sample' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                Sample Data
              </button>
            </div>

            {/* View mode selector */}
            <div className="flex gap-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('trinity')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'trinity' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Trinity Only
              </button>
              <button
                onClick={() => setViewMode('goals')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'goals' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'full' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Full Universe
              </button>
            </div>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded hover:bg-gray-700 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="h-[calc(100vh-80px)]">
        {dataSource === 'sample' ? (
          <TrinityGraph3D
            trinityData={sampleTrinityData}
            goals={sampleGoals}
            tasks={sampleTasks}
            mode={viewMode}
            onNodeClick={(node) => {
              console.log('Node clicked:', node);
              // Could open a modal or sidebar with node details
            }}
          />
        ) : (
          <TrinityGraph3DLive
            mode={viewMode}
            onNodeClick={(node) => {
              console.log('Node clicked:', node);
              // Could open a modal or sidebar with node details
            }}
            // For testing without auth, you can pass a test user ID:
            // testUserId="test-user-123"
          />
        )}
      </div>

      {/* Info Panel */}
      <div className="absolute top-24 left-4 bg-black/70 text-white p-4 rounded-lg max-w-sm">
        <h2 className="font-bold mb-2">Trinity Universe Explorer</h2>
        <p className="text-sm text-gray-300 mb-3">
          Your professional identity visualized as a living, breathing universe.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Data Source:</span>{' '}
            <span className={dataSource === 'live' ? 'text-green-400' : 'text-purple-400'}>
              {dataSource === 'live' ? 'Live Database' : 'Sample Data'}
            </span>
          </p>
          <p>
            <span className="font-semibold">Current View:</span>{' '}
            {viewMode === 'trinity' && 'Trinity core with three aspects'}
            {viewMode === 'goals' && 'Goals orbiting your Trinity'}
            {viewMode === 'full' && 'Complete universe with tasks'}
          </p>
          <p>
            <span className="font-semibold">Particles:</span> Show progress flow from tasks → goals → Trinity
          </p>
          <p className="text-xs text-gray-400 mt-2">
            💡 Click nodes to explore • Drag to reposition • Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
}