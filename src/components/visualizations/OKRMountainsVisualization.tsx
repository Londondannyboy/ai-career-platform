'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import SafeForceGraph from './SafeForceGraph';

interface OKR {
  objective: string;
  keyResults: string[];
  progress: number;
}

interface Props {
  okrs?: OKR[];
  username?: string;
}

export default function OKRMountainsVisualization({ okrs, username }: Props) {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (okrs && okrs.length > 0) {
      generateMountainData(okrs);
    } else if (username) {
      loadUserOKRs();
    } else {
      // Use demo data
      generateMountainData([
        { objective: 'Launch Quest Platform', keyResults: ['MVP ready', 'First users'], progress: 75 },
        { objective: 'Scale to 1000 users', keyResults: ['Marketing', 'Features'], progress: 40 },
        { objective: 'Achieve profitability', keyResults: ['Revenue', 'Costs'], progress: 20 }
      ]);
    }
  }, [okrs, username]);

  const loadUserOKRs = async () => {
    try {
      const response = await fetch('/api/deep-repo', {
        headers: { 'X-User-Id': username || user?.id || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile?.personalRepo?.okrs) {
          generateMountainData(data.profile.personalRepo.okrs);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load OKRs:', error);
    }
    
    // Fallback to demo data
    generateMountainData([]);
  };

  const generateMountainData = (okrList: OKR[]) => {
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Create base terrain
    const baseNode = {
      id: 'base',
      name: 'OKR Landscape',
      type: 'base',
      x: 0,
      y: -50,
      z: 0,
      color: '#1a1a1a',
      size: 5
    };
    nodes.push(baseNode);

    // Create mountain peaks for each OKR
    const angleStep = (Math.PI * 2) / Math.max(okrList.length, 1);
    
    okrList.forEach((okr, index) => {
      const angle = index * angleStep;
      const distance = 80;
      const height = (okr.progress / 100) * 100; // Height based on progress
      
      // Mountain peak (OKR objective)
      const peakId = `peak-${index}`;
      const peakNode = {
        id: peakId,
        name: okr.objective,
        type: 'peak',
        progress: okr.progress,
        x: Math.cos(angle) * distance,
        y: height,
        z: Math.sin(angle) * distance,
        color: getProgressColor(okr.progress),
        size: 20 + (okr.progress / 10) // Larger for higher progress
      };
      nodes.push(peakNode);
      
      // Connect to base
      links.push({
        source: baseNode.id,
        target: peakId,
        value: 1,
        color: '#333333'
      });
      
      // Create nodes for key results (smaller peaks around main peak)
      okr.keyResults.forEach((kr, krIndex) => {
        const krAngle = angle + (krIndex - okr.keyResults.length / 2) * 0.3;
        const krDistance = 40;
        const krHeight = height * 0.6; // Key results at 60% of objective height
        
        const krNode = {
          id: `kr-${index}-${krIndex}`,
          name: kr,
          type: 'keyResult',
          x: Math.cos(krAngle) * krDistance,
          y: krHeight,
          z: Math.sin(krAngle) * krDistance,
          color: getProgressColor(okr.progress),
          size: 10
        };
        nodes.push(krNode);
        
        // Connect to peak
        links.push({
          source: peakId,
          target: krNode.id,
          value: 0.5,
          color: getProgressColor(okr.progress)
        });
      });
      
      // Add progress indicators (milestone nodes)
      const milestones = [25, 50, 75, 100];
      milestones.forEach(milestone => {
        if (milestone <= okr.progress) {
          const milestoneNode = {
            id: `milestone-${index}-${milestone}`,
            name: `${milestone}%`,
            type: 'milestone',
            x: Math.cos(angle) * (distance * (milestone / 100)),
            y: height * (milestone / 100),
            z: Math.sin(angle) * (distance * (milestone / 100)),
            color: '#FFD700',
            size: 5
          };
          nodes.push(milestoneNode);
          
          // Connect milestones
          if (milestone > 25) {
            links.push({
              source: `milestone-${index}-${milestone - 25}`,
              target: milestoneNode.id,
              value: 0.3,
              color: '#FFD700'
            });
          } else {
            links.push({
              source: baseNode.id,
              target: milestoneNode.id,
              value: 0.3,
              color: '#FFD700'
            });
          }
        }
      });
    });
    
    // Add some cloud nodes for atmosphere
    for (let i = 0; i < 5; i++) {
      const cloudNode = {
        id: `cloud-${i}`,
        name: '',
        type: 'cloud',
        x: (Math.random() - 0.5) * 200,
        y: 80 + Math.random() * 40,
        z: (Math.random() - 0.5) * 200,
        color: '#E0E0E0',
        size: 15 + Math.random() * 10
      };
      nodes.push(cloudNode);
    }
    
    setGraphData({ nodes, links });
    setLoading(false);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return '#10B981'; // Green
    if (progress >= 60) return '#3B82F6'; // Blue
    if (progress >= 40) return '#F59E0B'; // Yellow
    if (progress >= 20) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const nodeThreeObject = useCallback((node: any) => {
    // Use default rendering from SafeForceGraph
    return undefined;
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading OKR landscape...</div>;
  }

  return (
    <div className="relative h-full">
      <SafeForceGraph
        graphData={graphData}
        nodeVal={(node: any) => node.size || 10}
        nodeColor={(node: any) => node.color || '#666666'}
        nodeLabel={(node: any) => {
          if (node.type === 'peak') {
            return `${node.name} (${node.progress}%)`;
          }
          return node.name || '';
        }}
        linkColor={(link: any) => link.color || '#333333'}
        linkWidth={(link: any) => link.value || 1}
        linkOpacity={0.4}
        backgroundColor="#000033"
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={true}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur p-3 rounded-lg text-white text-sm">
        <h4 className="font-semibold mb-2">OKR Progress Mountains</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>80-100% Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>60-79% Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>40-59% Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>20-39% Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>0-19% Started</span>
          </div>
        </div>
      </div>
    </div>
  );
}