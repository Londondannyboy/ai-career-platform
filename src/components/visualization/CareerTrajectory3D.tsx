'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Experience } from '@/lib/experience/experienceTypes';
import { Education } from '@/lib/education/educationTypes';
import { Skill } from '@/lib/skills/skillTypes';
import { calculateSkillStrength } from '@/lib/skills/skillTypes';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface Props {
  experiences: Experience[];
  futureExperiences?: Experience[];
  education: Education[];
  skills: Skill[];
  achievements?: any[];
}

interface Node {
  id: string;
  name: string;
  type: 'experience' | 'education' | 'skill' | 'achievement' | 'future';
  val: number;
  color: string;
  data: any;
  x?: number;
  y?: number;
  z?: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export default function CareerTrajectory3D({ 
  experiences, 
  futureExperiences = [], 
  education, 
  skills,
  achievements = []
}: Props) {
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Build graph data
  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    // Timeline positioning
    const getTimelinePosition = (dateStr: string | undefined, isFuture: boolean = false) => {
      if (!dateStr && !isFuture) return 0;
      if (isFuture) {
        // Future experiences positioned ahead
        const currentYear = new Date().getFullYear();
        return (currentYear + 5) * 10;
      }
      
      const date = new Date(dateStr + '-01');
      const year = date.getFullYear();
      const month = date.getMonth();
      return (year * 12 + month) / 12 * 10; // Scale to graph units
    };
    
    // Add education nodes
    education.forEach((edu, idx) => {
      const x = getTimelinePosition(edu.endDate || edu.startDate);
      nodes.push({
        id: `edu-${idx}`,
        name: `${edu.degree} - ${edu.institution}`,
        type: 'education',
        val: 15,
        color: '#3B82F6', // Blue
        data: edu,
        x,
        y: -20, // Below timeline
        z: 0
      });
    });
    
    // Add experience nodes
    experiences.forEach((exp, idx) => {
      const x = getTimelinePosition(exp.endDate || exp.startDate);
      const size = 10 + (exp.teamSize ? Math.log(exp.teamSize) * 3 : 0);
      
      nodes.push({
        id: `exp-${idx}`,
        name: `${exp.title} @ ${exp.company}`,
        type: 'experience',
        val: size,
        color: exp.current ? '#10B981' : '#6B7280', // Green if current, gray if past
        data: exp,
        x,
        y: 0, // On timeline
        z: 0
      });
      
      // Link experiences to education
      education.forEach((edu, eduIdx) => {
        if (edu.endDate && exp.startDate) {
          const eduEnd = new Date(edu.endDate);
          const expStart = new Date(exp.startDate);
          const monthsDiff = (expStart.getTime() - eduEnd.getTime()) / (1000 * 60 * 60 * 24 * 30);
          
          if (monthsDiff >= 0 && monthsDiff <= 24) {
            links.push({
              source: `edu-${eduIdx}`,
              target: `exp-${idx}`,
              type: 'education-to-career',
              strength: 1 - (monthsDiff / 24)
            });
          }
        }
      });
      
      // Link sequential experiences
      if (idx > 0) {
        links.push({
          source: `exp-${idx - 1}`,
          target: `exp-${idx}`,
          type: 'career-progression',
          strength: 0.8
        });
      }
    });
    
    // Add future experience nodes
    futureExperiences.forEach((exp, idx) => {
      const x = getTimelinePosition(undefined, true) + idx * 10;
      
      nodes.push({
        id: `future-${idx}`,
        name: `[Goal] ${exp.title} @ ${exp.company || 'Target Company'}`,
        type: 'future',
        val: 12,
        color: '#F59E0B', // Amber
        data: exp,
        x,
        y: 0,
        z: 10 // Slightly forward
      });
      
      // Link current to future
      const currentExp = experiences.find(e => e.current);
      if (currentExp) {
        const currentIdx = experiences.indexOf(currentExp);
        links.push({
          source: `exp-${currentIdx}`,
          target: `future-${idx}`,
          type: 'aspiration',
          strength: 0.5
        });
      }
    });
    
    // Add skill nodes (clustered around experiences)
    skills.forEach((skill, idx) => {
      const strength = calculateSkillStrength(skill);
      const angle = (idx / skills.length) * Math.PI * 2;
      const radius = 30 + (100 - strength) / 2;
      
      nodes.push({
        id: `skill-${idx}`,
        name: skill.name,
        type: 'skill',
        val: 5 + (strength / 20),
        color: skill.proficiency === 'expert' ? '#DC2626' : 
               skill.proficiency === 'advanced' ? '#7C3AED' :
               skill.proficiency === 'intermediate' ? '#2563EB' : '#10B981',
        data: skill,
        x: Math.cos(angle) * radius,
        y: 20 + (skill.proficiency === 'expert' ? 20 : 
                 skill.proficiency === 'advanced' ? 10 : 0),
        z: Math.sin(angle) * radius
      });
      
      // Link skills to experiences where they were used
      experiences.forEach((exp, expIdx) => {
        if (exp.technologies?.includes(skill.name) || 
            exp.skillsUsed?.includes(skill.name)) {
          links.push({
            source: `skill-${idx}`,
            target: `exp-${expIdx}`,
            type: 'skill-usage',
            strength: 0.3
          });
        }
      });
    });
    
    // Add achievement nodes
    achievements.forEach((achievement, idx) => {
      const x = Math.random() * 100 - 50;
      const y = 40 + Math.random() * 20;
      const z = Math.random() * 50 - 25;
      
      nodes.push({
        id: `achievement-${idx}`,
        name: achievement.title,
        type: 'achievement',
        val: 8,
        color: '#FBBF24', // Yellow
        data: achievement,
        x,
        y,
        z
      });
    });
    
    return { nodes, links };
  }, [experiences, futureExperiences, education, skills, achievements]);

  // Custom node rendering
  const nodeThreeObject = useCallback((node: any) => {
    const geometry = new THREE.SphereGeometry(5);
    const material = new THREE.MeshBasicMaterial({ 
      color: node.color,
      opacity: node.type === 'future' ? 0.7 : 0.9,
      transparent: true
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    
    // Add glow for current/future nodes
    if (node.type === 'experience' && node.data.current) {
      const glowGeometry = new THREE.SphereGeometry(8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: node.color,
        opacity: 0.3,
        transparent: true
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      sphere.add(glow);
    }
    
    return sphere;
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    
    // Center camera on node
    const distance = 100;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      1000
    );
  }, []);

  return (
    <div className="relative w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeVal="val"
        nodeColor="color"
        nodeThreeObject={nodeThreeObject}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        linkWidth={link => (link as Link).strength * 2}
        linkDirectionalParticles={link => 
          (link as Link).type === 'career-progression' || 
          (link as Link).type === 'aspiration' ? 2 : 0
        }
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
      />
      
      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900/95 border-gray-800 p-4">
          <h3 className="font-bold text-white mb-2">{selectedNode.name}</h3>
          
          {selectedNode.type === 'experience' && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-400">
                {selectedNode.data.startDate} - {selectedNode.data.current ? 'Present' : selectedNode.data.endDate}
              </p>
              {selectedNode.data.teamSize && (
                <p className="text-gray-300">Team Size: {selectedNode.data.teamSize}</p>
              )}
              {selectedNode.data.impact && selectedNode.data.impact.length > 0 && (
                <div>
                  <p className="text-gray-300 font-semibold">Impact:</p>
                  {selectedNode.data.impact.map((impact: any, idx: number) => (
                    <p key={idx} className="text-gray-400 ml-2">
                      • {impact.description}: {impact.metric}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedNode.type === 'skill' && (
            <div className="space-y-2 text-sm">
              <Badge className={`
                ${selectedNode.data.proficiency === 'expert' ? 'bg-red-100 text-red-800' :
                  selectedNode.data.proficiency === 'advanced' ? 'bg-purple-100 text-purple-800' :
                  selectedNode.data.proficiency === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'}
              `}>
                {selectedNode.data.proficiency}
              </Badge>
              {selectedNode.data.yearsOfExperience && (
                <p className="text-gray-300">
                  {selectedNode.data.yearsOfExperience} years experience
                </p>
              )}
              <p className="text-gray-400">
                Strength: {calculateSkillStrength(selectedNode.data)}%
              </p>
            </div>
          )}
          
          {selectedNode.type === 'education' && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">{selectedNode.data.field}</p>
              <p className="text-gray-400">
                {selectedNode.data.startDate} - {selectedNode.data.endDate || 'Present'}
              </p>
              {selectedNode.data.achievements && selectedNode.data.achievements.length > 0 && (
                <div>
                  <p className="text-gray-300 font-semibold">Achievements:</p>
                  {selectedNode.data.achievements.map((ach: string, idx: number) => (
                    <p key={idx} className="text-gray-400 ml-2">• {ach}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedNode.type === 'future' && (
            <div className="space-y-2 text-sm">
              <Badge className="bg-amber-100 text-amber-800">Future Goal</Badge>
              <p className="text-gray-300 italic">
                Career aspiration to work towards
              </p>
            </div>
          )}
        </Card>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <span className="text-xs text-gray-400">Past Experience</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-400">Current Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-xs text-gray-400">Future Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400">Education</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-xs text-gray-400">Skills</span>
        </div>
      </div>
    </div>
  );
}