'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface Props {
  username: string;
}

export default function SurfaceRepoVisualization({ username }: Props) {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisualizationData();
  }, [username]);

  const loadVisualizationData = async () => {
    try {
      setLoading(true);
      
      // Use the same endpoint we fixed yesterday
      const response = await fetch('/api/surface-repo/visualize-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || username })
      });

      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      }
    } catch (error) {
      console.error('Error loading visualization:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading network...</div>;
  }

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeAutoColorBy="type"
      nodeThreeObject={(node: any) => {
        // Custom node rendering based on type
        const geometry = new (window as any).THREE.SphereGeometry(
          node.type === 'profile' ? 10 : 5
        );
        const material = new (window as any).THREE.MeshBasicMaterial({
          color: node.color || '#3B82F6'
        });
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
                ctx.font = '24px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(node.name || node.id, 128, 32);
                return canvas;
              })()
            )
          })
        );
        sprite.scale.set(40, 10, 1);
        sprite.position.y = 15;
        mesh.add(sprite);
        
        return mesh;
      }}
      linkColor={() => '#666666'}
      linkOpacity={0.6}
      linkWidth={1}
      enableNodeDrag={true}
      enableNavigationControls={true}
      showNavInfo={false}
    />
  );
}