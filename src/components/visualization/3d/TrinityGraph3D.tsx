'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ForceGraph3DWrapper from './ForceGraph3DWrapper';

interface NodeObject {
  id: string;
  label: string;
  val?: number;
  color?: string;
  type?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [key: string]: any;
}

interface LinkObject {
  source: string;
  target: string;
  color?: string;
  particles?: number;
  [key: string]: any;
}

interface GraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}
import { useUser } from '@clerk/nextjs';

interface TrinityData {
  quest: string;
  service: string;
  pledge: string;
  type: 'F' | 'L' | 'M';
  createdAt: Date;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  trinityAspect: 'quest' | 'service' | 'pledge';
}

interface Task {
  id: string;
  title: string;
  goalId: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TrinityGraph3DProps {
  trinityData?: TrinityData;
  goals?: Goal[];
  tasks?: Task[];
  onNodeClick?: (node: NodeObject) => void;
  mode?: 'trinity' | 'goals' | 'full';
}

const TrinityGraph3D: React.FC<TrinityGraph3DProps> = ({
  trinityData,
  goals = [],
  tasks = [],
  onNodeClick,
  mode = 'full',
}) => {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

  // Trinity aspect colors
  const TRINITY_COLORS = {
    quest: '#FFD700', // Gold
    service: '#00CED1', // Dark Turquoise
    pledge: '#9370DB', // Medium Purple
    core: '#FFFFFF', // White for central node
    goal: '#4169E1', // Royal Blue
    task: {
      low: '#90EE90', // Light Green
      medium: '#FFA500', // Orange
      high: '#FF6347', // Tomato
    },
  };

  // Generate graph data
  useEffect(() => {
    if (!trinityData) return;

    const nodes: NodeObject[] = [];
    const links: LinkObject[] = [];

    // Central Trinity node
    const coreNode: NodeObject = {
      id: 'trinity-core',
      label: user?.firstName ? `${user.firstName}'s Trinity` : 'My Trinity',
      val: 30,
      color: TRINITY_COLORS.core,
      type: 'trinity-core',
      fx: 0,
      fy: 0,
      fz: 0,
    };
    nodes.push(coreNode);

    // Trinity aspect nodes
    if (mode === 'trinity' || mode === 'full') {
      const aspectRadius = 100;
      const aspects = [
        { id: 'quest', label: 'Quest', value: trinityData.quest, angle: 0 },
        { id: 'service', label: 'Service', value: trinityData.service, angle: 120 },
        { id: 'pledge', label: 'Pledge', value: trinityData.pledge, angle: 240 },
      ];

      aspects.forEach((aspect) => {
        const angleRad = (aspect.angle * Math.PI) / 180;
        const node: NodeObject = {
          id: `trinity-${aspect.id}`,
          label: aspect.label,
          val: 20,
          color: TRINITY_COLORS[aspect.id as 'quest' | 'service' | 'pledge'],
          type: 'trinity-aspect',
          x: aspectRadius * Math.cos(angleRad),
          y: aspectRadius * Math.sin(angleRad),
          z: 0,
          fullText: aspect.value,
        };
        nodes.push(node);

        // Link to core
        links.push({
          source: 'trinity-core',
          target: `trinity-${aspect.id}`,
          color: TRINITY_COLORS[aspect.id as 'quest' | 'service' | 'pledge'],
          particles: 2,
        });
      });
    }

    // Add goals
    if ((mode === 'goals' || mode === 'full') && goals.length > 0) {
      const goalRadius = mode === 'full' ? 200 : 100;
      
      goals.forEach((goal, index) => {
        const angle = (index * 360) / goals.length;
        const angleRad = (angle * Math.PI) / 180;
        const zOffset = (index % 2) * 50 - 25; // Alternate z-position for 3D effect

        const node: NodeObject = {
          id: `goal-${goal.id}`,
          label: goal.title,
          val: 15,
          color: TRINITY_COLORS.goal,
          type: 'goal',
          x: goalRadius * Math.cos(angleRad),
          y: goalRadius * Math.sin(angleRad),
          z: zOffset,
          progress: goal.progress,
          trinityAspect: goal.trinityAspect,
        };
        nodes.push(node);

        // Link to Trinity aspect or core
        const targetId = mode === 'full' 
          ? `trinity-${goal.trinityAspect}`
          : 'trinity-core';
        
        links.push({
          source: targetId,
          target: `goal-${goal.id}`,
          color: TRINITY_COLORS[goal.trinityAspect],
          particles: Math.floor(goal.progress / 20), // More particles for higher progress
        });
      });

      // Add tasks
      if (mode === 'full' && tasks.length > 0) {
        tasks.forEach((task) => {
          const goalNode = nodes.find(n => n.id === `goal-${task.goalId}`);
          if (!goalNode) return;

          const taskAngle = Math.random() * 360;
          const taskAngleRad = (taskAngle * Math.PI) / 180;
          const taskRadius = 50;

          const node: NodeObject = {
            id: `task-${task.id}`,
            label: task.title,
            val: 5,
            color: task.completed 
              ? '#00FF00' // Bright green for completed
              : TRINITY_COLORS.task[task.priority],
            type: 'task',
            x: (goalNode.x || 0) + taskRadius * Math.cos(taskAngleRad),
            y: (goalNode.y || 0) + taskRadius * Math.sin(taskAngleRad),
            z: (goalNode.z || 0) + (Math.random() * 40 - 20),
            completed: task.completed,
            priority: task.priority,
          };
          nodes.push(node);

          links.push({
            source: `goal-${task.goalId}`,
            target: `task-${task.id}`,
            color: task.completed ? '#00FF00' : '#CCCCCC',
            particles: task.completed ? 3 : 0,
          });
        });
      }
    }

    setGraphData({ nodes, links });
  }, [trinityData, goals, tasks, mode, user]);

  // Custom node label
  const nodeLabel = (node: NodeObject) => {
    if (node.type === 'trinity-aspect' && node.fullText) {
      return `${node.label}: "${node.fullText.substring(0, 50)}..."`;
    }
    if (node.type === 'goal' && node.progress !== undefined) {
      return `${node.label} (${node.progress}% complete)`;
    }
    if (node.type === 'task') {
      return `${node.label} ${node.completed ? '✓' : `(${node.priority})`}`;
    }
    return node.label;
  };

  // Handle node click
  const handleNodeClick = (node: NodeObject) => {
    console.log('Node clicked:', node);
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Show details based on node type
    if (node.type === 'trinity-aspect' && node.fullText) {
      // Could open a modal or sidebar with full Trinity text
      console.log(`${node.label}: ${node.fullText}`);
    } else if (node.type === 'goal') {
      // Could navigate to goal details
      console.log(`Goal: ${node.label}, Progress: ${node.progress}%`);
    } else if (node.type === 'task') {
      // Could open task editor
      console.log(`Task: ${node.label}, Status: ${node.completed ? 'Completed' : 'Pending'}`);
    }
  };

  return (
    <div className="w-full h-full relative">
      <ForceGraph3DWrapper
        graphData={graphData}
        backgroundColor="#000033"
        nodeLabel={nodeLabel}
        nodeAutoColorBy="type"
        linkDirectionalParticles="particles"
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        enableNodeDrag={true}
        nodeOpacity={0.9}
        linkOpacity={0.6}
        linkWidth={2}
        cooldownTicks={50}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-4 rounded-lg text-sm">
        <h3 className="font-bold mb-2">Trinity Universe</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <span>Trinity Core</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Quest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <span>Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span>Pledge</span>
          </div>
          {(mode === 'goals' || mode === 'full') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Goals</span>
              </div>
              {mode === 'full' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Tasks</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrinityGraph3D;