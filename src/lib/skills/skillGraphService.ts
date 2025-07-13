/**
 * Neo4j Skill Graph Service
 * Stores skills and their AI-discovered relationships in Neo4j
 */

import { Driver } from 'neo4j-driver';
import { getDriver } from '@/lib/neo4j/client';
import { skillIntelligence } from '@/lib/ai/skillIntelligence';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for AI relationship discovery
const skillRelationshipSchema = z.object({
  relationships: z.array(z.object({
    skill1: z.string(),
    skill2: z.string(),
    relationshipType: z.enum(['prerequisite', 'complementary', 'related', 'advanced', 'alternative']),
    strength: z.number().min(0).max(1),
    reason: z.string()
  })),
  semanticGroups: z.array(z.object({
    groupName: z.string(),
    skills: z.array(z.string()),
    description: z.string()
  }))
});

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  proficiency?: string;
  userId: string;
  addedAt: string;
  normalizedName: string;
}

export interface SkillRelationshipEdge {
  type: string;
  strength: number;
  reason?: string;
  discoveredBy: 'ai' | 'predefined' | 'user';
}

export class SkillGraphService {
  private driver: Driver;

  constructor() {
    this.driver = getDriver();
  }

  /**
   * Add a skill to the user's Neo4j skill graph
   */
  async addSkillToGraph(userId: string, skill: {
    name: string;
    category: string;
    proficiency?: string;
  }): Promise<void> {
    const session = this.driver.session();
    
    try {
      const normalizedName = skillIntelligence.normalizeSkill(skill.name);
      
      // Create or update the skill node
      await session.run(`
        MERGE (s:Skill {name: $name, userId: $userId})
        SET s.category = $category,
            s.proficiency = $proficiency,
            s.addedAt = datetime(),
            s.normalizedName = $normalizedName,
            s.lastUpdated = datetime()
        RETURN s
      `, {
        name: skill.name,
        userId,
        category: skill.category,
        proficiency: skill.proficiency || 'intermediate',
        normalizedName
      });

      console.log(`✅ Added skill "${skill.name}" to Neo4j for user ${userId}`);

      // After adding the skill, discover relationships with existing skills
      await this.discoverSkillRelationships(userId, skill.name);

    } catch (error) {
      console.error('Error adding skill to graph:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Use AI to discover semantic relationships between skills
   */
  async discoverSkillRelationships(userId: string, newSkillName: string): Promise<void> {
    const session = this.driver.session();
    
    try {
      // Get all user's skills
      const result = await session.run(`
        MATCH (s:Skill {userId: $userId})
        RETURN s.name as name, s.category as category
      `, { userId });

      const userSkills = result.records.map(record => ({
        name: record.get('name'),
        category: record.get('category')
      }));

      if (userSkills.length < 2) {
        console.log('Not enough skills to discover relationships');
        return;
      }

      // Use AI to discover relationships
      const relationships = await this.analyzeSkillRelationships(userSkills, newSkillName);
      
      if (relationships) {
        // Create relationship edges in Neo4j
        for (const rel of relationships.relationships) {
          await this.createSkillRelationship(userId, rel.skill1, rel.skill2, {
            type: rel.relationshipType,
            strength: rel.strength,
            reason: rel.reason,
            discoveredBy: 'ai'
          });
        }

        console.log(`✅ Discovered ${relationships.relationships.length} AI relationships for ${newSkillName}`);
      }

    } catch (error) {
      console.error('Error discovering skill relationships:', error);
    } finally {
      await session.close();
    }
  }

  /**
   * Use GPT-4 to analyze semantic relationships between skills
   */
  private async analyzeSkillRelationships(
    skills: Array<{name: string, category: string}>, 
    focusSkill: string
  ) {
    try {
      const systemPrompt = `You are an AI expert in professional skill analysis. Analyze the relationships between skills to find meaningful connections.

Focus on the new skill: "${focusSkill}"

Skills to analyze: ${skills.map(s => s.name).join(', ')}

Find relationships like:
- Prerequisites: Skills needed before learning another (e.g., JavaScript → React)
- Complementary: Skills that work well together (e.g., Marketing → Analytics)
- Related: Skills in similar domains (e.g., Growth Marketing → Digital Marketing)
- Advanced: More sophisticated versions (e.g., CSS → Sass)
- Alternative: Different approaches to similar outcomes (e.g., React → Vue)

Be especially smart about semantic relationships:
- "Growth" relates to "Marketing", "Sales", "Analytics"
- "Leadership" connects to "Management", "Communication", "Strategy"
- "AI" connects to "Machine Learning", "Python", "Data Science"

Only suggest relationships with strength > 0.6 that make professional sense.`;

      const result = await generateObject({
        model: openai('gpt-4'),
        schema: skillRelationshipSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Analyze relationships for skills: ${JSON.stringify(skills)}\nFocus on new skill: ${focusSkill}`
          }
        ]
      });

      return result.object;
    } catch (error) {
      console.error('AI relationship analysis error:', error);
      return null;
    }
  }

  /**
   * Create a relationship edge between two skills
   */
  private async createSkillRelationship(
    userId: string,
    skill1: string,
    skill2: string,
    relationship: SkillRelationshipEdge
  ): Promise<void> {
    const session = this.driver.session();
    
    try {
      await session.run(`
        MATCH (s1:Skill {name: $skill1, userId: $userId})
        MATCH (s2:Skill {name: $skill2, userId: $userId})
        MERGE (s1)-[r:RELATES_TO]->(s2)
        SET r.type = $type,
            r.strength = $strength,
            r.reason = $reason,
            r.discoveredBy = $discoveredBy,
            r.createdAt = datetime()
      `, {
        skill1,
        skill2,
        userId,
        type: relationship.type,
        strength: relationship.strength,
        reason: relationship.reason,
        discoveredBy: relationship.discoveredBy
      });

    } catch (error) {
      console.error('Error creating skill relationship:', error);
    } finally {
      await session.close();
    }
  }

  /**
   * Get user's skill graph with relationships
   */
  async getUserSkillGraph(userId: string): Promise<{
    nodes: SkillNode[];
    edges: Array<{
      source: string;
      target: string;
      relationship: SkillRelationshipEdge;
    }>;
  }> {
    const session = this.driver.session();
    
    try {
      // Get nodes (skills)
      const nodesResult = await session.run(`
        MATCH (s:Skill {userId: $userId})
        RETURN s.name as name,
               s.category as category,
               s.proficiency as proficiency,
               s.addedAt as addedAt,
               s.normalizedName as normalizedName
      `, { userId });

      const nodes: SkillNode[] = nodesResult.records.map(record => ({
        id: record.get('name'),
        name: record.get('name'),
        category: record.get('category'),
        proficiency: record.get('proficiency'),
        userId,
        addedAt: record.get('addedAt'),
        normalizedName: record.get('normalizedName')
      }));

      // Get edges (relationships)
      const edgesResult = await session.run(`
        MATCH (s1:Skill {userId: $userId})-[r:RELATES_TO]->(s2:Skill {userId: $userId})
        RETURN s1.name as source,
               s2.name as target,
               r.type as type,
               r.strength as strength,
               r.reason as reason,
               r.discoveredBy as discoveredBy
      `, { userId });

      const edges = edgesResult.records.map(record => ({
        source: record.get('source'),
        target: record.get('target'),
        relationship: {
          type: record.get('type'),
          strength: record.get('strength'),
          reason: record.get('reason'),
          discoveredBy: record.get('discoveredBy')
        }
      }));

      return { nodes, edges };

    } catch (error) {
      console.error('Error getting user skill graph:', error);
      return { nodes: [], edges: [] };
    } finally {
      await session.close();
    }
  }

  /**
   * Get related skills for a specific skill using AI analysis
   */
  async getRelatedSkills(userId: string, skillName: string): Promise<{
    directRelations: string[];
    semanticRelations: string[];
    suggestedSkills: Array<{name: string, reason: string, strength: number}>;
  }> {
    const session = this.driver.session();
    
    try {
      // Get direct relationships from graph
      const directResult = await session.run(`
        MATCH (s1:Skill {name: $skillName, userId: $userId})-[r:RELATES_TO]-(s2:Skill {userId: $userId})
        RETURN s2.name as relatedSkill, r.strength as strength, r.reason as reason
        ORDER BY r.strength DESC
      `, { userId, skillName });

      const directRelations = directResult.records.map(r => r.get('relatedSkill'));

      // Use AI to suggest additional related skills
      const allSkillsResult = await session.run(`
        MATCH (s:Skill {userId: $userId})
        RETURN s.name as name, s.category as category
      `, { userId });

      const userSkills = allSkillsResult.records.map(r => ({
        name: r.get('name'),
        category: r.get('category')
      }));

      // AI analysis for semantic relationships
      const semanticAnalysis = await this.analyzeSkillRelationships(userSkills, skillName);
      const semanticRelations = semanticAnalysis?.relationships
        .filter(r => r.skill1 === skillName || r.skill2 === skillName)
        .map(r => r.skill1 === skillName ? r.skill2 : r.skill1) || [];

      // Suggest new skills based on current skill
      const suggestedSkills = await this.suggestRelatedSkills(skillName, userSkills.map(s => s.name));

      return {
        directRelations,
        semanticRelations,
        suggestedSkills
      };

    } catch (error) {
      console.error('Error getting related skills:', error);
      return { directRelations: [], semanticRelations: [], suggestedSkills: [] };
    } finally {
      await session.close();
    }
  }

  /**
   * Use AI to suggest skills related to a given skill
   */
  private async suggestRelatedSkills(
    skillName: string, 
    userSkills: string[]
  ): Promise<Array<{name: string, reason: string, strength: number}>> {
    try {
      const prompt = `Given that someone has the skill "${skillName}", what are the top 5 most related skills they should consider learning?

Current skills: ${userSkills.join(', ')}

Suggest skills that:
1. Complement "${skillName}" professionally
2. Are commonly learned together with "${skillName}"
3. Would enhance career prospects for someone with "${skillName}"
4. Are not already in their skill list

For each suggestion, explain why it's related and rate relevance 0-1.`;

      const result = await generateObject({
        model: openai('gpt-4'),
        schema: z.object({
          suggestions: z.array(z.object({
            skillName: z.string(),
            reason: z.string(),
            relevance: z.number().min(0).max(1)
          }))
        }),
        messages: [{ role: 'user', content: prompt }]
      });

      return result.object.suggestions.map(s => ({
        name: s.skillName,
        reason: s.reason,
        strength: s.relevance
      }));

    } catch (error) {
      console.error('Error suggesting related skills:', error);
      return [];
    }
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}

export const skillGraphService = new SkillGraphService();