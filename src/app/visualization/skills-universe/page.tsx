'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';
import { Loader2, Zap } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function SkillsUniversePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [hasData, setHasData] = useState(false);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      if (isLoaded && !user) {
        setHasData(false);
        setLoading(false);
      }
      return;
    }
    
    // Load skills and experiences
    const headers: HeadersInit = {
      'X-User-Id': user.id
    };
    
    Promise.all([
      fetch('/api/deep-repo/working/skills', { headers }).then(r => r.json()),
      fetch('/api/surface-repo/load-simple', { headers }).then(r => r.json())
    ])
      .then(([skillsData, surfaceData]) => {
        const skills = skillsData.data?.skills || [];
        const experiences = surfaceData.data?.experience || [];
        
        const nodes: any[] = [];
        const links: any[] = [];
        
        // Group skills by category
        const categories: Record<string, any[]> = {};
        skills.forEach((skill: any) => {
          if (!categories[skill.category]) {
            categories[skill.category] = [];
          }
          categories[skill.category].push(skill);
        });
        
        // Create category centers
        const categoryColors: Record<string, string> = {
          Technical: '#3B82F6',
          Business: '#10B981',
          Creative: '#F59E0B',
          Leadership: '#8B5CF6',
          'Data & Analytics': '#EF4444',
          Other: '#6B7280'
        };
        
        let categoryIndex = 0;
        Object.entries(categories).forEach(([category, categorySkills]) => {
          const angle = (categoryIndex / Object.keys(categories).length) * Math.PI * 2;
          const radius = 100;
          const centerX = Math.cos(angle) * radius;
          const centerZ = Math.sin(angle) * radius;
          
          // Create category node
          const categoryId = `category-${category}`;
          nodes.push({
            id: categoryId,
            name: category,
            type: 'category',
            x: centerX,
            y: 0,
            z: centerZ,
            size: 25,
            color: categoryColors[category] || '#6B7280',
            opacity: 0.3
          });
          
          // Create skill nodes
          categorySkills.forEach((skill, skillIndex) => {
            const skillAngle = (skillIndex / categorySkills.length) * Math.PI * 2;
            const skillRadius = 30 + Math.random() * 20;
            
            nodes.push({
              id: skill.id || skill.name,
              name: skill.name,
              type: 'skill',
              category,
              proficiency: skill.proficiency,
              yearsOfExperience: skill.yearsOfExperience || 0,
              x: centerX + Math.cos(skillAngle) * skillRadius,
              y: (Math.random() - 0.5) * 20,
              z: centerZ + Math.sin(skillAngle) * skillRadius,
              size: 5 + (skill.yearsOfExperience || 1) * 2,
              color: categoryColors[category] || '#6B7280',
              opacity: 0.8 + (skill.proficiency === 'Expert' ? 0.2 : 0)
            });
            
            // Link to category
            links.push({
              source: categoryId,
              target: skill.id || skill.name,
              color: categoryColors[category] + '40',
              width: 1
            });
          });
          
          categoryIndex++;
        });
        
        // Add connections based on experiences
        experiences.forEach((exp: any) => {
          if (exp.skills) {
            exp.skills.forEach((skill1: string, i: number) => {
              exp.skills.forEach((skill2: string, j: number) => {
                if (i < j) {
                  const node1 = nodes.find(n => n.name === skill1);
                  const node2 = nodes.find(n => n.name === skill2);
                  
                  if (node1 && node2) {
                    links.push({
                      source: node1.id,
                      target: node2.id,
                      color: '#FFD70020',
                      width: 2,
                      type: 'experience'
                    });
                  }
                }
              });
            });
          }
        });
        
        if (nodes.length > 0) {
          setGraphData({ nodes, links });
          setHasData(true);
        } else {
          setHasData(false);
          // Set a minimal graph with a welcome node
          setGraphData({
            nodes: [{
              id: 'welcome',
              name: 'Add Your First Skill',
              type: 'skill',
              category: 'Getting Started',
              x: 0,
              y: 0,
              z: 0,
              size: 20,
              color: '#6B7280'
            }],
            links: []
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load skills data:', err);
        setLoading(false);
      });
  }, [isLoaded, user]);

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
          <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <Zap className="w-6 h-6" />
            No Skills Data Yet
          </h2>
          <p className="text-gray-400 mb-6">
            Your skills universe will appear here once you add skills to your profile.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg text-left">
            <p className="text-sm text-gray-300 mb-2">To get started:</p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Go to your profile settings</li>
              <li>Add your technical and professional skills</li>
              <li>Specify proficiency levels and experience</li>
              <li>Return here to see your 3D skills universe</li>
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Skills Universe
        </h1>
        <p className="text-gray-400">Your skills organized by category with gravitational clustering</p>
      </div>

      {/* Legend */}
      <div className="absolute top-20 right-4 z-10 bg-gray-800/80 backdrop-blur p-4 rounded-lg">
        <h3 className="font-medium mb-2">Categories</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
            <span>Technical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span>Business</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full" />
            <span>Creative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <span>Leadership</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span>Data & Analytics</span>
          </div>
        </div>
      </div>

      {/* Empty State Overlay */}
      {!hasData && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="bg-gray-800/90 backdrop-blur p-8 rounded-lg text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Skills Universe</h2>
            <p className="text-gray-400 mb-6">
              Add your skills to see them organized in a beautiful 3D visualization.
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/profile/quick-setup"
                className="inline-block px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Quick Setup (Recommended)
              </a>
              <a
                href="/repo/working/skills"
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
              ${node.type === 'skill' ? `
                <div class="text-sm text-gray-400">${node.proficiency || 'N/A'}</div>
                <div class="text-xs text-gray-500">${node.yearsOfExperience || 0} years</div>
              ` : ''}
            </div>
          `}
          nodeColor={node => node.color}
          nodeOpacity={0.9}
          nodeRelSize={10}
          linkColor={link => link.color}
          linkWidth={link => link.width}
          linkOpacity={0.6}
          backgroundColor="#111827"
          showNavInfo={false}
          enableNodeDrag={true}
          enableNavigationControls={true}
          controlType="orbit"
          nodeThreeObject={node => {
            if (node.type === 'category') {
              // Create transparent sphere for categories
              const geometry = new (window as any).THREE.SphereGeometry(node.size);
              const material = new (window as any).THREE.MeshBasicMaterial({
                color: node.color,
                transparent: true,
                opacity: 0.2,
                wireframe: true
              });
              return new (window as any).THREE.Mesh(geometry, material);
            }
            return undefined;
          }}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.3}
        />
      </div>
    </div>
  );
}