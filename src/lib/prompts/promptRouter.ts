/**
 * Vectorized Prompt Management System
 * Enables intelligent prompt selection, blending, and semantic search
 * for the multi-agent coaching platform
 */

import { openai } from '@ai-sdk/openai'
import { embed, generateText } from 'ai'
import { sql } from '@/lib/db'

export interface PromptDefinition {
  id: string
  type: 'base' | 'specialized' | 'company' | 'relationship'
  context_tags: string[]
  name: string
  content: string
  variables?: Record<string, string>
  embedding?: number[]
  metadata?: {
    author?: string
    created_at?: string
    effectiveness_score?: number
    usage_count?: number
  }
}

export interface PromptSearchQuery {
  query: string
  context?: {
    coachType?: string
    companyName?: string
    relationshipType?: string
    userGoals?: string[]
    conversationTopic?: string
  }
  limit?: number
  threshold?: number
}

export interface BlendedPrompt {
  content: string
  sources: Array<{
    promptId: string
    weight: number
    relevance: number
  }>
  variables: Record<string, string>
}

export class VectorizedPromptRouter {
  private prompts: Map<string, PromptDefinition> = new Map()
  private embeddings: Map<string, number[]> = new Map()
  private initialized: boolean = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize the prompt system with base prompts
   */
  private async initialize() {
    try {
      // Load prompts from database
      await this.loadPromptsFromDatabase()
      
      // Initialize base prompts if database is empty
      if (this.prompts.size === 0) {
        await this.initializeBasePrompts()
      }
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize prompt router:', error)
    }
  }

  /**
   * Load prompts from database
   */
  private async loadPromptsFromDatabase() {
    try {
      const { rows } = await sql`
        SELECT * FROM coaching_prompts
        WHERE active = true
        ORDER BY effectiveness_score DESC
      `
      
      for (const row of rows) {
        const prompt: PromptDefinition = {
          id: row.id,
          type: row.prompt_type,
          context_tags: row.context_tags || [],
          name: row.name,
          content: row.content,
          variables: row.variables || {},
          embedding: row.embedding,
          metadata: {
            author: row.author,
            created_at: row.created_at,
            effectiveness_score: row.effectiveness_score,
            usage_count: row.usage_count
          }
        }
        
        this.prompts.set(prompt.id, prompt)
        if (prompt.embedding) {
          this.embeddings.set(prompt.id, prompt.embedding)
        }
      }
    } catch (error) {
      console.log('No existing prompts in database, will initialize defaults')
    }
  }

  /**
   * Initialize base coaching prompts
   */
  private async initializeBasePrompts() {
    const basePrompts: Omit<PromptDefinition, 'id'>[] = [
      // Base Coaching Prompts
      {
        type: 'base',
        context_tags: ['career', 'general', 'coaching'],
        name: 'Career Development Base',
        content: `You are {{coachName}}, an experienced career coach helping {{userName}} with their professional development.
        
        Core principles:
        - Be empathetic and supportive while providing actionable advice
        - Focus on {{userGoals}} as the primary objective
        - Adapt your communication style to match the user's needs
        - Keep responses conversational and under {{maxWords}} words for voice delivery
        
        Current context: {{conversationContext}}`,
        variables: {
          coachName: 'Alex',
          userName: 'the user',
          userGoals: 'career advancement',
          maxWords: '150',
          conversationContext: 'general career discussion'
        }
      },
      
      // Specialized Coaching Prompts
      {
        type: 'specialized',
        context_tags: ['marketing', 'strategy', 'campaigns'],
        name: 'Marketing Strategy Specialist',
        content: `As a marketing strategy expert, you bring deep expertise in:
        - Campaign development and optimization
        - Brand positioning and messaging
        - Customer acquisition and retention
        - Data-driven marketing decisions
        
        Focus area: {{marketingFocus}}
        Industry context: {{industryContext}}
        
        Provide insights that are both creative and analytically grounded.`,
        variables: {
          marketingFocus: 'general marketing strategy',
          industryContext: 'cross-industry'
        }
      },
      
      {
        type: 'specialized',
        context_tags: ['engineering', 'technical', 'architecture'],
        name: 'Technical Leadership Coach',
        content: `You specialize in technical leadership and software engineering excellence:
        - System architecture and design patterns
        - Code quality and technical debt management
        - Team scaling and engineering culture
        - Technology selection and migration strategies
        
        Technical domain: {{techDomain}}
        Team size context: {{teamSize}}
        
        Balance technical depth with practical leadership advice.`,
        variables: {
          techDomain: 'full-stack development',
          teamSize: 'small to medium teams'
        }
      },
      
      // Relationship-Aware Prompts
      {
        type: 'relationship',
        context_tags: ['upward', 'management', 'influence'],
        name: 'Upward Management Coach',
        content: `You're coaching someone on managing upward effectively. Key considerations:
        - Respect hierarchical dynamics while building influence
        - Frame suggestions in terms of organizational value
        - Emphasize mutual benefit and strategic alignment
        - Navigate political sensitivities with diplomacy
        
        Relationship dynamic: {{relationshipContext}}
        Organizational context: {{orgContext}}
        
        Help them influence upward while maintaining professional boundaries.`,
        variables: {
          relationshipContext: 'individual contributor to manager',
          orgContext: 'corporate environment'
        }
      },
      
      {
        type: 'relationship',
        context_tags: ['peer', 'collaboration', 'lateral'],
        name: 'Peer Collaboration Coach',
        content: `Focus on building effective peer relationships and cross-functional collaboration:
        - Foster mutual respect and shared ownership
        - Navigate competing priorities diplomatically
        - Build influence without formal authority
        - Create win-win scenarios for all parties
        
        Collaboration context: {{collabContext}}
        Team dynamics: {{teamDynamics}}
        
        Emphasize partnership and collective success.`,
        variables: {
          collabContext: 'cross-functional project',
          teamDynamics: 'collaborative environment'
        }
      },
      
      // Company-Specific Prompts
      {
        type: 'company',
        context_tags: ['ckdelta', 'startup', 'ai'],
        name: 'CK Delta Company Coach',
        content: `You're the specialized coach for CK Delta team members. You understand:
        - CK Delta's mission and values
        - The fast-paced startup environment
        - AI/ML industry dynamics
        - The importance of rapid iteration and customer feedback
        
        CK Delta context: {{ckdeltaContext}}
        Role focus: {{roleFocus}}
        
        Align all advice with CK Delta's culture of innovation and customer obsession.`,
        variables: {
          ckdeltaContext: 'AI startup scaling phase',
          roleFocus: 'individual contributor'
        }
      }
    ]

    // Create prompts with embeddings
    for (const promptDef of basePrompts) {
      const id = this.generatePromptId(promptDef.name)
      const prompt: PromptDefinition = { ...promptDef, id }
      
      // Generate embedding for the prompt
      const embedding = await this.generateEmbedding(
        `${prompt.name} ${prompt.content} ${prompt.context_tags.join(' ')}`
      )
      
      prompt.embedding = embedding
      this.prompts.set(id, prompt)
      this.embeddings.set(id, embedding)
      
      // Save to database
      await this.savePromptToDatabase(prompt)
    }
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
      })
      
      return embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      return []
    }
  }

  /**
   * Save prompt to database
   */
  private async savePromptToDatabase(prompt: PromptDefinition) {
    try {
      await sql`
        INSERT INTO coaching_prompts (
          id, prompt_type, context_tags, name, content, 
          variables, embedding, author, effectiveness_score, usage_count
        ) VALUES (
          ${prompt.id}, 
          ${prompt.type}, 
          ${prompt.context_tags}, 
          ${prompt.name}, 
          ${prompt.content},
          ${JSON.stringify(prompt.variables || {})}, 
          ${prompt.embedding || null},
          ${prompt.metadata?.author || 'system'}, 
          ${prompt.metadata?.effectiveness_score || 0.8}, 
          ${prompt.metadata?.usage_count || 0}
        )
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          variables = EXCLUDED.variables,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `
    } catch (error) {
      console.error('Failed to save prompt to database:', error)
    }
  }

  /**
   * Search for prompts using semantic search
   */
  async searchPrompts(query: PromptSearchQuery): Promise<PromptDefinition[]> {
    const queryEmbedding = await this.generateEmbedding(
      `${query.query} ${JSON.stringify(query.context || {})}`
    )
    
    const results: Array<{ prompt: PromptDefinition; similarity: number }> = []
    
    for (const [promptId, promptEmbedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, promptEmbedding)
      
      if (similarity >= (query.threshold || 0.7)) {
        const prompt = this.prompts.get(promptId)
        if (prompt) {
          // Boost score based on context match
          let contextBoost = 1.0
          if (query.context) {
            if (query.context.coachType && prompt.context_tags.includes(query.context.coachType)) {
              contextBoost += 0.2
            }
            if (query.context.companyName && prompt.context_tags.includes(query.context.companyName.toLowerCase())) {
              contextBoost += 0.3
            }
            if (query.context.relationshipType && prompt.context_tags.includes(query.context.relationshipType)) {
              contextBoost += 0.2
            }
          }
          
          results.push({
            prompt,
            similarity: similarity * contextBoost
          })
        }
      }
    }
    
    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, query.limit || 5)
      .map(r => r.prompt)
  }

  /**
   * Blend multiple prompts based on weights and context
   */
  async blendPrompts(
    promptIds: string[],
    weights: number[],
    context: Record<string, string>
  ): Promise<BlendedPrompt> {
    if (promptIds.length !== weights.length) {
      throw new Error('Prompt IDs and weights must have same length')
    }
    
    const prompts = promptIds.map(id => this.prompts.get(id)).filter(Boolean) as PromptDefinition[]
    
    if (prompts.length === 0) {
      throw new Error('No valid prompts found')
    }
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const normalizedWeights = weights.map(w => w / totalWeight)
    
    // Generate blending prompt for AI
    const blendingPrompt = `
    Blend these coaching prompts into a single, coherent prompt that combines their strengths:
    
    ${prompts.map((prompt, i) => `
    Prompt ${i + 1} (${Math.round(normalizedWeights[i] * 100)}% weight):
    ${prompt.content}
    `).join('\n\n')}
    
    Context for blending:
    ${JSON.stringify(context, null, 2)}
    
    Create a unified prompt that:
    1. Maintains the key elements from each source prompt weighted by importance
    2. Creates smooth transitions between different coaching styles
    3. Preserves all variable placeholders ({{variableName}})
    4. Results in a natural, coherent coaching personality
    
    Return only the blended prompt content.
    `
    
    const { text: blendedContent } = await generateText({
      model: openai('gpt-4'),
      prompt: blendingPrompt,
      temperature: 0.3
    })
    
    // Collect all variables from source prompts
    const allVariables: Record<string, string> = {}
    prompts.forEach(prompt => {
      Object.assign(allVariables, prompt.variables || {})
    })
    
    // Override with context values
    Object.assign(allVariables, context)
    
    return {
      content: blendedContent,
      sources: prompts.map((prompt, i) => ({
        promptId: prompt.id,
        weight: normalizedWeights[i],
        relevance: 1.0 // TODO: Calculate actual relevance
      })),
      variables: allVariables
    }
  }

  /**
   * Get optimal prompts for a coaching session
   */
  async getOptimalPrompts(
    coachType: string,
    context: {
      userId?: string
      companyName?: string
      relationshipType?: string
      conversationHistory?: string[]
      userGoals?: string[]
    }
  ): Promise<BlendedPrompt> {
    // Search for relevant prompts
    const searchResults = await this.searchPrompts({
      query: `${coachType} coaching ${context.userGoals?.join(' ') || ''}`,
      context: {
        coachType,
        companyName: context.companyName,
        relationshipType: context.relationshipType,
        userGoals: context.userGoals,
        conversationTopic: context.conversationHistory?.slice(-1)[0]
      },
      limit: 5,
      threshold: 0.6
    })
    
    if (searchResults.length === 0) {
      // Fallback to base prompt
      const basePrompt = Array.from(this.prompts.values()).find(p => 
        p.type === 'base' && p.context_tags.includes('coaching')
      )
      
      if (!basePrompt) {
        throw new Error('No suitable prompts found')
      }
      
      return {
        content: basePrompt.content,
        sources: [{ promptId: basePrompt.id, weight: 1.0, relevance: 1.0 }],
        variables: { ...basePrompt.variables, ...context }
      }
    }
    
    // Calculate weights based on relevance and prompt type
    const weights = searchResults.map((prompt, index) => {
      let weight = 1.0 / (index + 1) // Decay by rank
      
      // Boost weights for specific types
      if (prompt.type === 'company' && context.companyName) weight *= 1.5
      if (prompt.type === 'relationship' && context.relationshipType) weight *= 1.3
      if (prompt.type === 'specialized' && prompt.context_tags.includes(coachType)) weight *= 1.2
      
      return weight
    })
    
    // Blend top prompts
    return this.blendPrompts(
      searchResults.map(p => p.id),
      weights,
      {
        coachType,
        userName: context.userId || 'User',
        ...context
      }
    )
  }

  /**
   * Update prompt effectiveness based on user feedback
   */
  async updatePromptEffectiveness(
    promptId: string,
    feedback: 'positive' | 'negative' | 'neutral'
  ) {
    const prompt = this.prompts.get(promptId)
    if (!prompt) return
    
    const currentScore = prompt.metadata?.effectiveness_score || 0.8
    const delta = feedback === 'positive' ? 0.05 : feedback === 'negative' ? -0.05 : 0
    const newScore = Math.max(0, Math.min(1, currentScore + delta))
    
    prompt.metadata = {
      ...prompt.metadata,
      effectiveness_score: newScore,
      usage_count: (prompt.metadata?.usage_count || 0) + 1
    }
    
    await sql`
      UPDATE coaching_prompts
      SET 
        effectiveness_score = ${newScore},
        usage_count = usage_count + 1,
        updated_at = NOW()
      WHERE id = ${promptId}
    `
  }

  /**
   * Add new prompt to the system
   */
  async addPrompt(
    prompt: Omit<PromptDefinition, 'id' | 'embedding'>,
    author?: string
  ): Promise<string> {
    const id = this.generatePromptId(prompt.name)
    const embedding = await this.generateEmbedding(
      `${prompt.name} ${prompt.content} ${prompt.context_tags.join(' ')}`
    )
    
    const fullPrompt: PromptDefinition = {
      ...prompt,
      id,
      embedding,
      metadata: {
        ...prompt.metadata,
        author: author || 'user',
        created_at: new Date().toISOString(),
        effectiveness_score: 0.8,
        usage_count: 0
      }
    }
    
    this.prompts.set(id, fullPrompt)
    this.embeddings.set(id, embedding)
    
    await this.savePromptToDatabase(fullPrompt)
    
    return id
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)
    
    if (normA === 0 || normB === 0) return 0
    
    return dotProduct / (normA * normB)
  }

  /**
   * Generate unique prompt ID
   */
  private generatePromptId(name: string): string {
    return `prompt_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
  }

  /**
   * Export prompts for backup or sharing
   */
  async exportPrompts(): Promise<PromptDefinition[]> {
    return Array.from(this.prompts.values())
  }

  /**
   * Import prompts from backup
   */
  async importPrompts(prompts: PromptDefinition[]): Promise<void> {
    for (const prompt of prompts) {
      // Re-generate embeddings to ensure consistency
      const embedding = await this.generateEmbedding(
        `${prompt.name} ${prompt.content} ${prompt.context_tags.join(' ')}`
      )
      
      prompt.embedding = embedding
      this.prompts.set(prompt.id, prompt)
      this.embeddings.set(prompt.id, embedding)
      
      await this.savePromptToDatabase(prompt)
    }
  }
}

export const promptRouter = new VectorizedPromptRouter()