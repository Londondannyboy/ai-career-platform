'use client';

import SafeForceGraph from './SafeForceGraph';

interface Props {
  trinity?: {
    quest: string;
    service: string;
    pledge: string;
  };
}

export default function TrinityVisualization({ trinity }: Props) {

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


  return (
    <div className="relative h-full">
      <SafeForceGraph
        graphData={graphData}
        nodeVal={(node: any) => node.type === 'center' ? 10 : 25}
        nodeColor={(node: any) => node.color}
        linkWidth={2}
        linkDirectionalParticles={3}
        linkDirectionalParticleSpeed={0.01}
        backgroundColor="#000033"
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