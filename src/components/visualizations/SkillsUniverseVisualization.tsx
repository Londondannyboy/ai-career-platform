'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import SafeForceGraph from './SafeForceGraph';

interface Props {
  username: string;
}

export default function SkillsUniverseVisualization({ username }: Props) {
  const { user, isLoaded } = useUser();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      loadVisualizationData();
    }
  }, [username, isLoaded]);

  const loadVisualizationData = async () => {
    try {
      setLoading(true);
      
      // Use the skills universe endpoint
      const response = await fetch('/api/visualization/skills-universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || username })
      });

      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      } else {
        // Fallback to test data with skill clusters
        const skillCategories = {
          'Frontend': ['React', 'TypeScript', 'CSS', 'Next.js', 'Tailwind'],
          'Backend': ['Node.js', 'PostgreSQL', 'GraphQL', 'REST APIs'],
          'AI/ML': ['OpenAI', 'LangChain', 'Vector DBs', 'NLP'],
          'Leadership': ['Team Building', 'Strategy', 'Communication', 'Mentoring']
        };

        const nodes: any[] = [];
        const links: any[] = [];

        // Create category centers
        const categoryPositions: any = {
          'Frontend': { x: -50, y: 50, z: 0 },
          'Backend': { x: 50, y: 50, z: 0 },
          'AI/ML': { x: 0, y: -50, z: 50 },
          'Leadership': { x: 0, y: -50, z: -50 }
        };

        Object.entries(skillCategories).forEach(([category, skills]) => {
          const catPos = categoryPositions[category];
          
          // Add category node
          const categoryNode = {
            id: `cat-${category}`,
            name: category,
            type: 'category',
            size: 20,
            color: category === 'AI/ML' ? '#10B981' : category === 'Frontend' ? '#3B82F6' : category === 'Backend' ? '#F59E0B' : '#A855F7',
            x: catPos.x,
            y: catPos.y,
            z: catPos.z
          };
          nodes.push(categoryNode);

          // Add skill nodes
          skills.forEach((skill, idx) => {
            const angle = (idx / skills.length) * Math.PI * 2;
            const radius = 30;
            const skillNode = {
              id: `skill-${skill}`,
              name: skill,
              type: 'skill',
              category,
              size: 10 + Math.random() * 10, // Random size for variety
              color: categoryNode.color,
              x: catPos.x + Math.cos(angle) * radius,
              y: catPos.y + Math.sin(angle) * radius,
              z: catPos.z + (Math.random() - 0.5) * 20
            };
            nodes.push(skillNode);
            
            // Link to category
            links.push({
              source: categoryNode.id,
              target: skillNode.id,
              value: 1
            });
          });
        });

        // Add some cross-category links
        links.push(
          { source: 'skill-React', target: 'skill-TypeScript', value: 2 },
          { source: 'skill-Node.js', target: 'skill-TypeScript', value: 2 },
          { source: 'skill-OpenAI', target: 'skill-REST APIs', value: 1 }
        );

        setGraphData({ nodes, links });
      }
    } catch (error) {
      console.error('Error loading skills:', error);
      setError('Failed to load skills data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading skills universe...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  }

  return (
    <SafeForceGraph
      graphData={graphData}
      nodeVal={(node: any) => node.size || (node.type === 'category' ? 20 : 10)}
      nodeColor={(node: any) => node.color || '#3B82F6'}
      linkColor={(link: any) => {
        const sourceNode = graphData.nodes.find((n: any) => n.id === link.source);
        return sourceNode?.color || '#666666';
      }}
      linkOpacity={0.3}
      linkWidth={(link: any) => link.value || 1}
      backgroundColor="#000033"
    />
  );
}