import { sql } from '@vercel/postgres';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

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
    
    // Skills updates
    skills: z.array(z.object({
      name: z.string(),
      category: z.string()
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
      
      const systemPrompt = `You are an AI assistant that analyzes coaching conversations to determine if the user's professional repository should be updated.

Current Repository State:
${JSON.stringify(context.currentRepos, null, 2)}

Guidelines:
1. Only update when user explicitly mentions new goals, achievements, or aspirations
2. Personal repo is for OKRs, future career goals, and coaching notes
3. Surface Private is for concrete achievements with metrics
4. Deep repo Trinity should rarely change - only with major life shifts
5. Be conservative - only update when clearly needed
6. Extract specific, actionable information

Examples of when to update:
- "I want to become a VP of Engineering in 2 years" → Add to futureExperiences
- "My goal is to increase team velocity by 30%" → Add to OKRs
- "I just completed a project that saved $2M" → Add to achievements
- "I'm working on improving my Python skills" → Add to skills

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
      return { success: false, error: error.message };
    }
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

    // Surface repo updates (skills)
    if (layer === 'surface' && updates.skills) {
      const existingSkills = currentData.skills || [];
      const newSkills = updates.skills.filter((skill: any) => 
        !existingSkills.some((existing: any) => 
          (typeof existing === 'string' ? existing : existing.name) === skill.name
        )
      );
      merged.skills = [...existingSkills, ...newSkills];
    }

    return merged;
  }
}

export const repoUpdateAgent = new RepoUpdateAgent();