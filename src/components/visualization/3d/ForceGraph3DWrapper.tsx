'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with Three.js
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface ForceGraph3DWrapperProps {
  graphData: {
    nodes: any[];
    links: any[];
  };
  width?: number;
  height?: number;
  backgroundColor?: string;
  nodeLabel?: any;
  nodeColor?: any;
  linkColor?: any;
  linkDirectionalParticles?: any;
  linkDirectionalParticleSpeed?: any;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any) => void;
  onLinkClick?: (link: any) => void;
  onLinkHover?: (link: any) => void;
  enableNodeDrag?: boolean;
  enableNavigationControls?: boolean;
  showNavInfo?: boolean;
  nodeAutoColorBy?: string;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeRelSize?: number;
  linkOpacity?: number;
  linkWidth?: any;
  linkCurvature?: any;
  cooldownTicks?: number;
  warmupTicks?: number;
  onEngineStop?: () => void;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  nodeThreeObject?: any;
  linkThreeObject?: any;
}

const ForceGraph3DWrapper: React.FC<ForceGraph3DWrapperProps> = ({
  graphData,
  width,
  height,
  backgroundColor = '#000011',
  nodeLabel = 'label',
  nodeColor,
  linkColor,
  linkDirectionalParticles = 0,
  linkDirectionalParticleSpeed = 0.006,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  onLinkHover,
  enableNodeDrag = true,
  enableNavigationControls = true,
  showNavInfo = true,
  nodeAutoColorBy,
  nodeOpacity = 0.9,
  nodeResolution = 16,
  nodeRelSize = 4,
  linkOpacity = 0.5,
  linkWidth = 1,
  linkCurvature = 0,
  cooldownTicks = 100,
  warmupTicks = 0,
  onEngineStop,
  d3AlphaDecay = 0.0228,
  d3VelocityDecay = 0.4,
  nodeThreeObject,
  linkThreeObject,
}) => {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: width || 800, height: height || 600 });

  // Handle window resize
  useEffect(() => {
    if (!width || !height) {
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight - 100, // Account for any UI elements
        });
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [width, height]);

  // Camera positioning after data loads
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Zoom to fit all nodes with some padding
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 100);
      }, 500);
    }
  }, [graphData]);

  // Handle node interactions
  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    
    // Focus on clicked node
    if (fgRef.current) {
      const distance = 200;
      const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
      
      fgRef.current.cameraPosition(
        {
          x: (node.x || 0) * distRatio,
          y: (node.y || 0) * distRatio,
          z: (node.z || 0) * distRatio,
        },
        node,
        1000 // Animation duration
      );
    }
  }, [onNodeClick]);

  // Define default node color function if not provided
  const defaultNodeColor = useCallback((node: any) => {
    return node.color || '#4F46E5';
  }, []);

  // Define default link color function if not provided
  const defaultLinkColor = useCallback((link: any) => {
    return link.color || '#ffffff';
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={backgroundColor}
        nodeLabel={nodeLabel}
        nodeColor={nodeColor || defaultNodeColor}
        linkColor={linkColor || defaultLinkColor}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
        onNodeClick={handleNodeClick}
        onNodeHover={onNodeHover}
        onLinkClick={onLinkClick}
        onLinkHover={onLinkHover}
        enableNodeDrag={enableNodeDrag}
        enableNavigationControls={enableNavigationControls}
        showNavInfo={false}
        nodeAutoColorBy={nodeAutoColorBy}
        nodeOpacity={nodeOpacity}
        nodeResolution={nodeResolution}
        nodeRelSize={nodeRelSize}
        linkOpacity={linkOpacity}
        linkWidth={linkWidth}
        linkCurvature={linkCurvature}
        cooldownTicks={cooldownTicks}
        warmupTicks={warmupTicks}
        onEngineStop={onEngineStop}
        d3AlphaDecay={d3AlphaDecay}
        d3VelocityDecay={d3VelocityDecay}
        nodeThreeObject={nodeThreeObject}
        linkThreeObject={linkThreeObject}
      />
      
      {/* Controls overlay */}
      {showNavInfo && (
        <div className="absolute top-4 left-4 text-white text-sm bg-black/50 p-2 rounded">
          <p>🖱️ Left-click: rotate | Scroll: zoom | Right-click: pan</p>
          <p>Click node to focus | {enableNodeDrag ? 'Drag nodes to reposition' : ''}</p>
        </div>
      )}
    </div>
  );
};

export default ForceGraph3DWrapper;