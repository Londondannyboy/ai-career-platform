'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function DemoCareerTimelinePage() {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const fgRef = useRef<any>(null);

  useEffect(() => {
    // Generate demo data immediately
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Sample career progression
    const experiences = [
      {
        id: 'exp1',
        title: 'Junior Developer',
        company: 'StartupCo',
        year: 2018,
        skills: ['JavaScript', 'React', 'Node.js']
      },
      {
        id: 'exp2',
        title: 'Full Stack Developer',
        company: 'TechCorp',
        year: 2020,
        skills: ['React', 'Node.js', 'AWS', 'MongoDB']
      },
      {
        id: 'exp3',
        title: 'Senior Engineer',
        company: 'InnovateLabs',
        year: 2022,
        isCurrent: true,
        skills: ['React', 'TypeScript', 'AWS', 'Team Leadership']
      },
      {
        id: 'exp4',
        title: 'Engineering Manager',
        company: 'Google',
        year: 2025,
        isFuture: true,
        progress: 35,
        skills: ['Leadership', 'Architecture', 'Strategy', 'Team Building']
      },
      {
        id: 'exp5',
        title: 'VP of Engineering',
        company: 'Dream Startup',
        year: 2028,
        isFuture: true,
        progress: 15,
        skills: ['Executive Leadership', 'Strategy', 'Innovation']
      }
    ];
    
    // Create nodes
    experiences.forEach((exp, index) => {
      nodes.push({
        id: exp.id,
        name: exp.title,
        company: exp.company,
        year: exp.year,
        isFuture: exp.isFuture,
        isCurrent: exp.isCurrent,
        progress: exp.progress || 0,
        x: (exp.year - 2018) * 50,
        y: exp.isFuture ? 100 : (exp.isCurrent ? 50 : 0),
        z: index * 30,
        color: exp.isFuture ? '#8B5CF6' : (exp.isCurrent ? '#3B82F6' : '#10B981'),
        opacity: exp.isFuture ? 0.6 : 1,
        size: exp.isCurrent ? 20 : 15,
        skills: exp.skills
      });
      
      // Link to previous experience
      if (index > 0) {
        links.push({
          source: experiences[index - 1].id,
          target: exp.id,
          color: exp.isFuture ? '#8B5CF680' : '#10B98180',
          width: exp.isFuture ? 2 : 3
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
              curvature: 0.3
            });
          }
        }
      });
    });
    
    setGraphData({ nodes, links });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <h1 className="text-2xl font-bold">Career Timeline Demo</h1>
        <p className="text-gray-400">Sample career journey visualization (no auth required)</p>
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
          enableNodeDrag={false}
          enableNavigationControls={true}
          controlType="orbit"
        />
      </div>
    </div>
  );
}