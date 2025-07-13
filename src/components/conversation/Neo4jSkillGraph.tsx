'use client';

import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface SkillNode {
  id: string;
  name: string;
  category: string;
  proficiency?: string;
  color: string;
  value: number;
  isNew?: boolean;
}

interface SkillLink {
  source: string;
  target: string;
  relationshipType: string;
  strength: number;
  reason?: string;
  discoveredBy: 'ai' | 'predefined' | 'user';
  color: string;
  width: number;
}

interface Props {
  userId: string;
  height?: number;
  onNodeClick?: (node: SkillNode) => void;
  className?: string;
  refreshTrigger?: number;
}

export default function Neo4jSkillGraph({ userId, height = 400, onNodeClick, className = '', refreshTrigger }: Props) {
  const [graphData, setGraphData] = useState<{ nodes: SkillNode[]; links: SkillLink[] }>({
    nodes: [],
    links: []
  });
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
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
    if (userId) {
      loadSkillGraph();
    }
  }, [userId, refreshTrigger]);

  const loadSkillGraph = async () => {
    setLoading(true);
    console.log('🕸️ Loading Neo4j skill graph for user:', userId);
    
    try {
      const url = `/api/skills/graph?userId=${userId}&action=graph`;
      console.log('🕸️ Fetching from:', url);
      
      const response = await fetch(url);
      console.log('🕸️ Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🕸️ Neo4j data received:', data);
        
        if (!data.nodes || !data.edges) {
          console.warn('🕸️ Invalid data structure:', data);
          setGraphData({ nodes: [], links: [] });
          return;
        }
        
        // Transform Neo4j data to graph format
        const nodes: SkillNode[] = data.nodes.map((node: any) => ({
          id: node.name,
          name: node.name,
          category: node.category,
          proficiency: node.proficiency,
          color: getCategoryColor(node.category),
          value: getProficiencyValue(node.proficiency),
          isNew: isRecentlyAdded(node.addedAt)
        }));
        console.log('🕸️ Transformed nodes:', nodes);

        const links: SkillLink[] = data.edges.map((edge: any) => ({
          source: edge.source,
          target: edge.target,
          relationshipType: edge.relationship.type,
          strength: edge.relationship.strength,
          reason: edge.relationship.reason,
          discoveredBy: edge.relationship.discoveredBy,
          color: getRelationshipColor(edge.relationship.type, edge.relationship.discoveredBy),
          width: Math.max(1, edge.relationship.strength * 4)
        }));
        console.log('🕸️ Transformed links:', links);

        setGraphData({ nodes, links });
        console.log('🕸️ Graph data updated successfully');
      } else {
        const errorText = await response.text();
        console.error('🕸️ API error:', response.status, errorText);
        setGraphData({ nodes: [], links: [] });
      }
    } catch (error) {
      console.error('🕸️ Error loading skill graph:', error);
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      technical: '#3b82f6',
      leadership: '#ef4444',
      communication: '#10b981',
      design: '#f59e0b',
      business: '#8b5cf6',
      marketing: '#ec4899',
      data: '#06b6d4',
      other: '#6b7280'
    };
    return colors[category.toLowerCase()] || colors.other;
  };

  const getProficiencyValue = (proficiency?: string): number => {
    const values: Record<string, number> = {
      beginner: 15,
      intermediate: 25,
      advanced: 35,
      expert: 45
    };
    return values[proficiency || 'intermediate'] || 25;
  };

  const isRecentlyAdded = (addedAt: string): boolean => {
    if (!addedAt) return false;
    const added = new Date(addedAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - added.getTime()) / (1000 * 60);
    return diffMinutes < 5; // Consider "new" if added in last 5 minutes
  };

  const getRelationshipColor = (type: string, discoveredBy: string): string => {
    if (discoveredBy === 'ai') {
      return '#fbbf24'; // Golden for AI-discovered relationships
    }
    
    const colors: Record<string, string> = {
      prerequisite: '#ef4444',
      complementary: '#10b981',
      related: '#3b82f6',
      advanced: '#8b5cf6',
      alternative: '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node.id);
    if (onNodeClick) {
      onNodeClick(node as SkillNode);
    }
    
    // Highlight connected nodes
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
    }
  };

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(10, 14 / globalScale);
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.value / 2, 0, 2 * Math.PI, false);
    
    // Special styling for new skills
    if (node.isNew) {
      ctx.fillStyle = '#fbbf24'; // Golden for new skills
      ctx.fill();
      
      // Pulsing ring effect
      ctx.beginPath();
      ctx.arc(node.x, node.y, (node.value / 2) + 8, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = node.color;
      ctx.fill();
    }
    
    // Highlight selected node
    if (selectedNode === node.id) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, (node.value / 2) + 5, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Draw label with background
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth + 6, fontSize + 4];
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(
      node.x - bckgDimensions[0] / 2, 
      node.y - bckgDimensions[1] / 2 + node.value / 2 + 10, 
      bckgDimensions[0], 
      bckgDimensions[1]
    );
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(label, node.x, node.y + node.value / 2 + 10 + fontSize / 2);
  };

  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;
    
    // Draw relationship line
    ctx.strokeStyle = link.color;
    ctx.lineWidth = link.width;
    
    // Dashed line for AI-discovered relationships
    if (link.discoveredBy === 'ai') {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading AI skill relationships...</p>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-500 text-sm ${className}`} style={{ height }}>
        <div className="text-center">
          <p>No skills in your graph yet</p>
          <p className="text-xs mt-1">Add skills during conversation to see AI-powered relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
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
          cooldownTicks={200}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={0.3}
          maxZoom={5}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="font-semibold mb-2">Node Colors</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Technical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Leadership</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>New Skill</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Relationships</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-yellow-500" style={{borderStyle: 'dashed'}} />
              <span>AI Discovered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500" />
              <span>Complementary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500" />
              <span>Prerequisite</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {graphData.nodes.length} skills • {graphData.links.length} relationships •{' '}
        {graphData.links.filter(l => l.discoveredBy === 'ai').length} AI-discovered
      </div>
    </div>
  );
}