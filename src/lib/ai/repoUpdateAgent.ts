import { sql } from '@vercel/postgres';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Skill, SkillProficiency } from '../skills/skillTypes';
import { Experience } from '../experience/experienceTypes';
import { Education } from '../education/educationTypes';
import { skillNormalizer } from '../skills/skillNormalization';

// Schema for repository updates
const repoUpdateSchema = z.object({
  shouldUpdate: z.boolean(),
  layer: z.enum(['surface', 'surfacePrivate', 'personal', 'deep']),
  updates: z.object({
    // Personal Repo updates (most common during coaching)
    okrs: z.array(z.object({
      objective: z.string(),
      keyResults: z.array(z.string()),
      progress: z.number().min(0).max(100)
    })).optional(),
    
    futureExperiences: z.array(z.object({
      title: z.string(),
      company: z.string(),
      timeframe: z.string().optional(),
      description: z.string().optional(),
      type: z.literal('future')
    })).optional(),
    
    goals: z.array(z.object({
      description: z.string(),
      targetDate: z.string().optional(),
      category: z.enum(['career', 'skill', 'personal', 'financial']).optional()
    })).optional(),
    
    // Surface Private updates (achievements)
    achievements: z.array(z.object({
      title: z.string(),
      description: z.string(),
      metrics: z.array(z.string())
    })).optional(),
    
    // Deep Repo updates (Trinity refinements)
    trinity: z.object({
      quest: z.string().optional(),
      service: z.string().optional(),
      pledge: z.string().optional()
    }).optional(),
    
    // Skills updates with proficiency
    skills: z.array(z.object({
      name: z.string(),
      category: z.string(),
      proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
      yearsOfExperience: z.number().optional()
    })).optional(),
    
    // Experience updates with rich data
    experiences: z.array(z.object({
      title: z.string(),
      company: z.string(),
      impact: z.array(z.object({
        description: z.string(),
        metric: z.string()
      })).optional()
    })).optional()
  }),
  reason: z.string()
});

interface ConversationContext {
  userId: string;
  messages: Array<{ role: string; content: string }>;
  currentRepos: {
    surface?: any;
    surfacePrivate?: any;
    personal?: any;
    deep?: any;
  };
}

export class RepoUpdateAgent {
  /**
   * Analyzes conversation and determines if repository updates are needed
   */
  async analyzeConversation(context: ConversationContext) {
    try {
      // Get last few messages for context
      const recentMessages = context.messages.slice(-6);
      const conversation = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
      
      // Build rich context summary
      const profileSummary = this.buildProfileSummary(context.currentRepos);
      
      const systemPrompt = `You are an AI assistant that analyzes coaching conversations to determine if the user's professional repository should be updated.

Current User Profile:
${profileSummary}

Guidelines:
1. Only update when user explicitly mentions new goals, achievements, or aspirations
2. Personal repo is for OKRs, future career goals, and coaching notes
3. Surface Private is for concrete achievements with metrics
4. Deep repo Trinity should rarely change - only with major life shifts
5. Be conservative - only update when clearly needed
6. Extract specific, actionable information
7. For skills, assess proficiency based on context:
   - Beginner: Just learning, following tutorials
   - Intermediate: Can work independently, 6mo-2yrs experience
   - Advanced: Deep expertise, mentors others, 2-5yrs
   - Expert: Industry leader, 5+ years

Examples of when to update:
- "I want to become a VP of Engineering in 2 years" → Add to futureExperiences
- "My goal is to increase team velocity by 30%" → Add to OKRs
- "I just completed a project that saved $2M" → Add to achievements with impact metrics
- "I'm working on improving my Python skills" → Update skill proficiency
- "I've been leading a team of 12 engineers" → Update experience with team size

Do NOT update for:
- Casual conversation
- Questions about existing data
- Hypothetical scenarios
- Vague aspirations without specifics`;

      const result = await generateObject({
        model: openai('gpt-4'),
        schema: repoUpdateSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this conversation and determine if any repository updates are needed:\n\n${conversation}` }
        ]
      });

      return result.object;
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return null;
    }
  }

  /**
   * Applies approved updates to the user's repository
   */
  async applyUpdates(userId: string, layer: string, updates: any) {
    try {
      // Fetch current data
      const columnMap: Record<string, string> = {
        surface: 'surface_repo_data',
        surfacePrivate: 'surface_private_repo_data',
        personal: 'personal_repo_data',
        deep: 'deep_repo_data'
      };

      const column = columnMap[layer];
      if (!column) throw new Error(`Invalid layer: ${layer}`);

      // Get current data - use dynamic column selection
      let query;
      if (column === 'surface_repo_data') {
        query = sql`SELECT surface_repo_data as data FROM user_profiles WHERE user_id = ${userId}`;
      } else if (column === 'surface_private_repo_data') {
        query = sql`SELECT surface_private_repo_data as data FROM user_profiles WHERE user_id = ${userId}`;
      } else if (column === 'personal_repo_data') {
        query = sql`SELECT personal_repo_data as data FROM user_profiles WHERE user_id = ${userId}`;
      } else if (column === 'deep_repo_data') {
        query = sql`SELECT deep_repo_data as data FROM user_profiles WHERE user_id = ${userId}`;
      } else {
        throw new Error(`Invalid column: ${column}`);
      }
      
      const { rows } = await query;

      const currentData = rows[0]?.data || {};

      // Merge updates intelligently
      const mergedData = this.mergeUpdates(currentData, updates, layer);

      // Update database - use dynamic column update
      if (column === 'surface_repo_data') {
        await sql`
          UPDATE user_profiles
          SET surface_repo_data = ${JSON.stringify(mergedData)}::jsonb,
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
      } else if (column === 'surface_private_repo_data') {
        await sql`
          UPDATE user_profiles
          SET surface_private_repo_data = ${JSON.stringify(mergedData)}::jsonb,
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
      } else if (column === 'personal_repo_data') {
        await sql`
          UPDATE user_profiles
          SET personal_repo_data = ${JSON.stringify(mergedData)}::jsonb,
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
      } else if (column === 'deep_repo_data') {
        await sql`
          UPDATE user_profiles
          SET deep_repo_data = ${JSON.stringify(mergedData)}::jsonb,
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
      }

      return { success: true, updatedData: mergedData };
    } catch (error) {
      console.error('Error applying updates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Builds a rich summary of the user's profile for context
   */
  private buildProfileSummary(repos: any): string {
    const summary: string[] = [];
    
    // Surface Repo Summary
    if (repos.surface) {
      const surface = repos.surface;
      summary.push('=== Professional Profile ===');
      
      if (surface.professional_headline) {
        summary.push(`Current Role: ${surface.professional_headline}`);
      }
      
      // Current experience
      if (surface.experiences && surface.experiences.length > 0) {
        const current = surface.experiences.find((exp: any) => exp.current);
        if (current) {
          summary.push(`Current Position: ${current.title} at ${current.company}`);
          if (current.teamSize) {
            summary.push(`Team Size: ${current.teamSize}`);
          }
          if (current.impact && current.impact.length > 0) {
            summary.push('Recent Impact:');
            current.impact.forEach((impact: any) => {
              summary.push(`  - ${impact.description}: ${impact.metric}`);
            });
          }
        }
      }
      
      // Skills with proficiency
      if (surface.skills && surface.skills.length > 0) {
        summary.push('\nTop Skills:');
        surface.skills.slice(0, 5).forEach((skill: any) => {
          if (typeof skill === 'object' && skill.proficiency) {
            summary.push(`  - ${skill.name} (${skill.proficiency})`);
          } else if (typeof skill === 'object') {
            summary.push(`  - ${skill.name}`);
          } else {
            summary.push(`  - ${skill}`);
          }
        });
      }
      
      // Education
      if (surface.education && surface.education.length > 0) {
        summary.push('\nEducation:');
        surface.education.forEach((edu: any) => {
          if (typeof edu === 'object') {
            summary.push(`  - ${edu.degree} in ${edu.field} from ${edu.institution}`);
          } else {
            summary.push(`  - ${edu}`);
          }
        });
      }
    }
    
    // Personal Repo Summary
    if (repos.personal) {
      const personal = repos.personal;
      summary.push('\n=== Personal Goals & OKRs ===');
      
      if (personal.futureExperiences && personal.futureExperiences.length > 0) {
        summary.push('Future Career Aspirations:');
        personal.futureExperiences.forEach((exp: any) => {
          summary.push(`  - ${exp.title} at ${exp.company || 'target company'}`);
        });
      }
      
      if (personal.okrs && personal.okrs.length > 0) {
        summary.push('\nActive OKRs:');
        personal.okrs.forEach((okr: any) => {
          summary.push(`  - ${okr.objective} (${okr.progress}% complete)`);
        });
      }
    }
    
    // Deep Repo Summary
    if (repos.deep && repos.deep.trinity) {
      const trinity = repos.deep.trinity;
      summary.push('\n=== Trinity (Core Identity) ===');
      if (trinity.quest) summary.push(`Quest: ${trinity.quest}`);
      if (trinity.service) summary.push(`Service: ${trinity.service}`);
      if (trinity.pledge) summary.push(`Pledge: ${trinity.pledge}`);
    }
    
    return summary.join('\n');
  }

  /**
   * Intelligently merges updates with existing data
   */
  private mergeUpdates(currentData: any, updates: any, layer: string): any {
    const merged = { ...currentData };

    // Personal repo updates
    if (layer === 'personal') {
      if (updates.okrs) {
        merged.okrs = [...(currentData.okrs || []), ...updates.okrs];
      }
      if (updates.futureExperiences) {
        merged.futureExperiences = [...(currentData.futureExperiences || []), ...updates.futureExperiences];
      }
      if (updates.goals) {
        merged.goals = [...(currentData.goals || []), ...updates.goals];
      }
    }

    // Surface private updates
    if (layer === 'surfacePrivate') {
      if (updates.achievements) {
        merged.achievements = [...(currentData.achievements || []), ...updates.achievements];
      }
    }

    // Deep repo updates (Trinity)
    if (layer === 'deep' && updates.trinity) {
      merged.trinity = {
        ...currentData.trinity,
        ...updates.trinity,
        lastUpdated: new Date().toISOString()
      };
    }

    // Surface repo updates (skills with proficiency)
    if (layer === 'surface' && updates.skills) {
      const existingSkills = currentData.skills || [];
      
      updates.skills.forEach((newSkill: any) => {
        const existingIndex = existingSkills.findIndex((existing: any) => {
          const existingName = typeof existing === 'string' ? existing : existing.name;
          return skillNormalizer.areEqual(existingName, newSkill.name);
        });
        
        if (existingIndex >= 0) {
          // Update existing skill with new proficiency
          const existing = existingSkills[existingIndex];
          if (typeof existing === 'object') {
            existingSkills[existingIndex] = {
              ...existing,
              ...newSkill,
              name: skillNormalizer.normalize(newSkill.name)
            };
          } else {
            // Convert string to object
            existingSkills[existingIndex] = {
              name: skillNormalizer.normalize(newSkill.name),
              category: skillNormalizer.getCategory(newSkill.name),
              proficiency: newSkill.proficiency || 'intermediate',
              activelyUsing: true,
              ...newSkill
            };
          }
        } else {
          // Add new skill
          const enrichedSkill: Skill = {
            id: `skill-${Date.now()}-${Math.random()}`,
            name: skillNormalizer.normalize(newSkill.name),
            category: newSkill.category || skillNormalizer.getCategory(newSkill.name),
            proficiency: newSkill.proficiency || 'beginner',
            activelyUsing: true,
            isCustom: !skillNormalizer.isKnownSkill(newSkill.name),
            ...newSkill
          };
          existingSkills.push(enrichedSkill);
        }
      });
      
      merged.skills = existingSkills;
    }
    
    // Surface repo updates (experiences)
    if (layer === 'surface' && updates.experiences) {
      merged.experiences = [...(currentData.experiences || []), ...updates.experiences];
    }

    return merged;
  }
}

export const repoUpdateAgent = new RepoUpdateAgent();