import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for skill analysis
const skillAnalysisSchema = z.object({
  existingSkills: z.array(z.object({
    name: z.string(),
    category: z.string(),
    proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    normalized: z.string() // Normalized version (lowercase, trimmed)
  })),
  
  suggestedSkills: z.array(z.object({
    name: z.string(),
    category: z.string(),
    reason: z.string(),
    relevance: z.enum(['high', 'medium', 'low']),
    learningPath: z.array(z.string()).optional()
  })),
  
  skillGaps: z.array(z.object({
    category: z.string(),
    missingSkills: z.array(z.string()),
    importance: z.enum(['critical', 'important', 'nice-to-have']),
    relatedToGoals: z.boolean()
  })),
  
  skillClusters: z.array(z.object({
    clusterName: z.string(),
    skills: z.array(z.string()),
    strength: z.enum(['strong', 'developing', 'weak'])
  })),
  
  careerPathAlignment: z.object({
    currentRole: z.string(),
    suggestedNextRole: z.string(),
    readinessScore: z.number().min(0).max(100),
    keySkillsNeeded: z.array(z.string())
  })
});

// Common skill categories
export const SKILL_CATEGORIES = {
  'Technical': ['Programming', 'Databases', 'Cloud', 'DevOps', 'Security'],
  'Leadership': ['Team Management', 'Strategy', 'Communication', 'Mentoring'],
  'Business': ['Product Management', 'Finance', 'Marketing', 'Sales'],
  'Design': ['UI/UX', 'Graphics', 'Product Design', 'User Research'],
  'Data': ['Analytics', 'ML/AI', 'Statistics', 'Visualization']
};

// Skill normalization map
const SKILL_NORMALIZATION_MAP: Record<string, string> = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'python': 'Python',
  'ml': 'Machine Learning',
  'ai': 'Artificial Intelligence',
  'aws': 'AWS',
  'gcp': 'Google Cloud Platform',
  'docker': 'Docker',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'sql': 'SQL',
  'nosql': 'NoSQL',
  'mongodb': 'MongoDB',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL'
};

export class SkillIntelligence {
  /**
   * Normalizes a skill name to prevent duplicates
   */
  normalizeSkill(skill: string): string {
    const normalized = skill.trim().toLowerCase();
    return SKILL_NORMALIZATION_MAP[normalized] || 
           skill.trim().split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
  }

  /**
   * Analyzes user's skills and provides intelligent suggestions
   */
  async analyzeSkills(context: {
    currentSkills: (string | { name: string; category?: string })[];
    experiences: any[];
    futureGoals: any[];
    currentRole?: string;
  }) {
    try {
      // Normalize current skills
      const normalizedSkills = context.currentSkills.map(skill => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        return this.normalizeSkill(skillName);
      });

      // Remove duplicates
      const uniqueSkills = [...new Set(normalizedSkills)];

      const systemPrompt = `You are a career development AI that analyzes professional skills and provides intelligent recommendations.

Analyze the user's profile and provide:
1. Normalized list of their existing skills with categories
2. Suggested new skills based on their experience and goals
3. Skill gaps for their career progression
4. Skill clusters showing their strengths
5. Career path alignment and readiness

Consider:
- Industry trends and in-demand skills
- Natural skill progressions (e.g., React → Next.js → Full-stack)
- Skills needed for their future goals
- Complementary skills that enhance their profile

Be specific and actionable in your recommendations.`;

      const result = await generateObject({
        model: openai('gpt-4'),
        schema: skillAnalysisSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: JSON.stringify({
              currentSkills: uniqueSkills,
              experiences: context.experiences,
              futureGoals: context.futureGoals,
              currentRole: context.currentRole
            })
          }
        ]
      });

      return result.object;
    } catch (error) {
      console.error('Skill analysis error:', error);
      return null;
    }
  }

  /**
   * Suggests skills based on a job description or role
   */
  async suggestSkillsForRole(role: string, currentSkills: string[]) {
    const normalized = currentSkills.map(s => this.normalizeSkill(s));
    
    const prompt = `For someone targeting a ${role} position, what are the top 10 most important skills?
Current skills: ${normalized.join(', ')}

Return skills they should learn next, ordered by importance.`;

    try {
      const result = await generateObject({
        model: openai('gpt-4'),
        schema: z.object({
          requiredSkills: z.array(z.object({
            name: z.string(),
            importance: z.enum(['essential', 'important', 'nice-to-have']),
            alreadyHas: z.boolean()
          }))
        }),
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      return result.object.requiredSkills;
    } catch (error) {
      console.error('Role skill suggestion error:', error);
      return [];
    }
  }

  /**
   * Groups skills into meaningful categories
   */
  categorizeSkills(skills: string[]): Record<string, string[]> {
    const categorized: Record<string, string[]> = {};
    
    skills.forEach(skill => {
      const normalized = this.normalizeSkill(skill);
      let category = 'Other';
      
      // Simple categorization logic - could be enhanced with AI
      if (/typescript|javascript|react|vue|angular|next|node/i.test(normalized)) {
        category = 'Frontend/Backend';
      } else if (/python|java|c\+\+|golang|rust/i.test(normalized)) {
        category = 'Programming Languages';
      } else if (/aws|azure|gcp|cloud|docker|kubernetes/i.test(normalized)) {
        category = 'Cloud & DevOps';
      } else if (/sql|mongodb|postgres|database/i.test(normalized)) {
        category = 'Databases';
      } else if (/machine learning|ai|data science|analytics/i.test(normalized)) {
        category = 'Data & AI';
      } else if (/leadership|management|strategy|communication/i.test(normalized)) {
        category = 'Leadership';
      }
      
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(normalized);
    });
    
    return categorized;
  }
}

export const skillIntelligence = new SkillIntelligence();