'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface Props {
  username: string;
}

export default function CareerTimelineVisualization({ username }: Props) {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisualizationData();
  }, [username]);

  const loadVisualizationData = async () => {
    try {
      setLoading(true);
      
      // Use the career timeline endpoint
      const response = await fetch('/api/visualization/career-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || username })
      });

      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      } else {
        // Fallback to test data
        setGraphData({
          nodes: [
            { id: 'start', name: 'Career Start', type: 'milestone', year: 2010, x: -100, y: 0, z: 0 },
            { id: 'exp1', name: 'Junior Developer', type: 'past', year: 2015, x: -50, y: 20, z: 0 },
            { id: 'exp2', name: 'Senior Engineer', type: 'past', year: 2020, x: 0, y: 30, z: 0 },
            { id: 'current', name: 'Founder @ Quest', type: 'current', year: 2024, x: 50, y: 40, z: 0 },
            { id: 'future1', name: 'Scale to 1M users', type: 'future', year: 2026, x: 100, y: 50, z: 0 },
            { id: 'future2', name: 'IPO / Acquisition', type: 'future', year: 2030, x: 150, y: 60, z: 0 }
          ],
          links: [
            { source: 'start', target: 'exp1' },
            { source: 'exp1', target: 'exp2' },
            { source: 'exp2', target: 'current' },
            { source: 'current', target: 'future1' },
            { source: 'future1', target: 'future2' }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading timeline...</div>;
  }

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeThreeObject={(node: any) => {
        // Different shapes for different time periods
        let geometry;
        let material;
        
        if (node.type === 'milestone') {
          geometry = new (window as any).THREE.OctahedronGeometry(8);
          material = new (window as any).THREE.MeshBasicMaterial({ color: '#FFD700' });
        } else if (node.type === 'past') {
          geometry = new (window as any).THREE.BoxGeometry(15, 15, 15);
          material = new (window as any).THREE.MeshBasicMaterial({ 
            color: '#6B7280',
            opacity: 0.8,
            transparent: true
          });
        } else if (node.type === 'current') {
          geometry = new (window as any).THREE.SphereGeometry(12);
          material = new (window as any).THREE.MeshBasicMaterial({ 
            color: '#3B82F6',
            emissive: '#3B82F6',
            emissiveIntensity: 0.5
          });
        } else { // future
          geometry = new (window as any).THREE.ConeGeometry(10, 20, 4);
          material = new (window as any).THREE.MeshBasicMaterial({ 
            color: '#A855F7',
            opacity: 0.5,
            transparent: true
          });
        }
        
        const mesh = new (window as any).THREE.Mesh(geometry, material);
        
        // Add year label
        const sprite = new (window as any).THREE.Sprite(
          new (window as any).THREE.SpriteMaterial({
            map: new (window as any).THREE.CanvasTexture(
              (() => {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 128;
                const ctx = canvas.getContext('2d')!;
                ctx.font = 'bold 32px Arial';
                ctx.fillStyle = node.type === 'future' ? '#A855F7' : '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(node.name, 256, 50);
                ctx.font = '24px Arial';
                ctx.fillText(node.year?.toString() || '', 256, 85);
                return canvas;
              })()
            )
          })
        );
        sprite.scale.set(60, 15, 1);
        sprite.position.y = 20;
        mesh.add(sprite);
        
        return mesh;
      }}
      linkColor={(link: any) => {
        const target = graphData.nodes.find((n: any) => n.id === link.target);
        return target?.type === 'future' ? '#A855F7' : '#666666';
      }}
      linkOpacity={0.6}
      linkWidth={2}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.005}
      enableNodeDrag={false}
      enableNavigationControls={true}
      showNavInfo={false}
      onNodeClick={(node: any) => {
        console.log('Clicked:', node);
      }}
    />
  );
}