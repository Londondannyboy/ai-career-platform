/**
 * Career Path AI Recommendations Engine
 * Analyzes current profile and suggests next career moves
 */

import { Skill } from '../skills/skillTypes';
import { Experience } from '../experience/experienceTypes';
import { Education } from '../education/educationTypes';
import { skillRelationshipAnalyzer } from '../skills/skillRelationships';
import { getExperienceLevel } from '../experience/experienceTypes';

export interface CareerProfile {
  currentRole?: Experience;
  experiences: Experience[];
  futureExperiences?: Experience[];
  skills: Skill[];
  education: Education[];
  okrs?: any[];
  trinity?: {
    quest?: string;
    service?: string;
    pledge?: string;
  };
}

export interface CareerRecommendation {
  id: string;
  type: 'next-role' | 'skill-gap' | 'lateral-move' | 'leadership' | 'specialization';
  title: string;
  description: string;
  targetRole?: string;
  requiredSkills: string[];
  timeframe: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  confidence: number; // 0-1
  rationale: string[];
  actionItems: string[];
}

export interface CareerPathAnalysis {
  currentLevel: string;
  yearsOfExperience: number;
  primaryDomain: string;
  careerVelocity: 'slow' | 'steady' | 'fast' | 'exceptional';
  recommendations: CareerRecommendation[];
  strengthAreas: string[];
  growthAreas: string[];
}

// Common career progressions
const CAREER_PROGRESSIONS = {
  engineering: {
    'Junior Engineer': ['Engineer', 'Senior Engineer'],
    'Engineer': ['Senior Engineer', 'Tech Lead'],
    'Senior Engineer': ['Staff Engineer', 'Engineering Manager', 'Tech Lead'],
    'Staff Engineer': ['Principal Engineer', 'Engineering Manager'],
    'Principal Engineer': ['Distinguished Engineer', 'Director of Engineering'],
    'Engineering Manager': ['Senior Engineering Manager', 'Director of Engineering'],
    'Director of Engineering': ['VP Engineering', 'CTO']
  },
  product: {
    'Associate Product Manager': ['Product Manager'],
    'Product Manager': ['Senior Product Manager'],
    'Senior Product Manager': ['Principal Product Manager', 'Group Product Manager'],
    'Group Product Manager': ['Director of Product'],
    'Director of Product': ['VP Product', 'CPO']
  },
  design: {
    'Junior Designer': ['Designer', 'UX Designer', 'UI Designer'],
    'Designer': ['Senior Designer'],
    'Senior Designer': ['Lead Designer', 'Design Manager'],
    'Lead Designer': ['Principal Designer', 'Design Manager'],
    'Design Manager': ['Director of Design'],
    'Director of Design': ['VP Design', 'Head of Design']
  },
  data: {
    'Data Analyst': ['Senior Data Analyst', 'Data Scientist'],
    'Data Scientist': ['Senior Data Scientist', 'Machine Learning Engineer'],
    'Senior Data Scientist': ['Staff Data Scientist', 'Data Science Manager'],
    'Machine Learning Engineer': ['Senior ML Engineer', 'ML Architect'],
    'Data Science Manager': ['Director of Data Science'],
    'Director of Data Science': ['VP Data', 'Chief Data Officer']
  }
};

// Skills typically required for transitions
const TRANSITION_SKILLS = {
  'to-management': ['Leadership', 'Team Management', 'Communication', 'Project Management', 'Mentoring'],
  'to-senior': ['System Design', 'Architecture', 'Mentoring', 'Code Review'],
  'to-staff': ['Technical Strategy', 'Cross-team Collaboration', 'Architecture', 'Innovation'],
  'to-principal': ['Industry Impact', 'Technical Vision', 'Thought Leadership', 'Patents'],
  'to-director': ['Strategic Planning', 'Budget Management', 'Hiring', 'Executive Communication']
};

export class CareerPathRecommendationEngine {
  /**
   * Analyze career profile and generate recommendations
   */
  analyzeCareerPath(profile: CareerProfile): CareerPathAnalysis {
    const currentLevel = this.getCurrentLevel(profile);
    const yearsOfExperience = this.calculateYearsOfExperience(profile);
    const primaryDomain = this.identifyPrimaryDomain(profile);
    const careerVelocity = this.calculateCareerVelocity(profile);
    
    const recommendations = this.generateRecommendations(profile, {
      currentLevel,
      yearsOfExperience,
      primaryDomain,
      careerVelocity
    });
    
    const { strengthAreas, growthAreas } = this.identifyStrengthsAndGrowth(profile);
    
    return {
      currentLevel,
      yearsOfExperience,
      primaryDomain,
      careerVelocity,
      recommendations,
      strengthAreas,
      growthAreas
    };
  }
  
  private getCurrentLevel(profile: CareerProfile): string {
    if (!profile.currentRole) {
      return 'Entry Level';
    }
    return getExperienceLevel(profile.currentRole.title);
  }
  
  private calculateYearsOfExperience(profile: CareerProfile): number {
    if (profile.experiences.length === 0) return 0;
    
    const sortedExperiences = [...profile.experiences].sort((a, b) => {
      const dateA = new Date(a.startDate || '9999');
      const dateB = new Date(b.startDate || '9999');
      return dateA.getTime() - dateB.getTime();
    });
    
    const firstExp = sortedExperiences[0];
    if (!firstExp.startDate) return 0;
    
    const startDate = new Date(firstExp.startDate);
    const years = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(years);
  }
  
  private identifyPrimaryDomain(profile: CareerProfile): string {
    // Analyze skills and experiences to determine primary domain
    const { clusters } = skillRelationshipAnalyzer.analyzeSkillClusters(profile.skills);
    
    if (clusters.length > 0) {
      // Return the cluster with highest coverage
      return clusters[0].cluster.name;
    }
    
    // Fallback to analyzing job titles
    const titles = profile.experiences.map(exp => exp.title.toLowerCase());
    if (titles.some(t => t.includes('engineer') || t.includes('developer'))) {
      return 'Engineering';
    }
    if (titles.some(t => t.includes('product'))) {
      return 'Product Management';
    }
    if (titles.some(t => t.includes('design'))) {
      return 'Design';
    }
    if (titles.some(t => t.includes('data') || t.includes('analyst'))) {
      return 'Data & Analytics';
    }
    
    return 'General';
  }
  
  private calculateCareerVelocity(profile: CareerProfile): 'slow' | 'steady' | 'fast' | 'exceptional' {
    const years = this.calculateYearsOfExperience(profile);
    const level = this.getCurrentLevel(profile);
    const promotions = this.countPromotions(profile);
    
    if (years === 0) return 'steady';
    
    const promotionsPerYear = promotions / years;
    
    // Consider level relative to years
    if (level === 'Senior' && years < 3) return 'fast';
    if (level === 'Staff+' && years < 5) return 'exceptional';
    if (level === 'Management' && years < 5) return 'fast';
    if (level === 'Executive' && years < 10) return 'exceptional';
    
    // Consider promotion rate
    if (promotionsPerYear > 0.5) return 'exceptional';
    if (promotionsPerYear > 0.3) return 'fast';
    if (promotionsPerYear > 0.15) return 'steady';
    
    return 'slow';
  }
  
  private countPromotions(profile: CareerProfile): number {
    let promotions = 0;
    const sortedExperiences = [...profile.experiences].sort((a, b) => {
      const dateA = new Date(a.startDate || '9999');
      const dateB = new Date(b.startDate || '9999');
      return dateA.getTime() - dateB.getTime();
    });
    
    for (let i = 1; i < sortedExperiences.length; i++) {
      const prevLevel = getExperienceLevel(sortedExperiences[i - 1].title);
      const currLevel = getExperienceLevel(sortedExperiences[i].title);
      
      // Check if it's a promotion (level increase)
      const levels = ['Entry Level', 'Mid Level', 'Senior', 'Staff+', 'Management', 'Executive', 'C-Level'];
      if (levels.indexOf(currLevel) > levels.indexOf(prevLevel)) {
        promotions++;
      }
    }
    
    return promotions;
  }
  
  private generateRecommendations(
    profile: CareerProfile,
    analysis: {
      currentLevel: string;
      yearsOfExperience: number;
      primaryDomain: string;
      careerVelocity: string;
    }
  ): CareerRecommendation[] {
    const recommendations: CareerRecommendation[] = [];
    
    // 1. Next role progression
    const nextRoles = this.getNextRoles(profile, analysis);
    nextRoles.forEach(role => {
      recommendations.push(this.createNextRoleRecommendation(profile, role, analysis));
    });
    
    // 2. Skill gap recommendations
    const skillGaps = this.identifySkillGaps(profile, nextRoles);
    if (skillGaps.length > 0) {
      recommendations.push(this.createSkillGapRecommendation(skillGaps, analysis));
    }
    
    // 3. Lateral move opportunities
    if (analysis.yearsOfExperience > 3) {
      const lateralMoves = this.identifyLateralMoves(profile, analysis);
      lateralMoves.forEach(move => {
        recommendations.push(move);
      });
    }
    
    // 4. Leadership transition if applicable
    if (analysis.currentLevel === 'Senior' || analysis.currentLevel === 'Staff+') {
      const leadershipRec = this.createLeadershipRecommendation(profile, analysis);
      if (leadershipRec) recommendations.push(leadershipRec);
    }
    
    // 5. Specialization opportunities
    const specializations = this.identifySpecializations(profile, analysis);
    specializations.forEach(spec => {
      recommendations.push(spec);
    });
    
    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  private getNextRoles(profile: CareerProfile, analysis: any): string[] {
    const currentTitle = profile.currentRole?.title || '';
    const domain = this.getDomainKey(analysis.primaryDomain);
    
    const progressions = CAREER_PROGRESSIONS[domain as keyof typeof CAREER_PROGRESSIONS];
    if (!progressions) return [];
    
    // Find matching progression
    for (const [role, nextRoles] of Object.entries(progressions)) {
      if (currentTitle.toLowerCase().includes(role.toLowerCase())) {
        return nextRoles;
      }
    }
    
    // Check future experiences for alignment
    if (profile.futureExperiences && profile.futureExperiences.length > 0) {
      return profile.futureExperiences.map(exp => exp.title);
    }
    
    return [];
  }
  
  private getDomainKey(domain: string): string {
    if (domain.includes('Engineering')) return 'engineering';
    if (domain.includes('Product')) return 'product';
    if (domain.includes('Design')) return 'design';
    if (domain.includes('Data')) return 'data';
    return 'engineering'; // default
  }
  
  private createNextRoleRecommendation(
    profile: CareerProfile,
    targetRole: string,
    analysis: any
  ): CareerRecommendation {
    const requiredSkills = this.getRequiredSkillsForRole(targetRole, profile);
    const currentSkills = profile.skills.map(s => s.name);
    const missingSkills = requiredSkills.filter(skill => !currentSkills.includes(skill));
    
    const confidence = this.calculateConfidence(profile, targetRole, missingSkills);
    const timeframe = this.estimateTimeframe(analysis.currentLevel, targetRole, analysis.careerVelocity);
    
    return {
      id: `next-role-${targetRole.replace(/\s+/g, '-').toLowerCase()}`,
      type: 'next-role',
      title: `Progress to ${targetRole}`,
      description: `Based on your current trajectory, ${targetRole} is a natural next step in your career progression.`,
      targetRole,
      requiredSkills,
      timeframe,
      difficulty: missingSkills.length > 3 ? 'challenging' : missingSkills.length > 1 ? 'moderate' : 'easy',
      confidence,
      rationale: [
        `Natural progression from ${profile.currentRole?.title || 'current role'}`,
        `Aligns with your ${analysis.primaryDomain} expertise`,
        analysis.careerVelocity === 'fast' || analysis.careerVelocity === 'exceptional' 
          ? 'Your career velocity suggests readiness for advancement' 
          : 'Consistent with industry progression timelines'
      ],
      actionItems: [
        ...missingSkills.map(skill => `Develop ${skill} skills`),
        'Seek stretch projects in current role',
        'Network with professionals in target role',
        'Update resume to highlight relevant achievements'
      ]
    };
  }
  
  private createSkillGapRecommendation(
    skillGaps: string[],
    analysis: any
  ): CareerRecommendation {
    return {
      id: 'skill-gap-primary',
      type: 'skill-gap',
      title: 'Critical Skill Development',
      description: 'Focus on these skills to accelerate your career progression',
      requiredSkills: skillGaps.slice(0, 5),
      timeframe: '3-6 months',
      difficulty: 'moderate',
      confidence: 0.9,
      rationale: [
        'These skills are prerequisites for your target roles',
        'High demand in the current job market',
        'Complement your existing skill set'
      ],
      actionItems: [
        'Enroll in courses or certifications',
        'Apply skills in side projects',
        'Seek mentorship from experts',
        'Practice through real-world applications'
      ]
    };
  }
  
  private createLeadershipRecommendation(
    profile: CareerProfile,
    analysis: any
  ): CareerRecommendation | null {
    const hasLeadershipSkills = profile.skills.some(s => 
      ['Leadership', 'Team Management', 'Mentoring'].includes(s.name)
    );
    
    if (hasLeadershipSkills && profile.currentRole?.directReports && profile.currentRole.directReports > 0) {
      return null; // Already in leadership
    }
    
    return {
      id: 'leadership-transition',
      type: 'leadership',
      title: 'Transition to Engineering Management',
      description: 'Consider moving into people management to multiply your impact',
      requiredSkills: TRANSITION_SKILLS['to-management'],
      timeframe: '6-12 months',
      difficulty: 'challenging',
      confidence: 0.7,
      rationale: [
        'Your technical expertise provides strong foundation',
        'Management path offers different growth opportunities',
        'Can leverage your experience to mentor others'
      ],
      actionItems: [
        'Lead a small team on a project',
        'Mentor junior team members',
        'Study management best practices',
        'Shadow current managers',
        'Practice giving feedback and performance reviews'
      ]
    };
  }
  
  private identifyLateralMoves(
    profile: CareerProfile,
    analysis: any
  ): CareerRecommendation[] {
    const moves: CareerRecommendation[] = [];
    
    // Example: Engineer to Product Manager
    if (analysis.primaryDomain === 'Engineering' && profile.skills.some(s => s.name.includes('Product'))) {
      moves.push({
        id: 'lateral-to-product',
        type: 'lateral-move',
        title: 'Transition to Product Management',
        description: 'Leverage your technical background in a product role',
        requiredSkills: ['Product Management', 'User Research', 'Data Analysis', 'Stakeholder Management'],
        timeframe: '3-6 months',
        difficulty: 'moderate',
        confidence: 0.6,
        rationale: [
          'Technical background is valuable for product roles',
          'Can bridge gap between engineering and business',
          'Opens new career growth paths'
        ],
        actionItems: [
          'Take product management courses',
          'Work closely with current PMs',
          'Lead feature specifications',
          'Conduct user interviews'
        ]
      });
    }
    
    return moves;
  }
  
  private identifySpecializations(
    profile: CareerProfile,
    analysis: any
  ): CareerRecommendation[] {
    const specializations: CareerRecommendation[] = [];
    const { clusters } = skillRelationshipAnalyzer.analyzeSkillClusters(profile.skills);
    
    // Find emerging skill clusters
    clusters.forEach(({ cluster, coverage }) => {
      if (coverage > 0.3 && coverage < 0.7) {
        specializations.push({
          id: `specialize-${cluster.id}`,
          type: 'specialization',
          title: `Specialize in ${cluster.name}`,
          description: `Deepen your expertise in ${cluster.name} to become a subject matter expert`,
          requiredSkills: cluster.coreSkills.filter(skill => 
            !profile.skills.some(s => s.name === skill)
          ),
          timeframe: '6-12 months',
          difficulty: 'moderate',
          confidence: 0.75,
          rationale: [
            `You have ${Math.round(coverage * 100)}% foundation in this area`,
            'Growing demand for specialists in this field',
            'Complements your existing expertise'
          ],
          actionItems: [
            'Complete advanced certifications',
            'Contribute to open source projects',
            'Write technical articles',
            'Speak at conferences'
          ]
        });
      }
    });
    
    return specializations;
  }
  
  private identifyStrengthsAndGrowth(profile: CareerProfile): {
    strengthAreas: string[];
    growthAreas: string[];
  } {
    const strengthAreas: string[] = [];
    const growthAreas: string[] = [];
    
    // Analyze skill proficiency
    const expertSkills = profile.skills.filter(s => s.proficiency === 'expert');
    const beginnerSkills = profile.skills.filter(s => s.proficiency === 'beginner');
    
    if (expertSkills.length > 0) {
      strengthAreas.push(`Deep expertise in ${expertSkills.slice(0, 3).map(s => s.name).join(', ')}`);
    }
    
    // Analyze experience impact
    const impactfulExperiences = profile.experiences.filter(exp => 
      exp.impact && exp.impact.length > 0
    );
    if (impactfulExperiences.length > 0) {
      strengthAreas.push('Proven track record of measurable impact');
    }
    
    // Analyze team leadership
    const leadershipExp = profile.experiences.find(exp => 
      exp.teamSize && exp.teamSize > 5
    );
    if (leadershipExp) {
      strengthAreas.push(`Team leadership (${leadershipExp.teamSize} members)`);
    }
    
    // Growth areas
    if (beginnerSkills.length > 3) {
      growthAreas.push('Focus on deepening core skills');
    }
    
    const { suggestions } = skillRelationshipAnalyzer.analyzeSkillClusters(profile.skills);
    if (suggestions.length > 0) {
      growthAreas.push(`Develop ${suggestions[0].skill} for career advancement`);
    }
    
    if (!profile.experiences.some(exp => exp.impact && exp.impact.length > 0)) {
      growthAreas.push('Quantify and document your impact');
    }
    
    return { strengthAreas, growthAreas };
  }
  
  private getRequiredSkillsForRole(role: string, profile: CareerProfile): string[] {
    const skills: string[] = [];
    
    // Add role-specific skills
    if (role.includes('Senior')) {
      skills.push(...TRANSITION_SKILLS['to-senior']);
    }
    if (role.includes('Staff') || role.includes('Principal')) {
      skills.push(...TRANSITION_SKILLS['to-staff']);
    }
    if (role.includes('Manager') || role.includes('Director')) {
      skills.push(...TRANSITION_SKILLS['to-management']);
    }
    
    // Add domain-specific skills based on current skills
    const { clusters } = skillRelationshipAnalyzer.analyzeSkillClusters(profile.skills);
    if (clusters.length > 0) {
      const primaryCluster = clusters[0].cluster;
      skills.push(...primaryCluster.coreSkills.slice(0, 3));
    }
    
    return [...new Set(skills)]; // Remove duplicates
  }
  
  private calculateConfidence(
    profile: CareerProfile,
    targetRole: string,
    missingSkills: string[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on career velocity
    const velocity = this.calculateCareerVelocity(profile);
    if (velocity === 'exceptional') confidence += 0.2;
    else if (velocity === 'fast') confidence += 0.15;
    else if (velocity === 'steady') confidence += 0.1;
    
    // Decrease confidence based on missing skills
    confidence -= missingSkills.length * 0.05;
    
    // Increase confidence if aligned with future experiences
    if (profile.futureExperiences?.some(exp => exp.title === targetRole)) {
      confidence += 0.15;
    }
    
    // Increase confidence based on relevant experience
    if (profile.experiences.length > 3) confidence += 0.1;
    
    return Math.max(0.2, Math.min(0.95, confidence));
  }
  
  private estimateTimeframe(
    currentLevel: string,
    targetRole: string,
    velocity: string
  ): string {
    const targetLevel = getExperienceLevel(targetRole);
    const levels = ['Entry Level', 'Mid Level', 'Senior', 'Staff+', 'Management', 'Executive', 'C-Level'];
    
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(targetLevel);
    const levelDiff = targetIndex - currentIndex;
    
    if (levelDiff <= 0) return '6-12 months'; // Same level or lower
    
    let baseMonths = levelDiff * 24; // 2 years per level typically
    
    // Adjust based on velocity
    if (velocity === 'exceptional') baseMonths *= 0.5;
    else if (velocity === 'fast') baseMonths *= 0.7;
    else if (velocity === 'slow') baseMonths *= 1.5;
    
    if (baseMonths <= 12) return '6-12 months';
    if (baseMonths <= 24) return '1-2 years';
    if (baseMonths <= 36) return '2-3 years';
    return '3-5 years';
  }
  
  private identifySkillGaps(profile: CareerProfile, targetRoles: string[]): string[] {
    const allRequiredSkills = new Set<string>();
    
    targetRoles.forEach(role => {
      const required = this.getRequiredSkillsForRole(role, profile);
      required.forEach(skill => allRequiredSkills.add(skill));
    });
    
    const currentSkills = new Set(profile.skills.map(s => s.name));
    const gaps = Array.from(allRequiredSkills).filter(skill => !currentSkills.has(skill));
    
    return gaps;
  }
}

export const careerPathEngine = new CareerPathRecommendationEngine();