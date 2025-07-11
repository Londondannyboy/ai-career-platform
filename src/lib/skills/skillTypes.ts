/**
 * Enhanced Skill Data Types
 * Tracks proficiency, progression, and validation
 */

export interface Skill {
  id?: string;
  name: string;
  category: string;
  
  // Proficiency tracking
  proficiency: SkillProficiency;
  yearsOfExperience?: number;
  
  // Temporal data
  firstUsed?: string; // YYYY-MM
  lastUsed?: string; // YYYY-MM
  activelyUsing: boolean;
  
  // Validation & endorsements
  endorsements?: Endorsement[];
  certifications?: Certification[];
  
  // Experience linkage
  experienceIds?: string[]; // Which experiences used this skill
  projectIds?: string[]; // Which projects demonstrate this skill
  
  // Custom vs normalized
  isCustom?: boolean;
  normalizedFrom?: string; // Original input if normalized
}

export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Endorsement {
  endorserId: string;
  endorserName: string;
  endorserTitle?: string;
  date: string;
  message?: string;
  relationship?: 'colleague' | 'manager' | 'report' | 'client' | 'other';
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface SkillProgression {
  skillId: string;
  date: string;
  proficiency: SkillProficiency;
  milestone?: string; // "Completed first React project"
  evidence?: string; // Link or description
}

// Skill categories with suggested proficiency milestones
export const SKILL_PROFICIENCY_MILESTONES = {
  'beginner': {
    description: 'Learning fundamentals',
    typicalDuration: '0-6 months',
    indicators: [
      'Following tutorials',
      'Basic understanding',
      'Needs guidance',
      'Simple tasks only'
    ]
  },
  'intermediate': {
    description: 'Building independently',
    typicalDuration: '6 months - 2 years',
    indicators: [
      'Works independently',
      'Solves common problems',
      'Understands best practices',
      'Can teach basics'
    ]
  },
  'advanced': {
    description: 'Deep expertise',
    typicalDuration: '2-5 years',
    indicators: [
      'Solves complex problems',
      'Mentors others',
      'Contributes to community',
      'Optimizes performance'
    ]
  },
  'expert': {
    description: 'Industry leader',
    typicalDuration: '5+ years',
    indicators: [
      'Thought leader',
      'Speaks at conferences',
      'Creates frameworks',
      'Shapes industry standards'
    ]
  }
};

// Common skill categories
export const SKILL_CATEGORIES = {
  'technical': 'Technical Skills',
  'programming': 'Programming Languages',
  'frameworks': 'Frameworks & Libraries',
  'tools': 'Tools & Platforms',
  'soft': 'Soft Skills',
  'leadership': 'Leadership',
  'business': 'Business Skills',
  'creative': 'Creative Skills',
  'languages': 'Languages',
  'certifications': 'Certifications'
};

// Helper functions
export function calculateSkillStrength(skill: Skill): number {
  let strength = 0;
  
  // Base on proficiency
  const proficiencyScores = {
    'beginner': 25,
    'intermediate': 50,
    'advanced': 75,
    'expert': 100
  };
  strength = proficiencyScores[skill.proficiency];
  
  // Boost for recent usage
  if (skill.lastUsed) {
    const lastUsedDate = new Date(skill.lastUsed);
    const monthsSinceUse = (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceUse < 6) strength += 10;
    else if (monthsSinceUse < 12) strength += 5;
    else if (monthsSinceUse > 24) strength -= 10;
  }
  
  // Boost for endorsements
  if (skill.endorsements && skill.endorsements.length > 0) {
    strength += Math.min(skill.endorsements.length * 2, 15);
  }
  
  // Boost for certifications
  if (skill.certifications && skill.certifications.length > 0) {
    strength += 10;
  }
  
  return Math.max(0, Math.min(100, strength));
}

export function suggestNextProficiency(current: SkillProficiency): SkillProficiency | null {
  const progression: Record<SkillProficiency, SkillProficiency | null> = {
    'beginner': 'intermediate',
    'intermediate': 'advanced',
    'advanced': 'expert',
    'expert': null
  };
  return progression[current];
}

export function getSkillAge(skill: Skill): number | null {
  if (!skill.firstUsed) return null;
  
  const firstUsedDate = new Date(skill.firstUsed);
  const years = (Date.now() - firstUsedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
}