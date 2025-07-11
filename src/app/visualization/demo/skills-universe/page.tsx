'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Zap } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function DemoSkillsUniversePage() {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const fgRef = useRef<any>(null);

  useEffect(() => {
    // Generate demo skills data
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Sample skills by category
    const skillsData = {
      Technical: [
        { name: 'JavaScript', years: 5, proficiency: 'Expert' },
        { name: 'React', years: 4, proficiency: 'Expert' },
        { name: 'Node.js', years: 4, proficiency: 'Advanced' },
        { name: 'TypeScript', years: 2, proficiency: 'Advanced' },
        { name: 'AWS', years: 3, proficiency: 'Advanced' },
        { name: 'MongoDB', years: 3, proficiency: 'Intermediate' }
      ],
      Business: [
        { name: 'Project Management', years: 3, proficiency: 'Advanced' },
        { name: 'Agile/Scrum', years: 4, proficiency: 'Expert' },
        { name: 'Strategic Planning', years: 2, proficiency: 'Intermediate' }
      ],
      Leadership: [
        { name: 'Team Leadership', years: 2, proficiency: 'Advanced' },
        { name: 'Mentoring', years: 3, proficiency: 'Advanced' },
        { name: 'Communication', years: 5, proficiency: 'Expert' }
      ],
      'Data & Analytics': [
        { name: 'SQL', years: 4, proficiency: 'Advanced' },
        { name: 'Data Visualization', years: 2, proficiency: 'Intermediate' },
        { name: 'Python', years: 1, proficiency: 'Beginner' }
      ]
    };
    
    const categoryColors: Record<string, string> = {
      Technical: '#3B82F6',
      Business: '#10B981',
      Leadership: '#8B5CF6',
      'Data & Analytics': '#EF4444'
    };
    
    let categoryIndex = 0;
    Object.entries(skillsData).forEach(([category, skills]) => {
      const angle = (categoryIndex / Object.keys(skillsData).length) * Math.PI * 2;
      const radius = 100;
      const centerX = Math.cos(angle) * radius;
      const centerZ = Math.sin(angle) * radius;
      
      // Category center node
      const categoryId = `category-${category}`;
      nodes.push({
        id: categoryId,
        name: category,
        type: 'category',
        x: centerX,
        y: 0,
        z: centerZ,
        size: 25,
        color: categoryColors[category],
        opacity: 0.3
      });
      
      // Skill nodes
      skills.forEach((skill, skillIndex) => {
        const skillAngle = (skillIndex / skills.length) * Math.PI * 2;
        const skillRadius = 30 + Math.random() * 20;
        
        nodes.push({
          id: skill.name,
          name: skill.name,
          type: 'skill',
          category,
          proficiency: skill.proficiency,
          yearsOfExperience: skill.years,
          x: centerX + Math.cos(skillAngle) * skillRadius,
          y: (Math.random() - 0.5) * 20,
          z: centerZ + Math.sin(skillAngle) * skillRadius,
          size: 5 + skill.years * 2,
          color: categoryColors[category],
          opacity: 0.8 + (skill.proficiency === 'Expert' ? 0.2 : 0)
        });
        
        // Link to category
        links.push({
          source: categoryId,
          target: skill.name,
          color: categoryColors[category] + '40',
          width: 1
        });
      });
      
      categoryIndex++;
    });
    
    // Add some cross-category connections
    links.push(
      { source: 'JavaScript', target: 'React', color: '#FFD70040', width: 3 },
      { source: 'JavaScript', target: 'Node.js', color: '#FFD70040', width: 3 },
      { source: 'React', target: 'TypeScript', color: '#FFD70040', width: 2 },
      { source: 'AWS', target: 'Node.js', color: '#FFD70040', width: 2 },
      { source: 'Project Management', target: 'Team Leadership', color: '#FFD70040', width: 2 },
      { source: 'Agile/Scrum', target: 'Team Leadership', color: '#FFD70040', width: 2 }
    );
    
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Skills Universe Demo
        </h1>
        <p className="text-gray-400">Sample skills visualization (no auth required)</p>
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
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <span>Leadership</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span>Data & Analytics</span>
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
              ${node.type === 'skill' ? `
                <div class="text-sm text-gray-400">${node.proficiency}</div>
                <div class="text-xs text-gray-500">${node.yearsOfExperience} years</div>
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
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.3}
        />
      </div>
    </div>
  );
}