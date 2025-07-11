'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface Props {
  trinity?: {
    quest: string;
    service: string;
    pledge: string;
  };
}

export default function TrinityVisualization({ trinity }: Props) {
  const fgRef = useRef<any>();

  const graphData = {
    nodes: [
      {
        id: 'center',
        name: 'You',
        type: 'center',
        color: '#FFFFFF',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'quest',
        name: 'Quest',
        type: 'trinity',
        color: '#3B82F6',
        description: trinity?.quest || 'What drives you?',
        x: 0,
        y: 50,
        z: 0
      },
      {
        id: 'service',
        name: 'Service',
        type: 'trinity',
        color: '#10B981',
        description: trinity?.service || 'How do you serve?',
        x: 43.3,
        y: -25,
        z: 0
      },
      {
        id: 'pledge',
        name: 'Pledge',
        type: 'trinity',
        color: '#A855F7',
        description: trinity?.pledge || 'What do you commit to?',
        x: -43.3,
        y: -25,
        z: 0
      }
    ],
    links: [
      { source: 'center', target: 'quest' },
      { source: 'center', target: 'service' },
      { source: 'center', target: 'pledge' },
      { source: 'quest', target: 'service' },
      { source: 'service', target: 'pledge' },
      { source: 'pledge', target: 'quest' }
    ]
  };

  useEffect(() => {
    if (fgRef.current) {
      // Set up camera for best Trinity view
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 150 });
      
      // Add rotation animation
      let angle = 0;
      const rotateCamera = () => {
        angle += 0.005;
        const distance = 150;
        fgRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          y: 30,
          z: distance * Math.cos(angle)
        });
      };
      
      const interval = setInterval(rotateCamera, 50);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="relative h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={(node: any) => {
          let geometry;
          let material;
          
          if (node.type === 'center') {
            // Center node as glowing white sphere
            geometry = new (window as any).THREE.SphereGeometry(8);
            material = new (window as any).THREE.MeshPhongMaterial({ 
              color: node.color,
              emissive: node.color,
              emissiveIntensity: 0.8
            });
          } else {
            // Trinity nodes as larger colored spheres
            geometry = new (window as any).THREE.SphereGeometry(20);
            material = new (window as any).THREE.MeshPhongMaterial({ 
              color: node.color,
              emissive: node.color,
              emissiveIntensity: 0.3,
              shininess: 100
            });
          }
          
          const mesh = new (window as any).THREE.Mesh(geometry, material);
          
          // Add label for Trinity nodes
          if (node.type === 'trinity') {
            const sprite = new (window as any).THREE.Sprite(
              new (window as any).THREE.SpriteMaterial({
                map: new (window as any).THREE.CanvasTexture(
                  (() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 256;
                    const ctx = canvas.getContext('2d')!;
                    
                    // Title
                    ctx.font = 'bold 48px Arial';
                    ctx.fillStyle = node.color;
                    ctx.textAlign = 'center';
                    ctx.fillText(node.name, 256, 60);
                    
                    // Description (wrapped)
                    ctx.font = '24px Arial';
                    ctx.fillStyle = '#FFFFFF';
                    const words = node.description.split(' ');
                    const lines = [];
                    let currentLine = '';
                    
                    words.forEach((word: string) => {
                      const testLine = currentLine + word + ' ';
                      const metrics = ctx.measureText(testLine);
                      if (metrics.width > 480 && currentLine) {
                        lines.push(currentLine);
                        currentLine = word + ' ';
                      } else {
                        currentLine = testLine;
                      }
                    });
                    lines.push(currentLine);
                    
                    lines.forEach((line, idx) => {
                      ctx.fillText(line.trim(), 256, 100 + idx * 30);
                    });
                    
                    return canvas;
                  })()
                )
              })
            );
            sprite.scale.set(80, 40, 1);
            sprite.position.y = 35;
            mesh.add(sprite);
          }
          
          return mesh;
        }}
        linkColor={() => '#666666'}
        linkOpacity={0.6}
        linkWidth={2}
        linkDirectionalParticles={3}
        linkDirectionalParticleSpeed={0.01}
        backgroundColor="#000033"
        enableNodeDrag={false}
        enableNavigationControls={true}
        showNavInfo={false}
      />
      
      {/* Trinity Values Display */}
      {trinity && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur p-4 rounded-lg text-white">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-1">Quest</div>
              <div className="text-xs">{trinity.quest}</div>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-1">Service</div>
              <div className="text-xs">{trinity.service}</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold mb-1">Pledge</div>
              <div className="text-xs">{trinity.pledge}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}