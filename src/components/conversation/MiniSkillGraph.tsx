'use client';

import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface SkillNode {
  id: string;
  name: string;
  proficiency: string;
  category: string;
  value: number;
  color: string;
  isNew?: boolean;
}

interface SkillLink {
  source: string;
  target: string;
  value: number;
}

interface Props {
  skills: any[];
  height?: number;
  onNodeClick?: (node: SkillNode) => void;
}

export default function MiniSkillGraph({ skills, height = 300, onNodeClick }: Props) {
  const [graphData, setGraphData] = useState<{ nodes: SkillNode[]; links: SkillLink[] }>({
    nodes: [],
    links: []
  });
  const [dimensions, setDimensions] = useState({ width: 400, height });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 20, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  useEffect(() => {
    if (!skills || skills.length === 0) {
      setGraphData({ nodes: [], links: [] });
      return;
    }

    const nodes: SkillNode[] = skills.map((skill, index) => {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      const proficiency = typeof skill === 'object' ? skill.proficiency || 'intermediate' : 'intermediate';
      const category = typeof skill === 'object' ? skill.category || 'technical' : 'technical';

      const proficiencyValues = {
        beginner: 10,
        intermediate: 20,
        advanced: 30,
        expert: 40
      };

      const categoryColors = {
        technical: '#3b82f6',
        leadership: '#ef4444',
        communication: '#10b981',
        design: '#f59e0b',
        business: '#8b5cf6',
        other: '#6b7280'
      };

      return {
        id: skillName,
        name: skillName,
        proficiency,
        category,
        value: proficiencyValues[proficiency as keyof typeof proficiencyValues] || 20,
        color: categoryColors[category as keyof typeof categoryColors] || categoryColors.other,
        isNew: skill.isNew || false
      };
    });

    // Create simple links based on skill categories
    const links: SkillLink[] = [];
    const groupedByCategory = nodes.reduce((acc, node) => {
      if (!acc[node.category]) acc[node.category] = [];
      acc[node.category].push(node);
      return acc;
    }, {} as Record<string, SkillNode[]>);

    // Create links within categories
    Object.values(groupedByCategory).forEach(categoryNodes => {
      for (let i = 0; i < categoryNodes.length - 1; i++) {
        for (let j = i + 1; j < categoryNodes.length; j++) {
          links.push({
            source: categoryNodes[i].id,
            target: categoryNodes[j].id,
            value: 1
          });
        }
      }
    });

    // Create some cross-category links for common skills
    const commonConnections = [
      ['JavaScript', 'React'],
      ['Python', 'Machine Learning'],
      ['Leadership', 'Communication'],
      ['Project Management', 'Leadership'],
      ['AWS', 'Docker'],
      ['SQL', 'Database Design']
    ];

    commonConnections.forEach(([skill1, skill2]) => {
      const node1 = nodes.find(n => n.name.toLowerCase().includes(skill1.toLowerCase()));
      const node2 = nodes.find(n => n.name.toLowerCase().includes(skill2.toLowerCase()));
      
      if (node1 && node2) {
        links.push({
          source: node1.id,
          target: node2.id,
          value: 2
        });
      }
    });

    setGraphData({ nodes, links });
  }, [skills]);

  const handleNodeClick = (node: any) => {
    if (onNodeClick) {
      onNodeClick(node as SkillNode);
    }
    
    // Highlight the node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  };

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(8, 12 / globalScale);
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.value / 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.isNew ? '#fbbf24' : node.color; // Yellow for new skills
    ctx.fill();
    
    // Add pulsing effect for new skills
    if (node.isNew) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, (node.value / 2) + 5, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw label
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth + 4, fontSize + 2];
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(label, node.x, node.y);
  };

  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = link.value;
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  };

  if (graphData.nodes.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex items-center justify-center h-48 text-gray-500 text-sm"
        style={{ height }}
      >
        No skills to visualize yet
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        nodeRelSize={1}
        linkWidth={0}
        linkDirectionalParticles={0}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        minZoom={0.5}
        maxZoom={4}
      />
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-black/50 rounded p-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-300">Technical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-300">Leadership</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-300">New</span>
          </div>
        </div>
      </div>
    </div>
  );
}