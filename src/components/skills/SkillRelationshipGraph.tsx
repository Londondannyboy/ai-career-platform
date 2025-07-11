'use client';

import { useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Skill } from '@/lib/skills/skillTypes';
import { skillRelationshipAnalyzer, SkillCluster, SKILL_CLUSTERS } from '@/lib/skills/skillRelationships';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface Props {
  skills: Skill[];
  onSkillClick?: (skill: Skill) => void;
  height?: number;
}

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  cluster?: string;
  skill?: Skill;
  isUserSkill: boolean;
  isSuggestion: boolean;
}

interface Link {
  source: string;
  target: string;
  type: 'prerequisite' | 'complementary' | 'alternative' | 'advanced' | 'cluster';
  strength: number;
  color: string;
}

export default function SkillRelationshipGraph({ skills, onSkillClick, height = 400 }: Props) {
  const fgRef = useRef<any>(null);

  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Map<string, Node>();

    // Analyze user's skill clusters
    const { clusters, suggestions } = skillRelationshipAnalyzer.analyzeSkillClusters(skills);

    // Add user's skills as nodes
    skills.forEach(skill => {
      const cluster = skillRelationshipAnalyzer.getSkillCluster(skill.name);
      const node: Node = {
        id: skill.name,
        name: skill.name,
        val: 10 + (skill.proficiency === 'expert' ? 10 : 
                   skill.proficiency === 'advanced' ? 7 :
                   skill.proficiency === 'intermediate' ? 4 : 0),
        color: cluster?.color || '#6B7280',
        cluster: cluster?.id,
        skill,
        isUserSkill: true,
        isSuggestion: false
      };
      nodes.push(node);
      nodeMap.set(skill.name, node);
    });

    // Add suggested skills as nodes
    suggestions.slice(0, 10).forEach(suggestion => {
      if (!nodeMap.has(suggestion.skill)) {
        const cluster = SKILL_CLUSTERS.find(c => c.id === suggestion.cluster);
        const node: Node = {
          id: suggestion.skill,
          name: suggestion.skill,
          val: 8,
          color: cluster?.color || '#6B7280',
          cluster: suggestion.cluster,
          isUserSkill: false,
          isSuggestion: true
        };
        nodes.push(node);
        nodeMap.set(suggestion.skill, node);
      }
    });

    // Add relationships between skills
    nodes.forEach(node => {
      const relationships = skillRelationshipAnalyzer.getRelatedSkills(node.name);
      
      relationships.forEach(rel => {
        const otherSkill = rel.skill1 === node.name ? rel.skill2 : rel.skill1;
        
        // Only add link if both nodes exist
        if (nodeMap.has(otherSkill)) {
          const linkId = [node.id, otherSkill].sort().join('-');
          const existingLink = links.find(l => 
            [l.source, l.target].sort().join('-') === linkId
          );
          
          if (!existingLink) {
            links.push({
              source: node.id,
              target: otherSkill,
              type: rel.relationship,
              strength: rel.strength,
              color: rel.relationship === 'prerequisite' ? '#10B981' :
                     rel.relationship === 'complementary' ? '#3B82F6' :
                     rel.relationship === 'alternative' ? '#F59E0B' : '#8B5CF6'
            });
          }
        }
      });
    });

    // Add cluster connections
    clusters.forEach(({ cluster, skills: clusterSkills }) => {
      // Connect skills within the same cluster
      for (let i = 0; i < clusterSkills.length - 1; i++) {
        for (let j = i + 1; j < clusterSkills.length; j++) {
          const skill1 = clusterSkills[i].name;
          const skill2 = clusterSkills[j].name;
          
          // Check if a relationship already exists
          const existingLink = links.find(l => 
            (l.source === skill1 && l.target === skill2) ||
            (l.source === skill2 && l.target === skill1)
          );
          
          if (!existingLink) {
            links.push({
              source: skill1,
              target: skill2,
              type: 'cluster',
              strength: 0.3,
              color: 'rgba(255,255,255,0.1)'
            });
          }
        }
      }
    });

    return { nodes, links };
  }, [skills]);

  // Custom node rendering
  const nodeThreeObject = useCallback((node: any) => {
    const group = new THREE.Group();
    
    // Main sphere
    const geometry = new THREE.SphereGeometry(5);
    const material = new THREE.MeshBasicMaterial({ 
      color: node.color,
      opacity: node.isSuggestion ? 0.5 : 0.9,
      transparent: true
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);
    
    // Add glow for user skills
    if (node.isUserSkill) {
      const glowGeometry = new THREE.SphereGeometry(7);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: node.color,
        opacity: 0.3,
        transparent: true
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
    }
    
    // Add ring for suggestions
    if (node.isSuggestion) {
      const ringGeometry = new THREE.TorusGeometry(6, 0.5, 8, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#FBBF24',
        opacity: 0.7,
        transparent: true
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      group.add(ring);
    }
    
    return group;
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    if (node.skill && onSkillClick) {
      onSkillClick(node.skill);
    }
    
    // Center camera on node
    const distance = 100;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        1000
      );
    }
  }, [onSkillClick]);

  // Analyze clusters for display
  const topClusters = useMemo(() => {
    const { clusters } = skillRelationshipAnalyzer.analyzeSkillClusters(skills);
    return clusters.slice(0, 3);
  }, [skills]);

  return (
    <div className="space-y-4">
      <div className="relative" style={{ height }}>
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          nodeVal="val"
          nodeColor="color"
          nodeThreeObject={nodeThreeObject}
          linkColor={(link: any) => link.color}
          linkWidth={(link: any) => link.strength * 3}
          linkOpacity={0.6}
          linkDirectionalParticles={(link: any) => 
            link.type === 'prerequisite' ? 2 : 0
          }
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
        />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Prerequisite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-400">Complementary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-400">Alternative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-50"></div>
            <span className="text-gray-400">Suggested</span>
          </div>
        </div>
      </div>
      
      {/* Cluster Analysis */}
      {topClusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topClusters.map(({ cluster, skills: clusterSkills, coverage }) => (
            <Card key={cluster.id} className="bg-gray-800 border-gray-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-white">{cluster.name}</h4>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: `${cluster.color}20`, color: cluster.color }}
                >
                  {Math.round(coverage * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mb-2">{clusterSkills.length} skills</p>
              <div className="flex flex-wrap gap-1">
                {clusterSkills.slice(0, 3).map(skill => (
                  <Badge 
                    key={skill.name} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {skill.name}
                  </Badge>
                ))}
                {clusterSkills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{clusterSkills.length - 3}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}