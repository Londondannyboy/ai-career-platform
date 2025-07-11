'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => <div>Loading 3D graph...</div>
});

interface Props {
  graphData: any;
  [key: string]: any;
}

export default function SafeForceGraph({ graphData, ...props }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center h-full">Initializing 3D view...</div>;
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  try {
    return (
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="name"
        nodeAutoColorBy="type"
        linkColor={() => '#666666'}
        linkOpacity={0.6}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
        {...props}
      />
    );
  } catch (error) {
    console.error('3D Graph error:', error);
    return <div className="flex items-center justify-center h-full text-red-500">
      Error loading 3D visualization
    </div>;
  }
}