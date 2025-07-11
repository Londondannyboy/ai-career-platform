'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface Props {
  username: string;
}

export default function SkillsUniverseVisualization({ username }: Props) {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    loadVisualizationData();
  }, [username]);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Add some physics to make it look like a universe
      fgRef.current.d3Force('charge').strength(-100);
      fgRef.current.d3Force('link').distance(30);
    }
  }, [graphData]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading skills universe...</div>;
  }

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      nodeThreeObject={(node: any) => {
        let geometry;
        let material;
        
        if (node.type === 'category') {
          // Category nodes as glowing spheres
          geometry = new (window as any).THREE.SphereGeometry(node.size || 20);
          material = new (window as any).THREE.MeshPhongMaterial({ 
            color: node.color,
            emissive: node.color,
            emissiveIntensity: 0.5,
            shininess: 100
          });
        } else {
          // Skill nodes as smaller spheres
          geometry = new (window as any).THREE.SphereGeometry(node.size || 10);
          material = new (window as any).THREE.MeshLambertMaterial({ 
            color: node.color,
            opacity: 0.8,
            transparent: true
          });
        }
        
        const mesh = new (window as any).THREE.Mesh(geometry, material);
        
        // Add label
        const sprite = new (window as any).THREE.Sprite(
          new (window as any).THREE.SpriteMaterial({
            map: new (window as any).THREE.CanvasTexture(
              (() => {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 64;
                const ctx = canvas.getContext('2d')!;
                ctx.font = node.type === 'category' ? 'bold 28px Arial' : '20px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(node.name, 128, 35);
                return canvas;
              })()
            )
          })
        );
        sprite.scale.set(node.type === 'category' ? 50 : 35, 12, 1);
        sprite.position.y = node.size + 10;
        mesh.add(sprite);
        
        return mesh;
      }}
      linkColor={(link: any) => {
        const sourceNode = graphData.nodes.find((n: any) => n.id === link.source);
        return sourceNode?.color || '#666666';
      }}
      linkOpacity={0.3}
      linkWidth={(link: any) => link.value || 1}
      backgroundColor="#000033"
      enableNodeDrag={true}
      enableNavigationControls={true}
      showNavInfo={false}
      onNodeClick={(node: any) => {
        // Zoom to node
        const distance = 100;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          3000
        );
      }}
    />
  );
}