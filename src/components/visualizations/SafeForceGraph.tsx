'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => <div>Loading 3D graph...</div>
});

interface Props {
  graphData: any;
  nodeVal?: (node: any) => number;
  nodeColor?: (node: any) => string;
  linkColor?: (link: any) => string;
  linkWidth?: number | ((link: any) => number);
  linkOpacity?: number;
  linkDirectionalParticles?: number;
  linkDirectionalParticleSpeed?: number;
  backgroundColor?: string;
  [key: string]: any;
}

export default function SafeForceGraph({ 
  graphData, 
  nodeVal,
  nodeColor,
  linkColor,
  linkWidth = 1,
  linkOpacity = 0.6,
  linkDirectionalParticles,
  linkDirectionalParticleSpeed,
  backgroundColor = '#000033',
  ...props 
}: Props) {
  const [mounted, setMounted] = useState(false);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Custom node rendering to avoid black squares
  const nodeThreeObject = useCallback((node: any) => {
    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(5);
    
    // Get node color
    const color = nodeColor ? nodeColor(node) : (node.color || '#3B82F6');
    const material = new THREE.MeshBasicMaterial({ 
      color,
      opacity: 0.9,
      transparent: true
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    
    // Add a subtle glow effect
    const glowGeometry = new THREE.SphereGeometry(7);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color,
      opacity: 0.3,
      transparent: true
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    const group = new THREE.Group();
    group.add(sphere);
    group.add(glow);
    
    return group;
  }, [nodeColor]);

  // Handle node sizing
  const getNodeVal = useCallback((node: any) => {
    if (nodeVal) return nodeVal(node);
    return node.size || 10;
  }, [nodeVal]);

  // Handle node colors
  const getNodeColor = useCallback((node: any) => {
    if (nodeColor) return nodeColor(node);
    return node.color || '#3B82F6';
  }, [nodeColor]);

  // Handle link colors
  const getLinkColor = useCallback((link: any) => {
    if (linkColor) return linkColor(link);
    return link.color || '#666666';
  }, [linkColor]);

  // Handle link width
  const getLinkWidth = useCallback((link: any) => {
    if (typeof linkWidth === 'function') return linkWidth(link);
    return link.value || linkWidth;
  }, [linkWidth]);

  useEffect(() => {
    if (mounted && fgRef.current && backgroundColor) {
      const scene = fgRef.current.scene();
      if (scene) {
        scene.background = new THREE.Color(backgroundColor);
      }
    }
  }, [mounted, backgroundColor]);

  if (!mounted) {
    return <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      Initializing 3D view...
    </div>;
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      No data available
    </div>;
  }

  try {
    return (
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: any) => node.name || node.id}
        nodeThreeObject={nodeThreeObject}
        nodeVal={getNodeVal}
        linkColor={getLinkColor}
        linkOpacity={linkOpacity}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
        backgroundColor={backgroundColor}
        {...props}
      />
    );
  } catch (error) {
    console.error('3D Graph error:', error);
    return <div className="flex items-center justify-center h-full bg-gray-900 text-red-500">
      Error loading 3D visualization. Please refresh the page.
    </div>;
  }
}