/**
 * Skill Relationship Mapping System
 * AI-powered clustering and relationship detection for skills
 */

import { Skill } from './skillTypes';

export interface SkillRelationship {
  skill1: string;
  skill2: string;
  relationship: 'prerequisite' | 'complementary' | 'alternative' | 'advanced';
  strength: number; // 0-1, how strongly related
  reason?: string;
}

export interface SkillCluster {
  id: string;
  name: string;
  description: string;
  coreSkills: string[];
  peripheralSkills: string[];
  color: string; // For visualization
}

// Predefined skill relationships based on industry knowledge
export const SKILL_RELATIONSHIPS: SkillRelationship[] = [
  // JavaScript Ecosystem
  { skill1: 'JavaScript', skill2: 'TypeScript', relationship: 'advanced', strength: 0.9 },
  { skill1: 'JavaScript', skill2: 'React', relationship: 'prerequisite', strength: 1.0 },
  { skill1: 'JavaScript', skill2: 'Vue.js', relationship: 'prerequisite', strength: 1.0 },
  { skill1: 'JavaScript', skill2: 'Node.js', relationship: 'prerequisite', strength: 1.0 },
  { skill1: 'React', skill2: 'Next.js', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'React', skill2: 'Redux', relationship: 'complementary', strength: 0.8 },
  { skill1: 'React', skill2: 'React Native', relationship: 'complementary', strength: 0.7 },
  { skill1: 'Vue.js', skill2: 'Nuxt.js', relationship: 'complementary', strength: 0.8 },
  { skill1: 'React', skill2: 'Vue.js', relationship: 'alternative', strength: 0.6 },
  { skill1: 'React', skill2: 'Angular', relationship: 'alternative', strength: 0.6 },
  
  // Backend & Databases
  { skill1: 'Node.js', skill2: 'Express.js', relationship: 'complementary', strength: 0.9 },
  { skill1: 'Python', skill2: 'Django', relationship: 'complementary', strength: 0.9 },
  { skill1: 'Python', skill2: 'FastAPI', relationship: 'complementary', strength: 0.8 },
  { skill1: 'SQL', skill2: 'PostgreSQL', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'SQL', skill2: 'MySQL', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'PostgreSQL', skill2: 'MySQL', relationship: 'alternative', strength: 0.7 },
  { skill1: 'MongoDB', skill2: 'PostgreSQL', relationship: 'alternative', strength: 0.5 },
  
  // DevOps & Cloud
  { skill1: 'Docker', skill2: 'Kubernetes', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'Linux', skill2: 'Docker', relationship: 'prerequisite', strength: 0.7 },
  { skill1: 'AWS', skill2: 'Terraform', relationship: 'complementary', strength: 0.8 },
  { skill1: 'AWS', skill2: 'Google Cloud Platform', relationship: 'alternative', strength: 0.7 },
  { skill1: 'AWS', skill2: 'Microsoft Azure', relationship: 'alternative', strength: 0.7 },
  
  // AI/ML
  { skill1: 'Python', skill2: 'Machine Learning', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'Python', skill2: 'TensorFlow', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'Python', skill2: 'PyTorch', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'Machine Learning', skill2: 'Deep Learning', relationship: 'prerequisite', strength: 0.9 },
  { skill1: 'TensorFlow', skill2: 'PyTorch', relationship: 'alternative', strength: 0.7 },
  { skill1: 'Statistics', skill2: 'Machine Learning', relationship: 'prerequisite', strength: 0.8 },
  
  // Design
  { skill1: 'UI Design', skill2: 'UX Design', relationship: 'complementary', strength: 0.9 },
  { skill1: 'Figma', skill2: 'Sketch', relationship: 'alternative', strength: 0.8 },
  { skill1: 'CSS', skill2: 'Tailwind CSS', relationship: 'advanced', strength: 0.8 },
  { skill1: 'CSS', skill2: 'Sass', relationship: 'advanced', strength: 0.7 },
  
  // Soft Skills & Leadership
  { skill1: 'Leadership', skill2: 'Team Management', relationship: 'complementary', strength: 0.9 },
  { skill1: 'Communication', skill2: 'Leadership', relationship: 'complementary', strength: 0.8 },
  { skill1: 'Project Management', skill2: 'Agile', relationship: 'complementary', strength: 0.8 },
  { skill1: 'Agile', skill2: 'Scrum', relationship: 'advanced', strength: 0.9 }
];

// Skill clusters for grouping related skills
export const SKILL_CLUSTERS: SkillCluster[] = [
  {
    id: 'frontend',
    name: 'Frontend Development',
    description: 'Client-side web development technologies',
    coreSkills: ['JavaScript', 'React', 'Vue.js', 'Angular', 'HTML', 'CSS'],
    peripheralSkills: ['TypeScript', 'Next.js', 'Webpack', 'Sass', 'Tailwind CSS'],
    color: '#3B82F6'
  },
  {
    id: 'backend',
    name: 'Backend Development',
    description: 'Server-side technologies and APIs',
    coreSkills: ['Node.js', 'Python', 'Java', 'Go', 'Ruby'],
    peripheralSkills: ['Express.js', 'Django', 'Spring', 'FastAPI', 'Rails'],
    color: '#10B981'
  },
  {
    id: 'database',
    name: 'Database & Data',
    description: 'Data storage and management',
    coreSkills: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
    peripheralSkills: ['Elasticsearch', 'DynamoDB', 'Cassandra', 'GraphQL'],
    color: '#8B5CF6'
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    description: 'Infrastructure and deployment',
    coreSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
    peripheralSkills: ['Terraform', 'Jenkins', 'GitLab CI', 'Ansible', 'Prometheus'],
    color: '#F59E0B'
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Artificial intelligence and data science',
    coreSkills: ['Machine Learning', 'Deep Learning', 'Python', 'Statistics'],
    peripheralSkills: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision'],
    color: '#EF4444'
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    description: 'Native and cross-platform mobile apps',
    coreSkills: ['React Native', 'Swift', 'Kotlin', 'Flutter'],
    peripheralSkills: ['iOS', 'Android', 'Expo', 'Mobile UI'],
    color: '#06B6D4'
  },
  {
    id: 'leadership',
    name: 'Leadership & Management',
    description: 'People and project management skills',
    coreSkills: ['Leadership', 'Team Management', 'Project Management', 'Communication'],
    peripheralSkills: ['Agile', 'Scrum', 'Mentoring', 'Strategy', 'Hiring'],
    color: '#EC4899'
  }
];

export class SkillRelationshipAnalyzer {
  private relationshipMap: Map<string, SkillRelationship[]>;
  
  constructor() {
    this.relationshipMap = new Map();
    this.buildRelationshipMap();
  }
  
  private buildRelationshipMap() {
    // Build bidirectional map for quick lookups
    SKILL_RELATIONSHIPS.forEach(rel => {
      // Add forward relationship
      if (!this.relationshipMap.has(rel.skill1)) {
        this.relationshipMap.set(rel.skill1, []);
      }
      this.relationshipMap.get(rel.skill1)!.push(rel);
      
      // Add reverse relationship for some types
      if (rel.relationship === 'complementary' || rel.relationship === 'alternative') {
        if (!this.relationshipMap.has(rel.skill2)) {
          this.relationshipMap.set(rel.skill2, []);
        }
        this.relationshipMap.get(rel.skill2)!.push({
          skill1: rel.skill2,
          skill2: rel.skill1,
          relationship: rel.relationship,
          strength: rel.strength
        });
      }
    });
  }
  
  /**
   * Get all related skills for a given skill
   */
  getRelatedSkills(skillName: string): SkillRelationship[] {
    const normalized = this.normalizeSkillName(skillName);
    return this.relationshipMap.get(normalized) || [];
  }
  
  /**
   * Get prerequisites for a skill
   */
  getPrerequisites(skillName: string): string[] {
    const relationships = this.getRelatedSkills(skillName);
    return relationships
      .filter(rel => rel.relationship === 'prerequisite' && rel.skill1 !== skillName)
      .map(rel => rel.skill2);
  }
  
  /**
   * Get complementary skills
   */
  getComplementarySkills(skillName: string): string[] {
    const relationships = this.getRelatedSkills(skillName);
    return relationships
      .filter(rel => rel.relationship === 'complementary')
      .map(rel => rel.skill1 === skillName ? rel.skill2 : rel.skill1);
  }
  
  /**
   * Get skill cluster for a given skill
   */
  getSkillCluster(skillName: string): SkillCluster | null {
    const normalized = this.normalizeSkillName(skillName);
    
    return SKILL_CLUSTERS.find(cluster => 
      cluster.coreSkills.includes(normalized) || 
      cluster.peripheralSkills.includes(normalized)
    ) || null;
  }
  
  /**
   * Analyze a user's skill set and find clusters
   */
  analyzeSkillClusters(userSkills: Skill[]): {
    clusters: { cluster: SkillCluster; skills: Skill[]; coverage: number }[];
    suggestions: { skill: string; reason: string; cluster: string }[];
  } {
    const skillNames = userSkills.map(s => this.normalizeSkillName(s.name));
    const clusterAnalysis: { cluster: SkillCluster; skills: Skill[]; coverage: number }[] = [];
    const suggestions: { skill: string; reason: string; cluster: string }[] = [];
    
    // Analyze each cluster
    SKILL_CLUSTERS.forEach(cluster => {
      const userSkillsInCluster = userSkills.filter(skill => 
        cluster.coreSkills.includes(this.normalizeSkillName(skill.name)) ||
        cluster.peripheralSkills.includes(this.normalizeSkillName(skill.name))
      );
      
      if (userSkillsInCluster.length > 0) {
        const totalSkills = cluster.coreSkills.length + cluster.peripheralSkills.length;
        const coverage = userSkillsInCluster.length / totalSkills;
        
        clusterAnalysis.push({
          cluster,
          skills: userSkillsInCluster,
          coverage
        });
        
        // Suggest missing core skills
        cluster.coreSkills.forEach(coreSkill => {
          if (!skillNames.includes(coreSkill) && coverage > 0.3) {
            suggestions.push({
              skill: coreSkill,
              reason: `Core skill for ${cluster.name} cluster (${Math.round(coverage * 100)}% coverage)`,
              cluster: cluster.id
            });
          }
        });
      }
    });
    
    // Sort clusters by coverage
    clusterAnalysis.sort((a, b) => b.coverage - a.coverage);
    
    return { clusters: clusterAnalysis, suggestions };
  }
  
  /**
   * Find learning path between current skills and target skill
   */
  findLearningPath(currentSkills: string[], targetSkill: string): string[] {
    const target = this.normalizeSkillName(targetSkill);
    const current = currentSkills.map(s => this.normalizeSkillName(s));
    
    // If user already has the skill, no path needed
    if (current.includes(target)) return [];
    
    // Find prerequisites for target
    const prerequisites = this.getPrerequisitesRecursive(target);
    
    // Filter out skills user already has
    const missingPrereqs = prerequisites.filter(skill => !current.includes(skill));
    
    // Order by dependency (basic skills first)
    return this.orderByDependency(missingPrereqs);
  }
  
  private getPrerequisitesRecursive(skill: string, visited = new Set<string>()): string[] {
    if (visited.has(skill)) return [];
    visited.add(skill);
    
    const directPrereqs = this.getPrerequisites(skill);
    const allPrereqs = [...directPrereqs];
    
    directPrereqs.forEach(prereq => {
      const subPrereqs = this.getPrerequisitesRecursive(prereq, visited);
      subPrereqs.forEach(sub => {
        if (!allPrereqs.includes(sub)) {
          allPrereqs.push(sub);
        }
      });
    });
    
    return allPrereqs;
  }
  
  private orderByDependency(skills: string[]): string[] {
    const ordered: string[] = [];
    const remaining = [...skills];
    
    while (remaining.length > 0) {
      // Find skills with no prerequisites in the remaining list
      const nextSkills = remaining.filter(skill => {
        const prereqs = this.getPrerequisites(skill);
        return prereqs.every(p => !remaining.includes(p) || ordered.includes(p));
      });
      
      if (nextSkills.length === 0) {
        // Circular dependency or no valid order, just add remaining
        ordered.push(...remaining);
        break;
      }
      
      nextSkills.forEach(skill => {
        ordered.push(skill);
        remaining.splice(remaining.indexOf(skill), 1);
      });
    }
    
    return ordered;
  }
  
  private normalizeSkillName(skill: string): string {
    // Simple normalization - could use skillNormalizer here
    return skill.trim();
  }
}

export const skillRelationshipAnalyzer = new SkillRelationshipAnalyzer();